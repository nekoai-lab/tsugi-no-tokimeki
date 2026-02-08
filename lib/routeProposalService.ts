import {
  collection,
  doc,
  addDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  getDocs,
  onSnapshot,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db, appId } from './firebase';
import type { RouteProposal, Shop } from './types';

/**
 * ルート提案を保存
 */
export async function saveRouteProposal(
  userId: string,
  data: {
    date: string;
    areas: string[];
    stickerType: string;
    stickerDesign: string;
    startTime: string;
    endTime: string;
    preferredShops: string[];
    shops: Shop[];
    totalTravelTime: number;
    supplementaryInfo?: string;
  }
): Promise<string> {
  const routeProposalsRef = collection(
    db,
    'artifacts',
    appId,
    'users',
    userId,
    'routeProposals'
  );

  const docRef = await addDoc(routeProposalsRef, {
    userId,
    ...data,
    confirmed: false,
    createdAt: serverTimestamp(),
  });

  return docRef.id;
}

/**
 * ルート提案を確定する
 */
export async function confirmRouteProposal(
  userId: string,
  proposalId: string
): Promise<void> {
  const proposalRef = doc(
    db,
    'artifacts',
    appId,
    'users',
    userId,
    'routeProposals',
    proposalId
  );

  await updateDoc(proposalRef, {
    confirmed: true,
  });
}

/**
 * ユーザーの全ルート提案を取得（一度だけ）
 */
export async function getRouteProposals(userId: string): Promise<RouteProposal[]> {
  const routeProposalsRef = collection(
    db,
    'artifacts',
    appId,
    'users',
    userId,
    'routeProposals'
  );

  const q = query(routeProposalsRef, orderBy('date', 'asc'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  } as RouteProposal));
}

/**
 * ユーザーのルート提案をリアルタイム購読
 */
export function subscribeRouteProposals(
  userId: string,
  callback: (proposals: RouteProposal[]) => void
): () => void {
  const routeProposalsRef = collection(
    db,
    'artifacts',
    appId,
    'users',
    userId,
    'routeProposals'
  );

  const q = query(routeProposalsRef, orderBy('date', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const proposals = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as RouteProposal));
    callback(proposals);
  });
}

/**
 * ルート提案を削除する
 */
export async function deleteRouteProposal(
  userId: string,
  proposalId: string
): Promise<void> {
  const proposalRef = doc(
    db,
    'artifacts',
    appId,
    'users',
    userId,
    'routeProposals',
    proposalId
  );

  await deleteDoc(proposalRef);
}

/**
 * 特定の日付のルート提案を取得
 */
export async function getRouteProposalByDate(
  userId: string,
  date: string
): Promise<RouteProposal | null> {
  const routeProposalsRef = collection(
    db,
    'artifacts',
    appId,
    'users',
    userId,
    'routeProposals'
  );

  const q = query(routeProposalsRef, where('date', '==', date));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return null;
  }

  const d = snapshot.docs[0];
  return {
    id: d.id,
    ...d.data(),
  } as RouteProposal;
}

/**
 * IDでルート提案を取得
 */
export async function getRouteProposalById(
  userId: string,
  proposalId: string
): Promise<RouteProposal | null> {
  const proposalRef = doc(
    db,
    'artifacts',
    appId,
    'users',
    userId,
    'routeProposals',
    proposalId
  );

  const docSnap = await getDoc(proposalRef);
  if (!docSnap.exists()) return null;

  return {
    id: docSnap.id,
    ...docSnap.data(),
  } as RouteProposal;
}

/**
 * ルート提案を上書き更新
 */
export async function updateRouteProposal(
  userId: string,
  proposalId: string,
  data: {
    shops: Shop[];
    totalTravelTime: number;
  }
): Promise<void> {
  const proposalRef = doc(
    db,
    'artifacts',
    appId,
    'users',
    userId,
    'routeProposals',
    proposalId
  );

  await updateDoc(proposalRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

