'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export function useProducts(initialProducts = []) {
  const [sheetProducts, setSheetProducts] = useState(initialProducts);
  const [firestoreProducts, setFirestoreProducts] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // If initialProducts is empty, fetch them from Google Sheets on the client side
  useEffect(() => {
    if (sheetProducts && sheetProducts.length > 0) return;

    const fetchSheetProducts = async () => {
      try {
        const Papa = (await import('papaparse')).default;
        const sheetUrl = 'https://docs.google.com/spreadsheets/d/1pHzmSNsXpPdrJcGQ5kI4ZNsAaUNVeXt6knle7C_sNG0/export?format=csv&gid=1847675030';
        const response = await fetch(sheetUrl);
        const csvText = await response.text();
        const results = Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
        });

        const fetched = [];
        for (const row of results.data) {
          if (!row.Name) continue;
          fetched.push({
            id: `sheet_${row.Name}_${row.Size}`,
            slug: row.Name.replace(/\s+/g, '-').toLowerCase(),
            name: row.Name,
            brand: row.Brand || 'Neat Product',
            type: row.Type?.toLowerCase() === 'industrial' ? 'industrial' : 'retail',
            category: row.Category || 'General',
            description: row.Description || '',
            image: row.Image || '/PRODUCTS%20/Neat/neat-all-purpose-floral-2l.png',
            sizes: [
              {
                size: row.Size || '1L',
                price: parseFloat(row.Price) || 0,
                qtyInBox: parseInt(row.QtyInBox) || 1
              }
            ]
          });
        }
        setSheetProducts(fetched);
      } catch (error) {
        console.error("Failed to fetch initial products from client side:", error);
      }
    };

    fetchSheetProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sheetProducts?.length]);

  // Deduplicate products dynamically by Name so Firestore uploads override seed data cleanly!
  const products = [
    ...firestoreProducts,
    ...sheetProducts.filter(
      sp => !firestoreProducts.some(fp => fp.name?.toLowerCase().trim() === sp.name?.toLowerCase().trim())
    )
  ];

  useEffect(() => {

    // 2. Reference to the 'products' collection in Firestore
    const productsRef = collection(db, 'products');

    // Real-time listener for products
    const unsubscribe = onSnapshot(productsRef, async (snapshot) => {
      if (!snapshot.empty) {
        const loadedProducts = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id,
          source: 'firestore'
        }));
        setFirestoreProducts(loadedProducts);
      } else {
        setFirestoreProducts([]);
      }
      setIsLoaded(true);
    }, (error) => {
      console.error("Error fetching products from Firestore:", error);
      setIsLoaded(true);
    });

    return () => unsubscribe();
  }, []);

  const addProduct = async (product) => {
    try {
      const productsRef = collection(db, 'products');
      // Remove any existing id so Firestore generates a new unique one
      // eslint-disable-next-line no-unused-vars
      const { id, ...productData } = product;
      await addDoc(productsRef, productData);
    } catch (error) {
      console.error("Error adding product: ", error);
    }
  };

  const updateProduct = async (updatedProduct) => {
    try {
      const docRef = doc(db, 'products', updatedProduct.id.toString());
      await updateDoc(docRef, updatedProduct);
    } catch (error) {
      console.error("Error updating product: ", error);
    }
  };

  const deleteProduct = async (id) => {
    try {
      const docRef = doc(db, 'products', id.toString());
      await deleteDoc(docRef);
    } catch (error) {
      console.error("Error deleting product: ", error);
    }
  };

  return {
    products,
    isLoaded,
    addProduct,
    updateProduct,
    deleteProduct
  };
}
