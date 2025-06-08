import type { User as FirebaseUser } from 'firebase/auth';
import type { FieldValue } from 'firebase/firestore';
import { GoogleAuthProvider } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, firebaseConfig } from '../firebase';
import { getAuthFunctions, getFirestoreFunctions } from '../utils/firebase-lazy';
import { logger } from '../utils/logger';

// Development/Debug mode configuration
const isDevelopment = import.meta.env.DEV;

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.profile');
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.email');
// Profil fotoğrafı için ek parametreler
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Mobile detection utility
const isMobile = (): boolean => {
  return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
         (navigator.maxTouchPoints && navigator.maxTouchPoints > 2 && /MacIntel/.test(navigator.platform));
};

// User interface Firebase Auth ve Firestore yapısına uygun güncellendi
export interface User {
  uid: string; // Firebase Auth UID
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  phoneNumber?: string | null;
  // Firestore'da saklanacak ek alanlar
  name: string; // Zorunlu yapıldı
  surname?: string;
  chatSessionId?: string; // Her kullanıcı için Firestore'da saklanabilir
  messageCount?: number;
  isPremium?: boolean;
  isVerified?: boolean; // Firebase Auth email verification kullanılabilir
  totalSpent?: number;
  reservationCount?: number;
  createdAt?: Timestamp | string | FieldValue; // FieldValue eklendi
  lastLogin?: Timestamp | string | FieldValue; // FieldValue eklendi
  updatedAt?: Timestamp | string | FieldValue; // Firestore'da güncellemeler için eklendi
}

export interface RegisterData {
  name: string;
  surname?: string;
  email: string;
  phone?: string; // Opsiyonel
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

// AuthResponse'u Firebase'e uygun hale getirelim
export interface AuthResponse {
  success: boolean;
  message?: string;
  user?: User; // Firebase'den dönen kullanıcı bilgisi
  firebaseUser?: FirebaseUser; // Ham FirebaseUser objesi, gerekirse
  errorCode?: string;
}

class AuthService {
  // currentUser'ı doğrudan Firebase'den dinleyeceğiz, bu yüzden class içinde tutmaya gerek yok.
  // private currentUser: User | null = null;

  // Yeni kullanıcı kaydı (Firebase Auth ve Firestore)
  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const firebaseUser = userCredential.user;

      // Firebase Auth profiline displayName ekleyelim (opsiyonel)
      await updateProfile(firebaseUser, {
        displayName: `${data.name}${data.surname ? ' ' + data.surname : ''}`,
        // photoURL: 'initial_photo_url.jpg' // Varsayılan bir fotoğraf eklenebilir
      });

      // Kullanıcı bilgilerini Firestore'a kaydedelim
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const newUser: Omit<User, 'uid'> & {createdAt: FieldValue, lastLogin: FieldValue } = {
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        name: data.name,
        surname: data.surname,
        phoneNumber: data.phone,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        isVerified: firebaseUser.emailVerified,
        isPremium: false, // Varsayılan değer
        messageCount: 0, // Varsayılan değer
        chatSessionId: `user-session-${firebaseUser.uid}-${Date.now()}` // Basit bir session ID
      };
      await setDoc(userDocRef, newUser, { merge: true });

      // Firestore'dan yeni oluşturulan kullanıcıyı okuyup döndürelim (Timestamp'ler çözümlenmiş olacak)
      const createdUserProfile = await this.getUserProfile(firebaseUser.uid);
      
