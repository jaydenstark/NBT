import { supabase } from '../lib/supabase';

// ==========================================
// HELPERS FOR MAPPING
// ==========================================
function mapUserDbToJs(user) {
  if (!user) return null;
  return {
    uid: user.id,
    id: user.id,
    email: user.email,
    fullName: user.full_name,
    phone: user.phone,
    businessName: user.business_name,
    businessType: user.business_type,
    location: user.location,
    role: user.role,
    commissionTier: user.commission_tier,
    discountRate: user.discount_rate,
    creditLimit: user.credit_limit,
    creditUsed: user.credit_used,
    isActive: user.is_active,
    createdAt: user.created_at
  };
}

function mapOrderDbToJs(order) {
  if (!order) return null;
  return {
    id: order.id,
    orderId: order.id,
    buyerId: order.buyer_id,
    buyerName: order.buyer_name,
    items: order.items,
    subtotal: order.subtotal,
    discount: order.discount,
    commission: order.commission,
    totalAmount: order.total_amount,
    status: order.status,
    paymentStatus: order.payment_status,
    paymentMethod: order.payment_method,
    deliveryAddress: order.delivery_address,
    city: order.city,
    assignedSuppliers: order.assigned_suppliers,
    createdAt: order.created_at,
    updatedAt: order.updated_at
  };
}

function mapPODbToJs(po) {
  if (!po) return null;
  return {
    id: po.po_id,
    poId: po.po_id,
    orderId: po.order_id,
    supplierId: po.supplier_id,
    items: po.items,
    status: po.status,
    createdAt: po.created_at
  };
}

// ==========================================
// USERS SERVICE
// ==========================================
export const userService = {
  async createUserProfile(uid, data) {
    const mapped = {
      id: uid,
      email: data.email,
      full_name: data.fullName || null,
      phone: data.phone || null,
      business_name: data.businessName || null,
      business_type: data.businessType || null,
      location: data.location || null,
      role: data.role || 'buyer',
      commission_tier: data.commissionTier || 'bronze',
      discount_rate: data.discountRate || 0,
      credit_limit: data.creditLimit || 1000,
      credit_used: data.creditUsed || 0,
      is_active: true
    };

    const { error } = await supabase
      .from('users')
      .upsert([mapped]);

    if (error) throw error;
    return uid;
  },

  async getUserProfile(uid) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', uid)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No profile found
      throw error;
    }
    return mapUserDbToJs(data);
  },

  async updateUserProfile(uid, data) {
    const mapped = {};
    if (data.fullName !== undefined) mapped.full_name = data.fullName;
    if (data.email !== undefined) mapped.email = data.email;
    if (data.phone !== undefined) mapped.phone = data.phone;
    if (data.businessName !== undefined) mapped.business_name = data.businessName;
    if (data.businessType !== undefined) mapped.business_type = data.businessType;
    if (data.location !== undefined) mapped.location = data.location;
    if (data.role !== undefined) mapped.role = data.role;
    if (data.commissionTier !== undefined) mapped.commission_tier = data.commissionTier;
    if (data.discountRate !== undefined) mapped.discount_rate = data.discountRate;
    if (data.creditLimit !== undefined) mapped.credit_limit = data.creditLimit;
    if (data.creditUsed !== undefined) mapped.credit_used = data.creditUsed;
    if (data.isActive !== undefined) mapped.is_active = data.isActive;

    const { error } = await supabase
      .from('users')
      .update(mapped)
      .eq('id', uid);

    if (error) throw error;
  }
};

// ==========================================
// SUPPLIERS SERVICE
// ==========================================
export const supplierService = {
  async getSupplier(supplierId) {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', supplierId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  },

  async listSuppliers() {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('status', 'active');

    if (error) throw error;
    return data || [];
  }
};

// ==========================================
// PRODUCTS SERVICE
// ==========================================
export const productService = {
  async getProduct(productId) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  },

  async listProducts() {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true);

    if (error) throw error;

    const products = data || [];

    // Sort: products with images first, without images last
    const isActualImage = (img) => {
      if (!img || typeof img !== 'string') return false;
      const trimmed = img.trim();
      if (trimmed === '') return false;
      if (img.trim() === '/PRODUCTS/Neat/all-neat-all-purpose-cleaner-floral-2l.png') return false;
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
    const { data, error } = await supabase
      .from('carts')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return { items: [], totalAmount: 0 };
      throw error;
    }

    return {
      id: data.user_id,
      items: data.items || [],
      totalAmount: data.total_amount || 0
    };
  },

  async updateCart(userId, items, totalAmount) {
    const { error } = await supabase
      .from('carts')
      .upsert([{
        user_id: userId,
        items,
        total_amount: totalAmount,
        updated_at: new Date().toISOString()
      }]);

    if (error) throw error;
  }
};

// ==========================================
// ORDERS & PURCHASE ORDERS SERVICE
// ==========================================
export const orderService = {
  async createOrderFromCart(userId, buyerName, cart, deliveryAddress, city, paymentMethod) {
    const itemsBySupplier = {};
    cart.items.forEach(item => {
      const supId = item.supplierId || 'DEFAULT_SUPPLIER';
      if (!itemsBySupplier[supId]) itemsBySupplier[supId] = [];
      itemsBySupplier[supId].push(item);
    });

    const assignedSuppliers = Object.keys(itemsBySupplier);

    // 1. Create the Master Order
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert([{
        buyer_id: userId,
        buyer_name: buyerName,
        items: cart.items,
        subtotal: cart.totalAmount,
        discount: 0,
        commission: 0,
        total_amount: cart.totalAmount,
        status: 'pending',
        payment_status: 'unpaid',
        payment_method: paymentMethod,
        delivery_address: deliveryAddress,
        city: city,
        assigned_suppliers: assignedSuppliers,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (orderError) throw orderError;
    const orderId = orderData.id;

    // 2. Generate Purchase Orders (POs) for each supplier
    for (const supplierId of assignedSuppliers) {
      const poItems = itemsBySupplier[supplierId];
      const { error: poError } = await supabase
        .from('purchase_orders')
        .insert([{
          order_id: orderId,
          supplier_id: supplierId,
          items: poItems.map(i => ({ productId: i.productId || i.id, name: i.name, quantity: i.quantity })),
          status: 'pending',
          created_at: new Date().toISOString()
        }]);

      if (poError) throw poError;
    }

    // 3. Clear the cart
    const { error: cartClearError } = await supabase
      .from('carts')
      .update({
        items: [],
        total_amount: 0,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (cartClearError) console.error("Error clearing cart: ", cartClearError);

    return orderId;
  },

  async getUserOrders(userId) {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('buyer_id', userId);

    if (error) throw error;
    return (data || []).map(mapOrderDbToJs);
  },

  async getSupplierPOs(supplierId) {
    const { data, error } = await supabase
      .from('purchase_orders')
      .select('*')
      .eq('supplier_id', supplierId);

    if (error) throw error;
    return (data || []).map(mapPODbToJs);
  }
};
