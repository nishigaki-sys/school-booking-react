import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

// ★ ここが原因の箇所です！外部から読み込めるように export を付けて定義します
export interface Booking {
  id: string;
  bookingId: string;
  schoolId: string;
  schoolName: string;
  date: string;
  startTime: string;
  contentId: string;
  courseName: string;
  parentName: string;
  childName: string;
  email: string;
  phone: string;
  grade: string;
  status?: string;
  createdAt?: any;
  sourceType?: string;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
}

const APP_ID = 'robot-school-booking-v4';

export const useBookings = (schoolId: string | undefined) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!schoolId) {
      setLoading(false);
      return;
    }

    const bookingsRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'bookings');
    const q = query(bookingsRef, where('schoolId', '==', schoolId));

    const unsubscribe = onSnapshot(q, (snap) => {
      const bookingData = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as unknown as Booking[]; // 型エラーを防ぐために as unknown を挟みます
      
      // 作成日時の降順でソート
      bookingData.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });

      setBookings(bookingData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [schoolId]);

  return { bookings, loading };
};