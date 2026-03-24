import React, { useState, useEffect } from 'react';
import { doc, deleteDoc, collection, addDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useBookings, type Booking } from '../features/bookings/hooks/useBookings';
import { useSchoolSettings } from '../features/admin/hooks/useSchoolSettings';
import { BookingCalendar } from '../features/bookings/components/BookingCalendar';

interface Props {
  schoolId: string;
}

const APP_ID = 'robot-school-booking-v4';

const GRADE_CONFIG: Record<string, string> = {
  preschool_mid: '年中',
  preschool_senior: '年長',
  grade1: '小1',
  grade2: '小2',
  grade3: '小3',
  grade4: '小4',
  grade5: '小5',
  grade6: '小6',
  older: 'それ以上'
};

// 予約ID生成関数
const generateBookingId = () => {
  const now = new Date();
  const dateStr = now.getFullYear().toString() + 
                  String(now.getMonth() + 1).padStart(2, '0') + 
                  String(now.getDate()).padStart(2, '0');
  const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `BK-${dateStr}-${randomStr}`;
};

// 学年マッチング用ヘルパー関数
const checkGradeMatch = (selectedBtnGrade: string | null, eventGrades: string[]) => {
  if (!selectedBtnGrade) return false;
  if (!eventGrades || eventGrades.length === 0) return false;
  if (eventGrades.includes('all_grades')) return true;
  return eventGrades.includes(selectedBtnGrade);
};

