import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db, APP_ID } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

// ユーザーの型定義
export interface AppUser {
  id?: string;
  uid: string;
  email: string | null;
  role: 'global' | 'school';
  name: string;
  assignedSchoolId?: string | null;
}

export const useAuth = () => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Firestoreから権限情報を取得
        const userDoc = await getDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          setUser({ uid: firebaseUser.uid, email: firebaseUser.email, ...userDoc.data() } as AppUser);
        } else {
          // 初期管理者登録などのロジック（必要に応じて）
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { user, loading };
};