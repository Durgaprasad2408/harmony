import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
        setIsAdmin(session.user.email === 'hari.2408dt@gmail.com');
      }
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          fetchProfile(session.user.id);
          setIsAdmin(session.user.email === 'hari.2408dt@gmail.com');
        } else {
          setProfile(null);
          setIsAdmin(false);
        }
        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        setProfile(null);
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error('Unexpected error fetching profile:', error);
      setProfile(null);
    }
  };

  const signIn = async (email, password) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const signUp = async (email, password, displayName) => {
    try {
      const { error: signUpError, data } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            display_name: displayName,
          },
        }
      });

      if (signUpError) return { error: signUpError };
      
      if (data.user) {
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            user_id: data.user.id,
            display_name: displayName,
            role: 'user',
          });
  
        if (profileError) return { error: profileError };
      }
      
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const signOut = async () => {
    try {
      // Clear local state first to ensure consistent UI
      setUser(null);
      setProfile(null);
      setSession(null);
      
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
    } catch (err) {
      // If the error is session_not_found, we've already cleared the local state
      // For other errors, log them but don't block the sign out flow
      if (!err.message?.includes('session_not_found')) {
        console.error('Sign out error:', err);
      }
    } finally {
      // Always navigate to home page after sign out attempt
      navigate('/');
    }
  };

  const updateProfile = async (updates) => {
    if (!user) return { error: new Error('User not authenticated'), data: null };
    if (!profile) return { error: new Error('Profile not found'), data: null };

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        return { error, data: null };
      }

      setProfile(data);
      return { error: null, data };
    } catch (error) {
      return { error, data: null };
    }
  };

  const updatePassword = async (newPassword) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const updateEmail = async (newEmail) => {
    try {
      const { error } = await supabase.auth.updateUser({
        email: newEmail
      });
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const value = {
    session,
    user,
    profile,
    isAdmin,
    isLoading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    updatePassword,
    updateEmail,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};