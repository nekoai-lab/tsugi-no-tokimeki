import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, appId } from './firebase';

/**
 * プロフィールアイコンをアップロード
 */
export async function uploadProfileIcon(
  userId: string,
  file: File
): Promise<string> {
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `profile-icons/${userId}/${timestamp}_${safeName}`;
  const storageRef = ref(storage, storagePath);

  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

/**
 * プロフィールを更新
 */
export async function updateProfile(
  userId: string,
  data: {
    displayName?: string;
    handle?: string;
    photoUrl?: string;
    lineUserId?: string;
  }
): Promise<void> {
  const profileRef = doc(db, 'artifacts', appId, 'users', userId, 'profile', 'main');
  await setDoc(profileRef, {
    ...data,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

