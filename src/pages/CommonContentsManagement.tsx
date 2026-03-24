import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useCommonContents } from '../features/global/hooks/useCommonContents';
import type { CommonContent } from '../features/global/hooks/useCommonContents';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

const APP_ID = 'robot-school-booking-v4';

export const CommonContentsManagement: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { contents, loading, saveContents } = useCommonContents();

  // フォームの状態管理
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [customId, setCustomId] = useState('');
  const [type, setType] = useState('trial');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('');
  const [notes, setNotes] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 流入経路オプションの管理
  const [sourceOptions, setSourceOptions] = useState<string[]>([]);
  const [newSource, setNewSource] = useState('');

  // 流入経路オプションのリアルタイム取得
  useEffect(() => {
    const docRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'config', 'source_options');
    const unsubscribe = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        setSourceOptions(snap.data().options || []);
      }
    });
    return () => unsubscribe();
  }, []);

  // 権限チェック
  if (user && user.role !== 'global') {
    return <div className="min-h-screen flex items-center justify-center">権限がありません。</div>;
  }

  // 流入経路オプションの保存
  const handleAddSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSource.trim()) return;
    if (sourceOptions.includes(newSource.trim())) {
      alert('既に登録されています');
      return;
    }
    const newOptions = [...sourceOptions, newSource.trim()];
    await setDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'config', 'source_options'), { options: newOptions });
    setNewSource('');
  };

  const handleDeleteSource = async (index: number) => {
    if (!window.confirm("この流入経路を削除しますか？")) return;
    const newOptions = sourceOptions.filter((_, i) => i !== index);
    await setDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'config', 'source_options'), { options: newOptions });
  };

  // フォームのリセット
  const resetForm = () => {
    setEditingIndex(null);
    setName('');
    setCustomId('');
    setType('trial');
    setPrice('');
    setDescription('');
    setDuration('');
    setNotes('');
    setImageUrl('');
  };

  // 編集モードへの切り替え
  const handleEdit = (index: number) => {
    const c = contents[index];
    setEditingIndex(index);
    setName(c.name);
    setCustomId(c.id);
    setType(c.type);
    setPrice(c.price.toString());
    setDescription(c.description || '');
    setDuration(c.duration || '');
    setNotes(c.notes || '');
    setImageUrl(c.imageUrl || '');
  };

  // 削除処理
  const handleDelete = async (index: number) => {
    if (!window.confirm("この共通コンテンツを削除しますか？\n(既にこれを取り込んでいる各校舎のデータは消えません)")) return;
    
    const newContents = [...contents];
    newContents.splice(index, 1);
    await saveContents(newContents);
  };

  // 保存処理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) {
      alert("コンテンツ名と金額は必須です");
      return;
    }

    setIsSubmitting(true);
    try {
      let newId = customId.trim();
      
      // 新規作成時のID重複チェックと自動生成
      if (editingIndex === null) {
        if (newId && contents.some(c => c.id === newId)) {
          alert("指定されたIDは既に使用されています。");
          return;
        }
        if (!newId) newId = 'c' + Date.now();
      }

      const newContent: CommonContent = {
        id: editingIndex === null ? newId : contents[editingIndex].id, // 編集時は元のIDを保持
        name,
        type,
        price: parseInt(price, 10),
        description,
        duration,
        notes,
        imageUrl,
      };

      const newContents = [...contents];
      if (editingIndex === null) {
        newContents.push(newContent);
      } else {
        newContents[editingIndex] = newContent;
      }

      await saveContents(newContents);
      alert(editingIndex === null ? "新規作成しました" : "更新しました");
      resetForm();
    } catch (err: any) {
      alert("保存エラー: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-center">読み込み中...</div>;

  return (
    <div className="min-h-screen bg-slate-100 pb-10">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            共通設定
          </h1>
          <button onClick={() => navigate('/admin/schools')} className="text-sm text-slate-500 hover:text-slate-800 font-bold bg-slate-100 px-4 py-2 rounded-lg transition">戻る</button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
        
        {/* 左側：登録済みリスト */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col h-[700px]">
          <h4 className="font-bold text-slate-700 mb-4 border-b pb-2">登録済み共通コンテンツ</h4>
          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            {contents.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">登録された共通コンテンツはありません。</p>
            ) : (
              contents.map((c, idx) => (
                <div key={c.id} className="p-3 border rounded bg-slate-50 flex justify-between items-center hover:bg-slate-100 transition">
                  <div>
                    <div className="font-bold text-slate-700">{c.name}</div>
                    <div className="text-xs text-slate-500 mt-1">ID: {c.id} | ¥{c.price.toLocaleString()}</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(idx)} className="text-blue-500 text-xs font-bold hover:underline">編集</button>
                    <button onClick={() => handleDelete(idx)} className="text-red-500 text-xs font-bold hover:underline">削除</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 右側：追加・編集フォーム */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-fit">
          <h4 className="font-bold text-slate-700 mb-4 border-b pb-2">
            {editingIndex !== null ? "コンテンツ編集" : "新規コンテンツ追加"}
          </h4>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">コンテンツ名</label>
              <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
            </div>
            
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs font-bold text-slate-500 mb-1">ID (任意)</label>
                <input type="text" disabled={editingIndex !== null} value={customId} onChange={e => setCustomId(e.target.value)} className="w-full p-2 border rounded text-sm disabled:bg-slate-100 focus:ring-2 focus:ring-orange-500 outline-none" placeholder="自動生成" />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-bold text-slate-500 mb-1">種別</label>
                <select value={type} onChange={e => setType(e.target.value)} className="w-full p-2 border rounded text-sm bg-white focus:ring-2 focus:ring-orange-500 outline-none">
                  <option value="trial">体験会</option>
                  <option value="event">イベント</option>
                </select>
              </div>
              <div className="w-24">
                <label className="block text-xs font-bold text-slate-500 mb-1">金額(円)</label>
                <input type="number" required value={price} onChange={e => setPrice(e.target.value)} className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">体験内容</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full p-2 border rounded text-sm h-20 focus:ring-2 focus:ring-orange-500 outline-none"></textarea>
            </div>

            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs font-bold text-slate-500 mb-1">所要時間</label>
                <input type="text" value={duration} onChange={e => setDuration(e.target.value)} className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-orange-500 outline-none" placeholder="例: 90分" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">注意事項</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full p-2 border rounded text-sm h-16 focus:ring-2 focus:ring-orange-500 outline-none"></textarea>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">画像URL</label>
              <input type="text" value={imageUrl} onChange={e => setImageUrl(e.target.value)} className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
            </div>

            <div className="pt-4 flex gap-2">
              {editingIndex !== null && (
                <button type="button" onClick={resetForm} className="flex-1 bg-slate-100 text-slate-500 font-bold py-2 rounded text-sm hover:bg-slate-200 transition">
                  キャンセル
                </button>
              )}
              <button type="submit" disabled={isSubmitting} className="flex-[2] bg-orange-600 text-white font-bold py-2 rounded text-sm hover:bg-orange-700 transition shadow-sm disabled:opacity-50">
                {isSubmitting ? '保存中...' : '保存'}
              </button>
            </div>
          </form>
        </div>

        {/* 流入経路設定エリア */}
        <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h4 className="font-bold text-slate-700 mb-4 border-b pb-2 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            管理画面からの流入経路オプション設定
          </h4>
          <p className="text-xs text-slate-500 mb-4">
            ここで登録した選択肢は、管理コンソールの「新規予約登録」フォームにある流入経路のドロップダウンに反映されます。
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <h5 className="text-xs font-bold text-slate-500 mb-3">登録済みオプション</h5>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                {sourceOptions.length === 0 ? (
                  <p className="text-xs text-slate-400">登録されていません</p>
                ) : (
                  sourceOptions.map((opt, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-white p-2 px-3 rounded border border-slate-100 shadow-sm text-sm font-bold text-slate-700">
                      <span>{opt}</span>
                      <button onClick={() => handleDeleteSource(idx)} className="text-red-400 hover:text-red-600 text-xs">削除</button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
              <h5 className="text-xs font-bold text-slate-500 mb-3">新しいオプションを追加</h5>
              <form onSubmit={handleAddSource} className="flex gap-2">
                <input 
                  type="text" 
                  value={newSource} 
                  onChange={(e) => setNewSource(e.target.value)} 
                  placeholder="例: チラシ" 
                  className="flex-1 p-2 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none text-sm" 
                />
                <button type="submit" className="bg-indigo-600 text-white font-bold px-4 py-2 rounded hover:bg-indigo-700 transition text-sm">
                  追加
                </button>
              </form>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};