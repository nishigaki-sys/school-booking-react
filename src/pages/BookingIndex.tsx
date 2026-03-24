import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSchools } from '../features/schools/hooks/useSchools';

export const BookingIndex: React.FC = () => {
  const { schools, loading } = useSchools();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="fixed inset-0 bg-slate-50 z-[100] flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-teal-500 border-t-transparent mb-4"></div>
        <p className="text-slate-500 font-bold">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 text-slate-800 min-h-screen pb-10">
      <nav className="bg-white text-slate-600 p-4 shadow-sm flex justify-center items-center z-50 relative">
        <h1 className="text-xl font-extrabold text-teal-600">ロボ団 ロボットプログラミング体験予約</h1>
      </nav>

      <div className="container mx-auto max-w-4xl p-4 sm:p-6 mt-4 animate-fade-in">
        <div className="text-center mb-10 mt-4">
          <h2 className="text-2xl font-bold text-slate-700 mb-2">ご希望の教室を選んでください</h2>
          <p className="text-slate-500 text-sm">お近くの教室をご選択ください</p>
        </div>

        {schools.length === 0 ? (
          <p className="text-center text-slate-400 p-8 bg-white rounded-xl shadow-sm">
            現在、予約を受け付けている教室がありません。
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {schools.map(school => (
              <div 
                key={school.id}
                onClick={() => navigate(`/book/${school.id}`)}
                className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition transform hover:-translate-y-1 cursor-pointer border border-slate-100 flex flex-col items-center justify-center gap-4 group"
              >
                <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center text-teal-600 group-hover:bg-teal-500 group-hover:text-white transition">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-700">{school.name}校</h3>
                <button className="mt-2 text-teal-600 font-bold underline decoration-2 underline-offset-4 group-hover:text-teal-700">
                  予約する
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};