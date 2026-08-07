'use client';

import { useState, useEffect } from 'react';
import { db, collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot } from '../lib/firebase';

export function useProducts() {
  const [products, setProducts] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const productsRef = collection(db, 'products');
    const unsubscribe = onSnapshot(productsRef, (snapshot) => {
      const docs = snapshot.docs.map(docSnapshot => {
        return {
          id: docSnapshot.id,
          ...docSnapshot.data()
        };
      });

      // Sort: products with images first, products without images last
      const isActualImage = (img) => {
        if (!img || typeof img !== 'string') return false;
        const trimmed = img.trim();
        if (trimmed === '') return false;
        if (trimmed === '/PRODUCTS/Neat/all-neat-all-purpose-cleaner-floral-2l.png') return false;
        return true;
      };

      const sorted = [...docs].sort((a, b) => {
        const aHasImage = isActualImage(a.image);
        const bHasImage = isActualImage(b.image);
        if (aHasImage && !bHasImage) return -1;
        if (!aHasImage && bHasImage) return 1;
        return 0;
      });

      setProducts(sorted);
      setIsLoaded(true);
    }, (error) => {
      console.error("Error listening to products:", error);
      setIsLoaded(true);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const addProduct = async (product) => {
    try {
      const productsRef = collection(db, 'products');
      // eslint-disable-next-line no-unused-vars
      const { id: _, ...productData } = product;
      await addDoc(productsRef, productData);
    } catch (error) {
      console.error("Error adding product: ", error);
    }
  };

  const updateProduct = async (updatedProduct) => {
    try {
      const { id, ...productData } = updatedProduct;
      const productRef = doc(db, 'products', id);
      await updateDoc(productRef, productData);
    } catch (error) {
      console.error("Error updating product: ", error);
    }
  };

  const deleteProduct = async (id) => {
    try {
      const productRef = doc(db, 'products', id);
      await deleteDoc(productRef);
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
