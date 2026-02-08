import { initializeApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  connectAuthEmulator
} from 'firebase/auth';
import {
  getFirestore,
  connectFirestoreEmulator
} from 'firebase/firestore';
import {
  getStorage,
  connectStorageEmulator
} from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'demo-api-key',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'demo-project.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'demo-project',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'demo-project.appspot.com',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '000000000000',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || 'demo-app-id',
};

// デバッグ: Firebase設定の確認（本番では削除）
if (typeof window !== 'undefined') {
  console.log('🔧 Firebase Config Check:', {
    apiKeyHead: firebaseConfig.apiKey?.slice(0, 4) + '...',
    authDomain: firebaseConfig.authDomain,
    projectId: firebaseConfig.projectId,
    isDemo: firebaseConfig.apiKey === 'demo-api-key',
  });
}

// Initialize Firebase only once
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const appId = 'tsugi-no-tokimeki';

/**
 * Emulator接続の判定
 * - 環境変数 NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true が設定されている
 * - かつ、ホスト名が localhost または 127.0.0.1 の場合のみ接続
 * - ngrokなどの外部ドメインからは本番Firebaseに接続
 */
function shouldUseEmulator(): boolean {
  if (typeof window === 'undefined') return false;
  
  const envEnabled = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true';
  const hostname = window.location.hostname;
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
  
  return envEnabled && isLocalhost;
}

// Connect to Emulators if enabled and running on localhost
let emulatorsConnected = false;
if (typeof window !== 'undefined' && shouldUseEmulator() && !emulatorsConnected) {
  try {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
    connectStorageEmulator(storage, '127.0.0.1', 9199);
    emulatorsConnected = true;
    console.log('🔥 Firebase Emulators connected (localhost only)');
  } catch (e) {
    // Already connected
    console.log('Emulators already connected');
  }
} else if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
  console.log('📡 Using production Firebase (non-localhost access detected)');
}

