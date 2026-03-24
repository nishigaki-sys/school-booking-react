import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSchoolSettings } from '../features/admin/hooks/useSchoolSettings';
import { BookingManagement } from './BookingManagement';
import { DashboardStats } from '../features/admin/components/DashboardStats';
import { CourseSettings } from '../features/admin/components/CourseSettings';
import { ScheduleCalendar } from '../features/admin/components/ScheduleCalendar';
import { doc, setDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { SchoolSettingsForm } from '../features/admin/components/SchoolSettingsForm';
import { InquiryManagement } from '../features/admin/components/InquiryManagement';
import { UrlGenerator } from '../features/admin/components/UrlGenerator';

type TabType = 'dashboard' | 'calendar' | 'bookings' | 'inquiries' | 'courses' | 'url' | 'settings';

export const AdminDashboard: React.FC = () => {
  const { schoolId } = useParams<{ schoolId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { settings, loading } = useSchoolSettings(schoolId);

  const saveSettings = async (newSettings: any) => {
    if (!schoolId) return;
    const APP_ID = 'robot-school-booking-v4';
    await setDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'settings', schoolId), newSettings);
  };

  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  const handleLogout = async () => {
    if (window.confirm("ログアウトしますか？")) {
      await signOut(auth);
      navigate('/admin');
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 font-bold">データを読み込み中...</div>;
  }

  if (!settings) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-red-500 font-bold">校舎データが見つかりません。</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ナビゲーションバー */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-xl font-extrabold text-slate-800 mr-4">管理コンソール</span>
            <span className="text-sm font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
              {settings.schoolName}校
            </span>
          </div>
          <div className="flex items-center gap-4">
            {/* ログインユーザー情報の表示 */}
            {user && (
              <span className="text-xs font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-100 hidden sm:inline-block">
                {user.name}
              </span>
            )}
            
            {/* 予約ページ確認リンク */}
            <a 
              href={`/book/${schoolId}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-teal-600 hover:text-teal-800 hover:underline flex items-center gap-1 font-bold"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              予約ページ確認
            </a>

            <button 
              onClick={() => navigate('/admin/schools')}
              className="text-sm text-blue-600 hover:text-blue-800 font-bold transition-colors hover:underline hidden sm:block"
            >
              校舎選択へ戻る
            </button>

            {/* ログアウトボタン */}
            <button 
              onClick={handleLogout}
              className="text-sm font-bold text-red-500 hover:bg-red-50 px-3 py-1 rounded transition-colors"
            >
              ログアウト
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
        {/* タブメニュー */}
        <div className="flex border-b border-slate-300 mb-6 bg-white rounded-t-xl overflow-x-auto no-scrollbar">
          {[
            { id: 'dashboard', label: 'ダッシュボード' },
            { id: 'calendar', label: 'カレンダー' },
            { id: 'bookings', label: '予約管理' },
            { id: 'inquiries', label: 'お問い合わせ' },
            { id: 'courses', label: '体験会設定' },
            { id: 'url', label: '集客URL作成' },
            { id: 'settings', label: '教室設定' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`px-6 py-4 font-bold whitespace-nowrap border-b-2 transition-all duration-200 ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 bg-blue-50/30'
                  : 'border-transparent text-slate-500 hover:text-blue-600 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* メインコンテンツエリア */}
        <div className="bg-transparent min-h-[600px]">
          {activeTab === 'dashboard' && schoolId && (
             <DashboardStats schoolId={schoolId} settings={settings} />
          )}

          {activeTab === 'calendar' && schoolId && (
            <ScheduleCalendar schoolId={schoolId} settings={settings} />
          )}

          {activeTab === 'bookings' && schoolId && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6"><BookingManagement schoolId={schoolId} /></div>
          )}

          {activeTab === 'inquiries' && schoolId && (
            <InquiryManagement schoolId={schoolId} />
          )}

          {activeTab === 'courses' && schoolId && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6"><CourseSettings schoolId={schoolId} settings={settings} /></div>
          )}

          {activeTab === 'url' && schoolId && (
            <UrlGenerator schoolId={schoolId} />
          )}

          {activeTab === 'settings' && schoolId && (
            <SchoolSettingsForm 
              schoolId={schoolId} 
              settings={settings} 
              onSaveSettings={saveSettings} 
            />
          )}
        </div>
      </div>
    </div>
  );
};