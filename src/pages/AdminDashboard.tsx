import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSchoolSettings } from '../features/admin/hooks/useSchoolSettings';
import { BookingManagement } from './BookingManagement';
import { DashboardStats } from '../features/admin/components/DashboardStats';
import { CourseSettings } from '../features/admin/components/CourseSettings';
import { doc, setDoc } from 'firebase/firestore'; // 追加
import { db } from '../lib/firebase'; // 追加
import { SchoolSettingsForm } from '../features/admin/components/SchoolSettingsForm';
import { InquiryManagement } from '../features/admin/components/InquiryManagement';
import { UrlGenerator } from '../features/admin/components/UrlGenerator';

// タブの定義（タイポを防ぐために型を定義しておくと安全です）
type TabType = 'dashboard' | 'bookings' | 'inquiries' | 'courses' | 'url' | 'settings';

export const AdminDashboard: React.FC = () => {
  const { schoolId } = useParams<{ schoolId: string }>(); // URLから :schoolId を取得
  const navigate = useNavigate();
  const { user } = useAuth();
  const { settings, loading } = useSchoolSettings(schoolId);
  const saveSettings = async (newSettings: any) => {
    if (!schoolId) return;
    const APP_ID = 'robot-school-booking-v4';
    await setDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'settings', schoolId), newSettings);
  };

  // 現在選択されているタブの状態管理（初期値は 'dashboard'）
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 font-bold">データを読み込み中...</div>;
  }

  if (!settings) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-red-500 font-bold">校舎データが見つかりません。</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ナビゲーションバー */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-xl font-extrabold text-slate-800 mr-4">管理コンソール</span>
            <span className="text-sm font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              {settings.schoolName}校
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/admin/schools')}
              className="text-sm text-blue-600 hover:underline font-bold"
            >
              校舎選択へ戻る
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* タブメニュー */}
        <div className="flex border-b border-slate-300 mb-6 bg-white rounded-t-lg overflow-x-auto">
          {[
            { id: 'dashboard', label: 'ダッシュボード' },
            { id: 'bookings', label: '予約管理' },
            { id: 'inquiries', label: 'お問い合わせ' },
            { id: 'courses', label: '体験会設定' },
            { id: 'url', label: '集客URL作成' },
            { id: 'settings', label: '教室設定' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`px-6 py-4 font-bold whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-blue-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* タブのコンテンツエリア（中身は別コンポーネントとして今後作っていきます） */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 min-h-[500px]">
          {activeTab === 'dashboard' && schoolId && (
             <DashboardStats schoolId={schoolId} settings={settings} />
          )}
          {activeTab === 'bookings' && schoolId && (
            <BookingManagement schoolId={schoolId} />
          )}
          {activeTab === 'inquiries' && schoolId && (
            <InquiryManagement schoolId={schoolId} />
          )}
          {activeTab === 'courses' && schoolId && (
            <CourseSettings schoolId={schoolId} settings={settings} />
          )}
          {activeTab === 'settings' && schoolId && (
            <SchoolSettingsForm 
              schoolId={schoolId} 
              settings={settings} 
              onSaveSettings={saveSettings} 
            />
          )}
          {activeTab === 'url' && schoolId && (
            <UrlGenerator schoolId={schoolId} />
          )}
          {activeTab === 'settings' && <div>ここに教室の基本情報入力フォームが入ります</div>}
        </div>
      </div>
    </div>
  );
};