import { doc, setDoc, getDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase';

interface UserRole {
  uid: string;
  email: string;
  name?: string;
  role: 'user' | 'premium' | 'admin';
  isAdmin: boolean;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Create admin user function for browser console
export async function createAdminUser(email: string, password: string, name: string = 'Admin User') {
  try {
    console.log('Creating admin user...');
    
    // Create user with Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log('User created in Firebase Auth:', user.uid);
    
    // Create user profile with admin role in Firestore
    const userDoc: UserRole = {
      uid: user.uid,
      email: user.email || email,
      name: name,
      role: 'admin',
      isAdmin: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      permissions: [
        'packages:read',
        'packages:write',
        'packages:delete',
        'users:read',
        'users:write',
        'users:delete',
        'analytics:read'
      ]
    };
    
    await setDoc(doc(db, 'users', user.uid), userDoc);
    
    console.log('✅ Admin user created successfully!');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('UID:', user.uid);
    console.log('Role: admin');
    
    return user;
  } catch (error: any) {
    console.error('❌ Error creating admin user:', error.message);
    throw error;
  }
}

// Make existing user admin
export async function makeUserAdmin(uid: string) {
  try {
    console.log('Making user admin...');
    
    // Check if user exists
    const userDocRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      throw new Error('User not found in Firestore');
    }
    
    // Update user role to admin
    const updateData = {
      role: 'admin',
      isAdmin: true,
      updatedAt: new Date(),
      permissions: [
        'packages:read',
        'packages:write',
        'packages:delete',
        'users:read',
        'users:write',
        'users:delete',
        'analytics:read'
      ]
    };
    
    await setDoc(userDocRef, updateData, { merge: true });
    
    console.log('✅ User role updated to admin successfully!');
    console.log('UID:', uid);
    
    return true;
  } catch (error: any) {
    console.error('❌ Error making user admin:', error.message);
    throw error;
  }
}

// Get current user info
export async function getCurrentUserInfo() {
  const user = auth.currentUser;
  if (!user) {
    console.log('No user currently logged in');
    return null;
  }
  
  console.log('Current user:', {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName
  });
  
  try {
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      console.log('User role data:', userData);
      return userData;
    } else {
      console.log('User not found in Firestore');
      return null;
    }
  } catch (error) {
    console.error('Error getting user info:', error);
    return null;
  }
}

// Make current user admin
export async function makeCurrentUserAdmin() {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('No user currently logged in');
  }
  
  return await makeUserAdmin(user.uid);
}

// Expose functions to window for browser console usage
if (typeof window !== 'undefined') {
  (window as any).adminHelper = {
    createAdminUser,
    makeUserAdmin,
    makeCurrentUserAdmin,
    getCurrentUserInfo
  };
  
  console.log('Admin helper functions loaded! Use in browser console:');
  console.log('- adminHelper.createAdminUser(email, password, name)');
  console.log('- adminHelper.makeCurrentUserAdmin()');
  console.log('- adminHelper.makeUserAdmin(uid)');
  console.log('- adminHelper.getCurrentUserInfo()');
}