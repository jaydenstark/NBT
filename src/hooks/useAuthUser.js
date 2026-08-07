import { useState, useEffect } from 'react';
import { auth } from '../lib/firebase';
import { userService } from '../services/db';

export function useAuthUser() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async (firebaseUser) => {
      try {
        const data = await userService.getUserProfile(firebaseUser.id);

        if (data) {
          setUser({
            uid: firebaseUser.id,
            email: firebaseUser.email,
            ...data
          });
        } else {
          setUser({
            uid: firebaseUser.id,
            email: firebaseUser.email,
            role: 'buyer'
          });
        }
      } catch (err) {
        console.error("Profile fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    const getInitialSession = async () => {
      try {
        const { data: { session } } = await auth.getSession();
        if (session?.user) {
          await fetchUserProfile(session.user);
        } else {
          setUser(null);
          setLoading(false);
        }
      } catch (error) {
        console.error("Error getting initial session:", error);
        setLoading(false);
      }
    };

    getInitialSession();

    const { data: { subscription } } = auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await fetchUserProfile(session.user);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  return { user, loading, isAuthenticated: !!user };
}
