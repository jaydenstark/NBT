import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

// To run this script:
// 1. Download your service account key from Firebase Settings -> Service Accounts
// 2. Save it as `serviceAccountKey.json` in the project root
// 3. Run: node scripts/seedB2B.js

const serviceAccount = JSON.parse(readFileSync('./serviceAccountKey.json', 'utf-8'));

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function seedB2B() {
  console.log("Starting B2B Database Migration...");

  // 1. CREATE SUPPLIERS
  console.log("Creating default suppliers...");
  const neatRef = db.collection('suppliers').doc('SUPPLIER_NEAT');
  await neatRef.set({
    name: 'NEAT',
    contactPerson: 'Neat Admin',
    phone: '',
    email: 'contact@neatbrandtrade.com',
    address: 'Accra, Ghana',
    brands: ['NEAT'],
    deliveryCoverage: ['Accra', 'Tema'],
    rating: 5.0,
    status: 'active',
    paymentTerms: 'cash',
    createdAt: new Date()
  });

  const devaRef = db.collection('suppliers').doc('SUPPLIER_DEVA');
  await devaRef.set({
    name: 'DEVA',
    contactPerson: 'Deva Admin',
    phone: '',
    email: 'info@devaproducts.com',
    address: 'Accra, Ghana',
    brands: ['DEVA'],
    deliveryCoverage: ['Accra', 'Tema'],
    rating: 5.0,
    status: 'active',
    paymentTerms: 'cash',
    createdAt: new Date()
  });
  console.log("Suppliers created.");

  // 2. MIGRATE EXISTING PRODUCTS
  console.log("Migrating existing products...");
  const snapshot = await db.collection('products').get();
  
  let migratedCount = 0;
  
  for (const doc of snapshot.docs) {
    const data = doc.data();
    
    // Determine supplier based on name/brand
    let supplierId = 'SUPPLIER_NEAT';
    const lowerName = data.name ? data.name.toLowerCase() : '';
    if (lowerName.includes('deva')) {
      supplierId = 'SUPPLIER_DEVA';
    }

    // Assign wholesale pricing (e.g. 15% discount off base rate)
    const priceRetail = data.rate || 0;
    const priceWholesale = priceRetail * 0.85;
    const priceDistributor = priceRetail * 0.70;

    await doc.ref.update({
      supplierId,
      priceRetail,
      priceWholesale,
      priceDistributor,
      unit: 'bottle', // default
      stockQuantity: 100, // mock default
      isActive: true,
      updatedAt: new Date()
    });

    migratedCount++;
  }

  console.log(`Successfully migrated ${migratedCount} products to the new B2B schema.`);
}

seedB2B().catch(console.error);
