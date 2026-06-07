'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const ProductCard = ({ product, onAddToCart, onViewDetails }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [selectedSizeIndex] = useState(0); // Keeping state for future use if needed
  const [quantity, setQuantity] = useState(1);
  const router = useRouter();
  
  let currentSize = product.sizes[selectedSizeIndex] || product.sizes[0];
  
  // Extract size from product name if possible (e.g., 4LT, 500ml) since the size selector is disabled
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

  return (
    <>
      <div 
        className="product-card"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          transition: 'all 0.2s ease-in-out',
          boxShadow: isHovered ? '0 4px 12px rgba(0,0,0,0.1)' : 'none',
          background: 'white',
          borderRadius: '4px',
          overflow: 'hidden',
          border: isHovered ? '1px solid #9ca3af' : '1px solid #e5e7eb',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          position: 'relative'
        }}
      >
        {/* Dynamic Availability Badge (Retail Tag) */}
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          background: product.availability === 'In Stock' 
            ? '#ef4444' 
            : product.availability === 'Direct Manufacture'
              ? '#f59e0b'
              : '#3b82f6',
          color: 'white',
          padding: '4px 8px',
          borderRadius: '2px',
          fontSize: '0.65rem',
          fontWeight: 700,
          zIndex: 5,
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          {product.availability}
        </div>

        {/* Product Image Section */}
        <div 
          className="product-image" 
          onClick={() => {
            if (onViewDetails) onViewDetails(product);
            else router.push(`/products/${slug}`);
          }}
          style={{ 
            position: 'relative', 
            backgroundColor: 'white',
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
              transform: isHovered ? 'scale(1.05)' : 'scale(1)',
              width: '100%',
              height: '100%',
              objectFit: 'contain'
            }} 
          />
        </div>

        {/* Product Info Section */}
        <div className="product-info" style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0' }}>
            <span className="product-brand" style={{ fontSize: '0.7rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>
              {product.brand}
            </span>
          </div>
          
          {/* Clickable Title */}
          <h3 
            className="product-name" 
            onClick={() => {
              if (onViewDetails) onViewDetails(product);
              else router.push(`/products/${slug}`);
            }}
            style={{ 
              fontSize: '1rem', 
              marginBottom: '0.4rem', 
              color: '#111827', 
              fontWeight: 700, 
              lineHeight: 1.25, 
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
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ef4444', letterSpacing: '-0.5px' }}>
              GH₵ {currentSize?.price?.toLocaleString('en-US')}
            </div>
            {currentSize?.price < (currentSize?.price * 1.2) && (
              <div style={{ fontSize: '0.85rem', color: '#9ca3af', textDecoration: 'line-through' }}>
                GH₵ {(currentSize?.price * 1.2).toLocaleString('en-US', {maximumFractionDigits:0})}
              </div>
            )}
          </div>

          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            
            {/* Size Selector 
            {product.sizes && product.sizes.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#4b5563', textTransform: 'uppercase' }}>Select Size</label>
                <select 
                  value={selectedSizeIndex}
                  onChange={(e) => setSelectedSizeIndex(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '4px',
                    border: '1px solid #d1d5db',
                    fontSize: '0.85rem',
                    color: '#111827',
                    fontWeight: 600,
                    outline: 'none',
                    cursor: 'pointer',
                    background: '#f9fafb'
                  }}
                >
                  {product.sizes.map((sz, idx) => (
                    <option key={idx} value={idx}>
                      {sz.size} {sz.qtyInBox > 1 ? `(${sz.qtyInBox} pcs/box)` : ''} - GH₵ {sz.price}
                    </option>
                  ))}
                </select>
              </div>
            )}
            */}

            {/* Quantity Selector */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#4b5563', textTransform: 'uppercase' }}>Quantity</label>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                border: '1px solid #d1d5db', 
                borderRadius: '4px',
                overflow: 'hidden',
                background: 'white'
              }}>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleQuantityChange(-1); }}
                  style={{ width: '36px', height: '36px', background: '#f3f4f6', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#4b5563', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  -
                </button>
                <input 
                  type="number"
                  value={quantity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (val > 0) setQuantity(val);
                  }}
                  onClick={e => e.stopPropagation()}
                  style={{ width: '40px', height: '36px', border: 'none', textAlign: 'center', fontSize: '0.9rem', fontWeight: 700, outline: 'none', MozAppearance: 'textfield' }}
                />
                <button 
                  onClick={(e) => { e.stopPropagation(); handleQuantityChange(1); }}
                  style={{ width: '36px', height: '36px', background: '#f3f4f6', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#4b5563', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  +
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Prominent Add to Cart Button */}
        <div style={{ padding: '0 0.75rem 0.75rem' }}>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onAddToCart(product, currentSize, quantity);
              // Reset quantity after adding
              setQuantity(1);
            }}
            style={{
              width: '100%',
              background: isHovered ? '#15803d' : '#16a34a', // Bright Green to drive sales
              color: 'white',
              border: 'none',
              padding: '8px 0',
              borderRadius: '4px',
              fontWeight: 800,
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'background 0.2s ease',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            🛒 Add to Cart
          </button>
        </div>
      </div>
    </>
  );
};

export default ProductCard;

