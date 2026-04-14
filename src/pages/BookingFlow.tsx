import React, { useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useSchoolSettings } from '../features/admin/hooks/useSchoolSettings';
import { useBookings } from '../features/bookings/hooks/useBookings';
import { GradeSelector } from '../features/bookings/components/GradeSelector';
import { BookingCalendar } from '../features/bookings/components/BookingCalendar';

// 予約ID生成関数
const generateBookingId = () => {
  const now = new Date();
  const dateStr = now.getFullYear().toString() + 
                  String(now.getMonth() + 1).padStart(2, '0') + 
                  String(now.getDate()).padStart(2, '0');
  const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `BK-${dateStr}-${randomStr}`;
};

export const BookingFlow: React.FC = () => {
  const { schoolId } = useParams<{ schoolId: string }>();
  const [searchParams] = useSearchParams(); // UTMパラメータ取得用
  
  const { settings, loading: settingsLoading } = useSchoolSettings(schoolId);
  const { bookings, loading: bookingsLoading } = useBookings(schoolId);

  // === 予約フローの状態管理 ===
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<any>(null); // 選択された時間枠とコンテンツ情報

  // === フォーム入力の状態管理 ===
  const [parentName, setParentName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [childName, setChildName] = useState('');

  // === 日程リクエスト（お問い合わせ）の状態管理 ===
  const [isInquiryModalOpen, setIsInquiryModalOpen] = useState(false);
  const [inqName, setInqName] = useState('');
  const [inqEmail, setInqEmail] = useState('');
  const [inqPhone, setInqPhone] = useState('');
  const [inqContent, setInqContent] = useState('');
  const [isInquirySubmitting, setIsInquirySubmitting] = useState(false);

  // === 画面遷移の状態管理 ===
  const [phase, setPhase] = useState<'selection' | 'input' | 'confirm' | 'success'>('selection');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedBookingId, setGeneratedBookingId] = useState('');

  if (settingsLoading || bookingsLoading) {
    return (
      <div className="fixed inset-0 bg-slate-50 z-[100] flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-teal-500 border-t-transparent mb-4"></div>
        <p className="text-slate-500 font-bold">読み込み中...</p>
      </div>
    );
  }

  if (!settings) return <div className="min-h-screen flex items-center justify-center">校舎が見つかりません</div>;

  const defaultImgUrl = 'https://images.unsplash.com/photo-1581092921461-eab62e97a782?q=80&w=2070';

  // 学年が変更されたら、それ以降の選択状態をリセットする
  const handleSelectGrade = (grade: string) => {
    setSelectedGrade(grade);
    setSelectedDate(null);
    setSelectedSlot(null);
    setPhase('selection');
  };

  // 日付が変更されたら、時間枠の選択をリセットする
  const handleSelectDate = (date: Date) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    setPhase('selection');
  };

  // 時間枠が選択されたときの処理
  const handleSelectSlot = (evt: any, content: any, remaining: number) => {
    if (remaining <= 0) return; // 満席の場合は何もしない
    setSelectedSlot({ ...evt, content, remaining });
    setPhase('input');
    
    // スクロールでフォーム位置に移動させる
    setTimeout(() => {
      document.getElementById('inputPhase')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // 確認画面へ進む
  const handleProceedToConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setPhase('confirm');
    setTimeout(() => {
      document.getElementById('confirmPhase')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // 予約を確定してFirestoreに保存する
  const handleConfirmBooking = async () => {
    if (!schoolId || !selectedDate || !selectedSlot || !selectedGrade) return;

    setIsSubmitting(true);
    const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
    const newBookingId = generateBookingId();

    try {
      const APP_ID = 'robot-school-booking-v4';
      await addDoc(collection(db, 'artifacts', APP_ID, 'public', 'data', 'bookings'), {
        bookingId: newBookingId,
        schoolId: schoolId,
        schoolName: settings.schoolName,
        date: dateStr,
        startTime: selectedSlot.startTime,
        contentId: selectedSlot.content.id,
        courseName: selectedSlot.content.name,
        price: selectedSlot.content.price, // ★これを追加
        type: selectedSlot.content.type,   // ★これを追加
        parentName,
        childName,
        email,
        phone,
        grade: selectedGrade,
        sourceType: 'web',
        utmSource: searchParams.get('utm_source') || null,
        utmMedium: searchParams.get('utm_medium') || null,
        utmCampaign: searchParams.get('utm_campaign') || null,
        createdAt: serverTimestamp()
      });

      setGeneratedBookingId(newBookingId);
      setPhase('success');
    } catch (error) {
      alert("予約の確定に失敗しました。もう一度お試しください。");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 日程リクエスト（お問い合わせ）を送信する
  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsInquirySubmitting(true);

    try {
      const APP_ID = 'robot-school-booking-v4';
      await addDoc(collection(db, 'artifacts', APP_ID, 'public', 'data', 'inquiries'), {
        schoolId: schoolId,
        schoolName: settings.schoolName,
        name: inqName,
        email: inqEmail,
        phone: inqPhone,
        preferredSchedule: inqContent,
        grade: selectedGrade || 'unselected',
        status: 'pending',
        sourceType: 'web_inquiry',
        utmSource: searchParams.get('utm_source') || null,
        utmMedium: searchParams.get('utm_medium') || null,
        utmCampaign: searchParams.get('utm_campaign') || null,
        createdAt: serverTimestamp()
      });

      setIsInquiryModalOpen(false);
      setInqName('');
      setInqEmail('');
      setInqPhone('');
      setInqContent('');
      alert("お問い合わせを受け付けました。\n担当者より折り返しご連絡いたします。");
    } catch (error) {
      alert("送信に失敗しました。時間をおいて再度お試しください。");
      console.error(error);
    } finally {
      setIsInquirySubmitting(false);
    }
  };

  // 選択された日付のイベント一覧を取得・成形
  const getAvailableSlots = () => {
    if (!selectedDate || !settings.schedule) return [];
    const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
    const events = settings.schedule[dateStr] || [];

    return events.filter((evt: any) => {
      const content = (settings.contents || []).find((c: any) => c.id === evt.contentId);
      if (!content) return false;
      const targetGrades = evt.grades || content.grades || [];
      return targetGrades.includes('all_grades') || targetGrades.includes(selectedGrade);
    }).sort((a: any, b: any) => a.startTime.localeCompare(b.startTime));
  };

  const availableSlots = getAvailableSlots();

  return (
    <div className="bg-slate-50 text-slate-800 min-h-screen pb-10 relative">
      <nav className="bg-white text-slate-600 p-4 shadow-sm flex justify-center items-center z-40 relative">
        <h1 className="text-xl font-extrabold text-teal-600 text-center">{settings.schoolName}校 予約</h1>
      </nav>

      <div className="container mx-auto max-w-4xl p-4 sm:p-6 mt-4">
        <div className="max-w-2xl mx-auto animate-fade-in">
          <header className="text-center mb-8">
            <div className="w-full h-48 sm:h-64 bg-slate-200 rounded-2xl mb-4 overflow-hidden shadow-lg relative">
              <img src={settings.headerImageUrl || defaultImgUrl} alt="教室イメージ" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                 <p className="text-white font-bold text-xl drop-shadow-md">{settings.schoolName}校へようこそ</p>
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-teal-600 mb-2">{settings.pageTitle || '体験教室予約'}</h1>
            <p className="text-slate-600 text-sm whitespace-pre-wrap">{settings.pageDescription || ''}</p>
            
            {/* 住所と電話番号の表示 */}
            {(settings.address || settings.phoneNumber) && (
              <div className="mt-4 text-xs text-slate-500 bg-white p-3 rounded-lg inline-block shadow-sm">
                {settings.address && <span>{settings.address}</span>}
                {settings.address && settings.phoneNumber && <span className="mx-2">|</span>}
                {settings.phoneNumber && <span>{settings.phoneNumber}</span>}
              </div>
            )}
          </header>

          <main className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg">
            
            {/* Step 1: 学年選択 */}
            <GradeSelector selectedGrade={selectedGrade} onSelectGrade={handleSelectGrade} />

            {/* Step 2: 日程選択 */}
            <BookingCalendar 
              settings={settings}
              allBookings={bookings}
              selectedGrade={selectedGrade}
              selectedDate={selectedDate}
              onSelectDate={handleSelectDate}
            />

            {/* Step 3: 時間枠リスト */}
            {selectedDate && (
              <div className="mt-10 animate-fade-in">
                <h3 className="text-lg font-bold mb-4 text-center text-slate-700">
                  {selectedDate.getMonth() + 1}月{selectedDate.getDate()}日 の開催枠
                </h3>
                
                <div className="flex flex-col gap-3 max-w-sm mx-auto">
                  {availableSlots.length === 0 ? (
                    <p className="text-center text-slate-400">空き枠がありません</p>
                  ) : (
                    availableSlots.map((evt: any, idx: number) => {
                      const content = settings.contents.find((c: any) => c.id === evt.contentId);
                      const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
                      const bookedCount = bookings.filter(b => b.date === dateStr && b.startTime === evt.startTime && b.contentId === evt.contentId).length;
                      const remaining = Math.max(0, parseInt(evt.capacity) - bookedCount);
                      const isFull = remaining <= 0;
                      const isSelected = selectedSlot?.startTime === evt.startTime && selectedSlot?.contentId === evt.contentId;

                      let btnClass = "p-4 rounded-xl border-2 transition text-left shadow-sm ";
                      if (isFull) {
                        btnClass += "bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200";
                      } else if (isSelected) {
                        btnClass += "border-teal-500 bg-teal-50 transform scale-105";
                      } else {
                        btnClass += "border-blue-200 text-blue-600 bg-white hover:bg-blue-50";
                      }

                      return (
                        <button
                          key={idx}
                          disabled={isFull}
                          onClick={() => handleSelectSlot(evt, content, remaining)}
                          className={btnClass}
                        >
                          <span className={`font-bold text-lg ${isFull ? '' : 'text-slate-800'}`}>{evt.startTime}</span>
                          <span className={`text-sm font-bold ml-2 ${isFull ? '' : 'text-slate-700'}`}>{content.name}</span>
                          <span className={`float-right text-xs px-2 py-1 rounded font-bold ${isFull ? 'bg-red-100 text-red-500' : 'bg-blue-100 text-blue-700'}`}>
                            {isFull ? '満席' : `残 ${remaining}`}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* 日程リクエスト（お問い合わせ）機能の表示 */}
            {selectedGrade && (
              <div className="mt-12 pt-8 border-t border-slate-100 text-center animate-fade-in">
                <p className="text-sm text-slate-500 mb-3 font-bold">ご希望の日程が見つからない場合</p>
                <button 
                  onClick={() => setIsInquiryModalOpen(true)}
                  className="inline-flex items-center justify-center px-6 py-3 border-2 border-slate-300 text-slate-600 bg-white rounded-xl hover:bg-slate-50 hover:border-slate-400 transition font-bold text-sm shadow-sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  日程リクエスト・お問い合わせ
                </button>
                <p className="text-xs text-slate-400 mt-2">※ご希望の曜日や時間帯をお知らせください</p>
              </div>
            )}

            {/* Step 4: 選択内容の確認とフォーム入力 */}
            {selectedSlot && phase !== 'success' && (
              <div id="inputPhase" className="mt-10 pt-6 border-t border-slate-100 animate-fade-in">
                
                {/* 選択中の体験会情報カード */}
                <div className="bg-teal-50 p-5 rounded-xl mb-6 border border-teal-100 flex flex-col sm:flex-row gap-4 items-center">
                  {selectedSlot.content.imageUrl && (
                    <img src={selectedSlot.content.imageUrl} alt="体験イメージ" className="w-24 h-24 object-cover rounded-lg bg-slate-200 hidden sm:block" />
                  )}
                  <div className="flex-1 text-center sm:text-left">
                    <h3 className="font-bold text-teal-800 mb-1">選択中の体験会</h3>
                    <p className="text-sm text-teal-700 font-bold mb-1">
                      {selectedDate?.getFullYear()}年{selectedDate?.getMonth()! + 1}月{selectedDate?.getDate()}日 {selectedSlot.startTime}
                    </p>
                    <p className="text-lg font-black text-teal-600">
                      ¥{Number(selectedSlot.content.price).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* 体験内容の詳細表示エリア */}
                {(selectedSlot.content.description || selectedSlot.content.duration || selectedSlot.content.notes) && (
                  <div className="bg-white border border-slate-200 rounded-xl p-6 mb-8 shadow-sm">
                    {selectedSlot.content.description && (
                      <div className="mb-4">
                        <h4 className="text-sm font-bold text-slate-700 mb-2 border-l-4 border-teal-500 pl-2">体験内容</h4>
                        <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{selectedSlot.content.description}</p>
                      </div>
                    )}
                    {selectedSlot.content.duration && (
                      <div className="mb-4 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm font-bold text-slate-700 mr-2">所要時間:</span>
                        <span className="text-sm text-slate-600">{selectedSlot.content.duration}</span>
                      </div>
                    )}
                    {selectedSlot.content.notes && (
                      <div>
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <h4 className="text-xs font-bold text-yellow-800 mb-1 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            注意事項・持ち物
                          </h4>
                          <p className="text-xs text-yellow-900 whitespace-pre-wrap leading-relaxed">{selectedSlot.content.notes}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 入力フェーズ */}
                {phase === 'input' && (
                  <div className="animate-fade-in">
                    <h2 className="text-lg font-bold mb-4 text-center flex items-center justify-center gap-2">
                      <span className="bg-teal-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">3</span>
                      お客様情報の入力
                    </h2>
                    <form onSubmit={handleProceedToConfirm} className="space-y-4 max-w-md mx-auto">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">保護者様のお名前</label>
                        <input type="text" required value={parentName} onChange={e => setParentName(e.target.value)} className="w-full p-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none" placeholder="例: 山田 太郎" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">メールアドレス</label>
                        <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full p-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none" placeholder="example@email.com" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">電話番号</label>
                        <input type="tel" required value={phone} onChange={e => setPhone(e.target.value)} className="w-full p-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none" placeholder="090-1234-5678" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">お子様のお名前 (かな)</label>
                        <input type="text" required value={childName} onChange={e => setChildName(e.target.value)} className="w-full p-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none" placeholder="やまだ はなこ" />
                      </div>
                      <div className="pt-4">
                        <button type="submit" className="w-full text-lg font-bold py-4 px-6 bg-teal-500 text-white rounded-xl hover:bg-teal-600 shadow-lg transform active:scale-95 transition">
                          確認画面へ
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* 確認フェーズ */}
                {phase === 'confirm' && (
                  <div id="confirmPhase" className="max-w-md mx-auto animate-fade-in">
                    <h2 className="text-lg font-bold mb-4 text-center">入力内容の確認</h2>
                    <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm mb-6 space-y-4 text-sm">
                      <div className="border-b pb-2"><p className="text-xs text-slate-400">保護者様のお名前</p><p className="font-bold text-slate-800">{parentName}</p></div>
                      <div className="border-b pb-2"><p className="text-xs text-slate-400">メールアドレス</p><p className="font-bold text-slate-800">{email}</p></div>
                      <div className="border-b pb-2"><p className="text-xs text-slate-400">電話番号</p><p className="font-bold text-slate-800">{phone}</p></div>
                      <div><p className="text-xs text-slate-400">お子様のお名前</p><p className="font-bold text-slate-800">{childName}</p></div>
                    </div>
                    <div className="flex flex-col gap-3">
                      <button 
                        type="button" 
                        disabled={isSubmitting}
                        onClick={handleConfirmBooking} 
                        className="w-full text-lg font-bold py-4 px-6 bg-orange-500 text-white rounded-xl hover:bg-orange-600 shadow-lg transform active:scale-95 transition disabled:opacity-50"
                      >
                        {isSubmitting ? '送信中...' : '予約を確定する'}
                      </button>
                      <button 
                        type="button" 
                        disabled={isSubmitting}
                        onClick={() => setPhase('input')} 
                        className="w-full text-sm font-bold py-3 px-6 bg-slate-100 text-slate-500 rounded-xl hover:bg-slate-200 transition"
                      >
                        修正する
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* 予約完了モーダル */}
      {phase === 'success' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center animate-slide-in-up">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2">予約完了</h2>
            <p className="text-slate-600 mb-4">ご予約ありがとうございます！<br/>内容確認メールをお送りしました。</p>
            
            <div className="bg-slate-50 p-4 rounded-lg text-left mb-6 text-sm space-y-2 text-slate-600">
              <h4 className="font-bold mb-2 border-b border-slate-200 pb-2 text-slate-700">予約内容</h4>
              <p><strong>予約ID:</strong> {generatedBookingId}</p>
              <p><strong>教室:</strong> {settings.schoolName}校</p>
              <p><strong>日時:</strong> {selectedDate?.getFullYear()}年{selectedDate?.getMonth()! + 1}月{selectedDate?.getDate()}日 {selectedSlot?.startTime}</p>
              <p><strong>保護者様:</strong> {parentName} 様</p>
            </div>
            
            <button 
              onClick={() => window.location.reload()} 
              className="w-full py-3 bg-teal-500 text-white font-bold rounded-lg hover:bg-teal-600 transition"
            >
              最初の画面に戻る
            </button>
          </div>
        </div>
      )}

      {/* 日程リクエスト・お問い合わせモーダル */}
      {isInquiryModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl overflow-y-auto max-h-[90vh] animate-fade-in">
            <h3 className="text-lg font-bold mb-2 text-slate-700">日程リクエスト・お問い合わせ</h3>
            <p className="text-xs text-slate-500 mb-4">
              ご希望の日程や、ご質問がございましたら下記フォームよりお送りください。<br/>
              担当者より折り返しご連絡いたします。
            </p>
            <form onSubmit={handleInquirySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">保護者様のお名前</label>
                <input type="text" required value={inqName} onChange={e => setInqName(e.target.value)} className="w-full p-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none" placeholder="例: 山田 太郎" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">メールアドレス</label>
                <input type="email" required value={inqEmail} onChange={e => setInqEmail(e.target.value)} className="w-full p-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none" placeholder="example@email.com" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">電話番号</label>
                <input type="tel" required value={inqPhone} onChange={e => setInqPhone(e.target.value)} className="w-full p-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none" placeholder="090-1234-5678" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">ご希望の曜日・時間など</label>
                <textarea required value={inqContent} onChange={e => setInqContent(e.target.value)} className="w-full p-3 border border-slate-300 rounded-lg text-sm h-24 focus:ring-2 focus:ring-teal-500 outline-none" placeholder="例: 平日の17時以降、または土曜日の午前中を希望します。"></textarea>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsInquiryModalOpen(false)} className="px-4 py-2 bg-slate-100 rounded text-sm font-bold text-slate-600 hover:bg-slate-200 transition">キャンセル</button>
                <button type="submit" disabled={isInquirySubmitting} className="px-6 py-2 bg-blue-600 text-white rounded text-sm font-bold hover:bg-blue-700 shadow disabled:opacity-50 transition">
                  {isInquirySubmitting ? '送信中...' : '送信する'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};