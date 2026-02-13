import { doc, setDoc, deleteDoc, collection, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db, appId } from './firebase';

/**
 * 投稿をピン留めする
 */
export async function pinPost(userId: string, postId: string) {
  const pinRef = doc(db, 'artifacts', appId, 'users', userId, 'pinnedPosts', postId);
  await setDoc(pinRef, {
    postId,
    pinnedAt: serverTimestamp(),
  });
}

/**
 * 投稿のピン留めを解除する
 */
export async function unpinPost(userId: string, postId: string) {
  const pinRef = doc(db, 'artifacts', appId, 'users', userId, 'pinnedPosts', postId);
  await deleteDoc(pinRef);
}

/**
 * ピン留めされた投稿IDをリアルタイム購読する
 */
export function subscribePinnedPosts(
  userId: string,
  callback: (postIds: string[]) => void
): () => void {
  const pinnedRef = collection(db, 'artifacts', appId, 'users', userId, 'pinnedPosts');
  
  return onSnapshot(pinnedRef, (snapshot) => {
    const postIds = snapshot.docs.map(doc => doc.data().postId as string);
    callback(postIds);
  });
}
