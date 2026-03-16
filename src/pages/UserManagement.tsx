import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { db, firebaseConfig } from '../lib/firebase';
// ↓ ★ここを修正しました（type を追加）
import { useAuth, type AppUser } from '../hooks/useAuth';
import { useUsers } from '../features/global/hooks/useUsers';
import { useSchools } from '../features/schools/hooks/useSchools';

const APP_ID = 'robot-school-booking-v4';

export const UserManagement: React.FC = () => {
  const navigate = useNavigate(); 
  const { user: currentUser } = useAuth();
  const { users, loading: usersLoading } = useUsers();
  const { schools, loading: schoolsLoading } = useSchools();

  // フォームの状態
  const [editingId, setEditingId] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'global' | 'school'>('school');
  const [assignedSchoolId, setAssignedSchoolId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 権限チェック
  if (currentUser && currentUser.role !== 'global') {
    return <div className="min-h-screen flex items-center justify-center">権限がありません。</div>;
  }

  const resetForm = () => {
    setEditingId(null);
    setEmail('');
    setPassword('');
    setName('');
    setRole('school');
    setAssignedSchoolId('');
  };

  const handleEdit = (u: AppUser) => {
    setEditingId(u.id || u.uid);
    setEmail(u.email || '');
    setPassword(''); // 既存パスワードは表示・変更不可
    setName(u.name);
    setRole(u.role);
    setAssignedSchoolId(u.assignedSchoolId || '');
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("このユーザーの権限データを削除しますか？\n(注: Firebase Authのアカウント自体は削除されませんが、ログインできなくなります)")) return;
    try {
      await deleteDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'users', id));
      alert("ユーザーを削除しました");
    } catch (e: any) {
      alert("削除エラー: " + e.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (role === 'school' && !assignedSchoolId) {
      alert("校舎管理者の場合は、担当校舎を選択してください。");
      return;
    }

    setIsSubmitting(true);
    const userData = {
      email,
      name,
      role,
      assignedSchoolId: role === 'school' ? assignedSchoolId : null,
      updatedAt: serverTimestamp(),
    };

    try {
      if (editingId) {
        // 更新処理（Firestoreの権限データのみ更新）
        await updateDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'users', editingId), userData);
        alert("ユーザー情報を更新しました");
      } else {
        // 新規作成処理
        if (!password) {
          alert("新規作成時はパスワードが必要です");
          setIsSubmitting(false);
          return;
        }

        // 【重要】自分のセッションを切らずに別ユーザーを作るためのSecondary App
        const secondaryApp = initializeApp(firebaseConfig, "Secondary");
        const secondaryAuth = getAuth(secondaryApp);

        try {
          const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
          const newUid = userCredential.user.uid;
          
          // Main AppのDBコネクションを使って権限を保存
          await setDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'users', newUid), {
            ...userData,
            createdAt: serverTimestamp()
          });
          
          alert("新規ユーザーを作成しました");
        } finally {
          // 必ずSecondary Appを破棄する
          await signOut(secondaryAuth);
          await deleteApp(secondaryApp);
        }
      }
      resetForm();
    } catch (err: any) {
      console.error(err);
      alert("保存エラー: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (usersLoading || schoolsLoading) return <div className="p-8 text-center">読み込み中...</div>;

  return (
    <div className="min-h-screen bg-slate-100 pb-10">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            管理者ユーザー設定
          </h1>
          <button onClick={() => navigate('/admin/schools')} className="text-sm text-slate-500 hover:text-slate-800 font-bold bg-slate-100 px-4 py-2 rounded-lg transition">戻る</button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
        
        {/* 左側：登録済みユーザーリスト */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col h-[600px]">
          <h4 className="font-bold text-slate-700 mb-4 border-b pb-2">登録済みユーザー</h4>
          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            {users.map(u => (
              <div key={u.id} className="p-3 border rounded bg-slate-50 flex justify-between items-center hover:bg-slate-100 transition">
                <div>
                  <div className="font-bold text-slate-700 flex items-center gap-2">
                    {u.name}
                    {u.role === 'global' 
                      ? <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-[10px] font-bold">本部</span>
                      : <span className="bg-teal-100 text-teal-700 px-2 py-0.5 rounded text-[10px] font-bold">校舎</span>
                    }
                  </div>
                  <div className="text-xs text-slate-500 mt-1">{u.email}</div>
                  {u.role === 'school' && u.assignedSchoolId && (
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      担当: {schools.find(s => s.id === u.assignedSchoolId)?.name || '不明な校舎'}校
                    </div>
                  )}
                </div>
                <div className="flex gap-2 ml-2">
                  <button onClick={() => handleEdit(u)} className="text-blue-500 text-xs font-bold hover:underline">編集</button>
                  <button onClick={() => handleDelete(u.id || u.uid)} className="text-red-500 text-xs font-bold hover:underline">削除</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 右側：追加・編集フォーム */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-fit">
          <h4 className="font-bold text-slate-700 mb-4 border-b pb-2">
            {editingId ? "ユーザー権限編集" : "新規ユーザー追加"}
          </h4>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">メールアドレス</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-teal-500 outline-none" placeholder="user@example.com" />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">パスワード {editingId && <span className="text-[10px] text-red-400 ml-2">(変更不可)</span>}</label>
              <input type="text" required={!editingId} disabled={!!editingId} value={password} onChange={e => setPassword(e.target.value)} className="w-full p-2 border rounded text-sm disabled:bg-slate-100 focus:ring-2 focus:ring-teal-500 outline-none" placeholder={editingId ? "パスワードは変更できません" : "新規パスワード"} />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">表示名</label>
              <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-teal-500 outline-none" placeholder="山田 太郎" />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">権限 (Role)</label>
              <select value={role} onChange={e => setRole(e.target.value as 'global' | 'school')} className="w-full p-2 border rounded text-sm bg-white focus:ring-2 focus:ring-teal-500 outline-none">
                <option value="school">校舎管理者 (特定校舎のみ)</option>
                <option value="global">本部管理者 (全権限)</option>
              </select>
            </div>

            {role === 'school' && (
              <div className="animate-fade-in">
                <label className="block text-xs font-bold text-slate-500 mb-1">担当校舎</label>
                <select value={assignedSchoolId} onChange={e => setAssignedSchoolId(e.target.value)} className="w-full p-2 border rounded text-sm bg-white focus:ring-2 focus:ring-teal-500 outline-none">
                  <option value="">選択してください</option>
                  {schools.map(s => <option key={s.id} value={s.id}>{s.name}校</option>)}
                </select>
              </div>
            )}

            <div className="pt-4 flex gap-2">
              {editingId && (
                <button type="button" onClick={resetForm} className="flex-1 bg-slate-100 text-slate-500 font-bold py-2 rounded text-sm hover:bg-slate-200 transition">
                  キャンセル
                </button>
              )}
              <button type="submit" disabled={isSubmitting} className="flex-[2] bg-teal-600 text-white font-bold py-2 rounded text-sm hover:bg-teal-700 transition shadow-sm disabled:opacity-50">
                {isSubmitting ? '保存中...' : '保存'}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
};