      return {
        success: true,
        message: 'Registration successful!',
        user: createdUserProfile || undefined,
        firebaseUser,
      };
    } catch (error: any) {
      logger.error('Firebase Registration error:', error);
      return { success: false, message: error.message, errorCode: error.code };
    }
  }

  // Kullanıcı girişi (Firebase Auth)
  async login(data: LoginData): Promise<AuthResponse> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      const firebaseUser = userCredential.user;

      // Son giriş zamanını Firestore'da güncelleyelim
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      await updateDoc(userDocRef, {
        lastLogin: serverTimestamp(),
      });
      
      // Firestore'dan tam kullanıcı profilini çekelim
      const userProfile = await this.getUserProfile(firebaseUser.uid);
      
      return {
        success: true,
        message: 'Login successful!',
        user: userProfile || undefined, // Eğer profil yoksa undefined
        firebaseUser,
      };
    } catch (error: any) {
      logger.error('Firebase Login error:', error);
      return { success: false, message: error.message, errorCode: error.code };
    }
  }

  // Google ile giriş yap
  async signInWithGoogle(): Promise<AuthResponse> {
    try {
      let userCredential;
      
      if (isMobile()) {
        // Mobile cihazlar için redirect kullan
        logger.log('🔍 Mobile device detected, using signInWithRedirect');
        await signInWithRedirect(auth, googleProvider);
        
        // Redirect sonrası kullanıcı geri döndüğünde sonucu kontrol et
        userCredential = await getRedirectResult(auth);
        
        if (!userCredential) {
          // Redirect henüz tamamlanmamışsa veya kullanıcı geri dönmemişse
          return { success: false, message: 'Google sign-in was cancelled or not completed.' };
        }
      } else {
        // Desktop için popup kullan
        logger.log('🔍 Desktop device detected, using signInWithPopup');
        userCredential = await signInWithPopup(auth, googleProvider);
      }

      const firebaseUser = userCredential.user;

      logger.log('🔍 Google Sign-In Firebase User:', {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        providerId: firebaseUser.providerId
      });

      // Kullanıcının Firestore'da profili var mı kontrol et
      let userProfile = await this.getUserProfile(firebaseUser.uid);
      
      // Eğer profil yoksa, Google bilgileriyle oluştur
      if (!userProfile) {
        logger.log('🔍 Creating new profile for Google user');
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const displayName = firebaseUser.displayName || '';
        const nameParts = displayName.split(' ');
        const firstName = nameParts[0] || 'User';
        const lastName = nameParts.slice(1).join(' ') || '';

        const newUser: Omit<User, 'uid'> & {createdAt: FieldValue, lastLogin: FieldValue } = {
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          name: firstName,
          surname: lastName,
          photoURL: firebaseUser.photoURL,
          phoneNumber: firebaseUser.phoneNumber,
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
          isVerified: firebaseUser.emailVerified,
          isPremium: false,
          messageCount: 0,
          chatSessionId: `google-session-${firebaseUser.uid}-${Date.now()}`
        };
        
        logger.log('🔍 New user data being saved:', newUser);
        await setDoc(userDocRef, newUser, { merge: true });
        userProfile = await this.getUserProfile(firebaseUser.uid);
        logger.log('🔍 Profile after creation:', userProfile);
      } else {
        logger.log('🔍 Existing user profile found:', userProfile);
        // Mevcut kullanıcı, photoURL'i güncelle ve lastLogin'i güncelle
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        await updateDoc(userDocRef, {
          photoURL: firebaseUser.photoURL,
          lastLogin: serverTimestamp(),
        });
        // Güncellenmiş profili al
        userProfile = await this.getUserProfile(firebaseUser.uid);
        logger.log('🔍 Updated user profile:', userProfile);
      }

      return {
        success: true,
        message: 'Google sign-in successful!',
        user: userProfile || undefined,
        firebaseUser,
      };
    } catch (error: any) {
      logger.error('Google Sign-In error:', error);
      
      // Specific error handling for mobile
      if (error.code === 'auth/popup-blocked') {
        return { 
          success: false, 
          message: 'Popup was blocked. Please allow popups for this site and try again.',
          errorCode: error.code 
        };
      } else if (error.code === 'auth/popup-closed-by-user') {
        return { 
          success: false, 
          message: 'Sign-in was cancelled.',
          errorCode: error.code 
        };
      } else if (error.code === 'auth/network-request-failed') {
        return { 
          success: false, 
          message: 'Network error. Please check your internet connection.',
          errorCode: error.code 
        };
      }
      
      return { success: false, message: error.message, errorCode: error.code };
    }
  }

  // Kullanıcı çıkışı (Firebase Auth)
  async logout(): Promise<void> {
    try {
      await signOut(auth);
      // localStorage'dan özel bir şey silmeye gerek kalmayabilir,
      // Firebase oturumu zaten sonlandı.
      // localStorage.removeItem('ailovve_user');
      // localStorage.removeItem('ailovve_chat_session');
      logger.log('User logged out from Firebase.');
    } catch (error) {
      logger.error('Firebase Logout error:', error);
      throw error;
    }
  }

  // Mevcut Firebase kullanıcısını anlık olarak getirir
  getCurrentFirebaseUser(): FirebaseUser | null {
    return auth.currentUser;
  }

  // Kullanıcı oturum durumunu dinler
  // Bu fonksiyon, bir callback alır ve kullanıcı durumu değiştikçe onu çağırır.
  // React context veya state yönetimi ile kullanılabilir.
  onAuthStateChangedWrapper(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userProfile = await this.getUserProfile(firebaseUser.uid);
        callback(userProfile);
      } else {
        callback(null);
      }
    });
  }

  // Kullanıcı profilini Firestore'dan getirir
  async getUserProfile(uid: string): Promise<User | null> {
    if (!uid) {
      logger.warn('getUserProfile: UID is required');
      return null;
    }
    
    try {
      const userDocRef = doc(db, 'users', uid);
      const docSnap = await getDoc(userDocRef);
      
      if (docSnap.exists()) {
        // Firebase User objesinden gelen bilgileri de ekleyebiliriz.
        const firebaseAuthUser = auth.currentUser;
        const firestoreData = docSnap.data() as Omit<User, 'uid'>;
        return {
          uid,
          email: firebaseAuthUser?.email || firestoreData.email || null,
          displayName: firebaseAuthUser?.displayName || firestoreData.displayName || null,
          photoURL: firebaseAuthUser?.photoURL || firestoreData.photoURL || undefined,
          ...firestoreData,
        } as User;
      } else {
        logger.warn(`No profile found in Firestore for UID: ${uid}`);
        
        // Eğer Firebase Auth kullanıcısı varsa ama Firestore'da profil yoksa,
        // Firebase Auth bilgilerini kullanarak minimal profil oluştur
        const firebaseAuthUser = auth.currentUser;
        if (firebaseAuthUser && firebaseAuthUser.uid === uid) {
          logger.log('Creating basic profile from Firebase Auth data');
          
          const displayName = firebaseAuthUser.displayName || '';
          const nameParts = displayName.split(' ');
          const firstName = nameParts[0] || 'User';
          const lastName = nameParts.slice(1).join(' ') || '';

          const basicProfile: Omit<User, 'uid'> & {createdAt: FieldValue, lastLogin: FieldValue } = {
            email: firebaseAuthUser.email,
            displayName: firebaseAuthUser.displayName,
            name: firstName,
            surname: lastName,
            photoURL: firebaseAuthUser.photoURL,
            phoneNumber: firebaseAuthUser.phoneNumber,
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp(),
            isVerified: firebaseAuthUser.emailVerified,
            isPremium: false,
            messageCount: 0,
            chatSessionId: `auth-session-${uid}-${Date.now()}`
          };
          
          try {
            await setDoc(userDocRef, basicProfile, { merge: true });
            logger.log('Basic profile created successfully');
            
            // Yeni oluşturulan profili geri döndür
            return {
              uid,
              ...basicProfile,
              createdAt: new Date().toISOString(), // FieldValue yerine string
              lastLogin: new Date().toISOString(),
            } as User;
          } catch (createError) {
            logger.error('Error creating basic profile:', createError);
            // Firestore hatası olsa bile minimal profil döndür
            return {
              uid,
              email: firebaseAuthUser.email,
              displayName: firebaseAuthUser.displayName,
              name: firstName,
              surname: lastName,
              photoURL: firebaseAuthUser.photoURL,
              phoneNumber: firebaseAuthUser.phoneNumber,
              isVerified: firebaseAuthUser.emailVerified,
              isPremium: false,
              messageCount: 0,
            } as User;
          }
        }
        
        return null;
      }
    } catch (error) {
      logger.error('Error fetching user profile from Firestore:', error);
      
      // Hata durumunda Firebase Auth kullanıcısı varsa minimal profil oluştur
      const firebaseAuthUser = auth.currentUser;
      if (firebaseAuthUser && firebaseAuthUser.uid === uid) {
        logger.log('Returning minimal profile due to Firestore error');
        const displayName = firebaseAuthUser.displayName || '';
        const nameParts = displayName.split(' ');
        const firstName = nameParts[0] || 'User';
        const lastName = nameParts.slice(1).join(' ') || '';
        
        return {
          uid,
          email: firebaseAuthUser.email,
          displayName: firebaseAuthUser.displayName,
          name: firstName,
          surname: lastName,
          photoURL: firebaseAuthUser.photoURL,
          phoneNumber: firebaseAuthUser.phoneNumber,
          isVerified: firebaseAuthUser.emailVerified,
          isPremium: false,
          messageCount: 0,
        } as User;
      }
      
      return null; // Hata durumunda null dön
    }
  }
  
  // Kullanıcı doğrulanmış mı?
  isUserAuthenticated(): boolean {
    return auth.currentUser !== null;
  }

  // Kullanıcı email'i doğrulanmış mı?
  isUserEmailVerified(): boolean {
    return auth.currentUser?.emailVerified || false;
  }

  // Chat session ID'sini Firestore'dan alır veya oluşturur
  async getChatSessionId(): Promise<string> {
    logger.log('🔑 getChatSessionId called');
    
    const firebaseUser = auth.currentUser;
    logger.log('👤 Current Firebase user:', firebaseUser ? {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName
    } : 'No user authenticated');
    
    if (!firebaseUser) {
      // Anonymous session için localStorage kullanılabilir veya farklı bir mantık izlenebilir.
      let anonSessionId = localStorage.getItem('ailovve_anon_chat_session');
      if (!anonSessionId) {
        anonSessionId = `anonymous-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('ailovve_anon_chat_session', anonSessionId);
        logger.log('🆔 Created new anonymous session ID:', anonSessionId);
      } else {
        logger.log('🆔 Using existing anonymous session ID:', anonSessionId);
      }
      return anonSessionId;
    }

    try {
      logger.log('🔄 Getting user profile for session ID...');
      const userProfile = await this.getUserProfile(firebaseUser.uid);
      logger.log('👤 User profile:', userProfile);
      
      if (userProfile && userProfile.chatSessionId) {
        logger.log('✅ Found existing session ID:', userProfile.chatSessionId);
        return userProfile.chatSessionId;
      }

      // Eğer Firestore'da chatSessionId yoksa yeni bir tane oluştur ve kaydet
      const newChatSessionId = `user-session-${firebaseUser.uid}-${Date.now()}`;
      logger.log('🆕 Creating new session ID:', newChatSessionId);
      
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      await updateDoc(userDocRef, { chatSessionId: newChatSessionId });
      logger.log('💾 Session ID saved to Firestore');
      return newChatSessionId;
    } catch (error) {
      logger.error('❌ Error updating chatSessionId in Firestore:', error);
      // Hata durumunda bile session ID üret
      const fallbackSessionId = `user-session-${firebaseUser.uid}-${Date.now()}`;
      logger.log('⚠️ Using fallback session ID:', fallbackSessionId);
      return fallbackSessionId;
    }
  }

  // Kullanıcı profilini Firestore'da günceller
  async updateUserProfile(uid: string, data: Partial<Omit<User, 'uid' | 'createdAt' | 'updatedAt'>>): Promise<void> {
    if (!uid) throw new Error("UID is required to update profile.");
    
    try {
      const userDocRef = doc(db, 'users', uid);
      const updateData: Partial<Omit<User, 'uid' | 'createdAt'>> & {updatedAt?: FieldValue} = {
        ...data,
        updatedAt: serverTimestamp()
      };
      await updateDoc(userDocRef, updateData);

      // Firebase Auth profilini de güncelle (sadece displayName ve photoURL desteklenir)
      if (data.displayName || data.photoURL) {
        const authUpdateData: { displayName?: string; photoURL?: string | null } = {};
        if (data.displayName) authUpdateData.displayName = data.displayName;
        if (data.photoURL) authUpdateData.photoURL = data.photoURL as string | null; // Type cast
        if (auth.currentUser && auth.currentUser.uid === uid) { // Sadece mevcut kullanıcı kendi profilini güncelleyebilir
            await updateProfile(auth.currentUser, authUpdateData);
        }
      }
    } catch (error) {
      logger.error('Error updating user profile in Firestore:', error);
      throw error;
    }
  }
}

export const authService = new AuthService(); 