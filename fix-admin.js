const bcrypt = require('bcrypt');
const Database = require('better-sqlite3');
const db = new Database('./backend/database.sqlite');

console.log('🔍 Admin kullanıcısını kontrol ediliyor...');

// Mevcut admin kullanıcısını kontrol et
const admin = db.prepare('SELECT * FROM users WHERE email = ?').get('admin@cappalove.com');
console.log('📧 Mevcut admin kullanıcısı:', admin ? 'Bulundu' : 'Bulunamadı');

if (admin) {
  console.log('📧 Email:', admin.email);
  console.log('🔐 Mevcut hash uzunluğu:', admin.password.length);
  
  // Şifreyi test et
  const isValid = bcrypt.compareSync('admin123', admin.password);
  console.log('✅ Mevcut şifre doğru mu?', isValid);
}

// Yeni hash oluştur
console.log('🔄 Yeni şifre hash\'i oluşturuluyor...');
const newHash = bcrypt.hashSync('admin123', 10);
console.log('🆕 Yeni hash uzunluğu:', newHash.length);

// Admin kullanıcısını güncelle/oluştur
console.log('💾 Admin kullanıcısı güncelleniyor...');
const stmt = db.prepare(`
  INSERT OR REPLACE INTO users (id, email, password, role, name, surname, created_at, updated_at)
  VALUES (1, 'admin@cappalove.com', ?, 'admin', 'Admin', 'User', datetime('now'), datetime('now'))
`);

stmt.run(newHash);
console.log('✅ Admin kullanıcısı başarıyla güncellendi!');

// Kontrol et
const updatedAdmin = db.prepare('SELECT * FROM users WHERE email = ?').get('admin@cappalove.com');
const finalCheck = bcrypt.compareSync('admin123', updatedAdmin.password);
console.log('🔍 Final kontrol - Şifre doğru mu?', finalCheck);

db.close();
console.log('🎯 İşlem tamamlandı! Şimdi admin@cappalove.com / admin123 ile giriş yapabilirsiniz.'); 