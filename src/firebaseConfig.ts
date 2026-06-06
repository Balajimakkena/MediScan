
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from 'firebase/app';
import {
  // @ts-expect-error
  getReactNativePersistence,
  // @ts-expect-error - getReactNativePersistence exists in the mobile bundle at runtime,
  // but the browser-default typings file flags it as an error during static analysis.
  initializeAuth
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

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

// Initialize Firebase Auth explicitly tailored for Expo & React Native environment
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

export default app;