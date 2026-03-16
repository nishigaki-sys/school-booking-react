import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { db, auth, APP_ID } from '../../../lib/firebase';
import { useAuth } from '../../../hooks/useAuth'; 
import { useSchools } from '../hooks/useSchools';
import { 
  Trash2, Plus, School, LayoutDashboard, Users, 
  Settings, X, ArrowRight, ShieldCheck, LogOut, Globe 
} from 'lucide-react';

export const SchoolSelect: React.FC = () => {
  const { user } = useAuth();
  const { schools, loading } = useSchools();
  const navigate = useNavigate();

  // モーダル・状態管理
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isIpModalOpen, setIsIpModalOpen] = useState(false);
  const [newSchoolName, setNewSchoolName] = useState('');
  const [newSchoolId, setNewSchoolId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // IP制限の状態管理
  const [allowedIps, setAllowedIps] = useState<string[]>([]);
  const [newIp, setNewIp] = useState('');
  const [currentIp, setCurrentIp] = useState('');

  const isGlobal = user?.role === 'global';

  // IP制限リストのリアルタイム監視と自身のIP取得
  useEffect(() => {
    if (!isGlobal) return;

    const unsubscribe = onSnapshot(doc(db, 'artifacts', APP_ID, 'public', 'data', 'config', 'ip_allowlist'), (snap) => {
      if (snap.exists()) {
        setAllowedIps(snap.data().list || []);
      }
    });

    fetch('https://api.ipify.org?format=json')
      .then(res => res.json())
      .then(data => setCurrentIp(data.ip))
      .catch(err => console.error("IP取得失敗", err));

    return () => unsubscribe();
  }, [isGlobal]);

  // --- ログアウト処理 ---
  const handleLogout = async () => {
    if (window.confirm("ログアウトしますか？")) {
      await signOut(auth);
      navigate('/admin');
    }
  };

  // --- 校舎追加ロジック (schools と settings を同期) ---
  const handleAddSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchoolName || !newSchoolId) return;

    if (schools.some(s => s.id === newSchoolId)) {
      alert("この校舎IDは既に存在します。");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. 一覧用ドキュメント
      await setDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'schools', newSchoolId), {
        id: newSchoolId,
        name: newSchoolName
      });

      // 2. 設定用ドキュメント
      await setDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'settings', newSchoolId), {
        schoolName: newSchoolName,
        schoolId: newSchoolId,
        contents: [],
        schedule: {},
        pageTitle: `${newSchoolName}校 体験予約`,
        createdAt: new Date()
      });

      setIsModalOpen(false);
      setNewSchoolName('');
      setNewSchoolId('');
      alert("校舎を追加しました");
    } catch (err) {
      alert("追加に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- 校舎削除ロジック ---
  const handleDeleteSchool = async (e: React.MouseEvent, schoolId: string, schoolName: string) => {
    e.stopPropagation();
    if (!window.confirm(`「${schoolName}校」を削除しますか？設定データも消去されます。`)) return;
    try {
      await deleteDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'schools', schoolId));
      await deleteDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'settings', schoolId));
    } catch (err) {
      alert("削除に失敗しました");
    }
  };

  // --- IP制限保存 ---
  const handleSaveIps = async () => {
    try {
      await setDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'config', 'ip_allowlist'), {
        list: allowedIps
      });
      setIsIpModalOpen(false);
      alert("IP制限設定を更新しました");
    } catch (err) {
      alert("保存に失敗しました");
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-teal-500 border-t-transparent"></div>
    </div>
  );

  const displaySchools = user?.role === 'school' 
    ? schools.filter(s => s.id === user.assignedSchoolId) 
    : schools;

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans">
      {/* ナビゲーション */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-slate-800 p-1.5 rounded-lg text-white"><Settings size={20} /></div>
            <span className="text-xl font-black text-slate-800 tracking-tight">管理コンソール</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">Current User</p>
              <p className="text-xs font-bold text-slate-700 leading-none">{user?.name}</p>
            </div>
            <button onClick={handleLogout} className="flex items-center gap-1 text-xs font-bold text-red-500 hover:bg-red-50 px-3 py-2 rounded-xl transition-colors">
              <LogOut size={16} /> <span className="hidden sm:inline">ログアウト</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="mb-10">
          <h2 className="text-3xl font-black text-slate-800 mb-2">校舎を選択</h2>
          <p className="text-slate-500 font-medium">担当校舎の管理画面へ移動します</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {displaySchools.map(school => (
            <div key={school.id} onClick={() => navigate(`/admin/dashboard/${school.id}`)} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-xl hover:border-teal-500 transition-all cursor-pointer group relative flex flex-col">
              {isGlobal && (
                <button onClick={(e) => handleDeleteSchool(e, school.id, school.name)} className="absolute top-4 right-4 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors z-10">
                  <Trash2 size={18} />
                </button>
              )}
              <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center mb-4 group-hover:bg-teal-500 group-hover:text-white transition-colors">
                <School size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-1">{school.name}校</h3>
              <p className="text-xs font-mono text-slate-400 mb-6">ID: {school.id}</p>
              <div className="mt-auto pt-4 flex items-center text-teal-600 font-bold text-sm">
                管理画面を開く <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}

          {isGlobal && (
            <button onClick={() => setIsModalOpen(true)} className="bg-slate-50 p-6 rounded-2xl border-2 border-dashed border-slate-300 hover:border-teal-400 hover:bg-white transition-all flex flex-col items-center justify-center min-h-[180px] group">
              <div className="w-12 h-12 rounded-full border-2 border-slate-300 flex items-center justify-center mb-3 group-hover:border-teal-500 group-hover:text-teal-500 text-slate-400 transition-colors">
                <Plus size={28} />
              </div>
              <span className="font-bold text-slate-500 group-hover:text-teal-600">新しい校舎を追加</span>
            </button>
          )}
        </div>

        {isGlobal && (
          <div className="mt-24">
            <div className="flex items-center gap-4 mb-8">
              <div className="h-px flex-1 bg-slate-200"></div>
              <span className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Global Administration</span>
              <div className="h-px flex-1 bg-slate-200"></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <button onClick={() => navigate('/admin/global-dashboard')} className="flex items-center justify-center gap-3 bg-white p-5 rounded-2xl border border-slate-200 font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm">
                <LayoutDashboard size={20} /> 全校舎集計
              </button>
              <button onClick={() => navigate('/admin/users')} className="flex items-center justify-center gap-3 bg-white p-5 rounded-2xl border border-slate-200 font-bold text-slate-700 hover:bg-teal-50 hover:text-teal-600 hover:border-teal-200 transition-all shadow-sm">
                <Users size={20} /> ユーザー管理
              </button>
              <button onClick={() => setIsIpModalOpen(true)} className="flex items-center justify-center gap-3 bg-white p-5 rounded-2xl border border-slate-200 font-bold text-slate-700 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all shadow-sm">
                <ShieldCheck size={20} /> IP制限設定
              </button>
              <button onClick={() => navigate('/admin/common-contents')} className="flex items-center justify-center gap-3 bg-white p-5 rounded-2xl border border-slate-200 font-bold text-slate-700 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 transition-all shadow-sm">
                <Settings size={20} /> 共通設定
              </button>
            </div>
          </div>
        )}
      </div>

      {/* IP制限モーダル */}
      {isIpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
              <h3 className="font-black text-slate-800 text-xl">IPアドレス制限</h3>
              <button onClick={() => setIsIpModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
            </div>
            <div className="p-8 space-y-6">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex justify-between items-center">
                <div>
                  <p className="text-[10px] text-slate-400 font-black uppercase mb-1">Your Current IP</p>
                  <p className="font-mono text-sm font-bold text-slate-700">{currentIp || 'Loading...'}</p>
                </div>
                <button onClick={() => { if(currentIp && !allowedIps.includes(currentIp)) setAllowedIps([...allowedIps, currentIp]) }} className="text-[10px] bg-white border border-slate-200 px-3 py-2 rounded-lg font-black hover:bg-teal-500 hover:text-white transition-colors">ADD ME</button>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-3 tracking-widest">Allowed List</label>
                <div className="space-y-2 max-h-40 overflow-y-auto mb-4 scrollbar-hide">
                  {allowedIps.map((ip, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-white border border-slate-100 p-3 rounded-xl text-sm font-mono font-bold text-slate-600">
                      {ip}
                      <button onClick={() => setAllowedIps(allowedIps.filter((_, i) => i !== idx))} className="text-rose-400 hover:text-rose-600"><X size={16} /></button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input type="text" value={newIp} onChange={(e) => setNewIp(e.target.value)} placeholder="0.0.0.0" className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                  <button onClick={() => { if(newIp) { setAllowedIps([...allowedIps, newIp]); setNewIp(''); } }} className="bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-700 transition-colors">ADD</button>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={() => setIsIpModalOpen(false)} className="flex-1 py-4 text-slate-500 font-bold hover:bg-slate-100 rounded-2xl transition-colors">Cancel</button>
                <button onClick={handleSaveIps} className="flex-[2] py-4 bg-rose-600 text-white font-bold rounded-2xl shadow-lg shadow-rose-100 hover:bg-rose-700 transition-all">Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 校舎追加モーダル */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
              <h3 className="font-black text-slate-800 text-xl">新規校舎の登録</h3>
              <button onClick={() => setIsModalOpen(false)}><X size={24} /></button>
            </div>
            <form onSubmit={handleAddSchool} className="p-8 space-y-6">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2 tracking-widest">School Name</label>
                <input type="text" required value={newSchoolName} onChange={(e) => setNewSchoolName(e.target.value)} placeholder="例：新宿" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-teal-500 outline-none transition-all" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-2 tracking-widest">School ID</label>
                <input type="text" required value={newSchoolId} onChange={(e) => setNewSchoolId(e.target.value.toLowerCase().replace(/\s/g, ''))} placeholder="shinjuku" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-mono focus:ring-2 focus:ring-teal-500 outline-none transition-all" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 text-slate-500 font-bold rounded-2xl hover:bg-slate-100 transition-colors">戻る</button>
                <button type="submit" disabled={isSubmitting} className="flex-[2] py-4 bg-teal-600 text-white font-bold rounded-2xl shadow-lg shadow-teal-100 hover:bg-teal-700 transition-all">校舎を作成</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};