import { supabase } from './supabase';

// Mock DB, Storage and Auth reference objects
export const db = { type: 'firestore' };
export const storage = { type: 'storage' };
export const auth = supabase.auth;

// Helper to check if a string is a valid UUID
function isValidUUID(str) {
  if (typeof str !== 'string') return false;
  const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return regex.test(str);
}

// ==========================================
// FIRESTORE COMPATIBILITY LAYER
// ==========================================

export function collection(databaseRef, collectionName) {
  return { type: 'collection', name: collectionName };
}

export function doc(databaseRef, collectionName, docId) {
  return { type: 'doc', name: collectionName, id: docId };
}

export function serverTimestamp() {
  return new Date().toISOString();
}

export async function addDoc(collectionRef, data) {
  const tableName = collectionRef.name;
  
  // Format keys to snake_case if necessary
  const formattedData = formatKeysForDb(tableName, data);

  const { data: insertedRow, error } = await supabase
    .from(tableName)
    .insert([formattedData])
    .select()
    .single();

  if (error) {
    console.error(`Supabase error inserting into ${tableName}:`, error);
    throw error;
  }

  return { id: insertedRow.id };
}

export async function updateDoc(docRef, data) {
  const tableName = docRef.name;
  const docId = docRef.id;

  const formattedData = formatKeysForDb(tableName, data);

  // If table is users/orders and docId is not a valid UUID, don't query
  if ((tableName === 'users' || tableName === 'orders') && !isValidUUID(docId)) {
    console.warn(`Skipping update on ${tableName} for invalid UUID: ${docId}`);
    return;
  }

  const { error } = await supabase
    .from(tableName)
    .update(formattedData)
    .eq('id', docId);

  if (error) {
    console.error(`Supabase error updating ${tableName} with ID ${docId}:`, error);
    throw error;
  }
}

export async function deleteDoc(docRef) {
  const tableName = docRef.name;
  const docId = docRef.id;

  if ((tableName === 'users' || tableName === 'orders') && !isValidUUID(docId)) {
    console.warn(`Skipping delete on ${tableName} for invalid UUID: ${docId}`);
    return;
  }

  const { error } = await supabase
    .from(tableName)
    .delete()
    .eq('id', docId);

  if (error) {
    console.error(`Supabase error deleting from ${tableName} with ID ${docId}:`, error);
    throw error;
  }
}

