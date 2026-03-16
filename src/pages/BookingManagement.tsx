import React from 'react';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useBookings, type Booking } from '../features/bookings/hooks/useBookings';

interface Props {
  schoolId: string;
}

const APP_ID = 'robot-school-booking-v4';

export const BookingManagement: React.FC<Props> = ({ schoolId }) => {
  const { bookings, loading } = useBookings(schoolId);

  // 予約キャンセルの処理（元の cancelBooking 関数に相当）
  const handleCancel = async (bookingId: string) => {
    if (!window.confirm("本当にこの予約をキャンセル（削除）しますか？\nこの操作は取り消せません。")) return;
    
    try {
      await deleteDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'bookings', bookingId));
      alert("予約をキャンセルしました"); // 本番ではToast通知などに置き換えるとより良いです
    } catch (err: any) {
      alert("削除に失敗しました: " + err.message);
    }
  };

  if (loading) return <div className="p-4 text-slate-500">予約データを読み込み中...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-slate-700">予約一覧</h3>
        <button className="bg-teal-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-teal-700 shadow flex items-center gap-2 transition">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          新規予約登録
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-slate-600">
          <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500 border-b">
            <tr>
              <th className="px-6 py-4">開催日時</th>
              <th className="px-6 py-4">コンテンツ</th>
              <th className="px-6 py-4 text-center">種別</th>
              <th className="px-6 py-4 text-center">流入経路</th>
              <th className="px-6 py-4 text-center">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {bookings.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                  予約データがありません。
                </td>
              </tr>
            ) : (
              bookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    {booking.bookingId && (
                      <div className="text-[10px] text-slate-400 font-mono mb-1">ID: {booking.bookingId}</div>
                    )}
                    <div>{booking.date} {booking.startTime}</div>
                    <div className="text-xs text-slate-500 mt-1">{booking.childName} 様</div>
                  </td>
                  <td className="px-6 py-4">{booking.courseName}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">確定</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {/* 流入経路のバッジ表示 */}
                    {booking.sourceType === 'admin' ? (
                      <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs border border-gray-200">管理画面</span>
                    ) : booking.utmSource ? (
                      <>
                        <span className="bg-indigo-50 text-indigo-600 px-2 py-1 rounded text-xs border border-indigo-100 block w-fit mx-auto mb-1">
                          {booking.utmSource}
                        </span>
                        {booking.utmMedium && <span className="text-[10px] text-slate-400">{booking.utmMedium}</span>}
                      </>
                    ) : (
                      <span className="text-xs text-slate-400">Web予約</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex flex-col gap-2">
                      <button 
                        onClick={() => console.log('編集モーダルを開く:', booking.id)}
                        className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded border border-blue-200 hover:bg-blue-100 font-bold transition"
                      >
                        編集
                      </button>
                      <button 
                        onClick={() => handleCancel(booking.id)}
                        className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded border border-red-200 hover:bg-red-100 font-bold transition"
                      >
                        キャンセル
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};