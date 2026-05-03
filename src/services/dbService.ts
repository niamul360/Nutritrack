import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  deleteDoc, 
  doc, 
  serverTimestamp, 
  onSnapshot,
  orderBy
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { FoodEntry, OperationType, FirestoreErrorInfo } from '../types';

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function addFoodEntry(entry: Omit<FoodEntry, 'id' | 'userId' | 'timestamp'>) {
  const userId = auth.currentUser?.uid;
  if (!userId) throw new Error("User not authenticated");

  const path = 'foodEntries';
  try {
    const docRef = await addDoc(collection(db, path), {
      ...entry,
      userId,
      timestamp: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteFoodEntry(entryId: string) {
  const path = `foodEntries/${entryId}`;
  try {
    await deleteDoc(doc(db, 'foodEntries', entryId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeToDailyLogs(date: string, callback: (entries: FoodEntry[]) => void) {
  const userId = auth.currentUser?.uid;
  if (!userId) return () => {};

  const path = 'foodEntries';
  const q = query(
    collection(db, path),
    where('userId', '==', userId),
    where('date', '==', date),
    orderBy('timestamp', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const entries = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as FoodEntry[];
    callback(entries);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, path);
  });
}

export async function getMonthlyAverage(userId: string) {
  const path = 'foodEntries';
  const q = query(
    collection(db, path),
    where('userId', '==', userId),
    orderBy('date', 'desc')
  );

  try {
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(d => d.data());
    // Basic aggregation
    return data;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}
