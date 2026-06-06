 # 💊 MediScan - AI Medicine Scanner App

A comprehensive mobile application that uses AI to scan, analyze, and provide detailed information about medicines. Built with React Native, Expo, Firebase, and Groq AI.

## 🌟 Features

### Core Features
- **📷 Medicine Scanner** - Full-screen camera scanner with PhonePay-style UI
- **🔍 Image Recognition** - Scan medicine strips, boxes, and tablets
- **🧠 AI Analysis** - Get detailed medicine information using Groq AI
- **🔊 Voice Output** - Listen to medicine information in Telugu, Hindi, or English
- **💾 Scan History** - Save and view all scanned medicines

### Safety Features
- **👨‍👩‍👧 Family Profiles** - Add family members with health conditions
- **⚠️ Safety Warnings** - Get alerts if medicine is unsafe for family members
- **💊 Drug Interaction Checker** - Check if two medicines can be taken together
- **⚖️ Medicine Comparison** - Compare two medicines side-by-side

### User Features
- **🌐 Multi-Language Support** - English, Telugu, Hindi
- **🏪 Nearby Pharmacy Finder** - Find pharmacies near you with distance and ratings
- **⚙️ Settings** - Customize language preferences
- **👤 User Authentication** - Secure login with Email/Google Sign-In
- **☁️ Cloud Backup** - All data synced with Firebase

## 🛠️ Tech Stack

### Frontend
- **React Native** - Mobile app framework
- **Expo** - Development platform
- **TypeScript** - Type safety
- **React Router** - Navigation

### Backend & Services
- **Firebase** - Authentication & Database (Firestore)
- **Groq AI** - Medicine analysis using LLaMA models
- **Google Places API** - Pharmacy location services
- **Web Speech API** - Text-to-speech for medicine information

### Additional Libraries
- `expo-camera` - Camera functionality
- `expo-image-picker` - Photo library access
- `expo-location` - Location services
- `expo-speech` - Voice output
- `react-native-async-storage` - Local data storage

## 📋 Prerequisites

Before starting, ensure you have:
- Node.js (v14 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Android Studio (for Android development)
- Firebase account
- Groq API key
- Google Cloud Console access (for Places API)

## 🚀 Installation

### Step 1: Clone Repository
```bash
git clone https://github.com/YOUR_USERNAME/MediScan.git
cd MediScan
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Install Expo Packages
```bash
npx expo install expo-camera expo-image-picker expo-location expo-speech expo-notifications
```

### Step 4: Setup Firebase

1. Create Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Create `src/firebaseConfig.ts`:
```typescript
import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getReactNativePersistence } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});
```

### Step 5: Setup API Keys

Add your API keys to respective files:

**For Groq AI** (in `src/app/index.tsx` and `src/app/scanner.tsx`):
```typescript
const GROQ_API_KEY = 'YOUR_GROQ_API_KEY';
```

**For Google Places** (in `src/app/nearby-pharmacies.tsx`):
```typescript
const GOOGLE_PLACES_API_KEY = 'YOUR_GOOGLE_PLACES_API_KEY';
```

**For Google OAuth** (in `src/app/index.tsx`):
```typescript
const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID';
```

### Step 6: Setup .gitignore
```bash
# Create .gitignore in project root
echo "node_modules/
.expo/
.env
.env.local
firebaseConfig.ts
dist/" > .gitignore
```

## 📱 Running the App

### Development
```bash
npx expo start
```

### On Android Emulator
```bash
npx expo start
# Then press 'a' in terminal
```

### On Physical Phone
```bash
npx expo start
# Scan QR code with Expo Go app
```

### Web
```bash
npx expo start
# Then press 'w' in terminal
```

## 📚 Project Structure

```
MediScan/
├── src/
│   ├── app/
│   │   ├── _layout.tsx           # Navigation setup
│   │   ├── index.tsx             # Home + Login screens
│   │   ├── scanner.tsx           # Full-screen camera scanner
│   │   ├── history.tsx           # Scan history
│   │   ├── profiles.tsx          # Family profiles
│   │   ├── comparison.tsx        # Medicine comparison
│   │   ├── interaction.tsx       # Drug interaction checker
│   │   ├── nearby-pharmacies.tsx # Pharmacy finder
│   │   └── settings.tsx          # Language settings
│   ├── firebaseConfig.ts         # Firebase configuration
│   └── components/               # Reusable components
├── .gitignore
├── app.json
├── package.json
├── tsconfig.json
└── README.md
```

## 🎯 How to Use

### 1. Login/Signup
- Create account with email or sign in with Google
- Complete profile information

### 2. Scan Medicine
- Tap the **🔍 Scanner** button in the middle of bottom nav
- Take photo or choose from gallery
- AI will identify and analyze the medicine
- View detailed information with voice option

### 3. Add Family Members
- Go to **Family** tab
- Add family members with health conditions
- When scanning medicines, get safety alerts

### 4. Check Drug Interactions
- Go to **Interaction** tab
- Enter two medicine names
- Get safety information about taking them together

### 5. Compare Medicines
- Go to **Compare** tab
- Enter two medicine names
- Get detailed comparison with recommendations

### 6. Find Pharmacies
- Go to **Pharmacy** tab
- Allow location access
- See nearby pharmacies with ratings and distance

### 7. View History
- Go to **History** tab
- View all scanned medicines
- Delete entries as needed

## 🔐 Security

- **API Keys**: Never commit API keys to GitHub
- **Firebase**: Use `.gitignore` to exclude `firebaseConfig.ts`
- **Environment Variables**: Use `.env` files for sensitive data
- **Authentication**: User data is encrypted in Firebase

## 🚀 Deployment

### Build APK for Android
```bash
eas build --platform android
```

### Build AAB for Play Store
```bash
eas build --platform android --release
```

### Publish to Play Store
1. Create Google Play Developer account
2. Create app listing
3. Upload signed APK/AAB
4. Complete store details
5. Submit for review

## 📖 API Documentation

### Groq AI API
- **Endpoint**: `https://api.groq.com/openai/v1/chat/completions`
- **Model**: `llama-3.3-70b-versatile` (analysis), `llama-4-scout` (vision)
- **Docs**: [Groq Console](https://console.groq.com)

### Google Places API
- **Endpoint**: `https://maps.googleapis.com/maps/api/place/nearbysearch/json`
- **Docs**: [Google Places API](https://developers.google.com/maps/documentation/places/web-service)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📝 License

This project is licensed under the MIT License - see LICENSE file for details.

## 👨‍💻 Author

**Your Name**
- GitHub: [@Balajimakkena](https://github.com/Balajimakkena)

## 🙏 Acknowledgments

- Groq AI for powerful medicine analysis
- Firebase for backend infrastructure
- Expo for excellent React Native tooling
- React Native community

## 📧 Support

For support, email your-email@example.com or create an issue in the repository.

## 🔄 Future Features

- [ ] Medicine reminders with notifications
- [ ] Fake medicine detection using barcode
- [ ] Doctor consultation chat
- [ ] Offline mode for common medicines
- [ ] Medicine prescription management
- [ ] Integration with health apps
- [ ] Medicine reviews and ratings

---

**Made with ❤️ for better healthcare**
