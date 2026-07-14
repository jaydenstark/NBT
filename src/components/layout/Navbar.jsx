'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useProducts } from '../../hooks/useProducts';
import { useAuthUser } from '../../hooks/useAuthUser';

const Navbar = ({ cartCount, onCartClick }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { products } = useProducts();
  const { user } = useAuthUser();

  // Click-outside listener to keep popups on screen until clicked outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      // 1. Products Navigation Dropdown
      const isInsideDropdown = e.target.closest('.nav-dropdown-trigger') || e.target.closest('.nav-dropdown-menu');
      if (!isInsideDropdown) {
        setIsDropdownOpen(false);
      }

      // 2. Search Suggestions Dropdown (Desktop & Mobile)
      const isInsideSearch = e.target.closest('.search-form-container');
      if (!isInsideSearch) {
        setShowSuggestions(false);
      }
    };

    window.addEventListener('click', handleOutsideClick);
    return () => {
      window.removeEventListener('click', handleOutsideClick);
    };
  }, []);

  const suggestions = searchQuery.trim().length > 0
    ? products.filter(p => p.name?.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 5)
    : [];

  const getLinkStyle = (path, isSpecial = false) => {
    const active = path === '/' ? pathname === '/' : pathname?.startsWith(path);
    return {
      color: active ? 'var(--primary)' : (isSpecial ? 'var(--primary)' : 'var(--text-primary)'),
      textDecoration: 'none',
      transition: 'all 0.25s ease',
      fontWeight: active || isSpecial ? 600 : 500,
      fontSize: '0.95rem',
      borderBottom: active ? '2px solid var(--primary)' : '2px solid transparent',
      padding: '6px 0',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      cursor: 'pointer'
    };
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <>
      {/* 1. TOP INFO BAR */}
      <div style={{
        background: 'var(--primary)',
        color: 'white',
        padding: '8px 0',
        fontSize: '0.82rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        fontFamily: 'Inter, sans-serif',
        zIndex: 1001,
        position: 'relative'
      }}>
        <div className="container" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
            <a href="tel:0246272115" style={{ color: 'rgba(255,255,255,0.9)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px', transition: 'color 0.2s', fontWeight: 500 }} onMouseOver={e => e.currentTarget.style.color = 'var(--secondary)'} onMouseOut={e => e.currentTarget.style.color = 'rgba(255,255,255,0.9)'}>
              ☎️ Call: 0246272115
            </a>
            <a href="https://wa.me/233246272115" target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,0.9)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px', transition: 'color 0.2s', fontWeight: 500 }} onMouseOver={e => e.currentTarget.style.color = '#25D366'} onMouseOut={e => e.currentTarget.style.color = 'rgba(255,255,255,0.9)'}>
              💬 WhatsApp: +233 24 627 2115
            </a>
            <a href="mailto:info@neatbrandtrade.com" style={{ color: 'rgba(255,255,255,0.9)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px', transition: 'color 0.2s', fontWeight: 500 }} onMouseOver={e => e.currentTarget.style.color = 'var(--secondary)'} onMouseOut={e => e.currentTarget.style.color = 'rgba(255,255,255,0.9)'}>
              ✉️ Email: info@neatbrandtrade.com
            </a>
          </div>
          <div style={{ fontWeight: 600, color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
            🚚 <span style={{ color: 'white' }}>Delivery:</span> Free delivery on bulk orders across Ghana!
          </div>
        </div>
      </div>

      {/* 2. NAVIGATION */}
      <nav className="glass" style={{ position: 'sticky', top: 0, zIndex: 1000, padding: '0.6rem 0', background: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border)' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          
          {/* Logo */}
          <div className="logo" style={{ display: 'flex', alignItems: 'center' }}>
            <Link href="/" style={{ display: 'block' }}>
              <img 
                src="/NBT Logo_.png" 
                alt="Neat Brand Trade Logo" 
                style={{ height: '52px', width: 'auto', display: 'block', transition: 'transform 0.3s ease' }} 
                onMouseOver={e => e.currentTarget.style.transform = 'scale(1.03)'}
                onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
              />
            </Link>
          </div>
          
          {/* Navigation Links (Desktop) */}
          <div className="nav-links mobile-hide" style={{ display: 'flex', gap: '1.75rem', alignItems: 'center' }}>
            <Link href="/" style={getLinkStyle('/')}>Home</Link>
            
            {/* Products Dropdown */}
            <div 
              style={{ position: 'relative', cursor: 'pointer' }}
              onMouseEnter={() => setIsDropdownOpen(true)}
            >
              <span 
                style={getLinkStyle('/products')} 
                className="nav-dropdown-trigger"
                onClick={(e) => {
                  e.preventDefault();
                  setIsDropdownOpen(!isDropdownOpen);
                }}
              >
                Products <span style={{ fontSize: '0.80rem' }}>▼</span>
              </span>
              
              {isDropdownOpen && (
                <div 
                  className="nav-dropdown-menu"
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    background: 'white',
                    minWidth: '240px',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
                    padding: '0.75rem 0',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    border: '1px solid #f1f5f9',
                    zIndex: 1001,
                    marginTop: '0.5rem',
                    animation: 'slideUp 0.2s ease-out'
                  }}
                >
                  <Link href="/products" style={dropdownItemStyle}>🔍 View All Products</Link>
                  <div style={{ height: '1px', background: '#f1f5f9', margin: '4px 0' }} />
                  <Link href="/products?category=industrial cleaners" style={dropdownItemStyle}>🧪 Industrial Cleaners</Link>
                  <Link href="/products?category=household cleaners" style={dropdownItemStyle}>🏠 Household Cleaners</Link>
                  <Link href="/products?category=hygiene products" style={dropdownItemStyle}>✨ Hygiene Products</Link>
                  <Link href="/disinfectants-ghana" style={dropdownItemStyle}>🛡️ Disinfectants</Link>
                  <Link href="/products?category=bulk solutions" style={dropdownItemStyle}>📦 Bulk Solutions</Link>
                </div>
              )}
            </div>
            
            <Link href="/industries" style={getLinkStyle('/industries')}>Industries Served</Link>
            <Link href="/bulk-orders" style={getLinkStyle('/bulk-orders', true)}>Bulk Orders</Link>
            <Link href="/about" style={getLinkStyle('/about')}>About</Link>
            <Link href="/blog" style={getLinkStyle('/blog')}>Blog</Link>
            <Link href="/contact" style={getLinkStyle('/contact')}>Contact</Link>
          </div>

          {/* Action Buttons & Inline Search */}
          <div className="nav-actions" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            
            <form 
              onSubmit={handleSearchSubmit} 
              className="mobile-hide search-form-container" 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                position: 'relative', 
                background: '#f1f5f9', 
                borderRadius: '20px', 
                padding: '6px 12px', 
                width: '180px', 
                transition: 'all 0.3s ease',
                border: '1px solid transparent',
                zIndex: 5000
              }}
              onFocusCapture={e => {
                e.currentTarget.style.width = '240px';
                e.currentTarget.style.borderColor = 'var(--secondary)';
                e.currentTarget.style.background = 'white';
                setShowSuggestions(true);
              }}
              onBlurCapture={e => {
                e.currentTarget.style.width = '180px';
                e.currentTarget.style.borderColor = 'transparent';
                e.currentTarget.style.background = '#f1f5f9';
              }}
            >
              <input 
                type="text" 
                placeholder="Search products..." 
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: '0.85rem', width: '100%', color: 'var(--text-main)' }}
              />
              <button type="submit" style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                🔍
              </button>

              {showSuggestions && suggestions.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  width: '240px',
                  background: 'white',
                  borderRadius: '12px',
                  boxShadow: '0 10px 30px rgba(11, 35, 57, 0.15)',
                  border: '1px solid #e2e8f0',
                  zIndex: 6000,
                  marginTop: '6px',
                  padding: '6px 0',
                  display: 'flex',
                  flexDirection: 'column',
                  animation: 'slideUp 0.15s ease-out'
                }}>
                  {suggestions.map(p => {
                    const productSlug = p.slug || p.name?.replace(/\s+/g, '-').toLowerCase();
                    const defaultSize = p.sizes?.[0];
                    return (
                      <div 
                        key={p.id}
                        onClick={() => {
                          setSearchQuery('');
                          setShowSuggestions(false);
                          router.push(`/products/${productSlug}`);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '10px 14px',
                          cursor: 'pointer',
                          transition: 'background 0.2s',
                          borderBottom: '1px solid #f1f5f9'
                        }}
                        className="search-suggestion-item"
                      >
                        <img 
                          src={p.image} 
                          alt={p.name} 
                          style={{ width: '28px', height: '28px', objectFit: 'contain', background: '#f8fafc', borderRadius: '4px', padding: '2px', border: '1px solid #f1f5f9' }} 
                        />
                        <div style={{ flexGrow: 1, minWidth: 0, textAlign: 'left' }}>
                          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {p.name}
                          </div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--secondary)', fontWeight: 650 }}>
                            {p.category.split(' ')[0]} {defaultSize && `• GH₵ ${defaultSize.price}`}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </form>
            
            {/* Cart Icon */}
            <button 
              onClick={onCartClick}
              style={{ 
                background: 'transparent', 
                border: 'none', 
                cursor: 'pointer', 
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '8px',
                borderRadius: '8px',
                transition: 'background 0.2s'
              }}
              onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'}
              onMouseOut={e => e.currentTarget.style.background = 'transparent'}
            >
              <span style={{ fontSize: '1.35rem' }}>🛒</span>
              {cartCount > 0 && (
                <span style={{ 
                  position: 'absolute', 
                  top: '0px', 
                  right: '0px', 
                  background: 'var(--secondary)', 
                  color: 'white', 
                  borderRadius: '50%', 
                  width: '18px', 
                  height: '18px', 
                  fontSize: '0.65rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  {cartCount}
                </span>
              )}
              <span style={{ fontWeight: 600, fontSize: '0.9rem' }} className="mobile-hide btn-text">Cart</span>
            </button>

            {/* Account Icon */}
            <Link href="/account" className="mobile-hide" style={{ textDecoration: 'none' }}>
              <button className="btn btn-outline" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', borderRadius: '10px' }}>
                👤 <span className="btn-text">Account</span>
              </button>
            </Link>


            {/* Hamburger Menu (Mobile) */}
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
              className="mobile-show" 
              style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', padding: '4px' }}
            >
              {isMobileMenuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: 'white',
            borderBottom: '1px solid var(--border)',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)',
            zIndex: 999
          }} className="mobile-show">
            
            {/* Mobile Search Bar */}
            <form 
              onSubmit={handleSearchSubmit} 
              className="search-form-container"
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                position: 'relative', 
                background: '#f1f5f9', 
                borderRadius: '20px', 
                padding: '8px 16px', 
                width: '100%', 
                border: '1px solid var(--border)',
                zIndex: 5000
              }}
            >
              <input 
                type="text" 
                placeholder="Search catalog..." 
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: '0.9rem', width: '100%', color: 'var(--text-main)' }}
              />
              <button type="submit" style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1rem', color: 'var(--text-muted)' }}>
                🔍
              </button>

              {showSuggestions && suggestions.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: 'white',
                  borderRadius: '12px',
                  boxShadow: '0 10px 30px rgba(11, 35, 57, 0.15)',
                  border: '1px solid #e2e8f0',
                  zIndex: 6000,
                  marginTop: '6px',
                  padding: '6px 0',
                  display: 'flex',
                  flexDirection: 'column',
                  animation: 'slideUp 0.15s ease-out'
                }}>
                  {suggestions.map(p => {
                    const productSlug = p.slug || p.name?.replace(/\s+/g, '-').toLowerCase();
                    const defaultSize = p.sizes?.[0];
                    return (
                      <div 
                        key={p.id}
                        onClick={() => {
                          setSearchQuery('');
                          setIsMobileMenuOpen(false);
                          setShowSuggestions(false);
                          router.push(`/products/${productSlug}`);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '12px 16px',
                          cursor: 'pointer',
                          transition: 'background 0.2s',
                          borderBottom: '1px solid #f1f5f9'
                        }}
                        className="search-suggestion-item"
                      >
                        <img 
                          src={p.image} 
                          alt={p.name} 
                          style={{ width: '32px', height: '32px', objectFit: 'contain', background: '#f8fafc', borderRadius: '6px', padding: '2px', border: '1px solid #f1f5f9' }} 
                        />
                        <div style={{ flexGrow: 1, minWidth: 0, textAlign: 'left' }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {p.name}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--secondary)', fontWeight: 650 }}>
                            {p.category} {defaultSize && `• GH₵ ${defaultSize.price}`}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </form>

            <Link href="/" onClick={() => setIsMobileMenuOpen(false)} style={mobileLinkStyle}>Home</Link>
            <div style={{ height: '1px', background: '#f1f5f9' }} />
            <Link href="/products" onClick={() => setIsMobileMenuOpen(false)} style={mobileLinkStyle}>🔍 All Products</Link>
            <Link href="/products?category=industrial cleaners" onClick={() => setIsMobileMenuOpen(false)} style={{ ...mobileLinkStyle, paddingLeft: '1rem', fontSize: '0.95rem' }}>🧪 Industrial Cleaners</Link>
            <Link href="/products?category=household cleaners" onClick={() => setIsMobileMenuOpen(false)} style={{ ...mobileLinkStyle, paddingLeft: '1rem', fontSize: '0.95rem' }}>🏠 Household Cleaners</Link>
            <Link href="/products?category=hygiene products" onClick={() => setIsMobileMenuOpen(false)} style={{ ...mobileLinkStyle, paddingLeft: '1rem', fontSize: '0.95rem' }}>✨ Hygiene Products</Link>
            <Link href="/disinfectants-ghana" onClick={() => setIsMobileMenuOpen(false)} style={{ ...mobileLinkStyle, paddingLeft: '1rem', fontSize: '0.95rem' }}>🛡️ Disinfectants</Link>
            <Link href="/products?category=bulk solutions" onClick={() => setIsMobileMenuOpen(false)} style={{ ...mobileLinkStyle, paddingLeft: '1rem', fontSize: '0.95rem' }}>📦 Bulk Solutions</Link>
            <div style={{ height: '1px', background: '#f1f5f9' }} />
            <Link href="/industries" onClick={() => setIsMobileMenuOpen(false)} style={mobileLinkStyle}>Industries Served</Link>
            <Link href="/bulk-orders" onClick={() => setIsMobileMenuOpen(false)} style={{ ...mobileLinkStyle, color: 'var(--primary)', fontWeight: 'bold' }}>Bulk Orders</Link>
            <Link href="/about" onClick={() => setIsMobileMenuOpen(false)} style={mobileLinkStyle}>About Us</Link>
            <Link href="/blog" onClick={() => setIsMobileMenuOpen(false)} style={mobileLinkStyle}>Blog & Resources</Link>
            <Link href="/contact" onClick={() => setIsMobileMenuOpen(false)} style={mobileLinkStyle}>Contact</Link>
            <Link href="/account" onClick={() => setIsMobileMenuOpen(false)} style={mobileLinkStyle}>👤 My Account</Link>

          </div>
        )}

        <style>{`
          .search-suggestion-item:hover {
            background-color: rgba(43, 140, 138, 0.06) !important;
          }
          @keyframes slideUp {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .nav-links a:hover, .nav-dropdown-trigger:hover {
            color: var(--primary) !important;
            border-bottom-color: var(--primary) !important;
          }
          .logo a:hover img {
            transform: scale(1.03);
          }

          /* General layout class definitions */
          .mobile-show {
            display: none !important;
          }
          .mobile-hide {
            display: flex !important;
            align-items: center;
          }

          /* Responsive adjustments for mid-sized screens (tablets/laptops 1024px to 1200px) */
          @media (max-width: 1200px) and (min-width: 1025px) {
            .nav-links {
              gap: 0.85rem !important;
            }
            .nav-links a, .nav-dropdown-trigger {
              font-size: 0.88rem !important;
            }
            .nav-actions {
              gap: 0.75rem !important;
            }
            .nav-actions .btn {
              padding: 8px 10px !important;
            }
            .nav-actions .btn-text {
              display: none !important;
            }
          }

          /* Show mobile elements and hide desktop elements below 1024px */
          @media (max-width: 1024px) {
            .mobile-show {
              display: block !important;
            }
            button.mobile-show {
              display: flex !important;
            }
            .mobile-hide {
              display: none !important;
            }
          }
        `}</style>
      </nav>

      {/* 3. MOBILE BOTTOM NAVIGATION BAR */}
      <div className="mobile-bottom-nav">
        <Link href="/" className={`mobile-bottom-nav-item ${pathname === '/' ? 'active' : ''}`}>
          <span className="mobile-bottom-nav-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </span>
          <span className="mobile-bottom-nav-label">Home</span>
        </Link>
        <Link href="/products" className={`mobile-bottom-nav-item ${pathname?.startsWith('/products') ? 'active' : ''}`}>
          <span className="mobile-bottom-nav-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </span>
          <span className="mobile-bottom-nav-label">Products</span>
        </Link>
        <Link href="/account?tab=orders" className={`mobile-bottom-nav-item`}>
          <span className="mobile-bottom-nav-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </span>
          <span className="mobile-bottom-nav-label">Orders</span>
        </Link>
        <Link href="/account" className={`mobile-bottom-nav-item ${pathname === '/account' ? 'active' : ''}`}>
          <span className="mobile-bottom-nav-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ overflow: 'visible' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              {user && (
                <>
                  <circle cx="20" cy="20" r="6" fill="#10B981" stroke="#fff" strokeWidth="2" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 20.5l1.5 1.5 2.5-3" stroke="#fff" strokeWidth={2} />
                </>
              )}
            </svg>
          </span>
          <span className="mobile-bottom-nav-label">Account</span>
        </Link>
      </div>
    </>
  );
};

const dropdownItemStyle = {
  padding: '8px 20px',
  color: 'var(--text-primary)',
  textDecoration: 'none',
  fontSize: '0.95rem',
  transition: 'background 0.2s, color 0.2s',
  display: 'block',
  cursor: 'pointer'
};

const mobileLinkStyle = {
  color: 'var(--text-primary)',
  textDecoration: 'none',
  fontSize: '1.05rem',
  fontWeight: '500',
  display: 'block',
  padding: '12px 4px',
  transition: 'background-color 0.2s ease, padding-left 0.2s ease'
};

export default Navbar;
