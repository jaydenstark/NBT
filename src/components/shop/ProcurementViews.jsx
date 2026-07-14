'use client';

import { useState } from 'react';

/**
 * Helper to generate a clean deterministic SKU for B2B products.
 */
function generateSKU(product, size) {
  const brandCode = product.brand ? product.brand.substring(0, 3).toUpperCase() : 'NBT';
  const nameParts = product.name ? product.name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 8).toUpperCase() : 'PROD';
  const cleanSize = size ? size.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() : 'STD';
  return `NBT-${brandCode}-${nameParts}-${cleanSize}`;
}

/**
 * Compact Procurement View Table
 * Displays products as a flat list of variants (SKUs) for fast volume entry.
 */
export function CompactProcurementView({ products, onAddToCart }) {
  // Store input quantities locally
  const [quantities, setQuantities] = useState({});

  const handleQtyChange = (variantId, val) => {
    const parsed = parseInt(val);
    setQuantities(prev => ({
      ...prev,
      [variantId]: isNaN(parsed) || parsed < 1 ? 1 : parsed
    }));
  };

  // Flatten products into unique variants
  const variants = [];
  products.forEach(p => {
    if (p.sizes && Array.isArray(p.sizes)) {
      p.sizes.forEach(s => {
        const variantId = `${p.id}_${s.size}`;
        variants.push({
          id: variantId,
          product: p,
          size: s,
          name: p.name,
          brand: p.brand,
          sku: s.sku || p.sku || generateSKU(p, s.size),
          price: s.price,
          availability: p.availability || 'In Stock',
          image: p.image
        });
      });
    }
  });

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      border: '1px solid var(--border)',
      boxShadow: 'var(--shadow-sm)',
      overflow: 'hidden',
      marginTop: '20px'
    }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '0.9rem',
          textAlign: 'left'
        }}>
          <thead>
            <tr style={{
              background: '#f8fafc',
              borderBottom: '1px solid var(--border)',
              color: 'var(--text-muted)',
              fontWeight: 700
            }}>
              <th style={{ padding: '16px 20px' }}>Product</th>
              <th style={{ padding: '16px 20px' }}>Pack Size</th>
              <th style={{ padding: '16px 20px' }}>SKU</th>
              <th style={{ padding: '16px 20px' }}>Price</th>
              <th style={{ padding: '16px 20px' }}>Availability</th>
              <th style={{ padding: '16px 20px', width: '120px' }}>Quantity</th>
              <th style={{ padding: '16px 20px', width: '100px', textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {variants.map(v => {
              const qty = quantities[v.id] || 1;
              const isOutOfStock = v.availability === 'Out of Stock' || v.availability === 'Temporarily Unavailable';
              
              return (
                <tr key={v.id} style={{
                  borderBottom: '1px solid var(--border)',
                  transition: 'background 0.2s'
                }} className="hover-row">
                  {/* Product details */}
                  <td style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img 
                      src={v.image} 
                      alt={v.name} 
                      style={{
                        width: '40px',
                        height: '40px',
                        objectFit: 'contain',
                        background: '#f8fafc',
                        borderRadius: '6px',
                        border: '1px solid var(--border)',
                        padding: '2px'
                      }}
                    />
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--primary)' }}>{v.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{v.brand}</div>
                    </div>
                  </td>
                  
                  {/* Pack size */}
                  <td style={{ padding: '14px 20px', fontWeight: 600, color: 'var(--text-main)' }}>
                    {v.size.size} {v.size.qtyInBox > 1 ? `(${v.size.qtyInBox} pcs/box)` : ''}
                  </td>
                  
                  {/* SKU */}
                  <td style={{ padding: '14px 20px', fontFamily: 'monospace', fontSize: '0.82rem', color: '#4b5563' }}>
                    {v.sku}
                  </td>
                  
                  {/* Price */}
                  <td style={{ padding: '14px 20px', fontWeight: 700, color: 'var(--text-main)' }}>
                    GH₵ {v.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  
                  {/* Availability badge */}
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: v.availability === 'In Stock' 
                        ? '#16a34a' 
                        : v.availability === 'Direct Manufacture' || v.availability === 'Low Stock'
                          ? '#d97706'
                          : '#dc2626'
                    }}>
                      <span style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: v.availability === 'In Stock' 
                          ? '#16a34a' 
                          : v.availability === 'Direct Manufacture' || v.availability === 'Low Stock'
                            ? '#d97706'
                            : '#dc2626'
                      }}></span>
                      {v.availability}
                    </span>
                  </td>
                  
                  {/* Quantity input */}
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #d1d5db', borderRadius: '6px', overflow: 'hidden' }}>
                      <button 
                        onClick={() => handleQtyChange(v.id, qty - 1)}
                        disabled={isOutOfStock}
                        style={{ border: 'none', background: '#f3f4f6', width: '28px', height: '30px', cursor: 'pointer', fontWeight: 'bold' }}
                      >-</button>
                      <input 
                        type="number" 
                        min="1"
                        value={qty}
                        disabled={isOutOfStock}
                        onChange={(e) => handleQtyChange(v.id, e.target.value)}
                        style={{ border: 'none', width: '40px', height: '30px', textAlign: 'center', fontWeight: 700, outline: 'none' }}
                      />
                      <button 
                        onClick={() => handleQtyChange(v.id, qty + 1)}
                        disabled={isOutOfStock}
                        style={{ border: 'none', background: '#f3f4f6', width: '28px', height: '30px', cursor: 'pointer', fontWeight: 'bold' }}
                      >+</button>
                    </div>
                  </td>
                  
                  {/* Add button */}
                  <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                    <button
                      onClick={() => {
                        onAddToCart(v.product, v.size, qty);
                        setQuantities(prev => ({ ...prev, [v.id]: 1 })); // Reset
                      }}
                      disabled={isOutOfStock}
                      style={{
                        background: isOutOfStock ? '#d1d5db' : 'var(--secondary)',
                        color: 'white',
                        border: 'none',
                        padding: '6px 14px',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                        transition: 'background 0.2s',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {isOutOfStock ? 'No Stock' : 'Add'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <style jsx>{`
        .hover-row:hover {
          background-color: #f8fafc;
        }
      `}</style>
    </div>
  );
}

/**
 * Dedicated Quick Order Interface
 * Allows rapid lookup and instant addition of multiple products on a single panel.
 */
export function QuickOrderInterface({ products, onAddToCart }) {
  const [queryText, setQueryText] = useState('');
  const [qty, setQty] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [recentAdded, setRecentAdded] = useState([]);

  // Flatten products for lookup
  const variants = [];
  products.forEach(p => {
    if (p.sizes && Array.isArray(p.sizes)) {
      p.sizes.forEach(s => {
        variants.push({
          product: p,
          size: s,
          name: p.name,
          brand: p.brand,
          sku: s.sku || p.sku || generateSKU(p, s.size),
          price: s.price,
          availability: p.availability || 'In Stock',
          image: p.image
        });
      });
    }
  });

  // Filter based on query
  const suggestions = queryText.trim().length >= 2
    ? variants.filter(v => 
        v.name.toLowerCase().includes(queryText.toLowerCase()) || 
        v.brand.toLowerCase().includes(queryText.toLowerCase()) ||
        v.sku.toLowerCase().includes(queryText.toLowerCase())
      ).slice(0, 6)
    : [];

  const handleAdd = () => {
    if (!selectedVariant) return;
    onAddToCart(selectedVariant.product, selectedVariant.size, qty);
    
    // Add to session list to keep current order visible
    const newItem = {
      id: Date.now(),
      name: selectedVariant.name,
      size: selectedVariant.size.size,
      qty: qty,
      price: selectedVariant.price
    };
    setRecentAdded(prev => [newItem, ...prev].slice(0, 5));

    // Reset fields
    setQueryText('');
    setSelectedVariant(null);
    setQty(1);
  };

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      border: '1px solid var(--border)',
      boxShadow: 'var(--shadow-sm)',
      padding: '24px',
      marginTop: '20px'
    }}>
      <h3 style={{ fontSize: '1.25rem', color: 'var(--primary)', fontWeight: 800, marginBottom: '6px' }}>
        ⚡ Quick Order Console
      </h3>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
        Search product name, brand, or SKU, set quantity, and add directly to your order session.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '15px', alignItems: 'end', position: 'relative' }}>
        {/* Search Input Box */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', position: 'relative', width: '100%' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Search Item / SKU</label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
            <input 
              type="text" 
              placeholder="e.g. Bleach 5L..." 
              value={selectedVariant ? `${selectedVariant.name} (${selectedVariant.size.size})` : queryText}
              onChange={(e) => {
                setQueryText(e.target.value);
                setSelectedVariant(null);
              }}
              style={{
                width: '100%',
                padding: '12px 12px 12px 36px',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                fontSize: '0.9rem',
                outline: 'none'
              }}
            />
            {selectedVariant && (
              <button 
                onClick={() => { setSelectedVariant(null); setQueryText(''); }}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  fontSize: '1.1rem',
                  color: 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >×</button>
            )}
          </div>

          {/* Autocomplete Dropdown list */}
          {suggestions.length > 0 && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              background: 'white',
              borderRadius: '8px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
              border: '1px solid var(--border)',
              zIndex: 100,
              marginTop: '6px',
              maxHeight: '240px',
              overflowY: 'auto'
            }}>
              {suggestions.map(v => (
                <div 
                  key={`${v.product.id}_${v.size.size}`}
                  onClick={() => {
                    setSelectedVariant(v);
                    setQueryText('');
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 14px',
                    cursor: 'pointer',
                    borderBottom: '1px solid #f1f5f9',
                    transition: 'background 0.2s'
                  }}
                  className="dropdown-item"
                >
                  <img src={v.image} alt={v.name} style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
                  <div style={{ flexGrow: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--primary)' }}>{v.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--secondary)', fontWeight: 600 }}>
                      SKU: {v.sku} • Size: {v.size.size}
                    </div>
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--primary)' }}>
                    GH₵ {v.price}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quantity field */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100px' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Quantity</label>
          <input 
            type="number" 
            min="1"
            value={qty}
            disabled={!selectedVariant}
            onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
            style={{
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #d1d5db',
              fontSize: '0.9rem',
              textAlign: 'center',
              fontWeight: 700,
              outline: 'none',
              background: selectedVariant ? 'white' : '#f3f4f6'
            }}
          />
        </div>

        {/* Add item button */}
        <button
          onClick={handleAdd}
          disabled={!selectedVariant}
          style={{
            background: selectedVariant ? 'var(--secondary)' : '#d1d5db',
            color: 'white',
            border: 'none',
            padding: '12.5px 24px',
            borderRadius: '8px',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: selectedVariant ? 'pointer' : 'not-allowed',
            transition: 'background 0.2s',
            whiteSpace: 'nowrap'
          }}
        >
          Add to Order
        </button>
      </div>

      {/* Session summary log list */}
      {recentAdded.length > 0 && (
        <div style={{ marginTop: '24px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
          <h4 style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
            Recently Added in this Session:
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {recentAdded.map(item => (
              <div key={item.id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                background: '#f8fafc',
                padding: '8px 14px',
                borderRadius: '6px',
                fontSize: '0.85rem',
                border: '1px dashed #e2e8f0',
                alignItems: 'center'
              }}>
                <span style={{ fontWeight: 650, color: 'var(--primary)' }}>
                  ✅ Added {item.qty}x {item.name} ({item.size})
                </span>
                <span style={{ fontWeight: 700, color: 'var(--text-muted)' }}>
                  Total: GH₵ {(item.qty * item.price).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      <style jsx>{`
        .dropdown-item:hover {
          background-color: #f8fafc;
        }
      `}</style>
    </div>
  );
}
