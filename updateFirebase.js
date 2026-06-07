import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf8');
envFile.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    process.env[key.trim()] = value.trim();
  }
});

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "nbt-001.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  const productsRef = collection(db, 'products');
  const snapshot = await getDocs(productsRef);
  let updatedCount = 0;
  
  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    let hasBulkSize = false;
    
    if (data.sizes && Array.isArray(data.sizes)) {
      for (const s of data.sizes) {
        if (s.size && (s.size.includes('5L') || s.size.includes('25L'))) {
          hasBulkSize = true;
          break;
        }
      }
    }
    
    if (hasBulkSize) {
      if (data.category !== 'Bulk 5L & 25L') {
        console.log(`Updating ${data.name} (ID: ${docSnap.id}) -> Bulk 5L & 25L`);
        await updateDoc(doc(db, 'products', docSnap.id), {
          category: 'Bulk 5L & 25L'
        });
        updatedCount++;
      }
    }
  }
  
  console.log(`Successfully updated ${updatedCount} products.`);
  process.exit(0);
}

run().catch(console.error);
