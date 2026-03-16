import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { signInAnonymously } from 'firebase/auth';
import { auth } from './lib/firebase';
import { useAuth } from './hooks/useAuth';
import { CommonContentsManagement } from './pages/CommonContentsManagement'; // 追加

// ==========================================
// ユーザー向け画面 (Public) のインポート
// ==========================================
import { BookingIndex } from './pages/BookingIndex';
import { BookingFlow } from './pages/BookingFlow';

// ==========================================
// 管理者向け画面 (Admin) のインポート
// ==========================================
// ※ファイルの配置場所に合わせてパスを調整してください
import { AdminLogin } from './pages/AdminLogin'; // または './features/admin/components/AdminLogin'
import { SchoolSelect } from './features/schools/components/SchoolSelect';
import { AdminDashboard } from './pages/AdminDashboard';
import { GlobalDashboard } from './pages/GlobalDashboard';
import { UserManagement } from './pages/UserManagement';

const App: React.FC = () => {
  const { user, loading } = useAuth();

  useEffect(() => {
    // 認証情報の読み込みが完了し、かつユーザーが未ログイン（null）の場合、
    // お客様向け予約画面にアクセスできるように「匿名ログイン」を自動的に行う
    if (!loading && !user) {
      signInAnonymously(auth).catch((error) => {
        console.error("匿名ログインに失敗しました:", error);
      });
    }
  }, [user, loading]);

  // 認証状態を確認中のローディング表示
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-teal-500 border-t-transparent mb-4"></div>
          <p className="text-slate-500 font-bold">システムを準備中...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* ==============================
            ユーザー向け画面 (Public)
        ============================== */}
        {/* トップページ（校舎選択） */}
        <Route path="/" element={<BookingIndex />} />
        
        {/* 予約フロー画面（学年・日程・時間枠・フォーム入力） */}
        <Route path="/book/:schoolId" element={<BookingFlow />} />

        {/* ==============================
            管理者向け画面 (Admin)
        ============================== */}
        {/* ログイン画面 */}
        <Route 
          path="/admin" 
          element={
            // すでに管理者（roleがある）としてログイン済みの場合は校舎選択へリダイレクト
            user?.role ? <Navigate to="/admin/schools" replace /> : <AdminLogin />
          } 
        />
        
        {/* 管理者向け 校舎選択画面 */}
        <Route 
          path="/admin/schools" 
          element={
            user?.role ? <SchoolSelect /> : <Navigate to="/admin" replace />
          } 
        />
        
        {/* 校舎別ダッシュボード画面 */}
        <Route 
          path="/admin/dashboard/:schoolId" 
          element={
            user?.role ? <AdminDashboard /> : <Navigate to="/admin" replace />
          } 
        />

        {/* ==============================
            本部管理者向け画面 (Global Admin)
        ============================== */}
        {/* 全校舎集計ダッシュボード */}
        <Route 
          path="/admin/global-dashboard" 
          element={
            user?.role === 'global' ? <GlobalDashboard /> : <Navigate to="/admin" replace />
          } 
        />

        {/* ユーザー管理画面 */}
        <Route 
          path="/admin/users" 
          element={
            user?.role === 'global' ? <UserManagement /> : <Navigate to="/admin" replace />
          } 
        />
        <Route 
          path="/admin/common-contents" 
          element={
            user?.role === 'global' ? <CommonContentsManagement /> : <Navigate to="/admin" replace />
          } 
        />

        {/* 存在しないURLにアクセスされた場合のフォールバック（トップページへ） */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;