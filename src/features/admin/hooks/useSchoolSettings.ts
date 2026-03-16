import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../../lib/firebase'; // パスは適宜調整してください

// ※ APP_ID は firebase.ts で export している前提です（'robot-school-booking-v4'）
const APP_ID = 'robot-school-booking-v4';

export const useSchoolSettings = (schoolId: string | undefined) => {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!schoolId) {
      setLoading(false);
      return;
    }

    // 該当校舎の設定ドキュメントをリアルタイム監視
    const docRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'settings', schoolId);
    const unsubscribe = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        setSettings(snap.data());
      } else {
        setSettings(null); // データがない場合
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [schoolId]);

  return { settings, loading };
};