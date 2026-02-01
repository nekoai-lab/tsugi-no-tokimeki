import { initializeApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  connectAuthEmulator
} from 'firebase/auth';
import { 
  getFirestore, 
  connectFirestoreEmulator
} from 'firebase/firestore';

const USE_EMULATOR = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'demo-api-key',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'demo-project.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'demo-project',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'demo-project.appspot.com',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '000000000000',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || 'demo-app-id',
};

// Initialize Firebase only once
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export const db = getFirestore(app);
export const appId = 'tsugi-no-tokimeki';

// Connect to Emulators if enabled
let emulatorsConnected = false;
if (USE_EMULATOR && typeof window !== 'undefined' && !emulatorsConnected) {
  try {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
    emulatorsConnected = true;
    console.log('🔥 Firebase Emulators connected');
  } catch (e) {
    // Already connected
    console.log('Emulators already connected');
  }
}

