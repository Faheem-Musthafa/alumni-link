import { useState, useEffect, useCallback, useRef } from "react";
import { 
  collection, 
  query, 
  onSnapshot, 
  Query, 
  DocumentData,
  QueryConstraint 
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";

interface UseFirestoreCollectionOptions {
  constraints?: QueryConstraint[];
}

export function useFirestoreCollection<T = DocumentData>(
  collectionName: string,
  options: UseFirestoreCollectionOptions = {}
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const refresh = useCallback(() => {
    if (!db) {
      setError(new Error("Firestore not initialized"));
      setLoading(false);
      return;
    }

    try {
      const collectionRef = collection(db, collectionName);
      const q = options.constraints 
        ? query(collectionRef, ...options.constraints)
        : collectionRef;

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const docs = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as T[];
          setData(docs);
          setLoading(false);
          setError(null);
        },
        (err) => {
          console.error(`Error fetching ${collectionName}:`, err);
          setError(err as Error);
          setLoading(false);
        }
      );

      unsubscribeRef.current = unsubscribe;
    } catch (err) {
      setError(err as Error);
      setLoading(false);
    }
  }, [collectionName, options.constraints]);

  useEffect(() => {
    refresh();
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [refresh]);

  return { data, loading, error, refresh };
}
