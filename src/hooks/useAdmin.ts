import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

interface UserRole {
  uid: string;
  email: string;
  name?: string;
  role: 'user' | 'premium' | 'admin';
  isAdmin: boolean;
  permissions: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export function useAdmin() {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
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
          const userData = userDoc.data() as UserRole;
          setUserRole(userData);
          setIsAdmin(userData.role === 'admin' && userData.isAdmin === true);
        } else {
          // User doesn't exist in Firestore, create basic profile
          const basicUserRole: UserRole = {
            uid: user.uid,
            email: user.email || '',
            name: user.displayName || '',
            role: 'user',
            isAdmin: false,
            permissions: []
          };
          setUserRole(basicUserRole);
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
          const userData = userDoc.data() as UserRole;
          setUserRole(userData);
          setIsAdmin(userData.role === 'admin' && userData.isAdmin === true);
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