export const BookingManagement: React.FC<Props> = ({ schoolId }) => {
  const { bookings, loading: bookingsLoading } = useBookings(schoolId);
  const { settings, loading: settingsLoading } = useSchoolSettings(schoolId);

  // 流入経路オプションの取得
  const [sourceOptions, setSourceOptions] = useState<string[]>([]);
  useEffect(() => {
    const docRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'config', 'source_options');
    const unsubscribe = onSnapshot(docRef, (snap) => {
      if (snap.exists()) setSourceOptions(snap.data().options || []);
    });
    return () => unsubscribe();
  }, []);

  // --- モーダルの状態管理 ---
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedDateObj, setSelectedDateObj] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  
  const [childName, setChildName] = useState('');
  const [parentName, setParentName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [sourceType, setSourceType] = useState(''); // 流入経路
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 予約キャンセルの処理
  const handleCancel = async (bookingId: string) => {
    if (!window.confirm("本当にこの予約をキャンセル（削除）しますか？\nこの操作は取り消せません。")) return;
    
    try {
      await deleteDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'bookings', bookingId));
      alert("予約をキャンセルしました");
    } catch (err: any) {
      alert("削除に失敗しました: " + err.message);
    }
  };

  // 管理者用予約モーダルを開く
  const openAddModal = () => {
    setStep(1);
    setSelectedGrade(null);
    setSelectedDate('');
    setSelectedDateObj(null);
    setSelectedSlot(null);
    setChildName('');
    setParentName('');
    setPhone('');
    setEmail('');
    setSourceType('');
    setIsAddModalOpen(true);
  };

  // 管理者による予約実行
  const handleAdminBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!childName) {
      alert("お子様のお名前は必須です");
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'artifacts', APP_ID, 'public', 'data', 'bookings'), {
        bookingId: generateBookingId(),
        schoolId: schoolId,
        schoolName: settings.schoolName,
        date: selectedDate,
        startTime: selectedSlot.startTime,
        contentId: selectedSlot.content.id,
        courseName: selectedSlot.content.name,
        parentName: parentName || '管理者代理登録',
        childName,
        email: email || '',
        phone: phone || '',
        grade: selectedGrade,
        sourceType: 'admin', // 管理画面からの登録フラグ
        utmSource: sourceType || '直接/店頭', // ドロップダウンで選択した値
        createdAt: serverTimestamp()
      });

      alert("新規予約を登録しました");
      setIsAddModalOpen(false);
    } catch (error) {
      alert("登録に失敗しました。");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (bookingsLoading || settingsLoading) return <div className="p-4 text-slate-500">データを読み込み中...</div>;

  // 選択された日付の空き枠を計算
  const availableSlots = selectedDate && settings?.schedule?.[selectedDate] 
    ? settings.schedule[selectedDate]
        .filter((evt: any) => {
          const content = (settings.contents || []).find((c: any) => c.id === evt.contentId);
          if (!content) return false;
          const targetGrades = evt.grades || content.grades || [];
          return checkGradeMatch(selectedGrade, targetGrades);
        })
        .map((evt: any) => {
          const content = settings.contents.find((c: any) => c.id === evt.contentId);
          const bookedCount = bookings.filter(b => b.date === selectedDate && b.startTime === evt.startTime && b.contentId === evt.contentId).length;
          const remaining = Math.max(0, parseInt(evt.capacity) - bookedCount);
          return { ...evt, content, remaining };
        })
        .sort((a: any, b: any) => a.startTime.localeCompare(b.startTime))
    : [];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-slate-700">予約一覧</h3>
        <button 
          onClick={openAddModal}
          className="bg-teal-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-teal-700 shadow flex items-center gap-2 transition"
        >
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
                    {booking.sourceType === 'admin' ? (
                      <>
                        <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs border border-gray-200">管理画面</span>
                        {booking.utmSource && <div className="text-[10px] text-slate-400 mt-1">{booking.utmSource}</div>}
                      </>
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

      {/* 管理者による新規予約登録モーダル */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[80]">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl shadow-2xl overflow-y-auto max-h-[90vh] animate-fade-in">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h3 className="font-bold text-lg text-slate-700">管理者による新規予約登録</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-2xl">&times;</button>
            </div>

            {/* Step 1: 学年選択 */}
            {step === 1 && (
              <div>
                <h4 className="text-sm font-bold text-slate-500 mb-3 text-center">1. 対象学年を選択してください</h4>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(GRADE_CONFIG).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => { setSelectedGrade(key); setStep(2); }}
                      className="w-full text-sm font-bold py-3 px-2 bg-white border border-slate-300 text-slate-600 rounded-xl hover:bg-slate-50 transition"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: カレンダー＆日時選択 */}
            {step === 2 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <button onClick={() => setStep(1)} className="text-xs text-blue-500 hover:underline font-bold">← 学年選択に戻る</button>
                  <span className="text-sm font-bold bg-slate-100 px-3 py-1 rounded-full text-slate-600 border border-slate-200">
                    選択中: {selectedGrade ? GRADE_CONFIG[selectedGrade] : ''}
                  </span>
                </div>
                
                <BookingCalendar 
                  settings={settings}
                  allBookings={bookings}
                  selectedGrade={selectedGrade}
                  selectedDate={selectedDateObj}
                  onSelectDate={(d) => {
                    setSelectedDateObj(d);
                    const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                    setSelectedDate(ds);
                  }}
                />

                <div className="mt-8 space-y-2 max-h-60 overflow-y-auto border-t border-slate-100 pt-4">
                  {!selectedDate ? (
                    <p className="text-center text-xs text-slate-400 py-4">日付を選択してください</p>
                  ) : availableSlots.length === 0 ? (
                    <p className="text-center text-xs text-slate-400 py-4">この日付に選択可能な枠はありません</p>
                  ) : (
                    availableSlots.map((slot: any, idx: number) => {
                      const isFull = slot.remaining <= 0;
                      return (
                        <button
                          key={idx}
                          disabled={isFull}
                          onClick={() => { setSelectedSlot(slot); setStep(3); }}
                          className={`w-full p-3 rounded-xl border text-left flex justify-between items-center transition shadow-sm ${
                            isFull ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200' : 'bg-white border-blue-200 text-blue-700 hover:bg-blue-50'
                          }`}
                        >
                          <div>
                            <span className="font-bold mr-2">{slot.startTime}</span>
                            <span className="text-sm font-bold">{slot.content.name}</span>
                          </div>
                          <span className={`text-[10px] px-2 py-1 rounded font-bold ${isFull ? 'bg-red-100 text-red-500' : 'bg-blue-100 text-blue-700'}`}>
                            {isFull ? '満席' : `残 ${slot.remaining}`}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* Step 3: お客様情報の入力 */}
            {step === 3 && (
              <div>
                <button onClick={() => setStep(2)} className="text-xs text-blue-500 hover:underline mb-4 font-bold">← 日時選択に戻る</button>
                
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 text-sm flex flex-col gap-1">
                  <p><span className="text-xs text-slate-400 mr-2 font-bold">日時:</span> {selectedDate} {selectedSlot?.startTime}</p>
                  <p><span className="text-xs text-slate-400 mr-2 font-bold">コース:</span> {selectedSlot?.content.name}</p>
                </div>

                <form onSubmit={handleAdminBookingSubmit} className="space-y-4" autoComplete="off">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">お子様のお名前 (必須)</label>
                    <input type="text" required value={childName} onChange={e => setChildName(e.target.value)} className="w-full p-3 border rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none" placeholder="例: ロボ 太郎" />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">保護者様のお名前 <span className="text-slate-400 font-normal">(任意)</span></label>
                      <input type="text" value={parentName} onChange={e => setParentName(e.target.value)} className="w-full p-3 border rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none" placeholder="省略時は「管理者代理登録」" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">流入経路 (必須)</label>
                      <select required value={sourceType} onChange={e => setSourceType(e.target.value)} className="w-full p-3 border rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none bg-white">
                        <option value="">選択してください</option>
                        <option value="直接/店頭">直接/店頭</option>
                        <option value="電話">電話</option>
                        {sourceOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">電話番号 <span className="text-slate-400 font-normal">(任意)</span></label>
                      <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full p-3 border rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none" placeholder="-" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">メールアドレス <span className="text-slate-400 font-normal">(任意)</span></label>
                      <input type="text" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-3 border rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none" placeholder="-" />
                    </div>
                  </div>
                  
                  <div className="pt-6 border-t mt-4">
                    <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 shadow-md transition disabled:opacity-50">
                      {isSubmitting ? '登録中...' : '予約を確定する'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};