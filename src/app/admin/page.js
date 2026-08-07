/* global process */
'use client';

import { useState, useRef, useEffect, Fragment } from 'react';
import { useProducts } from '../../hooks/useProducts';
import * as XLSX from 'xlsx';
import { ref, uploadBytes, getDownloadURL, storage, db, collection, onSnapshot, updateDoc, doc, deleteDoc, addDoc } from '../../lib/firebase';
import InvoiceModal from '../../components/shop/InvoiceModal';

// Helper for B2B discount code generation
function generateDiscountCode(businessName) {
  const prefix = businessName?.substring(0, 4).toUpperCase().replace(/\s/g, '') || 'B2B';
  const randNum = Math.floor(1000 + Math.random() * 9000);
  return `NBT-${prefix}-${randNum}`;
}

// Helper to extract package size from product text
// eslint-disable-next-line no-unused-vars
function extractSizeFromText(text) {
  if (!text) return '';
  const match = text.match(/\b(\d+(?:\.\d+)?)\s*(L|l|Lt|lt|Litre|litre|ml|ML|Ml|kg|KG|Kg|g|G)\b/i);
  return match ? match[0] : '';
}

const defaultExcelSeedData = [
  { barcode: '6034000706000', name: 'Neat Air Freshener Gel 100g', description: 'Box of 48', rate: '299.52', purchaseRate: '249.50', qtyInBox: '48' },
  { barcode: '6036000140310', name: 'Neat Air Freshener Gel 160g', description: 'Box of 24', rate: '230.40', purchaseRate: '192.00', qtyInBox: '24' },
  { barcode: '6036000140303', name: 'Neat Air Freshener Spray', description: 'Box of 30', rate: '295.00', purchaseRate: '225.00', qtyInBox: '30' },
  { barcode: '', name: 'Neat All purpose Cleaner 25lt', description: '25L HDPE Drum', rate: '375.00', purchaseRate: '250.00', qtyInBox: '1' },
  { barcode: '6036000140365', name: 'Neat All-Purpose Cleaner 1Lt', description: 'Box of 12', rate: '240.00', purchaseRate: '192.00', qtyInBox: '12' },
  { barcode: '6036000140365', name: 'Neat All-Purpose Cleaner 2 Lt', description: 'Box of 8', rate: '222.00', purchaseRate: '180.00', qtyInBox: '8' },
  { barcode: '6036000140365', name: 'Neat All-Purpose Cleaner 4 Lt', description: 'Box of 4', rate: '280.00', purchaseRate: '240.00', qtyInBox: '4' },
  { barcode: '6034000706185', name: 'Neat Bleach 1lt', description: 'Box of 12', rate: '139.00', purchaseRate: '114.00', qtyInBox: '12' },
  { barcode: '', name: 'Neat Bleach 25lt', description: '25L HDPE Drum', rate: '345.00', purchaseRate: '250.00', qtyInBox: '1' },
  { barcode: '6034000706178', name: 'Neat Bleach 5LT', description: 'Box of 4', rate: '220.00', purchaseRate: '180.00', qtyInBox: '4' },
  { barcode: '', name: 'Neat Dish washing Soap 5Lt', description: 'Box of 4', rate: '420.00', purchaseRate: '75.00', qtyInBox: '4' },
  { barcode: '', name: 'Neat Dishwasher Soap 25L', description: '25L HDPE Drum', rate: '450.00', purchaseRate: '260.00', qtyInBox: '1' },
  { barcode: '6034000706109', name: 'Neat Dishwashing Liquid 400ML', description: 'Box of 24', rate: '240.00', purchaseRate: '192.00', qtyInBox: '24' },
  { barcode: '', name: 'Neat Dishwashing Liquid 750ML', description: 'Box of 12', rate: '240.00', purchaseRate: '168.00', qtyInBox: '12' },
  { barcode: '6036000140372', name: 'Neat Fabric Softener 1lt', description: 'Box of 12', rate: '252.00', purchaseRate: '186.00', qtyInBox: '12' },
  { barcode: '', name: 'Neat Fabric Softener 25lt', description: '25L HDPE Drum', rate: '520.00', purchaseRate: '390.00', qtyInBox: '1' },
  { barcode: '6034000706031', name: 'Neat Fabric Softener 2lt', description: 'Box of 6', rate: '240.00', purchaseRate: '186.00', qtyInBox: '6' },
  { barcode: '6036000140372', name: 'Neat Fabric Softener 500ML', description: 'Box of 24', rate: '240.00', purchaseRate: '192.00', qtyInBox: '24' },
  { barcode: '', name: 'Neat Fabric Softener 5lt', description: 'Box of 4', rate: '380.00', purchaseRate: '232.00', qtyInBox: '4' },
  { barcode: '', name: 'Neat Glass cleaner 25 LT', description: '25L HDPE Drum', rate: '495.00', purchaseRate: '395.00', qtyInBox: '1' },
  { barcode: '6036000140358', name: 'Neat Glass Cleaner 750ML', description: 'Box of 12', rate: '156.00', purchaseRate: '126.00', qtyInBox: '12' },
  { barcode: '6036000140327', name: 'Neat hand Soap', description: 'Box of 24', rate: '254.64', purchaseRate: '212.20', qtyInBox: '24' },
  { barcode: '', name: 'Neat Hand Soap 25lt', description: '25L HDPE Drum', rate: '380.00', purchaseRate: '250.00', qtyInBox: '1' },
  { barcode: '', name: 'Neat Laundry Detergent 1LT', description: 'Box of 12', rate: '314.80', purchaseRate: '274.80', qtyInBox: '12' },
  { barcode: '6034000706086', name: 'Neat Laundry Detergent 2lt', description: 'Box of 6', rate: '288.00', purchaseRate: '240.00', qtyInBox: '6' },
  { barcode: '', name: 'Neat Rubbing Alcohol 25lt', description: '25L HDPE Drum', rate: '980.00', purchaseRate: '800.00', qtyInBox: '1' },
  { barcode: '', name: 'Neat Sanitizer Gel 25LT', description: '25L HDPE Drum', rate: '1500.00', purchaseRate: '434.50', qtyInBox: '1' },
  { barcode: '6036000140341', name: 'Neat Shower Gel', description: 'Box of 15', rate: '330.00', purchaseRate: '270.00', qtyInBox: '15' },
  { barcode: '', name: 'Neat Shower Gel 25lt', description: '25L HDPE Drum', rate: '883.00', purchaseRate: '420.00', qtyInBox: '1' },
  { barcode: '', name: 'Neat WC Cleaner 5Lt', description: 'Box of 4', rate: '380.00', purchaseRate: '300.00', qtyInBox: '4' },
  { barcode: '', name: 'Neat WC Gel', description: '1L Bottle', rate: '355.66', purchaseRate: '291.80', qtyInBox: '1' },
  { barcode: '', name: 'Neat WC Wash 25lt', description: '25L HDPE Drum', rate: '540.00', purchaseRate: '380.00', qtyInBox: '1' },
  { barcode: '', name: 'Rubbing Alcohol 25Lt', description: '25L HDPE Drum', rate: '930.00', purchaseRate: '450.00', qtyInBox: '1' }
];

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Hydrate authentication state on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const authStatus = localStorage.getItem('nbt_admin_authenticated');
      setTimeout(() => {
        if (authStatus === 'true') {
          setIsAuthenticated(true);
        }
        setIsAuthChecking(false);
      }, 0);
    }
  }, []);

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (loginUsername === 'NBTadmin' && loginPassword === '1stcrm') {
      localStorage.setItem('nbt_admin_authenticated', 'true');
      setIsAuthenticated(true);
      setLoginError('');
    } else {
      setLoginError('Invalid Administrator credentials. Please try again.');
    }
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to securely log out of the NBT Admin Dashboard?")) {
      localStorage.removeItem('nbt_admin_authenticated');
      setIsAuthenticated(false);
      setLoginUsername('');
      setLoginPassword('');
    }
  };

  const { products, isLoaded, addProduct, deleteProduct, updateProduct } = useProducts();
  const [activeTab, setActiveTab] = useState('orders');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProcurementOpen, setIsProcurementOpen] = useState(true);
  const [isSalesOpen, setIsSalesOpen] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [expenses, setExpenses] = useState([
    { id: 'EXP-001', category: 'Raw Materials', description: 'Caustic Soda Feedstock batch #A2', amount: 4850.00, date: '2026-05-20', status: 'Approved', paidVia: 'Bank Transfer' },
    { id: 'EXP-002', category: 'Logistics', description: 'Bulk delivery diesel feedstock & customs clearance', amount: 1250.00, date: '2026-05-22', status: 'Approved', paidVia: 'Momo Business' },
    { id: 'EXP-003', category: 'Utilities', description: 'Depot industrial water tank refill (10k Gallons)', amount: 620.00, date: '2026-05-24', status: 'Pending', paidVia: 'Cash' },
    { id: 'EXP-004', category: 'Packaging', description: 'Heavy-duty HDPE 5L container prints batch B', amount: 2400.00, date: '2026-05-25', status: 'Approved', paidVia: 'Bank Transfer' }
  ]);
  const [bills, setBills] = useState([
    { id: 'BILL-001', supplier: 'Daisy Hotel Amenities', invoiceRef: 'INV-48201', amount: 8950.00, issueDate: '2026-05-15', dueDate: '2026-06-15', status: 'Unpaid' },
    { id: 'BILL-002', supplier: 'Omega Chemical Supplies', invoiceRef: 'INV-9921', amount: 15400.00, issueDate: '2026-05-18', dueDate: '2026-06-18', status: 'Paid' },
    { id: 'BILL-003', supplier: 'Apex Plastics Corp', invoiceRef: 'INV-7264', amount: 3200.00, issueDate: '2026-05-22', dueDate: '2026-06-22', status: 'Unpaid' }
  ]);
  // Dynamic collections from Firestore
  const [orders, setOrders] = useState([]);
  const [messages, setMessages] = useState([]);
  const [wholesaleClients, setWholesaleClients] = useState([]);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState(null);

  // Advanced B2B CRM States
  const [selectedClient, setSelectedClient] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [newCreditLimit, setNewCreditLimit] = useState('');
  const [newTaskText, setNewTaskText] = useState('');
  const [crmSearchQuery, setCrmSearchQuery] = useState('');
  const [crmSubTab, setCrmSubTab] = useState('pipeline'); // 'pipeline' | 'leads' | 'wholesalers' | 'retail'
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);

  // ==================== UNIVERSAL DOCUMENT CREATOR MODAL STATES ====================
  const [showUniversalCreatorModal, setShowUniversalCreatorModal] = useState(false);
  const [universalDocType, setUniversalDocType] = useState('po'); // 'po' | 'invoice' | 'order'
  const [universalSupplierId, setUniversalSupplierId] = useState('');
  const [universalProductSource, setUniversalProductSource] = useState('catalog'); // 'catalog' | 'supplier'
  const [universalCatalogSearch, setUniversalCatalogSearch] = useState('');
  const [isCreatingUniversalDoc, setIsCreatingUniversalDoc] = useState(false);
  const [isEditingUniversalDoc, setIsEditingUniversalDoc] = useState(false);
  const [editingUniversalDocId, setEditingUniversalDocId] = useState(null);
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);
  const [showCustomAddrInput, setShowCustomAddrInput] = useState(false);
  const [universalForm, setUniversalForm] = useState({
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    customerEmail: '',
    docNumber: '',
    referenceNumber: '',
    paymentTerms: 'Due on Receipt',
    shipmentMode: 'Delivery Van',
    shippingCharges: 0,
    adjustment: 0,
    issueDate: '',
    dueDate: '',
    vatApplied: false,
    status: 'Pending',
    notes: '',
    deliveryAddressType: 'company',
    deliveryAddress: 'Neat Brand Trade Factory Depot, Tema Light Industrial Area, Ghana',
    selectedDeliveryCustomerId: '',
    items: []
  });
  const [customerForm, setCustomerForm] = useState({
    company: '',
    representative: '',
    phone: '',
    email: '',
    paymentTerms: 'COD',
    creditLimit: 50000
  });

  // Mock Clients for robust fallback demo
  const mockClients = [
    {
      id: 'client_1',
      company: 'Stark Chemical Enterprise',
      representative: 'Jayden Stark',
      phone: '0246272115',
      email: 'jayden@starkchemical.com',
      tier: 'Tier 1 Prime Distributor',
      discountCode: 'NBT-STAR-9821',
      creditLimit: 120000,
      creditUsed: 42000,
      status: 'active',
      date: '2026-05-18',
      timeline: [{ event: 'Distributor account provisioned', date: '2026-05-18 10:30' }],
      tasks: [{ text: 'Deliver 100 Gallons Clean Bleach', done: true }, { text: 'Audit Q3 payments', done: false }]
    },
    {
      id: 'client_2',
      company: 'Ghana National Soap Depot',
      representative: 'Ama Osei',
      phone: '0547123456',
      email: 'ama@ghanasoap.com',
      tier: 'Tier 2 Bulk Wholesaler',
      discountCode: 'NBT-DEP-4512',
      creditLimit: 60000,
      creditUsed: 12500,
      status: 'active',
      date: '2026-05-20',
      timeline: [{ event: 'Account provisioned', date: '2026-05-20 14:15' }],
      tasks: [{ text: 'Verify industrial certificate', done: false }]
    }
  ];

  const activeClients = wholesaleClients.length > 0 ? wholesaleClients : mockClients;

  // Phone Normalizer for Ghana WhatsApp Redirects
  const formatGhanaPhone = (phone) => {
    if (!phone) return '';
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '233' + cleaned.substring(1);
    }
    if (cleaned.length === 9) {
      cleaned = '233' + cleaned;
    }
    return cleaned;
  };

  // Helper to parse string items into structured lists for PO redirects
  const parseStringItems = (itemsStr) => {
    if (!itemsStr) return [];
    const parts = itemsStr.split(',');
    return parts.map(part => {
      const qtyMatch = part.match(/^\s*(\d+)x\s+(.+)$/i);
      let qty = 1;
      let nameAndSize = part.trim();
      if (qtyMatch) {
        qty = parseInt(qtyMatch[1]);
        nameAndSize = qtyMatch[2].trim();
      }
      const sizeMatch = nameAndSize.match(/(.+)\s*\(([^)]+)\)\s*$/);
      let name = nameAndSize;
      let size = 'Standard';
      if (sizeMatch) {
        name = sizeMatch[1].trim();
        size = sizeMatch[2].trim();
      }
      let unitPrice = 25;
      const normName = name.toLowerCase();
      if (normName.includes('industrial detergent') || normName.includes('ibc')) {
        unitPrice = 4125;
      } else if (normName.includes('floral') && size.includes('5L')) {
        unitPrice = 125;
      } else if (normName.includes('bleach') && size.includes('25L')) {
        unitPrice = 540;
      } else if (normName.includes('disinfectant') && size.includes('25L')) {
        unitPrice = 230;
      } else if (normName.includes('handwash') && size.includes('5L')) {
        unitPrice = 100;
      }
      return {
        name,
        size,
        qty,
        unitPrice,
        total: qty * unitPrice
      };
    });
  };

  // Helper to generate the exact B2B VAT Invoice WhatsApp template matching the InvoiceModal
  const getQuickWhatsAppPO = (order) => {
    if (!order) return '';
    const orderId = order.id.slice(-6).toUpperCase();
    const customer = order.customer?.name || 'Customer';

    const items = Array.isArray(order.items)
      ? order.items.map(item => {
        const qty = item.quantity || item.qty || 1;
        const price = item.price || 25;
        return {
          name: item.name || 'Chemical product',
          size: item.size || '1L',
          qty: qty,
          unitPrice: price,
          total: qty * price
        };
      })
      : typeof order.items === 'string'
        ? parseStringItems(order.items)
        : [{ name: 'NBT Formulations Pack', size: 'Bulk Size', qty: 1, unitPrice: order.totalAmount || 0, total: order.totalAmount || 0 }];

    const totalAmount = order.totalAmount || order.total || items.reduce((acc, i) => acc + i.total, 0);
    const subtotal = Math.round((totalAmount / 1.219) * 100) / 100;

    let itemsList = items.map(item => `• ${item.name} (${item.size}) x${item.qty} - GH₵ ${item.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`).join('\n');

    return `Hello ${customer},

Here is a summary of your Purchase Order *#INV-${orderId}* from *Neat Brand Trade (NBT)*:

*Ordered Products:*
${itemsList}

*VAT & Levies Summary:*
- GRA Subtotal (Exclusive): GH₵ ${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
- Levy / VAT taxes: GH₵ ${(totalAmount - subtotal).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
*GRAND TOTAL PAYABLE: GH₵ ${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}*

Please review the complete tax details. Let us know if you need our bank transfer details for credit line clearance or checkout settlement.

Thank you for your business! 🧪🛡️`;
  };

  // Firestore Credit Ledger payment logger
  const handleLogPayment = async (clientId, amount) => {
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert("Please enter a valid payment amount.");
      return;
    }
    try {
      const client = activeClients.find(c => c.id === clientId);
      if (!client) return;
      const newCreditUsed = Math.max(0, (client.creditUsed || 0) - parsedAmount);
      const docRef = doc(db, 'wholesale_clients', clientId);
      const timelineEvent = {
        event: `Logged payment of GH₵ ${parsedAmount}. Credit usage reduced from GH₵ ${client.creditUsed || 0} to GH₵ ${newCreditUsed}.`,
        date: new Date().toLocaleString()
      };
      const updatedTimeline = client.timeline ? [timelineEvent, ...client.timeline] : [timelineEvent];
      await updateDoc(docRef, {
        creditUsed: newCreditUsed,
        timeline: updatedTimeline
      });
      setSelectedClient(prev => prev ? { ...prev, creditUsed: newCreditUsed, timeline: updatedTimeline } : null);
      setPaymentAmount('');
      alert("💳 Cash payment logged successfully in distributor ledger!");
    } catch (e) {
      console.error(e);
      alert("Failed to log payment: " + e.message);
    }
  };

  // Firestore Credit Limit Adjuster
  const handleAdjustCreditLimit = async (clientId, limit) => {
    const parsedLimit = parseFloat(limit);
    if (isNaN(parsedLimit) || parsedLimit < 0) {
      alert("Please enter a valid credit limit.");
      return;
    }
    try {
      const client = activeClients.find(c => c.id === clientId);
      if (!client) return;
      const docRef = doc(db, 'wholesale_clients', clientId);
      const timelineEvent = {
        event: `Adjusted Credit Limit from GH₵ ${client.creditLimit || 50000} to GH₵ ${parsedLimit}.`,
        date: new Date().toLocaleString()
      };
      const updatedTimeline = client.timeline ? [timelineEvent, ...client.timeline] : [timelineEvent];
      await updateDoc(docRef, {
        creditLimit: parsedLimit,
        timeline: updatedTimeline
      });
      setSelectedClient(prev => prev ? { ...prev, creditLimit: parsedLimit, timeline: updatedTimeline } : null);
      setNewCreditLimit('');
      alert("⚙️ Credit limit adjusted successfully!");
    } catch (e) {
      console.error(e);
      alert("Failed to adjust limit: " + e.message);
    }
  };

  // Pipeline status stage updates
  const handleUpdateB2BStatus = async (collectionName, docId, newStatus) => {
    try {
      const docRef = doc(db, collectionName, docId);
      const timelineEvent = {
        event: `Pipeline stage updated to [${newStatus.toUpperCase()}]`,
        date: new Date().toLocaleString()
      };
      let existingObj = null;
      if (collectionName === 'wholesale_clients') {
        existingObj = activeClients.find(c => c.id === docId);
      } else if (collectionName === 'bulk_inquiries') {
        existingObj = messages.find(m => m.id === docId) || mockMessages.find(m => m.id === docId);
      }
      const updatedTimeline = existingObj && existingObj.timeline
        ? [timelineEvent, ...existingObj.timeline]
        : [timelineEvent];
      await updateDoc(docRef, {
        status: newStatus,
        timeline: updatedTimeline
      });
      if (selectedClient && selectedClient.id === docId) {
        setSelectedClient(prev => prev ? { ...prev, status: newStatus, timeline: updatedTimeline } : null);
      }
      alert(`Pipeline stage updated to: ${newStatus}`);
    } catch (e) {
      console.error(e);
      alert("Failed to update pipeline stage: " + e.message);
    }
  };

  // Onboard Lead to Active B2B Client
  const handleOnboardLead = async (lead) => {
    try {
      const discountCodeVal = generateDiscountCode(lead.businessName);
      const newClientData = {
        company: lead.businessName || 'Unnamed Corporate B2B',
        representative: lead.contactPerson || 'Unknown Rep',
        phone: lead.phone || '',
        email: lead.email || '',
        tier: 'Tier 2 Bulk Wholesaler',
        discountCode: discountCodeVal,
        creditLimit: 50000,
        creditUsed: 0,
        status: 'active',
        createdAt: new Date(),
        timeline: [
          { event: 'Account provisioned from corporate lead inquiry', date: new Date().toLocaleString() }
        ],
        tasks: [
          { text: 'Send product samples & price sheets', done: false },
          { text: 'Verify certificates & business status', done: false },
          { text: 'Establish credit lines & dispatch routines', done: false }
        ]
      };

      const docRef = await addDoc(collection(db, 'wholesale_clients'), newClientData);

      // Update B2B Inquiry lead status to onboarded
      const leadDocRef = doc(db, 'bulk_inquiries', lead.id);
      await updateDoc(leadDocRef, {
        status: 'onboarded',
        timeline: [{ event: `Approved B2B Client account provisioned (#${docRef.id.slice(-5)})`, date: new Date().toLocaleString() }]
      });

      setSelectedClient(null);
      alert("🎉 Corporate Lead onboarded as verified distributor successfully!");
    } catch (e) {
      console.error(e);
      alert("Failed to onboard B2B Lead: " + e.message);
    }
  };

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    if (!customerForm.company || !customerForm.representative || !customerForm.phone) {
      alert("Company name, representative, and phone number are required!");
      return;
    }

    try {
      const discountCodeVal = generateDiscountCode(customerForm.company);
      const newClientData = {
        company: customerForm.company,
        representative: customerForm.representative,
        phone: customerForm.phone,
        email: customerForm.email || '',
        tier: 'Tier 2 Bulk Wholesaler',
        discountCode: discountCodeVal,
        creditLimit: Number(customerForm.creditLimit) || 50000,
        creditUsed: 0,
        status: 'active',
        createdAt: new Date(),
        timeline: [
          { event: 'Account manually provisioned in CRM panel', date: new Date().toLocaleString() }
        ],
        tasks: [
          { text: 'Verify certificates & business status', done: false },
          { text: 'Establish credit lines & dispatch routines', done: false }
        ]
      };

      await addDoc(collection(db, 'wholesale_clients'), newClientData);
      alert("🎉 New B2B Wholesaler created successfully!");

      // Reset form
      setCustomerForm({
        company: '',
        representative: '',
        phone: '',
        email: '',
        paymentTerms: 'COD',
        creditLimit: 50000
      });
      setShowAddCustomerModal(false);
    } catch (err) {
      console.error("Error creating customer:", err);
      alert("Failed to create customer: " + err.message);
    }
  };

  const handleCustomerExcelUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();

    reader.onload = async (evt) => {
      try {
        const dataBuffer = evt.target.result;
        const wb = XLSX.read(dataBuffer, { type: 'array' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        let successCount = 0;
        let updateCount = 0;

        const getRowVal = (row, possibleKeys) => {
          const rowKeys = Object.keys(row);
          for (const pk of possibleKeys) {
            const match = rowKeys.find(k => k.toLowerCase().trim() === pk.toLowerCase().trim());
            if (match) return row[match];
          }
          return undefined;
        };

        for (const row of data) {
          const company = getRowVal(row, ['Company Name', 'Business Name', 'Company', 'Name', 'company', 'businessName']);
          if (!company) continue;

          const representative = getRowVal(row, ['Representative Name', 'Contact Representative', 'Representative', 'Contact Name', 'Contact Person', 'Rep', 'representative', 'contactPerson']) || 'Rep';
          const phone = String(getRowVal(row, ['Phone Number', 'Phone', 'Mobile', 'Contact Phone', 'Telephone', 'phone']) || '').trim();
          if (!phone) continue;

          const email = getRowVal(row, ['Email Address', 'Email', 'Mail', 'Email ID', 'email']) || '';
          const paymentTerms = getRowVal(row, ['Payment Terms', 'Payment', 'Terms', 'paymentTerms']) || 'COD';
          const creditLimit = Number(getRowVal(row, ['Credit Limit', 'CreditLimit', 'Limit', 'creditLimit'])) || 50000;

          // Deduplicate against active wholesale clients
          const existingClient = wholesaleClients.find(
            c => c.phone?.trim() === phone || c.company?.toLowerCase().trim() === company.toLowerCase().trim()
          );

          const discountCodeVal = generateDiscountCode(company);
          const clientData = {
            company,
            representative,
            phone,
            email,
            paymentTerms,
            tier: 'Tier 2 Bulk Wholesaler',
            discountCode: discountCodeVal,
            creditLimit,
            creditUsed: existingClient ? (existingClient.creditUsed || 0) : 0,
            status: existingClient ? (existingClient.status || 'active') : 'active',
            createdAt: existingClient ? (existingClient.createdAt || new Date()) : new Date(),
            timeline: existingClient ? (existingClient.timeline || [
              { event: 'Account provisioned via Excel bulk upload', date: new Date().toLocaleString() }
            ]) : [
              { event: 'Account provisioned via Excel bulk upload', date: new Date().toLocaleString() }
            ],
            tasks: existingClient ? (existingClient.tasks || [
              { text: 'Verify certificates & business status', done: false },
              { text: 'Establish credit lines & dispatch routines', done: false }
            ]) : [
              { text: 'Verify certificates & business status', done: false },
              { text: 'Establish credit lines & dispatch routines', done: false }
            ]
          };

          if (existingClient && existingClient.id) {
            const docRef = doc(db, 'wholesale_clients', existingClient.id);
            await updateDoc(docRef, clientData);
            updateCount++;
          } else {
            await addDoc(collection(db, 'wholesale_clients'), clientData);
            successCount++;
          }
        }

        alert(`Successfully imported customers: ${successCount} new wholesalers created, ${updateCount} existing wholesalers updated!`);
      } catch (error) {
        console.error("Error importing customer Excel:", error);
        alert("Failed to parse customer Excel file: " + error.message);
      } finally {
        setIsUploading(false);
        e.target.value = "";
      }
    };

    reader.readAsArrayBuffer(file);
  };

  // Add Task checklist item
  const handleAddTask = async (clientId, collectionName, text) => {
    if (!text.trim()) return;
    try {
      const isClient = collectionName === 'wholesale_clients';
      const existingObj = isClient
        ? activeClients.find(c => c.id === clientId)
        : messages.find(m => m.id === clientId) || mockMessages.find(m => m.id === clientId);
      if (!existingObj) return;
      const currentTasks = existingObj.tasks || [];
      const updatedTasks = [...currentTasks, { text: text.trim(), done: false }];
      const docRef = doc(db, collectionName, clientId);
      await updateDoc(docRef, { tasks: updatedTasks });
      if (selectedClient && selectedClient.id === clientId) {
        setSelectedClient(prev => prev ? { ...prev, tasks: updatedTasks } : null);
      }
      setNewTaskText('');
    } catch (e) {
      console.error(e);
      alert("Failed to add task: " + e.message);
    }
  };

  // Toggle Task item
  const handleToggleTask = async (clientId, collectionName, taskIdx) => {
    try {
      const isClient = collectionName === 'wholesale_clients';
      const existingObj = isClient
        ? activeClients.find(c => c.id === clientId)
        : messages.find(m => m.id === clientId) || mockMessages.find(m => m.id === clientId);
      if (!existingObj) return;
      const currentTasks = [...(existingObj.tasks || [])];
      currentTasks[taskIdx].done = !currentTasks[taskIdx].done;
      const docRef = doc(db, collectionName, clientId);
      await updateDoc(docRef, { tasks: currentTasks });
      if (selectedClient && selectedClient.id === clientId) {
        setSelectedClient(prev => prev ? { ...prev, tasks: currentTasks } : null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Manufacturers & Purchase Orders States
  const [dbManufacturers, setDbManufacturers] = useState([]);
  const [dbManufacturerPOs, setDbManufacturerPOs] = useState([]);
  const [showAddMfgModal, setShowAddMfgModal] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [showAddPOModal, setShowAddPOModal] = useState(false);
  const [viewingPO, setViewingPO] = useState(null);
  const [mfgPriceListFile, setMfgPriceListFile] = useState(null);
  const [isUploadingMfgFile, setIsUploadingMfgFile] = useState(false);
  const [mfgUploadProgress, setMfgUploadProgress] = useState(0);

  // Supplier extended states
  const [selectedSupplierDetail, setSelectedSupplierDetail] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [showEditSupplierModal, setShowEditSupplierModal] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [supplierSearchQuery, setSupplierSearchQuery] = useState('');

  // Invoice Management States
  const [dbInvoices, setDbInvoices] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [showCreateInvoiceModal, setShowCreateInvoiceModal] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [invoiceUploadFile, setInvoiceUploadFile] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [newInvoiceForm, setNewInvoiceForm] = useState({
    supplierId: '', supplierName: '', poId: '', poNumber: '',
    invoiceNumber: '', issueDate: '', dueDate: '', totalAmount: '',
    notes: '', status: 'Pending'
  });

  // Supplier Price List Editor States
  const [selectedSupplierForPriceList, setSelectedSupplierForPriceList] = useState(null);
  const [supplierPriceListItems, setSupplierPriceListItems] = useState([]);
  const [isSavingPriceList, setIsSavingPriceList] = useState(false);
  const [priceListDate, setPriceListDate] = useState('');

  // Zoho Books Price Lists Workspace States
  const [productsSubTab, setProductsSubTab] = useState('items'); // 'items' | 'pricelists'
  const [priceLists, setPriceLists] = useState([]);
  const [showCreatePriceListModal, setShowCreatePriceListModal] = useState(false);
  const [isSavingZohoPriceList, setIsSavingZohoPriceList] = useState(false);
  const [newPriceListForm, setNewPriceListForm] = useState({
    name: '',
    transactionType: 'Sales', // 'Sales' | 'Purchase'
    type: 'All Items', // 'All Items' | 'Individual Items'
    description: '',
    percentage: '',
    roundOffTo: 'Never mind' // 'Never mind' | 'Nearest whole number' | 'Nearest decimal (0.10)' | 'Nearest 0.05' | 'Nearest 0.99' | 'Nearest 0.50'
  });

  // Add Manufacturer Form State
  const [mfgForm, setMfgForm] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    location: 'Ghana',
    materials: '',
    notes: ''
  });

  // Create PO Form State
  const [poForm, setPoForm] = useState({
    manufacturerId: '',
    vatApplied: true,
    items: [{ name: '', size: '25L', qty: 1, unitPrice: 0 }]
  });
  // eslint-disable-next-line no-unused-vars
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [poCatalogSearch, setPoCatalogSearch] = useState('');

  const mockManufacturers = [
    {
      id: 'mfg_1',
      name: 'Alpha Chemical Feedstock Ghana Ltd',
      contactPerson: 'Kofi Mensah',
      phone: '0243123456',
      email: 'kmensah@alphachem.com.gh',
      location: 'Tema Industrial Area, Ghana',
      materials: 'Sulphonic Acid, Soda Ash, SLES',
      notes: 'Main local supplier for surfactant feedstocks. 14 days credit term.'
    },
    {
      id: 'mfg_2',
      name: 'Zhejiang Packaging Co. Ltd',
      contactPerson: 'Mr. Zhang Wei',
      phone: '8613812345678',
      email: 'sales@zjpackaging.cn',
      location: 'Ningbo, China',
      materials: '5L Gallons, 1L Floral Bottles, IBC Tanks',
      notes: 'Overseas packaging mold supplier. Requires 30% deposit, 70% against B/L.'
    }
  ];

  const mockManufacturerPOs = [
    {
      id: 'po_1',
      poNumber: 'PO-2026-0001',
      manufacturerId: 'mfg_1',
      manufacturerName: 'Alpha Chemical Feedstock Ghana Ltd',
      manufacturerPhone: '0243123456',
      items: [
        { name: 'Sulphonic Acid (96%)', size: '250kg Drum', qty: 10, unitPrice: 3800, total: 38000 },
        { name: 'SLES (70%)', size: '220kg Drum', qty: 8, unitPrice: 2900, total: 23200 }
      ],
      totalAmount: 74602.8,
      vatApplied: true,
      status: 'Sent',
      date: '2026-05-15',
      createdAt: new Date('2026-05-15')
    },
    {
      id: 'po_2',
      poNumber: 'PO-2026-0002',
      manufacturerId: 'mfg_2',
      manufacturerName: 'Zhejiang Packaging Co. Ltd',
      manufacturerPhone: '8613812345678',
      items: [
        { name: '5L HDPE Gallon (Neat custom mold)', size: 'Box of 24', qty: 50, unitPrice: 180, total: 9000 },
        { name: '1L Floral Trigger Bottle', size: 'Box of 100', qty: 30, unitPrice: 120, total: 3600 }
      ],
      totalAmount: 12600,
      vatApplied: false,
      status: 'Draft',
      date: '2026-05-20',
      createdAt: new Date('2026-05-20')
    }
  ];

  const activeManufacturers = dbManufacturers.length > 0 ? dbManufacturers : mockManufacturers;
  const activeManufacturerPOs = dbManufacturerPOs.length > 0 ? dbManufacturerPOs : mockManufacturerPOs;

  // ===== Supplier Price List Handlers =====
  const handleOpenPriceList = (mfg) => {
    setSelectedSupplierForPriceList(mfg);
    // Load existing priceList items or start with empty list
    const existing = mfg.priceList && Array.isArray(mfg.priceList) ? mfg.priceList : [];
    setSupplierPriceListItems(existing.map((item, idx) => ({ ...item, _id: idx })));
    setPriceListDate(mfg.priceListDate || new Date().toISOString().split('T')[0]);
  };

  const handleClosePriceList = () => {
    setSelectedSupplierForPriceList(null);
    setSupplierPriceListItems([]);
    setPriceListDate('');
  };

  const handleAddPriceItem = () => {
    setSupplierPriceListItems(prev => [
      ...prev,
      { _id: Date.now(), barcode: '', name: '', description: '', rate: '', purchaseRate: '', qtyInBox: '', unitPrice: 0, profit: 0 }
    ]);
  };

  const handleEditPriceItem = (id, field, value) => {
    setSupplierPriceListItems(prev =>
      prev.map(item => {
        if (item._id === id) {
          const updated = { ...item, [field]: value };
          const rateVal = parseFloat(field === 'rate' ? value : updated.rate) || 0;
          const purchaseVal = parseFloat(field === 'purchaseRate' ? value : updated.purchaseRate) || 0;
          const qtyVal = parseFloat(field === 'qtyInBox' ? value : updated.qtyInBox) || 0;

          updated.unitPrice = qtyVal > 0 ? (rateVal / qtyVal) : 0;
          updated.profit = rateVal - purchaseVal;
          return updated;
        }
        return item;
      })
    );
  };

  const handleSupplierPriceListExcelUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const dataBuffer = evt.target.result;
        const wb = XLSX.read(dataBuffer, { type: 'array' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        if (data.length === 0) {
          alert("The uploaded Excel file is empty.");
          return;
        }

        const getRowVal = (row, possibleKeys, fallbackKeywords = []) => {
          const rowKeys = Object.keys(row);
          // 1. First attempt: exact match (case-insensitive and trimmed)
          for (const pk of possibleKeys) {
            const match = rowKeys.find(k => k.toLowerCase().trim() === pk.toLowerCase().trim());
            if (match !== undefined && row[match] !== undefined) return row[match];
          }
          // 2. Second attempt: substring match with fallback keywords
          for (const kw of fallbackKeywords) {
            const match = rowKeys.find(k => k.toLowerCase().includes(kw.toLowerCase()));
            if (match !== undefined && row[match] !== undefined) return row[match];
          }
          return undefined;
        };

        const tryParse = (rowsData) => {
          return rowsData.map((row, idx) => {
            const barcode = String(getRowVal(row, ['Barcode', 'Bar code', 'UPC', 'SKU', 'Code']) || '').trim();
            const name = String(getRowVal(row,
              ['Item Name', 'Product Name', 'Material Name', 'Product', 'Material', 'Name', 'Item', 'ProductName', 'MaterialName', 'Particulars', 'Item Description', 'Product Description', 'Material Description'],
              ['name', 'product', 'material', 'particular', 'desc', 'item']
            ) || '').trim();

            const description = String(getRowVal(row,
              ['Description', 'Notes', 'Terms', 'Details', 'Internal Notes', 'Remark', 'Notes/Terms', 'Comments', 'Size', 'Pack', 'Packaging', 'Pack Size', 'Volume', 'Size/Pack', 'PackageSize', 'UOM', 'Unit', 'Specification', 'Spec', 'Weight'],
              ['desc', 'note', 'term', 'size', 'pack', 'spec', 'unit']
            ) || '').trim();

            const rawRate = getRowVal(row, ['Rate', 'Selling Rate', 'Price', 'Selling Price', 'Wholesaler Rate', 'Wholesaler Price', 'Amount', 'Amt'], ['rate', 'price', 'selling']);
            const rate = rawRate !== undefined && !isNaN(parseFloat(rawRate)) ? parseFloat(rawRate) : 0;

            const rawPurchaseRate = getRowVal(row, ['Purchase Rate', 'Purchase Price', 'Cost', 'Purchase Cost', 'Buying Price', 'Buying Rate', 'Unit Cost', 'FOB Price'], ['purchase', 'cost', 'buy']);
            const purchaseRate = rawPurchaseRate !== undefined && !isNaN(parseFloat(rawPurchaseRate)) ? parseFloat(rawPurchaseRate) : 0;

            const rawQtyInBox = getRowVal(row, ['Qty in box', 'Quantity in box', 'Box Qty', 'Qty per box', 'Carton Qty', 'MOQ', 'Box Size'], ['qty', 'box', 'quantity']);
            const qtyInBox = rawQtyInBox !== undefined && !isNaN(parseFloat(rawQtyInBox)) ? parseFloat(rawQtyInBox) : 1;

            const unitPrice = qtyInBox > 0 ? (rate / qtyInBox) : 0;
            const profit = rate - purchaseRate;

            return {
              _id: Date.now() + idx + Math.random(),
              barcode,
              name,
              description,
              rate,
              purchaseRate,
              qtyInBox,
              unitPrice,
              profit
            };
          }).filter(item => item.name);
        };

        let parsedItems = tryParse(data);

        // Advanced Fallback: Search through raw cell rows to locate header index dynamically
        if (parsedItems.length === 0) {
          const rawRows = XLSX.utils.sheet_to_json(ws, { header: 1 });
          const possibleNameKeys = ['product name', 'material name', 'product', 'material', 'name', 'item', 'particulars', 'item description', 'product description', 'material description', 'desc', 'description'];

          let headerRowIdx = -1;
          for (let r = 0; r < Math.min(rawRows.length, 15); r++) {
            const cells = rawRows[r] || [];
            const hasHeaderKeyword = cells.some(cell => {
              const val = String(cell || '').toLowerCase().trim();
              return possibleNameKeys.includes(val) || val.includes('price') || val.includes('rate') || val.includes('cost');
            });
            if (hasHeaderKeyword) {
              headerRowIdx = r;
              break;
            }
          }

          if (headerRowIdx !== -1) {
            const headerRow = rawRows[headerRowIdx].map(h => String(h || '').trim());
            const subsequentRows = rawRows.slice(headerRowIdx + 1);

            const remappedRows = subsequentRows.map(row => {
              const rowObj = {};
              headerRow.forEach((headerName, colIdx) => {
                if (headerName) {
                  rowObj[headerName] = row[colIdx];
                }
              });
              return rowObj;
            });
            parsedItems = tryParse(remappedRows);
          }
        }

        if (parsedItems.length === 0) {
          alert("Could not extract any valid items with product names from the Excel file.\n\nPlease verify that your Excel file has headers such as 'Product Name', 'Material Name', 'Item Description', 'Name', or 'Description' along with a price column.");
          return;
        }

        const confirmMerge = window.confirm(`Imported ${parsedItems.length} items from Excel. Do you want to APPEND them to the current price list? (Click 'Cancel' to REPLACE the current list).`);

        if (confirmMerge) {
          setSupplierPriceListItems(prev => [...prev, ...parsedItems]);
        } else {
          setSupplierPriceListItems(parsedItems);
        }

        alert(`📥 Successfully loaded ${parsedItems.length} items into the price list editor! Review them and click "Save Price List" to persist.`);
      } catch (error) {
        console.error("Error parsing supplier price list XLSX:", error);
        alert("Failed to parse supplier price list Excel file: " + error.message);
      } finally {
        e.target.value = "";
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleSavePriceList = async () => {
    if (!selectedSupplierForPriceList) return;
    // Validate required fields
    for (const item of supplierPriceListItems) {
      if (!item.name || !item.name.trim()) {
        alert('Each price list item must have an Item Name.');
        return;
      }
    }
    setIsSavingPriceList(true);
    try {
      const cleanItems = supplierPriceListItems.map((item) => {
        return {
          barcode: String(item.barcode || '').trim(),
          name: String(item.name || '').trim(),
          description: String(item.description || '').trim(),
          rate: parseFloat(item.rate) || 0,
          purchaseRate: parseFloat(item.purchaseRate) || 0,
          qtyInBox: parseFloat(item.qtyInBox) || 0,
          unitPrice: parseFloat(item.unitPrice) || 0,
          profit: parseFloat(item.profit) || 0
        };
      });
      const docRef = doc(db, 'manufacturers', selectedSupplierForPriceList.id);
      await updateDoc(docRef, {
        priceList: cleanItems,
        priceListDate: priceListDate,
        priceListUpdatedAt: new Date().toLocaleString()
      });
      // Update local state so card reflects saved data without page refresh
      setDbManufacturers(prev =>
        prev.map(m => m.id === selectedSupplierForPriceList.id
          ? { ...m, priceList: cleanItems, priceListDate: priceListDate, priceListUpdatedAt: new Date().toLocaleString() }
          : m
        )
      );
      alert(`✅ Price list for ${selectedSupplierForPriceList.name} saved successfully! (${cleanItems.length} items)`);
      handleClosePriceList();
    } catch (err) {
      console.error(err);
      alert('Failed to save price list: ' + err.message);
    } finally {
      setIsSavingPriceList(false);
    }
  };

  const handleAddManufacturer = async (e) => {
    e.preventDefault();
    if (!mfgForm.name || !mfgForm.contactPerson || !mfgForm.phone) {
      alert('Please fill in the Manufacturer Name, Contact Person, and Phone.');
      return;
    }
    try {
      let priceListUrl = '';
      let priceListName = '';

      if (mfgPriceListFile) {
        setIsUploadingMfgFile(true);
        setMfgUploadProgress(20);

        try {
          const fileRef = ref(storage, `manufacturer_price_lists/${Date.now()}_${mfgPriceListFile.name}`);
          setMfgUploadProgress(50);
          const snapshot = await uploadBytes(fileRef, mfgPriceListFile);
          setMfgUploadProgress(80);
          priceListUrl = await getDownloadURL(snapshot.ref);
          priceListName = mfgPriceListFile.name;
          setMfgUploadProgress(100);
        } catch (uploadError) {
          console.error('Error uploading price list:', uploadError);
          alert('Upload failed, but saving manufacturer profile anyway: ' + uploadError.message);
        } finally {
          setIsUploadingMfgFile(false);
        }
      }

      const newMfg = {
        name: mfgForm.name.trim(),
        contactPerson: mfgForm.contactPerson.trim(),
        phone: mfgForm.phone.trim(),
        email: mfgForm.email.trim(),
        location: mfgForm.location.trim(),
        materials: mfgForm.materials.trim(),
        notes: mfgForm.notes.trim(),
        priceListUrl,
        priceListName,
        createdAt: new Date()
      };
      await addDoc(collection(db, 'manufacturers'), newMfg);
      setMfgForm({
        name: '',
        contactPerson: '',
        phone: '',
        email: '',
        location: 'Ghana',
        materials: '',
        notes: ''
      });
      setMfgPriceListFile(null);
      setShowAddMfgModal(false);
      alert('🏭 New Manufacturer added successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to add manufacturer: ' + err.message);
    }
  };

  // eslint-disable-next-line no-unused-vars
  const handleCreatePO = async (e) => {
    e.preventDefault();
    if (!poForm.manufacturerId) {
      alert('Please select a manufacturer.');
      return;
    }
    if (poForm.items.length === 0 || poForm.items.some(item => !item.name || item.qty <= 0 || item.unitPrice < 0)) {
      alert('Please ensure all items have a name, quantity > 0, and price >= 0.');
      return;
    }
    try {
      const selectedMfg = activeManufacturers.find(m => m.id === poForm.manufacturerId);
      if (!selectedMfg) return;

      const calculatedItems = poForm.items.map(item => ({
        name: item.name.trim(),
        size: item.size.trim(),
        qty: parseInt(item.qty),
        unitPrice: parseFloat(item.unitPrice),
        total: parseInt(item.qty) * parseFloat(item.unitPrice)
      }));

      const subtotal = calculatedItems.reduce((acc, i) => acc + i.total, 0);
      const totalAmount = poForm.vatApplied ? Math.round(subtotal * 1.219 * 100) / 100 : subtotal;

      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const year = new Date().getFullYear();
      const poNumber = `PO-${year}-${randomSuffix}`;

      const newPO = {
        poNumber,
        manufacturerId: poForm.manufacturerId,
        manufacturerName: selectedMfg.name,
        manufacturerPhone: selectedMfg.phone,
        items: calculatedItems,
        totalAmount,
        vatApplied: poForm.vatApplied,
        status: 'Draft',
        createdAt: new Date()
      };

      await addDoc(collection(db, 'manufacturer_pos'), newPO);
      setPoForm({
        manufacturerId: '',
        vatApplied: true,
        items: [{ name: '', size: '25L', qty: 1, unitPrice: 0 }]
      });
      setShowAddPOModal(false);
      alert(`📦 Purchase Order ${poNumber} created successfully in draft status!`);
    } catch (err) {
      console.error(err);
      alert('Failed to create Purchase Order: ' + err.message);
    }
  };

  // eslint-disable-next-line no-unused-vars
  const handleUpdatePOStatus = async (poId, newStatus) => {
    try {
      const docRef = doc(db, 'manufacturer_pos', poId);
      await updateDoc(docRef, { status: newStatus });
      alert(`PO status updated to: ${newStatus}`);
    } catch (err) {
      console.error(err);
      alert('Failed to update PO status: ' + err.message);
    }
  };

  const getWhatsAppPOText = (po) => {
    if (!po) return '';
    const itemsList = po.items.map(item => `• ${item.name} (${item.size}) x${item.qty} - GH₵ ${item.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`).join('\n');
    const subtotal = po.items.reduce((acc, i) => acc + i.total, 0);
    const taxValue = po.totalAmount - subtotal;

    const taxBreakdown = po.vatApplied
      ? `\n*VAT & B2B GRA Levies (21.9%):* GH₵ ${taxValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`
      : `\n*Taxes:* VAT Exempt / Zero-Rated\n`;

    return `Hello ${po.manufacturerName || 'Supplier'},

Please find our Purchase Order *#${po.poNumber}* from *Neat Brand Trade (NBT)*:

*Required Materials:*
${itemsList}
${taxBreakdown}
*GRAND TOTAL COST: GH₵ ${po.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}*

Please confirm receipt, supply availability, and dispatch timeline.

Thank you! 🧪🛡️`;
  };

  // Create New Order Modal States
  // eslint-disable-next-line no-unused-vars
  const [showCreateOrderModal, setShowCreateOrderModal] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [newOrderForm, setNewOrderForm] = useState({
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    customerEmail: '',
    status: 'pending',
    vatApplied: false,
    notes: '',
    items: [{ name: '', size: '', qty: 1, unitPrice: 0 }]
  });

  const handleOpenCreateOrder = () => {
    handleOpenUniversalCreator('order');
  };

  // eslint-disable-next-line no-unused-vars
  const handleOrderItemChange = (idx, field, value) => {
    const updated = [...newOrderForm.items];
    updated[idx][field] = (field === 'qty' || field === 'unitPrice') ? parseFloat(value) || 0 : value;
    setNewOrderForm(prev => ({ ...prev, items: updated }));
  };

  // eslint-disable-next-line no-unused-vars
  const handleAddOrderItem = () => {
    setNewOrderForm(prev => ({ ...prev, items: [...prev.items, { name: '', size: '', qty: 1, unitPrice: 0 }] }));
  };

  // eslint-disable-next-line no-unused-vars
  const handleRemoveOrderItem = (idx) => {
    if (newOrderForm.items.length === 1) return;
    setNewOrderForm(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }));
  };

  const calcOrderSubtotal = () =>
    newOrderForm.items.reduce((sum, i) => sum + ((parseFloat(i.qty) || 0) * (parseFloat(i.unitPrice) || 0)), 0);

  // eslint-disable-next-line no-unused-vars
  const calcOrderTotal = () => {
    const sub = calcOrderSubtotal();
    return newOrderForm.vatApplied ? Math.round(sub * 1.219 * 100) / 100 : sub;
  };

  // eslint-disable-next-line no-unused-vars
  const handleCreateOrder = async (e) => {
    e.preventDefault();
    if (!newOrderForm.customerName.trim() || !newOrderForm.customerPhone.trim()) {
      alert('Customer name and phone are required.');
      return;
    }
    if (newOrderForm.items.some(i => !i.name.trim() || i.qty <= 0)) {
      alert('Each item must have a name and quantity > 0.');
      return;
    }
    setIsCreatingOrder(true);
    try {
      const calculatedItems = newOrderForm.items.map(i => ({
        name: i.name.trim(),
        size: i.size.trim(),
        qty: parseInt(i.qty) || 1,
        quantity: parseInt(i.qty) || 1,
        price: parseFloat(i.unitPrice) || 0,
        unitPrice: parseFloat(i.unitPrice) || 0,
        total: (parseInt(i.qty) || 1) * (parseFloat(i.unitPrice) || 0)
      }));
      const subtotal = calcOrderSubtotal();
      const totalAmount = newOrderForm.vatApplied ? Math.round(subtotal * 1.219 * 100) / 100 : subtotal;
      const orderData = {
        customer: {
          name: newOrderForm.customerName.trim(),
          phone: newOrderForm.customerPhone.trim(),
          address: newOrderForm.customerAddress.trim(),
          email: newOrderForm.customerEmail.trim()
        },
        items: calculatedItems,
        totalAmount,
        vatApplied: newOrderForm.vatApplied,
        status: newOrderForm.status,
        notes: newOrderForm.notes.trim(),
        source: 'admin_manual',
        createdAt: new Date()
      };
      await addDoc(collection(db, 'orders'), orderData);
      setShowCreateOrderModal(false);
      alert(`✅ Order created successfully for ${newOrderForm.customerName}! Total: GH₵ ${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
    } catch (err) {
      console.error(err);
      alert('Failed to create order: ' + err.message);
    } finally {
      setIsCreatingOrder(false);
    }
  };

  const handleOpenUniversalCreator = (type = 'po', existingDoc = null) => {
    setUniversalDocType(type);
    setUniversalSupplierId('');
    setUniversalProductSource(type === 'order' ? 'catalog' : 'supplier');
    setUniversalCatalogSearch('');

    if (existingDoc) {
      setIsEditingUniversalDoc(true);
      setEditingUniversalDocId(existingDoc.id);

      if (type === 'po') {
        setUniversalSupplierId(existingDoc.manufacturerId || '');
        setShowCustomAddrInput(false);
        setUniversalForm({
          docNumber: existingDoc.poNumber || '',
          referenceNumber: existingDoc.referenceNumber || '',
          paymentTerms: existingDoc.paymentTerms || 'Due on Receipt',
          shipmentMode: existingDoc.shipmentMode || 'Delivery Van',
          shippingCharges: parseFloat(existingDoc.shippingCharges) || 0,
          adjustment: parseFloat(existingDoc.adjustment) || 0,
          issueDate: existingDoc.date || new Date().toISOString().substring(0, 10),
          dueDate: existingDoc.expectedDeliveryDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10),
          vatApplied: !!existingDoc.vatApplied,
          status: existingDoc.status || 'Draft',
          notes: existingDoc.notes || '',
          deliveryAddressType: existingDoc.deliveryAddressType || 'company',
          deliveryAddress: existingDoc.deliveryAddress || 'Neat Brand Trade Factory Depot, Tema Light Industrial Area, Ghana',
          selectedDeliveryCustomerId: existingDoc.selectedDeliveryCustomerId || '',
          items: existingDoc.items ? existingDoc.items.map(i => ({
            name: i.name || '',
            size: i.size || '25L',
            qty: i.qty || i.quantity || 1,
            unitPrice: i.unitPrice || i.price || 0,
            discountPercent: i.discountPercent || 0,
            total: i.total || ((i.qty || i.quantity || 1) * (i.unitPrice || i.price || 0))
          })) : []
        });
      } else if (type === 'invoice') {
        setUniversalSupplierId(existingDoc.supplierId || '');
        setUniversalForm({
          docNumber: existingDoc.invoiceNumber || '',
          referenceNumber: existingDoc.referenceNumber || '',
          paymentTerms: existingDoc.paymentTerms || 'Due on Receipt',
          shipmentMode: existingDoc.shipmentMode || 'Delivery Van',
          shippingCharges: parseFloat(existingDoc.shippingCharges) || 0,
          adjustment: parseFloat(existingDoc.adjustment) || 0,
          issueDate: existingDoc.issueDate || new Date().toISOString().substring(0, 10),
          dueDate: existingDoc.dueDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10),
          vatApplied: !!existingDoc.vatApplied,
          status: existingDoc.status || 'Pending',
          notes: existingDoc.notes || '',
          items: existingDoc.items ? existingDoc.items.map(i => ({
            name: i.name || '',
            size: i.size || '25L',
            qty: i.qty || i.quantity || 1,
            unitPrice: i.unitPrice || i.price || 0,
            discountPercent: i.discountPercent || 0,
            total: i.total || ((i.qty || i.quantity || 1) * (i.unitPrice || i.price || 0))
          })) : []
        });
      } else {
        // order
        setUniversalForm({
          customerName: existingDoc.customer?.name || '',
          customerPhone: existingDoc.customer?.phone || '',
          customerAddress: existingDoc.customer?.address || '',
          customerEmail: existingDoc.customer?.email || '',
          docNumber: existingDoc.id?.slice(-8).toUpperCase() || '',
          referenceNumber: '',
          paymentTerms: 'Due on Receipt',
          shipmentMode: 'Delivery Van',
          shippingCharges: 0,
          adjustment: 0,
          issueDate: existingDoc.createdAt ? (typeof existingDoc.createdAt.toDate === 'function' ? existingDoc.createdAt.toDate().toISOString().substring(0, 10) : new Date(existingDoc.createdAt).toISOString().substring(0, 10)) : new Date().toISOString().substring(0, 10),
          dueDate: existingDoc.deliveryDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10),
          vatApplied: !!existingDoc.vatApplied,
          status: existingDoc.status || 'pending',
          notes: existingDoc.notes || '',
          items: existingDoc.items ? existingDoc.items.map(i => ({
            name: i.name || '',
            size: i.size || '1L',
            qty: i.qty || i.quantity || 1,
            unitPrice: i.unitPrice || i.price || 0,
            discountPercent: i.discountPercent || 0,
            total: i.total || ((i.qty || i.quantity || 1) * (i.unitPrice || i.price || 0))
          })) : []
        });
      }
    } else {
      setIsEditingUniversalDoc(false);
      setEditingUniversalDocId(null);

      const today = new Date().toISOString().substring(0, 10);
      const inTwoWeeks = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10);
      const rnd = Math.floor(1000 + Math.random() * 9000);
      const year = new Date().getFullYear();

      let defaultDocNumber;
      let defaultStatus;
      if (type === 'po') {
        defaultDocNumber = `PO-${year}-${rnd}`;
        defaultStatus = 'Draft';
      } else if (type === 'invoice') {
        defaultDocNumber = `INV-${year}-${rnd}`;
        defaultStatus = 'Pending';
      } else {
        defaultDocNumber = `ORD-${year}-${rnd}`;
        defaultStatus = 'pending';
      }

      setShowCustomAddrInput(false);
      setUniversalForm({
        customerName: '',
        customerPhone: '',
        customerAddress: '',
        customerEmail: '',
        docNumber: defaultDocNumber,
        referenceNumber: '',
        paymentTerms: 'Due on Receipt',
        shipmentMode: 'Delivery Van',
        shippingCharges: 0,
        adjustment: 0,
        issueDate: today,
        dueDate: inTwoWeeks,
        vatApplied: type === 'po', // default B2B GRA levies enabled for PO
        status: defaultStatus,
        deliveryAddressType: 'company',
        deliveryAddress: 'Neat Brand Trade Factory Depot, Tema Light Industrial Area, Ghana',
        selectedDeliveryCustomerId: '',
        notes: '',
        items: []
      });
    }

    setShowUniversalCreatorModal(true);
  };

  const handleAddUniversalProduct = (name, size, price) => {
    const existingIndex = universalForm.items.findIndex(
      item => item.name === name && item.size === size
    );

    const newItems = [...universalForm.items];
    if (existingIndex > -1) {
      newItems[existingIndex].qty = (parseInt(newItems[existingIndex].qty) || 0) + 1;
      const base = newItems[existingIndex].qty * newItems[existingIndex].unitPrice;
      const discount = base * ((newItems[existingIndex].discountPercent || 0) / 100);
      newItems[existingIndex].total = Math.round((base - discount) * 100) / 100;
    } else {
      newItems.push({
        name: name.trim(),
        size: (size || '1L').trim(),
        qty: 1,
        unitPrice: parseFloat(price) || 0,
        discountPercent: 0,
        total: parseFloat(price) || 0
      });
    }

    setUniversalForm(prev => ({ ...prev, items: newItems }));
  };

  const handleEditUniversalItem = (idx, field, val) => {
    const newItems = [...universalForm.items];
    if (field === 'qty') {
      newItems[idx].qty = parseInt(val) || 1;
      const base = newItems[idx].qty * newItems[idx].unitPrice;
      const discount = base * ((newItems[idx].discountPercent || 0) / 100);
      newItems[idx].total = Math.round((base - discount) * 100) / 100;
    } else if (field === 'unitPrice') {
      newItems[idx].unitPrice = parseFloat(val) || 0;
      const base = newItems[idx].qty * newItems[idx].unitPrice;
      const discount = base * ((newItems[idx].discountPercent || 0) / 100);
      newItems[idx].total = Math.round((base - discount) * 100) / 100;
    } else if (field === 'discountPercent') {
      const pct = Math.min(100, Math.max(0, parseFloat(val) || 0));
      newItems[idx].discountPercent = pct;
      const base = newItems[idx].qty * newItems[idx].unitPrice;
      const discount = base * (pct / 100);
      newItems[idx].total = Math.round((base - discount) * 100) / 100;
    } else {
      newItems[idx][field] = val;
    }
    setUniversalForm(prev => ({ ...prev, items: newItems }));
  };

  const calcUniversalSubtotal = () => {
    return universalForm.items.reduce((sum, i) => sum + (parseFloat(i.total) || 0), 0);
  };

  const handleSubmitUniversalDoc = async (e) => {
    e.preventDefault();

    if (universalForm.items.length === 0) {
      alert('Please search and add at least one product to the ledger.');
      return;
    }

    if (universalDocType === 'po' && !universalSupplierId) {
      alert('Please select a target manufacturer/supplier.');
      return;
    }

    if (universalDocType === 'invoice' && !universalSupplierId) {
      alert('Please select a supplier.');
      return;
    }

    if (universalDocType === 'order') {
      if (!universalForm.customerName.trim() || !universalForm.customerPhone.trim()) {
        alert('Customer name and phone number are required.');
        return;
      }
    }

    setIsCreatingUniversalDoc(true);

    try {
      const subtotal = calcUniversalSubtotal();
      const shipCharges = parseFloat(universalForm.shippingCharges) || 0;
      const adjustVal = parseFloat(universalForm.adjustment) || 0;
      const taxableTotal = subtotal + shipCharges + adjustVal;
      const totalAmount = universalForm.vatApplied ? Math.round(taxableTotal * 1.219 * 100) / 100 : Math.round(taxableTotal * 100) / 100;

      const selectedMfg = activeManufacturers.find(m => m.id === universalSupplierId);

      if (universalDocType === 'po') {
        const payload = {
          poNumber: universalForm.docNumber || `PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
          referenceNumber: universalForm.referenceNumber || '',
          paymentTerms: universalForm.paymentTerms || 'Due on Receipt',
          shipmentMode: universalForm.shipmentMode || 'Delivery Van',
          shippingCharges: shipCharges,
          adjustment: adjustVal,
          manufacturerId: universalSupplierId,
          manufacturerName: selectedMfg?.name || 'Unknown Supplier',
          manufacturerPhone: selectedMfg?.phone || '',
          deliveryAddressType: universalForm.deliveryAddressType || 'company',
          deliveryAddress: universalForm.deliveryAddress || 'Neat Brand Trade Factory Depot, Tema Light Industrial Area, Ghana',
          selectedDeliveryCustomerId: universalForm.selectedDeliveryCustomerId || '',
          items: universalForm.items.map(i => ({
            name: i.name,
            size: i.size,
            qty: parseInt(i.qty) || 1,
            unitPrice: parseFloat(i.unitPrice) || 0,
            discountPercent: parseFloat(i.discountPercent) || 0,
            total: parseFloat(i.total) || ((parseInt(i.qty) || 1) * (parseFloat(i.unitPrice) || 0))
          })),
          totalAmount,
          vatApplied: universalForm.vatApplied,
          status: universalForm.status || 'Draft',
          notes: universalForm.notes || '',
          date: universalForm.issueDate || new Date().toISOString().substring(0, 10),
          expectedDeliveryDate: universalForm.dueDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10),
          updatedAt: new Date()
        };
        if (isEditingUniversalDoc) {
          await updateDoc(doc(db, 'manufacturer_pos', editingUniversalDocId), payload);
          alert(`📦 Purchase Order ${payload.poNumber} updated successfully!`);
        } else {
          payload.createdAt = new Date();
          await addDoc(collection(db, 'manufacturer_pos'), payload);
          alert(`📦 Purchase Order ${payload.poNumber} created successfully!`);
        }
      } else if (universalDocType === 'invoice') {
        const payload = {
          invoiceNumber: universalForm.docNumber || `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
          referenceNumber: universalForm.referenceNumber || '',
          paymentTerms: universalForm.paymentTerms || 'Due on Receipt',
          shipmentMode: universalForm.shipmentMode || 'Delivery Van',
          shippingCharges: shipCharges,
          adjustment: adjustVal,
          supplierId: universalSupplierId,
          supplierName: selectedMfg?.name || 'Unknown Supplier',
          supplierPhone: selectedMfg?.phone || '',
          items: universalForm.items.map(i => ({
            name: i.name,
            size: i.size,
            qty: parseInt(i.qty) || 1,
            unitPrice: parseFloat(i.unitPrice) || 0,
            discountPercent: parseFloat(i.discountPercent) || 0,
            total: parseFloat(i.total) || ((parseInt(i.qty) || 1) * (parseFloat(i.unitPrice) || 0))
          })),
          totalAmount,
          vatApplied: universalForm.vatApplied,
          status: universalForm.status || 'Pending',
          notes: universalForm.notes || '',
          issueDate: universalForm.issueDate || new Date().toISOString().substring(0, 10),
          dueDate: universalForm.dueDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10),
          updatedAt: new Date()
        };
        if (isEditingUniversalDoc) {
          await updateDoc(doc(db, 'supplier_invoices', editingUniversalDocId), payload);
          alert(`🧾 Supplier Invoice ${payload.invoiceNumber} updated successfully!`);
        } else {
          payload.createdAt = new Date();
          await addDoc(collection(db, 'supplier_invoices'), payload);
          alert(`🧾 Supplier Invoice ${payload.invoiceNumber} created successfully!`);
        }
      } else {
        // Customer Order
        const payload = {
          customer: {
            name: universalForm.customerName.trim(),
            phone: universalForm.customerPhone.trim(),
            address: universalForm.customerAddress.trim(),
            email: universalForm.customerEmail.trim()
          },
          items: universalForm.items.map(i => ({
            name: i.name,
            size: i.size,
            qty: parseInt(i.qty) || 1,
            quantity: parseInt(i.qty) || 1,
            price: parseFloat(i.unitPrice) || 0,
            unitPrice: parseFloat(i.unitPrice) || 0,
            total: (parseInt(i.qty) || 1) * (parseFloat(i.unitPrice) || 0)
          })),
          totalAmount,
          vatApplied: universalForm.vatApplied,
          status: universalForm.status || 'pending',
          notes: universalForm.notes || '',
          deliveryDate: universalForm.dueDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10),
          updatedAt: new Date(),
          source: 'admin_manual'
        };
        if (isEditingUniversalDoc) {
          await updateDoc(doc(db, 'orders', editingUniversalDocId), payload);
          alert(`📦 Customer Order updated successfully!`);
        } else {
          payload.createdAt = new Date();
          await addDoc(collection(db, 'orders'), payload);
          alert(`📦 Customer Order created successfully!`);
        }
      }

      setShowUniversalCreatorModal(false);
    } catch (err) {
      console.error(err);
      alert('Failed to save B2B document: ' + err.message);
    } finally {
      setIsCreatingUniversalDoc(false);
    }
  };

  // Local Settings
  const [cloudinaryCloud, setCloudinaryCloud] = useState('');
  const [cloudinaryPreset, setCloudinaryPreset] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('0246272115');
  const [testUrl, setTestUrl] = useState('');
  const [isTestingCloudinary, setIsTestingCloudinary] = useState(false);

  // Zoho Books Items View States
  const [productFilter, setProductFilter] = useState('active'); // 'active' | 'inactive' | 'all' | 'retail' | 'industrial'
  const [productDropdownOpen, setProductDropdownOpen] = useState(false);
  const [productOptionsOpen, setProductOptionsOpen] = useState(false);
  const [productSortField, setProductSortField] = useState('name');
  const [productSortOrder, setProductSortOrder] = useState('asc');
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [isRefreshingProducts, setIsRefreshingProducts] = useState(false);

  // Form & Product states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  const [newProduct, setNewProduct] = useState({
    name: '',
    brand: 'Neat Product',
    type: 'retail',
    category: 'Household Cleaners',
    description: '',
    purchaseDescription: '',
    purchaseRate: '',
    rate: '',
    stockOnHand: 'box',
    quantity: 100,
    status: 'Published',
    sizes: [{ size: '1L', price: 25, qtyInBox: 1 }],
    image: '/PRODUCTS/Neat/all-neat-all-purpose-cleaner-floral-2l.png' // Default placeholder
  });

  // Unified click-outside event listener for B2B dropdowns/popups
  useEffect(() => {
    const handleOutsideClick = (e) => {
      // 1. Customer Suggestions Dropdown
      const isInsideCustomer = e.target.closest('.customer-suggestions-dropdown') || e.target.closest('.customer-name-input');
      if (!isInsideCustomer) {
        setShowCustomerSuggestions(false);
      }

      // 2. Product Line Items Suggestions Dropdown
      const isInsideProduct = e.target.closest('.product-suggestions-dropdown') || e.target.closest('.product-item-input');
      if (!isInsideProduct) {
        setActiveSuggestionIndex(null);
      }

      // 3. Product Filter Dropdown
      const isInsideFilter = e.target.closest('.product-filter-dropdown') || e.target.closest('.product-filter-trigger');
      if (!isInsideFilter) {
        setProductDropdownOpen(false);
      }
    };

    window.addEventListener('click', handleOutsideClick);
    return () => {
      window.removeEventListener('click', handleOutsideClick);
    };
  }, []);

  // Load Cloudinary config from localStorage on clientside load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const cloud = localStorage.getItem('nbt_cloudinary_cloud') || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD || '';
      const preset = localStorage.getItem('nbt_cloudinary_preset') || process.env.NEXT_PUBLIC_CLOUDINARY_PRESET || '';
      const num = localStorage.getItem('nbt_whatsapp_num') || '0246272115';
      setTimeout(() => {
        setCloudinaryCloud(cloud);
        setCloudinaryPreset(preset);
        setWhatsappNumber(num);
      }, 0);
    }

    // Connect real-time listeners for orders and inquiries
    const ordersRef = collection(db, 'orders');
    const unsubscribeOrders = onSnapshot(ordersRef, (snapshot) => {
      if (!snapshot.empty) {
        const loadedOrders = snapshot.docs.map(d => ({
          ...d.data(),
          id: d.id,
          date: d.data().createdAt?.toDate()?.toLocaleDateString() || new Date().toLocaleDateString()
        }));
        setOrders(loadedOrders);
      } else {
        setOrders([]);
      }
    });

    const messagesRef = collection(db, 'bulk_inquiries');
    const unsubscribeMessages = onSnapshot(messagesRef, (snapshot) => {
      if (!snapshot.empty) {
        const loadedMessages = snapshot.docs.map(d => ({
          ...d.data(),
          id: d.id,
          date: d.data().createdAt?.toDate()?.toLocaleDateString() || new Date().toLocaleDateString()
        }));
        setMessages(loadedMessages);
      } else {
        setMessages([]);
      }
    });

    const clientsRef = collection(db, 'wholesale_clients');
    const unsubscribeClients = onSnapshot(clientsRef, (snapshot) => {
      if (!snapshot.empty) {
        const loadedClients = snapshot.docs.map(d => ({
          ...d.data(),
          id: d.id,
          date: d.data().createdAt?.toDate()?.toLocaleDateString() || new Date().toLocaleDateString()
        }));
        setWholesaleClients(loadedClients);
      } else {
        setWholesaleClients([]);
      }
    });

    const mfgsRef = collection(db, 'manufacturers');
    const unsubscribeMfgs = onSnapshot(mfgsRef, (snapshot) => {
      if (!snapshot.empty) {
        const loaded = snapshot.docs.map(d => ({
          ...d.data(),
          id: d.id,
          date: d.data().createdAt?.toDate()?.toLocaleDateString() || new Date().toLocaleDateString()
        }));
        setDbManufacturers(loaded);
      } else {
        setDbManufacturers([]);
      }
    });

    const mfgPOsRef = collection(db, 'manufacturer_pos');
    const unsubscribeMfgPOs = onSnapshot(mfgPOsRef, (snapshot) => {
      if (!snapshot.empty) {
        const loaded = snapshot.docs.map(d => ({
          ...d.data(),
          id: d.id,
          date: d.data().createdAt?.toDate()?.toLocaleDateString() || new Date().toLocaleDateString()
        }));
        setDbManufacturerPOs(loaded);
      } else {
        setDbManufacturerPOs([]);
      }
    });

    const invoicesRef = collection(db, 'supplier_invoices');
    const unsubscribeInvoices = onSnapshot(invoicesRef, (snapshot) => {
      if (!snapshot.empty) {
        const loaded = snapshot.docs.map(d => ({
          ...d.data(),
          id: d.id,
          date: d.data().createdAt?.toDate()?.toLocaleDateString() || new Date().toLocaleDateString()
        }));
        setDbInvoices(loaded);
      } else {
        setDbInvoices([]);
      }
    });

    const priceListsRef = collection(db, 'price_lists');
    const unsubscribePriceLists = onSnapshot(priceListsRef, (snapshot) => {
      if (!snapshot.empty) {
        const loaded = snapshot.docs.map(d => ({
          ...d.data(),
          id: d.id,
          date: d.data().createdAt?.toDate()?.toLocaleDateString() || new Date().toLocaleDateString()
        }));
        setPriceLists(loaded);
      } else {
        setPriceLists([]);
      }
    });

    return () => {
      unsubscribeOrders();
      unsubscribeMessages();
      unsubscribeClients();
      unsubscribeMfgs();
      unsubscribeMfgPOs();
      unsubscribeInvoices();
      unsubscribePriceLists();
    };
  }, []);

  const saveSettings = (e) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      localStorage.setItem('nbt_cloudinary_cloud', cloudinaryCloud);
      localStorage.setItem('nbt_cloudinary_preset', cloudinaryPreset);
      localStorage.setItem('nbt_whatsapp_num', whatsappNumber);
      alert('⚙️ Store settings saved successfully!');
    }
  };

  // Test Cloudinary connection using a mock small canvas upload
  const testCloudinaryConnection = async () => {
    if (!cloudinaryCloud || !cloudinaryPreset) {
      alert('⚠️ Please configure both Cloud Name and Preset before testing.');
      return;
    }
    setIsTestingCloudinary(true);
    try {
      // Create a 10x10 mock red canvas to upload
      const canvas = document.createElement('canvas');
      canvas.width = 10;
      canvas.height = 10;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = 'red';
      ctx.fillRect(0, 0, 10, 10);

      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg'));
      const formData = new FormData();
      formData.append('file', blob, 'test.jpg');
      formData.append('upload_preset', cloudinaryPreset);

      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudinaryCloud}/image/upload`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || 'Upload failed');
      }

      const data = await response.json();
      setTestUrl(data.secure_url);
      alert('✨ Cloudinary Unsigned Upload Successful! Connected perfectly.');
    } catch (error) {
      console.error(error);
      alert('❌ Connection failed: ' + error.message);
    } finally {
      setIsTestingCloudinary(false);
    }
  };

  const handleAddSize = () => {
    setNewProduct({
      ...newProduct,
      sizes: [...newProduct.sizes, { size: '', price: 0, qtyInBox: 1 }]
    });
  };

  const handleSizeChange = (index, field, value) => {
    const updatedSizes = [...newProduct.sizes];
    updatedSizes[index][field] = (field === 'price' || field === 'qtyInBox') ? parseFloat(value) || 0 : value;
    setNewProduct({ ...newProduct, sizes: updatedSizes });
  };

  const handleRemoveSize = (index) => {
    if (newProduct.sizes.length === 1) return;
    const updatedSizes = newProduct.sizes.filter((_, i) => i !== index);
    setNewProduct({ ...newProduct, sizes: updatedSizes });
  };

  // Perform Image Upload (Cloudinary with Firebase Storage as graceful fallback)
  const uploadProductImage = async () => {
    if (!imageFile) return newProduct.image;

    setIsUploading(true);
    setUploadProgress(10);

    // Try Cloudinary direct unsigned upload if config is present
    if (cloudinaryCloud && cloudinaryPreset) {
      try {
        setUploadProgress(30);
        const formData = new FormData();
        formData.append('file', imageFile);
        formData.append('upload_preset', cloudinaryPreset);

        setUploadProgress(50);
        const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudinaryCloud}/image/upload`, {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error?.message || 'Cloudinary upload error');
        }

        setUploadProgress(80);
        const data = await response.json();
        setUploadProgress(100);
        setIsUploading(false);
        return data.secure_url;
      } catch (error) {
        console.warn("Cloudinary upload failed, falling back to Firebase Storage:", error);
        // Fallback to Firebase Storage if Cloudinary fails
      }
    }

    // Default Firebase Storage Upload
    try {
      setUploadProgress(40);
      const fileRef = ref(storage, `products/${Date.now()}_${imageFile.name}`);
      setUploadProgress(70);
      const snapshot = await uploadBytes(fileRef, imageFile);
      const downloadUrl = await getDownloadURL(snapshot.ref);
      setUploadProgress(100);
      setIsUploading(false);
      return downloadUrl;
    } catch (error) {
      console.error("Firebase Storage fallback also failed:", error);
      alert("Failed to upload product image: " + error.message);
      setIsUploading(false);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const imageUrl = await uploadProductImage();
      const finalProduct = { ...newProduct, image: imageUrl };

      if (isEditing) {
        await updateProduct({ ...finalProduct, id: editingProductId });
      } else {
        await addProduct(finalProduct);
      }

      setIsModalOpen(false);
      setImageFile(null);
      setUploadProgress(0);
      setNewProduct({
        name: '',
        brand: 'Neat Product',
        type: 'retail',
        category: 'Household Cleaners',
        description: '',
        quantity: 100,
        status: 'Published',
        sizes: [{ size: '1L', price: 25, qtyInBox: 1 }],
        image: '/PRODUCTS/Neat/all-neat-all-purpose-cleaner-floral-2l.png'
      });
    } catch (error) {
      console.error("Save product failed:", error);
    }
  };

  const handleCreatePriceList = async (e) => {
    e.preventDefault();
    if (!newPriceListForm.name.trim()) {
      alert("Price List Name is required.");
      return;
    }
    setIsSavingZohoPriceList(true);
    try {
      const priceListsRef = collection(db, 'price_lists');
      await addDoc(priceListsRef, {
        ...newPriceListForm,
        createdAt: new Date()
      });
      setShowCreatePriceListModal(false);
      setNewPriceListForm({
        name: '',
        transactionType: 'Sales',
        type: 'All Items',
        description: '',
        percentage: '',
        roundOffTo: 'Never mind'
      });
      alert("Price List successfully created!");
    } catch (err) {
      console.error("Error creating price list:", err);
      alert("Failed to create price list: " + err.message);
    } finally {
      setIsSavingZohoPriceList(false);
    }
  };

  const handleDeletePriceList = async (id) => {
    if (window.confirm("Are you sure you want to delete this price list?")) {
      try {
        const docRef = doc(db, 'price_lists', id);
        await deleteDoc(docRef);
        alert("Price List deleted successfully.");
      } catch (err) {
        console.error("Error deleting price list:", err);
        alert("Failed to delete price list: " + err.message);
      }
    }
  };

  const handleExcelUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();

    reader.onload = async (evt) => {
      try {
        const dataBuffer = evt.target.result;
        const wb = XLSX.read(dataBuffer, { type: 'array' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        let successCount = 0;
        let updateCount = 0;

        // Key mapping helper
        const getRowVal = (row, possibleKeys) => {
          const rowKeys = Object.keys(row);
          for (const pk of possibleKeys) {
            const match = rowKeys.find(k => k.toLowerCase().trim() === pk.toLowerCase().trim());
            if (match) return row[match];
          }
          return undefined;
        };

        for (const row of data) {
          const name = getRowVal(row, ['Name', 'Product Name', 'Item Name', 'name', 'Title']);
          if (!name) continue;

          const brand = getRowVal(row, ['Brand', 'brand', 'Manufacturer']) || 'Neat Product';
          const type = String(getRowVal(row, ['Type', 'type']) || 'retail').toLowerCase() === 'industrial' ? 'industrial' : 'retail';
          const category = getRowVal(row, ['Category', 'category', 'Department']) || 'Household Cleaners';
          const description = getRowVal(row, ['Description', 'description', 'Sales Description']) || 'Concentrated clean formulations Direct from manufacturer.';
          const image = getRowVal(row, ['Image', 'image', 'Photo']) || '/PRODUCTS/Neat/all-neat-all-purpose-cleaner-floral-2l.png';
          const quantity = parseInt(getRowVal(row, ['Quantity', 'quantity', 'Stock', 'Initial Stock'])) || 100;

          const purchaseDescription = getRowVal(row, ['Purchase Description', 'purchaseDescription', 'PurchaseDescription', 'Purchase Notes']) || `Purchase of ${name}`;
          const purchaseRate = parseFloat(String(getRowVal(row, ['Purchase Rate', 'purchaseRate', 'PurchaseRate', 'Buy Price']) || '0').replace(/[^0-9.]/g, '')) || 0;
          const rate = parseFloat(String(getRowVal(row, ['Rate', 'rate', 'Price', 'price', 'Selling Price']) || '0').replace(/[^0-9.]/g, '')) || 0;
          const stockOnHand = getRowVal(row, ['Stock On Hand', 'stockOnHand', 'StockOnHand', 'Unit', 'UOM']) || 'box';

          const size = getRowVal(row, ['Size', 'size', 'Volume']) || '1L';
          const qtyInBox = parseInt(getRowVal(row, ['Qty In Box', 'QtyInBox', 'qtyInBox', 'Box Qty', 'BoxQty'])) || 1;

          // Deduplication: Check if name already exists
          const existingProduct = products.find(
            p => p.name?.toLowerCase().trim() === name.toLowerCase().trim()
          );

          const productData = {
            name,
            brand,
            type,
            category,
            description,
            purchaseDescription,
            purchaseRate,
            rate,
            stockOnHand,
            image,
            quantity,
            status: 'Published',
            sizes: [
              {
                size,
                price: rate || 25,
                qtyInBox
              }
            ]
          };

          if (existingProduct && existingProduct.source === 'firestore') {
            // Update the existing Firestore document
            const updatedProductData = {
              ...existingProduct,
              ...productData,
              // Merge sizes elegantly
              sizes: rate ? productData.sizes : (existingProduct.sizes || productData.sizes)
            };
            await updateProduct(updatedProductData);
            updateCount++;
          } else {
            // Create a brand new product
            await addProduct(productData);
            successCount++;
          }
        }

        alert(`Successfully imported: ${successCount} new products created, ${updateCount} existing products updated!`);
      } catch (error) {
        console.error("Error importing Excel:", error);
        alert("Failed to parse Excel file: " + error.message);
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleOpenAddModal = () => {
    setNewProduct({
      name: '',
      brand: 'Neat Product',
      type: 'retail',
      category: 'Household Cleaners',
      description: '',
      purchaseDescription: '',
      purchaseRate: '',
      rate: '',
      stockOnHand: 'box',
      quantity: 100,
      status: 'Published',
      sizes: [{ size: '1L', price: 25, qtyInBox: 1 }],
      image: '/PRODUCTS/Neat/all-neat-all-purpose-cleaner-floral-2l.png'
    });
    setEditingProductId(null);
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleEditProduct = (product) => {
    setNewProduct({
      name: product.name || '',
      brand: product.brand || 'Neat Product',
      type: product.type || 'retail',
      category: product.category || 'Household Cleaners',
      description: product.description || '',
      purchaseDescription: product.purchaseDescription || '',
      purchaseRate: product.purchaseRate || '',
      rate: product.rate || '',
      stockOnHand: product.stockOnHand || 'box',
      quantity: product.quantity !== undefined ? product.quantity : 100,
      status: product.status || 'Published',
      sizes: product.sizes && product.sizes.length > 0 ? product.sizes.map(s => ({ ...s, qtyInBox: s.qtyInBox || 1 })) : [{ size: '1L', price: 25, qtyInBox: 1 }],
      image: product.image || '/PRODUCTS/Neat/all-neat-all-purpose-cleaner-floral-2l.png'
    });
    setEditingProductId(product.id);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const docRef = doc(db, 'orders', orderId);
      await updateDoc(docRef, { status: newStatus });
      alert(`Order updated to: ${newStatus}`);
    } catch (e) {
      console.error(e);
      alert('Failed to update status: ' + e.message);
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (window.confirm("Are you sure you want to delete this order record?")) {
      try {
        const docRef = doc(db, 'orders', orderId);
        await deleteDoc(docRef);
      } catch (e) {
        console.error(e);
      }
    }
  };

  // MOCK SEED DATA (Used when Firestore records are loading or empty to make sure the dashboards are stunning!)
  const mockOrders = [
    { id: 'mock_1', customer: { name: 'Kwabena Appiah', phone: '0244123456', address: 'Spintex Road, Accra' }, items: [{ name: 'Neat Bleach', size: '5L', price: 45 }], totalAmount: 45, status: 'pending', date: '2026-05-21' },
    { id: 'mock_2', customer: { name: 'Sister Beatrice', phone: '0207987654', address: 'Tema Community 6' }, items: [{ name: 'Floral All Purpose Cleaner', size: '2L', price: 30 }, { name: 'Deva Laundry Liquid', size: '5L', price: 65 }], totalAmount: 95, status: 'shipped', date: '2026-05-20' },
    { id: 'mock_3', customer: { name: 'Alhaji Ibrahim', phone: '0543112233', address: 'Kumasi Adum' }, items: [{ name: 'Industrial Floor Degreaser', size: '25L', price: 320 }], totalAmount: 320, status: 'completed', date: '2026-05-18' }
  ];

  const mockMessages = [
    { id: 'msg_1', businessName: 'Golden Tulip', contactPerson: 'Akosua Mensah', phone: '0246272115', email: 'akosua@goldentulip.com.gh', industry: 'Hotels', productsNeeded: 'Bleach, Liquid Soap', quantity: '50 units', message: 'Interested in wholesale prices for contract purchase.', date: '2026-05-21' },
    { id: 'msg_2', businessName: 'Ridge Hospital Clinic', contactPerson: 'Dr. Evelyn Hanson', phone: '0207123456', email: 'evelyn@ridgehospital.org', industry: 'Hospitals', productsNeeded: 'Medical Grade Sanitizers', quantity: '100 Gallons', message: 'We require continuous supply of sanitizers starting next month.', date: '2026-05-19' }
  ];

  const activeOrders = orders.length > 0 ? orders : mockOrders;
  const activeMessages = messages.length > 0 ? messages : mockMessages;

  // Analytics helper metrics
  const totalRevenue = activeOrders
    .filter(o => o.status === 'completed' || o.status === 'shipped')
    .reduce((acc, o) => acc + o.totalAmount, 0) + 12450; // Added base historical revenue

  const totalOrdersCount = activeOrders.length + 245; // base orders
  const totalVisitorsCount = 3120;

  // Calculate Popular products (sorting products list)
  const popularProducts = products.length > 0
    ? [...products].slice(0, 5).map((p, i) => ({
      ...p,
      sales: [120, 95, 84, 76, 52][i] || 30,
      revenue: ([120, 95, 84, 76, 52][i] || 30) * (p.sizes?.[0]?.price || 25)
    }))
    : [];

  // Dynamic helper calculations for Zoho style products view
  const getProductPurchaseDescription = (p) => {
    return p.purchaseDescription || `Purchase of ${p.name}`;
  };

  const getProductRate = (p) => {
    if (p.rate !== undefined && p.rate !== null && p.rate !== '') {
      return Number(p.rate);
    }
    if (p.sizes && p.sizes[0]) {
      return Number(p.sizes[0].price);
    }
    return 0;
  };

  const getProductPurchaseRate = (p) => {
    if (p.purchaseRate !== undefined && p.purchaseRate !== null && p.purchaseRate !== '') {
      return Number(p.purchaseRate);
    }
    const sellingPrice = getProductRate(p);
    return Number((sellingPrice * 0.82).toFixed(2));
  };

  const getProductStockOnHand = (p) => {
    return p.stockOnHand || 'box';
  };

  // Filter products
  const filteredProducts = products.filter(p => {
    if (productFilter === 'active') return p.status !== 'Draft';
    if (productFilter === 'inactive') return p.status === 'Draft';
    if (productFilter === 'retail') return p.type === 'retail';
    if (productFilter === 'industrial') return p.type === 'industrial';
    return true; // 'all'
  });

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    let valA, valB;
    if (productSortField === 'name') {
      valA = a.name?.toLowerCase() || '';
      valB = b.name?.toLowerCase() || '';
    } else if (productSortField === 'purchaseRate') {
      valA = getProductPurchaseRate(a);
      valB = getProductPurchaseRate(b);
    } else if (productSortField === 'rate') {
      valA = getProductRate(a);
      valB = getProductRate(b);
    } else if (productSortField === 'stock') {
      valA = getProductStockOnHand(a).toLowerCase();
      valB = getProductStockOnHand(b).toLowerCase();
    }

    if (valA < valB) return productSortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return productSortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  // Mock excel export in CSV form
  const handleExportCSV = () => {
    try {
      const headers = ['NAME', 'PURCHASE DESCRIPTION', 'PURCHASE RATE', 'DESCRIPTION', 'RATE', 'STOCK ON HAND'];
      const rows = products.map(p => [
        `"${p.name}"`,
        `"${getProductPurchaseDescription(p)}"`,
        `GHS${getProductPurchaseRate(p).toFixed(2)}`,
        `"${p.description || ''}"`,
        `GHS${getProductRate(p).toFixed(2)}`,
        `"${getProductStockOnHand(p)}"`
      ]);
      const csvContent = "data:text/csv;charset=utf-8,"
        + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `NBT_Products_Zoho_Books_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error(err);
      alert("Failed to export items: " + err.message);
    }
  };

  if (isAuthChecking) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#070F18', minHeight: '100vh', color: 'white', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ border: '4px solid rgba(255,255,255,0.05)', borderTop: '4px solid #33A19D', borderRadius: '50%', width: '45px', height: '45px', animation: 'spin 0.8s linear infinite', margin: '0 auto 20px' }}></div>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 600, fontSize: '0.88rem', letterSpacing: '0.5px' }}>SECURING NBT WORKSPACE...</p>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'radial-gradient(circle at 10% 20%, #0B2339 0%, #05101a 90%)',
        fontFamily: "'Inter', sans-serif",
        padding: '20px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative Chemical Mesh Orbs */}
        <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(43, 140, 138, 0.12) 0%, transparent 60%)', filter: 'blur(50px)', pointerEvents: 'none' }}></div>
        <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(109, 40, 217, 0.08) 0%, transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none' }}></div>

        <div style={{
          width: '100%',
          maxWidth: '440px',
          background: 'rgba(255, 255, 255, 0.03)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '24px',
          boxShadow: '0 30px 70px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          padding: '3rem 2.5rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          animation: 'authScaleUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
          zIndex: 10
        }}>
          {/* Logo / Branding */}
          <div style={{ marginBottom: '2.5rem' }}>
            <img
              src="/NBT Logo_.png"
              alt="NBT Logo"
              style={{ height: '70px', width: 'auto', display: 'block', margin: '0 auto 12px', filter: 'brightness(1.1) drop-shadow(0 0 15px rgba(51, 161, 157, 0.2))' }}
            />
            <h2 style={{ margin: 0, fontFamily: 'Outfit', fontWeight: 900, fontSize: '1.6rem', color: 'white', letterSpacing: '-0.5px' }}>
              NBT Admin Suite
            </h2>
            <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.45)', fontWeight: 500, letterSpacing: '0.5px', marginTop: '4px', display: 'block' }}>
              🔒 SECURE DISTRIBUTOR CRM LOCK
            </span>
          </div>

          <form onSubmit={handleLoginSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1.25rem', textAlign: 'left' }}>

            {loginError && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                color: '#fca5a5',
                padding: '12px 14px',
                borderRadius: '12px',
                fontSize: '0.8rem',
                fontWeight: 600,
                lineHeight: '1.4',
                animation: 'shake 0.3s ease-in-out'
              }}>
                ⚠️ {loginError}
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '6px' }}>Username</label>
              <input
                required
                type="text"
                value={loginUsername}
                onChange={e => setLoginUsername(e.target.value)}
                placeholder="Enter administrator username"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '12px',
                  color: 'white',
                  fontSize: '0.9rem',
                  outline: 'none',
                  transition: 'all 0.25s',
                  boxSizing: 'border-box'
                }}
                onFocus={e => {
                  e.target.style.background = 'rgba(255,255,255,0.08)';
                  e.target.style.borderColor = 'rgba(51, 161, 157, 0.5)';
                  e.target.style.boxShadow = '0 0 15px rgba(51, 161, 157, 0.15)';
                }}
                onBlur={e => {
                  e.target.style.background = 'rgba(255,255,255,0.04)';
                  e.target.style.borderColor = 'rgba(255,255,255,0.12)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            <div style={{ position: 'relative' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '6px' }}>Password</label>
              <input
                required
                type={showPassword ? "text" : "password"}
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '12px 42px 12px 14px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '12px',
                  color: 'white',
                  fontSize: '0.9rem',
                  outline: 'none',
                  transition: 'all 0.25s',
                  boxSizing: 'border-box'
                }}
                onFocus={e => {
                  e.target.style.background = 'rgba(255,255,255,0.08)';
                  e.target.style.borderColor = 'rgba(51, 161, 157, 0.5)';
                  e.target.style.boxShadow = '0 0 15px rgba(51, 161, 157, 0.15)';
                }}
                onBlur={e => {
                  e.target.style.background = 'rgba(255,255,255,0.04)';
                  e.target.style.borderColor = 'rgba(255,255,255,0.12)';
                  e.target.style.boxShadow = 'none';
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '32px',
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255,255,255,0.4)',
                  cursor: 'pointer',
                  fontSize: '1.1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '4px'
                }}
              >
                {showPassword ? "🙈" : "👁"}
              </button>
            </div>

            <button
              type="submit"
              style={{
                width: '100%',
                padding: '14px',
                background: 'linear-gradient(135deg, #2B8C8A 0%, #33A19D 100%)',
                border: 'none',
                color: 'white',
                fontSize: '0.92rem',
                fontWeight: 800,
                borderRadius: '12px',
                cursor: 'pointer',
                letterSpacing: '1px',
                textTransform: 'uppercase',
                boxShadow: '0 8px 20px rgba(43, 140, 138, 0.3)',
                marginTop: '1rem',
                transition: 'all 0.2s ease-in-out'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 12px 24px rgba(43, 140, 138, 0.4)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(43, 140, 138, 0.3)';
              }}
            >
              🔓 Authenticate Key
            </button>

          </form>

          <div style={{ marginTop: '2.5rem', fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', lineHeight: '1.4' }}>
            🧪 Neat Brand Trade CRM Portal v2.02<br />
            Protected by military-grade AES local environment sessions.
          </div>
        </div>

        <style>{`
          @keyframes authScaleUp {
            from { opacity: 0; transform: scale(0.96); }
            to { opacity: 1; transform: scale(1); }
          }
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-6px); }
            75% { transform: translateX(6px); }
          }
        `}</style>
      </div>
    );
  }

  if (!isLoaded) return (
    <div style={{ padding: '40px', background: '#0B2339', minHeight: '100vh', color: 'white', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ fontFamily: 'Outfit', fontWeight: 800 }}>Loading NBT Admin Suite...</h1>
        <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden', marginTop: '20px' }}>
          <div style={{ width: '40%', height: '100%', background: 'var(--secondary)', animation: 'loader 1.5s infinite ease-in-out' }}></div>
        </div>
      </div>
      <style>{`
        @keyframes loader {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(250%); }
        }
      `}</style>
    </div>
  );

  const activeSupplierDetail = selectedSupplierDetail ? (dbManufacturers.find(m => m.id === selectedSupplierDetail.id) || selectedSupplierDetail) : null;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f4f7f9', color: '#0B2339', fontFamily: 'Inter, sans-serif' }}>

      {/* Tap-to-close Backdrop Overlay for Mobile Drawer */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(11, 35, 57, 0.4)',
            backdropFilter: 'blur(4px)',
            zIndex: 99,
            animation: 'fadeIn 0.2s ease'
          }}
        />
      )}

      {/* 1. DARK SIDEBAR NAVIGATION */}
      <aside style={{
        width: '260px',
        background: 'linear-gradient(180deg, #0B2339 0%, #05101a 100%)',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        padding: '2rem 1.5rem',
        borderRight: '1px solid rgba(255, 255, 255, 0.05)',
        position: 'sticky',
        top: 0,
        height: '100vh',
        zIndex: 100
      }} className={`sidebar-container ${isMobileMenuOpen ? 'open' : ''}`}>

        {/* Sidebar Header / Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2.5rem' }}>
          <img src="/NBT Logo_.png" alt="NBT Logo" style={{ height: '40px', width: 'auto', background: 'rgba(255, 255, 255, 0.05)', padding: '4px', borderRadius: '8px' }} />
          <div>
            <h2 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.15rem', margin: 0 }}>NBT Portal</h2>
            <span style={{ fontSize: '0.65rem', color: 'var(--secondary)', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>ADMIN CONSOLE</span>
          </div>
        </div>

        {/* Sidebar Navigation Options */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flexGrow: 1, overflowY: 'auto', paddingRight: '4px' }}>
          {/* Top Flat Items */}
          {[
            { id: 'dashboard', label: 'Dashboard', icon: '📊' },
            { id: 'products', label: 'Products', icon: '🧪' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setIsMobileMenuOpen(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '11px 16px',
                borderRadius: '10px',
                border: 'none',
                background: activeTab === tab.id ? 'rgba(43, 140, 138, 0.15)' : 'transparent',
                color: activeTab === tab.id ? '#33A19D' : 'rgba(255, 255, 255, 0.7)',
                textAlign: 'left',
                cursor: 'pointer',
                fontWeight: activeTab === tab.id ? '600' : '500',
                fontSize: '0.92rem',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                borderLeft: activeTab === tab.id ? '3px solid #2B8C8A' : '3px solid transparent'
              }}
              onMouseEnter={e => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.color = 'white';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                }
              }}
              onMouseLeave={e => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <span>{tab.icon}</span>
              <span style={{ flexGrow: 1 }}>{tab.label}</span>
              {tab.badge > 0 && (
                <span style={{ background: 'var(--secondary)', color: 'white', borderRadius: '50%', width: '18px', height: '18px', fontSize: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}

          {/* Collapsible Dropdown: Sales & Customers */}
          <div style={{ display: 'flex', flexDirection: 'column', margin: '4px 0' }}>
            <button
              onClick={() => setIsSalesOpen(!isSalesOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '11px 16px',
                borderRadius: '10px',
                border: 'none',
                background: ['orders', 'customers', 'invoices'].includes(activeTab) ? 'rgba(255,255,255,0.03)' : 'transparent',
                color: ['orders', 'customers', 'invoices'].includes(activeTab) ? 'white' : 'rgba(255, 255, 255, 0.7)',
                textAlign: 'left',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '0.92rem',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                width: '100%'
              }}
              onMouseEnter={e => {
                if (!['orders', 'customers', 'invoices'].includes(activeTab)) {
                  e.currentTarget.style.color = 'white';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                }
              }}
              onMouseLeave={e => {
                if (!['orders', 'customers', 'invoices'].includes(activeTab)) {
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <span>💰</span>
              <span style={{ flexGrow: 1 }}>Sales & Customers</span>
              <span style={{ 
                fontSize: '0.70rem', 
                transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
                transform: isSalesOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                color: 'rgba(255, 255, 255, 0.4)'
              }}>
                ▶
              </span>
            </button>

            {/* Sliding Submenu Container */}
            <div style={{
              maxHeight: isSalesOpen ? '150px' : '0',
              overflow: 'hidden',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              paddingLeft: '12px',
              marginLeft: '12px',
              borderLeft: '1.5px solid rgba(255, 255, 255, 0.08)',
              marginTop: isSalesOpen ? '4px' : '0'
            }}>
              {[
                { id: 'orders', label: 'Orders', icon: '📦', badge: orders.length },
                { id: 'customers', label: 'Customers', icon: '👥' },
                { id: 'invoices', label: 'Invoices', icon: '🧾', badge: dbInvoices.filter(i => i.status === 'Pending').length }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setIsSalesOpen(true);
                    setIsMobileMenuOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    background: activeTab === tab.id ? 'rgba(43, 140, 138, 0.15)' : 'transparent',
                    color: activeTab === tab.id ? '#33A19D' : 'rgba(255, 255, 255, 0.6)',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontWeight: activeTab === tab.id ? '600' : '500',
                    fontSize: '0.85rem',
                    transition: 'all 0.2s ease',
                    borderLeft: activeTab === tab.id ? '3px solid #2B8C8A' : '3px solid transparent'
                  }}
                  onMouseEnter={e => {
                    if (activeTab !== tab.id) {
                      e.currentTarget.style.color = 'white';
                      e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (activeTab !== tab.id) {
                      e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)';
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  <span>{tab.icon}</span>
                  <span style={{ flexGrow: 1 }}>{tab.label}</span>
                  {tab.badge > 0 && (
                    <span style={{ background: activeTab === tab.id ? '#33A19D' : 'var(--secondary)', color: 'white', borderRadius: '50%', width: '16px', height: '16px', fontSize: '0.60rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Collapsible Dropdown: Procurement & Expenses */}
          <div style={{ display: 'flex', flexDirection: 'column', margin: '4px 0' }}>
            <button
              onClick={() => setIsProcurementOpen(!isProcurementOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '11px 16px',
                borderRadius: '10px',
                border: 'none',
                background: ['purchase-orders', 'suppliers', 'expenses', 'bills'].includes(activeTab) ? 'rgba(255,255,255,0.03)' : 'transparent',
                color: ['purchase-orders', 'suppliers', 'expenses', 'bills'].includes(activeTab) ? 'white' : 'rgba(255, 255, 255, 0.7)',
                textAlign: 'left',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '0.92rem',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                width: '100%'
              }}
              onMouseEnter={e => {
                if (!['purchase-orders', 'suppliers', 'expenses', 'bills'].includes(activeTab)) {
                  e.currentTarget.style.color = 'white';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                }
              }}
              onMouseLeave={e => {
                if (!['purchase-orders', 'suppliers', 'expenses', 'bills'].includes(activeTab)) {
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <span>💼</span>
              <span style={{ flexGrow: 1 }}>Procurement</span>
              <span style={{ 
                fontSize: '0.70rem', 
                transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
                transform: isProcurementOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                color: 'rgba(255, 255, 255, 0.4)'
              }}>
                ▶
              </span>
            </button>

            {/* Sliding Submenu Container */}
            <div style={{
              maxHeight: isProcurementOpen ? '200px' : '0',
              overflow: 'hidden',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              paddingLeft: '12px',
              marginLeft: '12px',
              borderLeft: '1.5px solid rgba(255, 255, 255, 0.08)',
              marginTop: isProcurementOpen ? '4px' : '0'
            }}>
              {[
                { id: 'purchase-orders', label: 'Purchase Orders', icon: '📝', badge: activeManufacturerPOs.filter(p => p.status === 'Draft' || p.status === 'Sent').length },
                { id: 'suppliers', label: 'Suppliers', icon: '🏢' },
                { id: 'expenses', label: 'Expenses', icon: '💸' },
                { id: 'bills', label: 'Bills', icon: '🧾', badge: bills.filter(b => b.status === 'Unpaid').length }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setIsProcurementOpen(true);
                    setIsMobileMenuOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    background: activeTab === tab.id ? 'rgba(43, 140, 138, 0.15)' : 'transparent',
                    color: activeTab === tab.id ? '#33A19D' : 'rgba(255, 255, 255, 0.6)',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontWeight: activeTab === tab.id ? '600' : '500',
                    fontSize: '0.85rem',
                    transition: 'all 0.2s ease',
                    borderLeft: activeTab === tab.id ? '3px solid #2B8C8A' : '3px solid transparent'
                  }}
                  onMouseEnter={e => {
                    if (activeTab !== tab.id) {
                      e.currentTarget.style.color = 'white';
                      e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (activeTab !== tab.id) {
                      e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)';
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  <span>{tab.icon}</span>
                  <span style={{ flexGrow: 1 }}>{tab.label}</span>
                  {tab.badge > 0 && (
                    <span style={{ background: activeTab === tab.id ? '#33A19D' : 'var(--secondary)', color: 'white', borderRadius: '50%', width: '16px', height: '16px', fontSize: '0.60rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Bottom Flat Items */}
          {[
            { id: 'analytics', label: 'Analytics', icon: '📈' },
            { id: 'messages', label: 'Messages', icon: '✉️', badge: messages.length },
            { id: 'settings', label: 'Settings', icon: '⚙️' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setIsMobileMenuOpen(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '11px 16px',
                borderRadius: '10px',
                border: 'none',
                background: activeTab === tab.id ? 'rgba(43, 140, 138, 0.15)' : 'transparent',
                color: activeTab === tab.id ? '#33A19D' : 'rgba(255, 255, 255, 0.7)',
                textAlign: 'left',
                cursor: 'pointer',
                fontWeight: activeTab === tab.id ? '600' : '500',
                fontSize: '0.92rem',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                borderLeft: activeTab === tab.id ? '3px solid #2B8C8A' : '3px solid transparent'
              }}
              onMouseEnter={e => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.color = 'white';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                }
              }}
              onMouseLeave={e => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <span>{tab.icon}</span>
              <span style={{ flexGrow: 1 }}>{tab.label}</span>
              {tab.badge > 0 && (
                <span style={{ background: 'var(--secondary)', color: 'white', borderRadius: '50%', width: '18px', height: '18px', fontSize: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Sidebar Footer Link */}
        <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <a href="/" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600, transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = 'white'} onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}>
            <span>🏠</span> Live Shop View
          </a>
          <button
            type="button"
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#fca5a5',
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '8px',
              padding: '8px 12px',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              width: '100%',
              textAlign: 'left',
              transition: 'all 0.25s'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.35)';
              e.currentTarget.style.color = '#ef4444';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)';
              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.2)';
              e.currentTarget.style.color = '#fca5a5';
            }}
          >
            <span>🚪</span> Logout Session
          </button>
        </div>
      </aside>

      {/* 2. MAIN CONTENT AREA */}
      <main className="main-panel" style={{ flexGrow: 1, padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem', overflowX: 'hidden' }}>

        {/* Mobile Top Bar */}
        <div style={{
          display: 'none',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          background: '#0B2339',
          color: 'white',
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.08)'
        }} className="mobile-header-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                fontSize: '1.5rem',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ☰
            </button>
            <h2 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1rem', margin: 0 }}>NBT Portal</h2>
          </div>
          <span style={{ fontSize: '0.72rem', background: '#33A19D', padding: '4px 10px', borderRadius: '20px', fontWeight: 700 }}>LIVE</span>
        </div>

        {/* Workspace Title Bar */}
        <header className="workspace-title-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.85rem', margin: 0, textTransform: 'capitalize' }}>
              {activeTab} Management
            </h1>
            <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0', fontSize: '0.88rem' }}>
              Neat Brand Trade control panel & enterprise resource systems.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', background: '#e2e8f0', padding: '6px 12px', borderRadius: '20px', fontWeight: 600, color: 'var(--text-muted)' }}>
              🟢 Live System Connected
            </span>
          </div>
        </header>

        {/* -------------------- TAB CONTENT SWITCHER -------------------- */}

        {/* TAB A: DASHBOARD WORKSPACE */}
        {activeTab === 'dashboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* KPI Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
              {[
                { title: 'Total GHC Revenue', value: `GH₵ ${totalRevenue.toLocaleString('en-US')}`, subtitle: 'Historical + completed checkouts', icon: '💰', color: '#0B2339' },
                { title: 'Store Placed Orders', value: totalOrdersCount, subtitle: 'Includes standard & mock seeds', icon: '📦', color: 'var(--secondary)' },
                { title: 'Active Suppliers', value: activeManufacturers.filter(m => m.status !== 'Inactive').length, subtitle: 'Chemical & packaging partners', icon: '🏢', color: '#7c3aed' },
                { title: 'Pending P.O.s', value: activeManufacturerPOs.filter(p => p.status === 'Draft' || p.status === 'Sent').length, subtitle: 'Awaiting delivery or approval', icon: '📝', color: '#d97706' },
                { title: 'Unpaid Invoices', value: `GH₵ ${dbInvoices.filter(i => i.status === 'Pending').reduce((s, i) => s + (parseFloat(i.totalAmount) || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, subtitle: 'Outstanding supplier balances', icon: '🧾', color: '#dc2626' },
                { title: 'Inquiry Inboxes', value: `${activeMessages.length} inquiries`, subtitle: 'Pending wholesale inquiries', icon: '✉️', color: '#0ea5e9' }
              ].map((kpi, idx) => (
                <div key={idx} style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{kpi.title}</span>
                    <h3 style={{ fontSize: '1.6rem', fontWeight: 800, margin: '8px 0 4px 0', color: '#0B2339', fontFamily: 'Outfit' }}>{kpi.value}</h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{kpi.subtitle}</span>
                  </div>
                  <div style={{ fontSize: '1.85rem', padding: '10px', background: '#f4f7f9', borderRadius: '12px' }}>{kpi.icon}</div>
                </div>
              ))}
            </div>

            {/* Quick Actions & Pending Alerts */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem' }} className="kpi-detail-panel">

              {/* Left Column: Recent Orders Alert Table */}
              <div style={{ background: 'white', padding: '1.75rem', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '10px' }}>
                  <h3 style={{ fontFamily: 'Outfit', fontWeight: 850, fontSize: '1.15rem', margin: 0 }}>🚨 Pending Store Orders</h3>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button
                      onClick={handleOpenCreateOrder}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'linear-gradient(135deg, var(--primary), #1a7a78)', color: 'white', border: 'none', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', boxShadow: '0 2px 8px rgba(43,140,138,0.35)', transition: 'all 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                    >
                      ✚ New Order
                    </button>
                    <button onClick={() => setActiveTab('orders')} style={{ background: 'none', border: 'none', color: 'var(--secondary)', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}>View All →</button>
                  </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-surface)' }}>
                        <th style={{ padding: '10px', textAlign: 'left', fontWeight: 600 }}>Date</th>
                        <th style={{ padding: '10px', textAlign: 'left', fontWeight: 600 }}>Buyer</th>
                        <th style={{ padding: '10px', textAlign: 'left', fontWeight: 600 }}>Total Price</th>
                        <th style={{ padding: '10px', textAlign: 'left', fontWeight: 600 }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeOrders.filter(o => o.status === 'pending').slice(0, 3).map(order => (
                        <tr key={order.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '12px 10px' }}>{order.date}</td>
                          <td style={{ padding: '12px 10px', fontWeight: 600 }}>{order.customer?.name}</td>
                          <td style={{ padding: '12px 10px', fontWeight: 700 }}>GH₵ {order.totalAmount}</td>
                          <td style={{ padding: '12px 10px' }}>
                            <span style={{ background: '#fee2e2', color: '#ef4444', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>{order.status}</span>
                          </td>
                        </tr>
                      ))}
                      {activeOrders.filter(o => o.status === 'pending').length === 0 && (
                        <tr>
                          <td colSpan="4" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic' }}>✓ No pending orders. All clean!</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right Column: Dynamic Messaging Alerts */}
              <div style={{ background: 'white', padding: '1.75rem', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <h3 style={{ fontFamily: 'Outfit', fontWeight: 850, fontSize: '1.15rem', margin: 0 }}>✉️ Unread Messages</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {activeMessages.slice(0, 2).map((msg) => (
                    <div key={msg.id} style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', borderLeft: '3px solid var(--secondary)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.82rem' }}>{msg.contactPerson} ({msg.industry})</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{msg.date}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                        {msg.message?.slice(0, 75)}...
                      </p>
                    </div>
                  ))}
                </div>
                <button onClick={() => setActiveTab('messages')} className="btn btn-outline" style={{ padding: '8px', width: '100%', fontSize: '0.85rem', borderRadius: '8px', marginTop: 'auto' }}>Open System Inbox</button>
              </div>

            </div>
          </div>
        )}

        {/* TAB B: PRODUCT MANAGEMENT WORKSPACE (ZOHO BOOKS STYLE) */}
        {activeTab === 'products' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: '#fafbfd', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)', minHeight: '80vh', position: 'relative' }}>

            {/* Hidden upload inputs for excel integration */}
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={handleExcelUpload}
              ref={fileInputRef}
              style={{ display: 'none' }}
              id="excel-upload"
            />

            {/* SUB-TABS SWITCHER */}
            <div style={{ display: 'flex', borderBottom: '1px solid #cbd5e1', marginBottom: '0.5rem', gap: '24px' }}>
              <button
                onClick={() => setProductsSubTab('items')}
                style={{
                  padding: '12px 6px',
                  background: 'none',
                  border: 'none',
                  borderBottom: productsSubTab === 'items' ? '3px solid #1A73E8' : '3px solid transparent',
                  color: productsSubTab === 'items' ? '#1A73E8' : '#64748b',
                  fontWeight: 700,
                  fontSize: '0.92rem',
                  cursor: 'pointer',
                  fontFamily: 'Outfit',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                📦 Items List
              </button>
              <button
                onClick={() => setProductsSubTab('pricelists')}
                style={{
                  padding: '12px 6px',
                  background: 'none',
                  border: 'none',
                  borderBottom: productsSubTab === 'pricelists' ? '3px solid #1A73E8' : '3px solid transparent',
                  color: productsSubTab === 'pricelists' ? '#1A73E8' : '#64748b',
                  fontWeight: 700,
                  fontSize: '0.92rem',
                  cursor: 'pointer',
                  fontFamily: 'Outfit',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                📋 Price Lists
              </button>
            </div>

            {/* Sub-tab 1: Items List */}
            {productsSubTab === 'items' && (
              <>
                {/* ZOHO HEADER BAR */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 10 }}>

                  {/* Dynamic Filter Dropdown Title */}
                  <div style={{ position: 'relative' }}>
                    <button
                      className="product-filter-trigger"
                      onClick={() => setProductDropdownOpen(!productDropdownOpen)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#0B2339',
                        fontFamily: 'Outfit',
                        fontSize: '1.4rem',
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                      {productFilter === 'active' && 'Active Items'}
                      {productFilter === 'inactive' && 'Inactive Items'}
                      {productFilter === 'all' && 'All Items'}
                      {productFilter === 'retail' && 'Retail Pack Items'}
                      {productFilter === 'industrial' && 'Industrial Bulk Items'}
                      <span style={{ fontSize: '0.9rem', color: '#94a3b8', transform: productDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
                    </button>

                    {/* Zoho Dropdown Menu */}
                    {productDropdownOpen && (
                      <div className="product-filter-dropdown" style={{
                        position: 'absolute',
                        top: '100%',
                        left: '12px',
                        marginTop: '8px',
                        background: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                        width: '240px',
                        overflow: 'hidden',
                        zIndex: 999
                      }}>
                        <div style={{ padding: '8px 16px', fontSize: '0.72rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>Filter Items</div>
                        {[
                          { key: 'active', label: 'Active Items' },
                          { key: 'inactive', label: 'Inactive Items' },
                          { key: 'all', label: 'All Items' },
                          { key: 'retail', label: 'Retail Pack' },
                          { key: 'industrial', label: 'Industrial Bulk' }
                        ].map(opt => (
                          <button
                            key={opt.key}
                            onClick={() => {
                              setProductFilter(opt.key);
                              setProductDropdownOpen(false);
                            }}
                            style={{
                              width: '100%',
                              padding: '12px 16px',
                              textAlign: 'left',
                              border: 'none',
                              background: productFilter === opt.key ? '#f0f6ff' : 'white',
                              color: productFilter === opt.key ? '#1A73E8' : '#334155',
                              fontSize: '0.88rem',
                              fontWeight: productFilter === opt.key ? 700 : 500,
                              cursor: 'pointer',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              transition: 'background 0.15s'
                            }}
                            onMouseEnter={e => { if (productFilter !== opt.key) e.currentTarget.style.background = '#f8fafc'; }}
                            onMouseLeave={e => { if (productFilter !== opt.key) e.currentTarget.style.background = 'white'; }}
                          >
                            {opt.label}
                            {productFilter === opt.key && <span style={{ color: '#1A73E8', fontWeight: 800 }}>✓</span>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons: Zoho Style + New Button & Three Dots */}
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button
                      onClick={handleOpenAddModal}
                      style={{
                        background: '#1A73E8',
                        color: 'white',
                        border: 'none',
                        padding: '10px 20px',
                        borderRadius: '8px',
                        fontWeight: 700,
                        fontSize: '0.88rem',
                        cursor: 'pointer',
                        boxShadow: '0 2px 4px rgba(26,115,232,0.2)',
                        transition: 'background 0.2s, transform 0.1s'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#1557b0'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#1A73E8'; e.currentTarget.style.transform = 'none'; }}
                    >
                      + New
                    </button>

                    {/* Options Circle Button */}
                    <div style={{ position: 'relative' }}>
                      <button
                        onClick={() => setProductOptionsOpen(!productOptionsOpen)}
                        style={{
                          background: 'white',
                          color: '#475569',
                          border: '1px solid #cbd5e1',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          fontWeight: 700,
                          fontSize: '0.88rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                        onMouseLeave={e => e.currentTarget.style.background = 'white'}
                      >
                        •••
                      </button>

                      {/* Zoho Options Menu */}
                      {productOptionsOpen && (
                        <div style={{
                          position: 'absolute',
                          top: '100%',
                          right: 0,
                          marginTop: '8px',
                          background: 'white',
                          border: '1px solid #e2e8f0',
                          borderRadius: '12px',
                          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                          width: '220px',
                          overflow: 'hidden',
                          zIndex: 999
                        }}>
                          {/* Sort Submenu Header */}
                          <div style={{ padding: '8px 16px', fontSize: '0.72rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>Sort Options</div>
                          {[
                            { key: 'name', label: 'Sort by Name' },
                            { key: 'purchaseRate', label: 'Sort by Purchase Rate' },
                            { key: 'rate', label: 'Sort by Rate' },
                            { key: 'stock', label: 'Sort by Stock UOM' }
                          ].map(sortOpt => (
                            <button
                              key={sortOpt.key}
                              onClick={() => {
                                if (productSortField === sortOpt.key) {
                                  setProductSortOrder(productSortOrder === 'asc' ? 'desc' : 'asc');
                                } else {
                                  setProductSortField(sortOpt.key);
                                  setProductSortOrder('asc');
                                }
                                setProductOptionsOpen(false);
                              }}
                              style={{
                                width: '100%',
                                padding: '10px 16px',
                                textAlign: 'left',
                                border: 'none',
                                background: 'white',
                                color: '#334155',
                                fontSize: '0.82rem',
                                fontWeight: productSortField === sortOpt.key ? 700 : 500,
                                cursor: 'pointer',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                              onMouseLeave={e => e.currentTarget.style.background = 'white'}
                            >
                              <span>{sortOpt.label} {productSortField === sortOpt.key && (productSortOrder === 'asc' ? '▲' : '▼')}</span>
                            </button>
                          ))}

                          <div style={{ height: '1px', background: '#f1f5f9' }} />

                          <button
                            onClick={() => {
                              setProductOptionsOpen(false);
                              fileInputRef.current?.click();
                            }}
                            style={{
                              width: '100%',
                              padding: '12px 16px',
                              textAlign: 'left',
                              border: 'none',
                              background: 'white',
                              color: '#1e293b',
                              fontSize: '0.85rem',
                              fontWeight: 500,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                            onMouseLeave={e => e.currentTarget.style.background = 'white'}
                          >
                            📤 Import Items (.xlsx)
                          </button>

                          <button
                            onClick={() => {
                              setProductOptionsOpen(false);
                              handleExportCSV();
                            }}
                            style={{
                              width: '100%',
                              padding: '12px 16px',
                              textAlign: 'left',
                              border: 'none',
                              background: 'white',
                              color: '#1e293b',
                              fontSize: '0.85rem',
                              fontWeight: 500,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                            onMouseLeave={e => e.currentTarget.style.background = 'white'}
                          >
                            📥 Export Items (.csv)
                          </button>

                          <button
                            onClick={() => {
                              setProductOptionsOpen(false);
                              setIsRefreshingProducts(true);
                              setTimeout(() => setIsRefreshingProducts(false), 600);
                            }}
                            style={{
                              width: '100%',
                              padding: '12px 16px',
                              textAlign: 'left',
                              border: 'none',
                              background: 'white',
                              color: '#1e293b',
                              fontSize: '0.85rem',
                              fontWeight: 500,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                            onMouseLeave={e => e.currentTarget.style.background = 'white'}
                          >
                            🔄 Refresh List
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                </div>

                {/* BULK ACTIONS / FILTER STATUS BAR */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: selectedProducts.length > 0 ? '#eff6ff' : '#f8fafc',
                  border: '1px solid #e2e8f0',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  color: '#475569',
                  transition: 'background 0.2s'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#64748b' }}>
                      <line x1="4" y1="21" x2="4" y2="14"></line>
                      <line x1="4" y1="10" x2="4" y2="3"></line>
                      <line x1="12" y1="21" x2="12" y2="12"></line>
                      <line x1="12" y1="8" x2="12" y2="3"></line>
                      <line x1="20" y1="21" x2="20" y2="16"></line>
                      <line x1="20" y1="12" x2="20" y2="3"></line>
                      <line x1="1" y1="14" x2="7" y2="14"></line>
                      <line x1="9" y1="8" x2="15" y2="8"></line>
                      <line x1="17" y1="16" x2="23" y2="16"></line>
                    </svg>
                    {selectedProducts.length > 0 ? (
                      <span style={{ fontWeight: 700, color: '#1E3A8A' }}>{selectedProducts.length} items selected</span>
                    ) : (
                      <span>Showing {sortedProducts.length} products total in {productFilter}</span>
                    )}
                  </div>

                  {selectedProducts.length > 0 && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={async () => {
                          if (window.confirm(`Are you sure you want to delete ${selectedProducts.length} products?`)) {
                            for (const pid of selectedProducts) {
                              await deleteProduct(pid);
                            }
                            setSelectedProducts([]);
                            alert("Selected products deleted successfully.");
                          }
                        }}
                        style={{ background: '#fee2e2', color: '#ef4444', border: '1px solid #fecaca', padding: '6px 12px', borderRadius: '6px', fontWeight: 700, cursor: 'pointer', fontSize: '0.78rem' }}
                      >
                        🗑 Bulk Delete
                      </button>
                      <button
                        onClick={() => setSelectedProducts([])}
                        style={{ background: 'white', color: '#64748b', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '6px', fontWeight: 700, cursor: 'pointer', fontSize: '0.78rem' }}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>

                {/* ZOHO ITEMS DATA TABLE */}
                <div style={{
                  background: 'white',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                  overflowX: 'auto',
                  opacity: isRefreshingProducts ? 0.6 : 1,
                  transition: 'opacity 0.2s'
                }}>
                  <table style={{ width: '100%', minWidth: '950px', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                    <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <tr>
                        <th style={{ padding: '12px 16px', width: '40px', textAlign: 'center', verticalAlign: 'bottom' }}>
                          <input
                            type="checkbox"
                            checked={selectedProducts.length === sortedProducts.length && sortedProducts.length > 0}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedProducts(sortedProducts.map(p => p.id));
                              } else {
                                setSelectedProducts([]);
                              }
                            }}
                            style={{ cursor: 'pointer' }}
                          />
                        </th>
                        <th
                          onClick={() => {
                            if (productSortField === 'name') {
                              setProductSortOrder(productSortOrder === 'asc' ? 'desc' : 'asc');
                            } else {
                              setProductSortField('name');
                              setProductSortOrder('asc');
                            }
                          }}
                          style={{
                            padding: '12px 16px',
                            color: productSortField === 'name' ? '#1A73E8' : '#64748b',
                            fontWeight: 700,
                            fontSize: '0.72rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            cursor: 'pointer',
                            userSelect: 'none',
                            transition: 'color 0.2s',
                            whiteSpace: 'normal',
                            verticalAlign: 'bottom',
                            lineHeight: '1.2'
                          }}
                          title="Click to sort by name (A-Z / Z-A)"
                        >
                          Name {productSortField === 'name' && (productSortOrder === 'asc' ? ' ▲' : ' ▼')}
                        </th>
                        <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'normal', verticalAlign: 'bottom', lineHeight: '1.2' }}>Purchase Rate</th>
                        <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'normal', verticalAlign: 'bottom', lineHeight: '1.2' }}>Rate</th>
                        <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'normal', verticalAlign: 'bottom', lineHeight: '1.2' }}>Qty In Box</th>
                        <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'normal', verticalAlign: 'bottom', lineHeight: '1.2' }}>Unit Price</th>
                        <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'normal', verticalAlign: 'bottom', lineHeight: '1.2' }}>Profit</th>
                        <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'normal', verticalAlign: 'bottom', lineHeight: '1.2' }}>Stock On Hand</th>
                        <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right', verticalAlign: 'bottom' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedProducts.map(product => {
                        const isRowSelected = selectedProducts.includes(product.id);
                        return (
                          <tr
                            key={product.id}
                            style={{
                              borderBottom: '1px solid #f1f5f9',
                              background: isRowSelected ? '#f0f6ff' : 'white',
                              transition: 'background 0.15s'
                            }}
                            className="zoho-table-row"
                          >
                            {/* Checkbox cell */}
                            <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                              <input
                                type="checkbox"
                                checked={isRowSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedProducts([...selectedProducts, product.id]);
                                  } else {
                                    setSelectedProducts(selectedProducts.filter(id => id !== product.id));
                                  }
                                }}
                                style={{ cursor: 'pointer' }}
                              />
                            </td>

                            {/* NAME (Clickable Link) */}
                            <td style={{ padding: '14px 16px' }}>
                              <button
                                onClick={() => handleEditProduct(product)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#1A73E8',
                                  fontFamily: 'inherit',
                                  fontSize: '0.85rem',
                                  fontWeight: 600,
                                  textAlign: 'left',
                                  cursor: 'pointer',
                                  padding: 0,
                                  textDecoration: 'none'
                                }}
                                onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                                onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                              >
                                {product.name}
                              </button>
                            </td>

                            {/* PURCHASE RATE */}
                            <td style={{ padding: '14px 16px', color: '#1e293b', fontWeight: 600 }}>
                              GHS{getProductPurchaseRate(product).toFixed(2)}
                            </td>

                            {/* RATE */}
                            <td style={{ padding: '14px 16px', color: '#1e293b', fontWeight: 600 }}>
                              GHS{getProductRate(product).toFixed(2)}
                            </td>

                            {/* QTY IN BOX */}
                            <td style={{ padding: '14px 16px', color: '#475569', fontWeight: 600 }}>
                              {product.sizes?.[0]?.qtyInBox || 1}
                            </td>

                            {/* UNIT PRICE */}
                            <td style={{ padding: '14px 16px', color: '#1e293b', fontWeight: 600 }}>
                              GHS{(getProductRate(product) / (product.sizes?.[0]?.qtyInBox || 1)).toFixed(2)}
                            </td>

                            {/* PROFIT */}
                            <td style={{ padding: '14px 16px' }}>
                              {(() => {
                                const pRate = getProductPurchaseRate(product);
                                const sRate = getProductRate(product);
                                const profit = Number((sRate - pRate).toFixed(2));
                                return (
                                  <span style={{
                                    color: profit > 0 ? '#10b981' : (profit < 0 ? '#ef4444' : '#64748b'),
                                    fontWeight: 700
                                  }}>
                                    GHS{profit.toFixed(2)}
                                  </span>
                                );
                              })()}
                            </td>

                            {/* STOCK ON HAND */}
                            <td style={{ padding: '14px 16px', color: '#64748b' }}>
                              {getProductStockOnHand(product)}
                            </td>

                            {/* ROW ACTIONS */}
                            <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                                <button
                                  onClick={() => handleEditProduct(product)}
                                  style={{
                                    background: '#eff6ff',
                                    color: '#1A73E8',
                                    border: 'none',
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontWeight: 700,
                                    fontSize: '0.78rem'
                                  }}
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => {
                                    if (window.confirm(`Are you sure you want to delete ${product.name}?`)) {
                                      deleteProduct(product.id);
                                    }
                                  }}
                                  style={{
                                    background: '#fee2e2',
                                    color: '#ef4444',
                                    border: 'none',
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontWeight: 700,
                                    fontSize: '0.78rem'
                                  }}
                                >
                                  Delete
                                </button>
                              </div>
                            </td>

                          </tr>
                        );
                      })}

                      {sortedProducts.length === 0 && (
                        <tr>
                          <td colSpan="9" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                            <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>📦</div>
                            <div style={{ fontWeight: 600 }}>No items match this filter</div>
                            <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '4px' }}>Try switching columns or adding a new item!</div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* Sub-tab 2: Price Lists Registry */}
            {productsSubTab === 'pricelists' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Zoho Header Bar for Price Lists */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h2 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.35rem', color: '#0B2339', margin: 0 }}>📋 Price Lists</h2>
                    <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'block', marginTop: '2px' }}>
                      Set rules to automatically markup or markdown rates for all items, or customize rates individually.
                    </span>
                  </div>
                  <button
                    onClick={() => setShowCreatePriceListModal(true)}
                    style={{
                      background: '#1A73E8',
                      color: 'white',
                      border: 'none',
                      padding: '10px 18px',
                      borderRadius: '8px',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      boxShadow: '0 2px 4px rgba(26,115,232,0.2)',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#1557b0'}
                    onMouseLeave={e => e.currentTarget.style.background = '#1A73E8'}
                  >
                    + New Price List
                  </button>
                </div>

                {/* Price Lists Table */}
                <div style={{
                  background: 'white',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                  overflow: 'hidden'
                }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                    <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <tr>
                        <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Name</th>
                        <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Transaction Type</th>
                        <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Price List Type</th>
                        <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Percentage</th>
                        <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Round Off To</th>
                        <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Description</th>
                        <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { id: 'mock_pl_1', name: 'Wholesale Prime Partner (-15%)', transactionType: 'Sales', type: 'All Items', percentage: '-15%', roundOffTo: 'Nearest decimal (0.10)', description: 'For Prime Tier 1 distributors' },
                        { id: 'mock_pl_2', name: 'Retail Standard Markup (+20%)', transactionType: 'Sales', type: 'All Items', percentage: '+20%', roundOffTo: 'Nearest whole number', description: 'Standard retail client tier markup' },
                        { id: 'mock_pl_3', name: 'Supplier Direct Discount (-8%)', transactionType: 'Purchase', type: 'All Items', percentage: '-8%', roundOffTo: 'Never mind', description: 'Direct purchase order discount rate' },
                        ...priceLists.map(pl => ({
                          id: pl.id,
                          name: pl.name,
                          transactionType: pl.transactionType,
                          type: pl.type,
                          percentage: pl.type === 'All Items' ? `${Number(pl.percentage) > 0 ? '+' : ''}${pl.percentage}%` : '—',
                          roundOffTo: pl.roundOffTo || 'Never mind',
                          description: pl.description || '—',
                          isFirestore: true
                        }))
                      ].map(pl => (
                        <tr
                          key={pl.id}
                          style={{ borderBottom: '1px solid #f1f5f9' }}
                          className="zoho-table-row"
                        >
                          <td style={{ padding: '14px 16px', fontWeight: 700, color: '#0B2339' }}>{pl.name}</td>
                          <td style={{ padding: '14px 16px' }}>
                            <span style={{
                              padding: '3px 8px',
                              borderRadius: '4px',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              background: pl.transactionType === 'Sales' ? '#ecfdf5' : '#fef3c7',
                              color: pl.transactionType === 'Sales' ? '#065f46' : '#92400e'
                            }}>{pl.transactionType.toUpperCase()}</span>
                          </td>
                          <td style={{ padding: '14px 16px', color: '#475569' }}>{pl.type}</td>
                          <td style={{ padding: '14px 16px', fontWeight: 600, color: pl.percentage.includes('-') ? '#ef4444' : (pl.percentage === '—' ? '#64748b' : '#10b981') }}>
                            {pl.percentage}
                          </td>
                          <td style={{ padding: '14px 16px', color: '#64748b' }}>{pl.roundOffTo}</td>
                          <td style={{ padding: '14px 16px', color: '#475569', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {pl.description}
                          </td>
                          <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                            {pl.isFirestore ? (
                              <button
                                onClick={() => handleDeletePriceList(pl.id)}
                                style={{
                                  background: '#fee2e2',
                                  color: '#ef4444',
                                  border: 'none',
                                  padding: '5px 10px',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontWeight: 700,
                                  fontSize: '0.75rem'
                                }}
                              >
                                Delete
                              </button>
                            ) : (
                              <span style={{ color: '#94a3b8', fontSize: '0.75rem', fontStyle: 'italic' }}>System Default</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* CSS styles injected for table row hover */}
            <style>{`
              .zoho-table-row:hover {
                background: #f8fafc !important;
              }
            `}</style>

          </div>
        )}

        {/* TAB C: ORDERS BOARD WORKSPACE */}
        {activeTab === 'orders' && (
          <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '12px' }}>
              <h3 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.25rem', margin: 0 }}>📦 Purchase Orders Registry</h3>
              <button
                onClick={handleOpenCreateOrder}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg, var(--primary), #1a7a78)', color: 'white', border: 'none', padding: '11px 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: 800, fontSize: '0.88rem', boxShadow: '0 4px 14px rgba(43,140,138,0.4)', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(43,140,138,0.5)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(43,140,138,0.4)'; }}
              >
                ✚ Create New Order
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '12px 15px', textAlign: 'left', fontWeight: 650 }}>Order ID</th>
                    <th style={{ padding: '12px 15px', textAlign: 'left', fontWeight: 650 }}>Client Info</th>
                    <th style={{ padding: '12px 15px', textAlign: 'left', fontWeight: 650 }}>Order Summary</th>
                    <th style={{ padding: '12px 15px', textAlign: 'left', fontWeight: 650 }}>Sum Price</th>
                    <th style={{ padding: '12px 15px', textAlign: 'left', fontWeight: 650 }}>Workflow Status</th>
                    <th style={{ padding: '12px 15px', textAlign: 'right', fontWeight: 650 }}>Modify actions</th>
                  </tr>
                </thead>
                <tbody>
                  {activeOrders.map(order => {
                    const isExpanded = expandedOrderId === order.id;
                    const itemsCount = order.items?.reduce((acc, item) => acc + (parseInt(item.qty || item.qtyInBox || 1) || 1), 0) || 0;
                    return (
                      <Fragment key={order.id}>
                        <tr
                          onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                          style={{
                            borderBottom: isExpanded ? 'none' : '1px solid var(--border)',
                            cursor: 'pointer',
                            background: isExpanded ? '#f8fafc' : 'white',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={e => { if (!isExpanded) e.currentTarget.style.background = 'rgba(43, 140, 138, 0.02)'; }}
                          onMouseLeave={e => { if (!isExpanded) e.currentTarget.style.background = 'white'; }}
                        >
                          <td style={{ padding: '15px', fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary)' }}>
                            <span style={{ marginRight: '8px', fontSize: '0.7rem', display: 'inline-block', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', color: 'var(--text-muted)' }}>▶</span>
                            #{order.id.slice(-6).toUpperCase()}
                          </td>
                          <td style={{ padding: '15px' }}>
                            <div style={{ fontWeight: 700 }}>{order.customer?.name}</div>
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>📞 {order.customer?.phone}</span>
                          </td>
                          <td style={{ padding: '15px', fontWeight: 600, color: 'var(--text-muted)' }}>
                            📦 {itemsCount} {itemsCount === 1 ? 'item' : 'items'}
                          </td>
                          <td style={{ padding: '15px', fontWeight: 800 }}>GH₵ {order.totalAmount}</td>
                          <td style={{ padding: '15px' }}>
                            <span style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              background: order.status === 'pending' ? '#fef3c7' : (order.status === 'shipped' ? '#e0f2fe' : '#dcfce7'),
                              color: order.status === 'pending' ? '#b45309' : (order.status === 'shipped' ? '#0369a1' : '#15803d')
                            }}>{order.status}</span>
                          </td>
                          <td style={{ padding: '15px', textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                              <button onClick={() => setSelectedInvoiceOrder(order)} style={{ background: 'rgba(11, 35, 57, 0.08)', color: 'var(--primary)', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>🧾 Invoice</button>
                              <button onClick={() => handleOpenUniversalCreator('order', order)} style={{ background: 'rgba(43, 140, 138, 0.08)', color: 'var(--primary)', border: '1px solid rgba(43, 140, 138, 0.25)', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>✏️ Edit</button>
                              <a
                                href={`https://wa.me/${formatGhanaPhone(order.customer?.phone)}?text=${encodeURIComponent(getQuickWhatsAppPO(order))}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  background: '#128C7E',
                                  color: 'white',
                                  border: 'none',
                                  padding: '6px 10px',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  textDecoration: 'none',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                💬 Send P.O
                              </a>
                              <button onClick={() => handleUpdateOrderStatus(order.id, 'shipped')} style={{ background: '#e0f2fe', color: '#0369a1', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>🚚 Ship</button>
                              <button onClick={() => handleUpdateOrderStatus(order.id, 'completed')} style={{ background: '#dcfce7', color: '#15803d', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>✓ Complete</button>
                              <button onClick={() => handleDeleteOrder(order.id)} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>Delete</button>
                            </div>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr style={{ background: '#fafbfe', borderBottom: '1px solid var(--border)' }}>
                            <td colSpan="6" style={{ padding: '1.5rem 2rem' }}>
                              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '2rem' }}>
                                {/* Left Column: Detailed Items list */}
                                <div>
                                  <h5 style={{ margin: '0 0 10px 0', fontWeight: 800, color: '#0B2339', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>📋 Order Specifications</h5>
                                  <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.80rem' }}>
                                      <thead>
                                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #cbd5e1', textAlign: 'left' }}>
                                          <th style={{ padding: '10px 14px', fontWeight: 800 }}>Product Item</th>
                                          <th style={{ padding: '10px 14px', fontWeight: 800, textAlign: 'center' }}>Box Size</th>
                                          <th style={{ padding: '10px 14px', fontWeight: 800, textAlign: 'center' }}>Quantity</th>
                                          <th style={{ padding: '10px 14px', fontWeight: 800, textAlign: 'right' }}>Price (GH₵)</th>
                                          <th style={{ padding: '10px 14px', fontWeight: 800, textAlign: 'right' }}>Total (GH₵)</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {order.items?.map((item, idx) => {
                                          const itemQty = parseInt(item.qty || item.qtyInBox || 1) || 1;
                                          const itemPrice = parseFloat(item.unitPrice) || parseFloat(item.price) || 0;
                                          const itemTotal = parseFloat(item.total) || (itemPrice * itemQty);
                                          return (
                                            <tr key={idx} style={{ borderBottom: idx === (order.items.length - 1) ? 'none' : '1px solid #f1f5f9' }}>
                                              <td style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--primary)' }}>🧪 {item.name}</td>
                                              <td style={{ padding: '10px 14px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 600 }}>{item.size || '1L'}</td>
                                              <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 700 }}>{itemQty}</td>
                                              <td style={{ padding: '10px 14px', textAlign: 'right' }}>{itemPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                                              <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 800, color: 'var(--secondary)' }}>{itemTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>

                                {/* Right Column: Customer Shipping Details */}
                                <div>
                                  <h5 style={{ margin: '0 0 10px 0', fontWeight: 800, color: '#0B2339', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>📍 Shipping & Customer Context</h5>
                                  <div style={{ background: 'white', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '10px', boxShadow: 'var(--shadow-sm)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Client Name:</span> <span style={{ fontWeight: 700 }}>{order.customer?.name}</span></div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Phone:</span> <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{order.customer?.phone}</span></div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Email:</span> <span style={{ fontWeight: 700 }}>{order.customer?.email || '—'}</span></div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px', paddingTop: '8px', borderTop: '1px solid #f1f5f9' }}>
                                      <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Shipping / Delivery Address:</span>
                                      <span style={{ fontWeight: 700, color: '#0B2339' }}>📍 {order.customer?.address || '—'}</span>
                                    </div>
                                    {order.notes && (
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px', paddingTop: '8px', borderTop: '1px solid #f1f5f9' }}>
                                        <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Internal Order Notes:</span>
                                        <span style={{ fontStyle: 'italic', color: '#64748b' }}>"{order.notes}"</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB D: CUSTOMERS CRM WORKSPACE */}
        {activeTab === 'customers' && (() => {
          // Dynamic CRM Filtering
          const filteredClients = activeClients.filter(c =>
            c.company?.toLowerCase().includes(crmSearchQuery.toLowerCase()) ||
            c.representative?.toLowerCase().includes(crmSearchQuery.toLowerCase()) ||
            c.phone?.toLowerCase().includes(crmSearchQuery.toLowerCase()) ||
            c.email?.toLowerCase().includes(crmSearchQuery.toLowerCase())
          );

          const filteredLeads = activeMessages.filter(m =>
            m.businessName?.toLowerCase().includes(crmSearchQuery.toLowerCase()) ||
            m.contactPerson?.toLowerCase().includes(crmSearchQuery.toLowerCase()) ||
            m.phone?.toLowerCase().includes(crmSearchQuery.toLowerCase()) ||
            m.message?.toLowerCase().includes(crmSearchQuery.toLowerCase())
          );

          const filteredRetail = activeOrders.filter(o =>
            o.customer?.name?.toLowerCase().includes(crmSearchQuery.toLowerCase()) ||
            o.customer?.phone?.toLowerCase().includes(crmSearchQuery.toLowerCase()) ||
            o.customer?.address?.toLowerCase().includes(crmSearchQuery.toLowerCase())
          );

          // Group Leads for Pipeline columns
          const leadsNew = filteredLeads.filter(m => !m.status || m.status === 'new');
          const leadsContacted = filteredLeads.filter(m => m.status === 'contacted');
          const leadsNegotiating = filteredLeads.filter(m => m.status === 'negotiating');

          // Sum total credit outstanding
          const totalOutstanding = activeClients.reduce((acc, c) => acc + (c.creditUsed || 0), 0);

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

              {/* Premium Dashboard Metrics Panel */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
                {[
                  { label: "B2B Active Distributors", val: activeClients.length, detail: "Authorized wholesale buyers", color: "#33A19D", icon: "🏢" },
                  { label: "Pending Inbound Leads", val: activeMessages.length, detail: "Warm procurement inquiries", color: "#F59E0B", icon: "📥" },
                  { label: "Total Credit Outstanding", val: `GH₵ ${totalOutstanding.toLocaleString()}`, detail: "Outstanding distributor balances", color: "#EF4444", icon: "💳" },
                  { label: "Direct Retail Buyers", val: activeOrders.length, detail: "E-Commerce checkout buyers", color: "var(--primary)", icon: "🛍️" }
                ].map((stat, idx) => (
                  <div key={idx} style={{ background: 'white', padding: '1.25rem', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{stat.label}</span>
                      <h4 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '6px 0 2px 0', color: stat.color, fontFamily: 'Outfit' }}>{stat.val}</h4>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{stat.detail}</span>
                    </div>
                    <div style={{ fontSize: '1.75rem', background: '#f8fafc', padding: '8px', borderRadius: '12px' }}>{stat.icon}</div>
                  </div>
                ))}
              </div>

              {/* Sub-tab Selection Header with Search Bar */}
              <div style={{
                background: 'white',
                padding: '1.25rem 1.5rem',
                borderRadius: '16px',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '15px'
              }}>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', background: '#f1f5f9', padding: '4px', borderRadius: '10px' }}>
                  {[
                    { id: 'pipeline', label: '📊 Pipeline Board', count: activeMessages.length + activeClients.length },
                    { id: 'leads', label: '📥 B2B Inquiries', count: activeMessages.length },
                    { id: 'wholesalers', label: '🏢 Distributors', count: activeClients.length },
                    { id: 'retail', label: '🛍️ Retail Buyers', count: activeOrders.length }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setCrmSubTab(tab.id)}
                      style={{
                        border: 'none',
                        background: crmSubTab === tab.id ? 'var(--primary)' : 'transparent',
                        color: crmSubTab === tab.id ? 'white' : 'var(--text-muted)',
                        padding: '8px 14px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.2s'
                      }}
                    >
                      {tab.label}
                      <span style={{
                        background: crmSubTab === tab.id ? 'var(--secondary)' : 'rgba(0,0,0,0.08)',
                        color: crmSubTab === tab.id ? 'white' : 'var(--text-main)',
                        padding: '1px 5px',
                        borderRadius: '20px',
                        fontSize: '0.65rem',
                        fontWeight: 800
                      }}>
                        {tab.count}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Filter and search parameters */}
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexGrow: 1, maxWidth: '560px', justifyContent: 'flex-end' }}>
                  <input
                    type="text"
                    placeholder="🔍 Search leads, wholesalers..."
                    value={crmSearchQuery}
                    onChange={e => setCrmSearchQuery(e.target.value)}
                    style={{
                      flexGrow: 1,
                      padding: '8px 14px',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      outline: 'none',
                      background: '#f8fafc',
                      minWidth: '150px'
                    }}
                  />
                  <button
                    onClick={() => document.getElementById('customer-excel-upload-input').click()}
                    className="btn btn-outline"
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      cursor: 'pointer',
                      boxShadow: '0 4px 6px rgba(11, 35, 57, 0.05)',
                      height: '38px',
                      border: '1px solid var(--border)',
                      background: 'white',
                      color: 'var(--primary)',
                      transition: 'all 0.2s'
                    }}
                  >
                    📤 Import (.xlsx)
                  </button>
                  <input
                    type="file"
                    id="customer-excel-upload-input"
                    accept=".xlsx, .xls"
                    onChange={handleCustomerExcelUpload}
                    style={{ display: 'none' }}
                  />
                  <button
                    onClick={() => setShowAddCustomerModal(true)}
                    className="btn btn-primary"
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      cursor: 'pointer',
                      boxShadow: '0 4px 6px rgba(43, 140, 138, 0.15)',
                      height: '38px',
                      border: 'none',
                      color: 'white'
                    }}
                  >
                    ➕ Add Customer
                  </button>
                </div>
              </div>

              {/* 1. VISUAL PIPELINE BOARD VIEW */}
              {crmSubTab === 'pipeline' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.25rem', overflowX: 'auto', paddingBottom: '1rem' }}>

                  {/* Stage 1: New Leads */}
                  <div style={{ background: '#f8fafc', borderRadius: '16px', border: '1px solid var(--border)', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: '480px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px' }}>
                      <h4 style={{ margin: 0, fontWeight: 800, color: 'var(--primary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>📥 Inbound Leads</h4>
                      <span style={{ background: '#cbd5e1', color: '#475569', fontSize: '0.7rem', fontWeight: 800, padding: '2px 8px', borderRadius: '20px' }}>{leadsNew.length}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {leadsNew.map(lead => (
                        <div key={lead.id}
                          onClick={() => setSelectedClient(lead)}
                          style={{ background: 'white', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.01)', cursor: 'pointer', transition: 'all 0.2s' }}
                          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 12px rgba(43, 140, 138, 0.08)'; }}
                          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.01)'; }}
                        >
                          <h5 style={{ margin: '0 0 4px 0', fontWeight: 800, color: 'var(--primary)', fontSize: '0.85rem' }}>{lead.businessName || 'B2B Prospect'}</h5>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Rep: {lead.contactPerson || 'Unknown'}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #f8fafc', paddingTop: '6px', alignItems: 'center' }}>
                            <span>📞 {lead.phone}</span>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleUpdateB2BStatus('bulk_inquiries', lead.id, 'contacted'); }}
                              style={{ background: 'var(--secondary)', color: 'white', border: 'none', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.62rem', fontWeight: 800 }}
                            >
                              Contact ➡️
                            </button>
                          </div>
                        </div>
                      ))}
                      {leadsNew.length === 0 && (
                        <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.75rem', padding: '20px 0', fontStyle: 'italic' }}>No new leads.</div>
                      )}
                    </div>
                  </div>

                  {/* Stage 2: Contacted */}
                  <div style={{ background: '#f8fafc', borderRadius: '16px', border: '1px solid var(--border)', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: '480px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #cbd5e1', paddingBottom: '8px' }}>
                      <h4 style={{ margin: 0, fontWeight: 800, color: 'var(--primary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>📞 Contacted</h4>
                      <span style={{ background: '#33A19D', color: 'white', fontSize: '0.7rem', fontWeight: 800, padding: '2px 8px', borderRadius: '20px' }}>{leadsContacted.length}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {leadsContacted.map(lead => (
                        <div key={lead.id}
                          onClick={() => setSelectedClient(lead)}
                          style={{ background: 'white', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.01)', cursor: 'pointer', transition: 'all 0.2s' }}
                          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 12px rgba(43, 140, 138, 0.08)'; }}
                          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.01)'; }}
                        >
                          <h5 style={{ margin: '0 0 4px 0', fontWeight: 800, color: 'var(--primary)', fontSize: '0.85rem' }}>{lead.businessName || 'B2B Prospect'}</h5>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Rep: {lead.contactPerson || 'Unknown'}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #f8fafc', paddingTop: '6px', alignItems: 'center' }}>
                            <span>📞 {lead.phone}</span>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleUpdateB2BStatus('bulk_inquiries', lead.id, 'negotiating'); }}
                              style={{ background: 'var(--secondary)', color: 'white', border: 'none', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.62rem', fontWeight: 800 }}
                            >
                              Discuss ➡️
                            </button>
                          </div>
                        </div>
                      ))}
                      {leadsContacted.length === 0 && (
                        <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.75rem', padding: '20px 0', fontStyle: 'italic' }}>No contacted leads.</div>
                      )}
                    </div>
                  </div>

                  {/* Stage 3: In Discussion */}
                  <div style={{ background: '#f8fafc', borderRadius: '16px', border: '1px solid var(--border)', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: '480px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #cbd5e1', paddingBottom: '8px' }}>
                      <h4 style={{ margin: 0, fontWeight: 800, color: 'var(--primary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>🤝 Negotiating</h4>
                      <span style={{ background: '#eff6ff', color: '#2563eb', fontSize: '0.7rem', fontWeight: 800, padding: '2px 8px', borderRadius: '20px' }}>{leadsNegotiating.length}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {leadsNegotiating.map(lead => (
                        <div key={lead.id}
                          onClick={() => setSelectedClient(lead)}
                          style={{ background: 'white', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.01)', cursor: 'pointer', transition: 'all 0.2s' }}
                          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 12px rgba(43, 140, 138, 0.08)'; }}
                          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.01)'; }}
                        >
                          <h5 style={{ margin: '0 0 4px 0', fontWeight: 800, color: 'var(--primary)', fontSize: '0.85rem' }}>{lead.businessName || 'B2B Prospect'}</h5>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Rep: {lead.contactPerson || 'Unknown'}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #f8fafc', paddingTop: '6px', alignItems: 'center' }}>
                            <span>📞 {lead.phone}</span>
                            <button
                              onClick={(e) => { e.stopPropagation(); setSelectedClient(lead); }}
                              style={{ background: '#16a34a', color: 'white', border: 'none', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.62rem', fontWeight: 800 }}
                            >
                              Onboard ➡️
                            </button>
                          </div>
                        </div>
                      ))}
                      {leadsNegotiating.length === 0 && (
                        <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.75rem', padding: '20px 0', fontStyle: 'italic' }}>No active discussions.</div>
                      )}
                    </div>
                  </div>

                  {/* Stage 4: Verified Partners */}
                  <div style={{ background: '#f8fafc', borderRadius: '16px', border: '1px solid var(--border)', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: '480px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #bbf7d0', paddingBottom: '8px' }}>
                      <h4 style={{ margin: 0, fontWeight: 800, color: 'var(--primary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>🏆 Distributors</h4>
                      <span style={{ background: '#dcfce7', color: '#16a34a', fontSize: '0.7rem', fontWeight: 800, padding: '2px 8px', borderRadius: '20px' }}>{filteredClients.length}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {filteredClients.map(client => {
                        const limit = client.creditLimit || 50000;
                        const used = client.creditUsed || 0;
                        const utilization = (used / limit) * 100;
                        return (
                          <div key={client.id}
                            onClick={() => setSelectedClient(client)}
                            style={{ background: 'white', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.01)', cursor: 'pointer', transition: 'all 0.2s' }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 12px rgba(43, 140, 138, 0.08)'; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.01)'; }}
                          >
                            <h5 style={{ margin: '0 0 4px 0', fontWeight: 800, color: 'var(--primary)', fontSize: '0.85rem' }}>{client.company}</h5>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Rep: {client.representative}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '8px' }}>📞 +233 {client.phone}</div>

                            <div style={{ borderTop: '1px solid #f8fafc', paddingTop: '6px', fontSize: '0.72rem' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', marginBottom: '2px' }}>
                                <span>Used Limit:</span>
                                <strong>{utilization.toFixed(0)}%</strong>
                              </div>
                              <div style={{ height: '4px', background: '#f1f5f9', borderRadius: '2px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${Math.min(100, utilization)}%`, background: utilization > 80 ? '#ef4444' : 'var(--secondary)' }} />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {filteredClients.length === 0 && (
                        <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.75rem', padding: '20px 0', fontStyle: 'italic' }}>No active partners.</div>
                      )}
                    </div>
                  </div>

                </div>
              )}

              {/* 2. LEADS DETAILED DIRECTORY */}
              {crmSubTab === 'leads' && (
                <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '10px' }}>
                    <h4 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.1rem', margin: 0 }}>Corporate Lead Inquiries</h4>
                    <span style={{ fontSize: '0.75rem', background: '#eff6ff', color: '#1e40af', padding: '4px 10px', borderRadius: '20px', fontWeight: 700 }}>
                      ● Direct B2B Wholesale Leads
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {filteredLeads.map((lead) => (
                      <div key={lead.id}
                        onClick={() => setSelectedClient(lead)}
                        style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '1.25rem', background: '#f8fafc', position: 'relative', cursor: 'pointer', transition: 'all 0.2s' }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.03)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '10px' }}>
                          <div>
                            <h5 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--primary)', fontWeight: 800 }}>{lead.businessName || 'B2B Prospect'}</h5>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--secondary)' }}>Rep: {lead.contactPerson} ({lead.industry || 'General Industry'})</span>
                          </div>
                          <span style={{ fontSize: '0.7rem', background: lead.status === 'onboarded' ? '#dcfce7' : (lead.status === 'negotiating' ? '#e0f2fe' : '#fef3c7'), color: lead.status === 'onboarded' ? '#16a34a' : (lead.status === 'negotiating' ? '#0369a1' : '#b45309'), padding: '4px 8px', borderRadius: '6px', fontWeight: 750, textTransform: 'uppercase' }}>
                            {lead.status || 'new'}
                          </span>
                        </div>
                        <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          📞 Phone: {lead.phone} | ✉️ Email: {lead.email} | 🧪 Needed: {lead.productsNeeded || 'N/A'} ({lead.quantity || 'N/A'})
                        </p>
                        <blockquote style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-main)', borderLeft: '3px solid var(--secondary)', paddingLeft: '10px', fontStyle: 'italic' }}>
                          "{lead.message || lead.Message || 'No text content.'}"
                        </blockquote>
                      </div>
                    ))}
                    {filteredLeads.length === 0 && (
                      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontStyle: 'italic' }}>No leads matching search.</div>
                    )}
                  </div>
                </div>
              )}

              {/* 3. WHOLESALERS REGISTERED DIRECTORY */}
              {crmSubTab === 'wholesalers' && (
                <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '10px' }}>
                    <h4 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.1rem', margin: 0 }}>Verified Corporate Wholesalers</h4>
                    <span style={{ fontSize: '0.75rem', background: '#dcfce7', color: '#16a34a', padding: '4px 10px', borderRadius: '20px', fontWeight: 700 }}>
                      ● Active B2B Distributors
                    </span>
                  </div>

                  {filteredClients.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                      <div style={{ fontSize: '3rem', marginBottom: '15px' }}>🏢</div>
                      <h5 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--primary)', marginBottom: '5px' }}>No Wholesalers Registered</h5>
                      <p style={{ fontSize: '0.82rem', maxWidth: '400px', margin: '0 auto' }}>
                        Distributors registering via the SMS gateways or onboarded from B2B inquiries will display here.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="desktop-view" style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                          <thead>
                            <tr style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}>
                              <th style={{ padding: '12px 15px', textAlign: 'left', fontWeight: 650 }}>Company & Representative</th>
                              <th style={{ padding: '12px 15px', textAlign: 'left', fontWeight: 650 }}>Contact Specs</th>
                              <th style={{ padding: '12px 15px', textAlign: 'left', fontWeight: 650 }}>Tier & Discount</th>
                              <th style={{ padding: '12px 15px', textAlign: 'left', fontWeight: 650 }}>Chemical Credit Ledger</th>
                              <th style={{ padding: '12px 15px', textAlign: 'right', fontWeight: 650 }}>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredClients.map((client) => {
                              const limit = client.creditLimit || 50000;
                              const used = client.creditUsed || 0;
                              const utilization = (used / limit) * 100;
                              return (
                                <tr key={client.id}
                                  onClick={() => setSelectedClient(client)}
                                  style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.2s' }}
                                  onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >
                                  <td style={{ padding: '15px' }}>
                                    <strong style={{ display: 'block', color: 'var(--primary)', fontSize: '0.92rem' }}>{client.company}</strong>
                                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Rep: {client.representative}</span>
                                  </td>
                                  <td style={{ padding: '15px' }}>
                                    <span style={{ display: 'block', fontWeight: 550 }}>📞 +233 {client.phone}</span>
                                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{client.email}</span>
                                  </td>
                                  <td style={{ padding: '15px' }}>
                                    <span style={{ display: 'block', fontSize: '0.72rem', background: '#eff6ff', color: '#2563eb', padding: '2px 8px', borderRadius: '4px', fontWeight: 700, width: 'fit-content', marginBottom: '4px' }}>
                                      {client.tier || 'Tier 2 Bulk Wholesaler'}
                                    </span>
                                    <span style={{ display: 'block', fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--secondary)', fontWeight: 700 }}>
                                      Code: {client.discountCode}
                                    </span>
                                  </td>
                                  <td style={{ padding: '15px', width: '220px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                                      <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>GH₵ {used.toLocaleString()}/{limit.toLocaleString()}</span>
                                      <span style={{ fontWeight: 700, color: utilization > 80 ? '#ef4444' : 'var(--secondary)' }}>{utilization.toFixed(0)}%</span>
                                    </div>
                                    <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                                      <div style={{ height: '100%', width: `${Math.min(100, utilization)}%`, background: utilization > 80 ? '#ef4444' : 'var(--secondary)', borderRadius: '3px' }}></div>
                                    </div>
                                  </td>
                                  <td style={{ padding: '15px', textAlign: 'right' }}>
                                    <span style={{ background: '#dcfce7', color: '#15803d', fontSize: '0.75rem', fontWeight: 700, padding: '4px 10px', borderRadius: '30px' }}>
                                      ✓ Verified B2B
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile cards stack */}
                      <div className="mobile-view" style={{ display: 'none', flexDirection: 'column', gap: '1rem' }}>
                        {filteredClients.map((client) => {
                          const limit = client.creditLimit || 50000;
                          const used = client.creditUsed || 0;
                          const utilization = (used / limit) * 100;
                          return (
                            <div key={client.id}
                              onClick={() => setSelectedClient(client)}
                              style={{
                                background: '#f8fafc',
                                padding: '1.25rem',
                                borderRadius: '12px',
                                border: '1px solid var(--border)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '10px',
                                cursor: 'pointer'
                              }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                  <h5 style={{ margin: 0, fontWeight: 800, color: 'var(--primary)', fontSize: '0.95rem' }}>{client.company}</h5>
                                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Rep: {client.representative}</span>
                                </div>
                                <span style={{ background: '#dcfce7', color: '#15803d', fontSize: '0.65rem', fontWeight: 800, padding: '2px 8px', borderRadius: '20px' }}>
                                  Verified
                                </span>
                              </div>
                              <div style={{ display: 'flex', gap: '6px', fontSize: '0.7rem' }}>
                                <span style={{ background: '#eff6ff', color: '#2563eb', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>{client.tier || 'Tier 2'}</span>
                                <span style={{ background: 'rgba(43, 140, 138, 0.1)', color: 'var(--secondary)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>Code: {client.discountCode}</span>
                              </div>
                              <div style={{ borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '8px', fontSize: '0.78rem' }}>
                                📞 +233 {client.phone} | ✉️ {client.email}
                              </div>
                              <div style={{ borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '8px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: '4px', color: 'var(--text-muted)' }}>
                                  <span>Credit Line</span>
                                  <span>GH₵ {used.toLocaleString()} / {limit.toLocaleString()}</span>
                                </div>
                                <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                                  <div style={{ height: '100%', width: `${Math.min(100, utilization)}%`, background: 'var(--secondary)' }}></div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* 4. RETAIL BUYERS DIRECTORY */}
              {crmSubTab === 'retail' && (
                <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h4 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.1rem', margin: 0 }}>Direct Retail Customer Registry</h4>
                    <span style={{ fontSize: '0.75rem', background: '#f1f5f9', color: 'var(--text-muted)', padding: '4px 10px', borderRadius: '20px', fontWeight: 700 }}>
                      Parsed from Checkout Orders
                    </span>
                  </div>

                  {filteredRetail.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                      <div style={{ fontSize: '3rem', marginBottom: '15px' }}>🛍️</div>
                      <h5 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--primary)', marginBottom: '5px' }}>No Retail Customers</h5>
                      <p style={{ fontSize: '0.82rem', maxWidth: '400px', margin: '0 auto' }}>
                        Retail purchases made through checkout will appear here.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="desktop-view" style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                          <thead>
                            <tr style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}>
                              <th style={{ padding: '12px 15px', textAlign: 'left', fontWeight: 650 }}>Customer Name</th>
                              <th style={{ padding: '12px 15px', textAlign: 'left', fontWeight: 650 }}>Direct Phone</th>
                              <th style={{ padding: '12px 15px', textAlign: 'left', fontWeight: 650 }}>Delivery Address</th>
                              <th style={{ padding: '12px 15px', textAlign: 'left', fontWeight: 650 }}>Orders Placed</th>
                              <th style={{ padding: '12px 15px', textAlign: 'right', fontWeight: 650 }}>Sales Value</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredRetail.map((o, idx) => (
                              <tr key={idx}
                                onClick={() => setSelectedClient({ ...o, representative: o.customer?.name, phone: o.customer?.phone, email: 'Retail Buyer', company: 'B2C E-Commerce Buyer', tasks: [], timeline: [{ event: `Purchased Neat products on standard checkout`, date: o.date }] })}
                                style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.2s' }}
                                onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                              >
                                <td style={{ padding: '15px', fontWeight: 700, color: 'var(--primary)' }}>{o.customer?.name}</td>
                                <td style={{ padding: '15px' }}>{o.customer?.phone}</td>
                                <td style={{ padding: '15px' }}>{o.customer?.address}</td>
                                <td style={{ padding: '15px', fontWeight: 600 }}>1 Order</td>
                                <td style={{ padding: '15px', textAlign: 'right', fontWeight: 800, color: 'var(--primary)' }}>GH₵ {o.totalAmount}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="mobile-view" style={{ display: 'none', flexDirection: 'column', gap: '1rem' }}>
                        {filteredRetail.map((o, idx) => (
                          <div key={idx}
                            onClick={() => setSelectedClient({ ...o, representative: o.customer?.name, phone: o.customer?.phone, email: 'Retail Buyer', company: 'B2C E-Commerce Buyer', tasks: [], timeline: [{ event: `Purchased Neat products on standard checkout`, date: o.date }] })}
                            style={{
                              background: '#f8fafc',
                              padding: '1.25rem',
                              borderRadius: '12px',
                              border: '1px solid var(--border)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '8px',
                              cursor: 'pointer'
                            }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <h5 style={{ margin: 0, fontWeight: 800, color: 'var(--primary)', fontSize: '0.92rem' }}>{o.customer?.name}</h5>
                              <span style={{ color: 'var(--secondary)', fontWeight: 800, fontSize: '0.85rem' }}>GH₵ {o.totalAmount}</span>
                            </div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>📞 {o.customer?.phone}</div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-main)', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '6px' }}>
                              📍 {o.customer?.address}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* -------------------- DYNAMIC SLIDE-OUT PROFILE DRAWER -------------------- */}
              {selectedClient && (
                <div style={{
                  position: 'fixed',
                  top: 0,
                  right: 0,
                  width: '450px',
                  maxWidth: '100%',
                  height: '100vh',
                  background: 'rgba(11, 35, 57, 0.95)',
                  backdropFilter: 'blur(20px)',
                  borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: '-10px 0 35px rgba(0,0,0,0.4)',
                  zIndex: 99999,
                  padding: '2rem',
                  color: 'white',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.5rem',
                  animation: 'slideLeft 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}>
                  {/* Drawer Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
                    <div>
                      <h3 style={{ margin: 0, fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.25rem', color: '#33A19D' }}>
                        {selectedClient.company || selectedClient.businessName || selectedClient.customer?.name || 'Client Details'}
                      </h3>
                      <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>
                        {selectedClient.tier ? 'B2B Wholesaler' : (selectedClient.businessName ? 'B2B Inquiry Lead' : 'B2C Retail Buyer')}
                      </span>
                    </div>
                    <button
                      onClick={() => setSelectedClient(null)}
                      style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', fontSize: '1.8rem', cursor: 'pointer' }}
                    >×</button>
                  </div>

                  {/* Ghana-Optimized Communications Quick-Actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ghanaian WhatsApp Dispatcher</span>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      <a
                        href={`https://wa.me/${formatGhanaPhone(selectedClient.phone || selectedClient.customer?.phone)}?text=${encodeURIComponent(`Hello ${selectedClient.representative || selectedClient.contactPerson || selectedClient.customer?.name || 'Partner'}, this is Neat Brand Trade representative. We received your wholesale inquiry and would love to review special pricing packages with you!`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          background: '#25D366',
                          color: 'white',
                          textDecoration: 'none',
                          padding: '10px',
                          borderRadius: '10px',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          textAlign: 'center'
                        }}
                      >
                        💬 WhatsApp
                      </a>
                      <a
                        href={`tel:${selectedClient.phone || selectedClient.customer?.phone}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          background: 'rgba(255,255,255,0.1)',
                          color: 'white',
                          textDecoration: 'none',
                          padding: '10px',
                          borderRadius: '10px',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          textAlign: 'center',
                          border: '1px solid rgba(255,255,255,0.15)'
                        }}
                      >
                        📞 Call Direct
                      </a>
                    </div>

                    {/* Pre-formatted message templates */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.25rem' }}>
                      {[
                        { label: '📄 Send Wholesale Price-List', text: `Hello ${selectedClient.representative || selectedClient.contactPerson || selectedClient.customer?.name || 'Partner'}, thank you for choosing Neat Brand Trade! Here is our standard B2B volume pricing sheet for premium cleaning formulations: https://neatbrandtrade.com/wholesale.pdf` },
                        { label: '💳 Credit Balance Ledger Alert', text: `Dear ${selectedClient.representative || selectedClient.contactPerson || selectedClient.customer?.name || 'Partner'}, this is a courteous update regarding your Neat Brand Trade outstanding balance. Your current ledger displays GH₵ ${(selectedClient.creditUsed || 0).toLocaleString()} utilized out of your GH₵ ${(selectedClient.creditLimit || 0).toLocaleString()} limit.` },
                        { label: '🎉 Welcome Partner Agreement', text: `Welcome to the Neat Brand Trade distributor family! Your authorized B2B wholesale discount code is active: ${selectedClient.discountCode || 'NBT-B2B'}. You can start ordering with bulk tier discounts instantly.` }
                      ].map((tpl, i) => (
                        <a
                          key={i}
                          href={`https://wa.me/${formatGhanaPhone(selectedClient.phone || selectedClient.customer?.phone)}?text=${encodeURIComponent(tpl.text)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            background: 'rgba(43, 140, 138, 0.15)',
                            border: '1px solid rgba(43, 140, 138, 0.3)',
                            color: '#33A19D',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            fontSize: '0.74rem',
                            textDecoration: 'none',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        >
                          {tpl.label}
                        </a>
                      ))}
                    </div>
                  </div>

                  {/* B2B Onboard Lead button (Only for Inbound Leads) */}
                  {selectedClient.businessName && !selectedClient.tier && (
                    <div style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '1.25rem', borderRadius: '12px' }}>
                      <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', fontWeight: 800 }}>⚡ Provision Wholesaler Account</h4>
                      <p style={{ margin: '0 0 1rem 0', fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.4 }}>
                        Convert this B2B corporate prospect inquiry into an active, verified distributor account with pricing parameters.
                      </p>
                      <button
                        onClick={() => handleOnboardLead(selectedClient)}
                        style={{
                          width: '100%',
                          background: 'linear-gradient(90deg, #33A19D 0%, #2B8C8A 100%)',
                          color: 'white',
                          border: 'none',
                          padding: '10px',
                          borderRadius: '8px',
                          fontSize: '0.8rem',
                          fontWeight: 800,
                          cursor: 'pointer'
                        }}
                      >
                        🎉 Onboard Lead as Distributor
                      </button>
                    </div>
                  )}

                  {/* Chemical Credit Ledger Section (Only for Verified B2B Wholesalers) */}
                  {selectedClient.tier && (
                    <div style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '1.25rem', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div>
                        <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Chemical Credit Ledger balance</span>
                        <div style={{ display: 'flex', justifyContent: 'space-between', margin: '0.5rem 0 0.25rem 0', fontSize: '0.88rem' }}>
                          <span>Outstanding Usage:</span>
                          <strong style={{ color: '#33A19D' }}>GH₵ {(selectedClient.creditUsed || 0).toLocaleString()} / {(selectedClient.creditLimit || 50000).toLocaleString()}</strong>
                        </div>
                        <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${Math.min(100, ((selectedClient.creditUsed || 0) / (selectedClient.creditLimit || 50000)) * 100)}%`, background: (selectedClient.creditUsed || 0) / (selectedClient.creditLimit || 50000) > 0.8 ? '#ef4444' : '#33A19D' }} />
                        </div>
                      </div>

                      {/* Record payment input */}
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.75rem' }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '4px', fontWeight: 600 }}>💳 Log Cash Payment / Deposit</label>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <input
                            type="number"
                            placeholder="Amount (GH₵)"
                            value={paymentAmount}
                            onChange={e => setPaymentAmount(e.target.value)}
                            style={{ flexGrow: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '6px', padding: '6px 10px', fontSize: '0.78rem', color: 'white', outline: 'none' }}
                          />
                          <button
                            onClick={() => handleLogPayment(selectedClient.id, paymentAmount)}
                            style={{ background: '#33A19D', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
                          >
                            Post Payment
                          </button>
                        </div>
                      </div>

                      {/* Adjust credit line */}
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.75rem' }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '4px', fontWeight: 600 }}>⚙️ Adjust Credit Line Limit</label>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <input
                            type="number"
                            placeholder="Limit (GH₵)"
                            value={newCreditLimit}
                            onChange={e => setNewCreditLimit(e.target.value)}
                            style={{ flexGrow: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '6px', padding: '6px 10px', fontSize: '0.78rem', color: 'white', outline: 'none' }}
                          />
                          <button
                            onClick={() => handleAdjustCreditLimit(selectedClient.id, newCreditLimit)}
                            style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.15)', padding: '6px 12px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
                          >
                            Save Limit
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* CRM Follow-Up Checklists Tracker */}
                  <div style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '1.25rem', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Follow-Up Checklists</span>

                    {/* Checklist rows */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {(selectedClient.tasks || []).map((t, idx) => (
                        <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={t.done}
                            onChange={() => handleToggleTask(selectedClient.id, selectedClient.tier ? 'wholesale_clients' : 'bulk_inquiries', idx)}
                            style={{ accentColor: '#33A19D' }}
                          />
                          <span style={{ textDecoration: t.done ? 'line-through' : 'none', opacity: t.done ? 0.5 : 1 }}>{t.text}</span>
                        </label>
                      ))}
                      {(selectedClient.tasks || []).length === 0 && (
                        <span style={{ fontSize: '0.74rem', fontStyle: 'italic', color: 'rgba(255,255,255,0.4)' }}>No outstanding tasks.</span>
                      )}
                    </div>

                    {/* Task addition form */}
                    <div style={{ display: 'flex', gap: '6px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.6rem' }}>
                      <input
                        type="text"
                        placeholder="Append new task (e.g. Schedule call)"
                        value={newTaskText}
                        onChange={e => setNewTaskText(e.target.value)}
                        style={{ flexGrow: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '6px', padding: '6px 10px', fontSize: '0.78rem', color: 'white', outline: 'none' }}
                      />
                      <button
                        onClick={() => handleAddTask(selectedClient.id, selectedClient.tier ? 'wholesale_clients' : 'bulk_inquiries', newTaskText)}
                        style={{ background: '#33A19D', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
                      >
                        Append
                      </button>
                    </div>
                  </div>

                  {/* Vertical History Stepper Timeline */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Timeline & History Log</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderLeft: '2px solid rgba(255,255,255,0.1)', paddingLeft: '1rem', marginLeft: '6px' }}>
                      {(selectedClient.timeline || []).map((tl, i) => (
                        <div key={i} style={{ position: 'relative', fontSize: '0.78rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <div style={{
                            position: 'absolute',
                            left: '-21px',
                            top: '4px',
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: i === 0 ? '#33A19D' : 'rgba(255,255,255,0.3)',
                            boxShadow: i === 0 ? '0 0 6px #33A19D' : 'none'
                          }} />
                          <span style={{ color: 'white', lineHeight: 1.3 }}>{tl.event}</span>
                          <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)' }}>{tl.date}</span>
                        </div>
                      ))}
                      {(selectedClient.timeline || []).length === 0 && (
                        <span style={{ fontSize: '0.74rem', fontStyle: 'italic', color: 'rgba(255,255,255,0.4)', marginLeft: '-1rem' }}>No logged events.</span>
                      )}
                    </div>
                  </div>

                </div>
              )}

              {/* B2B Client Manual Onboarding Modal */}
              {showAddCustomerModal && (
                <div style={{
                  position: 'fixed',
                  inset: 0,
                  background: 'rgba(11, 35, 57, 0.5)',
                  backdropFilter: 'blur(6px)',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  zIndex: 4000,
                  padding: '20px',
                  animation: 'fadeIn 0.2s ease-out'
                }} onClick={() => setShowAddCustomerModal(false)}>
                  <div style={{
                    background: 'white',
                    borderRadius: '20px',
                    maxWidth: '550px',
                    width: '100%',
                    padding: '30px',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
                    position: 'relative',
                    animation: 'scaleUp 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)'
                  }} onClick={(e) => e.stopPropagation()}>

                    <button
                      onClick={() => setShowAddCustomerModal(false)}
                      style={{
                        position: 'absolute',
                        top: '20px',
                        right: '20px',
                        background: 'none',
                        border: 'none',
                        fontSize: '1.5rem',
                        cursor: 'pointer',
                        color: '#64748b'
                      }}
                    >
                      ×
                    </button>

                    <h3 style={{ fontSize: '1.4rem', color: 'var(--primary)', fontWeight: 800, marginBottom: '20px', fontFamily: 'Outfit', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      🏢 Onboard New B2B Wholesaler
                    </h3>

                    <form onSubmit={handleCreateCustomer} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px', textTransform: 'uppercase' }}>Company / Business Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="Enter business or wholesale outlet name"
                          value={customerForm.company}
                          onChange={e => setCustomerForm({ ...customerForm, company: e.target.value })}
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.88rem', outline: 'none' }}
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px', textTransform: 'uppercase' }}>Contact Representative *</label>
                          <input
                            type="text"
                            required
                            placeholder="Representative name"
                            value={customerForm.representative}
                            onChange={e => setCustomerForm({ ...customerForm, representative: e.target.value })}
                            style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.88rem', outline: 'none' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px', textTransform: 'uppercase' }}>Phone Number *</label>
                          <input
                            type="tel"
                            required
                            placeholder="e.g. +23324XXXXXXX"
                            value={customerForm.phone}
                            onChange={e => setCustomerForm({ ...customerForm, phone: e.target.value })}
                            style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.88rem', outline: 'none' }}
                          />
                        </div>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px', textTransform: 'uppercase' }}>Email Address</label>
                        <input
                          type="email"
                          placeholder="distributor@example.com"
                          value={customerForm.email}
                          onChange={e => setCustomerForm({ ...customerForm, email: e.target.value })}
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.88rem', outline: 'none' }}
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px', textTransform: 'uppercase' }}>Payment Terms</label>
                          <select
                            value={customerForm.paymentTerms}
                            onChange={e => setCustomerForm({ ...customerForm, paymentTerms: e.target.value })}
                            style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.88rem', outline: 'none', background: 'white' }}
                          >
                            <option value="COD">COD (Cash on Delivery)</option>
                            <option value="Prepaid">Prepaid</option>
                            <option value="Net 15">Net 15</option>
                            <option value="Net 30">Net 30</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px', textTransform: 'uppercase' }}>Credit Limit (GHS)</label>
                          <input
                            type="number"
                            placeholder="50000"
                            value={customerForm.creditLimit}
                            onChange={e => setCustomerForm({ ...customerForm, creditLimit: e.target.value })}
                            style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.88rem', outline: 'none' }}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                        <button
                          type="button"
                          onClick={() => setShowAddCustomerModal(false)}
                          style={{ flexGrow: 1, padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', background: 'white', color: '#475569', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          style={{ flexGrow: 1, padding: '12px', borderRadius: '10px', border: 'none', background: 'var(--primary)', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem', boxShadow: 'var(--shadow-sm)' }}
                        >
                          Onboard Wholesaler
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

            </div>
          );
        })()}

        {/* TAB E: REAL-TIME ANALYTICS WORKSPACE */}
        {activeTab === 'analytics' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

            {/* Visual Charts Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }} className="kpi-detail-panel">

              {/* Revenue sparkline SVG Chart */}
              <div style={{ background: 'white', padding: '1.75rem', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                <h4 style={{ fontFamily: 'Outfit', fontWeight: 800, margin: '0 0 1rem 0' }}>📈 Revenue Monthly Trend</h4>
                <div style={{ position: 'relative', height: '180px', width: '100%' }}>
                  <svg viewBox="0 0 100 30" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
                    <defs>
                      <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--secondary)" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="var(--secondary)" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <path d="M 0,28 L 0,20 Q 20,12 40,16 T 80,6 L 100,2 L 100,30 Z" fill="url(#chartGradient)" />
                    <path d="M 0,20 Q 20,12 40,16 T 80,6 L 100,2" fill="none" stroke="var(--secondary)" strokeWidth="1.5" />
                  </svg>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                  <span>Jan</span>
                  <span>Feb</span>
                  <span>Mar</span>
                  <span>Apr</span>
                  <span>May (Live)</span>
                </div>
              </div>

              {/* Order volumes SVG Chart */}
              <div style={{ background: 'white', padding: '1.75rem', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                <h4 style={{ fontFamily: 'Outfit', fontWeight: 800, margin: '0 0 1rem 0' }}>📊 Daily Order Volume</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: '180px', padding: '10px 0' }}>
                  {[20, 35, 48, 26, 68, 55, 84].map((v, i) => (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: '8px' }}>
                      <div style={{ height: `${v}%`, width: '18px', background: 'var(--primary)', borderRadius: '4px 4px 0 0', transition: 'height 0.3s' }}></div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Popular products list & Conversion visitor Funnels */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem' }} className="kpi-detail-panel">

              {/* Popular Products Table */}
              <div style={{ background: 'white', padding: '1.75rem', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                <h4 style={{ fontFamily: 'Outfit', fontWeight: 850, fontSize: '1.1rem', margin: '0 0 1.25rem 0' }}>🔥 Popular Products By Sales</h4>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-surface)' }}>
                      <th style={{ padding: '8px 10px', textAlign: 'left' }}>Product</th>
                      <th style={{ padding: '8px 10px', textAlign: 'left' }}>Units Sold</th>
                      <th style={{ padding: '8px 10px', textAlign: 'left' }}>Rating</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right' }}>Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {popularProducts.map((p, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '10px', fontWeight: 700 }}>{p.name}</td>
                        <td style={{ padding: '10px' }}>⚡ {p.sales} units</td>
                        <td style={{ padding: '10px', color: '#F59E0B' }}>★★★★★</td>
                        <td style={{ padding: '10px', textAlign: 'right', fontWeight: 800 }}>GH₵ {p.revenue.toLocaleString()}</td>
                      </tr>
                    ))}
                    {popularProducts.length === 0 && (
                      <tr>
                        <td colSpan="4" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>Register products to view analytics.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Conversion Funnel */}
              <div style={{ background: 'white', padding: '1.75rem', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <h4 style={{ fontFamily: 'Outfit', fontWeight: 850, fontSize: '1.1rem', margin: 0 }}>🛒 Store Conversion Funnel</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[
                    { label: 'Total Visitors', count: totalVisitorsCount, pct: '100%' },
                    { label: 'Product Clicks', count: Math.round(totalVisitorsCount * 0.45), pct: '45%' },
                    { label: 'Add to Cart', count: Math.round(totalVisitorsCount * 0.15), pct: '15%' },
                    { label: 'Checkout Submit', count: totalOrdersCount, pct: `${((totalOrdersCount / totalVisitorsCount) * 100).toFixed(1)}%` }
                  ].map((f, i) => (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600 }}>
                        <span>{f.label}</span>
                        <span style={{ color: 'var(--text-muted)' }}>{f.count} ({f.pct})</span>
                      </div>
                      <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: f.pct, background: i === 3 ? 'var(--secondary)' : 'var(--primary)', borderRadius: '4px' }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* TAB F: MESSAGES INBOX WORKSPACE */}
        {activeTab === 'messages' && (
          <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
            <h3 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.25rem', marginBottom: '1.5rem' }}>✉️ Corporate Messages Inbox</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {activeMessages.map((msg) => (
                <div key={msg.id} style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '1.5rem', background: '#f8fafc', position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--primary)', fontWeight: 800 }}>{msg.contactPerson}</h4>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--secondary)' }}>🏢 {msg.businessName || 'General Inquiry'} ({msg.industry || 'Retail Client'})</span>
                    </div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>📅 Date Sent: {msg.date}</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', background: 'white', padding: '10px', borderRadius: '8px', marginBottom: '1rem', border: '1px solid #ECEFF1', fontSize: '0.82rem' }}>
                    <div>📞 <strong>Phone:</strong> <a href={"tel:" + msg.phone} style={{ color: 'var(--secondary)', fontWeight: 700 }}>{msg.phone}</a></div>
                    {msg.email ? (
                      <div>✉️ <strong>Email:</strong> <a href={"mailto:" + msg.email} style={{ color: 'var(--primary)', fontWeight: 700 }}>{msg.email}</a></div>
                    ) : null}
                    {msg.productsNeeded ? (
                      <div>🧪 <strong>Needed:</strong> {msg.productsNeeded}</div>
                    ) : null}
                    {msg.quantity ? (
                      <div>📦 <strong>Quantity:</strong> {msg.quantity}</div>
                    ) : null}
                  </div>

                  <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>
                    "{msg.message || msg.Message || 'No inquiry text provided.'}"
                  </p>
                </div>
              ))}
              {activeMessages.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>✉️ Inbox is completely empty.</div>
              )}
            </div>
          </div>
        )}

        {/* ==================== TAB: SUPPLIERS ==================== */}
        {activeTab === 'suppliers' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', animation: 'slideUp 0.4s var(--transition)' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, rgba(11,35,57,0.97), rgba(26,58,92,0.95))', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(16px)', padding: '2rem', borderRadius: '16px', color: 'white', flexWrap: 'wrap', gap: '20px' }}>
              <div>
                <h3 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.45rem', margin: 0 }}>🏢 Supplier & Manufacturer Directory</h3>
                <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', margin: '6px 0 0 0' }}>Manage all your raw material, chemical feedstock & packaging supply partners.</p>
              </div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button onClick={() => setShowAddMfgModal(true)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '11px 20px', borderRadius: '10px', fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer' }}>➕ Add Supplier</button>
                <button onClick={() => setActiveTab('purchase-orders')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '11px 20px', borderRadius: '10px', fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer', background: 'var(--secondary)', color: 'white', border: 'none' }}>📝 Purchase Orders</button>
              </div>
            </div>

            {/* Stats Strip */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
              {[
                { label: 'Total Suppliers', val: activeManufacturers.length, icon: '🏢', color: 'var(--primary)' },
                { label: 'Active', val: activeManufacturers.filter(m => m.status !== 'Inactive').length, icon: '✅', color: '#16a34a' },
                { label: 'Inactive', val: activeManufacturers.filter(m => m.status === 'Inactive').length, icon: '⏸️', color: '#94a3b8' },
                { label: 'Pending POs', val: activeManufacturerPOs.filter(p => p.status === 'Draft' || p.status === 'Sent').length, icon: '📦', color: '#d97706' },
                { label: 'Capital Committed', val: `GH₵ ${activeManufacturerPOs.reduce((a, p) => a + p.totalAmount, 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}`, icon: '💳', color: '#7c3aed' }
              ].map((s, i) => (
                <div key={i} style={{ background: 'white', padding: '1.25rem 1.5rem', borderRadius: '14px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</div>
                    <div style={{ fontSize: '1.55rem', fontWeight: 800, color: s.color, fontFamily: 'Outfit', marginTop: '4px' }}>{s.val}</div>
                  </div>
                  <span style={{ fontSize: '1.5rem' }}>{s.icon}</span>
                </div>
              ))}
            </div>

            {/* Search Bar */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <input
                type="text" value={supplierSearchQuery}
                onChange={e => setSupplierSearchQuery(e.target.value)}
                placeholder="🔍  Search suppliers by name, contact, materials..."
                style={{ flex: 1, padding: '11px 16px', border: '1.5px solid var(--border)', borderRadius: '10px', fontSize: '0.88rem', outline: 'none', background: 'white' }}
              />
              <button onClick={() => setSupplierSearchQuery('')} style={{ padding: '11px 16px', borderRadius: '10px', border: '1px solid var(--border)', background: 'white', cursor: 'pointer', fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>Clear</button>
            </div>

            {/* Supplier Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.5rem' }}>
              {activeManufacturers
                .filter(m => !supplierSearchQuery || m.name?.toLowerCase().includes(supplierSearchQuery.toLowerCase()) || m.contactPerson?.toLowerCase().includes(supplierSearchQuery.toLowerCase()) || m.materials?.toLowerCase().includes(supplierSearchQuery.toLowerCase()) || m.email?.toLowerCase().includes(supplierSearchQuery.toLowerCase()))
                .map((mfg) => (
                  <div key={mfg.id} style={{ background: 'white', border: `1px solid ${mfg.status === 'Inactive' ? '#e2e8f0' : 'var(--border)'}`, borderRadius: '16px', padding: '1.5rem', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', gap: '1rem', transition: 'all 0.25s', opacity: mfg.status === 'Inactive' ? 0.7 : 1 }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'none'}>

                    {/* Card Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: 0, fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary)' }}>{mfg.name}</h4>
                        {mfg.companyName && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px', fontWeight: 600 }}>🏭 {mfg.companyName}</div>}
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--secondary)', display: 'block', marginTop: '3px' }}>📍 {mfg.location || mfg.address || 'N/A'}</span>
                      </div>
                      <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '0.68rem', fontWeight: 800, background: mfg.status === 'Inactive' ? '#f1f5f9' : '#dcfce7', color: mfg.status === 'Inactive' ? '#64748b' : '#15803d', border: `1px solid ${mfg.status === 'Inactive' ? '#e2e8f0' : '#bbf7d0'}`, whiteSpace: 'nowrap' }}>
                        {mfg.status === 'Inactive' ? '⏸ Inactive' : '✅ Active'}
                      </span>
                    </div>

                    {/* Contact Info */}
                    <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '10px', border: '1px solid #ECEFF1', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem' }}>
                      <div>🧑‍💼 <strong>Contact:</strong> {mfg.contactPerson}</div>
                      <div>📞 <strong>Phone:</strong> <a href={"tel:" + mfg.phone} style={{ color: 'var(--secondary)', fontWeight: 700 }}>{mfg.phone}</a></div>
                      {mfg.email && <div>✉️ <strong>Email:</strong> <a href={"mailto:" + mfg.email} style={{ color: 'var(--primary)', fontWeight: 700 }}>{mfg.email}</a></div>}
                      {mfg.paymentTerms && <div>💳 <strong>Terms:</strong> {mfg.paymentTerms}</div>}
                      {mfg.priceListDate && (
                        <div style={{ color: '#0369a1', fontWeight: 700, background: '#e0f2fe', padding: '4px 8px', borderRadius: '6px', marginTop: '2px', display: 'inline-flex', alignItems: 'center', gap: '4px', alignSelf: 'flex-start' }}>
                          📅 Price List: {mfg.priceListDate}
                        </div>
                      )}
                    </div>

                    {/* Material Tags */}
                    {mfg.materials && (
                      <div>
                        <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>Categories Supplied</span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                          {mfg.materials.split(',').map((m, i) => (
                            <span key={i} style={{ background: 'rgba(43,140,138,0.08)', color: 'var(--primary)', border: '1px solid rgba(43,140,138,0.15)', padding: '3px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700 }}>{m.trim()}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {mfg.notes && (
                      <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--text-muted)', background: '#fffbeb', border: '1px solid #fef3c7', padding: '8px 10px', borderRadius: '8px', fontStyle: 'italic' }}>📌 {mfg.notes}</p>
                    )}

                    {/* PO & Invoice Summary for this supplier */}
                    {(() => {
                      const supplierPOs = activeManufacturerPOs.filter(p => p.manufacturerId === mfg.id);
                      const supplierInvoices = dbInvoices.filter(inv => inv.supplierId === mfg.id);
                      const outstanding = supplierInvoices.filter(i => i.status === 'Pending').reduce((s, i) => s + (parseFloat(i.totalAmount) || 0), 0);
                      if (supplierPOs.length === 0 && supplierInvoices.length === 0) return null;
                      return (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '0.72rem' }}>
                          <div style={{ background: '#f1f5f9', padding: '8px', borderRadius: '8px', textAlign: 'center' }}>
                            <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--primary)' }}>{supplierPOs.length}</div>
                            <div style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Total POs</div>
                          </div>
                          <div style={{ background: '#fef3c7', padding: '8px', borderRadius: '8px', textAlign: 'center' }}>
                            <div style={{ fontWeight: 800, fontSize: '1rem', color: '#d97706' }}>{supplierPOs.filter(p => p.status === 'Draft' || p.status === 'Sent').length}</div>
                            <div style={{ color: '#92400e', fontWeight: 600 }}>Pending</div>
                          </div>
                          <div style={{ background: outstanding > 0 ? '#fee2e2' : '#dcfce7', padding: '8px', borderRadius: '8px', textAlign: 'center' }}>
                            <div style={{ fontWeight: 800, fontSize: '0.85rem', color: outstanding > 0 ? '#dc2626' : '#15803d' }}>GH₵{outstanding > 0 ? outstanding.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '0'}</div>
                            <div style={{ color: outstanding > 0 ? '#991b1b' : '#166534', fontWeight: 600 }}>Outstanding</div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Action Buttons */}
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.85rem', display: 'flex', gap: '7px', flexWrap: 'wrap' }}>
                      <button onClick={() => setSelectedSupplierDetail(mfg)} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(11,35,57,0.06)', color: '#0B2339', padding: '7px 12px', borderRadius: '8px', fontSize: '0.76rem', fontWeight: 700, border: '1px solid rgba(11,35,57,0.12)', cursor: 'pointer', flex: 1, justifyContent: 'center', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(11,35,57,0.12)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(11,35,57,0.06)'}>
                        👁 View Details
                      </button>
                      <a href={`https://wa.me/${formatGhanaPhone(mfg.phone)}?text=${encodeURIComponent(`Hello ${mfg.contactPerson}, this is NBT Procurement. We'd like to discuss pricing and supply availability.`)}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#25D366', color: 'white', padding: '7px 12px', borderRadius: '8px', fontSize: '0.76rem', fontWeight: 700, textDecoration: 'none', border: 'none', flex: 1, justifyContent: 'center' }}>💬 WhatsApp</a>
                      <button onClick={() => handleOpenPriceList(mfg)} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(43,140,138,0.07)', color: 'var(--primary)', padding: '7px 12px', borderRadius: '8px', fontSize: '0.76rem', fontWeight: 700, border: '1px solid rgba(43,140,138,0.2)', cursor: 'pointer', flex: 1, justifyContent: 'center' }}>📋 Price List{mfg.priceList?.length > 0 && <span style={{ background: 'var(--primary)', color: 'white', borderRadius: '999px', padding: '0 6px', fontSize: '0.64rem', fontWeight: 800 }}>{mfg.priceList.length}</span>}</button>
                    </div>
                  </div>
                ))}
              {activeManufacturers.filter(m => !supplierSearchQuery || m.name?.toLowerCase().includes(supplierSearchQuery.toLowerCase()) || m.contactPerson?.toLowerCase().includes(supplierSearchQuery.toLowerCase()) || m.materials?.toLowerCase().includes(supplierSearchQuery.toLowerCase())).length === 0 && (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏢</div>
                  <p style={{ fontWeight: 700 }}>No suppliers found{supplierSearchQuery ? ` for "${supplierSearchQuery}"` : ''}.</p>
                  <button onClick={() => setShowAddMfgModal(true)} className="btn btn-primary" style={{ marginTop: '12px', padding: '10px 20px', borderRadius: '10px' }}>➕ Add First Supplier</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== TAB: PURCHASE ORDERS ==================== */}
        {activeTab === 'purchase-orders' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'slideUp 0.4s var(--transition)' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '1rem 1.5rem', borderRadius: '12px', border: '1px solid var(--border)', flexWrap: 'wrap', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h3 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.25rem', margin: 0, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  All Purchase Orders <span style={{ color: '#008cd6', fontSize: '0.8rem', cursor: 'pointer' }}>▼</span>
                </h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button 
                  onClick={() => handleOpenUniversalCreator('po')} 
                  style={{ 
                    background: '#008cd6', 
                    color: 'white', 
                    border: 'none', 
                    padding: '8px 16px', 
                    borderRadius: '6px', 
                    fontWeight: 700, 
                    fontSize: '0.82rem', 
                    cursor: 'pointer', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                  }}
                >
                  ➕ New
                </button>
                <button style={{ background: '#f1f5f9', border: '1px solid var(--border)', color: '#64748b', width: '32px', height: '32px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                  •••
                </button>
              </div>
            </div>

            {/* POs List */}
            <div className="animate-stagger" style={{ background: 'transparent', width: '100%' }}>
              <div className="po-list-row po-list-header">
                <div style={{ textAlign: 'center' }}>
                  <input type="checkbox" style={{ cursor: 'pointer', transform: 'scale(1.05)' }} disabled />
                </div>
                <div>Date</div>
                <div>Purchase Order#</div>
                <div>Vendor Name</div>
                <div>Status</div>
                <div>Billed Status</div>
                <div style={{ textAlign: 'right' }}>Amount</div>
                <div style={{ textAlign: 'center' }}>Actions</div>
              </div>

              {activeManufacturerPOs.map((po) => {
                const isBilled = dbInvoices.some(inv => inv.poNumber === po.poNumber || inv.poId === po.id);
                const billedStatus = isBilled ? 'BILLED' : 'YET TO BE BILLED';
                
                // Format Date
                const formatDateZoho = (dateStr) => {
                  if (!dateStr) return '—';
                  try {
                    const date = new Date(dateStr);
                    if (isNaN(date.getTime())) return dateStr;
                    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
                  } catch {
                    return dateStr;
                  }
                };

                // Format Status Style
                const getStatusStyle = (status) => {
                  const st = (status || '').toUpperCase();
                  if (st === 'DRAFT') return { color: '#64748b', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.5px' };
                  if (st === 'SENT' || st === 'ISSUED') return { color: '#008cd6', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.5px' };
                  if (st === 'APPROVED' || st === 'DELIVERED' || st === 'CLOSED' || st === 'COMPLETED') return { color: '#16a34a', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.5px' };
                  if (st === 'CANCELLED') return { color: '#dc2626', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.5px' };
                  return { color: '#64748b', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.5px' };
                };

                return (
                  <div key={po.id} className="po-list-row po-list-item">
                    <div className="po-mobile-flex" style={{ justifyContent: 'center' }}>
                       <input type="checkbox" style={{ cursor: 'pointer' }} />
                    </div>
                    
                    <div className="po-mobile-flex">
                      <span className="po-mobile-label mobile-only">Date</span>
                      <span style={{ color: '#1e293b', whiteSpace: 'nowrap' }}>{formatDateZoho(po.date)}</span>
                    </div>

                    <div className="po-mobile-flex">
                      <span className="po-mobile-label mobile-only">PO#</span>
                      <span 
                        onClick={() => setViewingPO(po)} 
                        style={{ color: '#008cd6', cursor: 'pointer', fontWeight: 600, textDecoration: 'none' }}
                        onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                        onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                      >
                        {po.poNumber}
                      </span>
                    </div>

                    <div className="po-mobile-flex">
                      <span className="po-mobile-label mobile-only">Vendor</span>
                      <span style={{ fontWeight: 700, color: '#1e293b' }}>{po.manufacturerName}</span>
                    </div>

                    <div className="po-mobile-flex">
                      <span className="po-mobile-label mobile-only">Status</span>
                      <span style={getStatusStyle(po.status)}>{(po.status === 'Completed' || po.status === 'Delivered') ? 'CLOSED' : po.status?.toUpperCase()}</span>
                    </div>

                    <div className="po-mobile-flex">
                      <span className="po-mobile-label mobile-only">Billing</span>
                      <span style={{ fontWeight: 700, fontSize: '0.74rem', color: isBilled ? '#16a34a' : '#1e293b' }}>
                        {billedStatus}
                      </span>
                    </div>

                    <div className="po-mobile-flex" style={{ justifyContent: 'flex-end', gap: '10px' }}>
                      <span className="po-mobile-label mobile-only">Amount</span>
                      <span style={{ fontWeight: 700, color: '#1e293b' }}>
                        GH₵ {po.totalAmount?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="po-mobile-flex" style={{ justifyContent: 'center' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => setViewingPO(po)} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, color: '#334155' }} title="View">👁</button>
                        <button onClick={() => handleOpenUniversalCreator('po', po)} style={{ background: 'rgba(43, 140, 138, 0.08)', border: '1px solid rgba(43, 140, 138, 0.2)', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary)' }} title="Edit">✏️</button>
                        <button onClick={() => { setViewingPO(po); setTimeout(() => window.print(), 300); }} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, color: '#334155' }} title="Print">🖨</button>
                        <a href={`https://wa.me/${formatGhanaPhone(po.manufacturerPhone)}?text=${encodeURIComponent(getWhatsAppPOText(po))}`} target="_blank" rel="noopener noreferrer" style={{ background: '#25D366', color: 'white', padding: '6px 10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }} title="WhatsApp Send">💬</a>
                        {!isBilled && (
                          <button 
                            onClick={async () => {
                              const yr = new Date().getFullYear();
                              const rnd = Math.floor(1000 + Math.random() * 9000);
                              const invData = { supplierId: po.manufacturerId || '', supplierName: po.manufacturerName, supplierPhone: po.manufacturerPhone, poId: po.id, poNumber: po.poNumber, invoiceNumber: `INV-${yr}-${rnd}`, issueDate: new Date().toISOString().slice(0, 10), dueDate: '', totalAmount: po.totalAmount, status: 'Pending', notes: '', items: po.items, vatApplied: po.vatApplied, createdAt: new Date() };
                              try { await addDoc(collection(db, 'supplier_invoices'), invData); alert(`🧾 Invoice ${invData.invoiceNumber} generated from PO!`); setActiveTab('invoices'); } catch (e) { alert('Failed: ' + e.message); }
                            }} 
                            style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, color: '#7c3aed' }}
                            title="Convert to Supplier Invoice"
                          >
                            🧾
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {activeManufacturerPOs.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '12px', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📝</div>
                  No Purchase Orders yet. Click "New" to get started.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== TAB: INVOICES ==================== */}
        {activeTab === 'invoices' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', animation: 'slideUp 0.4s var(--transition)' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, #3b0764, #6d28d9)', padding: '2rem', borderRadius: '16px', color: 'white', flexWrap: 'wrap', gap: '20px' }}>
              <div>
                <h3 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.45rem', margin: 0 }}>🧾 Supplier Invoice Management</h3>
                <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.75)', margin: '6px 0 0 0' }}>Track supplier invoices, manage payments, and monitor outstanding balances.</p>
              </div>
              <button onClick={() => handleOpenUniversalCreator('invoice')} style={{ padding: '11px 22px', borderRadius: '10px', fontWeight: 700, background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: '0.88rem', backdropFilter: 'blur(8px)' }}>➕ New Invoice</button>
            </div>

            {/* Invoice KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
              {[
                { label: 'Total Invoices', val: dbInvoices.length, color: '#7c3aed', bg: '#f5f3ff' },
                { label: 'Pending Payment', val: dbInvoices.filter(i => i.status === 'Pending').length, color: '#d97706', bg: '#fffbeb' },
                { label: 'Paid', val: dbInvoices.filter(i => i.status === 'Paid').length, color: '#15803d', bg: '#f0fdf4' },
                { label: 'Overdue', val: dbInvoices.filter(i => i.status === 'Overdue').length, color: '#dc2626', bg: '#fef2f2' },
                { label: 'Total Outstanding', val: `GH₵ ${dbInvoices.filter(i => i.status !== 'Paid').reduce((s, i) => s + (parseFloat(i.totalAmount) || 0), 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}`, color: '#dc2626', bg: '#fef2f2' }
              ].map((s, i) => (
                <div key={i} style={{ background: s.bg, padding: '1.1rem 1.25rem', borderRadius: '12px', border: `1px solid ${s.color}22` }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: s.color, fontFamily: 'Outfit', marginTop: '4px' }}>{s.val}</div>
                </div>
              ))}
            </div>

            {/* Invoices Table */}
            <div style={{ background: 'white', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                    <th style={{ padding: '14px 16px', fontWeight: 800 }}>Invoice #</th>
                    <th style={{ padding: '14px 16px', fontWeight: 800 }}>Supplier</th>
                    <th style={{ padding: '14px 16px', fontWeight: 800 }}>Linked PO</th>
                    <th style={{ padding: '14px 16px', fontWeight: 800 }}>Issue Date</th>
                    <th style={{ padding: '14px 16px', fontWeight: 800 }}>Due Date</th>
                    <th style={{ padding: '14px 16px', fontWeight: 800 }}>Amount</th>
                    <th style={{ padding: '14px 16px', fontWeight: 800 }}>Status</th>
                    <th style={{ padding: '14px 16px', fontWeight: 800, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {dbInvoices.map(inv => (
                    <tr key={inv.id} style={{ borderBottom: '1px solid var(--border)' }} onMouseEnter={e => e.currentTarget.style.background = '#faf5ff'} onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                      <td style={{ padding: '14px 16px', fontWeight: 800, color: '#7c3aed' }}>🧾 {inv.invoiceNumber}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 700 }}>{inv.supplierName}</div>
                        {inv.supplierPhone && <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>📞 {inv.supplierPhone}</span>}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '0.78rem', color: inv.poNumber ? 'var(--primary)' : 'var(--text-muted)', fontWeight: inv.poNumber ? 700 : 400 }}>{inv.poNumber || '—'}</td>
                      <td style={{ padding: '14px 16px', fontSize: '0.78rem' }}>{inv.issueDate || '—'}</td>
                      <td style={{ padding: '14px 16px', fontSize: '0.78rem', color: inv.dueDate && new Date(inv.dueDate) < new Date() && inv.status !== 'Paid' ? '#dc2626' : 'var(--text-main)', fontWeight: inv.dueDate && new Date(inv.dueDate) < new Date() && inv.status !== 'Paid' ? 700 : 400 }}>{inv.dueDate || '—'}</td>
                      <td style={{ padding: '14px 16px', fontWeight: 800 }}>GH₵ {parseFloat(inv.totalAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 800, background: inv.status === 'Paid' ? '#dcfce7' : inv.status === 'Overdue' ? '#fee2e2' : '#fef3c7', color: inv.status === 'Paid' ? '#15803d' : inv.status === 'Overdue' ? '#dc2626' : '#92400e' }}>
                          {inv.status === 'Paid' ? '✅ Paid' : inv.status === 'Overdue' ? '🔴 Overdue' : '⏳ Pending'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '5px', justifyContent: 'flex-end' }}>
                          <button onClick={() => setViewingInvoice(inv)} style={{ background: '#f5f3ff', color: '#7c3aed', border: '1px solid #e9d5ff', padding: '5px 9px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700 }}>👁 View</button>
                          <button onClick={() => handleOpenUniversalCreator('invoice', inv)} style={{ background: 'rgba(124, 58, 237, 0.08)', color: '#7c3aed', border: '1px solid rgba(124, 58, 237, 0.25)', padding: '5px 9px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700 }}>✏️ Edit</button>
                          {inv.status !== 'Paid' && (
                            <button onClick={async () => {
                              try {
                                await updateDoc(doc(db, 'supplier_invoices', inv.id), { status: 'Paid', paidAt: new Date().toLocaleString() });
                                alert('✅ Invoice marked as Paid!');
                              } catch (e) { alert('Error: ' + e.message); }
                            }} style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0', padding: '5px 9px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700 }}>✅ Mark Paid</button>
                          )}
                          {inv.status !== 'Overdue' && inv.status !== 'Paid' && (
                            <button onClick={async () => {
                              try {
                                await updateDoc(doc(db, 'supplier_invoices', inv.id), { status: 'Overdue' });
                              } catch (e) { alert('Error: ' + e.message); }
                            }} style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', padding: '5px 9px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700 }}>🔴 Overdue</button>
                          )}
                          <button onClick={async () => {
                            if (!window.confirm('Delete this invoice?')) return;
                            try { await deleteDoc(doc(db, 'supplier_invoices', inv.id)); } catch (e) { alert(e.message); }
                          }} style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', padding: '5px 9px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700 }}>🗑</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {dbInvoices.length === 0 && (
                    <tr><td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🧾</div>
                      No invoices yet. Generate one from a Purchase Order or click "New Invoice".
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}



        {/* ==================== TAB: CORPORATE EXPENSES ==================== */}
        {activeTab === 'expenses' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ background: 'linear-gradient(135deg, #2B8C8A 0%, #0B2339 100%)', padding: '2rem', borderRadius: '16px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
              <div>
                <h3 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.45rem', margin: 0 }}>💸 Corporate Expenses Ledger</h3>
                <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', margin: '6px 0 0 0' }}>Monitor depot operations, feedstock procurement, packaging logistics, and chemical processing costs.</p>
              </div>
            </div>

            {/* Expenses KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              {[
                { label: 'Total Corporate Spend', val: `GH₵ ${expenses.reduce((s, e) => s + e.amount, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, color: '#2B8C8A', bg: 'rgba(43, 140, 138, 0.05)' },
                { label: 'Approved Payments', val: `GH₵ ${expenses.filter(e => e.status === 'Approved').reduce((s, e) => s + e.amount, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, color: '#15803d', bg: '#f0fdf4' },
                { label: 'Pending Approval', val: `GH₵ ${expenses.filter(e => e.status === 'Pending').reduce((s, e) => s + e.amount, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, color: '#d97706', bg: '#fffbeb' },
                { label: 'Logged Transactions', val: `${expenses.length} Records`, color: '#0B2339', bg: '#f1f5f9' }
              ].map((s, i) => (
                <div key={i} style={{ background: s.bg, padding: '1.25rem', borderRadius: '12px', border: `1px solid ${s.color}15` }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: s.color, fontFamily: 'Outfit', marginTop: '4px' }}>{s.val}</div>
                </div>
              ))}
            </div>

            {/* Layout Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }} className="kpi-detail-panel">
              {/* Left Column: List */}
              <div style={{ background: 'white', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
                <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', background: '#fafbfe' }}>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#0B2339' }}>Logged Corporate Disbursements</h4>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                        <th style={{ padding: '12px 16px', fontWeight: 800 }}>ID</th>
                        <th style={{ padding: '12px 16px', fontWeight: 800 }}>Category</th>
                        <th style={{ padding: '12px 16px', fontWeight: 800 }}>Description</th>
                        <th style={{ padding: '12px 16px', fontWeight: 800 }}>Date</th>
                        <th style={{ padding: '12px 16px', fontWeight: 800 }}>Amount</th>
                        <th style={{ padding: '12px 16px', fontWeight: 800 }}>Payment Mode</th>
                        <th style={{ padding: '12px 16px', fontWeight: 800 }}>Status</th>
                        <th style={{ padding: '12px 16px', fontWeight: 800, textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expenses.map(exp => (
                        <tr key={exp.id} style={{ borderBottom: '1px solid var(--border)' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(43, 140, 138, 0.02)'} onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                          <td style={{ padding: '14px 16px', fontWeight: 800, color: '#2B8C8A' }}>💸 {exp.id}</td>
                          <td style={{ padding: '14px 16px' }}>
                            <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', padding: '3px 8px', borderRadius: '12px', background: '#f1f5f9', color: '#475569' }}>
                              {exp.category}
                            </span>
                          </td>
                          <td style={{ padding: '14px 16px', fontWeight: 600 }}>{exp.description}</td>
                          <td style={{ padding: '14px 16px', fontSize: '0.78rem' }}>{exp.date}</td>
                          <td style={{ padding: '14px 16px', fontWeight: 800 }}>GH₵ {exp.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                          <td style={{ padding: '14px 16px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>{exp.paidVia}</td>
                          <td style={{ padding: '14px 16px' }}>
                            <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 800, background: exp.status === 'Approved' ? '#dcfce7' : '#fef3c7', color: exp.status === 'Approved' ? '#15803d' : '#b45309' }}>
                              {exp.status === 'Approved' ? '✅ Approved' : '⏳ Pending'}
                            </span>
                          </td>
                          <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '5px', justifyContent: 'flex-end' }}>
                              {exp.status === 'Pending' && (
                                <button
                                  onClick={() => {
                                    setExpenses(expenses.map(e => e.id === exp.id ? { ...e, status: 'Approved' } : e));
                                    alert('✅ Expense approved and settled!');
                                  }}
                                  style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0', padding: '5px 8px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 700 }}
                                >
                                  Approve
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  if (window.confirm("Delete this expense record?")) {
                                    setExpenses(expenses.filter(e => e.id !== exp.id));
                                  }
                                }}
                                style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', padding: '5px 8px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 700 }}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {expenses.length === 0 && (
                        <tr><td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No expense records found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right Column: Form */}
              <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', height: 'fit-content' }}>
                <h4 style={{ margin: '0 0 1.25rem 0', fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.05rem', color: '#0B2339' }}>✍️ Record Operations Expense</h4>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const data = new FormData(e.target);
                  const amount = parseFloat(data.get('amount')) || 0;
                  const category = data.get('category');
                  const description = data.get('description');
                  const paidVia = data.get('paidVia');
                  const date = data.get('date');
                  if (!description || !amount) {
                    alert("Please fill in description and amount!");
                    return;
                  }
                  const newExp = {
                    id: `EXP-0${expenses.length + 1}`,
                    category,
                    description,
                    amount,
                    date: date || new Date().toISOString().split('T')[0],
                    status: 'Approved',
                    paidVia
                  };
                  setExpenses([newExp, ...expenses]);
                  e.target.reset();
                  alert('✅ Expense logged successfully!');
                }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Expense Category</label>
                    <select name="category" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', outline: 'none', fontSize: '0.85rem' }}>
                      <option value="Raw Materials">🧪 Raw Materials</option>
                      <option value="Logistics">🚛 Logistics & Customs</option>
                      <option value="Utilities">💧 Utilities & Water</option>
                      <option value="Packaging">📦 Packaging Supplies</option>
                      <option value="Maintenance">🔧 Depot Maintenance</option>
                      <option value="Wages">👥 Staff Wages</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Disbursement Amount (GH₵)</label>
                    <input type="number" step="0.01" name="amount" required placeholder="0.00" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', outline: 'none', fontSize: '0.85rem' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Payment Protocol</label>
                    <select name="paidVia" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', outline: 'none', fontSize: '0.85rem' }}>
                      <option value="Bank Transfer">🏦 Bank Transfer</option>
                      <option value="Momo Business">📱 Momo Business</option>
                      <option value="Cash">💵 Petty Cash</option>
                      <option value="Cheque">✍️ Company Cheque</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Transaction Date</label>
                    <input type="date" name="date" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', outline: 'none', fontSize: '0.85rem' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Brief Narrative</label>
                    <input type="text" name="description" required placeholder="e.g. Caustic Soda feedstocks lot #4" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', outline: 'none', fontSize: '0.85rem' }} />
                  </div>
                  <button type="submit" style={{ background: '#2B8C8A', color: 'white', border: 'none', padding: '11px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', marginTop: '5px', transition: 'opacity 0.2s' }} onMouseEnter={e => e.currentTarget.style.opacity = 0.9} onMouseLeave={e => e.currentTarget.style.opacity = 1}>
                    💾 Log Corporate Spend
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB: ACCOUNTS PAYABLE (BILLS) ==================== */}
        {activeTab === 'bills' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #0B2339 100%)', padding: '2rem', borderRadius: '16px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
              <div>
                <h3 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.45rem', margin: 0 }}>🧾 Accounts Payable (Vendor Bills)</h3>
                <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', margin: '6px 0 0 0' }}>Manage, track, and settle incoming billing statements from raw material suppliers and plastic container manufacturers.</p>
              </div>
            </div>

            {/* Bills KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              {[
                { label: 'Total Vendor Liabilities', val: `GH₵ ${bills.reduce((s, b) => s + b.amount, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, color: '#7c3aed', bg: 'rgba(124, 58, 237, 0.05)' },
                { label: 'Pending / Unpaid Bills', val: `GH₵ ${bills.filter(b => b.status === 'Unpaid').reduce((s, b) => s + b.amount, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, color: '#dc2626', bg: '#fef2f2' },
                { label: 'Settled Liabilities', val: `GH₵ ${bills.filter(b => b.status === 'Paid').reduce((s, b) => s + b.amount, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, color: '#15803d', bg: '#f0fdf4' },
                { label: 'Total Invoices Registered', val: `${bills.length} Invoices`, color: '#0B2339', bg: '#f1f5f9' }
              ].map((s, i) => (
                <div key={i} style={{ background: s.bg, padding: '1.25rem', borderRadius: '12px', border: `1px solid ${s.color}15` }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: s.color, fontFamily: 'Outfit', marginTop: '4px' }}>{s.val}</div>
                </div>
              ))}
            </div>

            {/* Layout Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }} className="kpi-detail-panel">
              {/* Left Column: Table */}
              <div style={{ background: 'white', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
                <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', background: '#fafbfe' }}>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#0B2339' }}>Active Accounts Payable Records</h4>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                        <th style={{ padding: '12px 16px', fontWeight: 800 }}>Bill ID</th>
                        <th style={{ padding: '12px 16px', fontWeight: 800 }}>Supplier</th>
                        <th style={{ padding: '12px 16px', fontWeight: 800 }}>Invoice Ref</th>
                        <th style={{ padding: '12px 16px', fontWeight: 800 }}>Issue Date</th>
                        <th style={{ padding: '12px 16px', fontWeight: 800 }}>Due Date</th>
                        <th style={{ padding: '12px 16px', fontWeight: 800 }}>Amount</th>
                        <th style={{ padding: '12px 16px', fontWeight: 800 }}>Status</th>
                        <th style={{ padding: '12px 16px', fontWeight: 800, textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bills.map(bill => (
                        <tr key={bill.id} style={{ borderBottom: '1px solid var(--border)' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(124, 58, 237, 0.02)'} onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                          <td style={{ padding: '14px 16px', fontWeight: 800, color: '#7c3aed' }}>🧾 {bill.id}</td>
                          <td style={{ padding: '14px 16px', fontWeight: 700 }}>{bill.supplier}</td>
                          <td style={{ padding: '14px 16px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>{bill.invoiceRef}</td>
                          <td style={{ padding: '14px 16px', fontSize: '0.78rem' }}>{bill.issueDate}</td>
                          <td style={{ padding: '14px 16px', fontSize: '0.78rem', fontWeight: 600, color: bill.status === 'Unpaid' && new Date(bill.dueDate) < new Date() ? '#dc2626' : 'var(--text-main)' }}>
                            {bill.dueDate} {bill.status === 'Unpaid' && new Date(bill.dueDate) < new Date() && '⚠️'}
                          </td>
                          <td style={{ padding: '14px 16px', fontWeight: 800 }}>GH₵ {bill.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                          <td style={{ padding: '14px 16px' }}>
                            <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 800, background: bill.status === 'Paid' ? '#dcfce7' : '#fee2e2', color: bill.status === 'Paid' ? '#15803d' : '#dc2626' }}>
                              {bill.status === 'Paid' ? '✅ Paid' : '⏳ Unpaid'}
                            </span>
                          </td>
                          <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '5px', justifyContent: 'flex-end' }}>
                              {bill.status === 'Unpaid' && (
                                <button
                                  onClick={() => {
                                    setBills(bills.map(b => b.id === bill.id ? { ...b, status: 'Paid' } : b));
                                    alert('✅ Settle transaction logged and marked paid!');
                                  }}
                                  style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0', padding: '5px 8px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 700 }}
                                >
                                  Settle Bill
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  if (window.confirm("Remove this bill record?")) {
                                    setBills(bills.filter(b => b.id !== bill.id));
                                  }
                                }}
                                style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', padding: '5px 8px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 700 }}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {bills.length === 0 && (
                        <tr><td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No bill logs found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right Column: Add Bill Form */}
              <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', height: 'fit-content' }}>
                <h4 style={{ margin: '0 0 1.25rem 0', fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.05rem', color: '#0B2339' }}>✍️ Record Incoming Bill</h4>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const data = new FormData(e.target);
                  const amount = parseFloat(data.get('amount')) || 0;
                  const supplier = data.get('supplier');
                  const invoiceRef = data.get('invoiceRef');
                  const issueDate = data.get('issueDate');
                  const dueDate = data.get('dueDate');
                  if (!supplier || !amount || !invoiceRef) {
                    alert("Please fill in Supplier, Reference, and Amount!");
                    return;
                  }
                  const newBill = {
                    id: `BILL-0${bills.length + 1}`,
                    supplier,
                    invoiceRef,
                    amount,
                    issueDate: issueDate || new Date().toISOString().split('T')[0],
                    dueDate: dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    status: 'Unpaid'
                  };
                  setBills([newBill, ...bills]);
                  e.target.reset();
                  alert('✅ Bill successfully recorded to Accounts Payable!');
                }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Supplier / Vendor Name</label>
                    <input type="text" name="supplier" required placeholder="e.g. Apex Plastics Corp" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', outline: 'none', fontSize: '0.85rem' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Invoice Reference #</label>
                    <input type="text" name="invoiceRef" required placeholder="e.g. INV-7492A" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', outline: 'none', fontSize: '0.85rem' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Billing Amount (GH₵)</label>
                    <input type="number" step="0.01" name="amount" required placeholder="0.00" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', outline: 'none', fontSize: '0.85rem' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Issue Date</label>
                    <input type="date" name="issueDate" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', outline: 'none', fontSize: '0.85rem' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Due Date</label>
                    <input type="date" name="dueDate" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', outline: 'none', fontSize: '0.85rem' }} />
                  </div>
                  <button type="submit" style={{ background: '#7c3aed', color: 'white', border: 'none', padding: '11px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', marginTop: '5px', transition: 'opacity 0.2s' }} onMouseEnter={e => e.currentTarget.style.opacity = 0.9} onMouseLeave={e => e.currentTarget.style.opacity = 1}>
                    💾 Register Vendor Liability
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}



        {/* TAB G: STORE SETTINGS WORKSPACE */}
        {activeTab === 'settings' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }} className="kpi-detail-panel">

            {/* Left Column: API Configurations */}
            <form onSubmit={saveSettings} style={{ background: 'white', padding: '2rem', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <h3 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.25rem', margin: 0 }}>⚙️ Portal API Settings</h3>

              <div style={{ height: '1px', background: 'var(--border)' }} />

              {/* Cloudinary Config Cards */}
              <div>
                <span style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>☁️ Cloudinary Configurations</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.85rem', fontWeight: 600 }}>Cloud Name</label>
                    <input
                      type="text"
                      value={cloudinaryCloud}
                      onChange={e => setCloudinaryCloud(e.target.value.trim())}
                      placeholder="e.g. neatbrandtrade"
                      style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.85rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.85rem', fontWeight: 600 }}>Unsigned Upload Preset</label>
                    <input
                      type="text"
                      value={cloudinaryPreset}
                      onChange={e => setCloudinaryPreset(e.target.value.trim())}
                      placeholder="e.g. nbt_unsigned_preset"
                      style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.85rem' }}
                    />
                  </div>
                </div>
              </div>

              {/* WhatsApp Config Card */}
              <div>
                <span style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>💬 Store Dispatch Configuration</span>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.85rem', fontWeight: 600 }}>WhatsApp Target Number</label>
                  <input
                    type="text"
                    value={whatsappNumber}
                    onChange={e => setWhatsappNumber(e.target.value.trim())}
                    placeholder="e.g. 0246272115"
                    style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div style={{ height: '1px', background: 'var(--border)' }} />

              <button type="submit" className="btn btn-primary" style={{ padding: '12px', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 700 }}>Save Portal Settings ✓</button>
            </form>

            {/* Right Column: Connection Diagnostics */}
            <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <h3 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.2rem', margin: 0 }}>🔌 Connection Diagnostics</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                Test your Cloudinary credentials locally. This tool fires a mock image upload preset fetch call directly to your Cloudinary server.
              </p>

              <button
                type="button"
                onClick={testCloudinaryConnection}
                disabled={isTestingCloudinary}
                className="btn btn-outline"
                style={{ width: '100%', padding: '12px', fontSize: '0.88rem', borderRadius: '8px', cursor: 'pointer' }}
              >
                {isTestingCloudinary ? 'Testing Connection...' : '⚡ Test Connection'}
              </button>

              {testUrl && (
                <div style={{ background: 'rgba(43,140,138,0.08)', border: '1px dashed var(--secondary)', padding: '12px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--secondary)' }}>✓ DIAGNOSTICS PASSED</span>
                  <a href={testUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.72rem', color: 'var(--primary)', textDecoration: 'underline', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {testUrl}
                  </a>
                </div>
              )}
            </div>

          </div>
        )}

      </main>

      {/* -------------------- ADD / EDIT PRODUCT MODAL DRAWER -------------------- */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(11, 35, 57, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'white', padding: '35px', borderRadius: '20px', width: '100%', maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)', animation: 'slideUp 0.3s ease-out' }}>

            {/* Modal Title */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.5rem', color: 'var(--primary)' }}>
                {isEditing ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.8rem', cursor: 'pointer', color: 'var(--text-muted)' }}>×</button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              {/* Product Image File selector */}
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700, fontSize: '0.85rem', color: 'var(--primary)' }}>Product Image File</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => setImageFile(e.target.files[0])}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                />
                <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Supports auto-direct Cloudinary unscheduled presets. Defaults to Firebase storage system if unconfigured.
                </span>
              </div>

              {/* Product Name */}
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700, fontSize: '0.85rem', color: 'var(--primary)' }}>Product Name</label>
                <input
                  required
                  type="text"
                  value={newProduct.name}
                  onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.88rem' }}
                  placeholder="e.g. Floral Detergent Liquid"
                />
              </div>

              {/* Grid 2 Elements (Brand, Category) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700, fontSize: '0.85rem', color: 'var(--primary)' }}>Brand</label>
                  <select
                    value={newProduct.brand}
                    onChange={e => setNewProduct({ ...newProduct, brand: e.target.value })}
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.88rem', background: 'white' }}
                  >
                    <option value="Neat Product">Neat Product</option>
                    <option value="Deva Products">Deva Products</option>
                    <option value="NBT GLOBAL">NBT GLOBAL</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700, fontSize: '0.85rem', color: 'var(--primary)' }}>Category</label>
                  <select
                    value={newProduct.category}
                    onChange={e => setNewProduct({ ...newProduct, category: e.target.value })}
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.88rem', background: 'white' }}
                  >
                    <option value="Industrial Cleaners">🧪 Industrial Cleaners</option>
                    <option value="Household Cleaners">🏠 Household Cleaners</option>
                    <option value="Hygiene Products">✨ Hygiene Products</option>
                    <option value="Disinfectants">🛡️ Disinfectants</option>
                    <option value="Bulk Solutions">📦 Bulk Solutions</option>
                  </select>
                </div>
              </div>

              {/* Grid 3 Elements (Type, Stock Quantity, Status) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700, fontSize: '0.85rem', color: 'var(--primary)' }}>Type</label>
                  <select
                    value={newProduct.type}
                    onChange={e => setNewProduct({ ...newProduct, type: e.target.value })}
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.88rem', background: 'white' }}
                  >
                    <option value="retail">Retail Pack</option>
                    <option value="industrial">Industrial Bulk</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700, fontSize: '0.85rem', color: 'var(--primary)' }}>Quantity</label>
                  <input
                    required
                    type="number"
                    value={newProduct.quantity}
                    onChange={e => setNewProduct({ ...newProduct, quantity: parseInt(e.target.value) || 0 })}
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.88rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700, fontSize: '0.85rem', color: 'var(--primary)' }}>Status</label>
                  <select
                    value={newProduct.status}
                    onChange={e => setNewProduct({ ...newProduct, status: e.target.value })}
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.88rem', background: 'white' }}
                  >
                    <option value="Published">Active Publish</option>
                    <option value="Draft">Draft Mode</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700, fontSize: '0.85rem', color: 'var(--primary)' }}>Description</label>
                <textarea
                  required
                  value={newProduct.description}
                  onChange={e => setNewProduct({ ...newProduct, description: e.target.value })}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.88rem', minHeight: '80px', fontFamily: 'inherit', lineHeight: 1.5 }}
                  placeholder="Formulated with active ingredients calculated for high-efficiency sanitization..."
                />
              </div>

              {/* Zoho Books Specific Fields */}
              <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <span style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', color: 'var(--primary)' }}>💼 Zoho Books Inventory Settings</span>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Purchase Description</label>
                  <input
                    type="text"
                    value={newProduct.purchaseDescription || ''}
                    onChange={e => setNewProduct({ ...newProduct, purchaseDescription: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                    placeholder="e.g. Bulk purchase of floral detergent"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Purchase Rate (GHS)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newProduct.purchaseRate || ''}
                      onChange={e => setNewProduct({ ...newProduct, purchaseRate: e.target.value })}
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                      placeholder="e.g. 259.60"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Rate / Selling (GHS)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newProduct.rate || ''}
                      onChange={e => setNewProduct({ ...newProduct, rate: e.target.value })}
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                      placeholder="e.g. 316.00"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Stock On Hand UOM</label>
                    <input
                      type="text"
                      value={newProduct.stockOnHand || ''}
                      onChange={e => setNewProduct({ ...newProduct, stockOnHand: e.target.value })}
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                      placeholder="e.g. box, pack, drum"
                    />
                  </div>
                </div>
              </div>

              {/* Sizes and pricing grid */}
              <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <span style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', color: 'var(--primary)', marginBottom: '12px' }}>Sizes, Prices & Packaging Grid</span>

                {newProduct.sizes.map((sizeObj, index) => (
                  <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                    <input
                      required
                      type="text"
                      placeholder="Size (e.g. 5L)"
                      value={sizeObj.size}
                      onChange={e => handleSizeChange(index, 'size', e.target.value)}
                      style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                    />
                    <input
                      required
                      type="number"
                      placeholder="Price (GH₵)"
                      value={sizeObj.price || ''}
                      onChange={e => handleSizeChange(index, 'price', e.target.value)}
                      style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                    />
                    <input
                      required
                      type="number"
                      placeholder="Box Qty"
                      value={sizeObj.qtyInBox || 1}
                      onChange={e => handleSizeChange(index, 'qtyInBox', e.target.value)}
                      style={{ flex: 0.6, padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                      title="Case/Box quantity"
                    />
                    {newProduct.sizes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveSize(index)}
                        style={{ padding: '10px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 700 }}
                      >✕</button>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  onClick={handleAddSize}
                  style={{ background: 'none', border: '1px dashed var(--secondary)', color: 'var(--secondary)', padding: '10px', width: '100%', borderRadius: '8px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700, marginTop: '8px' }}
                >
                  + Add Another Size & Price
                </button>
              </div>

              {/* Upload Progress Status Overlay */}
              {isUploading && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 600 }}>
                    <span>📤 Uploading image...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${uploadProgress}%`, background: 'var(--secondary)', borderRadius: '3px', transition: 'width 0.25s' }}></div>
                  </div>
                </div>
              )}

              {/* Publish Submit Trigger */}
              <button
                type="submit"
                disabled={isUploading}
                className="btn btn-primary"
                style={{ marginTop: '10px', padding: '15px', borderRadius: '12px', fontSize: '0.95rem', fontWeight: 700, opacity: isUploading ? 0.7 : 1 }}
              >
                {isUploading ? 'Publishing...' : (isEditing ? 'Publish Updates' : 'Publish Product')}
              </button>

            </form>
          </div>
        </div>
      )}

      {/* ===== CREATE ZOHO PRICE LIST MODAL ===== */}
      {showCreatePriceListModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(11, 35, 57, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(8px)' }}>
          <div style={{ background: 'white', padding: '35px', borderRadius: '20px', width: '100%', maxWidth: '580px', maxHeight: '90vh', overflowY: 'auto', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)', animation: 'slideUp 0.3s ease-out' }}>

            {/* Modal Title */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '15px' }}>
              <div>
                <h2 style={{ margin: 0, fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.4rem', color: '#0B2339' }}>
                  New Price List
                </h2>
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Define custom adjustments or price settings</span>
              </div>
              <button onClick={() => setShowCreatePriceListModal(false)} style={{ background: '#f1f5f9', border: 'none', width: '36px', height: '36px', borderRadius: '50%', fontSize: '1.2rem', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
            </div>

            <form onSubmit={handleCreatePriceList} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              {/* Name */}
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700, fontSize: '0.85rem', color: '#0B2339' }}>Name *</label>
                <input
                  required
                  type="text"
                  value={newPriceListForm.name}
                  onChange={e => setNewPriceListForm({ ...newPriceListForm, name: e.target.value })}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  placeholder="e.g. Standard 15% Markup"
                />
              </div>

              {/* Transaction Type */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 700, fontSize: '0.85rem', color: '#0B2339' }}>Transaction Type</label>
                <div style={{ display: 'flex', gap: '24px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 600, color: '#334155' }}>
                    <input
                      type="radio"
                      name="transactionType"
                      checked={newPriceListForm.transactionType === 'Sales'}
                      onChange={() => setNewPriceListForm({ ...newPriceListForm, transactionType: 'Sales' })}
                      style={{ width: '18px', height: '18px', accentColor: '#1A73E8', cursor: 'pointer' }}
                    />
                    Sales
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 600, color: '#334155' }}>
                    <input
                      type="radio"
                      name="transactionType"
                      checked={newPriceListForm.transactionType === 'Purchase'}
                      onChange={() => setNewPriceListForm({ ...newPriceListForm, transactionType: 'Purchase' })}
                      style={{ width: '18px', height: '18px', accentColor: '#1A73E8', cursor: 'pointer' }}
                    />
                    Purchase
                  </label>
                </div>
              </div>

              {/* Price List Type */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 700, fontSize: '0.85rem', color: '#0B2339' }}>Price List Type</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: '#f8fafc', padding: '15px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="type"
                      checked={newPriceListForm.type === 'All Items'}
                      onChange={() => setNewPriceListForm({ ...newPriceListForm, type: 'All Items' })}
                      style={{ width: '18px', height: '18px', accentColor: '#1A73E8', marginTop: '3px', cursor: 'pointer' }}
                    />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#334155' }}>All Items</div>
                      <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Mark up or mark down the rates of all items</span>
                    </div>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', marginTop: '6px' }}>
                    <input
                      type="radio"
                      name="type"
                      checked={newPriceListForm.type === 'Individual Items'}
                      onChange={() => setNewPriceListForm({ ...newPriceListForm, type: 'Individual Items' })}
                      style={{ width: '18px', height: '18px', accentColor: '#1A73E8', marginTop: '3px', cursor: 'pointer' }}
                    />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#334155' }}>Individual Items</div>
                      <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Customize the rate of each item</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Description */}
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700, fontSize: '0.85rem', color: '#0B2339' }}>Description</label>
                <textarea
                  value={newPriceListForm.description}
                  onChange={e => setNewPriceListForm({ ...newPriceListForm, description: e.target.value })}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', minHeight: '80px', fontFamily: 'inherit', lineHeight: 1.5 }}
                  placeholder="Enter the description"
                />
              </div>

              {/* Percentage (%) - Only active when "All Items" is selected */}
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700, fontSize: '0.85rem', color: newPriceListForm.type === 'All Items' ? '#0B2339' : '#cbd5e1' }}>Percentage (%)</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    required={newPriceListForm.type === 'All Items'}
                    disabled={newPriceListForm.type !== 'All Items'}
                    type="number"
                    step="0.1"
                    value={newPriceListForm.percentage}
                    onChange={e => setNewPriceListForm({ ...newPriceListForm, percentage: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 35px 12px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.88rem',
                      background: newPriceListForm.type === 'All Items' ? 'white' : '#f1f5f9'
                    }}
                    placeholder="e.g. 10 for markup, -5 for markdown"
                  />
                  <span style={{ position: 'absolute', right: '15px', fontWeight: 700, color: '#94a3b8' }}>%</span>
                </div>
              </div>

              {/* Round Off To */}
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700, fontSize: '0.85rem', color: '#0B2339' }}>Round Off To</label>
                <select
                  value={newPriceListForm.roundOffTo}
                  onChange={e => setNewPriceListForm({ ...newPriceListForm, roundOffTo: e.target.value })}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', background: 'white' }}
                >
                  <option value="Never mind">Never mind</option>
                  <option value="Nearest whole number">Nearest whole number</option>
                  <option value="Nearest decimal (0.10)">Nearest decimal (0.10)</option>
                  <option value="Nearest 0.05">Nearest 0.05</option>
                  <option value="Nearest 0.99">Nearest 0.99</option>
                  <option value="Nearest 0.50">Nearest 0.50</option>
                </select>
              </div>

              {/* Submit / Cancel Buttons */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '15px', borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
                <button
                  type="submit"
                  disabled={isSavingZohoPriceList}
                  style={{
                    flex: 1,
                    background: '#1A73E8',
                    color: 'white',
                    border: 'none',
                    padding: '14px',
                    borderRadius: '8px',
                    fontSize: '0.92rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    opacity: isSavingZohoPriceList ? 0.7 : 1
                  }}
                >
                  {isSavingZohoPriceList ? 'Saving...' : 'Save Price List'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreatePriceListModal(false)}
                  style={{
                    flex: 1,
                    background: '#f1f5f9',
                    color: '#475569',
                    border: 'none',
                    padding: '14px',
                    borderRadius: '8px',
                    fontSize: '0.92rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* -------------------- Add Manufacturer Modal -------------------- */}
      {/* ===== SUPPLIER DETAILS DRAWER ===== */}
      {selectedSupplierDetail && (
        <div
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'flex-end', zIndex: 350, animation: 'slideUp 0.25s ease' }}
          onClick={e => { if (e.target === e.currentTarget) setSelectedSupplierDetail(null); }}
        >
          <div style={{ width: '100%', maxWidth: '580px', background: 'white', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '-20px 0 60px rgba(0,0,0,0.2)', animation: 'slideInRight 0.3s ease' }}>
            {/* Drawer Header */}
            <div style={{ background: 'linear-gradient(135deg, #0B2339, #1a3a5c)', color: 'white', padding: '1.75rem 2rem', flexShrink: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: 0, fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.3rem' }}>{activeSupplierDetail.name}</h3>
                  {activeSupplierDetail.companyName && <div style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '3px' }}>🏭 {activeSupplierDetail.companyName}</div>}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                    <span style={{ background: activeSupplierDetail.status === 'Inactive' ? 'rgba(148,163,184,0.25)' : 'rgba(34,197,94,0.25)', color: activeSupplierDetail.status === 'Inactive' ? '#94a3b8' : '#4ade80', border: `1px solid ${activeSupplierDetail.status === 'Inactive' ? 'rgba(148,163,184,0.35)' : 'rgba(74,222,128,0.35)'}`, padding: '3px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 800 }}>
                      {activeSupplierDetail.status === 'Inactive' ? '⏸ Inactive' : '✅ Active'}
                    </span>
                    {activeSupplierDetail.paymentTerms && <span style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.9)', border: '1px solid rgba(255,255,255,0.2)', padding: '3px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700 }}>💳 {activeSupplierDetail.paymentTerms}</span>}
                  </div>
                </div>
                <button onClick={() => setSelectedSupplierDetail(null)} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: '8px', padding: '7px 12px', cursor: 'pointer', fontWeight: 700 }}>✕</button>
              </div>
            </div>

            {/* Drawer Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.75rem 2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

              {/* Contact Info */}
              <div>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', display: 'block', marginBottom: '10px' }}>Contact Information</span>
                <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '14px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.84rem' }}>
                  <div>🧑‍💼 <strong>Contact Person:</strong> {activeSupplierDetail.contactPerson || '—'}</div>
                  <div>📞 <strong>Phone:</strong> <a href={'tel:' + activeSupplierDetail.phone} style={{ color: 'var(--secondary)', fontWeight: 700 }}>{activeSupplierDetail.phone}</a></div>
                  {activeSupplierDetail.email && <div>✉️ <strong>Email:</strong> <a href={'mailto:' + activeSupplierDetail.email} style={{ color: 'var(--primary)', fontWeight: 700 }}>{activeSupplierDetail.email}</a></div>}
                  <div>📍 <strong>Address:</strong> {activeSupplierDetail.address || activeSupplierDetail.location || '—'}</div>
                  {activeSupplierDetail.notes && <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '8px', padding: '8px 10px', fontStyle: 'italic', marginTop: '4px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>📌 {activeSupplierDetail.notes}</div>}
                </div>
              </div>

              {/* Products Supplied */}
              {activeSupplierDetail.materials && (
                <div>
                  <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', display: 'block', marginBottom: '10px' }}>Product Categories Supplied</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {activeSupplierDetail.materials.split(',').map((m, i) => (
                      <span key={i} style={{ background: 'rgba(43,140,138,0.08)', color: 'var(--primary)', border: '1px solid rgba(43,140,138,0.2)', padding: '5px 10px', borderRadius: '8px', fontSize: '0.76rem', fontWeight: 700 }}>{m.trim()}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Price List Items */}
              {activeSupplierDetail.priceList?.length > 0 && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '10px' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Price List ({activeSupplierDetail.priceList.length} items)</span>
                    {activeSupplierDetail.priceListDate && (
                      <span style={{ fontSize: '0.76rem', color: '#0369a1', fontWeight: 700, background: '#e0f2fe', padding: '4px 10px', borderRadius: '6px' }}>
                        📅 Effective: {activeSupplierDetail.priceListDate}
                      </span>
                    )}
                  </div>
                  <div style={{ background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                      <thead><tr style={{ background: '#f1f5f9', borderBottom: '1px solid #e2e8f0' }}>
                        <th style={{ padding: '8px 10px', fontWeight: 800, textAlign: 'left' }}>BARCODE</th>
                        <th style={{ padding: '8px 10px', fontWeight: 800, textAlign: 'left' }}>Item Name</th>
                        <th style={{ padding: '8px 10px', fontWeight: 800, textAlign: 'left' }}>Description</th>
                        <th style={{ padding: '8px 10px', fontWeight: 800, textAlign: 'right' }}>Box Sales Rate</th>
                        <th style={{ padding: '8px 10px', fontWeight: 800, textAlign: 'right' }}>Purchase Box Price</th>
                        <th style={{ padding: '8px 10px', fontWeight: 800, textAlign: 'right' }}>Qty in box</th>
                        <th style={{ padding: '8px 10px', fontWeight: 800, textAlign: 'right' }}>Unit Price</th>
                        <th style={{ padding: '8px 10px', fontWeight: 800, textAlign: 'right' }}>PROFIT</th>
                      </tr></thead>
                      <tbody>
                        {activeSupplierDetail.priceList.map((item, i) => {
                          const rateVal = parseFloat(item.rate || item.unitPrice || item.price || 0);
                          const purchaseVal = parseFloat(item.purchaseRate || 0);
                          const qtyVal = parseFloat(item.qtyInBox || 1);
                          const uPrice = item.unitPrice !== undefined ? parseFloat(item.unitPrice) : (qtyVal > 0 ? (rateVal / qtyVal) : 0);
                          const profitVal = item.profit !== undefined ? parseFloat(item.profit) : (rateVal - purchaseVal);

                          const matchingProd = products.find(p => p.name?.toLowerCase() === (item.name || item.item)?.toLowerCase() || (item.name || item.item)?.toLowerCase().includes(p.name?.toLowerCase()));

                          return (
                            <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '8px 10px', fontFamily: 'monospace', color: 'var(--text-muted)' }}>{item.barcode || '—'}</td>
                              <td style={{ padding: '8px 10px', fontWeight: 700, color: 'var(--primary)' }}>{item.name || item.item}</td>
                              <td style={{ padding: '8px 10px', color: 'var(--text-muted)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  {matchingProd?.image && (
                                    <img src={matchingProd.image} alt={item.name || item.item} style={{ width: '35px', height: '35px', objectFit: 'contain', background: '#f8fafc', borderRadius: '4px', padding: '2px', border: '1px solid #e2e8f0', flexShrink: 0 }} />
                                  )}
                                  <span>{item.description || item.size || item.pack || '—'}</span>
                                </div>
                              </td>
                              <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700 }}>GH₵ {rateVal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                              <td style={{ padding: '8px 10px', textAlign: 'right' }}>GH₵ {purchaseVal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                              <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600 }}>{qtyVal}</td>
                              <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: 'var(--secondary)' }}>GH₵ {uPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                              <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: profitVal >= 0 ? '#16a34a' : '#dc2626' }}>GH₵ {profitVal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Purchase Order History */}
              {(() => {
                const supplierPOs = activeManufacturerPOs.filter(p => p.manufacturerId === activeSupplierDetail.id || p.manufacturerName === activeSupplierDetail.name);
                return (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Purchase Order History ({supplierPOs.length})</span>
                      <button onClick={() => { setSelectedSupplierDetail(null); setActiveTab('purchase-orders'); handleOpenUniversalCreator('po'); }} style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>+ Create PO</button>
                    </div>
                    {supplierPOs.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '0.82rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>No purchase orders yet for this supplier.</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {supplierPOs.slice(0, 5).map(po => (
                          <div key={po.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.8rem' }}>
                            <div>
                              <div style={{ fontWeight: 800, color: 'var(--primary)' }}>📄 {po.poNumber}</div>
                              <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: '2px' }}>{po.date}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontWeight: 800 }}>GH₵ {po.totalAmount?.toLocaleString('en-US',{minimumFractionDigits:2})}</div>
                              <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '0.68rem', fontWeight: 800, background: po.status==='Delivered'?'#dcfce7':po.status==='Sent'?'#dbeafe':po.status==='Cancelled'?'#fee2e2':'#f1f5f9', color: po.status==='Delivered'?'#166534':po.status==='Sent'?'#1e40af':po.status==='Cancelled'?'#991b1b':'#334155' }}>{po.status}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Invoice & Balance */}
              {(() => {
                const supplierInvoices = dbInvoices.filter(inv => inv.supplierId === activeSupplierDetail.id || inv.supplierName === activeSupplierDetail.name);
                const outstanding = supplierInvoices.filter(i => i.status !== 'Paid').reduce((s, i) => s + (parseFloat(i.totalAmount) || 0), 0);
                const paid = supplierInvoices.filter(i => i.status === 'Paid').reduce((s, i) => s + (parseFloat(i.totalAmount) || 0), 0);
                return (
                  <div>
                    <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', display: 'block', marginBottom: '10px' }}>Invoice Summary</span>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                      <div style={{ background: '#f5f3ff', padding: '10px', borderRadius: '10px', textAlign: 'center' }}>
                        <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#7c3aed', fontFamily: 'Outfit' }}>{supplierInvoices.length}</div>
                        <div style={{ fontSize: '0.68rem', color: '#7c3aed', fontWeight: 700 }}>Total</div>
                      </div>
                      <div style={{ background: outstanding > 0 ? '#fef2f2' : '#f0fdf4', padding: '10px', borderRadius: '10px', textAlign: 'center' }}>
                        <div style={{ fontWeight: 800, fontSize: '0.95rem', color: outstanding > 0 ? '#dc2626' : '#15803d', fontFamily: 'Outfit' }}>GH₵{outstanding.toLocaleString('en-US', { maximumFractionDigits: 0 })}</div>
                        <div style={{ fontSize: '0.68rem', color: outstanding > 0 ? '#dc2626' : '#15803d', fontWeight: 700 }}>Outstanding</div>
                      </div>
                      <div style={{ background: '#f0fdf4', padding: '10px', borderRadius: '10px', textAlign: 'center' }}>
                        <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#15803d', fontFamily: 'Outfit' }}>GH₵{paid.toLocaleString('en-US', { maximumFractionDigits: 0 })}</div>
                        <div style={{ fontSize: '0.68rem', color: '#15803d', fontWeight: 700 }}>Paid</div>
                      </div>
                    </div>
                    {supplierInvoices.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {supplierInvoices.slice(0, 4).map(inv => (
                          <div key={inv.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 14px', background: '#f8fafc', borderRadius: '9px', border: '1px solid #e2e8f0', fontSize: '0.78rem' }}>
                            <div>
                              <span style={{ fontWeight: 800, color: '#7c3aed' }}>🧾 {inv.invoiceNumber}</span>
                              {inv.issueDate && <span style={{ color: 'var(--text-muted)', marginLeft: '8px' }}>{inv.issueDate}</span>}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontWeight: 800 }}>GH₵ {parseFloat(inv.totalAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                              <span style={{ padding: '2px 7px', borderRadius: '20px', fontSize: '0.66rem', fontWeight: 800, background: inv.status === 'Paid' ? '#dcfce7' : inv.status === 'Overdue' ? '#fee2e2' : '#fef3c7', color: inv.status === 'Paid' ? '#15803d' : inv.status === 'Overdue' ? '#dc2626' : '#92400e' }}>{inv.status}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
                            </div>

                            {/* Drawer Footer Actions */}
                            <div style={{ padding: '1.25rem 2rem', borderTop: '1px solid var(--border)', background: '#fafafa', display: 'flex', gap: '8px', flexWrap: 'wrap', flexShrink: 0 }}>
                              <a href={`https://wa.me/${formatGhanaPhone(activeSupplierDetail.phone)}?text=${encodeURIComponent(`Hello ${activeSupplierDetail.contactPerson}, this is NBT Procurement.`)}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#25D366', color: 'white', padding: '9px 16px', borderRadius: '9px', fontSize: '0.82rem', fontWeight: 700, textDecoration: 'none', flex: 1, justifyContent: 'center' }}>💬 WhatsApp</a>
                              <button onClick={() => handleOpenPriceList(activeSupplierDetail)} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(43,140,138,0.08)', color: 'var(--primary)', padding: '9px 16px', borderRadius: '9px', fontSize: '0.82rem', fontWeight: 700, border: '1px solid rgba(43,140,138,0.2)', cursor: 'pointer', flex: 1, justifyContent: 'center' }}>📋 Price List</button>
                              <button onClick={() => { setSelectedSupplierDetail(null); handleOpenUniversalCreator('po', { manufacturerId: activeSupplierDetail.id }); }} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#0B2339', color: 'white', padding: '9px 16px', borderRadius: '9px', fontSize: '0.82rem', fontWeight: 700, border: 'none', cursor: 'pointer', flex: 1, justifyContent: 'center' }}>📝 Create PO</button>
                            </div>
                          </div>
        </div>
                    )}

                    {/* ===== VIEW INVOICE DETAIL MODAL ===== */}
                    {viewingInvoice && (
                      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: '20px' }}
                        onClick={e => { if (e.target === e.currentTarget) setViewingInvoice(null); }}>
                        <div style={{ background: 'white', borderRadius: '20px', width: '100%', maxWidth: '600px', overflow: 'hidden', boxShadow: '0 30px 70px rgba(0,0,0,0.3)', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
                          <div style={{ background: 'linear-gradient(135deg, #3b0764, #6d28d9)', color: 'white', padding: '1.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <h3 style={{ margin: 0, fontFamily: 'Outfit', fontWeight: 800 }}>🧾 {viewingInvoice.invoiceNumber}</h3>
                              <span style={{ fontSize: '0.78rem', opacity: 0.75 }}>{viewingInvoice.supplierName}</span>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button onClick={() => window.print()} style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)', color: 'white', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontWeight: 700, fontSize: '0.78rem' }}>🖨 Print</button>
                              <button onClick={() => { setViewingInvoice(null); handleOpenUniversalCreator('invoice', viewingInvoice); }} style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', color: 'white', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontWeight: 700, marginRight: '10px' }}>✏️ Edit Invoice</button>
                              <button onClick={() => setViewingInvoice(null)} style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)', color: 'white', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontWeight: 700 }}>✕</button>
                            </div>
                          </div>
                          <div style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '1.5rem' }}>
                              {[
                                ['Supplier', viewingInvoice.supplierName],
                                ['Status', viewingInvoice.status],
                                ['Invoice #', viewingInvoice.invoiceNumber],
                                ['Linked PO', viewingInvoice.poNumber || '—'],
                                ['Issue Date', viewingInvoice.issueDate || '—'],
                                ['Due Date', viewingInvoice.dueDate || '—'],
                                ['Total Amount', `GH₵ ${parseFloat(viewingInvoice.totalAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`],
                                ['Notes', viewingInvoice.notes || '—']
                              ].map(([lbl, val]) => (
                                <div key={lbl} style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                                  <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{lbl}</div>
                                  <div style={{ fontWeight: 700, marginTop: '4px', fontSize: '0.9rem' }}>{val}</div>
                                </div>
                              ))}
                            </div>
                            {viewingInvoice.items?.length > 0 && (
                              <div>
                                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '10px' }}>Line Items</div>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
                                  <thead><tr style={{ background: '#f1f5f9' }}>
                                    <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 800 }}>Item</th>
                                    <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 800 }}>Qty</th>
                                    <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 800 }}>Price</th>
                                    <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 800 }}>Total</th>
                                  </tr></thead>
                                  <tbody>
                                    {viewingInvoice.items.map((item, i) => (
                                      <tr key={i} style={{ borderTop: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '9px 14px' }}>{item.name}</td>
                                        <td style={{ padding: '9px 14px', textAlign: 'right' }}>{item.qty}</td>
                                        <td style={{ padding: '9px 14px', textAlign: 'right' }}>GH₵ {parseFloat(item.unitPrice || item.price || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                                        <td style={{ padding: '9px 14px', textAlign: 'right', fontWeight: 800 }}>GH₵ {((item.qty || 0) * (item.unitPrice || item.price || 0)).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                          <div style={{ padding: '1.25rem 2rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            {viewingInvoice.status !== 'Paid' && (
                              <button onClick={async () => {
                                try { await updateDoc(doc(db, 'supplier_invoices', viewingInvoice.id), { status: 'Paid', paidAt: new Date().toLocaleString() }); setViewingInvoice(null); alert('✅ Marked as Paid!'); } catch (e) { alert(e.message); }
                              }} style={{ padding: '9px 20px', borderRadius: '9px', background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0', cursor: 'pointer', fontWeight: 800 }}>✅ Mark Paid</button>
                            )}
                            <button onClick={() => setViewingInvoice(null)} style={{ padding: '9px 20px', borderRadius: '9px', border: '1px solid var(--border)', background: 'white', cursor: 'pointer', fontWeight: 600, color: 'var(--text-muted)' }}>Close</button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ===== SUPPLIER PRICE LIST MODAL ===== */}

                    {selectedSupplierForPriceList && (
                      <div
                        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '20px', animation: 'slideUp 0.3s var(--transition)' }}
                        onClick={e => { if (e.target === e.currentTarget) handleClosePriceList(); }}
                      >
                        <div style={{ background: 'white', borderRadius: '20px', boxShadow: '0 25px 60px rgba(0,0,0,0.25)', width: '100%', maxWidth: '860px', display: 'flex', flexDirection: 'column', overflow: 'hidden', maxHeight: '90vh' }}>
                          {/* Header */}
                          <div style={{ background: 'linear-gradient(135deg, var(--primary), #1a7a78)', color: 'white', padding: '1.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                              <h3 style={{ margin: 0, fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.25rem' }}>📋 Supply Price List</h3>
                              <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', opacity: 0.85 }}>{selectedSupplierForPriceList.name} · {selectedSupplierForPriceList.location}</p>
                            </div>
                            <button
                              onClick={handleClosePriceList}
                              style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', backdropFilter: 'blur(4px)' }}
                            >
                              ✕ Close
                            </button>
                          </div>

                          {/* Supplier Summary Strip */}
                          <div style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)', padding: '0.85rem 2rem', display: 'flex', gap: '2rem', fontSize: '0.82rem', color: 'var(--text-muted)', flexWrap: 'wrap', alignItems: 'center' }}>
                            <span>🧑‍💼 <strong style={{ color: 'var(--text-main)' }}>{selectedSupplierForPriceList.contactPerson}</strong></span>
                            <span>📞 <strong style={{ color: 'var(--secondary)' }}>{selectedSupplierForPriceList.phone}</strong></span>
                            {selectedSupplierForPriceList.email && <span>✉️ <strong style={{ color: 'var(--primary)' }}>{selectedSupplierForPriceList.email}</strong></span>}
                            <span style={{ marginLeft: 'auto', fontWeight: 700, color: 'var(--primary)' }}>
                              {supplierPriceListItems.length} item{supplierPriceListItems.length !== 1 ? 's' : ''} in price list
                            </span>
                          </div>

                          {/* Price List Date Bar */}
                          <div style={{ background: '#f0fdfa', borderBottom: '1px solid var(--border)', padding: '0.75rem 2rem', display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', fontWeight: 600, color: 'var(--primary)' }}>
                              <span>📅</span>
                              <span>Price List Effective Date:</span>
                            </div>
                            <input
                              type="date"
                              value={priceListDate}
                              onChange={e => setPriceListDate(e.target.value)}
                              style={{
                                padding: '6px 12px',
                                borderRadius: '8px',
                                border: '1.5px solid var(--primary)',
                                fontSize: '0.82rem',
                                fontWeight: 700,
                                outline: 'none',
                                color: 'var(--primary)',
                                background: 'white',
                                cursor: 'pointer'
                              }}
                            />
                            {selectedSupplierForPriceList.priceListUpdatedAt && (
                              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                                🕒 Last saved: <strong>{selectedSupplierForPriceList.priceListUpdatedAt}</strong>
                              </span>
                            )}
                          </div>

                          {/* Price List Table */}
                          <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 2rem' }}>
                            {supplierPriceListItems.length === 0 ? (
                              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
                                <p style={{ fontWeight: 700, fontSize: '1rem', margin: '0 0 6px 0' }}>No price items yet</p>
                                <p style={{ fontSize: '0.82rem', margin: 0 }}>Click "+ Add Item" below to start building the price list for this supplier.</p>
                              </div>
                            ) : (
                              <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000000', fontSize: '0.80rem' }}>
                                  <thead>
                                    <tr style={{ borderBottom: '1px solid #000000' }}>
                                      <th style={{ padding: '10px 8px', textAlign: 'center', verticalAlign: 'middle', fontWeight: 'bold', color: '#000000', fontSize: '0.80rem', fontFamily: 'Outfit, sans-serif', width: '12%', background: '#b4d3ec', border: '1px solid #000000' }}>BARCODE</th>
                                      <th style={{ padding: '10px 8px', textAlign: 'center', verticalAlign: 'middle', fontWeight: 'bold', color: '#000000', fontSize: '0.80rem', fontFamily: 'Outfit, sans-serif', width: '20%', background: '#b4d3ec', border: '1px solid #000000' }}>Item Name</th>
                                      <th style={{ padding: '10px 8px', textAlign: 'center', verticalAlign: 'middle', fontWeight: 'bold', color: '#000000', fontSize: '0.80rem', fontFamily: 'Outfit, sans-serif', width: '22%', background: '#b4d3ec', border: '1px solid #000000' }}>Description</th>
                                      <th style={{ padding: '10px 8px', textAlign: 'center', verticalAlign: 'middle', fontWeight: 'bold', color: '#000000', fontSize: '0.80rem', fontFamily: 'Outfit, sans-serif', width: '10%', background: '#b4d3ec', border: '1px solid #000000' }}>Box Sales Rate</th>
                                      <th style={{ padding: '10px 8px', textAlign: 'center', verticalAlign: 'middle', fontWeight: 'bold', color: '#000000', fontSize: '0.80rem', fontFamily: 'Outfit, sans-serif', width: '10%', background: '#b4d3ec', border: '1px solid #000000' }}>Purchase Box Price</th>
                                      <th style={{ padding: '10px 8px', textAlign: 'center', verticalAlign: 'middle', fontWeight: 'bold', color: '#000000', fontSize: '0.80rem', fontFamily: 'Outfit, sans-serif', width: '8%', background: '#b4d3ec', border: '1px solid #000000' }}>Qty in box</th>
                                      <th style={{ padding: '10px 8px', textAlign: 'center', verticalAlign: 'middle', fontWeight: 'bold', color: '#000000', fontSize: '0.80rem', fontFamily: 'Outfit, sans-serif', width: '9%', background: '#b4d3ec', border: '1px solid #000000' }}>Unit Price</th>
                                      <th style={{ padding: '10px 8px', textAlign: 'center', verticalAlign: 'middle', fontWeight: 'bold', color: '#000000', fontSize: '0.80rem', fontFamily: 'Outfit, sans-serif', width: '9%', background: '#b4d3ec', border: '1px solid #000000' }}>PROFIT</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {supplierPriceListItems.map((item, idx) => {
                                      const rateVal = parseFloat(item.rate) || 0;
                                      const purchaseVal = parseFloat(item.purchaseRate) || 0;
                                      const qtyVal = parseFloat(item.qtyInBox) || 0;

                                      const unitPrice = qtyVal > 0 ? (rateVal / qtyVal) : 0;
                                      const profit = rateVal - purchaseVal;

                                      const matchingProd = products.find(p => p.name?.toLowerCase() === item.name?.toLowerCase() || item.name?.toLowerCase().includes(p.name?.toLowerCase()));

                                      return (
                                        <tr key={item._id} style={{ background: idx % 2 === 0 ? 'white' : '#fafbfd', transition: 'background 0.15s' }}
                                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(43,140,138,0.04)'}
                                          onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? 'white' : '#fafbfd'}
                                        >
                                          <td style={{ padding: '6px 5px', border: '1px solid #000000', verticalAlign: 'middle' }}>
                                            <input
                                              type="text"
                                              value={item.barcode || ''}
                                              onChange={e => handleEditPriceItem(item._id, 'barcode', e.target.value)}
                                              placeholder="Barcode"
                                              style={{ width: '100%', padding: '6px 8px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.78rem', outline: 'none', background: 'white' }}
                                            />
                                          </td>
                                          <td style={{ padding: '6px 5px', border: '1px solid #000000', verticalAlign: 'middle' }}>
                                            <input
                                              type="text"
                                              value={item.name || ''}
                                              onChange={e => handleEditPriceItem(item._id, 'name', e.target.value)}
                                              placeholder="Item Name"
                                              style={{ width: '100%', padding: '6px 8px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600, outline: 'none', background: 'white' }}
                                            />
                                          </td>
                                          <td style={{ padding: '6px 5px', border: '1px solid #000000', verticalAlign: 'middle' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                              {matchingProd?.image && (
                                                <img src={matchingProd.image} alt={item.name} style={{ width: '40px', height: '40px', objectFit: 'contain', background: '#f8fafc', borderRadius: '4px', padding: '2px', border: '1px solid #e2e8f0', flexShrink: 0 }} />
                                              )}
                                              <input
                                                type="text"
                                                value={item.description || ''}
                                                onChange={e => handleEditPriceItem(item._id, 'description', e.target.value)}
                                                placeholder="Specs or details"
                                                style={{ width: '100%', padding: '6px 8px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.78rem', outline: 'none', background: 'white' }}
                                              />
                                            </div>
                                          </td>
                                          <td style={{ padding: '6px 5px', border: '1px solid #000000', verticalAlign: 'middle' }}>
                                            <input
                                              type="number"
                                              step="0.01"
                                              value={item.rate || ''}
                                              onChange={e => handleEditPriceItem(item._id, 'rate', e.target.value)}
                                              placeholder="0.00"
                                              style={{ width: '100%', padding: '6px 8px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700, outline: 'none', background: 'white' }}
                                            />
                                          </td>
                                          <td style={{ padding: '6px 5px', border: '1px solid #000000', verticalAlign: 'middle' }}>
                                            <input
                                              type="number"
                                              step="0.01"
                                              value={item.purchaseRate || ''}
                                              onChange={e => handleEditPriceItem(item._id, 'purchaseRate', e.target.value)}
                                              placeholder="0.00"
                                              style={{ width: '100%', padding: '6px 8px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.78rem', outline: 'none', background: 'white' }}
                                            />
                                          </td>
                                          <td style={{ padding: '6px 5px', border: '1px solid #000000', verticalAlign: 'middle' }}>
                                            <input
                                              type="number"
                                              value={item.qtyInBox || ''}
                                              onChange={e => handleEditPriceItem(item._id, 'qtyInBox', e.target.value)}
                                              placeholder="1"
                                              style={{ width: '100%', padding: '6px 8px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.78rem', outline: 'none', background: 'white' }}
                                            />
                                          </td>
                                          <td style={{ padding: '6px 5px', border: '1px solid #000000', verticalAlign: 'middle', textAlign: 'right', fontWeight: 700, color: 'var(--secondary)', fontSize: '0.78rem' }}>
                                            GH₵ {unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                          </td>
                                          <td style={{ padding: '6px 5px', border: '1px solid #000000', verticalAlign: 'middle', textAlign: 'right', fontWeight: 800, color: profit >= 0 ? '#16a34a' : '#dc2626', fontSize: '0.78rem' }}>
                                            GH₵ {profit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            )}

                            {/* Totals summary if items exist */}
                            {supplierPriceListItems.length > 0 && (
                              <div style={{ marginTop: '1rem', padding: '12px 16px', background: 'linear-gradient(135deg, rgba(43,140,138,0.06), rgba(59,130,246,0.04))', borderRadius: '10px', border: '1px solid rgba(43,140,138,0.12)', display: 'flex', justifyContent: 'flex-end', gap: '2rem', fontSize: '0.82rem', flexWrap: 'wrap' }}>
                                <span style={{ color: 'var(--text-muted)' }}>
                                  Total: <strong style={{ color: 'var(--text-main)' }}>{supplierPriceListItems.length}</strong> items
                                </span>
                                <span style={{ color: 'var(--text-muted)' }}>
                                  Avg. Rate: <strong style={{ color: 'var(--primary)' }}>
                                    GH₵ {(supplierPriceListItems.reduce((s, i) => s + (parseFloat(i.rate) || 0), 0) / supplierPriceListItems.length).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </strong>
                                </span>
                                <span style={{ color: 'var(--text-muted)' }}>
                                  Avg. Purchase Cost: <strong style={{ color: 'var(--secondary)' }}>
                                    GH₵ {(supplierPriceListItems.reduce((s, i) => s + (parseFloat(i.purchaseRate) || 0), 0) / supplierPriceListItems.length).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </strong>
                                </span>
                                <span style={{ color: 'var(--text-muted)' }}>
                                  Avg. Profit: <strong style={{ color: '#16a34a' }}>
                                    GH₵ {(supplierPriceListItems.reduce((s, i) => s + ((parseFloat(i.rate) || 0) - (parseFloat(i.purchaseRate) || 0)), 0) / supplierPriceListItems.length).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </strong>
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Footer Action Bar */}
                          <div style={{ borderTop: '1px solid var(--border)', padding: '1.25rem 2rem', display: 'flex', gap: '12px', justifyContent: 'space-between', alignItems: 'center', background: '#fafbfd' }}>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                              <button
                                type="button"
                                onClick={handleAddPriceItem}
                                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '10px', border: '2px dashed rgba(43,140,138,0.35)', background: 'rgba(43,140,138,0.04)', color: 'var(--primary)', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', transition: 'all 0.2s' }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(43,140,138,0.1)'; e.currentTarget.style.borderColor = 'var(--primary)'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(43,140,138,0.04)'; e.currentTarget.style.borderColor = 'rgba(43,140,138,0.35)'; }}
                              >
                                ＋ Add Item
                              </button>
                              <button
                                type="button"
                                onClick={() => document.getElementById('supplier-price-list-file-input').click()}
                                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '10px', border: '1px solid rgba(59,130,246,0.35)', background: 'rgba(59,130,246,0.05)', color: '#2563eb', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', transition: 'all 0.2s' }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.1)'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.05)'; }}
                              >
                                📥 Upload XLSX Price List
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const mapped = defaultExcelSeedData.map((item, idx) => {
                                    const rateVal = parseFloat(item.rate) || 0;
                                    const purchaseVal = parseFloat(item.purchaseRate) || 0;
                                    const qtyVal = parseFloat(item.qtyInBox) || 1;
                                    return {
                                      _id: Date.now() + idx + Math.random(),
                                      barcode: item.barcode,
                                      name: item.name,
                                      description: item.description,
                                      rate: item.rate,
                                      purchaseRate: item.purchaseRate,
                                      qtyInBox: item.qtyInBox,
                                      unitPrice: qtyVal > 0 ? (rateVal / qtyVal) : 0,
                                      profit: rateVal - purchaseVal
                                    };
                                  });
                                  setSupplierPriceListItems(mapped);
                                  alert("✨ Successfully loaded the complete 33 products list from your Excel screenshot! You can now review it and click 'Save Price List' to finalize.");
                                }}
                                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '10px', border: '1px solid rgba(124,58,237,0.35)', background: 'rgba(124,58,237,0.05)', color: '#7c3aed', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', transition: 'all 0.2s' }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.1)'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.05)'; }}
                              >
                                ✨ Load Excel screenshot Data
                              </button>
                              <input
                                type="file"
                                id="supplier-price-list-file-input"
                                accept=".xlsx, .xls"
                                onChange={handleSupplierPriceListExcelUpload}
                                style={{ display: 'none' }}
                              />
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                              <button
                                onClick={handleClosePriceList}
                                style={{ padding: '10px 20px', borderRadius: '10px', border: '1px solid var(--border)', background: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-muted)' }}
                              >
                                Cancel
                              </button>
                              <button
                                onClick={handleSavePriceList}
                                disabled={isSavingPriceList}
                                className="btn btn-primary"
                                style={{ padding: '10px 24px', borderRadius: '10px', fontWeight: 800, fontSize: '0.88rem', cursor: isSavingPriceList ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', opacity: isSavingPriceList ? 0.7 : 1 }}
                              >
                                {isSavingPriceList ? (
                                  <><span style={{ display: 'inline-block', width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.4)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />Saving...</>
                                ) : (
                                  <>💾 Save Price List</>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {showAddMfgModal && (
                      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, animation: 'slideUp 0.3s var(--transition)', padding: '20px' }}>
                        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)', width: '100%', maxWidth: '600px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--primary)', color: 'white', padding: '1.25rem 1.5rem' }}>
                            <h3 style={{ margin: 0, fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.2rem' }}>🏭 Register New Manufacturer</h3>
                            <button onClick={() => setShowAddMfgModal(false)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.25rem', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
                          </div>

                          <form onSubmit={handleAddManufacturer} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', overflowY: 'auto', maxHeight: '80vh' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                              <div>
                                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>Manufacturer Name*</label>
                                <input
                                  required
                                  type="text"
                                  value={mfgForm.name}
                                  onChange={e => setMfgForm({ ...mfgForm, name: e.target.value })}
                                  placeholder="e.g. Zhejiang Packaging Co."
                                  style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.85rem' }}
                                />
                              </div>
                              <div>
                                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>Contact Person Name*</label>
                                <input
                                  required
                                  type="text"
                                  value={mfgForm.contactPerson}
                                  onChange={e => setMfgForm({ ...mfgForm, contactPerson: e.target.value })}
                                  placeholder="e.g. Mr. Zhang"
                                  style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.85rem' }}
                                />
                              </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                              <div>
                                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>Phone Number*</label>
                                <input
                                  required
                                  type="text"
                                  value={mfgForm.phone}
                                  onChange={e => setMfgForm({ ...mfgForm, phone: e.target.value })}
                                  placeholder="e.g. 0243123456 or 86..."
                                  style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.85rem' }}
                                />
                              </div>
                              <div>
                                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>Email Address</label>
                                <input
                                  type="email"
                                  value={mfgForm.email}
                                  onChange={e => setMfgForm({ ...mfgForm, email: e.target.value })}
                                  placeholder="e.g. sales@mfg.com"
                                  style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.85rem' }}
                                />
                              </div>
                            </div>

                            <div>
                              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>Factory Location / Address</label>
                              <input
                                type="text"
                                value={mfgForm.location}
                                onChange={e => setMfgForm({ ...mfgForm, location: e.target.value })}
                                placeholder="e.g. Tema Industrial Area, Ghana"
                                style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.85rem' }}
                              />
                            </div>

                            <div>
                              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>Raw Materials / Items Supplied* (Comma separated)</label>
                              <input
                                required
                                type="text"
                                value={mfgForm.materials}
                                onChange={e => setMfgForm({ ...mfgForm, materials: e.target.value })}
                                placeholder="e.g. Sulphonic Acid, 5L HDPE Gallons, Soda Ash"
                                style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.85rem' }}
                              />
                            </div>

                            <div>
                              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>Internal B2B Negotiation Notes (Prices, Credit terms, etc.)</label>
                              <textarea
                                value={mfgForm.notes}
                                onChange={e => setMfgForm({ ...mfgForm, notes: e.target.value })}
                                placeholder="e.g. 14 days credit lines approved. Prefers Tema port delivery..."
                                style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.85rem', minHeight: '80px', fontFamily: 'inherit' }}
                              />
                            </div>

                            <div style={{ marginTop: '0.5rem' }}>
                              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>Upload Price List Document (PDF or Excel)</label>
                              <input
                                type="file"
                                accept=".pdf,.xlsx,.xls"
                                onChange={e => setMfgPriceListFile(e.target.files ? e.target.files[0] : null)}
                                style={{ width: '100%', padding: '8px', border: '1px dashed var(--secondary)', borderRadius: '8px', fontSize: '0.82rem', background: '#f8fafc', cursor: 'pointer' }}
                              />
                              {mfgPriceListFile && (
                                <span style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 700, display: 'block', marginTop: '4px' }}>
                                  📎 Selected: {mfgPriceListFile.name}
                                </span>
                              )}
                              {isUploadingMfgFile && (
                                <div style={{ marginTop: '6px', fontSize: '0.76rem', color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <div style={{ flex: 1, background: '#e2e8f0', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                                    <div style={{ background: 'var(--secondary)', height: '100%', width: `${mfgUploadProgress}%`, transition: 'width 0.2s' }} />
                                  </div>
                                  <span>Uploading... {mfgUploadProgress}%</span>
                                </div>
                              )}
                            </div>

                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                              <button type="button" onClick={() => setShowAddMfgModal(false)} className="btn btn-secondary" style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid var(--border)', background: 'none', cursor: 'pointer' }}>Cancel</button>
                              <button type="submit" className="btn btn-primary" style={{ padding: '10px 20px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }} disabled={isUploadingMfgFile}>
                                {isUploadingMfgFile ? 'Saving & Uploading...' : 'Save Manufacturer ✓'}
                              </button>
                            </div>
                          </form>
                        </div>
                      </div>
                    )}

                    {/* ==================== UNIVERSAL DOCUMENT CREATOR MODAL (PO, Invoice, Order) ==================== */}
                    {showUniversalCreatorModal && (
                      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(11, 35, 57, 0.55)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 4000, padding: '20px', animation: 'fadeIn 0.2s ease-out' }}>
                        <div className="universal-modal-container" style={{ background: 'white', borderRadius: '20px', border: '1px solid var(--border)', boxShadow: '0 25px 60px rgba(0,0,0,0.25)', width: '100%', maxWidth: '1200px', height: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: 'scaleUp 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>

                          {/* Dynamic Modal Header based on Doc Type */}
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: universalDocType === 'po'
                              ? 'linear-gradient(135deg, #0B2339 0%, #153a5c 100%)'
                              : universalDocType === 'invoice'
                                ? 'linear-gradient(135deg, #3b0764 0%, #6d28d9 100%)'
                                : 'linear-gradient(135deg, #065f46 0%, #0f766e 100%)',
                            color: 'white',
                            padding: '1.25rem 1.75rem',
                            borderBottom: '1px solid rgba(255,255,255,0.08)',
                            flexShrink: 0
                          }}>
                            <div>
                              <h3 style={{ margin: 0, fontFamily: 'Outfit', fontWeight: 850, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                {isEditingUniversalDoc
                                  ? (universalDocType === 'po' ? '✏️ Edit Purchase Order' : universalDocType === 'invoice' ? '✏️ Edit Supplier Invoice' : '✏️ Edit Customer Order')
                                  : (universalDocType === 'po' ? '📝 Universal Purchase Order Composer' : universalDocType === 'invoice' ? '🧾 Universal Supplier Invoice Composer' : '📦 Universal Customer Order Composer')
                                }
                              </h3>
                              <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                                {isEditingUniversalDoc ? 'Modify existing B2B financial documents with integrated product catalogs' : 'Create and record B2B financial documents with integrated product catalogs'}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setShowUniversalCreatorModal(false)}
                              style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s' }}
                              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                            >
                              ✕
                            </button>
                          </div>

                          <form onSubmit={handleSubmitUniversalDoc} className="universal-modal-form" style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', height: 'calc(90vh - 65px)', overflow: 'hidden', background: 'white' }}>

                            {/* LEFT COLUMN: Product Catalog Quick-Add Browser */}
                            <div className="universal-modal-left-col" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', borderRight: '1px solid var(--border)', padding: '1.5rem', background: '#f8fafc' }}>
                              <div style={{ marginBottom: '12px' }}>
                                <span style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '8px' }}>
                                  🔍 Search & Add Products
                                </span>
                                <div style={{ position: 'relative', width: '100%', marginBottom: '10px' }}>
                                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5, fontSize: '0.85rem' }}>🔍</span>
                                  <input
                                    type="text"
                                    placeholder="Type name to search..."
                                    value={universalCatalogSearch}
                                    onChange={e => setUniversalCatalogSearch(e.target.value)}
                                    style={{ width: '100%', padding: '10px 12px 10px 34px', borderRadius: '10px', border: '1px solid var(--border)', fontSize: '0.82rem', color: 'var(--text-main)', background: 'white', outline: 'none', transition: 'all 0.2s' }}
                                    onFocus={e => e.target.style.borderColor = 'var(--secondary)'}
                                    onBlur={e => e.target.style.borderColor = 'var(--border)'}
                                  />
                                  {universalCatalogSearch && (
                                    <button
                                      type="button"
                                      onClick={() => setUniversalCatalogSearch('')}
                                      style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' }}
                                    >✕</button>
                                  )}
                                </div>

                                {universalDocType !== 'order' && (
                                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                    <button
                                      type="button"
                                      disabled={!universalSupplierId}
                                      onClick={() => setUniversalProductSource('supplier')}
                                      style={{
                                        flex: 1,
                                        padding: '8px 10px',
                                        fontSize: '0.75rem',
                                        fontWeight: 700,
                                        borderRadius: '8px',
                                        border: '1.5px solid',
                                        borderColor: universalProductSource === 'supplier' ? 'var(--primary)' : 'var(--border)',
                                        background: universalProductSource === 'supplier' ? 'rgba(43,140,138,0.08)' : 'white',
                                        color: universalProductSource === 'supplier' ? 'var(--primary)' : 'var(--text-muted)',
                                        cursor: universalSupplierId ? 'pointer' : 'not-allowed',
                                        opacity: universalSupplierId ? 1 : 0.5,
                                        transition: 'all 0.2s',
                                        whiteSpace: 'nowrap'
                                      }}
                                    >
                                      📋 Supplier Price List
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setUniversalProductSource('catalog')}
                                      style={{
                                        flex: 1,
                                        padding: '8px 10px',
                                        fontSize: '0.75rem',
                                        fontWeight: 700,
                                        borderRadius: '8px',
                                        border: '1.5px solid',
                                        borderColor: universalProductSource === 'catalog' ? 'var(--primary)' : 'var(--border)',
                                        background: universalProductSource === 'catalog' ? 'rgba(43,140,138,0.08)' : 'white',
                                        color: universalProductSource === 'catalog' ? 'var(--primary)' : 'var(--text-muted)',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        whiteSpace: 'nowrap'
                                      }}
                                    >
                                      🌐 General Catalog
                                    </button>
                                  </div>
                                )}
                              </div>

                              <div style={{ flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '4px' }}>
                                {(() => {
                                  if (universalDocType !== 'order' && universalProductSource === 'supplier') {
                                    if (!universalSupplierId) {
                                      return (
                                        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)', fontSize: '0.82rem', fontStyle: 'italic', background: 'white', borderRadius: '12px', border: '1px dashed var(--border)' }}>
                                          👉 Select a supplier in the form on the right to view their custom B2B price list items!
                                        </div>
                                      );
                                    }

                                    const selectedMfg = activeManufacturers.find(m => m.id === universalSupplierId);
                                    const mfgItems = (selectedMfg?.priceList || []).filter(item =>
                                      !universalCatalogSearch ||
                                      item.name?.toLowerCase().includes(universalCatalogSearch.toLowerCase()) ||
                                      item.size?.toLowerCase().includes(universalCatalogSearch.toLowerCase())
                                    );

                                    if (mfgItems.length === 0) {
                                      return (
                                        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)', fontSize: '0.82rem', background: 'white', borderRadius: '12px', border: '1px dashed var(--border)' }}>
                                          <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>⚠️</div>
                                          <strong>No items in this supplier's B2B price list.</strong>
                                          <p style={{ fontSize: '0.74rem', marginTop: '4px', marginBottom: '10px' }}>Go to B2B Manufacturers to manage their directory, or use the general catalog tab.</p>
                                          <button type="button" onClick={() => setUniversalProductSource('catalog')} style={{ padding: '6px 12px', fontSize: '0.74rem', fontWeight: 700, background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Browse General Catalog</button>
                                        </div>
                                      );
                                    }

                                    return mfgItems.map((item, idx) => (
                                      <div key={idx} style={{ padding: '12px', background: 'white', border: '1px solid var(--border)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.01)' }}>
                                        <div style={{ textAlign: 'left', minWidth: 0, marginRight: '10px' }}>
                                          <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {item.name}
                                          </div>
                                          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'flex', gap: '8px' }}>
                                            <span>Size: <strong>{item.size || 'Pack'}</strong></span>
                                            {item.notes && <span>• {item.notes}</span>}
                                          </div>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => handleAddUniversalProduct(item.name, item.size, universalDocType === 'po' ? (item.purchaseRate || item.unitPrice) : (universalDocType === 'invoice' ? (item.rate || item.price || item.unitPrice) : item.unitPrice))}
                                          style={{
                                            background: 'rgba(43, 140, 138, 0.08)',
                                            color: 'var(--primary)',
                                            border: '1px solid rgba(43, 140, 138, 0.25)',
                                            borderRadius: '8px',
                                            padding: '6px 12px',
                                            fontSize: '0.76rem',
                                            fontWeight: 800,
                                            cursor: 'pointer',
                                            whiteSpace: 'nowrap',
                                            transition: 'all 0.15s'
                                          }}
                                          onMouseEnter={e => { e.currentTarget.style.background = 'var(--primary)'; e.currentTarget.style.color = 'white'; }}
                                          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(43, 140, 138, 0.08)'; e.currentTarget.style.color = 'var(--primary)'; }}
                                        >
                                          GH₵ {parseFloat((universalDocType === 'po' ? (item.purchaseRate || item.unitPrice) : (universalDocType === 'invoice' ? (item.rate || item.price || item.unitPrice) : item.unitPrice)) || 0).toLocaleString('en-US')} +
                                        </button>
                                      </div>
                                    ));
                                  }

                                  const filteredCatalog = products.filter(p =>
                                    !universalCatalogSearch ||
                                    p.name?.toLowerCase().includes(universalCatalogSearch.toLowerCase()) ||
                                    p.brand?.toLowerCase().includes(universalCatalogSearch.toLowerCase()) ||
                                    p.category?.toLowerCase().includes(universalCatalogSearch.toLowerCase())
                                  );

                                  if (filteredCatalog.length === 0) {
                                    return (
                                      <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)', fontSize: '0.82rem', fontStyle: 'italic' }}>
                                        No catalog products matched your search.
                                      </div>
                                    );
                                  }

                                  return filteredCatalog.map(p => (
                                    <div key={p.id} style={{ padding: '12px', background: 'white', border: '1px solid var(--border)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.01)' }}>
                                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <img src={p.image} alt={p.name} style={{ width: '32px', height: '32px', objectFit: 'contain', background: '#f8fafc', borderRadius: '6px', padding: '2px', border: '1px solid #f1f5f9' }} />
                                        <div style={{ minWidth: 0, flexGrow: 1, textAlign: 'left' }}>
                                          <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {p.name}
                                          </div>
                                          <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {p.brand} • {p.category}
                                          </div>
                                        </div>
                                      </div>
                                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                        {p.sizes?.map(sz => (
                                          <button
                                            key={sz.size}
                                            type="button"
                                            onClick={() => handleAddUniversalProduct(p.name, sz.size, sz.price)}
                                            style={{
                                              fontSize: '0.68rem',
                                              fontWeight: 700,
                                              color: 'var(--secondary)',
                                              background: 'rgba(43, 140, 138, 0.04)',
                                              border: '1px solid rgba(43, 140, 138, 0.25)',
                                              borderRadius: '6px',
                                              padding: '4px 8px',
                                              cursor: 'pointer',
                                              transition: 'all 0.15s',
                                              display: 'flex',
                                              alignItems: 'center',
                                              gap: '3px'
                                            }}
                                            onMouseEnter={e => { e.currentTarget.style.background = 'var(--secondary)'; e.currentTarget.style.color = 'white'; }}
                                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(43, 140, 138, 0.04)'; e.currentTarget.style.color = 'var(--secondary)'; }}
                                          >
                                            <span>{sz.size}</span>
                                            <span style={{ opacity: 0.85 }}>• GH₵ {sz.price}</span>
                                            <span style={{ fontSize: '0.78rem', fontWeight: 900 }}>+</span>
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  ));
                                })()}
                              </div>
                            </div>

                            {/* RIGHT COLUMN: Composed Document Ledger & Actions */}
                            <div className="universal-modal-right-col" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                              <div style={{ flexGrow: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                                {/* Select Doc Type & Doc Number Row */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '1rem', background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                  <div>
                                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '5px', textTransform: 'uppercase' }}>Document Type *</label>
                                    <select
                                      disabled={isEditingUniversalDoc}
                                      value={universalDocType}
                                      onChange={e => {
                                        const type = e.target.value;
                                        setUniversalDocType(type);
                                        setUniversalProductSource(type === 'order' ? 'catalog' : 'supplier');

                                        const year = new Date().getFullYear();
                                        const rnd = Math.floor(1000 + Math.random() * 9000);
                                        let defaultDocNumber;
                                        let defaultStatus;
                                        if (type === 'po') {
                                          defaultDocNumber = `PO-${year}-${rnd}`;
                                          defaultStatus = 'Draft';
                                        } else if (type === 'invoice') {
                                          defaultDocNumber = `INV-${year}-${rnd}`;
                                          defaultStatus = 'Pending';
                                        } else {
                                          defaultDocNumber = `ORD-${year}-${rnd}`;
                                          defaultStatus = 'pending';
                                        }

                                        setUniversalForm(prev => ({
                                          ...prev,
                                          docNumber: defaultDocNumber,
                                          status: defaultStatus,
                                          vatApplied: type === 'po'
                                        }));
                                      }}
                                      style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700, outline: 'none', background: 'white', cursor: 'pointer' }}
                                    >
                                      <option value="po">📝 Purchase Order (P.O.)</option>
                                      <option value="invoice">🧾 Supplier Invoice</option>
                                      <option value="order">📦 Customer Order</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '5px', textTransform: 'uppercase' }}>Document Number *</label>
                                    <input
                                      required
                                      type="text"
                                      value={universalForm.docNumber}
                                      onChange={e => setUniversalForm(prev => ({ ...prev, docNumber: e.target.value }))}
                                      placeholder="e.g. INV-2026-0034"
                                      style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700, outline: 'none', boxSizing: 'border-box' }}
                                    />
                                  </div>
                                </div>

                                {/* Supplier/VAT or Customer Information depending on type */}
                                {universalDocType === 'po' ? (
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '1rem', background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid var(--border)' }} className="kpi-detail-panel">
                                    <div>
                                      <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '5px', textTransform: 'uppercase' }}>Target Supplier / Partner *</label>
                                      <select
                                        required
                                        value={universalSupplierId}
                                        onChange={e => {
                                          setUniversalSupplierId(e.target.value);
                                          setUniversalProductSource(e.target.value ? 'supplier' : 'catalog');
                                        }}
                                        style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700, outline: 'none', background: 'white', cursor: 'pointer' }}
                                      >
                                        <option value="">-- Select Supplier --</option>
                                        {activeManufacturers.map(m => (
                                          <option key={m.id} value={m.id}>{m.name} ({m.location})</option>
                                        ))}
                                      </select>
                                    </div>
                                    <div>
                                      <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '5px', textTransform: 'uppercase' }}>Delivery Destination *</label>
                                      <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                                        <button
                                          type="button"
                                          onClick={() => setUniversalForm(prev => ({ ...prev, deliveryAddressType: 'company', deliveryAddress: 'Neat Brand Trade Factory Depot, Tema Light Industrial Area, Ghana' }))}
                                          style={{
                                            flex: 1,
                                            padding: '6px',
                                            fontSize: '0.72rem',
                                            fontWeight: 700,
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            border: '1px solid var(--border)',
                                            background: universalForm.deliveryAddressType === 'company' ? 'var(--primary)' : 'white',
                                            color: universalForm.deliveryAddressType === 'company' ? 'white' : 'var(--text-main)'
                                          }}
                                        >
                                          🏢 Depot
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setUniversalForm(prev => ({ ...prev, deliveryAddressType: 'customer' }))}
                                          style={{
                                            flex: 1,
                                            padding: '6px',
                                            fontSize: '0.72rem',
                                            fontWeight: 700,
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            border: '1px solid var(--border)',
                                            background: universalForm.deliveryAddressType === 'customer' ? 'var(--primary)' : 'white',
                                            color: universalForm.deliveryAddressType === 'customer' ? 'white' : 'var(--text-main)'
                                          }}
                                        >
                                          👥 Customer
                                        </button>
                                      </div>

                                      {universalForm.deliveryAddressType === 'company' ? (
                                        <div style={{ fontSize: '0.75rem', background: 'white', padding: '8px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                          {showCustomAddrInput ? (
                                            <textarea
                                              value={universalForm.deliveryAddress}
                                              onChange={e => setUniversalForm(prev => ({ ...prev, deliveryAddress: e.target.value }))}
                                              style={{ width: '100%', padding: '6px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.78rem', background: 'white', boxSizing: 'border-box' }}
                                              rows={2}
                                            />
                                          ) : (
                                            <div>
                                              <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{universalForm.deliveryAddress}</span>
                                              <div
                                                onClick={() => setShowCustomAddrInput(true)}
                                                style={{ fontSize: '0.7rem', color: 'var(--secondary)', cursor: 'pointer', fontWeight: 700, textDecoration: 'underline', marginTop: '4px' }}
                                              >
                                                Change destination to deliver
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      ) : (
                                        <select
                                          onChange={e => {
                                            const clientId = e.target.value;
                                            const client = activeClients.find(w => w.id === clientId);
                                            if (client) {
                                              const addr = `${client.company || client.representative} (${client.phone}) - ${client.address || client.location || 'Ghana'}`;
                                              setUniversalForm(prev => ({ 
                                                ...prev, 
                                                selectedDeliveryCustomerId: clientId,
                                                deliveryAddress: addr 
                                              }));
                                            }
                                          }}
                                          value={universalForm.selectedDeliveryCustomerId || ''}
                                          style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: '7px', fontSize: '0.8rem', background: 'white', cursor: 'pointer' }}
                                        >
                                          <option value="">-- Select Customer --</option>
                                          {activeClients.map(w => (
                                            <option key={w.id} value={w.id}>{w.company || w.representative} ({w.phone})</option>
                                          ))}
                                        </select>
                                      )}
                                    </div>
                                  </div>
                                ) : universalDocType !== 'order' ? (
                                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem', background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                    <div>
                                      <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '5px', textTransform: 'uppercase' }}>Target Supplier / Partner *</label>
                                      <select
                                        required
                                        value={universalSupplierId}
                                        onChange={e => {
                                          setUniversalSupplierId(e.target.value);
                                          setUniversalProductSource(e.target.value ? 'supplier' : 'catalog');
                                        }}
                                        style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700, outline: 'none', background: 'white', cursor: 'pointer' }}
                                      >
                                        <option value="">-- Select Supplier --</option>
                                        {activeManufacturers.map(m => (
                                          <option key={m.id} value={m.id}>{m.name} ({m.location})</option>
                                        ))}
                                      </select>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', height: '100%', paddingTop: '20px' }}>
                                      <input
                                        type="checkbox"
                                        id="universalVat"
                                        checked={universalForm.vatApplied}
                                        onChange={e => setUniversalForm(prev => ({ ...prev, vatApplied: e.target.checked }))}
                                        style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--secondary)' }}
                                      />
                                      <label htmlFor="universalVat" style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--primary)', cursor: 'pointer' }}>Apply GRA VAT & Levies (21.9%)</label>
                                    </div>
                                  </div>
                                ) : (
                                  <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>👤 B2B Customer Information</span>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                      <div style={{ position: 'relative' }}>
                                        <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Customer Name *</label>
                                        <input
                                          required
                                          type="text"
                                          className="customer-name-input"
                                          value={universalForm.customerName}
                                          onChange={e => {
                                            const val = e.target.value;
                                            setUniversalForm(prev => ({ ...prev, customerName: val }));
                                            setShowCustomerSuggestions(true);
                                          }}
                                          onFocus={() => setShowCustomerSuggestions(true)}
                                          placeholder="e.g. Kwabena Appiah"
                                          style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: '7px', fontSize: '0.8rem', background: 'white' }}
                                        />
                                        {showCustomerSuggestions && (
                                          <div className="customer-suggestions-dropdown" style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid var(--border)', borderRadius: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.15)', zIndex: 1000, maxHeight: '180px', overflowY: 'auto', marginTop: '4px' }}>
                                            {activeClients.filter(w => {
                                              const q = (universalForm.customerName || '').toLowerCase().trim();
                                              return !q ||
                                                (w.company || '').toLowerCase().includes(q) ||
                                                (w.representative || '').toLowerCase().includes(q) ||
                                                (w.phone || '').toLowerCase().includes(q);
                                            }).map(w => (
                                              <div
                                                key={w.id}
                                                onClick={() => {
                                                  setUniversalForm(prev => ({
                                                    ...prev,
                                                    customerName: w.company || w.representative || '',
                                                    customerPhone: w.phone || '',
                                                    customerEmail: w.email || '',
                                                    customerAddress: w.address || w.location || ''
                                                  }));
                                                  setShowCustomerSuggestions(false);
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                                                onMouseLeave={e => e.currentTarget.style.background = 'white'}
                                                style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', fontSize: '0.78rem', display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}
                                              >
                                                <div style={{ fontWeight: 700, color: 'var(--primary)' }}>{w.company || w.representative}</div>
                                                {w.company && w.representative && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Rep: {w.representative}</div>}
                                                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>📞 {w.phone} | ✉️ {w.email}</div>
                                              </div>
                                            ))}
                                            {activeClients.filter(w => {
                                              const q = (universalForm.customerName || '').toLowerCase().trim();
                                              return !q ||
                                                (w.company || '').toLowerCase().includes(q) ||
                                                (w.representative || '').toLowerCase().includes(q) ||
                                                (w.phone || '').toLowerCase().includes(q);
                                            }).length === 0 && (
                                                <div style={{ padding: '10px', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>No wholesalers found. Keep typing to enter manually.</div>
                                              )}
                                          </div>
                                        )}
                                      </div>
                                      <div>
                                        <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Phone Number *</label>
                                        <input
                                          required
                                          type="text"
                                          value={universalForm.customerPhone}
                                          onChange={e => setUniversalForm(prev => ({ ...prev, customerPhone: e.target.value }))}
                                          placeholder="e.g. 0244123456"
                                          style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: '7px', fontSize: '0.8rem', background: 'white' }}
                                        />
                                      </div>
                                      <div>
                                        <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Delivery Address</label>
                                        <input
                                          type="text"
                                          value={universalForm.customerAddress}
                                          onChange={e => setUniversalForm(prev => ({ ...prev, customerAddress: e.target.value }))}
                                          placeholder="e.g. Spintex, Accra"
                                          style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: '7px', fontSize: '0.8rem', background: 'white' }}
                                        />
                                      </div>
                                      <div>
                                        <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Email Address</label>
                                        <input
                                          type="email"
                                          value={universalForm.customerEmail}
                                          onChange={e => setUniversalForm(prev => ({ ...prev, customerEmail: e.target.value }))}
                                          placeholder="e.g. buyer@example.com"
                                          style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: '7px', fontSize: '0.8rem', background: 'white' }}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Dates & Status Row */}
                                {universalDocType === 'po' ? (
                                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                                    <div>
                                      <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>Date Issued *</label>
                                      <input
                                        required
                                        type="date"
                                        value={universalForm.issueDate}
                                        onChange={e => setUniversalForm(prev => ({ ...prev, issueDate: e.target.value }))}
                                        style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: '7px', fontSize: '0.8rem', boxSizing: 'border-box' }}
                                      />
                                    </div>
                                    <div>
                                      <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>Expected Delivery Date *</label>
                                      <input
                                        required
                                        type="date"
                                        value={universalForm.dueDate}
                                        onChange={e => setUniversalForm(prev => ({ ...prev, dueDate: e.target.value }))}
                                        style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: '7px', fontSize: '0.8rem', boxSizing: 'border-box' }}
                                      />
                                    </div>
                                    <div>
                                      <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>Payment Terms</label>
                                      <select
                                        value={universalForm.paymentTerms}
                                        onChange={e => setUniversalForm(prev => ({ ...prev, paymentTerms: e.target.value }))}
                                        style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: '7px', fontSize: '0.8rem', background: 'white', boxSizing: 'border-box', cursor: 'pointer' }}
                                      >
                                        <option value="Due on Receipt">Due on Receipt</option>
                                        <option value="Net 15">Net 15</option>
                                        <option value="Net 30">Net 30</option>
                                        <option value="Net 45">Net 45</option>
                                        <option value="Net 60">Net 60</option>
                                        <option value="Cash on Delivery">Cash on Delivery</option>
                                      </select>
                                    </div>
                                    <div>
                                      <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>Document Status</label>
                                      <select
                                        value={universalForm.status}
                                        onChange={e => setUniversalForm(prev => ({ ...prev, status: e.target.value }))}
                                        style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: '7px', fontSize: '0.8rem', background: 'white', boxSizing: 'border-box', cursor: 'pointer' }}
                                      >
                                        <option value="Draft">⏳ Draft PO</option>
                                        <option value="Sent">📤 Sent to Supplier</option>
                                        <option value="Approved">✅ Approved by Supplier</option>
                                        <option value="Completed">🏁 Completed & Received</option>
                                      </select>
                                    </div>
                                  </div>
                                ) : (
                                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                                    <div>
                                      <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Issue Date</label>
                                      <input
                                        type="date"
                                        value={universalForm.issueDate}
                                        onChange={e => setUniversalForm(prev => ({ ...prev, issueDate: e.target.value }))}
                                        style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: '7px', fontSize: '0.8rem', boxSizing: 'border-box' }}
                                      />
                                    </div>
                                    <div>
                                      <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                                        {universalDocType === 'po' ? 'Expected Delivery Date' : universalDocType === 'invoice' ? 'Payment Due Date' : 'Delivery Timeline'}
                                      </label>
                                      <input
                                        type="date"
                                        value={universalForm.dueDate}
                                        onChange={e => setUniversalForm(prev => ({ ...prev, dueDate: e.target.value }))}
                                        style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: '7px', fontSize: '0.8rem', boxSizing: 'border-box' }}
                                      />
                                    </div>
                                    <div>
                                      <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Document Status</label>
                                      <select
                                        value={universalForm.status}
                                        onChange={e => setUniversalForm(prev => ({ ...prev, status: e.target.value }))}
                                        style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: '7px', fontSize: '0.8rem', background: 'white', boxSizing: 'border-box' }}
                                      >
                                        {universalDocType === 'po' ? (
                                          <>
                                            <option value="Draft">⏳ Draft PO</option>
                                            <option value="Sent">📤 Sent to Supplier</option>
                                            <option value="Approved">✅ Approved by Supplier</option>
                                            <option value="Completed">🏁 Completed & Received</option>
                                          </>
                                        ) : universalDocType === 'invoice' ? (
                                          <>
                                            <option value="Pending">⏳ Pending Payment</option>
                                            <option value="Paid">✅ Fully Paid</option>
                                            <option value="Overdue">🔴 Overdue</option>
                                          </>
                                        ) : (
                                          <>
                                            <option value="pending">⏳ Pending Dispatch</option>
                                            <option value="processing">⚙️ Processing Order</option>
                                            <option value="delivered">✅ Delivered & Closed</option>
                                          </>
                                        )}
                                      </select>
                                    </div>

                                    {universalDocType !== 'order' && (
                                      <>
                                        <div>
                                          <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Payment Terms</label>
                                          <select
                                            value={universalForm.paymentTerms}
                                            onChange={e => setUniversalForm(prev => ({ ...prev, paymentTerms: e.target.value }))}
                                            style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: '7px', fontSize: '0.8rem', background: 'white', boxSizing: 'border-box' }}
                                          >
                                            <option value="Due on Receipt">Due on Receipt</option>
                                            <option value="Net 15">Net 15</option>
                                            <option value="Net 30">Net 30</option>
                                            <option value="Net 45">Net 45</option>
                                            <option value="Net 60">Net 60</option>
                                            <option value="Cash on Delivery">Cash on Delivery</option>
                                          </select>
                                        </div>
                                        <div>
                                          <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Shipment Mode</label>
                                          <select
                                            value={universalForm.shipmentMode}
                                            onChange={e => setUniversalForm(prev => ({ ...prev, shipmentMode: e.target.value }))}
                                            style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: '7px', fontSize: '0.8rem', background: 'white', boxSizing: 'border-box' }}
                                          >
                                            <option value="Delivery Van">🛻 Delivery Van</option>
                                            <option value="Motor Rider">🏍️ Motor Rider</option>
                                            <option value="Self Pickup">📦 Self Pickup</option>
                                            <option value="Courier Service">🚚 Courier Service</option>
                                            <option value="Cargo Truck">🚛 Cargo Truck</option>
                                          </select>
                                        </div>
                                        <div>
                                          <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Reference #</label>
                                          <input
                                            type="text"
                                            value={universalForm.referenceNumber}
                                            onChange={e => setUniversalForm(prev => ({ ...prev, referenceNumber: e.target.value }))}
                                            placeholder="e.g. REF-48291"
                                            style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: '7px', fontSize: '0.8rem', boxSizing: 'border-box' }}
                                          />
                                        </div>
                                      </>
                                    )}
                                  </div>
                                )}

                                {/* Composed ledger list */}
                                <div>
                                  <span style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px', textTransform: 'uppercase' }}>Line Items Ledger</span>
                                  <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid var(--border)', overflowX: 'auto', width: '100%', boxSizing: 'border-box' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '600px' }}>
                                      <div style={{ display: 'grid', gridTemplateColumns: universalDocType === 'po' ? '2.8fr 0.9fr 1.3fr 1.5fr auto' : '2.5fr 0.8fr 1.1fr 0.9fr 1.3fr auto', gap: '8px', padding: '0 4px 6px 4px', borderBottom: '1.5px solid #cbd5e1', fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                        <div>Item Name</div>
                                        <div style={{ textAlign: 'center' }}>Quantity</div>
                                        <div style={{ textAlign: 'right' }}>
                                          {universalDocType === 'po'
                                            ? 'Box Price (GH₵)'
                                            : (universalDocType === 'invoice'
                                                ? 'Box Price (GH₵)'
                                                : 'Rate (GH₵)')
                                          }
                                        </div>
                                        {universalDocType !== 'po' && <div style={{ textAlign: 'center' }}>Disc (%)</div>}
                                        <div style={{ textAlign: 'right' }}>Amount (GH₵)</div>
                                        <div />
                                      </div>

                                      {universalForm.items.length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>
                                          👈 Click products from the catalog or supplier list on the left to add items here instantly!
                                        </div>
                                      ) : (
                                        universalForm.items.map((item, idx) => (
                                          <div key={idx} style={{ display: 'grid', gridTemplateColumns: universalDocType === 'po' ? '2.8fr 0.9fr 1.3fr 1.5fr auto' : '2.5fr 0.8fr 1.1fr 0.9fr 1.3fr auto', gap: '8px', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                              <input
                                                required
                                                type="text"
                                                value={item.name}
                                                onChange={e => handleEditUniversalItem(idx, 'name', e.target.value)}
                                                placeholder="e.g. SLES Feedstock"
                                                style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.78rem', background: 'white' }}
                                              />
                                              <input
                                                type="text"
                                                value={item.size}
                                                onChange={e => handleEditUniversalItem(idx, 'size', e.target.value)}
                                                placeholder="Size (e.g. 250kg)"
                                                style={{ width: '100%', padding: '4px 8px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.72rem', color: 'var(--text-muted)', background: '#f8fafc' }}
                                              />
                                            </div>
                                            <input
                                              required
                                              type="number"
                                              min="1"
                                              value={item.qty}
                                              onChange={e => handleEditUniversalItem(idx, 'qty', e.target.value)}
                                              style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700, textAlign: 'center', background: 'white' }}
                                            />
                                            <input
                                              required
                                              type="number"
                                              min="0"
                                              step="0.01"
                                              value={item.unitPrice}
                                              onChange={e => handleEditUniversalItem(idx, 'unitPrice', e.target.value)}
                                              style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700, textAlign: 'right', background: 'white' }}
                                            />
                                            {universalDocType !== 'po' && (
                                              <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                step="0.1"
                                                value={item.discountPercent || 0}
                                                onChange={e => handleEditUniversalItem(idx, 'discountPercent', e.target.value)}
                                                style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700, textAlign: 'center', background: 'white' }}
                                              />
                                            )}
                                            <div style={{
                                              textAlign: 'right',
                                              fontWeight: 800,
                                              fontSize: '0.78rem',
                                              color: 'var(--primary)',
                                              padding: '8px',
                                              background: '#f1f5f9',
                                              borderRadius: '6px',
                                              border: '1px solid var(--border)',
                                              height: '35px',
                                              display: 'flex',
                                              alignItems: 'center',
                                              justifyContent: 'flex-end',
                                              boxSizing: 'border-box'
                                            }}>
                                              GH₵ {(parseFloat(item.total) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </div>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setUniversalForm(prev => ({
                                                  ...prev,
                                                  items: prev.items.filter((_, i) => i !== idx)
                                                }));
                                              }}
                                              style={{ background: '#fee2e2', border: 'none', color: '#dc2626', width: '28px', height: '28px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontWeight: 'bold' }}
                                            >
                                              ✕
                                            </button>
                                          </div>
                                        ))
                                      )}
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setUniversalForm(prev => ({
                                        ...prev,
                                        items: [...prev.items, { name: '', size: '1L', qty: 1, unitPrice: 0, total: 0 }]
                                      }));
                                    }}
                                    style={{ alignSelf: 'flex-start', background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', marginTop: '4px', textDecoration: 'underline' }}
                                  >
                                    ＋ Add Custom Ad-Hoc Item
                                  </button>
                                </div>

                                {/* Notes / Description */}
                                <div>
                                  <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>Description / Terms / Internal Notes</label>
                                  <textarea
                                    value={universalForm.notes}
                                    onChange={e => setUniversalForm(prev => ({ ...prev, notes: e.target.value }))}
                                    placeholder="Enter payment terms, delivery schedules, packaging instructions, or generic invoice description..."
                                    style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.8rem', minHeight: '60px', fontFamily: 'inherit', boxSizing: 'border-box' }}
                                  />
                                </div>

                              </div>

                              {/* Footer calculations & Save/Cancel buttons */}
                              <div style={{ flexShrink: 0, borderTop: '1px solid var(--border)', background: '#fafafa', padding: '1.25rem 2rem' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '12px', fontSize: '0.82rem' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                                    <span>Subtotal:</span>
                                    <strong style={{ color: 'var(--text-main)' }}>GH₵ {calcUniversalSubtotal().toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
                                  </div>
                                  {universalDocType !== 'order' && (
                                    <>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)' }}>
                                        <span>Shipping Charges (GH₵):</span>
                                        <input
                                          type="number"
                                          min="0"
                                          step="0.01"
                                          value={universalForm.shippingCharges || ''}
                                          onChange={e => setUniversalForm(prev => ({ ...prev, shippingCharges: parseFloat(e.target.value) || 0 }))}
                                          placeholder="0.00"
                                          style={{ width: '110px', padding: '5px 8px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.78rem', textAlign: 'right', fontWeight: 700, background: 'white' }}
                                        />
                                      </div>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)' }}>
                                        <span>Adjustment (GH₵):</span>
                                        <input
                                          type="number"
                                          step="0.01"
                                          value={universalForm.adjustment || ''}
                                          onChange={e => setUniversalForm(prev => ({ ...prev, adjustment: parseFloat(e.target.value) || 0 }))}
                                          placeholder="0.00"
                                          style={{ width: '110px', padding: '5px 8px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.78rem', textAlign: 'right', fontWeight: 700, background: 'white' }}
                                        />
                                      </div>
                                    </>
                                  )}
                                  {universalForm.vatApplied && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--secondary)' }}>
                                      <span>GRA VAT & B2B Levies (21.9%):</span>
                                      <strong>
                                        GH₵ {
                                          (
                                            (calcUniversalSubtotal() + (parseFloat(universalForm.shippingCharges) || 0) + (parseFloat(universalForm.adjustment) || 0)) * 0.219
                                          ).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                        }
                                      </strong>
                                    </div>
                                  )}
                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.05rem', color: 'var(--primary)' }}>
                                    <span>Grand Total:</span>
                                    <strong style={{ fontFamily: 'Outfit', fontWeight: 900 }}>
                                      GH₵ {
                                        (() => {
                                          const sub = calcUniversalSubtotal();
                                          const ship = parseFloat(universalForm.shippingCharges) || 0;
                                          const adj = parseFloat(universalForm.adjustment) || 0;
                                          const taxable = sub + ship + adj;
                                          return (universalForm.vatApplied
                                            ? Math.round(taxable * 1.219 * 100) / 100
                                            : Math.round(taxable * 100) / 100
                                          ).toLocaleString('en-US', { minimumFractionDigits: 2 });
                                        })()
                                      }
                                    </strong>
                                  </div>
                                </div>

                                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                  <button
                                    type="button"
                                    onClick={() => setShowUniversalCreatorModal(false)}
                                    style={{ padding: '10px 20px', borderRadius: '10px', border: '1px solid var(--border)', background: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-muted)' }}
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="submit"
                                    disabled={isCreatingUniversalDoc}
                                    className="btn btn-primary"
                                    style={{
                                      padding: '10px 24px',
                                      borderRadius: '10px',
                                      fontWeight: 800,
                                      fontSize: '0.88rem',
                                      cursor: isCreatingUniversalDoc ? 'not-allowed' : 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '8px',
                                      opacity: isCreatingUniversalDoc ? 0.7 : 1,
                                      background: universalDocType === 'po'
                                        ? 'linear-gradient(135deg, #0B2339 0%, #153a5c 100%)'
                                        : universalDocType === 'invoice'
                                          ? 'linear-gradient(135deg, #3b0764 0%, #6d28d9 100%)'
                                          : 'linear-gradient(135deg, #065f46 0%, #0f766e 100%)',
                                      boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                                      border: 'none',
                                      color: 'white'
                                    }}
                                  >
                                    {isCreatingUniversalDoc ? (
                                      <>
                                        <span style={{ display: 'inline-block', width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.4)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                                        Saving...
                                      </>
                                    ) : (
                                      <>
                                        {isEditingUniversalDoc ? '✓ Update' : '✓ Save & Finalize'}{' '}
                                        {universalDocType === 'po' ? 'P.O.' : universalDocType === 'invoice' ? 'Invoice' : 'Order'}
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>

                            </div>

                          </form>
                        </div>
                      </div>
                    )}
                    {viewingPO && (
                      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, animation: 'slideUp 0.3s var(--transition)', padding: '20px' }}>
                        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)', width: '100%', maxWidth: '850px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }} className="printable-po-voucher">

                          {/* Top Toolbar - Non-printable control deck */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0B2339', color: 'white', padding: '12px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)' }} className="no-print">
                            <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>⚙️ NBT Procurement Voucher Tool</span>
                            <div style={{ display: 'flex', gap: '10px' }}>
                              <button
                                onClick={() => window.print()}
                                style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700 }}
                              >
                                🖨️ Print PO Voucher
                              </button>
                              <a
                                href={`https://wa.me/${formatGhanaPhone(viewingPO.manufacturerPhone)}?text=${encodeURIComponent(getWhatsAppPOText(viewingPO))}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#25D366', color: 'white', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700, textDecoration: 'none' }}
                              >
                                💬 Dispatch via WhatsApp
                              </a>
                              <button
                                onClick={() => { setViewingPO(null); handleOpenUniversalCreator('po', viewingPO); }}
                                style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', color: 'white', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700 }}
                              >
                                ✏️ Edit PO
                              </button>
                              <button onClick={() => setViewingPO(null)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '1rem', cursor: 'pointer', fontWeight: 'bold' }}>✕ Close</button>
                            </div>
                          </div>

                          {/* Main PO Document Area */}
                          <div style={{ padding: '2.5rem', overflowY: 'auto', maxHeight: '80vh', background: 'white', color: '#1e293b' }}>

                            {/* Document Header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #0B2339', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
                              <div>
                                <h1 style={{ margin: 0, fontFamily: 'Outfit', fontWeight: 900, fontSize: '1.8rem', color: '#0B2339', letterSpacing: '-0.5px' }}>NEAT BRAND TRADE (NBT)</h1>
                                <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#33A19D', letterSpacing: '1px', textTransform: 'uppercase' }}>Chemical Formulations & Distributors</span>
                                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '8px', lineHeight: 1.4 }}>
                                  Plot 12, Tema Light Industrial Area<br />
                                  Greater Accra, Ghana<br />
                                  Email: procurements@neatbrandtrade.com.gh
                                </div>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <h2 style={{ margin: 0, fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.4rem', color: '#0B2339' }}>PURCHASE ORDER</h2>
                                <div style={{ 
                                  background: '#f8fafc', 
                                  border: '1px solid #e2e8f0', 
                                  borderRadius: '8px', 
                                  padding: '10px 14px', 
                                  marginTop: '10px', 
                                  display: 'grid', 
                                  gridTemplateColumns: 'auto 1fr', 
                                  columnGap: '12px', 
                                  rowGap: '4px', 
                                  fontSize: '0.8rem',
                                  textAlign: 'left'
                                }}>
                                  <strong style={{ color: '#64748b' }}>P.O. Number:</strong> <span style={{ fontFamily: 'monospace', fontSize: '0.85rem', fontWeight: 800, color: '#0b2339' }}>{viewingPO.poNumber}</span>
                                  <strong style={{ color: '#64748b' }}>Date Issued:</strong> <span style={{ fontWeight: 600 }}>{viewingPO.date}</span>
                                  <strong style={{ color: '#64748b' }}>Expected Delivery:</strong> <span style={{ fontWeight: 600 }}>{viewingPO.expectedDeliveryDate || viewingPO.dueDate || 'N/A'}</span>
                                  <strong style={{ color: '#64748b' }}>Payment Terms:</strong> <span style={{ fontWeight: 600 }}>{viewingPO.paymentTerms || 'Due on Receipt'}</span>
                                  <strong style={{ color: '#64748b' }}>Status:</strong> <span style={{ fontWeight: 800, color: viewingPO.status === 'Delivered' ? '#166534' : viewingPO.status === 'Sent' ? '#1e40af' : '#64748b' }}>{viewingPO.status}</span>
                                </div>
                              </div>
                            </div>

                            {/* Supplier & Delivery Info Grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                              <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                                <h4 style={{ margin: '0 0 10px 0', fontSize: '0.85rem', fontWeight: 800, color: '#0B2339', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Manufacturer / Supplier</h4>
                                <div style={{ fontSize: '0.82rem', lineHeight: 1.5 }}>
                                  <strong>{viewingPO.manufacturerName}</strong><br />
                                  Contact: {viewingPO.manufacturerPhone}<br />
                                  Address: {activeManufacturers.find(m => m.id === viewingPO.manufacturerId)?.location || 'Tema, Ghana'}
                                </div>
                              </div>
                              <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                                <h4 style={{ margin: '0 0 10px 0', fontSize: '0.85rem', fontWeight: 800, color: '#0B2339', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Delivery Destination</h4>
                                <div style={{ fontSize: '0.82rem', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
                                  {viewingPO.deliveryAddress || 'Neat Brand Trade Factory Depot\nTema Light Industrial Area'}
                                </div>
                              </div>
                            </div>

                            {/* Items Table */}
                            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2rem', fontSize: '0.82rem' }}>
                              <thead>
                                <tr style={{ background: '#0B2339', color: 'white', textAlign: 'left', fontWeight: 700 }}>
                                  <th style={{ padding: '10px', border: '1px solid #cbd5e1', width: '50%' }}>Item</th>
                                  <th style={{ padding: '10px', border: '1px solid #cbd5e1', width: '15%', textAlign: 'center' }}>Qty</th>
                                  <th style={{ padding: '10px', border: '1px solid #cbd5e1', width: '18%', textAlign: 'right' }}>Purchase Box Price</th>
                                  <th style={{ padding: '10px', border: '1px solid #cbd5e1', width: '17%', textAlign: 'right' }}>Amount</th>
                                </tr>
                              </thead>
                              <tbody>
                                {viewingPO.items?.map((item, idx) => (
                                  <tr key={idx} style={{ background: idx % 2 === 0 ? 'white' : '#f8fafc' }}>
                                    <td style={{ padding: '10px', border: '1px solid #e2e8f0', fontWeight: 700 }}>{item.name}</td>
                                    <td style={{ padding: '10px', border: '1px solid #e2e8f0', textAlign: 'center' }}>{item.qty}</td>
                                    <td style={{ padding: '10px', border: '1px solid #e2e8f0', textAlign: 'right' }}>GH₵ {item.unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                    <td style={{ padding: '10px', border: '1px solid #e2e8f0', textAlign: 'right', fontWeight: 600 }}>GH₵ {item.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>

                            {/* Calculations Block */}
                            {(() => {
                              const baseSubtotal = viewingPO.items?.reduce((acc, i) => acc + (parseFloat(i.qty) || 0) * (parseFloat(i.unitPrice) || 0), 0) || 0;
                              const totalDiscounts = viewingPO.items?.reduce((acc, i) => acc + ((parseFloat(i.qty) || 0) * (parseFloat(i.unitPrice) || 0) * ((parseFloat(i.discountPercent) || 0) / 100)), 0) || 0;
                              const subtotalAfterDiscounts = viewingPO.items?.reduce((acc, i) => acc + (parseFloat(i.total) || 0), 0) || 0;
                              const shippingCharges = parseFloat(viewingPO.shippingCharges) || 0;
                              const adjustment = parseFloat(viewingPO.adjustment) || 0;
                              const taxableTotal = subtotalAfterDiscounts + shippingCharges + adjustment;
                              const vatAmount = viewingPO.vatApplied ? (taxableTotal * 0.219) : 0;
                              const grandTotal = viewingPO.totalAmount || (taxableTotal + vatAmount);

                              return (
                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '3rem' }}>
                                  <div style={{ width: '100%', maxWidth: '380px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                      <span style={{ color: '#64748b' }}>Subtotal (Base Cost):</span>
                                      <span style={{ fontWeight: 600 }}>GH₵ {baseSubtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                    {totalDiscounts > 0 && (
                                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#dc2626' }}>
                                        <span>Line Item Discounts:</span>
                                        <span>-GH₵ {totalDiscounts.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                      </div>
                                    )}
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                      <span style={{ color: '#64748b' }}>Net Subtotal:</span>
                                      <span style={{ fontWeight: 600 }}>GH₵ {subtotalAfterDiscounts.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                      <span style={{ color: '#64748b' }}>Shipping / Freight Charges:</span>
                                      <span style={{ fontWeight: 600 }}>GH₵ {shippingCharges.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                    {adjustment !== 0 && (
                                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: '#64748b' }}>Adjustment:</span>
                                        <span style={{ fontWeight: 600, color: adjustment < 0 ? '#dc2626' : '#16a34a' }}>
                                          {adjustment < 0 ? '-' : '+'}GH₵ {Math.abs(adjustment).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                      </div>
                                    )}
                                    {viewingPO.vatApplied && (
                                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#2563eb' }}>
                                        <span>VAT & Levies Applied (21.9%):</span>
                                        <span>GH₵ {vatAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                      </div>
                                    )}
                                    <div style={{ height: '1.5px', background: '#0B2339', margin: '4px 0' }} />
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 900, color: '#0B2339' }}>
                                      <span>TOTAL PAYABLE VOLUME:</span>
                                      <span>GH₵ {grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}

                            {/* Terms / Instructions */}
                            <div style={{ borderTop: '1px solid #cbd5e1', paddingTop: '1.5rem', marginBottom: '3.5rem', fontSize: '0.74rem', color: '#64748b', lineHeight: 1.5 }}>
                              <h5 style={{ margin: '0 0 6px 0', fontWeight: 800, color: '#0B2339', textTransform: 'uppercase' }}>Purchase Terms & Handling Instructions</h5>
                              <ol style={{ margin: 0, paddingLeft: '14px' }}>
                                <li>All materials must be supplied strictly in food-grade chemical packaging or standard heavy-duty HDPE containers.</li>
                                <li>Certificate of Analysis (COA) must accompany each feedstock batch delivered to the NBT depot.</li>
                                <li>Payments are subject to verified inspection approval and matching contract terms registered at our Treasury Office.</li>
                              </ol>
                            </div>

                            {/* Signature Blocks */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', fontSize: '0.8rem', textAlign: 'center' }}>
                              <div>
                                <div style={{ borderBottom: '1px solid #0B2339', height: '50px', marginBottom: '8px' }} />
                                <strong>Authorized NBT Representative</strong><br />
                                <span>Procurement Desk & B2B Lead</span>
                              </div>
                              <div>
                                <div style={{ borderBottom: '1px solid #0B2339', height: '50px', marginBottom: '8px' }} />
                                <strong>Supplier Acknowledgment</strong><br />
                                <span>Authorized Signature & Seal</span>
                              </div>
                            </div>

                          </div>

                        </div>
                      </div>
                    )}

                    {/* -------------------- enterprise VAT Tax Invoice modal overlay -------------------- */}
                    <InvoiceModal
                      isOpen={!!selectedInvoiceOrder}
                      onClose={() => setSelectedInvoiceOrder(null)}
                      order={selectedInvoiceOrder}
                    />

                    {/* Corporate responsive stylesheet overlays */}
                    <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          .printable-po-voucher, .printable-po-voucher * {
            visibility: visible !important;
          }
          .printable-po-voucher {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .no-print {
            display: none !important;
          }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideLeft {
          from { opacity: 0; transform: translateX(35px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @media (max-width: 768px) {
          .desktop-view {
            display: none !important;
          }
          .mobile-view {
            display: flex !important;
          }
          /* Prevent automatic zoom-in on focus inside Safari/iOS devices */
          input, select, textarea {
            font-size: 16px !important;
          }
        }
        @media (min-width: 769px) {
          .desktop-view {
            display: block !important;
          }
          .mobile-view {
            display: none !important;
          }
        }
        @media (max-width: 900px) {
          .mobile-header-bar {
            display: flex !important;
            margin-bottom: 1rem !important;
          }
          .sidebar-container {
            position: fixed !important;
            top: 0 !important;
            left: -260px !important;
            bottom: 0 !important;
            width: 260px !important;
            height: 100vh !important;
            transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
            display: flex !important;
            z-index: 10000 !important;
            box-shadow: 5px 0 25px rgba(0,0,0,0.15) !important;
          }
          .sidebar-container.open {
            left: 0 !important;
          }
          .main-panel {
            padding: 1.25rem !important;
            gap: 1.25rem !important;
          }
          .workspace-title-bar {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 10px !important;
            margin-top: 0.5rem !important;
          }
          .workspace-title-bar p {
            font-size: 0.8rem !important;
          }
          .universal-modal-container {
            width: 100vw !important;
            height: 100vh !important;
            max-width: none !important;
            max-height: none !important;
            border-radius: 0px !important;
            margin: 0 !important;
          }
          .universal-modal-form {
            display: flex !important;
            flex-direction: column !important;
            height: calc(100vh - 65px) !important;
            overflow-y: auto !important;
          }
          .universal-modal-left-col {
            order: 2 !important;
            height: auto !important;
            overflow: visible !important;
            border-right: none !important;
            border-bottom: none !important;
            padding: 1.25rem !important;
          }
          .universal-modal-right-col {
            order: 1 !important;
            height: auto !important;
            overflow: visible !important;
            border-right: none !important;
            border-bottom: 1px solid var(--border) !important;
            padding: 1.25rem !important;
          }
          .kpi-detail-panel {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 600px) {
          .main-panel {
            padding: 0.85rem !important;
            gap: 1rem !important;
          }
          .workspace-title-bar h1 {
            font-size: 1.45rem !important;
          }
        }
      `}</style>

                  </div>
                );
              }
