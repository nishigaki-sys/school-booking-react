import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import type { Booking } from '../../bookings/hooks/useBookings';

const APP_ID = 'robot-school-booking-v4';

export const useAllBookings = () => {
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 校舎で絞り込まず、bookingsコレクション全体を取得
    const bookingsRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'bookings');

    const unsubscribe = onSnapshot(bookingsRef, (snap) => {
      const data = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Booking[];

      // 作成日時の新しい順（降順）にソート
      data.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });
      
      setAllBookings(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { allBookings, loading };
};