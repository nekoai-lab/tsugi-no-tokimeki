import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db, appId } from './firebase';

export async function addLike(postId: string, uid: string) {
  const postRef = doc(db, 'artifacts', appId, 'public', 'data', 'posts', postId);
  await updateDoc(postRef, { likes: arrayUnion(uid) });
}

export async function removeLike(postId: string, uid: string) {
  const postRef = doc(db, 'artifacts', appId, 'public', 'data', 'posts', postId);
  await updateDoc(postRef, { likes: arrayRemove(uid) });
}
