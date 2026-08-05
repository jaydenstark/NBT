'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const ProductCard = ({ product, onAddToCart, onViewDetails }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [selectedSizeIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const router = useRouter();
  
  let currentSize = product.sizes[selectedSizeIndex] || product.sizes[0];
  
  const sizeMatch = product.name.match(/(\d+(?:\.\d+)?\s*(?:ml|l|lt|g|kg|liter|liters))/i);
  if (sizeMatch && currentSize) {
    currentSize = { ...currentSize, size: sizeMatch[0].toUpperCase() };
  }

  const slug = product.slug || product.name?.replace(/\s+/g, '-').toLowerCase();

  const handleQuantityChange = (delta) => {
    setQuantity(prev => {
      const next = prev + delta;
      if (next < 1) return 1;
      return next;
    });
  };

  // Neutral availability indicator — no color coding
  const availDot = {
    'In Stock': '#22c55e',
    'Direct Manufacture': '#94a3b8',
    'Bulk Solutions': '#94a3b8',
  }[product.availability] || '#94a3b8';

  return (
    <>
      <div 
        className="product-card"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          transition: 'all 0.18s ease',
          boxShadow: isHovered ? '0 6px 20px rgba(10,34,64,0.08)' : '0 1px 3px rgba(10,34,64,0.04)',
          background: 'white',
          borderRadius: '6px',
          overflow: 'hidden',
          border: isHovered ? '1px solid #cbd5e1' : '1px solid #e5e7eb',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          position: 'relative'
        }}
      >
        {/* Minimal Availability Badge — no colored backgrounds */}
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          background: 'rgba(248,250,252,0.95)',
          color: '#4b5563',
          border: '1px solid #e5e7eb',
          padding: '3px 9px',
          borderRadius: '20px',
          fontSize: '0.62rem',
          fontWeight: 600,
          zIndex: 5,
          letterSpacing: '0.3px',
          display: 'flex',
          alignItems: 'center',
          gap: '5px'
        }}>
          <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: availDot, display: 'inline-block', flexShrink: 0 }} />
          {product.availability}
        </div>

        {/* Product Image */}
        <div 
          className="product-image" 
          onClick={() => {
            if (onViewDetails) onViewDetails(product);
            else router.push(`/products/${slug}`);
          }}
          style={{ 
            position: 'relative', 
            backgroundColor: '#f9fafb',
            padding: '0.75rem',
            height: '170px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottom: '1px solid #f3f4f6',
            cursor: 'pointer'
          }}
        >
          <img 
            src={product.image} 
            alt={product.name} 
            style={{ 
              transition: 'transform 0.3s ease',
              transform: isHovered ? 'scale(1.04)' : 'scale(1)',
              width: '100%',
              height: '100%',
              objectFit: 'contain'
            }} 
          />
        </div>

        {/* Product Info */}
        <div className="product-info" style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0' }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {product.brand}
            </span>
          </div>
          
          {/* Clickable Title */}
          <h3 
            onClick={() => {
              if (onViewDetails) onViewDetails(product);
              else router.push(`/products/${slug}`);
            }}
            style={{ 
              fontSize: '0.95rem', 
              marginBottom: '0.4rem', 
              color: '#111827', 
              fontWeight: 700, 
              lineHeight: 1.3, 
              minHeight: '2.5rem', 
              display: '-webkit-box', 
              WebkitLineClamp: 2, 
              WebkitBoxOrient: 'vertical', 
              overflow: 'hidden',
              cursor: 'pointer'
            }}
          >
            {product.name}
          </h3>

          {/* Pricing Row */}
          <div style={{ marginTop: '0.2rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0A2240', letterSpacing: '-0.5px' }}>
              GH₵ {currentSize?.price?.toLocaleString('en-US')}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#d1d5db', textDecoration: 'line-through' }}>
              GH₵ {(currentSize?.price * 1.2).toLocaleString('en-US', {maximumFractionDigits:0})}
            </div>
          </div>

          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {/* Quantity Selector */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.65rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Quantity</label>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                border: '1px solid #e5e7eb', 
                borderRadius: '4px',
                overflow: 'hidden',
                background: 'white'
              }}>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleQuantityChange(-1); }}
                  style={{ width: '34px', height: '34px', background: '#f9fafb', border: 'none', cursor: 'pointer', fontSize: '1rem', color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}
                >
                  −
                </button>
                <input 
                  type="number"
                  value={quantity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (val > 0) setQuantity(val);
                  }}
                  onClick={e => e.stopPropagation()}
                  style={{ width: '40px', height: '34px', border: 'none', textAlign: 'center', fontSize: '0.9rem', fontWeight: 700, outline: 'none', MozAppearance: 'textfield', color: '#111827' }}
                />
                <button 
                  onClick={(e) => { e.stopPropagation(); handleQuantityChange(1); }}
                  style={{ width: '34px', height: '34px', background: '#f9fafb', border: 'none', cursor: 'pointer', fontSize: '1rem', color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Add to Cart Button */}
        <div style={{ padding: '0 0.75rem 0.75rem' }}>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onAddToCart(product, currentSize, quantity);
              setQuantity(1);
            }}
            style={{
              width: '100%',
              background: isHovered ? '#0A2240' : '#156D6B',
              color: 'white',
              border: 'none',
              padding: '9px 0',
              borderRadius: '4px',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'background 0.2s ease',
              letterSpacing: '0.3px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            Add to Cart
          </button>
        </div>
      </div>
    </>
  );
};

export default ProductCard;
