import { db } from '../lib/firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  addDoc, 
  query, 
  where, 
  serverTimestamp 
} from 'firebase/firestore';

// ==========================================
// USERS SERVICE
// ==========================================
export const userService = {
  async createUserProfile(uid, data) {
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, {
      ...data,
      createdAt: serverTimestamp(),
      isActive: true,
      role: data.role || 'buyer' // buyer | admin | supplier | staff
    }, { merge: true });
    return uid;
  },

  async getUserProfile(uid) {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) return { id: docSnap.id, ...docSnap.data() };
    return null;
  },

  async updateUserProfile(uid, data) {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, data);
  }
};

// ==========================================
// SUPPLIERS SERVICE
// ==========================================
export const supplierService = {
  async getSupplier(supplierId) {
    const docRef = doc(db, 'suppliers', supplierId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) return { id: docSnap.id, ...docSnap.data() };
    return null;
  },

  async listSuppliers() {
    const q = query(collection(db, 'suppliers'), where('status', '==', 'active'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
};

// ==========================================
// PRODUCTS SERVICE
// ==========================================
export const productService = {
  async getProduct(productId) {
    const docRef = doc(db, 'products', productId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) return { id: docSnap.id, ...docSnap.data() };
    return null;
  },

  async listProducts() {
    const q = query(collection(db, 'products'), where('isActive', '==', true));
    const snapshot = await getDocs(q);
    const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Sort: products with images first, without images last
    const isActualImage = (img) => {
      if (!img || typeof img !== 'string') return false;
      const trimmed = img.trim();
      if (trimmed === '') return false;
      if (trimmed === '/PRODUCTS%20/Neat/neat-all-purpose-floral-2l.png') return false;
      return true;
    };

    products.sort((a, b) => {
      const aHasImage = isActualImage(a.image);
      const bHasImage = isActualImage(b.image);
      if (aHasImage && !bHasImage) return -1;
      if (!aHasImage && bHasImage) return 1;
      return 0;
    });

    return products;
  }
};

// ==========================================
// CARTS SERVICE
// ==========================================
export const cartService = {
  async getCart(userId) {
    const docRef = doc(db, 'carts', userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) return { id: docSnap.id, ...docSnap.data() };
    return { items: [], totalAmount: 0 };
  },

  async updateCart(userId, items, totalAmount) {
    const cartRef = doc(db, 'carts', userId);
    await setDoc(cartRef, {
      userId,
      items,
      totalAmount,
      updatedAt: serverTimestamp()
    }, { merge: true });
  }
};

// ==========================================
// ORDERS & PURCHASE ORDERS SERVICE
// ==========================================
export const orderService = {
  // Creates a master order and splits it into POs for each supplier
  async createOrderFromCart(userId, buyerName, cart, deliveryAddress, city, paymentMethod) {
    // 1. Group items by supplierId
    const itemsBySupplier = {};
    cart.items.forEach(item => {
      const supId = item.supplierId || 'DEFAULT_SUPPLIER';
      if (!itemsBySupplier[supId]) itemsBySupplier[supId] = [];
      itemsBySupplier[supId].push(item);
    });

    const assignedSuppliers = Object.keys(itemsBySupplier);

    // 2. Create the Master Order
    const orderRef = await addDoc(collection(db, 'orders'), {
      buyerId: userId,
      buyerName,
      items: cart.items,
      subtotal: cart.totalAmount,
      discount: 0,
      commission: 0,
      totalAmount: cart.totalAmount,
      status: 'pending',
      paymentStatus: 'unpaid',
      paymentMethod,
      deliveryAddress,
      city,
      assignedSuppliers,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    const orderId = orderRef.id;
    // Store orderId field matching schema
    await updateDoc(orderRef, { orderId });

    // 3. Generate Purchase Orders (POs) for each supplier
    for (const supplierId of assignedSuppliers) {
      const poItems = itemsBySupplier[supplierId];
      const poRef = await addDoc(collection(db, 'purchaseOrders'), {
        orderId,
        supplierId,
        items: poItems.map(i => ({ productId: i.productId, name: i.name, quantity: i.quantity })),
        status: 'pending',
        createdAt: serverTimestamp()
      });
      await updateDoc(poRef, { poId: poRef.id });
    }

    // 4. Optionally clear the cart
    await updateDoc(doc(db, 'carts', userId), { items: [], totalAmount: 0, updatedAt: serverTimestamp() });

    return orderId;
  },

  async getUserOrders(userId) {
    const q = query(collection(db, 'orders'), where('buyerId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async getSupplierPOs(supplierId) {
    const q = query(collection(db, 'purchaseOrders'), where('supplierId', '==', supplierId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
};
