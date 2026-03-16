import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
// ★修正1: 'import type' に変更する（型のみをインポートするという明示）
import type { AppUser } from '../../../hooks/useAuth'; 

const APP_ID = 'robot-school-booking-v4';

export const useUsers = () => {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const usersRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'users');

    const unsubscribe = onSnapshot(usersRef, (snap) => {
      const usersData = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as unknown as AppUser[]; 
      // ★修正2: 'as unknown as AppUser[]' にする（TypeScriptを納得させるため、一度unknownを経由する）
      
      setUsers(usersData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { users, loading };
};