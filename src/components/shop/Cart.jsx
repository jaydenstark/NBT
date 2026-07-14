'use client';
import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuthUser } from '../../hooks/useAuthUser';

const Cart = ({ isOpen, onClose, cartItems, onRemove, onClearCart }) => {
  const [isCheckout, setIsCheckout] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user: activeUser } = useAuthUser();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    companyRef: '',
    deliveryDate: '',
    paymentMethod: 'Pay Now',
    notes: '',
    poNumber: '',
    poFileName: ''
  });

  const total = cartItems.reduce((acc, item) => acc + (item.price * (item.quantity || 1)), 0);

  if (!isOpen) return null;

  // Initialize fields if user is authenticated
  const initCheckoutForm = () => {
    if (activeUser) {
      setFormData(prev => ({
        ...prev,
        name: activeUser.company || activeUser.fullName || activeUser.email || prev.name,
        phone: activeUser.phone || prev.phone,
        address: activeUser.location || activeUser.address || prev.address
      }));
    }
    setIsCheckout(true);
  };

  const processOrder = async (customerData) => {
    if (cartItems.length === 0) return;
    setIsSubmitting(true);

    try {
      // 1. Save Order to Firestore
      const orderData = {
        customer: {
          name: customerData.name,
          phone: customerData.phone,
          address: customerData.address,
          companyRef: customerData.companyRef || '',
          deliveryDate: customerData.deliveryDate || '',
          paymentMethod: customerData.paymentMethod || 'Pay Now',
          notes: customerData.notes || '',
          poNumber: customerData.poNumber || '',
          poFileName: customerData.poFileName || ''
        },
        items: cartItems,
        totalAmount: total,
        status: 'pending',
        createdAt: serverTimestamp()
      };
      
      const ordersRef = collection(db, 'orders');
      await addDoc(ordersRef, orderData);

      // 2. Generate B2B WhatsApp Message
      let message = `*New Purchase Order (My Order) from NBT B2B* 🚀\n\n`;
      message += `*Customer Details:*\n`;
      message += `Company/Client: ${customerData.name}\n`;
      message += `Phone: ${customerData.phone}\n`;
      message += `Delivery Address: ${customerData.address}\n`;
      
      if (customerData.companyRef) {
        message += `Company Reference: ${customerData.companyRef}\n`;
      }
      if (customerData.poNumber) {
        message += `PO Number: ${customerData.poNumber}\n`;
      }
      if (customerData.poFileName) {
        message += `PO File: ${customerData.poFileName}\n`;
      }
      if (customerData.deliveryDate) {
        message += `Preferred Delivery Date: ${customerData.deliveryDate}\n`;
      }
      message += `Payment Method: ${customerData.paymentMethod}\n`;
      if (customerData.notes) {
        message += `Delivery Notes: ${customerData.notes}\n`;
      }
      message += `\n*Order Items:*\n`;
      
      cartItems.forEach((item, index) => {
        const qtyText = item.qtyInBox > 1 ? ` (${item.qtyInBox} pieces/box)` : '';
        const lineTotal = item.price * (item.quantity || 1);
        const sizeString = (item.size && !item.name.toLowerCase().includes(item.size.toLowerCase())) ? ` (${item.size})` : '';
        message += `${index + 1}. ${item.quantity || 1}x ${item.name}${sizeString}${qtyText} - GH₵ ${lineTotal.toLocaleString('en-US')}\n`;
      });
      
      message += `\n*Total Amount:* GH₵ ${total.toLocaleString('en-US')}`;

      // URL Encode the message
      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/233246272115?text=${encodedMessage}`;

      // Open WhatsApp
      window.open(whatsappUrl, '_blank');

      // 3. Reset and Close
      setIsSubmitting(false);
      setIsCheckout(false);
      setFormData({ 
        name: '', 
        phone: '', 
        address: '', 
        companyRef: '', 
        deliveryDate: '', 
        paymentMethod: 'Pay Now', 
        notes: '',
        poNumber: '',
        poFileName: ''
      });
      if (onClearCart) onClearCart();
      onClose();

    } catch (error) {
      console.error("Error submitting order: ", error);
      alert("Failed to process order. Please try again or contact us directly.");
      setIsSubmitting(false);
    }
  };

  const handleCheckoutSubmit = (e) => {
    e.preventDefault();
    processOrder(formData);
  };

  return (
    <div className="cart-drawer" style={{
      animation: 'fadeIn 0.3s ease-out',
      display: 'flex',
      flexDirection: 'column',
      background: 'white',
      borderLeft: '1px solid var(--border)',
      boxShadow: 'var(--shadow-md)',
      position: 'fixed',
      top: 0,
      right: 0,
      bottom: 0,
      width: '100%',
      maxWidth: '480px',
      zIndex: 5000
    }}>
      <div style={{ padding: '2rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, color: 'var(--primary)' }}>{isCheckout ? "B2B Order Checkout" : "My Order"}</h2>
        <button onClick={() => { setIsCheckout(false); onClose(); }} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
      </div>

      {!isCheckout ? (
        <>
          <div style={{ flexGrow: 1, overflowY: 'auto', padding: '2rem' }}>
            {cartItems.length === 0 ? (
              <div style={{ textAlign: 'center', marginTop: '4rem', color: 'var(--text-muted)' }}>
                <span style={{ fontSize: '3rem' }}>📋</span>
                <p style={{ marginTop: '1rem', fontWeight: 600 }}>Your order list is empty.</p>
                <p style={{ fontSize: '0.85rem' }}>Browse products to add them to your procurement sheet.</p>
              </div>
            ) : (
              cartItems.map((item, index) => (
                <div key={index} style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ margin: 0, color: 'var(--primary)' }}>{item.quantity || 1}x {item.name}</h4>
                    {(item.qtyInBox > 1 || (item.size && !item.name.toLowerCase().includes(item.size.toLowerCase()))) && (
                      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--secondary)', fontWeight: 600 }}>
                        {item.size && !item.name.toLowerCase().includes(item.size.toLowerCase()) ? `Size: ${item.size} ` : ''}
                        {item.qtyInBox > 1 && `(${item.qtyInBox} pcs/box)`}
                      </p>
                    )}
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>GH₵ {(item.price * (item.quantity || 1)).toLocaleString('en-US')}</p>
                  </div>
                  <button 
                    onClick={() => onRemove(index)}
                    style={{ background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                  >
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>

          <div style={{ padding: '2rem', background: 'var(--bg-surface)', borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', fontWeight: 700, fontSize: '1.2rem' }}>
              <span>Total Amount:</span>
              <span style={{ color: 'var(--primary)' }}>GH₵ {total.toLocaleString('en-US')}</span>
            </div>
            <button 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '15px' }}
              onClick={initCheckoutForm}
              disabled={cartItems.length === 0 || isSubmitting}
            >
              Configure B2B Checkout ⚙️
            </button>
          </div>
        </>
      ) : (
        <form onSubmit={handleCheckoutSubmit} style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden' }}>
          <div style={{ flexGrow: 1, overflowY: 'auto', padding: '2rem' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Company / Client Name</label>
              <input 
                type="text" 
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                style={{ width: '100%', padding: '12px', border: '1px solid var(--border)', borderRadius: '8px' }}
                placeholder="Golden View Hotel"
              />
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Contact Phone</label>
              <input 
                type="tel" 
                required
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                style={{ width: '100%', padding: '12px', border: '1px solid var(--border)', borderRadius: '8px' }}
                placeholder="e.g. 0246272115"
              />
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Delivery Location</label>
              <textarea 
                required
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                style={{ width: '100%', padding: '12px', border: '1px solid var(--border)', borderRadius: '8px', minHeight: '60px' }}
                placeholder="Accra Warehouse / Head Office"
              />
            </div>

            {/* B2B fields */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem', marginTop: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', color: 'var(--primary)', marginBottom: '1rem' }}>B2B Commercial Settings</h3>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Company Reference / PO #</label>
                <input 
                  type="text" 
                  value={formData.companyRef}
                  onChange={(e) => setFormData({...formData, companyRef: e.target.value})}
                  style={{ width: '100%', padding: '12px', border: '1px solid var(--border)', borderRadius: '8px' }}
                  placeholder="e.g. NBT-ORD-2026-0001"
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Upload Purchase Order Document (Optional)</label>
                <div style={{
                  border: '2px dashed #cbd5e1',
                  borderRadius: '8px',
                  padding: '15px',
                  textAlign: 'center',
                  background: '#f8fafc',
                  cursor: 'pointer',
                  position: 'relative'
                }}>
                  <input 
                    type="file" 
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setFormData(prev => ({ ...prev, poFileName: file.name }));
                      }
                    }}
                    style={{
                      position: 'absolute',
                      top: 0, right: 0, bottom: 0, left: 0,
                      opacity: 0,
                      cursor: 'pointer'
                    }}
                  />
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {formData.poFileName ? `📄 Selected: ${formData.poFileName}` : "Click to select PDF/Image/Word PO"}
                  </span>
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Preferred Delivery Date</label>
                <input 
                  type="date" 
                  value={formData.deliveryDate}
                  onChange={(e) => setFormData({...formData, deliveryDate: e.target.value})}
                  style={{ width: '100%', padding: '12px', border: '1px solid var(--border)', borderRadius: '8px' }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Payment Method</label>
                <select 
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                  style={{ width: '100%', padding: '12px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}
                >
                  <option value="Pay Now">Pay Now (Card/Momo via Paystack)</option>
                  {activeUser && <option value="Account Credit">Use NBT Account Credit</option>}
                  <option value="Credit Terms (30 Days)">Approved Credit Terms (30 Days)</option>
                  <option value="Manual Bank Transfer">Manual Bank Transfer</option>
                </select>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Delivery Notes / Instructions</label>
                <textarea 
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  style={{ width: '100%', padding: '12px', border: '1px solid var(--border)', borderRadius: '8px', minHeight: '60px' }}
                  placeholder="e.g. Please deliver to central loading dock."
                />
              </div>
            </div>
          </div>

          <div style={{ padding: '2rem', background: 'var(--bg-surface)', borderTop: '1px solid var(--border)', display: 'flex', gap: '1rem' }}>
            <button 
              type="button"
              className="btn" 
              style={{ padding: '15px', flex: 1, border: '1px solid var(--border)', borderRadius: '8px' }}
              onClick={() => setIsCheckout(false)}
              disabled={isSubmitting}
            >
              Back
            </button>
            <button 
              type="submit"
              className="btn btn-primary" 
              style={{ padding: '15px', flex: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Processing...' : 'Submit B2B Order 💬'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default Cart;
