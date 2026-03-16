import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSchools } from '../features/schools/hooks/useSchools';
import { useAllBookings } from '../features/global/hooks/useAllBookings';

export const GlobalDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { schools, loading: schoolsLoading } = useSchools();
  const { allBookings, loading: bookingsLoading } = useAllBookings();

  // 権限チェック：本部管理者以外はアクセス不可
  if (user && user.role !== 'global') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <p className="text-red-500 font-bold mb-4">このページへのアクセス権限がありません。</p>
        <button onClick={() => navigate('/admin/schools')} className="text-blue-500 underline">戻る</button>
      </div>
    );
  }

  if (schoolsLoading || bookingsLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50">読み込み中...</div>;
  }

  // --- 統計値の計算 ---
  const totalBookings = allBookings.length;
  const totalSchools = schools.length;

  // 直近24時間の予約数を計算
  const yesterday = new Date(Date.now() - 86400000);
  const recentBookings = allBookings.filter(b => {
    if (!b.createdAt) return false;
    // FirestoreのTimestampをDateに変換して比較
    const createdAtDate = new Date(b.createdAt.seconds * 1000);
    return createdAtDate > yesterday;
  });
  const recentCount = recentBookings.length;

  // 最新の予約一覧（最大50件）
  const latestBookings = allBookings.slice(0, 50);

  return (
    <div className="min-h-screen bg-slate-100 pb-10">
      {/* ナビゲーション */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <span className="bg-indigo-100 text-indigo-700 p-2 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              </span>
              <span className="text-xl font-extrabold text-slate-800">全校舎集計ダッシュボード</span>
            </div>
            <button 
              onClick={() => navigate('/admin/schools')} 
              className="text-sm text-slate-500 hover:text-slate-800 font-bold bg-slate-100 px-4 py-2 rounded-lg hover:bg-slate-200 transition"
            >
              閉じる
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
        {/* サマリーカード */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-xs font-bold text-slate-400 uppercase">全校舎 予約総数 (累計)</h3>
            <p className="text-4xl font-black text-slate-700 mt-2">{totalBookings}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-xs font-bold text-slate-400 uppercase">登録校舎数</h3>
            <p className="text-4xl font-black text-slate-700 mt-2">{totalSchools}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 relative overflow-hidden">
            <div className="absolute right-0 top-0 p-4 opacity-10">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h3 className="text-xs font-bold text-slate-400 uppercase">直近24時間の動き</h3>
            <p className="text-4xl font-black text-green-600 mt-2">
              {recentCount > 0 ? `+${recentCount}` : '0'}
            </p>
            <p className="text-[10px] text-slate-400">新規予約</p>
          </div>
        </div>

        {/* タイムライン表示エリア */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col h-[500px]">
          <h3 className="font-bold text-slate-700 mb-4 flex items-center border-b pb-2">
            <span className="w-2 h-6 bg-green-500 rounded mr-2"></span>
            最新の予約状況 (全校舎タイムライン)
          </h3>
          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            {latestBookings.length === 0 ? (
              <div className="text-center text-slate-400 py-4">データがありません</div>
            ) : (
              latestBookings.map((b) => {
                const dateObj = b.createdAt ? new Date(b.createdAt.seconds * 1000) : new Date();
                const timeStr = `${dateObj.getMonth() + 1}/${dateObj.getDate()} ${dateObj.getHours()}:${String(dateObj.getMinutes()).padStart(2, '0')}`;
                
                return (
                  <div key={b.id} className="p-3 bg-slate-50 border border-slate-100 rounded hover:bg-slate-100 transition">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-bold text-slate-400">{timeStr}</span>
                      <span className="bg-indigo-100 text-indigo-700 text-[10px] px-2 py-0.5 rounded-full font-bold">
                        {b.schoolName}校
                      </span>
                    </div>
                    <div className="font-bold text-slate-700 text-sm mt-1">{b.childName} 様</div>
                    <div className="text-xs text-slate-500 mt-0.5">{b.courseName} ({b.date} {b.startTime})</div>
                  </div>
                );
              })
            )}
          </div>
        </div>
        
        {/* ※ 必要に応じて、ここに react-chartjs-2 などを導入してグラフを描画します */}
      </div>
    </div>
  );
};