export function onSnapshot(ref, callback, errorCallback) {
  const tableName = ref.name;

  let isSubscribed = true;

  const fetchAndTrigger = async () => {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*');

      if (error) throw error;

      if (!isSubscribed) return;

      const docs = (data || []).map(row => ({
        id: row.id,
        data: () => mapRowFromDb(tableName, row)
      }));

      callback({
        docs,
        empty: docs.length === 0,
        forEach: (fn) => docs.forEach(fn)
      });
    } catch (err) {
      console.error(`onSnapshot error for ${tableName}:`, err);
      if (errorCallback) errorCallback(err);
    }
  };

  fetchAndTrigger();

  // Subscribe to changes in Supabase
  const uniqueId = Math.random().toString(36).substring(2, 9);
  const channel = supabase
    .channel(`compat-listener-${tableName}-${uniqueId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: tableName },
      () => {
        fetchAndTrigger();
      }
    )
    .subscribe();

  return () => {
    isSubscribed = false;
    supabase.removeChannel(channel);
  };
}

// ==========================================
// STORAGE COMPATIBILITY LAYER
// ==========================================

export function ref(storageInstance, path) {
  return { type: 'storage_ref', path };
}

export async function uploadBytes(storageRef, file) {
  const path = storageRef.path;
  // Clean up path: e.g. "products/image.png"
  const cleanPath = path.replace(/^\/+/, '');

  // Upload to Supabase Storage bucket 'nbt-products'
  const { data, error } = await supabase.storage
    .from('nbt-products')
    .upload(cleanPath, file, {
      upsert: true
    });

  if (error) {
    console.error("Supabase Storage upload error:", error);
    throw error;
  }

  return data;
}

export async function getDownloadURL(storageRef) {
  const path = storageRef.path.replace(/^\/+/, '');

  const { data } = supabase.storage
    .from('nbt-products')
    .getPublicUrl(path);

  return data.publicUrl;
}

// ==========================================
// COMPATIBILITY HELPERS
// ==========================================

// Maps JS camelCase property names to snake_case column names for Supabase
function formatKeysForDb(tableName, data) {
  const result = { ...data };

  // Common conversions
  if (result.createdAt !== undefined) {
    result.created_at = result.createdAt;
    delete result.createdAt;
  }
  if (result.updatedAt !== undefined) {
    result.updated_at = result.updatedAt;
    delete result.updatedAt;
  }

  if (tableName === 'wholesale_clients') {
    if (result.discountCode !== undefined) {
      result.discount_code = result.discountCode;
      delete result.discountCode;
    }
    if (result.creditLimit !== undefined) {
      result.credit_limit = result.creditLimit;
      delete result.creditLimit;
    }
    if (result.creditUsed !== undefined) {
      result.credit_used = result.creditUsed;
      delete result.creditUsed;
    }
  }

  if (tableName === 'orders') {
    if (result.buyerId !== undefined) {
      result.buyer_id = result.buyerId;
      delete result.buyerId;
    }
    if (result.buyerName !== undefined) {
      result.buyer_name = result.buyerName;
      delete result.buyerName;
    }
    if (result.totalAmount !== undefined) {
      result.total_amount = result.totalAmount;
      delete result.totalAmount;
    }
    if (result.paymentStatus !== undefined) {
      result.payment_status = result.paymentStatus;
      delete result.paymentStatus;
    }
    if (result.paymentMethod !== undefined) {
      result.payment_method = result.paymentMethod;
      delete result.paymentMethod;
    }
    if (result.deliveryAddress !== undefined) {
      result.delivery_address = result.deliveryAddress;
      delete result.deliveryAddress;
    }
    if (result.assignedSuppliers !== undefined) {
      result.assigned_suppliers = result.assignedSuppliers;
      delete result.assignedSuppliers;
    }
  }

  if (tableName === 'bulk_inquiries') {
    if (result.businessName !== undefined) {
      result.business_name = result.businessName;
      delete result.businessName;
    }
    if (result.contactPerson !== undefined) {
      result.contact_person = result.contactPerson;
      delete result.contactPerson;
    }
  }

  if (tableName === 'manufacturer_pos') {
    if (result.poNumber !== undefined) {
      result.po_number = result.poNumber;
      delete result.poNumber;
    }
    if (result.manufacturerId !== undefined) {
      result.manufacturer_id = result.manufacturerId;
      delete result.manufacturerId;
    }
    if (result.manufacturerName !== undefined) {
      result.manufacturer_name = result.manufacturerName;
      delete result.manufacturerName;
    }
    if (result.manufacturerPhone !== undefined) {
      result.manufacturer_phone = result.manufacturerPhone;
      delete result.manufacturerPhone;
    }
    if (result.totalAmount !== undefined) {
      result.total_amount = result.totalAmount;
      delete result.totalAmount;
    }
    if (result.vatApplied !== undefined) {
      result.vat_applied = result.vatApplied;
      delete result.vatApplied;
    }
  }

  if (tableName === 'supplier_invoices') {
    if (result.invoiceNumber !== undefined) {
      result.invoice_number = result.invoiceNumber;
      delete result.invoiceNumber;
    }
    if (result.supplierId !== undefined) {
      result.supplier_id = result.supplierId;
      delete result.supplierId;
    }
    if (result.supplierName !== undefined) {
      result.supplier_name = result.supplierName;
      delete result.supplierName;
    }
    if (result.poId !== undefined) {
      result.po_id = result.poId;
      delete result.poId;
    }
    if (result.poNumber !== undefined) {
      result.po_number = result.poNumber;
      delete result.poNumber;
    }
    if (result.totalAmount !== undefined) {
      result.total_amount = result.totalAmount;
      delete result.totalAmount;
    }
    if (result.issueDate !== undefined) {
      result.issue_date = result.issueDate;
      delete result.issueDate;
    }
    if (result.dueDate !== undefined) {
      result.due_date = result.dueDate;
      delete result.dueDate;
    }
  }

  if (tableName === 'price_lists') {
    if (result.transactionType !== undefined) {
      result.transaction_type = result.transactionType;
      delete result.transactionType;
    }
    if (result.roundOffTo !== undefined) {
      result.round_off_to = result.roundOffTo;
      delete result.roundOffTo;
    }
  }

  if (tableName === 'organisations') {
    if (result.creditLimit !== undefined) {
      result.credit_limit = result.creditLimit;
      delete result.creditLimit;
    }
    if (result.creditUsed !== undefined) {
      result.credit_used = result.creditUsed;
      delete result.creditUsed;
    }
    if (result.availableCredit !== undefined) {
      result.available_credit = result.availableCredit;
      delete result.availableCredit;
    }
    if (result.paymentTerms !== undefined) {
      result.payment_terms = result.paymentTerms;
      delete result.paymentTerms;
    }
    if (result.deliveryLocations !== undefined) {
      result.delivery_locations = result.deliveryLocations;
      delete result.deliveryLocations;
    }
  }

  return result;
}

// Maps DB snake_case columns back to JS camelCase properties
function mapRowFromDb(tableName, row) {
  const result = { ...row };

  if (result.created_at !== undefined) {
    result.createdAt = result.created_at;
  }
  if (result.updated_at !== undefined) {
    result.updatedAt = result.updated_at;
  }

  if (tableName === 'wholesale_clients') {
    if (result.discount_code !== undefined) result.discountCode = result.discount_code;
    if (result.credit_limit !== undefined) result.creditLimit = result.credit_limit;
    if (result.credit_used !== undefined) result.creditUsed = result.credit_used;
  }

  if (tableName === 'orders') {
    if (result.buyer_id !== undefined) result.buyerId = result.buyer_id;
    if (result.buyer_name !== undefined) result.buyerName = result.buyer_name;
    if (result.total_amount !== undefined) result.totalAmount = result.total_amount;
    if (result.payment_status !== undefined) result.paymentStatus = result.payment_status;
    if (result.payment_method !== undefined) result.paymentMethod = result.payment_method;
    if (result.delivery_address !== undefined) result.deliveryAddress = result.delivery_address;
    if (result.assigned_suppliers !== undefined) result.assignedSuppliers = result.assigned_suppliers;
  }

  if (tableName === 'bulk_inquiries') {
    if (result.business_name !== undefined) result.businessName = result.business_name;
    if (result.contact_person !== undefined) result.contactPerson = result.contact_person;
  }

  if (tableName === 'manufacturer_pos') {
    if (result.po_number !== undefined) result.poNumber = result.po_number;
    if (result.manufacturer_id !== undefined) result.manufacturerId = result.manufacturer_id;
    if (result.manufacturer_name !== undefined) result.manufacturerName = result.manufacturer_name;
    if (result.manufacturer_phone !== undefined) result.manufacturerPhone = result.manufacturer_phone;
    if (result.total_amount !== undefined) result.totalAmount = result.total_amount;
    if (result.vat_applied !== undefined) result.vatApplied = result.vat_applied;
  }

  if (tableName === 'supplier_invoices') {
    if (result.invoice_number !== undefined) result.invoiceNumber = result.invoice_number;
    if (result.supplier_id !== undefined) result.supplierId = result.supplier_id;
    if (result.supplier_name !== undefined) result.supplierName = result.supplier_name;
    if (result.po_id !== undefined) result.poId = result.po_id;
    if (result.po_number !== undefined) result.poNumber = result.po_number;
    if (result.total_amount !== undefined) result.totalAmount = result.total_amount;
    if (result.issue_date !== undefined) result.issueDate = result.issue_date;
    if (result.due_date !== undefined) result.dueDate = result.due_date;
  }

  if (tableName === 'price_lists') {
    if (result.transaction_type !== undefined) result.transactionType = result.transaction_type;
    if (result.round_off_to !== undefined) result.roundOffTo = result.round_off_to;
  }

  if (tableName === 'organisations') {
    if (result.credit_limit !== undefined) result.creditLimit = result.credit_limit;
    if (result.credit_used !== undefined) result.creditUsed = result.credit_used;
    if (result.available_credit !== undefined) result.availableCredit = result.available_credit;
    if (result.payment_terms !== undefined) result.paymentTerms = result.payment_terms;
    if (result.delivery_locations !== undefined) result.deliveryLocations = result.delivery_locations;
  }

  return result;
}
