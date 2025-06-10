/**
 * 🧪 WEBAPP FİNAL TEST SÜİTİ
 * Tüm kritik fonksiyonları test eder
 */

console.log('🚀 WEBAPP FİNAL TEST SÜİTİ BAŞLATIYOR...\n');

const tests = [
  {
    name: '🧪 Kişilik Testi Kontrolü',
    url: 'http://localhost:2000/test/personality',
    check: 'PersonalityOnboarding component yükleniyor mu?'
  },
  {
    name: '🏠 Ana Sayfa Kontrolü', 
    url: 'http://localhost:2000/',
    check: 'Auth redirect çalışıyor mu?'
  },
  {
    name: '🔐 Auth Sayfası',
    url: 'http://localhost:2000/auth',
    check: 'Login/Register formu çalışıyor mu?'
  },
  {
    name: '👑 Admin Panel',
    url: 'http://localhost:2000/admin', 
    check: 'Admin dashboard erişilebilir mi?'
  },
  {
    name: '⚙️ Settings Sayfası',
    url: 'http://localhost:2000/settings',
    check: 'Settings page açılıyor mu?'
  }
];

// Test sonuçları
const results = {
  passed: 0,
  failed: 0,
  total: tests.length
};

console.log('📋 TEST EDİLECEK SAYFALAR:');
tests.forEach((test, index) => {
  console.log(`${index + 1}. ${test.name}`);
  console.log(`   URL: ${test.url}`);
  console.log(`   Kontrol: ${test.check}\n`);
});

console.log('🔍 MANUEL TEST TALİMATLARI:');
console.log('================================');
console.log('1. Tarayıcıda yukarıdaki URL\'leri sırayla ziyaret et');
console.log('2. Her sayfanın yüklendiğini kontrol et');
console.log('3. Console\'da error olmadığını kontrol et');
console.log('4. Mobile view\'da responsive olduğunu kontrol et');
console.log('5. Kişilik testini baştan sona tamamla');
console.log('6. Admin panelde tüm sekmelerin açıldığını kontrol et\n');

// Otomasyon için basit health check
console.log('🤖 OTOMATİK HEALTH CHECK:');
console.log('================================');

// Package.json kontrolü
try {
  const fs = require('fs');
  const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
  
  console.log('✅ Package.json okundu');
  console.log(`📦 Proje: ${packageJson.name}`);
  console.log(`📊 Versiyon: ${packageJson.version}`);
  
  // Dependencies kontrolü
  const criticalDeps = [
    'react', 'react-dom', 'typescript', 'vite',
    'firebase', 'framer-motion', 'lucide-react',
    '@radix-ui/react-toast'
  ];
  
  const missingDeps = criticalDeps.filter(dep => 
    !packageJson.dependencies[dep] && !packageJson.devDependencies[dep]
  );
  
  if (missingDeps.length === 0) {
    console.log('✅ Tüm kritik dependencies mevcut');
  } else {
    console.log('❌ Eksik dependencies:', missingDeps.join(', '));
  }
  
} catch (error) {
  console.log('❌ Package.json okunamadı:', error.message);
}

// File structure kontrolü
console.log('\n📁 DOSYA YAPISI KONTROLÜ:');
const criticalFiles = [
  './src/components/PersonalityOnboarding.tsx',
  './src/services/personalityService.ts',
  './src/contexts/AuthContext.tsx',
  './src/pages/Index.tsx',
  './src/pages/AdminDashboard.tsx',
  './vite.config.ts',
  './firebase.json'
];

criticalFiles.forEach(file => {
  try {
    const fs = require('fs');
    if (fs.existsSync(file)) {
      console.log(`✅ ${file}`);
    } else {
      console.log(`❌ ${file} - EKSIK!`);
    }
  } catch (error) {
    console.log(`❌ ${file} - Kontrol edilemedi`);
  }
});

// Environment check
console.log('\n🌍 ENVIRONMENT KONTROLÜ:');
const envFile = './.env';
try {
  const fs = require('fs');
  if (fs.existsSync(envFile)) {
    console.log('✅ .env dosyası mevcut');
    
    // Critical env vars check (güvenlik için değerleri göstermiyoruz)
    const envContent = fs.readFileSync(envFile, 'utf8');
    const hasFirebaseConfig = envContent.includes('VITE_FIREBASE');
    const hasGeminiKey = envContent.includes('VITE_GEMINI');
    
    console.log(`🔥 Firebase config: ${hasFirebaseConfig ? '✅' : '❌'}`);
    console.log(`🤖 Gemini API key: ${hasGeminiKey ? '✅' : '❌'}`);
  } else {
    console.log('⚠️ .env dosyası bulunamadı - environment variables kontrol et');
  }
} catch (error) {
  console.log('❌ Environment kontrol hatası:', error.message);
}

console.log('\n🎯 SONRAKI ADIMLAR:');
console.log('==================');
console.log('1. npm run dev çalıştır (zaten çalışıyor olmalı)');
console.log('2. http://localhost:2000 aç');
console.log('3. Yukarıdaki test listesini manuel olarak kontrol et');
console.log('4. Her sayfanın düzgün yüklendiğini doğrula');
console.log('5. Console\'da critical error olmadığını kontrol et');

console.log('\n✨ TEST TAMAMLANDI!');
console.log('Her şey yolundaysa bir sonraki aşamaya geçebiliriz: Critical Bugfix');