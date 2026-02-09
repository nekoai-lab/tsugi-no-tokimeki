import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, appId } from './firebase';

/**
 * LINE User IDからcanonicalUidを取得または作成
 * line_users/{lineUserId} -> { uid: canonicalUid }
 */
export async function getOrCreateCanonicalUid(
  lineUserId: string,
  currentAuthUid: string
): Promise<string> {
  const lineUserRef = doc(db, 'artifacts', appId, 'line_users', lineUserId);
  const lineUserDoc = await getDoc(lineUserRef);

  if (lineUserDoc.exists()) {
    // 既存のcanonicalUidを返す
    return lineUserDoc.data().uid;
  }

  // 新規作成: currentAuthUidをcanonicalUidとして登録
  await setDoc(lineUserRef, {
    uid: currentAuthUid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return currentAuthUid;
}

/**
 * CanonicalUidを取得（投稿作成時に使用）
 * LIFF経由ならlineUserIdからcanonicalUidを取得
 * それ以外はauth.uidをそのまま使用
 */
export async function getCanonicalUid(
  currentAuthUid: string,
  lineUserId?: string | null
): Promise<string> {
  // lineUserIdがある場合はcanonicalUidを取得・作成
  if (lineUserId) {
    return getOrCreateCanonicalUid(lineUserId, currentAuthUid);
  }

  // lineUserIdがない場合は現在のauth.uidを使用
  return currentAuthUid;
}

