import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { fetchUserInfo } from '../services/codeforces';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (!error && data) {
        let fullProfile = { ...data };
        if (data.cf_handle) {
          const cfInfo = await fetchUserInfo(data.cf_handle);
          if (cfInfo) {
            fullProfile.rating = cfInfo.rating;
            fullProfile.rank = cfInfo.rank;
            fullProfile.avatar = cfInfo.titlePhoto || cfInfo.avatar;
            fullProfile.cf_info = cfInfo; // Store full Codeforces profile details
            localStorage.setItem(`cf_profile_${data.cf_handle}`, JSON.stringify(cfInfo));
          } else {
            // Fallback to localStorage if API is down
            const cachedInfoStr = localStorage.getItem(`cf_profile_${data.cf_handle}`);
            if (cachedInfoStr) {
              try {
                const cachedInfo = JSON.parse(cachedInfoStr);
                fullProfile.rating = cachedInfo.rating;
                fullProfile.rank = cachedInfo.rank;
                fullProfile.avatar = cachedInfo.titlePhoto || cachedInfo.avatar;
                fullProfile.cf_info = cachedInfo;
              } catch (e) {
                console.error("Failed to parse cached profile", e);
                // Worst case fallback to Supabase fields
                fullProfile.rating = data.rating;
                fullProfile.rank = data.rank;
              }
            } else {
              // Worst case fallback to Supabase fields
              fullProfile.rating = data.rating;
              fullProfile.rank = data.rank;
            }
          }
        }
        setProfile(fullProfile);
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id).then(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = {
    session,
    user,
    profile,
    signOut: async () => {
      localStorage.removeItem('wasLoggedIn');
      await supabase.auth.signOut();
    },
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
