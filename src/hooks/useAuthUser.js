import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useAuthUser() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async (supabaseUser) => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', supabaseUser.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error("Error fetching user profile:", error);
        }

        if (data) {
          setUser({
            uid: supabaseUser.id,
            email: supabaseUser.email,
            ...data
          });
        } else {
          setUser({
            uid: supabaseUser.id,
            email: supabaseUser.email,
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
        const { data: { session } } = await supabase.auth.getSession();
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
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
