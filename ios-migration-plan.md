# AI LOVVE iOS Native App Migration Plan

## 🎯 Hedef
Mevcut React web uygulamasını React Native ile iOS native app'e dönüştürme

## 📋 Migration Stratejisi

### Adım 1: React Native Proje Kurulumu
```bash
# Proje oluşturma (macOS'ta)
npx react-native init AILovveIOS --template typescript
cd AILovveIOS

# iOS gereksinimler
# Xcode 12+ gerekli
# CocoaPods kurulu olmalı
sudo gem install cocoapods
```

### Adım 2: Temel Dependencies
```bash
# Firebase
npm install @react-native-firebase/app @react-native-firebase/auth @react-native-firebase/firestore

# Navigation
npm install @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs
npm install react-native-screens react-native-safe-area-context

# UI Components
npm install react-native-vector-icons
npm install react-native-linear-gradient
npm install react-native-toast-message

# Gemini AI
npm install @google/generative-ai

# iOS specific
cd ios && pod install
```

### Adım 3: Mevcut Kodların Adaptasyonu

#### 3.1 Firebase Configuration
```typescript
// firebase.config.ts (React Native versiyonu)
import firebase from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

const firebaseConfig = {
  // iOS için ayrı config
  apiKey: "your-ios-api-key",
  authDomain: "ailovve.firebaseapp.com",
  projectId: "ailovve",
  // ...diğer ayarlar
};

export { auth, firestore };
```

#### 3.2 Components Migration
Mevcut components'ları React Native'e adapt etmek:

**Web → React Native Mapping:**
- `div` → `View`
- `span/p` → `Text`
- `input` → `TextInput`
- `button` → `TouchableOpacity`
- CSS classes → StyleSheet

#### 3.3 Auth System
```typescript
// authService.native.ts
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

class AuthService {
  async login(email: string, password: string) {
    return await auth().signInWithEmailAndPassword(email, password);
  }

  async register(email: string, password: string) {
    return await auth().createUserWithEmailAndPassword(email, password);
  }
}
```

### Adım 4: UI Adaptasyonu

#### 4.1 AuthPage Component
```tsx
// AuthPage.native.tsx
import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView
} from 'react-native';

const AuthPage = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.title}>AI LOVVE</Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
        />
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};
```

#### 4.2 Styling System
```typescript
// styles/colors.ts
export const colors = {
  primary: '#FF6B9D',
  secondary: '#FF8E8E',
  background: '#FFFFFF',
  text: '#000000',
};

// styles/common.ts
import { StyleSheet } from 'react-native';

export const commonStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  button: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 25,
    alignItems: 'center',
  },
});
```

### Adım 5: Platform-Specific Features

#### 5.1 iOS Native Features
```typescript
// ios/Features
- Push Notifications
- Face ID / Touch ID
- Native keyboard handling
- iOS design guidelines
- App Store compliance
```

#### 5.2 Native Modules (gerekirse)
```typescript
// Custom native modules for specific iOS features
- Camera integration
- Location services
- Native UI components
```

### Adım 6: Build & Deploy

#### 6.1 iOS Build
```bash
# Development build
npx react-native run-ios

# Production build
npx react-native build-ios --configuration Release
```

#### 6.2 App Store Preparation
```typescript
// Info.plist configurations
- App icons (all sizes)
- Launch screen
- Privacy permissions
- App Store metadata
```

## 🎯 Timeline Estimation

**Hızlı Migration (1-2 hafta):**
- Temel auth sistemi ✅
- Ana navigation ✅
- Chat functionality ✅
- Basit UI adaptation ✅

**Full Migration (3-4 hafta):**
- Tüm features ✅
- iOS optimizations ✅
- App Store ready ✅
- Testing & polish ✅

## 📱 Next Steps

1. **Xcode kurulumu** kontrol edin
2. **React Native development environment** hazırlayın
3. **Firebase iOS project** oluşturun
4. Migration'a başlayabiliriz!

Hangi adımdan başlamak istiyorsunuz?