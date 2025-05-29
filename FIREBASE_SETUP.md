# 🔥 Firebase Kurulum Rehberi

## 1. Firebase Console'da Proje Oluşturma

### Adım 1: Firebase Console'a Git
1. [Firebase Console](https://console.firebase.google.com/) adresine gidin
2. Google hesabınızla giriş yapın

### Adım 2: Yeni Proje Oluştur
1. **"Add project"** (Proje Ekle) butonuna tıklayın
2. Proje adını girin: `ai-lovve-backend`
3. Proje ID'sini kontrol edin (istediğiniz gibi değiştirebilirsiniz)
4. **Continue** butonuna tıklayın

### Adım 3: Google Analytics (İsteğe Bağlı)
1. Google Analytics'i aktifleştirmek isteyip istemediğinizi seçin
2. Eğer aktifleştirirseniz, mevcut bir hesap seçin veya yeni hesap oluşturun
3. **Create project** butonuna tıklayın

## 2. Authentication Kurulumu

### Adım 1: Authentication'ı Aktifleştir
1. Sol menüden **"Authentication"** seçin
2. **"Get started"** butonuna tıklayın

### Adım 2: Sign-in Method Ayarla
1. **"Sign-in method"** tabına gidin
2. **"Email/Password"** metodunu aktifleştirin
3. **"Enable"** toggle'ını açın
4. **Save** butonuna tıklayın

## 3. Service Account Key İndirme

### Adım 1: Project Settings'e Git
1. Sol üstteki ⚙️ (ayarlar) simgesine tıklayın
2. **"Project settings"** seçin

### Adım 2: Service Account Key İndir
1. **"Service accounts"** tabına gidin
2. **"Generate new private key"** butonuna tıklayın
3. JSON dosyasını indirin ve güvenli bir yerde saklayın
4. Bu dosyayı backend klasörüne `firebase-service-account.json` adıyla kaydedin

## 4. Web App Konfigürasyonu

### Adım 1: Web App Ekle
1. Project settings'de **"General"** tabında kalın
2. **"Your apps"** bölümünde **"Add app"** tıklayın
3. **Web** simgesini (</>) seçin
4. App nickname girin: `ai-lovve-frontend`
5. **"Register app"** tıklayın

### Adım 2: Config Kopyala
1. Firebase config objesini kopyalayın
2. Bu bilgileri .env dosyalarında kullanacağız

## 5. Firestore Database Kurulumu

### Adım 1: Firestore'u Aktifleştir
1. Sol menüden **"Firestore Database"** seçin
2. **"Create database"** butonuna tıklayın

### Adım 2: Security Rules
1. **"Start in test mode"** seçin (geliştirme için)
2. Location seçin (yakın bir lokasyon)
3. **"Done"** butonuna tıklayın

## 6. Environment Variables Ayarlama

### Backend (.env)
Service account JSON dosyasından aldığınız bilgilerle:

```env
FIREBASE_PROJECT_ID=ailovve
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour-private-key-here\n-----END PRIVATE KEY-----"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@ailovve.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_CLIENT_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40ailovve.iam.gserviceaccount.com
```

### Frontend (.env)
Web app config'den aldığınız bilgilerle:

```env
VITE_FIREBASE_API_KEY=your-web-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-firebase-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

### Admin Dashboard (.env)
Aynı web app config bilgileri.

## 7. İlk Admin Kullanıcısı Oluşturma

### Backend'i Başlatın:
```bash
cd backend
npm run dev
```

### Admin Kullanıcısı Oluştur:
```bash
curl -X POST http://localhost:3001/api/admin/setup-admin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@ailovve.com",
    "password": "admin123456",
    "displayName": "AI LOVVE Admin"
  }'
```

## 8. Test Etme

### Backend Test:
```bash
curl http://localhost:3001/api/health
```

### Firebase Auth Test:
Admin dashboard'da login olmayı deneyin:
- Email: admin@ailovve.com
- Password: admin123456

## 🚀 Firebase Başarıyla Kuruldu!

Artık Firebase Authentication sisteminiz hazır. Backend'inizde güvenli token doğrulama, frontend'inizde kullanıcı girişi ve admin dashboard'ında yönetim paneli çalışıyor.

### Önemli Notlar:
- Service account key dosyasını asla public repository'ye eklemeyin
- Production'da güçlü şifreler kullanın
- Firebase security rules'larını production'da güncelleyin
- Rate limiting ve monitoring ekleyin

## Sonraki Adımlar:
1. **Service Account Key İndirin:**
   - Firebase Console > Settings > Service Accounts
   - "Generate new private key" tıklayın
   - JSON dosyasını `backend/firebase-service-account.json` olarak kaydedin

2. **Backend .env dosyasını güncelleyin:**
   - Service account JSON'dan bilgileri kopyalayın
   - FIREBASE_* değişkenlerini doldurun

3. **Servisleri yeniden başlatın:**
   ```bash
   # Backend
   cd backend && npm run dev
   
   # Frontend  
   cd .. && npm run dev
   
   # Admin Dashboard
   cd admin-dashboard && npm run dev
   ```

4. **Firebase auth entegrasyonu test edin**
5. **Production security rules'larını ayarlayın**
6. **Monitoring ve logging ekleyin** 