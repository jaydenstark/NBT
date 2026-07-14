import { useState, useEffect } from 'react';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';

export function useAuthUser() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch or listen to the Firestore user document
        const userRef = doc(db, 'users', firebaseUser.uid);
        
        // Use onSnapshot to keep user role/tier real-time
        const unsubscribeDoc = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              ...docSnap.data()
            });
          } else {
            // Document doesn't exist yet, we only have basic auth data
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              role: 'buyer' // Default fallback
            });
          }
          setLoading(false);
        }, (error) => {
          console.error("Firestore onSnapshot Error:", error);
          // If we fail to fetch user data (e.g. permissions), just fallback to basic auth so the UI unblocks
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            role: 'buyer'
          });
          setLoading(false);
        });

        return () => unsubscribeDoc();
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  return { user, loading, isAuthenticated: !!user };
}
