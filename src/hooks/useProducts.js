'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useProducts() {
  const [products, setProducts] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const fetchProducts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*');

      if (error) throw error;

      if (data) {
        // Sort: products with images first, products without images last
        const isActualImage = (img) => {
          if (!img || typeof img !== 'string') return false;
          const trimmed = img.trim();
          if (trimmed === '') return false;
          if (trimmed === '/PRODUCTS%20/Neat/neat-all-purpose-floral-2l.png') return false;
          return true;
        };

        const sorted = [...data].sort((a, b) => {
          const aHasImage = isActualImage(a.image);
          const bHasImage = isActualImage(b.image);
          if (aHasImage && !bHasImage) return -1;
          if (!aHasImage && bHasImage) return 1;
          return 0;
        });

        setProducts(sorted);
      }
    } catch (error) {
      console.error("Error fetching products from Supabase:", error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProducts();

    // Set up real-time listener for updates
    const channel = supabase
      .channel('public-products-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        () => {
          fetchProducts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchProducts]);

  const addProduct = async (product) => {
    try {
      // eslint-disable-next-line no-unused-vars
      const { id: _, ...productData } = product;
      const { error } = await supabase
        .from('products')
        .insert([productData]);
      if (error) throw error;
    } catch (error) {
      console.error("Error adding product: ", error);
    }
  };

  const updateProduct = async (updatedProduct) => {
    try {
      const { id, ...productData } = updatedProduct;
      const { error } = await supabase
        .from('products')
        .update(productData)
        .eq('id', id);
      if (error) throw error;
    } catch (error) {
      console.error("Error updating product: ", error);
    }
  };

  const deleteProduct = async (id) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);
      if (error) throw error;
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
