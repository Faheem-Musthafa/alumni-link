import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  QueryConstraint,
  DocumentData,
  Timestamp,
  serverTimestamp,
  WriteBatch,
  writeBatch
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";

export class FirestoreError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = "FirestoreError";
  }
}

const ensureDb = () => {
  if (!db) {
    throw new FirestoreError("Firestore is not initialized");
  }
  return db;
};

export async function getDocument<T = DocumentData>(
  collectionName: string,
  documentId: string
): Promise<T | null> {
  try {
    const database = ensureDb();
    const docRef = doc(database, collectionName, documentId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as T;
    }
    return null;
  } catch (error) {
    console.error(`Error getting document from ${collectionName}:`, error);
    throw new FirestoreError(
      `Failed to get document from ${collectionName}`,
      (error as any).code
    );
  }
}

export async function getDocuments<T = DocumentData>(
  collectionName: string,
  constraints: QueryConstraint[] = []
): Promise<T[]> {
  try {
    const database = ensureDb();
    const collectionRef = collection(database, collectionName);
    const q = constraints.length > 0 
      ? query(collectionRef, ...constraints) 
      : collectionRef;
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as T[];
  } catch (error) {
    console.error(`Error getting documents from ${collectionName}:`, error);
    throw new FirestoreError(
      `Failed to get documents from ${collectionName}`,
      (error as any).code
    );
  }
}

export async function createDocument<T = DocumentData>(
  collectionName: string,
  data: Partial<T>
): Promise<string> {
  try {
    const database = ensureDb();
    const collectionRef = collection(database, collectionName);
    const docData = {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    const docRef = await addDoc(collectionRef, docData);
    return docRef.id;
  } catch (error) {
    console.error(`Error creating document in ${collectionName}:`, error);
    throw new FirestoreError(
      `Failed to create document in ${collectionName}`,
      (error as any).code
    );
  }
}

export async function updateDocument<T = DocumentData>(
  collectionName: string,
  documentId: string,
  data: Partial<T>
): Promise<void> {
  try {
    const database = ensureDb();
    const docRef = doc(database, collectionName, documentId);
    const updateData = {
      ...data,
      updatedAt: serverTimestamp(),
    };
    
    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error(`Error updating document in ${collectionName}:`, error);
    throw new FirestoreError(
      `Failed to update document in ${collectionName}`,
      (error as any).code
    );
  }
}

export async function deleteDocument(
  collectionName: string,
  documentId: string
): Promise<void> {
  try {
    const database = ensureDb();
    const docRef = doc(database, collectionName, documentId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error(`Error deleting document from ${collectionName}:`, error);
    throw new FirestoreError(
      `Failed to delete document from ${collectionName}`,
      (error as any).code
    );
  }
}

export async function batchUpdate(
  updates: Array<{
    collectionName: string;
    documentId: string;
    data: Partial<DocumentData>;
  }>
): Promise<void> {
  try {
    const database = ensureDb();
    const batch = writeBatch(database);
    
    updates.forEach(({ collectionName, documentId, data }) => {
      const docRef = doc(database, collectionName, documentId);
      batch.update(docRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });
    });
    
    await batch.commit();
  } catch (error) {
    console.error("Error performing batch update:", error);
    throw new FirestoreError(
      "Failed to perform batch update",
      (error as any).code
    );
  }
}

export async function queryDocuments<T = DocumentData>(
  collectionName: string,
  field: string,
  operator: any,
  value: any,
  options?: {
    orderByField?: string;
    orderDirection?: "asc" | "desc";
    limitCount?: number;
  }
): Promise<T[]> {
  try {
    const database = ensureDb();
    const collectionRef = collection(database, collectionName);
    const constraints: QueryConstraint[] = [where(field, operator, value)];
    
    if (options?.orderByField) {
      constraints.push(orderBy(options.orderByField, options.orderDirection || "asc"));
    }
    
    if (options?.limitCount) {
      constraints.push(limit(options.limitCount));
    }
    
    const q = query(collectionRef, ...constraints);
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as T[];
  } catch (error) {
    console.error(`Error querying documents from ${collectionName}:`, error);
    throw new FirestoreError(
      `Failed to query documents from ${collectionName}`,
      (error as any).code
    );
  }
}
