import { auth } from '../firebase';

// Browser console'da kullanıcı ID'sini görmek için
export function showCurrentUserId() {
  const user = auth.currentUser;
  if (user) {
    console.log('='.repeat(50));
    console.log('MEVCUT KULLANICI BİLGİLERİ:');
    console.log('='.repeat(50));
    console.log('User ID (UID):', user.uid);
    console.log('Email:', user.email);
    console.log('Display Name:', user.displayName);
    console.log('='.repeat(50));
    console.log('Bu UID\'yi Firestore\'da kullan!');
    console.log('='.repeat(50));
    
    // Clipboard'a kopyala (modern browsers)
    if (navigator.clipboard) {
      navigator.clipboard.writeText(user.uid).then(() => {
        console.log('✅ User ID clipboard\'a kopyalandı!');
      });
    }
    
    return user.uid;
  } else {
    console.log('❌ Kullanıcı giriş yapmamış!');
    return null;
  }
}

// Global window'a ekle
if (typeof window !== 'undefined') {
  (window as any).showCurrentUserId = showCurrentUserId;
  (window as any).getCurrentUserId = showCurrentUserId;
  
  console.log('💡 Kullanıcı ID\'nizi öğrenmek için console\'da: showCurrentUserId()');
}