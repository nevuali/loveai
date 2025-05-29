// LocalStorage'ı tamamen temizle
console.log('🧹 LocalStorage temizleniyor...');

// Mevcut localStorage içeriğini göster
console.log('📋 Mevcut localStorage:', { ...localStorage });

// Tüm localStorage'ı temizle
localStorage.clear();

// SessionStorage'ı da temizle
sessionStorage.clear();

// IndexedDB'yi de temizle (varsa)
if ('indexedDB' in window) {
  indexedDB.databases().then(databases => {
    databases.forEach(db => {
      indexedDB.deleteDatabase(db.name);
    });
  });
}

// Cookies'leri temizle (admin ile başlayanları)
document.cookie.split(";").forEach(function(c) { 
  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
});

console.log('✅ Tüm storage temizlendi!');
console.log('📋 Temizlik sonrası localStorage:', { ...localStorage });

// Sayfayı yenile
setTimeout(() => {
  console.log('🔄 Sayfa yenileniyor...');
  window.location.reload();
}, 1000); 