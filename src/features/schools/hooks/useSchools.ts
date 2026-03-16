import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../../lib/firebase'; // firebase.tsのパスに合わせて調整してください

// 校舎データの型定義
export interface School {
  id: string;
  name: string;
}

export const useSchools = () => {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // コレクションのパスはご自身の環境に合わせてください
    // （既存のadmin.jsでは 'artifacts', appId, 'public', 'data', 'schools' となっていました）
    const schoolsRef = collection(db, 'artifacts', 'robot-school-booking-v4', 'public', 'data', 'schools');
    
    // onSnapshotでリアルタイムにデータを監視
    const unsubscribe = onSnapshot(schoolsRef, (snap) => {
      const schoolData = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as School[];
      
      setSchools(schoolData);
      setLoading(false);
    });

    // コンポーネントが破棄されたときに監視を解除（メモリリーク防止）
    return () => unsubscribe();
  }, []);

  return { schools, loading };
};