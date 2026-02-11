import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { db, appId } from './firebase';
import type { UserProfile } from './types';

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

/**
 * ユーザープロフィールを取得
 * @param uid ユーザーID
 * @returns UserProfile または null
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const profileRef = doc(db, 'artifacts', appId, 'users', uid, 'profile', 'main');
  const profileSnap = await getDoc(profileRef);
  if (profileSnap.exists()) {
    return profileSnap.data() as UserProfile;
  }
  return null;
}

/**
 * lineUserIdで既存ユーザーを検索
 * line_usersコレクションから検索
 * @param lineUserId LINE User ID
 * @returns 見つかった場合は { uid, profile }、なければ null
 */
export async function findUserByLineUserId(lineUserId: string): Promise<{
  uid: string;
  profile: UserProfile;
} | null> {
  // まずline_usersコレクションから検索
  const lineUserRef = doc(db, 'artifacts', appId, 'line_users', lineUserId);
  const lineUserDoc = await getDoc(lineUserRef);

  if (lineUserDoc.exists()) {
    const canonicalUid = lineUserDoc.data().uid;
    const profile = await getUserProfile(canonicalUid);
    if (profile) {
      return { uid: canonicalUid, profile };
    }
  }

  return null;
}

/**
 * LINE連携を実行
 * 1. line_usersに登録（既存があればそのuidを使用）
 * 2. 現在のuidのプロフィールにlineUserIdを保存
 * 3. 既存ユーザーのプロフィールがあれば現在のuidにコピー
 * 
 * @param currentUid 現在のFirebase匿名認証uid
 * @param lineUserId LINE User ID
 * @param lineDisplayName LINEの表示名（任意）
 * @returns 連携後のプロフィール
 */
export async function linkLineAccount(
  currentUid: string,
  lineUserId: string,
  lineDisplayName?: string
): Promise<UserProfile | null> {
  // 1. 既存のLINE連携ユーザーを検索
  const existingUser = await findUserByLineUserId(lineUserId);

  // 2. line_usersコレクションに登録（なければ作成）
  const lineUserRef = doc(db, 'artifacts', appId, 'line_users', lineUserId);
  const lineUserDoc = await getDoc(lineUserRef);

  if (!lineUserDoc.exists()) {
    // 新規登録: 現在のuidをcanonicalUidとして設定
    await setDoc(lineUserRef, {
      uid: currentUid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  // 3. 現在のuidのプロフィールを更新
  const profileRef = doc(db, 'artifacts', appId, 'users', currentUid, 'profile', 'main');
  const currentProfile = await getDoc(profileRef);

  if (existingUser && existingUser.uid !== currentUid) {
    // 既存ユーザーのプロフィールを現在のuidにコピー
    const mergedProfile: Partial<UserProfile> = {
      ...existingUser.profile,
      lineUserId,
      updatedAt: serverTimestamp() as any,
    };
    await setDoc(profileRef, mergedProfile, { merge: true });

    // line_usersのuidを現在のuidに更新
    await setDoc(lineUserRef, {
      uid: currentUid,
      updatedAt: serverTimestamp(),
    }, { merge: true });

    return mergedProfile as UserProfile;
  } else {
    // 新規または同一uidの場合: lineUserIdだけ保存
    const updateData: Partial<UserProfile> = {
      lineUserId,
      updatedAt: serverTimestamp() as any,
    };

    // LINEの表示名があり、displayNameが未設定なら設定
    if (lineDisplayName && !currentProfile.data()?.displayName) {
      updateData.displayName = lineDisplayName;
    }

    await setDoc(profileRef, updateData, { merge: true });

    const updatedProfile = await getDoc(profileRef);
    return updatedProfile.data() as UserProfile;
  }
}

