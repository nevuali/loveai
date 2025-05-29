# 🔥 AI LOVVE - Firebase Entegrasyonu

## Neden Firebase?

Firebase Authentication, güvenli ve ölçeklenebilir bir authentication sistemi sağlar:

- ✅ **Güvenlik**: JWT token tabanlı auth
- ✅ **Ölçeklenebilirlik**: Google altyapısı
- ✅ **Kolay Yönetim**: Firebase Console
- ✅ **Multi-platform**: Web, mobile, backend

## Kurulum Adımları

### 1. 🎯 Firebase Projesi Hazır
Proje bilgileri:
- **Project ID**: `ailovve`
- **Project Name**: `ai-lovve-backend`
- **Web API Key**: `AIzaSyAtKZbqm_hBqsiICk3zarhP2KTlFMZPbFY`

### 2. 🔐 Service Account Key İndirin
1. [Firebase Console](https://console.firebase.google.com/project/ailovve/settings/serviceaccounts/adminsdk) > Settings > Service Accounts
2. **"Generate new private key"** tıklayın
3. JSON dosyasını `backend/firebase-service-account.json` olarak kaydedin

### 3. 🔧 Environment Variables
Dosyalar zaten hazır:
- ✅ `backend/.env`
- ✅ `.env` (frontend)
- ✅ `admin-dashboard/.env`

### 4. 🚀 Servisleri Başlatın
```bash
# Backend (Port 3001)
cd backend && npm run dev

# Frontend (Port 8080)  
cd .. && npm run dev

# Admin Dashboard (Port 3002)
cd admin-dashboard && npm run dev
```

### 5. 👤 İlk Admin Kullanıcısını Oluşturun
```bash
curl -X POST http://localhost:3001/api/admin/setup-admin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@ailovve.com",
    "password": "admin123456",
    "displayName": "AI LOVVE Admin"
  }'
```

## 🎮 Kullanım

### Admin Dashboard Login:
- URL: `http://localhost:3002/login`
- Email: `admin@ailovve.com`
- Password: `admin123456`

### API Endpoints:
- Backend: `http://localhost:3001/api/`
- Health: `http://localhost:3001/api/health`
- Docs: `http://localhost:3001/api-docs`

### Frontend App:
- URL: `http://localhost:8080`

## 🔒 Güvenlik

Firebase Authentication sağlar:
- JWT token doğrulama
- Custom claims (admin roller)
- Secure session yönetimi
- Rate limiting

## 🛠 Troubleshooting

### Service Account Key Hatası
```
❌ Firebase initialization error: Firebase credentials not found
```
**Çözüm**: `backend/firebase-service-account.json` dosyasını oluşturun

### Port Çakışması
```
❌ Error: Port 3002 is already in use
```
**Çözüm**: `killall node` ile tüm node processlerini kapatın

### Firebase Token Hatası
```
❌ Invalid Firebase token
```
**Çözüm**: Admin dashboard'da yeniden login olun

## 📝 Notlar

- Firebase service account key'i `.gitignore`'da
- Production'da environment variables kullanın
- Admin claims otomatik set edilir
- Backup authentication sistemi yok (sadece Firebase) 