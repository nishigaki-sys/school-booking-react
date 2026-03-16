import React, { useState, useEffect } from 'react';

interface Props {
  dateStr: string;
  settings: any;
  onClose: () => void;
  onSaveSettings: (newSettings: any) => Promise<void>;
}

export const ScheduleModal: React.FC<Props> = ({ dateStr, settings, onClose, onSaveSettings }) => {
  const dayEvents = settings?.schedule?.[dateStr] || [];
  const contents = settings?.contents || [];

  // フォームの状態
  const [editingIndex, setEditingIndex] = useState<number>(-1);
  const [contentId, setContentId] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [capacity, setCapacity] = useState('5');
  const [selectedGrades, setSelectedGrades] = useState<string[]>([]);

  // 編集モードに切り替える
  const handleEdit = (index: number) => {
    const evt = dayEvents[index];
    setEditingIndex(index);
    setContentId(evt.contentId);
    setStartTime(evt.startTime);
    setEndTime(evt.endTime);
    setCapacity(evt.capacity.toString());
    setSelectedGrades(evt.grades || []);
  };

  // フォームをリセットする
  const resetForm = () => {
    setEditingIndex(-1);
    setContentId(contents.length > 0 ? contents[0].id : '');
    setStartTime('');
    setEndTime('');
    setCapacity('5');
    setSelectedGrades([]);
  };

  useEffect(() => {
    resetForm();
  }, [dateStr, contents]);

  const handleGradeToggle = (grade: string) => {
    setSelectedGrades(prev => 
      prev.includes(grade) ? prev.filter(g => g !== grade) : [...prev, grade]
    );
  };

  const handleSaveEvent = async () => {
    if (!contentId || !startTime || !endTime || selectedGrades.length === 0) {
      alert("必須項目を入力し、対象学年を1つ以上選択してください");
      return;
    }

    const newEvent = {
      id: editingIndex !== -1 ? dayEvents[editingIndex].id : 's' + Date.now(),
      contentId,
      startTime,
      endTime,
      capacity: parseInt(capacity, 10),
      grades: selectedGrades
    };

    const newSchedule = { ...(settings.schedule || {}) };
    if (!newSchedule[dateStr]) newSchedule[dateStr] = [];

    if (editingIndex !== -1) {
      newSchedule[dateStr][editingIndex] = newEvent;
    } else {
      newSchedule[dateStr].push(newEvent);
    }

    // 時間順にソート
    newSchedule[dateStr].sort((a: any, b: any) => a.startTime.localeCompare(b.startTime));

    await onSaveSettings({ ...settings, schedule: newSchedule });
    resetForm();
  };

  const handleDeleteEvent = async (index: number) => {
    if (!window.confirm("この枠を削除しますか？\n※既に予約が入っている場合は削除前に予約をキャンセルしてください。")) return;
    
    const newSchedule = { ...(settings.schedule || {}) };
    newSchedule[dateStr].splice(index, 1);
    await onSaveSettings({ ...settings, schedule: newSchedule });
    resetForm();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl h-[85vh] flex flex-col shadow-2xl">
        <div className="flex justify-between items-center mb-4 pb-2 border-b">
          <h3 className="font-bold text-lg">{dateStr} のスケジュール設定</h3>
          <button onClick={onClose} className="text-2xl text-slate-400 hover:text-slate-600">&times;</button>
        </div>

        <div className="flex flex-1 overflow-hidden gap-6 flex-col md:flex-row">
          {/* 左側：登録済みリスト */}
          <div className="w-full md:w-1/2 overflow-y-auto">
            <h4 className="text-xs font-bold text-slate-500 mb-2">登録済みリスト</h4>
            <div className="space-y-2 text-sm mb-6">
              {dayEvents.length === 0 ? (
                <p className="text-slate-400 text-xs">登録されている枠はありません</p>
              ) : (
                dayEvents.map((evt: any, idx: number) => {
                  const c = contents.find((x: any) => x.id === evt.contentId);
                  return (
                    <div key={evt.id} className="flex justify-between items-center p-2 border rounded bg-slate-50 hover:bg-slate-100 transition">
                      <div className="cursor-pointer flex-1" onClick={() => handleEdit(idx)}>
                        <b>{evt.startTime}</b> - {evt.endTime} <br/>
                        <span className="text-xs text-slate-600">{c?.name || '?'} (定員:{evt.capacity})</span>
                      </div>
                      <div className="flex gap-2 ml-2">
                        <button onClick={() => handleDeleteEvent(idx)} className="text-red-500 text-xs font-bold hover:underline">削除</button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* 右側：入力フォーム */}
          <div className="w-full md:w-1/2 overflow-y-auto bg-slate-50 p-4 rounded-lg border border-slate-100">
            <h4 className="text-xs font-bold text-slate-500 mb-3">
              {editingIndex !== -1 ? "枠を編集" : "新規枠を追加"}
            </h4>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">コンテンツ</label>
                <select value={contentId} onChange={e => setContentId(e.target.value)} className="w-full p-2 border rounded text-sm bg-white">
                  {contents.length === 0 && <option value="">コンテンツを先に登録してください</option>}
                  {contents.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name} (¥{c.price})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">対象学年</label>
                <div className="flex flex-wrap gap-2 text-xs">
                  {['preschool_mid:年中', 'preschool_senior:年長', 'grade1:小1', 'grade2:小2', 'grade3:小3', 'grade4:小4', 'grade5:小5', 'grade6:小6', 'all_grades:全学年'].map(g => {
                    const [val, label] = g.split(':');
                    return (
                      <label key={val} className="flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="mr-1" 
                          checked={selectedGrades.includes(val)}
                          onChange={() => handleGradeToggle(val)}
                        />
                        {label}
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-400 mb-1">開始</label>
                  <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full p-2 border rounded text-sm" />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-400 mb-1">終了</label>
                  <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full p-2 border rounded text-sm" />
                </div>
                <div className="w-20">
                  <label className="block text-xs font-bold text-slate-400 mb-1">定員</label>
                  <input type="number" value={capacity} onChange={e => setCapacity(e.target.value)} className="w-full p-2 border rounded text-sm" />
                </div>
              </div>

              <div className="pt-4 flex gap-2">
                {editingIndex !== -1 && (
                  <button onClick={resetForm} className="flex-1 bg-slate-200 text-slate-600 font-bold py-2 rounded text-sm hover:bg-slate-300 transition">
                    キャンセル
                  </button>
                )}
                <button onClick={handleSaveEvent} className="flex-[2] bg-blue-600 text-white font-bold py-2 rounded text-sm hover:bg-blue-700 transition shadow-sm">
                  {editingIndex !== -1 ? "更新する" : "追加する"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};