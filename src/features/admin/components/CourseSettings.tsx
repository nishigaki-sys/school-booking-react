import React, { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { ContentModal } from './ContentModal';
import { ScheduleSettings } from './ScheduleSettings';
import { ImportCommonModal } from './ImportCommonModal';

// コンテンツの型定義
export interface Content {
  id: string;
  name: string;
  type: string;
  price: number;
  imageUrl?: string;
  description?: string;
  duration?: string;
  notes?: string;
}

interface Props {
  schoolId: string;
  settings: any; // 本来は { schoolName: string, contents: Content[], schedule: any } のような型定義が望ましいです
}

const APP_ID = 'robot-school-booking-v4';

export const CourseSettings: React.FC<Props> = ({ schoolId, settings }) => {
  // コンテンツ追加・編集モーダルの状態
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  
  // 共通コンテンツ取り込みモーダルの状態
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // 現在のコンテンツ一覧（未設定の場合は空配列）
  const contents: Content[] = settings?.contents || [];

  // 設定をFirestoreに保存する共通関数
  const saveSettings = async (newSettings: any) => {
    try {
      await setDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'settings', schoolId), newSettings);
      // alert('設定を保存しました'); // 必要に応じてトースト通知などに変更
    } catch (error: any) {
      alert('保存に失敗しました: ' + error.message);
      throw error; // エラーを呼び出し元に伝播させる
    }
  };

  // コンテンツの削除処理
  const handleDeleteContent = async (index: number) => {
    if (!window.confirm("このコンテンツを削除しますか？\n※既にスケジュールに登録されている場合、カレンダー上の表示がおかしくなる可能性があります。")) return;

    const newContents = [...contents];
    newContents.splice(index, 1);
    
    await saveSettings({ ...settings, contents: newContents });
    alert("コンテンツを削除しました");
  };

  // コンテンツ編集モーダルを開く処理
  const openModal = (index: number | null = null) => {
    setEditingIndex(index);
    setIsModalOpen(true);
  };

  // モーダルで保存ボタンが押されたときの処理（新規作成・更新）
  const handleSaveContent = async (newContent: Content) => {
    const newContents = [...contents];
    
    if (editingIndex === null) {
      // 新規追加
      newContents.push(newContent);
    } else {
      // 更新
      newContents[editingIndex] = newContent;
    }

    await saveSettings({ ...settings, contents: newContents });
    setIsModalOpen(false); // 保存成功後にモーダルを閉じる
    alert(editingIndex === null ? "コンテンツを作成しました" : "コンテンツを更新しました");
  };

  // 共通コンテンツ取り込み実行時の処理
  const handleImportContents = async (importedContents: Content[]) => {
    // 既存のコンテンツ配列と、新しく取り込んだ配列を結合する
    const newContents = [...contents, ...importedContents];
    // 設定を保存
    await saveSettings({ ...settings, contents: newContents });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* =========================================
          1. コンテンツ管理セクション（左側）
      ========================================= */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-fit">
        <h3 className="text-lg font-bold text-slate-700 mb-4 pb-2 border-b">1. コンテンツ管理</h3>
        
        {/* アクションボタン群 */}
        <div className="mb-4 space-y-3">
          <button 
            onClick={() => openModal(null)}
            className="bg-orange-500 text-white font-bold py-4 px-6 rounded-lg hover:bg-orange-600 transition w-full shadow-md flex items-center justify-center gap-2"
          >
            <span className="text-2xl font-bold leading-none">+</span> 新規作成
          </button>
          
          <button 
            onClick={() => setIsImportModalOpen(true)}
            className="bg-slate-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-slate-600 transition w-full shadow-md flex items-center justify-center gap-2 text-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            共通コンテンツからコピー
          </button>
        </div>

        {/* コンテンツ一覧リスト */}
        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
          {contents.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">登録されているコンテンツはありません。</p>
          ) : (
            contents.map((content, idx) => (
              <div key={content.id} className="flex justify-between items-center p-3 bg-slate-50 border rounded text-sm hover:bg-slate-100 transition">
                <div>
                  <span className="font-bold text-slate-700">{content.name}</span>
                  <span className="text-xs text-slate-500 ml-2">
                    {content.type === 'event' ? 'イベント' : '体験'} ¥{content.price.toLocaleString()}
                  </span>
                </div>
                <div>
                  <button 
                    onClick={() => openModal(idx)}
                    className="text-blue-500 text-xs mr-3 font-bold hover:underline"
                  >
                    編集
                  </button>
                  <button 
                    onClick={() => handleDeleteContent(idx)}
                    className="text-red-500 text-xs font-bold hover:underline"
                  >
                    削除
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* =========================================
          2. 開催日程登録セクション（右側カレンダー）
      ========================================= */}
      <ScheduleSettings 
        schoolId={schoolId} 
        settings={settings} 
        onSaveSettings={saveSettings} 
      />

      {/* =========================================
          モーダル群
      ========================================= */}
      
      {/* 1. コンテンツ追加・編集モーダル */}
      {isModalOpen && (
        <ContentModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveContent}
          initialData={editingIndex !== null ? contents[editingIndex] : undefined}
          existingContents={contents}
        />
      )}

      {/* 2. 共通コンテンツ取り込みモーダル */}
      <ImportCommonModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        existingContents={contents}
        onImport={handleImportContents}
      />
    </div>
  );
};