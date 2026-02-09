import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, appId } from './firebase';
import type { StickerAlbumPost } from './types';

function getCollectionRef() {
  return collection(db, 'artifacts', appId, 'public', 'data', 'stickerAlbumPosts');
}

export async function uploadStickerImage(
  userId: string,
  file: File
): Promise<string> {
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `sticker-album/${userId}/${timestamp}_${safeName}`;
  const storageRef = ref(storage, storagePath);

  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

export async function createStickerAlbumPost(
  userId: string,
  imageUrl: string,
  caption?: string,
  authorUid?: string
): Promise<string> {
  const docRef = await addDoc(getCollectionRef(), {
    userId,
    authorUid: authorUid || userId, // canonicalUid（なければuserIdをフォールバック）
    imageUrl,
    caption: caption || '',
    likes: [],
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export function subscribeStickerAlbumPosts(
  callback: (posts: StickerAlbumPost[]) => void
): () => void {
  const q = query(getCollectionRef(), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const posts = snapshot.docs.map(d => ({
      id: d.id,
      ...d.data(),
    } as StickerAlbumPost));
    callback(posts);
  });
}

export async function deleteStickerAlbumPost(postId: string): Promise<void> {
  const postRef = doc(db, 'artifacts', appId, 'public', 'data', 'stickerAlbumPosts', postId);
  await deleteDoc(postRef);
}

export async function addLikeToStickerPost(postId: string, uid: string): Promise<void> {
  const postRef = doc(db, 'artifacts', appId, 'public', 'data', 'stickerAlbumPosts', postId);
  await updateDoc(postRef, {
    likes: arrayUnion(uid),
  });
}

export async function removeLikeFromStickerPost(postId: string, uid: string): Promise<void> {
  const postRef = doc(db, 'artifacts', appId, 'public', 'data', 'stickerAlbumPosts', postId);
  await updateDoc(postRef, {
    likes: arrayRemove(uid),
  });
}
