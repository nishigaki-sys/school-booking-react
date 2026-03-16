import React, { useState } from 'react';
import { useCommonContents } from '../../global/hooks/useCommonContents';

interface Content {
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
  isOpen: boolean;
  onClose: () => void;
  existingContents: Content[]; // すでに校舎に登録されているコンテンツ
  onImport: (importedContents: Content[]) => Promise<void>; // 取り込み実行時の親へのコールバック
}

export const ImportCommonModal: React.FC<Props> = ({ isOpen, onClose, existingContents, onImport }) => {
  // 本部が作成した共通コンテンツを取得
  const { contents: commonContents, loading } = useCommonContents();
  
  // チェックされた項目のIDを管理するState
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // チェックボックスの切り替え処理
  const handleToggle = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(selectedId => selectedId !== id) : [...prev, id]
    );
  };

  // 取り込み実行処理
  const handleImport = async () => {
    if (selectedIds.length === 0) {
      alert("取り込むコンテンツが選択されていません");
      return;
    }

    setIsSubmitting(true);

    try {
      let count = 0;
      const newContentsToAdd: Content[] = [];

      selectedIds.forEach(id => {
        const target = commonContents.find(c => c.id === id);
        if (target) {
          // 既に同じIDのコンテンツが校舎側に存在しないかチェック
          const alreadyExists = existingContents.some(lc => lc.id === target.id);
          if (!alreadyExists) {
            newContentsToAdd.push({ ...target });
            count++;
          }
        }
      });

      if (count > 0) {
        // 親コンポーネントに新しく追加するコンテンツを渡す
        await onImport(newContentsToAdd);
        alert(`${count}件のコンテンツを取り込みました`);
        onClose(); // モーダルを閉じる
      } else {
        alert("選択されたコンテンツは既に取り込み済みか、存在しません。");
      }
    } catch (err: any) {
      alert("取り込みに失敗しました: " + err.message);
    } finally {
      setIsSubmitting(false);
      // チェック状態をリセット
      setSelectedIds([]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl animate-fade-in">
        <h3 className="text-lg font-bold mb-4 text-slate-700">共通コンテンツから取り込み</h3>
        <p className="text-xs text-slate-500 mb-4">
          以下のリストから、この校舎に追加したいコンテンツを選択してください。<br/>
          ※既に同名のIDで登録されているものはスキップされます。
        </p>

        <div className="space-y-2 max-h-64 overflow-y-auto border border-slate-200 p-2 rounded mb-4 bg-slate-50">
          {loading ? (
            <p className="text-sm text-slate-400 p-4 text-center">読み込み中...</p>
          ) : commonContents.length === 0 ? (
            <p className="text-sm text-slate-400 p-4 text-center">共通コンテンツが登録されていません。</p>
          ) : (
            commonContents.map(c => {
              // 既に取り込み済みの場合はグレーアウトして選択不可にする
              const isAlreadyImported = existingContents.some(lc => lc.id === c.id);
              
              return (
                <label 
                  key={c.id} 
                  className={`flex items-center gap-3 p-3 border-b border-slate-200 last:border-0 rounded transition ${
                    isAlreadyImported ? 'opacity-50 cursor-not-allowed bg-slate-100' : 'hover:bg-white cursor-pointer bg-slate-50'
                  }`}
                >
                  <input 
                    type="checkbox" 
                    className="form-checkbox h-4 w-4 text-blue-600 rounded border-slate-300" 
                    value={c.id}
                    checked={selectedIds.includes(c.id)}
                    onChange={() => handleToggle(c.id)}
                    disabled={isAlreadyImported}
                  />
                  <div className="text-sm flex-1">
                    <div className="font-bold text-slate-700">
                      {c.name}
                      {isAlreadyImported && <span className="ml-2 text-[10px] text-red-500 font-normal">導入済</span>}
                    </div>
                    <div className="text-xs text-slate-500">
                      ID: {c.id} | {c.type === 'event' ? 'イベント' : '体験'} ¥{c.price.toLocaleString()}
                    </div>
                  </div>
                </label>
              );
            })
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button 
            onClick={onClose} 
            disabled={isSubmitting}
            className="px-4 py-2 bg-slate-100 text-slate-600 rounded text-sm font-bold hover:bg-slate-200 transition"
          >
            キャンセル
          </button>
          <button 
            onClick={handleImport} 
            disabled={isSubmitting || selectedIds.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-bold hover:bg-blue-700 transition shadow-sm disabled:opacity-50"
          >
            {isSubmitting ? '処理中...' : '選択した項目を取り込む'}
          </button>
        </div>
      </div>
    </div>
  );
};