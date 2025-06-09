import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

// Firebase configuration - load from environment variables
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "your_firebase_api_key_here",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "your_project.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "your_project_id",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "your_project.firebasestorage.app",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "your_sender_id",
  appId: process.env.FIREBASE_APP_ID || "your_app_id",
  measurementId: process.env.FIREBASE_MEASUREMENT_ID || "your_measurement_id"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Function to create admin user
export async function createAdminUser(email, password, name = 'Admin User') {
  try {
    console.log('Creating admin user...');
    
    // Create user with Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log('User created in Firebase Auth:', user.uid);
    
    // Create user profile with admin role in Firestore
    const userDoc = {
      uid: user.uid,
      email: user.email,
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
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    throw error;
  }
}

// Function to make existing user admin
export async function makeUserAdmin(uid) {
  try {
    console.log('Making user admin...');
    
    // Check if user exists
    const userDocRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      throw new Error('User not found');
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
  } catch (error) {
    console.error('❌ Error making user admin:', error.message);
    throw error;
  }
}

// Function to make user admin by email
export async function makeUserAdminByEmail(email) {
  try {
    console.log('Finding user by email and making admin...');
    
    // Sign in as the user to get their UID (this is a workaround since we can't query by email directly)
    // In a real app, you'd use Firebase Admin SDK server-side
    const tempPassword = prompt('Enter the user\'s current password:');
    const userCredential = await signInWithEmailAndPassword(auth, email, tempPassword);
    const uid = userCredential.user.uid;
    
    await makeUserAdmin(uid);
    
    return uid;
  } catch (error) {
    console.error('❌ Error finding/updating user:', error.message);
    throw error;
  }
}

// Command line interface
if (typeof window === 'undefined') {
  // Running in Node.js
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'create':
      const email = args[1];
      const password = args[2];
      const name = args[3] || 'Admin User';
      
      if (!email || !password) {
        console.error('Usage: node create-admin-user.js create <email> <password> [name]');
        process.exit(1);
      }
      
      createAdminUser(email, password, name)
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
      break;
      
    case 'promote':
      const uid = args[1];
      
      if (!uid) {
        console.error('Usage: node create-admin-user.js promote <uid>');
        process.exit(1);
      }
      
      makeUserAdmin(uid)
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
      break;
      
    default:
      console.log('Available commands:');
      console.log('  create <email> <password> [name] - Create new admin user');
      console.log('  promote <uid>                    - Make existing user admin');
      process.exit(1);
  }
}

// Browser usage
if (typeof window !== 'undefined') {
  window.createAdminUser = createAdminUser;
  window.makeUserAdmin = makeUserAdmin;
  window.makeUserAdminByEmail = makeUserAdminByEmail;
}