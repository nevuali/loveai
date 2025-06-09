import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { User } from '../types/firestore';

export function useAdmin() {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkAdminStatus() {
      if (!user) {
        setUserRole(null);
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Get user role from Firestore
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData && typeof userData === 'object' && 'role' in userData) {
            const userRole = userData as User;
            setUserRole(userRole);
            setIsAdmin(userRole.role === 'admin' && userRole.isAdmin === true);
          }
        } else {
          // User doesn't exist in Firestore, no admin access
          setUserRole(null);
          setIsAdmin(false);
        }
      } catch (err) {
        console.error('Error checking admin status:', err);
        setError('Failed to check admin status');
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    }

    checkAdminStatus();
  }, [user]);

  const hasPermission = (permission: string): boolean => {
    if (!userRole) return false;
    return userRole.permissions.includes(permission) || userRole.isAdmin;
  };

  const refreshRole = async () => {
    if (user) {
      setLoading(true);
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData && typeof userData === 'object' && 'role' in userData) {
            const userRole = userData as User;
            setUserRole(userRole);
            setIsAdmin(userRole.role === 'admin' && userRole.isAdmin === true);
          }
        }
      } catch (err) {
        console.error('Error refreshing role:', err);
        setError('Failed to refresh role');
      } finally {
        setLoading(false);
      }
    }
  };

  return {
    userRole,
    isAdmin,
    loading,
    error,
    hasPermission,
    refreshRole
  };
}