import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

export interface CommonContent {
  id: string;
  name: string;
  type: string;
  price: number;
  imageUrl?: string;
  description?: string;
  duration?: string;
  notes?: string;
}

const APP_ID = 'robot-school-booking-v4';

export const useCommonContents = () => {
  const [contents, setContents] = useState<CommonContent[]>([]);
  const [loading, setLoading] = useState(true);

  // データのリアルタイム取得
  useEffect(() => {
    const docRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'config', 'common_contents');
    
    const unsubscribe = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        setContents(snap.data().contents || []);
      } else {
        setContents([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // データの保存（配列ごと上書き）
  const saveContents = async (newContents: CommonContent[]) => {
    const docRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'config', 'common_contents');
    await setDoc(docRef, { contents: newContents });
  };

  return { contents, loading, saveContents };
};