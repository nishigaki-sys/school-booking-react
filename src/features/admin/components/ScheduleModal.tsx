import React, { useState, useEffect } from 'react';

interface Props {
  dateStr: string;
  settings: any;
  onClose: () => void;
  onSaveSettings: (newSettings: any) => Promise<void>;
}

// タイムライン定数
const START_HOUR = 9;
const END_HOUR = 21;
const PIXELS_PER_MINUTE = 1; // 1分 = 1px, 1時間 = 60px
const TOTAL_MINUTES = (END_HOUR - START_HOUR) * 60; // 12時間 = 720px

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

  // 複製の状態
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [copyTargetDate, setCopyTargetDate] = useState('');
  const [eventToCopy, setEventToCopy] = useState<any>(null); // コピー対象の枠を保持

  // 時間 <-> 分(START_HOUR起点) の変換関数
  const timeToMins = (timeStr: string) => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return (h - START_HOUR) * 60 + m;
  };

  const minsToTime = (mins: number) => {
    const h = Math.floor(mins / 60) + START_HOUR;
    const m = mins % 60;
    // 24時間を超える場合の調整
    const displayH = h >= 24 ? h - 24 : h;
    return `${String(displayH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

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

  // タイムラインクリック時の処理
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    
    // クリック位置から分数（15分単位で丸める）を計算
    const clickedMins = y / PIXELS_PER_MINUTE;
    const roundedMins = Math.round(clickedMins / 15) * 15;

    // 範囲外（9:00前、21:00以降）のクリックを制御
    if (roundedMins < 0 || roundedMins >= TOTAL_MINUTES) return;

    const newStart = minsToTime(roundedMins);
    setStartTime(newStart);

    // 終了時間をコンテンツの所要時間から自動設定（デフォルト90分）
    const content = contents.find((c: any) => c.id === contentId);
    let durationMins = 90;
    if (content && content.duration) {
      const match = content.duration.match(/(\d+)/);
      if (match) durationMins = parseInt(match[1], 10);
    }
    
    setEndTime(minsToTime(roundedMins + durationMins));
  };

  // 選択された枠（コンテンツ単位）の複製処理
  const handleCopySchedule = async () => {
    if (!copyTargetDate) {
      alert("コピー先の日付を選択してください");
      return;
    }
    if (!eventToCopy) {
      alert("コピー対象の枠が選択されていません");
      return;
    }

    const newSchedule = { ...(settings.schedule || {}) };
    if (!newSchedule[copyTargetDate]) {
      newSchedule[copyTargetDate] = [];
    }

    // 新しいIDを生成して複製
    const copiedEvent = {
      ...eventToCopy,
      id: 's' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36)
    };

    newSchedule[copyTargetDate] = [...newSchedule[copyTargetDate], copiedEvent];
    newSchedule[copyTargetDate].sort((a: any, b: any) => a.startTime.localeCompare(b.startTime));

    await onSaveSettings({ ...settings, schedule: newSchedule });
    setIsCopyModalOpen(false);
    setCopyTargetDate('');
    setEventToCopy(null);
    alert(`${copyTargetDate} に枠を複製しました`);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl">
        <div className="flex justify-between items-center mb-4 pb-2 border-b">
          <h3 className="font-bold text-lg">{dateStr} のスケジュール設定</h3>
          <button onClick={onClose} className="text-2xl text-slate-400 hover:text-slate-600">&times;</button>
        </div>

        <div className="flex flex-1 overflow-hidden gap-6 flex-col md:flex-row">
          
          {/* 左側：直感的なタイムライン */}
          <div className="w-full md:w-1/2 overflow-y-auto border rounded-xl bg-slate-50 relative flex shadow-inner">
            {/* 時間軸 */}
            <div className="w-12 border-r bg-white text-[10px] text-slate-400 text-center relative" style={{ height: TOTAL_MINUTES }}>
              {Array.from({ length: END_HOUR - START_HOUR + 1 }).map((_, i) => (
                <div key={i} className="absolute w-full text-center" style={{ top: i * 60 - 6 }}>
                  {START_HOUR + i}:00
                </div>
              ))}
            </div>
            
            {/* トラック（クリック可能な領域） */}
            <div 
              className="flex-1 relative cursor-pointer hover:bg-blue-50/30 transition-colors"
              style={{ height: TOTAL_MINUTES }}
              onClick={handleTimelineClick}
            >
              {/* グリッド線（1時間ごと） */}
              {Array.from({ length: END_HOUR - START_HOUR }).map((_, i) => (
                <div key={i} className="absolute w-full border-t border-slate-200 pointer-events-none" style={{ top: (i + 1) * 60 }}></div>
              ))}
              {/* グリッド線（30分ごと：破線） */}
              {Array.from({ length: END_HOUR - START_HOUR }).map((_, i) => (
                <div key={`half-${i}`} className="absolute w-full border-t border-slate-100 border-dashed pointer-events-none" style={{ top: (i + 1) * 60 - 30 }}></div>
              ))}

              {/* 登録済みイベントの描画 */}
              {dayEvents.map((evt: any, idx: number) => {
                const startMins = timeToMins(evt.startTime);
                const endMins = timeToMins(evt.endTime);
                const height = endMins - startMins;
                const c = contents.find((x: any) => x.id === evt.contentId);
                const isEditingThis = editingIndex === idx;

                return (
                  <div
                    key={evt.id}
                    onClick={(e) => { e.stopPropagation(); handleEdit(idx); }}
                    className={`absolute left-2 right-2 p-1.5 rounded-lg overflow-hidden leading-tight shadow-sm transition-transform hover:scale-[1.02] ${
                      isEditingThis 
                        ? 'bg-orange-500 text-white z-20 border-2 border-orange-600' 
                        : 'bg-teal-500 text-white z-10 border border-teal-600'
                    }`}
                    style={{ top: startMins, height: Math.max(height, 20) }}
                  >
                    <div className="font-black text-xs">{evt.startTime} - {evt.endTime}</div>
                    <div className="text-[10px] truncate font-bold">{c?.name || '?'}</div>
                    <div className="text-[10px] mt-0.5">定員:{evt.capacity}人</div>
                  </div>
                );
              })}

              {/* 編集中/新規追加のドラフトイベント描画 */}
              {startTime && endTime && editingIndex === -1 && (
                <div
                  className="absolute left-4 right-4 bg-orange-400 border-2 border-orange-500 text-white p-1.5 rounded-lg overflow-hidden leading-tight shadow-md pointer-events-none z-30 opacity-90"
                  style={{
                    top: timeToMins(startTime),
                    height: Math.max(timeToMins(endTime) - timeToMins(startTime), 20)
                  }}
                >
                  <div className="font-black text-xs">{startTime} - {endTime}</div>
                  <div className="text-[10px] font-bold">(新規作成中)</div>
                </div>
              )}
            </div>
          </div>

          {/* 右側：入力フォームと登録済みリスト */}
          <div className="w-full md:w-1/2 overflow-y-auto flex flex-col gap-6 pr-2">
            
            {/* フォーム */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative">
              <h4 className="text-sm font-bold text-slate-700 mb-4 border-b pb-2">
                {editingIndex !== -1 ? "枠を編集" : "新規枠を追加"}
              </h4>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">コンテンツ</label>
                  <select value={contentId} onChange={e => setContentId(e.target.value)} className="w-full p-2.5 border rounded-lg text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none transition">
                    {contents.length === 0 && <option value="">コンテンツを先に登録してください</option>}
                    {contents.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name} (¥{c.price})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2">対象学年</label>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {['preschool_mid:年中', 'preschool_senior:年長', 'grade1:小1', 'grade2:小2', 'grade3:小3', 'grade4:小4', 'grade5:小5', 'grade6:小6', 'all_grades:全学年'].map(g => {
                      const [val, label] = g.split(':');
                      return (
                        <label key={val} className="flex items-center cursor-pointer bg-slate-50 px-2 py-1.5 rounded border border-slate-200 hover:bg-slate-100 transition">
                          <input 
                            type="checkbox" 
                            className="mr-1.5" 
                            checked={selectedGrades.includes(val)}
                            onChange={() => handleGradeToggle(val)}
                          />
                          <span className="font-bold text-slate-600">{label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-500 mb-1">開始</label>
                    <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full p-2 border rounded-lg text-sm font-bold text-slate-700 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-500 mb-1">終了</label>
                    <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full p-2 border rounded-lg text-sm font-bold text-slate-700 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none" />
                  </div>
                  <div className="w-20">
                    <label className="block text-xs font-bold text-slate-500 mb-1">定員</label>
                    <input type="number" value={capacity} onChange={e => setCapacity(e.target.value)} className="w-full p-2 border rounded-lg text-sm font-bold text-slate-700 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none text-center" />
                  </div>
                </div>

                <div className="pt-2 flex gap-3">
                  {editingIndex !== -1 && (
                    <button onClick={resetForm} className="flex-1 bg-slate-100 text-slate-600 font-bold py-2.5 rounded-lg text-sm hover:bg-slate-200 transition">
                      キャンセル
                    </button>
                  )}
                  <button onClick={handleSaveEvent} className="flex-[2] bg-teal-600 text-white font-bold py-2.5 rounded-lg text-sm hover:bg-teal-700 transition shadow-md">
                    {editingIndex !== -1 ? "更新して保存" : "追加して保存"}
                  </button>
                </div>
              </div>
            </div>

            {/* 登録済みリスト */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-sm font-bold text-slate-700 border-b pb-1">登録済みリスト</h4>
              </div>
              <div className="space-y-2 text-sm">
                {dayEvents.length === 0 ? (
                  <p className="text-slate-400 text-xs text-center py-4">この日の開催枠はまだありません。</p>
                ) : (
                  dayEvents.map((evt: any, idx: number) => {
                    const c = contents.find((x: any) => x.id === evt.contentId);
                    const isEditing = editingIndex === idx;
                    return (
                      <div 
                        key={evt.id} 
                        className={`flex justify-between items-center p-3 border rounded-lg transition ${
                          isEditing ? 'border-orange-500 bg-orange-50' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <div className="cursor-pointer flex-1" onClick={() => handleEdit(idx)}>
                          <span className="font-black text-slate-700">{evt.startTime}</span> 
                          <span className="text-slate-500 text-xs mx-1">- {evt.endTime}</span> 
                          <div className="text-xs font-bold text-teal-600 mt-1">{c?.name || '?'} <span className="text-slate-400 font-normal ml-1">(定員:{evt.capacity}人)</span></div>
                        </div>
                        <div className="flex gap-2 ml-2 pl-2 border-l border-slate-200">
                          {/* 複製ボタンを追加 */}
                          <button 
                            onClick={() => { setEventToCopy(evt); setIsCopyModalOpen(true); }} 
                            className="text-indigo-500 text-xs font-bold hover:bg-indigo-50 p-1.5 rounded transition"
                          >
                            複製
                          </button>
                          <button onClick={() => handleDeleteEvent(idx)} className="text-red-500 text-xs font-bold hover:bg-red-50 p-1.5 rounded transition">削除</button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 複製ダイアログ */}
      {isCopyModalOpen && eventToCopy && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-lg p-6 shadow-xl max-w-xs w-full animate-fade-in">
            <h4 className="font-bold text-slate-700 mb-3">枠の複製</h4>
            
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg mb-4 text-sm text-slate-600">
              <span className="font-black text-slate-800">{eventToCopy.startTime} - {eventToCopy.endTime}</span><br />
              <span className="text-xs">{contents.find((c: any) => c.id === eventToCopy.contentId)?.name || '?'}</span>
            </div>

            <p className="text-xs text-slate-500 mb-2">コピー先の日付を選択してください。</p>
            <input 
              type="date" 
              value={copyTargetDate}
              onChange={(e) => setCopyTargetDate(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg mb-6 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
            />
            <div className="flex justify-end gap-2">
              <button 
                onClick={() => { setIsCopyModalOpen(false); setCopyTargetDate(''); setEventToCopy(null); }} 
                className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-bold hover:bg-slate-200 transition"
              >
                キャンセル
              </button>
              <button 
                onClick={handleCopySchedule} 
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition shadow-sm"
              >
                複製を実行
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};