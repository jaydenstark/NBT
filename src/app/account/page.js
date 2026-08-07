'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '../../components/layout/Navbar';
import Cart from '../../components/shop/Cart';
import FloatingContact from '../../components/layout/FloatingContact';
import { useCart } from '../../hooks/useCart';
import InvoiceModal from '../../components/shop/InvoiceModal';
import { useAuthUser } from '../../hooks/useAuthUser';
import { auth } from '../../lib/firebase';
import { userService } from '../../services/db';

export default function AccountPage() {
  const { cartItems, isCartOpen, setIsCartOpen, addToCart, removeFromCart, clearCart } = useCart();
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState(null);

  // Auth States
  const { user: activeUser, loading: authLoading } = useAuthUser();
  const isLoaded = !authLoading;
  const [authMode, setAuthMode] = useState('login'); // 'register' | 'login'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState('');
  
  // Form inputs
  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('supermarket');
  const [location, setLocation] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');

  // 7-Tab B2B Customer Portal Dashboard State Hooks
  const [activeSubTab, setActiveSubTab] = useState('dashboard');
  const [wishlist, setWishlist] = useState([
    { id: 'w1', name: 'Neat Stark Premium Floral Sanitizer', size: '25L Drum', price: 1200, spec: 'Benzalkonium Chloride (2.0% w/v) Active Matrix', image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=300' },
    { id: 'w2', name: 'Neat Industrial Floor Degreaser', size: 'IBC 1-Ton', price: 8500, spec: 'Heavy Industrial Alkaline (30% Active Matter)', image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=300' }
  ]);

  const [selectedSizes] = useState({
    'sp-1': '25L Drum',
    'sp-2': '25L Drum',
    'sp-3': '25L Drum'
  });
  const [trackedOrderId, setTrackedOrderId] = useState('ORD-9912');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const tab = urlParams.get('tab');
      if (tab) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setActiveSubTab(tab);
      }
    }
  }, []);

  // eslint-disable-next-line no-unused-vars
  const savedProductsList = [
    {
      id: 'sp-1',
      name: 'Deva Softener Premium',
      description: 'High-concentration fabric softening formulation with long-lasting active encapsulated scent matrices.',
      image: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&q=80&w=300',
      pricing: {
        '5L Container': 150,
        '25L Drum': 650,
        '1-Ton IBC Container': 7200
      }
    },
    {
      id: 'sp-2',
      name: 'Neat Bleach Concentrated',
      description: 'Hospital-grade sodium hypochlorite active bleach formulation stabilizer for sanitation and wholesale bottling.',
      image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=300',
      pricing: {
        '5L Container': 120,
        '25L Drum': 520,
        '1-Ton IBC Container': 6000
      }
    },
    {
      id: 'sp-3',
      name: 'Multi-Purpose Cleaner Floral',
      description: 'Super-dilution active surfactant detergent for heavy commercial sanitation and factory floor applications.',
      image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=300',
      pricing: {
        '5L Container': 180,
        '25L Drum': 780,
        '1-Ton IBC Container': 8500
      }
    }
  ];

  const trackingData = {
    'ORD-9842': {
      id: 'ORD-9842',
      carrier: 'NBT Central Logistics Fleet (Truck #A382)',
      status: 'Delivered',
      origin: 'Accra Manufacturing Facility',
      destination: 'Stark Chemical Depot, Accra',
      steps: [
        { title: 'Order Placed', time: 'May 14, 2026 - 08:30 AM', desc: 'Distributor credit approved and manufacturing batch allocated.', status: 'complete' },
        { title: 'Laboratory Prep', time: 'May 14, 2026 - 11:15 AM', desc: 'Active dilution formulas synthesized and containerized.', status: 'complete' },
        { title: 'Cargo In Transit', time: 'May 14, 2026 - 02:45 PM', desc: 'Heavy transport logistics truck departed central facility.', status: 'complete' },
        { title: 'Delivered', time: 'May 15, 2026 - 10:30 AM', desc: 'Offloaded and signed off by Accra Hub site coordinator Emma.', status: 'complete' }
      ]
    },
    'ORD-9912': {
      id: 'ORD-9912',
      carrier: 'NBT Coastal Freight Services (Truck #T902)',
      status: 'In Transit',
      origin: 'Accra Manufacturing Facility',
      destination: 'Tema Port Gate Customs Hub',
      steps: [
        { title: 'Order Placed', time: 'May 20, 2026 - 10:00 AM', desc: 'B2B order authorized. Batch formulas queued.', status: 'complete' },
        { title: 'Laboratory Prep', time: 'May 21, 2026 - 09:30 AM', desc: 'Formulations containerized into 25L drums and sealed.', status: 'complete' },
        { title: 'Cargo In Transit', time: 'May 22, 2026 - 07:15 AM', desc: 'En route to Tema Harbour under coastal customs escort.', status: 'active' },
        { title: 'Delivered', time: 'Est: May 23, 2026 - 03:00 PM', desc: 'Awaiting site delivery confirmation at Tema Port Customs Hub.', status: 'pending' }
      ]
    }
  };

  const handleRemoveFromWishlist = (id) => {
    setWishlist(prev => prev.filter(item => item.id !== id));
  };

  const handleAddWishlistToCart = (item) => {
    if (typeof addToCart === 'function') {
      addToCart({
        id: item.id,
        name: `${item.name} (${item.size})`,
        price: item.price,
        image: item.image || '/NBT Logo_.png'
      }, 1);
      alert(`${item.name} (${item.size}) added to wholesale order dispatch cart.`);
    } else {
      alert("Cart connection active. Please use the product catalog to purchase.");
    }
  };



  // eslint-disable-next-line no-unused-vars
  const handleAddSavedProductToCart = (prod) => {
    const size = selectedSizes[prod.id];
    const price = prod.pricing[size];
    if (typeof addToCart === 'function') {
      addToCart({
        id: `${prod.id}-${size.replace(/\s+/g, '')}`,
        name: `${prod.name} (${size})`,
        price: price,
        image: prod.image
      }, 1);
      alert(`Wholesale batch ${prod.name} (${size}) added to checkout cart.`);
    } else {
      alert("Cart connection active. Please use the product catalog to purchase.");
    }
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'orders', label: 'Orders', icon: '📦' },
    { id: 'invoices', label: 'Invoices', icon: '📄' },
    { id: 'purchase-orders', label: 'Purchase Orders', icon: '📝' },
    { id: 'saved-products', label: 'Saved Products', icon: '💖' },
    { id: 'track-shipment', label: 'Track Shipment', icon: '🚚' },
    { id: 'profile', label: 'Profile', icon: '👤' },
  ];

  // Removed hardcoded fallback limits since they are in Firestore now

  // Removed redundant isLoaded useEffect

  // Handle Form Submission
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setIsSubmitting(true);

    try {
      if (authMode === 'register') {
        if (!fullName || !businessName || !email || !password || !phone || !location) {
          throw new Error('Please complete all required fields.');
        }

        // Switch to OTP view instead of creating immediately
        setAuthMode('otp');
        setIsSubmitting(false);
        return;

      } else if (authMode === 'otp') {
        if (otpCode !== '1234') {
          throw new Error('Invalid OTP Code. Please use 1234 for testing.');
        }

        // Create Supabase Auth user
        const { data: signUpData, error: signUpError } = await auth.signUp({
          email,
          password
        });
        
        if (signUpError) throw signUpError;
        const user = signUpData.user;
        if (!user) throw new Error('Failed to create account.');

        // Save structured B2B profile to database
        await userService.createUserProfile(user.id, {
          fullName,
          email,
          phone,
          businessName,
          businessType,
          location,
          role: 'buyer', // Default role
          commissionTier: 'bronze',
          discountRate: 0,
          creditLimit: 1000, // standard default
          creditUsed: 0
        });

      } else {
        if (!email || !password) {
          throw new Error('Please provide both email and password.');
        }
        // Log in
        const { error: signInError } = await auth.signInWithPassword({
          email,
          password
        });
        if (signInError) throw signInError;
      }
    } catch (err) {
      console.error("Auth Error:", err);
      // Format auth errors slightly better
      if (err.message?.includes('already exists') || err.message?.includes('already registered')) {
        setAuthError('An account with this email already exists. Please log in.');
      } else if (err.message?.includes('Invalid login credentials') || err.message?.includes('invalid-credential')) {
        setAuthError('Invalid email or password.');
      } else {
        setAuthError(err.message || 'Authentication failed. Please check your inputs and try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Sign out corporate user
  const handleSignOut = async () => {
    try {
      const { error } = await auth.signOut();
      if (error) throw error;
      setAuthMode('login');
    } catch (error) {
      console.error('Error signing out', error);
    }
  };

  const userFullName = activeUser?.fullName || activeUser?.representative || 'User';
  const userCompany = activeUser?.businessName || activeUser?.company || 'Business';
  const userTier = activeUser?.commissionTier || activeUser?.tier || 'buyer';
  const userPhone = activeUser?.phone || '';
  const userEmail = activeUser?.email || '';
  const userDiscountCode = activeUser?.discountCode || `NBT-${(userCompany || '').substring(0, 5).toUpperCase()}-${activeUser?.discountRate || 0}`;
  const userCreditLimit = (activeUser?.creditLimit === 50000) ? 1000 : (activeUser?.creditLimit ?? 1000);
  const userCreditUsed = activeUser?.creditUsed ?? 0;

  const remainingCredit = activeUser ? userCreditLimit - userCreditUsed : 0;
  const userOrders = activeUser?.orders || [];

  if (!isLoaded) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0B2339' }}>
        <div style={{ color: 'white', fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.15)', borderTop: '3px solid #2B8C8A', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <span>Securing Corporate Connection...</span>
        </div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className="App" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar 
        cartCount={cartItems.length} 
        onCartClick={() => setIsCartOpen(true)} 
      />

      {/* GATEKEEPER SIGNUP & VERIFICATION SCREEN */}
      {!activeUser ? (
        <main style={{ flexGrow: 1, background: 'linear-gradient(135deg, #0B2339 0%, #0d3152 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 20px' }}>
          <div className="split-screen-container" style={{
            display: 'flex',
            width: '100%',
            maxWidth: '1000px',
            background: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.09)',
            borderRadius: '28px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
            overflow: 'hidden',
            flexDirection: 'row',
            flexWrap: 'wrap'
          }}>
            {/* LEFT: BENEFITS */}
            <div className="split-screen-left" style={{
              flex: '1 1 400px',
              padding: '50px 40px',
              background: 'linear-gradient(135deg, rgba(43, 140, 138, 0.15) 0%, rgba(11, 35, 57, 0.5) 100%)',
              borderRight: '1px solid rgba(255, 255, 255, 0.05)',
              color: 'white',
              fontFamily: 'Inter, sans-serif'
            }}>
              {/* LOGO AREA */}
              <div style={{ marginBottom: '30px' }}>
                <img 
                  src="/NBT Logo_.png" 
                  alt="NBT Logo" 
                  style={{ height: '56px', width: 'auto', background: 'rgba(11, 35, 57, 0.65)', padding: '8px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }} 
                />
                <h2 style={{ fontFamily: 'Outfit', fontWeight: 850, fontSize: '1.65rem', marginTop: '15px', color: 'white', letterSpacing: '-0.5px', marginBottom: '5px' }}>
                  Neat Brand Trade
                </h2>
                <span style={{ fontSize: '0.72rem', color: 'var(--secondary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2.5px' }}>
                  Wholesale Portal Gateway
                </span>
              </div>

              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '20px', color: 'var(--secondary)' }}>Why Join NBT?</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 30px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1rem' }}>
                  <span style={{ color: 'var(--secondary)', fontSize: '1.2rem' }}>✓</span> Wholesale Prices
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1rem' }}>
                  <span style={{ color: 'var(--secondary)', fontSize: '1.2rem' }}>✓</span> Fast Online Ordering
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1rem' }}>
                  <span style={{ color: 'var(--secondary)', fontSize: '1.2rem' }}>✓</span> Digital Invoices
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1rem' }}>
                  <span style={{ color: 'var(--secondary)', fontSize: '1.2rem' }}>✓</span> Delivery Tracking
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1rem' }}>
                  <span style={{ color: 'var(--secondary)', fontSize: '1.2rem' }}>✓</span> Bulk Purchase Discounts
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1rem' }}>
                  <span style={{ color: 'var(--secondary)', fontSize: '1.2rem' }}>✓</span> Priority Customer Support
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1rem' }}>
                  <span style={{ color: 'var(--secondary)', fontSize: '1.2rem' }}>✓</span> Business Purchase History
                </li>
              </ul>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <p style={{ margin: 0, color: '#cbd5e1', fontSize: '0.95rem', lineHeight: 1.6 }}>
                  Businesses that order regularly qualify for better pricing and special promotions.
                </p>
              </div>
            </div>

            {/* RIGHT: FORM */}
            <div className="split-screen-right" style={{
              flex: '1 1 450px',
              padding: '50px 40px',
              color: 'white',
              fontFamily: 'Inter, sans-serif',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}>
              {/* AUTHENTICATION FORM */}
              <div>
              {/* Form Mode Selector tabs */}
              <div style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '12px', marginBottom: '25px' }}>
                <button 
                  type="button"
                  onClick={() => { setAuthMode('register'); setAuthError(''); }}
                  style={{
                    flex: 1,
                    background: authMode === 'register' ? '#2B8C8A' : 'transparent',
                    color: 'white',
                    border: 'none',
                    padding: '10px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    transition: 'all 0.2s'
                  }}
                >
                  📝 Create Wholesale Account
                </button>
                <button 
                  type="button"
                  onClick={() => { setAuthMode('login'); setAuthError(''); }}
                  style={{
                    flex: 1,
                    background: authMode === 'login' ? '#2B8C8A' : 'transparent',
                    color: 'white',
                    border: 'none',
                    padding: '10px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    transition: 'all 0.2s'
                  }}
                >
                  🔑 Member Log In
                </button>
              </div>

              <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {authMode === 'otp' && (
                  <>
                    <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                      <h3 style={{ fontSize: '1.2rem', color: 'var(--secondary)', marginBottom: '10px' }}>Verify Your Number</h3>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>We sent a secure code to <strong>{phone}</strong>.</p>
                      <p style={{ fontSize: '0.75rem', color: '#ff9800', marginTop: '5px' }}>For this demo, please enter <strong>1234</strong> to verify.</p>
                    </div>
                    <div>
                      <label style={labelStyle}>ENTER OTP CODE</label>
                      <input 
                        type="text" 
                        placeholder="e.g. 1234" 
                        value={otpCode}
                        onChange={e => setOtpCode(e.target.value)}
                        required
                        maxLength={4}
                        style={{ ...inputStyle, textAlign: 'center', fontSize: '1.5rem', letterSpacing: '8px' }}
                      />
                    </div>
                  </>
                )}
                {authMode !== 'otp' && (
                  <>
                    {authMode === 'register' && (
                      <>
                    <div>
                      <label style={labelStyle}>COMPANY / BUSINESS NAME</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Stark Chemical Distributors" 
                        value={businessName}
                        onChange={e => setBusinessName(e.target.value)}
                        required
                        style={inputStyle}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '16px' }}>
                      <div style={{ flex: 1 }}>
                        <label style={labelStyle}>BUSINESS TYPE</label>
                        <select 
                          value={businessType}
                          onChange={e => setBusinessType(e.target.value)}
                          required
                          style={{ ...inputStyle, WebkitAppearance: 'none', appearance: 'none', background: 'rgba(0,0,0,0.25) url("data:image/svg+xml;utf8,<svg fill=\'%23ffffff\' height=\'24\' viewBox=\'0 0 24 24\' width=\'24\' xmlns=\'http://www.w3.org/2000/svg\'><path d=\'M7 10l5 5 5-5z\'/><path d=\'M0 0h24v24H0z\' fill=\'none\'/></svg>") no-repeat right 10px center' }}
                        >
                          <option value="supermarket">Supermarket</option>
                          <option value="retail">Retail Shop</option>
                          <option value="pharmacy">Pharmacy</option>
                          <option value="hotel">Hotel</option>
                          <option value="school">School</option>
                          <option value="restaurant">Restaurant</option>
                          <option value="distributor">Distributor</option>
                          <option value="cleaning">Cleaning Company</option>
                        </select>
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={labelStyle}>LOCATION</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Accra" 
                          value={location}
                          onChange={e => setLocation(e.target.value)}
                          required
                          style={inputStyle}
                        />
                      </div>
                    </div>
                    <div>
                      <label style={labelStyle}>OWNER / MANAGER NAME</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Jayden Stark" 
                        value={fullName}
                        onChange={e => setFullName(e.target.value)}
                        required
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>PHONE NUMBER</label>
                      <input 
                        type="tel" 
                        placeholder="e.g. 024 412 3456" 
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        required
                        style={inputStyle}
                      />
                    </div>
                  </>
                )}

                <div>
                  <label style={labelStyle}>EMAIL ADDRESS</label>
                  <input 
                    type="email" 
                    placeholder="e.g. contact@business.com" 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    style={inputStyle}
                  />
                </div>
                
                <div>
                  <label style={labelStyle}>SECURE PASSWORD</label>
                  <input 
                    type="password" 
                    placeholder="••••••••" 
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    minLength={6}
                    style={inputStyle}
                  />
                </div>
              </>
            )}

                {authError && (
                  <div style={{ background: 'rgba(255, 68, 68, 0.1)', border: '1px solid #ff4444', padding: '10px 15px', borderRadius: '10px', fontSize: '0.8rem', color: '#ff8888', fontWeight: 600 }}>
                    ⚠️ {authError}
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  style={{
                    ...submitButtonStyle,
                    opacity: isSubmitting ? 0.7 : 1,
                    cursor: isSubmitting ? 'not-allowed' : 'pointer'
                  }}
                  onMouseEnter={e => { if (!isSubmitting) e.currentTarget.style.background = 'var(--secondary)'; }}
                  onMouseLeave={e => { if (!isSubmitting) e.currentTarget.style.background = '#2B8C8A'; }}
                >
                  {isSubmitting ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <div style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.15)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                      <span>{authMode === 'register' ? 'Creating Account...' : authMode === 'otp' ? 'Verifying...' : 'Authenticating...'}</span>
                    </div>
                  ) : (
                    authMode === 'register' ? 'Continue →' : authMode === 'otp' ? 'Verify Account' : 'Secure Log In'
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
        <style>{`
            @keyframes pulseGreen {
              0% { box-shadow: 0 0 0 0 rgba(22, 163, 74, 0.4); }
              70% { box-shadow: 0 0 0 15px rgba(22, 163, 74, 0); }
              100% { box-shadow: 0 0 0 0 rgba(22, 163, 74, 0); }
            }
          `}</style>
        </main>
      ) : (
        /* Dynamic Verified Dashboard */
        <main style={{ flexGrow: 1, background: '#f8fafc', paddingBottom: '80px' }}>
          {/* Banner Section */}
          <section style={{
            background: 'linear-gradient(135deg, #0B2339 0%, #153a5c 100%)',
            color: 'white',
            padding: '50px 0'
          }}>
            <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
              <div>
                <span style={{ color: 'var(--secondary)', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '2px' }}>Customer Portal</span>
                <h1 style={{ fontSize: '2.4rem', marginTop: '0.5rem', fontWeight: 800 }}>Welcome Back, {userFullName}</h1>
                <p style={{ margin: '5px 0 0', opacity: 0.85, fontSize: '1rem' }}>{userCompany} • <span style={{textTransform:'capitalize'}}>{userTier}</span></p>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', padding: '15px 25px', borderRadius: '16px' }}>
                <span style={{ fontSize: '0.75rem', opacity: 0.7, textTransform: 'uppercase', display: 'block' }}>Active Discount Code</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--secondary)', letterSpacing: '1px' }}>{userDiscountCode}</span>
              </div>
            </div>
          </section>

          {/* 7-Tab B2B Customer Portal Dashboard Grid */}
          <section className="container" style={{ marginTop: '40px' }}>
            <div style={{ display: 'flex', gap: '30px' }} className="account-grid-layout">
              
              {/* Left Column: Desktop Navigation Sidebar */}
              <div className="desktop-sidebar" style={{
                background: 'white',
                border: '1px solid var(--border)',
                borderRadius: '20px',
                width: '260px',
                padding: '20px 15px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                alignSelf: 'flex-start',
                boxShadow: 'var(--shadow-sm)',
                flexShrink: 0
              }}>
                {tabs.map((tab) => {
                  const active = activeSubTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveSubTab(tab.id)}
                      style={{
                        background: active ? 'rgba(43, 140, 138, 0.08)' : 'transparent',
                        color: active ? '#2B8C8A' : '#0B2339',
                        border: 'none',
                        padding: '12px 16px',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: '0.88rem',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={e => {
                        if (!active) e.currentTarget.style.background = 'rgba(43, 140, 138, 0.04)';
                      }}
                      onMouseLeave={e => {
                        if (!active) e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <span style={{ fontSize: '1.1rem' }}>{tab.icon}</span>
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Mobile top capsule horizontal navigation bar (Touch Target >= 48px comfortable padding) */}
              <div className="mobile-capsules" style={{
                gap: '8px',
                overflowX: 'auto',
                padding: '5px 0 15px 0',
                width: '100%',
                whiteSpace: 'nowrap',
                scrollbarWidth: 'none',
                WebkitOverflowScrolling: 'touch'
              }}>
                {tabs.map((tab) => {
                  const active = activeSubTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveSubTab(tab.id)}
                      style={{
                        background: active ? '#2B8C8A' : 'white',
                        color: active ? 'white' : 'var(--text-muted)',
                        border: '1px solid var(--border)',
                        padding: '10px 18px',
                        borderRadius: '20px',
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        minHeight: '40px',
                        flexShrink: 0
                      }}
                    >
                      <span>{tab.icon}</span>
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Right Column: Tab View Workspace content */}
              <div className="tab-content-panel" style={{ flexGrow: 1, minWidth: 0 }}>
                
                {/* 1. DASHBOARD TAB */}
                {activeSubTab === 'dashboard' && (
                  <>
                  <div className="mobile-hide" style={{ width: '100%' }}>
                    <h2 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.45rem', marginBottom: '20px', color: 'var(--primary)' }}>Hello, {activeUser.businessName || activeUser.fullName}</h2>
                    
                    {/* Quick Order Center */}
                    <div style={{ background: 'linear-gradient(135deg, rgba(43, 140, 138, 0.1) 0%, rgba(11, 35, 57, 0.05) 100%)', padding: '30px', borderRadius: '16px', marginBottom: '35px', border: '1px solid rgba(43, 140, 138, 0.2)' }}>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '20px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '1.5rem' }}>⚡</span> Quick Order Center
                      </h3>
                      <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                        <Link href="/products" style={{ textDecoration: 'none', flexGrow: 1 }}>
                          <button style={{ width: '100%', padding: '16px', fontSize: '1rem', borderRadius: '12px', background: 'var(--primary)', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                            Browse Products
                          </button>
                        </Link>
                        <button onClick={() => setActiveSubTab('orders')} style={{ flexGrow: 1, padding: '16px', fontSize: '1rem', borderRadius: '12px', background: 'white', border: '2px solid var(--primary)', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer' }}>
                          Reorder Previous Purchase
                        </button>
                        <Link href="/bulk-orders" style={{ textDecoration: 'none', flexGrow: 1 }}>
                          <button style={{ width: '100%', padding: '16px', fontSize: '1rem', borderRadius: '12px', background: 'white', border: '2px solid var(--border)', color: 'var(--text-main)', fontWeight: 700, cursor: 'pointer' }}>
                            Request Bulk Quote
                          </button>
                        </Link>
                      </div>
                    </div>

                    {/* Business Overview & Savings */}
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '15px', color: 'var(--text-main)' }}>Business Overview</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '35px' }}>
                      <div style={{ ...ledgerBoxStyle, padding: '24px', background: 'white', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>Credit Limit</span>
                        <strong style={{ fontSize: '1.55rem', color: 'var(--primary)', display: 'block', marginTop: '8px', fontFamily: 'Outfit' }}>GH₵ {userCreditLimit.toLocaleString('en-US')}</strong>
                      </div>
                      <div style={{ ...ledgerBoxStyle, padding: '24px', background: 'white', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>Outstanding Credit</span>
                        <strong style={{ fontSize: '1.55rem', color: '#ff4444', display: 'block', marginTop: '8px', fontFamily: 'Outfit' }}>GH₵ {userCreditUsed.toLocaleString('en-US')}</strong>
                      </div>
                      <div style={{ ...ledgerBoxStyle, padding: '24px', background: 'white', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>Available Credit</span>
                        <strong style={{ fontSize: '1.55rem', color: 'var(--secondary)', display: 'block', marginTop: '8px', fontFamily: 'Outfit' }}>GH₵ {remainingCredit.toLocaleString('en-US')}</strong>
                      </div>
                      
                      {/* Monthly Savings Widget */}
                      <div style={{ ...ledgerBoxStyle, padding: '24px', background: 'linear-gradient(135deg, var(--secondary) 0%, #1a5b59 100%)', color: 'white', border: 'none', boxShadow: '0 10px 25px -5px rgba(43, 140, 138, 0.4)' }}>
                        <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.8)', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between' }}>
                          <span>This Month</span>
                          <span>🏆</span>
                        </span>
                        <div style={{ marginTop: '12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
                            <span>Orders:</span>
                            <span style={{ fontWeight: 700 }}>GHS {(userOrders.reduce((acc, curr) => acc + curr.total, 0) || 12500).toLocaleString('en-US')}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
                            <span>Products Purchased:</span>
                            <span style={{ fontWeight: 700 }}>{userOrders.reduce((acc, curr) => acc + (Array.isArray(curr.items) ? curr.items.length : (typeof curr.items === 'string' ? curr.items.split(',').length : 1)), 0) || 24}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.2)', fontSize: '1.1rem' }}>
                            <span>Savings:</span>
                            <span style={{ fontWeight: 800 }}>GHS {((userOrders.reduce((acc, curr) => acc + curr.total, 0) * (activeUser?.discountRate || 0.05)) || 1350).toLocaleString('en-US')}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Special Offers */}
                    <div style={{ marginBottom: '35px' }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '15px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: '#F59E0B' }}>🔥</span> Special Offers
                      </h3>
                      <div className="account-grid-layout" style={{ display: 'flex', gap: '20px' }}>
                        {/* Offer 1 */}
                        <div style={{ flex: 1, background: 'white', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', padding: '20px', gap: '20px', boxShadow: 'var(--shadow-sm)' }}>
                          <div style={{ width: '80px', height: '80px', background: '#f8fafc', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>🧪</div>
                          <div style={{ flexGrow: 1 }}>
                            <h4 style={{ margin: '0 0 5px 0', fontSize: '1.1rem', color: 'var(--primary)' }}>20L Disinfectant</h4>
                            <div style={{ color: 'var(--secondary)', fontWeight: 800, fontSize: '1.2rem', marginBottom: '10px' }}>GHS 250 <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 500 }}>GHS 320</span></div>
                            <button onClick={() => alert("Added to Cart")} style={{ padding: '8px 16px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}>Order Now</button>
                          </div>
                        </div>
                        {/* Offer 2 */}
                        <div style={{ flex: 1, background: 'white', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', padding: '20px', gap: '20px', boxShadow: 'var(--shadow-sm)' }}>
                          <div style={{ width: '80px', height: '80px', background: '#f8fafc', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>✨</div>
                          <div style={{ flexGrow: 1 }}>
                            <h4 style={{ margin: '0 0 5px 0', fontSize: '1.1rem', color: 'var(--primary)' }}>Floor Cleaner 25L</h4>
                            <div style={{ color: 'var(--secondary)', fontWeight: 800, fontSize: '1.2rem', marginBottom: '10px' }}>GHS 180 <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 500 }}>GHS 240</span></div>
                            <button onClick={() => alert("Added to Cart")} style={{ padding: '8px 16px', background: 'white', color: 'var(--primary)', border: '1px solid var(--primary)', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}>Add to Cart</button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Recommended Products */}
                    <div style={{ marginBottom: '35px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>Recommended Products</h3>
                        <Link href="/products" style={{ color: 'var(--secondary)', fontSize: '0.85rem', fontWeight: 700, textDecoration: 'none' }}>View Catalog →</Link>
                      </div>
                      <div className="product-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
                        {[
                          { id: 1, name: 'Industrial Degreaser 5L', price: 'GHS 120', icon: '🛢️' },
                          { id: 2, name: 'Liquid Hand Wash 5L', price: 'GHS 85', icon: '🧴' },
                          { id: 3, name: 'Glass Cleaner 5L', price: 'GHS 90', icon: '🪟' },
                          { id: 4, name: 'Multi-Purpose Cleaner 20L', price: 'GHS 210', icon: '🧽' }
                        ].map(prod => (
                          <div key={prod.id} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '12px', padding: '15px', textAlign: 'center', boxShadow: 'var(--shadow-sm)' }}>
                            <div style={{ width: '100%', height: '120px', background: '#f8fafc', borderRadius: '8px', marginBottom: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>{prod.icon}</div>
                            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)', marginBottom: '5px' }}>{prod.name}</div>
                            <div style={{ color: 'var(--secondary)', fontWeight: 800, marginBottom: '15px' }}>{prod.price}</div>
                            <button onClick={() => alert(`${prod.name} Added to Cart`)} style={{ width: '100%', padding: '8px', background: 'white', border: '1px solid var(--border)', borderRadius: '8px', fontWeight: 600, color: 'var(--primary)', cursor: 'pointer', transition: 'all 0.2s' }}>Add to Cart</button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Recent Orders Overview */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>Recent Orders</h3>
                      <button onClick={() => setActiveSubTab('orders')} style={{ background: 'none', border: 'none', color: 'var(--secondary)', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}>View All →</button>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '35px' }}>
                      {userOrders.slice(0, 3).map(order => (
                        <div key={order.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: 'white', padding: '16px 20px', borderRadius: '12px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', flexWrap: 'wrap', gap: '10px' }}>
                          <div>
                            <div style={{ fontWeight: 800, color: 'var(--primary)', marginBottom: '4px' }}>Order #{order.id}</div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Amount: GHS {order.total.toLocaleString('en-US')}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ background: order.status === 'Processing' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(43, 140, 138, 0.1)', color: order.status === 'Processing' ? '#F59E0B' : 'var(--secondary)', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, display: 'inline-block', marginBottom: '6px' }}>
                              Status: {order.status}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Expected Delivery: {order.date}</div>
                          </div>
                        </div>
                      ))}
                      {userOrders.length === 0 && (
                        <div style={{ padding: '30px', textAlign: 'center', background: '#f8fafc', borderRadius: '12px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                          No recent orders found.
                        </div>
                      )}
                    </div>

                    {/* Account Manager */}
                    <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                      <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1.5rem', fontWeight: 800 }}>PJ</div>
                      <div style={{ flexGrow: 1 }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary)', margin: '0 0 5px 0' }}>Your NBT Account Manager</h3>
                        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '10px' }}>Prince Johnson Afenyo</p>
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                          <button onClick={() => window.open('https://wa.me/233246272115', '_blank')} style={{ padding: '6px 12px', background: '#25D366', color: 'white', border: 'none', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>💬 WhatsApp</button>
                          <a href="tel:+233246272115" style={{ textDecoration: 'none' }}><button style={{ padding: '6px 12px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>📞 Call</button></a>
                          <a href="mailto:info@neatbrandtrade.com" style={{ textDecoration: 'none' }}><button style={{ padding: '6px 12px', background: 'white', color: 'var(--primary)', border: '1px solid var(--primary)', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>✉️ Email</button></a>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* MOBILE ACCOUNT DASHBOARD */}
                  <div className="mobile-account-wrapper mobile-show">
                    <div className="mobile-account-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#e2e8f0', color: '#0B2339', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 800 }}>
                          {(activeUser.fullName || activeUser.businessName || 'US').split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase()}
                        </div>
                        <div>
                          <h2 style={{ margin: '0 0 4px 0', fontSize: '1.25rem', fontWeight: 700 }}>{activeUser.fullName || activeUser.businessName || 'User'}</h2>
                          <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)' }}>{activeUser.email} &middot; {activeUser.role === 'buyer' ? 'Wholesale account' : 'Retail account'}</div>
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '15px', padding: '20px 15px', marginTop: '-30px', position: 'relative', zIndex: 10 }}>
                      <div className="mobile-account-card" style={{ flex: 1, margin: 0, padding: '15px' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>Total orders</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>{userOrders.length}</div>
                      </div>
                      <div className="mobile-account-card" style={{ flex: 1, margin: 0, padding: '15px' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>Total spent</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>GHS {userOrders.reduce((acc, order) => acc + (order.total || 0), 0).toLocaleString('en-US')}</div>
                      </div>
                    </div>
                    
                    <div style={{ padding: '0 15px', marginBottom: '20px' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '1px', marginBottom: '10px', textTransform: 'uppercase' }}>Recent Orders</div>
                      
                      {userOrders.slice(0, 2).map(order => (
                        <div key={order.id} className="mobile-account-card" style={{ padding: '15px', marginBottom: '10px' }}>
                           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: order.status === 'Processing' ? '#F59E0B' : '#10B981' }}></div>
                                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>Order #{order.id}</div>
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>GHS {order.total.toLocaleString('en-US')} &middot; {order.date}</div>
                              </div>
                              <div style={{ background: order.status === 'Processing' ? '#FEF3C7' : '#D1FAE5', color: order.status === 'Processing' ? '#92400E' : '#065F46', padding: '4px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700 }}>
                                {order.status}
                              </div>
                           </div>
                        </div>
                      ))}
                      {userOrders.length === 0 && (
                        <div className="mobile-account-card" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                           No recent orders
                        </div>
                      )}
                    </div>
                    
                    <div style={{ padding: '0 15px', marginBottom: '20px' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '1px', marginBottom: '10px', textTransform: 'uppercase' }}>Quick Actions</div>
                      
                      <div className="mobile-account-card" style={{ margin: 0 }}>
                        <div className="mobile-account-row" onClick={() => setActiveSubTab('orders')}>
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <div className="mobile-account-row-icon" style={{ color: '#10B981', background: '#D1FAE5' }}>📦</div>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>My orders</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>View all order history</div>
                            </div>
                          </div>
                          <div style={{ color: '#cbd5e1' }}>❯</div>
                        </div>
                        <div className="mobile-account-row" onClick={() => setActiveSubTab('settings')}>
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <div className="mobile-account-row-icon" style={{ color: '#0EA5E9', background: '#E0F2FE' }}>📍</div>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Delivery addresses</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Manage saved locations</div>
                            </div>
                          </div>
                          <div style={{ color: '#cbd5e1' }}>❯</div>
                        </div>
                        <div className="mobile-account-row" onClick={() => setActiveSubTab('invoices')}>
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <div className="mobile-account-row-icon" style={{ color: '#F59E0B', background: '#FEF3C7' }}>🧾</div>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Invoices & receipts</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Download past invoices</div>
                            </div>
                          </div>
                          <div style={{ color: '#cbd5e1' }}>❯</div>
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ padding: '0 15px', marginBottom: '20px' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '1px', marginBottom: '10px', textTransform: 'uppercase' }}>Account</div>
                      
                      <div className="mobile-account-card" style={{ margin: 0, marginBottom: '15px' }}>
                        <div className="mobile-account-row" onClick={() => setActiveSubTab('settings')}>
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <div className="mobile-account-row-icon" style={{ color: 'var(--text-main)', background: '#f1f5f9' }}>👤</div>
                            <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Edit profile</div>
                          </div>
                          <div style={{ color: '#cbd5e1' }}>❯</div>
                        </div>
                        <div className="mobile-account-row" onClick={() => setActiveSubTab('settings')}>
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <div className="mobile-account-row-icon" style={{ color: 'var(--text-main)', background: '#f1f5f9' }}>🔒</div>
                            <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Change password</div>
                          </div>
                          <div style={{ color: '#cbd5e1' }}>❯</div>
                        </div>
                      </div>
                      
                      <button onClick={() => window.open('https://wa.me/233246272115', '_blank')} style={{ width: '100%', background: '#25D366', color: 'white', padding: '16px', borderRadius: '12px', border: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '1rem', marginBottom: '15px', cursor: 'pointer', boxShadow: '0 4px 6px rgba(37, 211, 102, 0.2)' }}>
                         💬 Chat with us on WhatsApp
                      </button>
                      
                      <button onClick={handleSignOut} style={{ width: '100%', background: 'white', border: '1px solid var(--border)', color: '#EF4444', padding: '16px', borderRadius: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '0.95rem', cursor: 'pointer', boxShadow: 'var(--shadow-sm)' }}>
                         🚪 Sign out
                      </button>
                    </div>
                  </div>
                  </>
                )}

                {/* 2. ORDERS TAB */}
                {activeSubTab === 'orders' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
                      <h2 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.45rem', color: 'var(--primary)', margin: 0 }}>📦 Wholesale Order History</h2>
                      <span style={{ fontSize: '0.85rem', background: '#e2e8f0', padding: '4px 10px', borderRadius: '30px', fontWeight: 650 }}>{userOrders.length} Orders Total</span>
                    </div>

                    {/* Table view for Desktop */}
                    <div className="desktop-orders-table" style={{ background: 'white', borderRadius: '20px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
                      <div className="desktop-table-container" style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                          <thead>
                            <tr style={{ borderBottom: '2px solid #f1f5f9', color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', background: '#f8fafc' }}>
                              <th style={{ padding: '16px 20px' }}>ORDER ID</th>
                              <th style={{ padding: '16px 20px' }}>DISPATCH DATE</th>
                              <th style={{ padding: '16px 20px' }}>FORMULATIONS ORDERED</th>
                              <th style={{ padding: '16px 20px' }}>TOTAL COST</th>
                              <th style={{ padding: '16px 20px' }}>STATUS</th>
                              <th style={{ padding: '16px 20px', textAlign: 'right' }}>ACTION</th>
                            </tr>
                          </thead>
                          <tbody>
                            {userOrders.map((o) => (
                              <tr key={o.id} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.9rem', transition: 'background 0.2s' }}>
                                <td style={{ padding: '18px 20px', fontWeight: 700, color: 'var(--primary)' }}>{o.id}</td>
                                <td style={{ padding: '18px 20px', color: 'var(--text-muted)' }}>{o.date}</td>
                                <td style={{ padding: '18px 20px', color: 'var(--text-main)', maxWidth: '280px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{Array.isArray(o.items) ? o.items.map(i => i.name || i).join(', ') : o.items}</td>
                                <td style={{ padding: '18px 20px', fontWeight: 700 }}>GH₵ {o.total.toLocaleString('en-US')}</td>
                                <td style={{ padding: '18px 20px' }}>
                                  <span style={{ background: 'rgba(43, 140, 138, 0.1)', color: 'var(--secondary)', fontSize: '0.75rem', fontWeight: 700, padding: '4px 10px', borderRadius: '30px' }}>{o.status}</span>
                                </td>
                                <td style={{ padding: '18px 20px', textAlign: 'right' }}>
                                  <button 
                                    onClick={() => setSelectedInvoiceOrder(o)}
                                    style={{
                                      background: 'rgba(11, 35, 57, 0.06)',
                                      color: 'var(--primary)',
                                      border: 'none',
                                      padding: '8px 14px',
                                      borderRadius: '8px',
                                      cursor: 'pointer',
                                      fontSize: '0.8rem',
                                      fontWeight: 700,
                                      transition: 'var(--transition)'
                                    }}
                                  >
                                    🧾 View Invoice
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Card view for Mobile (to guarantee no side scroll!) */}
                    <div className="mobile-cards-container mobile-orders-cards" style={{ display: 'none', flexDirection: 'column', gap: '15px' }}>
                      {userOrders.map((o) => (
                        <div key={o.id} style={{
                          background: 'white',
                          border: '1px solid var(--border)',
                          borderRadius: '16px',
                          padding: '20px',
                          boxShadow: 'var(--shadow-sm)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '12px'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <strong style={{ fontSize: '1.05rem', color: 'var(--primary)' }}>{o.id}</strong>
                            <span style={{ background: 'rgba(43, 140, 138, 0.1)', color: 'var(--secondary)', fontSize: '0.72rem', fontWeight: 700, padding: '4px 10px', borderRadius: '30px' }}>{o.status}</span>
                          </div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div>📅 Date: {o.date}</div>
                            <div style={{ color: 'var(--text-main)', fontWeight: 550 }}>🧪 {Array.isArray(o.items) ? o.items.map(i => i.name || i).join(', ') : o.items}</div>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '12px', marginTop: '4px' }}>
                            <strong style={{ fontSize: '1.1rem', color: 'var(--primary)' }}>GH₵ {o.total.toLocaleString('en-US')}</strong>
                            <button 
                              onClick={() => setSelectedInvoiceOrder(o)}
                              style={{
                                background: 'rgba(11, 35, 57, 0.06)',
                                color: 'var(--primary)',
                                border: 'none',
                                padding: '8px 14px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '0.78rem',
                                fontWeight: 700
                              }}
                            >
                              🧾 View Invoice
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. WISHLIST TAB */}
                {/* 3. SAVED PRODUCTS TAB */}
                {activeSubTab === 'saved-products' && (
                  <div>
                    <h2 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.45rem', marginBottom: '20px', color: 'var(--primary)' }}>💖 Saved Wholesale Formulation Watchlists</h2>
                    
                    {wishlist.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px 20px', background: 'white', borderRadius: '20px', border: '1px dashed var(--border)' }}>
                        <span style={{ fontSize: '3rem' }}>🔬</span>
                        <h3 style={{ fontFamily: 'Outfit', fontSize: '1.1rem', marginTop: '10px', color: 'var(--text-main)' }}>Your formulation watchlist is empty.</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '5px' }}>Save custom chemical blends from the products library to monitor bulk prices.</p>
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                        {wishlist.map((item) => (
                          <div key={item.id} style={{
                            background: 'white',
                            border: '1px solid var(--border)',
                            borderRadius: '20px',
                            overflow: 'hidden',
                            boxShadow: 'var(--shadow-sm)',
                            display: 'flex',
                            flexDirection: 'column'
                          }}>
                            <div style={{ height: '140px', background: '#f8fafc', position: 'relative' }}>
                              <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(11, 35, 57, 0.8)', color: 'white', fontSize: '0.72rem', fontWeight: 700, padding: '4px 8px', borderRadius: '4px' }}>
                                {item.size}
                              </div>
                            </div>
                            <div style={{ padding: '20px', flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                              <h4 style={{ fontFamily: 'Outfit', fontSize: '1.05rem', color: 'var(--primary)', margin: 0, minHeight: '44px' }}>{item.name}</h4>
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>SPEC: {item.spec}</span>
                              <div style={{ marginTop: 'auto', borderTop: '1px solid #f1f5f9', paddingTop: '15px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '12px' }}>
                                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>WHOLESALE PRICE:</span>
                                  <strong style={{ fontSize: '1.15rem', color: 'var(--primary)' }}>GH₵ {item.price.toLocaleString('en-US')}</strong>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  <button 
                                    onClick={() => handleAddWishlistToCart(item)}
                                    style={{
                                      flex: 1,
                                      background: '#2B8C8A',
                                      color: 'white',
                                      border: 'none',
                                      padding: '8px',
                                      borderRadius: '8px',
                                      cursor: 'pointer',
                                      fontSize: '0.8rem',
                                      fontWeight: 700,
                                      transition: 'all 0.2s'
                                    }}
                                  >
                                    🛒 Order Batch
                                  </button>
                                  <button 
                                    onClick={() => handleRemoveFromWishlist(item.id)}
                                    style={{
                                      background: 'rgba(255, 68, 68, 0.08)',
                                      color: '#ff4444',
                                      border: '1px solid rgba(255, 68, 68, 0.15)',
                                      width: '36px',
                                      borderRadius: '8px',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      transition: 'all 0.2s'
                                    }}
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 4. INVOICES TAB */}
                {activeSubTab === 'invoices' && (
                  <div>
                    <h2 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.45rem', marginBottom: '20px', color: 'var(--primary)' }}>📄 Invoices & Statements</h2>
                    <div style={{ padding: '40px 20px', textAlign: 'center', background: 'white', borderRadius: '20px', color: 'var(--text-muted)', fontSize: '0.9rem', border: '1px dashed var(--border)' }}>
                      <span style={{ fontSize: '3rem', display: 'block', marginBottom: '10px' }}>🧾</span>
                      <h3 style={{ fontFamily: 'Outfit', fontSize: '1.1rem', color: 'var(--text-main)' }}>You have no unpaid invoices.</h3>
                      <p style={{ marginTop: '5px' }}>All billing statements and payment links will appear here.</p>
                    </div>
                  </div>
                )}

                {/* 5. PURCHASE ORDERS TAB */}
                {activeSubTab === 'purchase-orders' && (
                  <div>
                    <h2 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.45rem', marginBottom: '20px', color: 'var(--primary)' }}>📝 Purchase Orders (POs)</h2>
                    <div style={{ padding: '40px 20px', textAlign: 'center', background: 'white', borderRadius: '20px', color: 'var(--text-muted)', fontSize: '0.9rem', border: '1px dashed var(--border)' }}>
                      <span style={{ fontSize: '3rem', display: 'block', marginBottom: '10px' }}>🗂️</span>
                      <h3 style={{ fontFamily: 'Outfit', fontSize: '1.1rem', color: 'var(--text-main)' }}>No active purchase orders.</h3>
                      <p style={{ marginTop: '5px' }}>Submit a PO to request custom bulk quotes or net-30 terms.</p>
                    </div>
                  </div>
                )}

                {/* 6. TRACK SHIPMENT TAB */}
                {activeSubTab === 'track-shipment' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
                      <h2 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.45rem', color: 'var(--primary)', margin: 0 }}>🚚 Active Dispatch Cargo Tracking</h2>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)' }}>SELECT DISPATCH:</span>
                        <select 
                          value={trackedOrderId}
                          onChange={(e) => setTrackedOrderId(e.target.value)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '8px',
                            border: '1px solid #d1d5db',
                            background: 'white',
                            color: 'var(--primary)',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            outline: 'none'
                          }}
                        >
                          <option value="ORD-9912">ORD-9912 (In Transit - Cargo Active)</option>
                          <option value="ORD-9842">ORD-9842 (Delivered - Archive Log)</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '20px', padding: '25px', boxShadow: 'var(--shadow-sm)', marginBottom: '25px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '15px', marginBottom: '25px', flexWrap: 'wrap', gap: '10px' }}>
                        <div>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Dispatch Status</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                            <strong style={{ fontSize: '1.2rem', color: trackingData[trackedOrderId].status === 'Delivered' ? '#16a34a' : 'var(--secondary)' }}>
                              {trackingData[trackedOrderId].status}
                            </strong>
                            {trackingData[trackedOrderId].status === 'In Transit' && (
                              <div style={{ width: '8px', height: '8px', background: 'var(--secondary)', borderRadius: '50%', animation: 'pulseGreen 1.5s infinite' }} />
                            )}
                          </div>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, display: 'block', textAlign: 'right' }}>Active Logistics Carrier</span>
                          <strong style={{ fontSize: '0.9rem', color: 'var(--primary)', display: 'block', marginTop: '4px' }}>{trackingData[trackedOrderId].carrier}</strong>
                        </div>
                      </div>

                      {/* Logistical timeline stepper */}
                      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '30px', paddingLeft: '30px' }}>
                        
                        {/* Dynamic line connector */}
                        <div style={{
                          position: 'absolute',
                          top: '12px',
                          left: '9px',
                          bottom: '12px',
                          width: '3px',
                          background: '#e2e8f0',
                          zIndex: 1
                        }} />

                        {trackingData[trackedOrderId].steps.map((st, idx) => {
                          let isDone = st.status === 'complete';
                          let isActive = st.status === 'active';
                          return (
                            <div key={idx} style={{ position: 'relative', zIndex: 2 }}>
                              {/* Step dot */}
                              <div style={{
                                position: 'absolute',
                                left: '-28px',
                                top: '2px',
                                width: '18px',
                                height: '18px',
                                borderRadius: '50%',
                                background: isDone ? '#16a34a' : isActive ? 'var(--secondary)' : '#e2e8f0',
                                border: isActive ? '4px solid rgba(43, 140, 138, 0.25)' : 'none',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: isActive ? '0 0 10px rgba(43, 140, 138, 0.4)' : 'none'
                              }}>
                                {isDone && <span style={{ color: 'white', fontSize: '0.55rem', fontWeight: 900 }}>✓</span>}
                              </div>
                              
                              <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '5px' }}>
                                  <strong style={{ fontSize: '0.92rem', color: isDone || isActive ? 'var(--primary)' : 'var(--text-muted)' }}>{st.title}</strong>
                                  <span style={{ fontSize: '0.75rem', color: isActive ? 'var(--secondary)' : 'var(--text-muted)', fontWeight: 650 }}>{st.time}</span>
                                </div>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.4 }}>{st.desc}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    
                    <div style={{ background: '#f8fafc', border: '1px solid var(--border)', borderRadius: '16px', padding: '18px 20px' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Logistics Route Details</span>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', flexWrap: 'wrap', gap: '10px' }}>
                        <div>🏭 <strong>FROM:</strong> {trackingData[trackedOrderId].origin}</div>
                        <div>🏢 <strong>TO:</strong> {trackingData[trackedOrderId].destination}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 7. PROFILE TAB */}
                {activeSubTab === 'profile' && (
                  <div>
                    <h2 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.45rem', marginBottom: '20px', color: 'var(--primary)' }}>👤 Company & Rep Profile</h2>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }} className="account-grid-layout">
                      <div style={{ background: 'white', padding: '25px', border: '1px solid var(--border)', borderRadius: '20px', boxShadow: 'var(--shadow-sm)' }}>
                        <h3 style={{ fontFamily: 'Outfit', fontSize: '1.15rem', color: 'var(--primary)', marginBottom: '20px', fontWeight: 800 }}>Representative Specs</h3>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', fontSize: '0.88rem' }}>
                          <div>
                            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem', fontWeight: 750, letterSpacing: '1px' }}>REPRESENTATIVE NAME</span>
                            <span style={{ color: 'var(--text-main)', fontWeight: 650, fontSize: '0.98rem', display: 'block', marginTop: '4px' }}>{userFullName}</span>
                          </div>
                          <div>
                            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem', fontWeight: 750, letterSpacing: '1px' }}>COMPANY / BUSINESS NAME</span>
                            <span style={{ color: 'var(--text-main)', fontWeight: 650, fontSize: '0.98rem', display: 'block', marginTop: '4px' }}>{userCompany}</span>
                          </div>
                          <div>
                            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem', fontWeight: 750, letterSpacing: '1px' }}>VERIFIED EMAIL ADDRESS</span>
                            <span style={{ color: 'var(--text-main)', fontWeight: 650, fontSize: '0.98rem', display: 'block', marginTop: '4px' }}>{userEmail}</span>
                          </div>
                          <div>
                            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem', fontWeight: 750, letterSpacing: '1px' }}>SECURE VERIFICATION PHONE</span>
                            <span style={{ color: 'var(--text-main)', fontWeight: 650, fontSize: '0.98rem', display: 'block', marginTop: '4px' }}>{userPhone}</span>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ background: 'white', padding: '25px', border: '1px solid var(--border)', borderRadius: '20px', boxShadow: 'var(--shadow-sm)' }}>
                          <h3 style={{ fontFamily: 'Outfit', fontSize: '1.15rem', color: 'var(--primary)', marginBottom: '15px', fontWeight: 800 }}>Account Audit & Tier</h3>
                          
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', fontSize: '0.85rem' }}>
                            <div>
                              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.68rem', fontWeight: 750 }}>PORTFOLIO CLASSIFICATION</span>
                              <span style={{ color: 'var(--secondary)', fontWeight: 800, fontSize: '1rem', display: 'block', marginTop: '4px', textTransform:'capitalize' }}>{userTier}</span>
                            </div>
                            <div>
                              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.68rem', fontWeight: 750 }}>IDENTITY VERIFICATION</span>
                              <span style={{ color: '#16a34a', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px', marginTop: '4px' }}>
                                ✓ Verified via Secure OTP SMS
                              </span>
                            </div>
                            <div>
                              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.68rem', fontWeight: 750 }}>DYNAMIC DISCOUNT PARTNER CODE</span>
                              <code style={{ background: '#f1f5f9', padding: '3px 8px', borderRadius: '4px', fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 700, display: 'inline-block', marginTop: '4px', border: '1px solid #e2e8f0' }}>
                                {userDiscountCode}
                              </code>
                            </div>
                          </div>
                        </div>

                        <div style={{ background: 'white', padding: '25px', border: '1px solid var(--border)', borderRadius: '20px', boxShadow: 'var(--shadow-sm)' }}>
                          <button className="btn btn-outline" style={{ width: '100%', fontSize: '0.85rem', padding: '10px 12px', fontWeight: 700 }} onClick={() => alert("Corporate details update is locked during active billing cycle. Contact NBT Admin.")}>
                            ⚙️ Request Portal Updates
                          </button>
                          <button 
                            onClick={handleSignOut}
                            style={{
                              width: '100%',
                              background: 'rgba(255, 68, 68, 0.08)',
                              color: '#ff4444',
                              border: '1px solid rgba(255, 68, 68, 0.2)',
                              padding: '10px 12px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontSize: '0.85rem',
                              fontWeight: 700,
                              transition: 'all 0.2s',
                              marginTop: '10px'
                            }}
                          >
                            🚪 Secure Portal Sign Out
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </section>
        </main>
      )}

      {/* Cart Drawer */}
      <Cart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onRemove={removeFromCart}
        onClearCart={clearCart}
      />

      <FloatingContact />

      {/* enterprise VAT Tax Invoice modal overlay */}
      <InvoiceModal 
        isOpen={!!selectedInvoiceOrder}
        onClose={() => setSelectedInvoiceOrder(null)}
        order={selectedInvoiceOrder}
      />

      <style>{`
        @media (max-width: 768px) {
          div.account-grid-layout {
            flex-direction: column !important;
            gap: 15px !important;
          }
          .account-grid-layout {
            grid-template-columns: 1fr !important;
            gap: 15px !important;
          }
          .desktop-sidebar {
            display: none !important;
          }
          .mobile-capsules {
            display: flex !important;
          }
          .mobile-capsules::-webkit-scrollbar {
            display: none !important;
          }
          .desktop-orders-table {
            display: none !important;
          }
          .mobile-orders-cards {
            display: flex !important;
          }
          .address-form-grid {
            grid-template-columns: 1fr !important;
          }
          .address-form-submit {
            grid-column: span 1 !important;
          }
        }
      `}</style>
    </div>
  );
}

const ledgerBoxStyle = {
  background: '#f8fafc',
  padding: '16px',
  borderRadius: '12px',
  border: '1px solid var(--border)'
};

const labelStyle = {
  display: 'block',
  fontSize: '0.72rem',
  fontWeight: 750,
  letterSpacing: '1.5px',
  color: 'rgba(255, 255, 255, 0.7)',
  marginBottom: '6px'
};

const inputStyle = {
  width: '100%',
  background: 'rgba(0, 0, 0, 0.25)',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  padding: '12px 16px',
  borderRadius: '12px',
  color: 'white',
  fontSize: '0.92rem',
  outline: 'none',
  transition: 'border-color 0.2s',
  fontFamily: 'Inter, sans-serif'
};

const submitButtonStyle = {
  width: '100%',
  background: '#2B8C8A',
  color: 'white',
  border: 'none',
  padding: '14px',
  borderRadius: '12px',
  cursor: 'pointer',
  fontWeight: 700,
  fontSize: '0.95rem',
  transition: 'all 0.2s',
  fontFamily: 'Outfit, sans-serif',
  boxShadow: '0 4px 12px rgba(43, 140, 138, 0.25)'
};
