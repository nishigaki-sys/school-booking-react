import React, { useState, useEffect } from 'react';

// CourseSettings.tsx で定義したのと同じ型を使用します
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
  onSave: (content: Content) => Promise<void>;
  initialData?: Content;
  existingContents: Content[];
}

export const ContentModal: React.FC<Props> = ({ isOpen, onClose, onSave, initialData, existingContents }) => {
  // フォームの各項目のState
  const [name, setName] = useState('');
  const [customId, setCustomId] = useState('');
  const [type, setType] = useState('trial');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('');
  const [notes, setNotes] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // モーダルが開かれたとき、または初期データが変わったときにフォームを初期化
  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setCustomId(initialData.id);
      setType(initialData.type);
      setPrice(initialData.price.toString());
      setDescription(initialData.description || '');
      setDuration(initialData.duration || '');
      setNotes(initialData.notes || '');
      setImageUrl(initialData.imageUrl || '');
    } else {
      // 新規作成時は空にする
      setName('');
      setCustomId('');
      setType('trial');
      setPrice('');
      setDescription('');
      setDuration('');
      setNotes('');
      setImageUrl('');
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) {
      alert("コンテンツ名と金額は必須です");
      return;
    }

    setIsSubmitting(true);

    try {
      let newId = customId.trim();
      const isNew = !initialData;

      if (isNew) {
        if (newId && existingContents.some(c => c.id === newId)) {
          alert("指定されたIDは既に使用されています。");
          setIsSubmitting(false);
          return;
        }
        if (!newId) {
          newId = 'c' + Date.now(); // IDが未指定の場合は自動生成
        }
      } else {
        newId = initialData.id; // 編集時は元のIDを保持
      }

      const newContent: Content = {
        id: newId,
        name,
        type,
        price: parseInt(price, 10),
        description,
        duration,
        notes,
        imageUrl,
      };

      await onSave(newContent);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-slate-700">
            {initialData ? "コンテンツ編集" : "新規作成"}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">コンテンツ名</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="例: はじめてのロボット"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">コンテンツID (任意・半角英数)</label>
            <input
              type="text"
              value={customId}
              onChange={(e) => setCustomId(e.target.value)}
              disabled={!!initialData} // 編集時はID変更不可
              className="w-full p-2 border border-slate-300 rounded text-sm disabled:bg-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="空欄の場合は自動生成"
            />
            {!initialData && (
              <p className="text-[10px] text-slate-400 mt-1">※指定したい場合のみ入力。作成後は変更できません。</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">体験内容</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded text-sm h-24 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="体験会の詳細な内容を記述してください"
            />
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-500 mb-1">所要時間</label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="例: 90分"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-500 mb-1">金額(円)</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="1500"
                required
              />
            </div>
          </div>

          {/* 追加: 注意事項 */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">注意事項</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded text-sm h-20 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="持ち物や注意事項など"
            />
          </div>

          {/* 追加: バナー画像URL */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">バナー画像URL</label>
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-500 mb-1">種別</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              >
                <option value="trial">体験会</option>
                <option value="event">イベント</option>
              </select>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-orange-500 text-white font-bold py-3 rounded-lg hover:bg-orange-600 transition shadow-md disabled:opacity-50 mt-4"
          >
            {isSubmitting ? '保存中...' : (initialData ? '更新して保存' : '作成して保存')}
          </button>
        </form>
      </div>
    </div>
  );
};