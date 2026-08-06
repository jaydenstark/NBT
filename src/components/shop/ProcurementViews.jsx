'use client';

import { useState, useMemo } from 'react';

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
  const [quantities, setQuantities] = useState({});

  const handleQtyChange = (variantId, val) => {
    const parsed = parseInt(val);
    setQuantities(prev => ({
      ...prev,
      [variantId]: isNaN(parsed) || parsed < 1 ? 1 : parsed
    }));
  };

  // Flatten products into unique variants
  const variants = useMemo(() => {
    const list = [];
    products.forEach(p => {
      if (p.sizes && Array.isArray(p.sizes)) {
        p.sizes.forEach(s => {
          const variantId = `${p.id}_${s.size}`;
          list.push({
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
    return list;
  }, [products]);

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.8)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderRadius: '20px',
      border: '1px solid rgba(226, 232, 240, 0.8)',
      boxShadow: '0 20px 25px -5px rgba(11, 35, 57, 0.05), 0 10px 10px -5px rgba(11, 35, 57, 0.02)',
      overflow: 'hidden',
      marginTop: '24px'
    }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '0.92rem',
          textAlign: 'left'
        }}>
          <thead>
            <tr style={{
              background: 'linear-gradient(90deg, #f8fafc 0%, #f1f5f9 100%)',
              borderBottom: '2px solid rgba(226, 232, 240, 0.8)',
              color: 'var(--primary)',
              fontWeight: 800
            }}>
              <th style={{ padding: '18px 24px' }}>Product</th>
              <th style={{ padding: '18px 24px' }}>Pack Size</th>
              <th style={{ padding: '18px 24px' }}>SKU Code</th>
              <th style={{ padding: '18px 24px' }}>Unit Price</th>
              <th style={{ padding: '18px 24px' }}>Availability</th>
              <th style={{ padding: '18px 24px', width: '130px' }}>Quantity</th>
              <th style={{ padding: '18px 24px', width: '110px', textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {variants.map(v => {
              const qty = quantities[v.id] || 1;
              const isOutOfStock = v.availability === 'Out of Stock' || v.availability === 'Temporarily Unavailable';
              const badgeStyle = getAvailabilityBadgeStyle(v.availability);
              
              return (
                <tr key={v.id} style={{
                  borderBottom: '1px solid #f1f5f9',
                  transition: 'background 0.25s ease'
                }} className="procurement-row">
                  {/* Product Details */}
                  <td style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      background: 'white',
                      borderRadius: '12px',
                      border: '1px solid #eceff1',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                      transition: 'transform 0.2s ease'
                    }} className="img-container">
                      <img 
                        src={v.image} 
                        alt={v.name} 
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--primary)', lineHeight: 1.2 }}>{v.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--secondary)', fontWeight: 700, marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{v.brand}</div>
                    </div>
                  </td>
                  
                  {/* Pack Size */}
                  <td style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--text-main)' }}>
                    {v.size.size} {v.size.qtyInBox > 1 ? `(${v.size.qtyInBox} pcs/box)` : ''}
                  </td>
                  
                  {/* SKU */}
                  <td style={{ padding: '16px 24px', fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {v.sku}
                  </td>
                  
                  {/* Unit Price */}
                  <td style={{ padding: '16px 24px', fontWeight: 800, color: 'var(--primary)' }}>
                    GH₵ {v.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  
                  {/* Availability */}
                  <td style={{ padding: '16px 24px' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      padding: '6px 12px',
                      borderRadius: '30px',
                      background: badgeStyle.bg,
                      color: badgeStyle.color
                    }}>
                      <span style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: badgeStyle.indicator
                      }}></span>
                      {v.availability}
                    </span>
                  </td>
                  
                  {/* Quantity Input */}
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      border: '1.5px solid #e2e8f0', 
                      borderRadius: '8px', 
                      overflow: 'hidden',
                      background: 'white',
                      boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)'
                    }}>
                      <button 
                        onClick={() => handleQtyChange(v.id, qty - 1)}
                        disabled={isOutOfStock}
                        type="button"
                        style={{ border: 'none', background: '#f8fafc', width: '32px', height: '32px', cursor: 'pointer', fontWeight: 800, fontSize: '1rem', color: 'var(--text-muted)' }}
                      >-</button>
                      <input 
                        type="number" 
                        min="1"
                        value={qty}
                        disabled={isOutOfStock}
                        onChange={(e) => handleQtyChange(v.id, e.target.value)}
                        style={{ border: 'none', width: '42px', height: '32px', textAlign: 'center', fontWeight: 800, color: 'var(--primary)', outline: 'none', MozAppearance: 'textfield' }}
                      />
                      <button 
                        onClick={() => handleQtyChange(v.id, qty + 1)}
                        disabled={isOutOfStock}
                        type="button"
                        style={{ border: 'none', background: '#f8fafc', width: '32px', height: '32px', cursor: 'pointer', fontWeight: 800, fontSize: '1rem', color: 'var(--text-muted)' }}
                      >+</button>
                    </div>
                  </td>
                  
                  {/* Action */}
                  <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                    <button
                      onClick={() => {
                        onAddToCart(v.product, v.size, qty);
                        setQuantities(prev => ({ ...prev, [v.id]: 1 })); 
                      }}
                      disabled={isOutOfStock}
                      style={{
                        background: isOutOfStock 
                          ? '#cbd5e1' 
                          : 'linear-gradient(135deg, var(--secondary) 0%, var(--accent) 100%)',
                        color: 'white',
                        border: 'none',
                        padding: '8px 18px',
                        borderRadius: '8px',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: isOutOfStock ? 'none' : '0 4px 10px rgba(43, 140, 138, 0.2)',
                        whiteSpace: 'nowrap'
                      }}
                      className="add-procure-btn"
                    >
                      {isOutOfStock ? 'Sold Out' : 'Add Order'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <style jsx>{`
        .procurement-row:hover {
          background-color: rgba(248, 250, 252, 0.7);
        }
        .procurement-row:hover .img-container {
          transform: scale(1.06);
          border-color: var(--secondary);
        }
        .add-procure-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 14px rgba(43, 140, 138, 0.35);
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
  const variants = useMemo(() => {
    const list = [];
    products.forEach(p => {
      if (p.sizes && Array.isArray(p.sizes)) {
        p.sizes.forEach(s => {
          list.push({
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
    return list;
  }, [products]);

  // Filter based on query
  const suggestions = useMemo(() => {
    const trimmed = queryText.trim().toLowerCase();
    if (trimmed.length < 2) return [];
    return variants.filter(v => 
      v.name.toLowerCase().includes(trimmed) || 
      v.brand.toLowerCase().includes(trimmed) ||
      v.sku.toLowerCase().includes(trimmed)
    ).slice(0, 6);
  }, [queryText, variants]);

  const handleAdd = () => {
    if (!selectedVariant) return;
    onAddToCart(selectedVariant.product, selectedVariant.size, qty);
    
    const newItem = {
      id: Date.now(),
      name: selectedVariant.name,
      size: selectedVariant.size.size,
      qty: qty,
      price: selectedVariant.price
    };
    setRecentAdded(prev => [newItem, ...prev].slice(0, 5));

    setQueryText('');
    setSelectedVariant(null);
    setQty(1);
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(244, 247, 249, 0.8) 100%)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderRadius: '20px',
      border: '1px solid rgba(43, 140, 138, 0.2)',
      boxShadow: '0 20px 25px -5px rgba(43, 140, 138, 0.05)',
      padding: '28px',
      marginTop: '20px',
      position: 'relative'
    }}>
      {/* Decorative Top Accent Line */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: '4px',
        background: 'linear-gradient(90deg, var(--secondary) 0%, var(--accent) 100%)',
        borderTopLeftRadius: '20px',
        borderTopRightRadius: '20px'
      }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
        <span style={{ fontSize: '1.3rem' }}>⚡</span>
        <h3 style={{ fontSize: '1.35rem', color: 'var(--primary)', fontWeight: 800, margin: 0 }}>
          Quick Order Console
        </h3>
      </div>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '22px' }}>
        Type product name, brand, or SKU code. Fill quantities and add directly to your order checklist.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px 140px', gap: '20px', alignItems: 'end', position: 'relative' }} className="quick-order-form-grid">
        {/* Search Box */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative', width: '100%' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Item Search / SKU Lookup</label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
            <input 
              type="text" 
              placeholder="Start typing formulation name or SKU..." 
              value={selectedVariant ? `${selectedVariant.name} (${selectedVariant.size.size})` : queryText}
              onChange={(e) => {
                setQueryText(e.target.value);
                setSelectedVariant(null);
              }}
              style={{
                width: '100%',
                padding: '14px 14px 14px 42px',
                borderRadius: '10px',
                border: '1.5px solid #cbd5e1',
                fontSize: '0.92rem',
                outline: 'none',
                background: 'white',
                fontWeight: 500,
                transition: 'border-color 0.25s'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--secondary)'}
              onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
            />
            {selectedVariant && (
              <button 
                onClick={() => { setSelectedVariant(null); setQueryText(''); }}
                type="button"
                style={{
                  position: 'absolute',
                  right: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'rgba(15, 23, 42, 0.05)',
                  border: 'none',
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1rem',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >×</button>
            )}
          </div>

          {/* Autocomplete suggestions */}
          {suggestions.length > 0 && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              background: 'white',
              borderRadius: '12px',
              boxShadow: '0 12px 30px rgba(11, 35, 57, 0.15)',
              border: '1px solid rgba(226, 232, 240, 0.8)',
              zIndex: 1000,
              marginTop: '8px',
              maxHeight: '260px',
              overflowY: 'auto',
              padding: '6px 0'
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
                    padding: '12px 16px',
                    cursor: 'pointer',
                    borderBottom: '1px solid #f8fafc',
                    transition: 'background 0.2s'
                  }}
                  className="dropdown-item"
                >
                  <img src={v.image} alt={v.name} style={{ width: '36px', height: '36px', objectFit: 'contain', background: '#f8fafc', padding: '2px', borderRadius: '6px' }} />
                  <div style={{ flexGrow: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--primary)' }}>{v.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 650, marginTop: '2px' }}>
                      SKU: {v.sku} <span style={{ color: 'var(--secondary)' }}>• Size: {v.size.size}</span>
                    </div>
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--primary)' }}>
                    GH₵ {v.price}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quantity Field */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Quantity</label>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            border: '1.5px solid #cbd5e1',
            borderRadius: '10px',
            overflow: 'hidden',
            background: selectedVariant ? 'white' : '#f1f5f9'
          }}>
            <button 
              onClick={() => setQty(prev => Math.max(1, prev - 1))}
              disabled={!selectedVariant}
              type="button"
              style={{ width: '38px', height: '44px', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 800, color: 'var(--text-muted)' }}
            >-</button>
            <input 
              type="number" 
              min="1"
              value={qty}
              disabled={!selectedVariant}
              onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
              style={{
                width: '100%',
                height: '44px',
                border: 'none',
                textAlign: 'center',
                fontWeight: 800,
                fontSize: '0.95rem',
                color: 'var(--primary)',
                outline: 'none',
                background: 'transparent',
                MozAppearance: 'textfield'
              }}
            />
            <button 
              onClick={() => setQty(prev => prev + 1)}
              disabled={!selectedVariant}
              type="button"
              style={{ width: '38px', height: '44px', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 800, color: 'var(--text-muted)' }}
            >+</button>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleAdd}
          disabled={!selectedVariant}
          style={{
            background: selectedVariant 
              ? 'linear-gradient(135deg, var(--secondary) 0%, var(--accent) 100%)' 
              : '#cbd5e1',
            color: 'white',
            border: 'none',
            padding: '14.5px 28px',
            borderRadius: '10px',
            fontWeight: 800,
            fontSize: '0.9rem',
            cursor: selectedVariant ? 'pointer' : 'not-allowed',
            transition: 'all 0.25s ease',
            boxShadow: selectedVariant ? '0 10px 15px -3px rgba(43, 140, 138, 0.25)' : 'none',
            whiteSpace: 'nowrap',
            height: '48px'
          }}
          className="quick-order-submit-btn"
        >
          Add to Order
        </button>
      </div>

      {/* Session summary list */}
      {recentAdded.length > 0 && (
        <div style={{ marginTop: '28px', borderTop: '1px solid rgba(43, 140, 138, 0.15)', paddingTop: '20px' }}>
          <h4 style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
            CHECKLIST LOG (Current Session):
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {recentAdded.map(item => (
              <div key={item.id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                background: 'rgba(255, 255, 255, 0.6)',
                padding: '10px 16px',
                borderRadius: '8px',
                fontSize: '0.88rem',
                border: '1px dashed rgba(43, 140, 138, 0.3)',
                alignItems: 'center',
                boxShadow: '0 2px 4px rgba(0,0,0,0.01)'
              }}>
                <span style={{ fontWeight: 700, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: '#10B981' }}>✓</span> Added {item.qty}x {item.name} ({item.size})
                </span>
                <span style={{ fontWeight: 800, color: 'var(--secondary)' }}>
                  Total: GH₵ {(item.qty * item.price).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      <style jsx>{`
        .dropdown-item:hover {
          background-color: #f1f5f9;
        }
        .quick-order-submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 20px -3px rgba(43, 140, 138, 0.4);
        }
      `}</style>
    </div>
  );
}

/**
 * Inline helpers for style tags
 */
function getAvailabilityBadgeStyle(status) {
  switch (status) {
    case 'In Stock':
      return { bg: '#e8f5e9', color: '#2e7d32', indicator: '#2e7d32' };
    case 'Direct Manufacture':
      return { bg: '#fff8e1', color: '#b78103', indicator: '#b78103' };
    case 'Low Stock':
      return { bg: '#fff3e0', color: '#e65100', indicator: '#e65100' };
    default:
      return { bg: '#ffebee', color: '#c62828', indicator: '#c62828' };
  }
}
