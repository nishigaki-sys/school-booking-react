import React, { useState, useEffect } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

interface Props {
  schoolId: string;
  settings: any;
  onSaveSettings: (newSettings: any) => Promise<void>;
}

const APP_ID = 'robot-school-booking-v4';

export const SchoolSettingsForm: React.FC<Props> = ({ schoolId, settings, onSaveSettings }) => {
  // フォームの入力値を管理するState
  const [schoolName, setSchoolName] = useState('');
  const [address, setAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [pageTitle, setPageTitle] = useState('');
  const [pageDescription, setPageDescription] = useState('');
  const [headerImageUrl, setHeaderImageUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // 初期データ（settings）が親から渡ってきたら、フォームにセットする
  useEffect(() => {
    if (settings) {
      setSchoolName(settings.schoolName || '');
      setAddress(settings.address || '');
      setPhoneNumber(settings.phoneNumber || '');
      setPageTitle(settings.pageTitle || '');
      setPageDescription(settings.pageDescription || '');
      setHeaderImageUrl(settings.headerImageUrl || '');
    }
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // 1. settingsコレクションの更新
      const newSettings = {
        ...settings,
        schoolName,
        address,
        phoneNumber,
        pageTitle,
        pageDescription,
        headerImageUrl
      };
      
      // 親コンポーネント(AdminDashboard等)で定義された保存処理を呼び出す
      // またはここで直接更新しても構いませんが、今回はプロップス経由で状態を同期させます
      await onSaveSettings(newSettings);

      // 2. schools コレクション側の名前も同期して更新する（元の admin.js の仕様に合わせる）
      await setDoc(
        doc(db, 'artifacts', APP_ID, 'public', 'data', 'schools', schoolId),
        { id: schoolId, name: schoolName },
        { merge: true }
      );

      alert('教室情報を保存しました');
    } catch (error: any) {
      alert('保存に失敗しました: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 max-w-2xl mx-auto h-fit">
      <h3 className="text-xl font-bold text-slate-700 mb-6">教室基本情報</h3>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-bold text-slate-600 mb-1">教室名</label>
          <input
            type="text"
            required
            value={schoolName}
            onChange={(e) => setSchoolName(e.target.value)}
            className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none transition"
          />
        </div>
        
        <div>
          <label className="block text-sm font-bold text-slate-600 mb-1">住所</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none transition"
          />
        </div>
        
        <div>
          <label className="block text-sm font-bold text-slate-600 mb-1">電話番号</label>
          <input
            type="text"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none transition"
          />
        </div>
        
        <div>
          <label className="block text-sm font-bold text-slate-600 mb-1">予約ページタイトル</label>
          <input
            type="text"
            value={pageTitle}
            onChange={(e) => setPageTitle(e.target.value)}
            className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none transition"
          />
        </div>
        
        <div>
          <label className="block text-sm font-bold text-slate-600 mb-1">予約ページ説明文</label>
          <input
            type="text"
            value={pageDescription}
            onChange={(e) => setPageDescription(e.target.value)}
            className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none transition"
          />
        </div>
        
        <div>
          <label className="block text-sm font-bold text-slate-600 mb-1">ヘッダー画像URL</label>
          <input
            type="text"
            value={headerImageUrl}
            onChange={(e) => setHeaderImageUrl(e.target.value)}
            className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none transition text-xs text-slate-500"
            placeholder="https://example.com/image.jpg"
          />
        </div>
        
        <div className="pt-4 text-center">
          <button
            type="submit"
            disabled={isSaving}
            className="bg-blue-600 text-white font-bold py-3 px-8 rounded-lg shadow-md hover:bg-blue-700 transition disabled:opacity-50"
          >
            {isSaving ? '保存中...' : '設定を保存'}
          </button>
        </div>
      </form>
    </div>
  );
};