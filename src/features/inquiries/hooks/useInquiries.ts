import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

export interface Inquiry {
  id: string;
  schoolId: string;
  name: string;
  email: string;
  phone: string;
  preferredSchedule: string;
  grade: string;
  status?: 'pending' | 'in_progress' | 'completed';
  createdAt?: any; // FirestoreのTimestamp
}

const APP_ID = 'robot-school-booking-v4';

export const useInquiries = (schoolId: string | undefined) => {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!schoolId) {
      setLoading(false);
      return;
    }

    const inquiriesRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'inquiries');
    const q = query(inquiriesRef, where('schoolId', '==', schoolId));

    const unsubscribe = onSnapshot(q, (snap) => {
      const inquiryData = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Inquiry[];

      // 作成日時の降順（新しい順）でソート
      inquiryData.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });
      
      setInquiries(inquiryData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [schoolId]);

  return { inquiries, loading };
};