import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSchoolSettings } from '../features/admin/hooks/useSchoolSettings';
import { BookingManagement } from './BookingManagement';
import { DashboardStats } from '../features/admin/components/DashboardStats';
import { CourseSettings } from '../features/admin/components/CourseSettings';
import { ScheduleCalendar } from '../features/admin/components/ScheduleCalendar'; // ★ 追加
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { SchoolSettingsForm } from '../features/admin/components/SchoolSettingsForm';
import { InquiryManagement } from '../features/admin/components/InquiryManagement';
import { UrlGenerator } from '../features/admin/components/UrlGenerator';

// ★ TabType に 'calendar' を追加
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
            <button 
              onClick={() => navigate('/admin/schools')}
              className="text-sm text-blue-600 hover:text-blue-800 font-bold transition-colors"
            >
              ← 校舎選択へ戻る
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
        {/* タブメニュー */}
        <div className="flex border-b border-slate-300 mb-6 bg-white rounded-t-xl overflow-x-auto no-scrollbar">
          {[
            { id: 'dashboard', label: 'ダッシュボード' },
            { id: 'calendar', label: 'カレンダー' }, // ★ カレンダータブを追加
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

          {/* ★ カレンダーコンポーネントを呼び出し */}
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