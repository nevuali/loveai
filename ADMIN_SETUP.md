# Admin Kullanıcı Oluşturma Rehberi

Bu dokümanda AI LOVVE uygulamasına admin kullanıcı ekleme yöntemlerini bulacaksınız.

## Yöntem 1: Browser Console (Tavsiye Edilen)

1. Uygulamayı tarayıcıda açın (`npm run dev`)
2. F12 ile Developer Tools'u açın
3. Console sekmesine gidin
4. Aşağıdaki komutları kullanın:

### Yeni admin kullanıcı oluştur:
```javascript
// Yeni admin kullanıcı oluştur
adminHelper.createAdminUser('admin@example.com', 'admin123', 'Admin User')
```

### Mevcut kullanıcını admin yap:
```javascript
// Önce giriş yap, sonra admin yap
adminHelper.makeCurrentUserAdmin()
```

### Mevcut kullanıcı bilgilerini görüntüle:
```javascript
// Kullanıcı bilgilerini ve rolünü kontrol et
adminHelper.getCurrentUserInfo()
```

## Yöntem 2: Node.js Script

```bash
# Admin oluştur
node create-admin-user.js create admin@example.com admin123 "Admin User"

# Mevcut kullanıcıyı admin yap (UID ile)
node create-admin-user.js promote USER_UID
```

## Adım Adım İlk Admin Oluşturma

1. **Uygulamayı başlat:**
   ```bash
   npm run dev
   ```

2. **Tarayıcıda uygulamayı aç:** http://localhost:3000

3. **Console'u aç:** F12 > Console

4. **Admin kullanıcı oluştur:**
   ```javascript
   adminHelper.createAdminUser('admin@ailovve.com', 'admin123456', 'Super Admin')
   ```

5. **Başarı mesajını bekle** ve oluşturulan kullanıcı bilgilerini kaydet

6. **Uygulamadan çıkış yap** (Settings > Logout)

7. **Admin hesabıyla giriş yap:**
   - Email: admin@ailovve.com
   - Password: admin123456

8. **Admin Dashboard'a git:** `/admin` endpoint'ine git

## Güvenlik Notları

- Admin şifrelerini güçlü tutun
- Geliştirme ortamında test ettikten sonra production'da güvenli şifreler kullanın
- Admin rolü sadece güvenilir kişilere verilmeli
- Gereksiz admin hesapları düzenli olarak temizlenmeli

## Troubleshooting

### "Access denied" hatası alıyorsanız:
1. Console'da `adminHelper.getCurrentUserInfo()` çalıştırın
2. Kullanıcının `role: 'admin'` ve `isAdmin: true` değerlerine sahip olduğunu kontrol edin
3. Sayfayı yenileyin ve tekrar deneyin

### Firebase bağlantı hatası:
1. `.env` dosyasında Firebase config'in doğru olduğunu kontrol edin
2. Firebase Authentication'ın aktif olduğunu kontrol edin
3. Firestore kurallarının yazma izni verdiğini kontrol edin

### Kullanıcı oluşturma hatası:
- Email zaten kullanımda olabilir
- Şifre en az 6 karakter olmalı
- Internet bağlantınızı kontrol edin

## Firestore Veri Yapısı

Admin kullanıcılar Firestore'da şu yapıda saklanır:

```javascript
users/{uid}: {
  uid: string,
  email: string,
  name: string,
  role: 'admin',
  isAdmin: true,
  permissions: [
    'packages:read',
    'packages:write', 
    'packages:delete',
    'users:read',
    'users:write',
    'users:delete',
    'analytics:read'
  ],
  createdAt: timestamp,
  updatedAt: timestamp
}
```