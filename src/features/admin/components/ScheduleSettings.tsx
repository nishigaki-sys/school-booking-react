import React, { useState } from 'react';
import { ScheduleModal } from './ScheduleModal'; // 次のステップで作成します

interface Props {
  schoolId: string;
  settings: any;
  onSaveSettings: (newSettings: any) => Promise<void>;
}

export const ScheduleSettings: React.FC<Props> = ({ schoolId, settings, onSaveSettings }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const emptyCells = Array.from({ length: firstDay });
  const dayCells = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // イベントの色を決定する簡易関数（元の admin.js の getEventColorClass に相当）
  const getEventColorClass = (grades: string[] = []) => {
    if (grades.includes('all_grades')) return "bg-green-500 text-white";
    if (grades.some(g => g.startsWith('preschool'))) return "bg-pink-400 text-white";
    if (grades.some(g => g === 'grade1' || g === 'grade2')) return "bg-orange-400 text-white";
    return "bg-cyan-500 text-white";
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-fit">
      <h3 className="text-lg font-bold text-slate-700 mb-4 pb-2 border-b">2. 開催日程登録</h3>
      
      <div className="flex justify-between items-center mb-4">
        <button onClick={handlePrevMonth} className="px-3 py-1 border rounded text-xs hover:bg-slate-50">&lt;</button>
        <span className="font-bold">{year}年 {month + 1}月</span>
        <button onClick={handleNextMonth} className="px-3 py-1 border rounded text-xs hover:bg-slate-50">&gt;</button>
      </div>

      <div className="border rounded text-xs">
        <div className="grid grid-cols-7 bg-slate-50 text-center py-2 font-bold text-slate-500 border-b">
          <div className="text-red-400">日</div><div>月</div><div>火</div><div>水</div><div>木</div><div>金</div><div className="text-blue-400">土</div>
        </div>
        <div className="grid grid-cols-7 gap-px bg-slate-200">
          {emptyCells.map((_, i) => <div key={`empty-${i}`} className="bg-white min-h-[60px] p-1 border-r border-b"></div>)}
          
          {dayCells.map(day => {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayEvents = settings?.schedule?.[dateStr] || [];

            return (
              <div 
                key={day} 
                className="bg-white min-h-[60px] p-1 border-r border-b hover:bg-yellow-50 cursor-pointer transition relative"
                onClick={() => setSelectedDateStr(dateStr)}
              >
                <div className="font-bold text-slate-400 mb-1 text-xs">{day}</div>
                {dayEvents.map((evt: any, idx: number) => {
                  const content = (settings?.contents || []).find((c: any) => c.id === evt.contentId);
                  const colorClass = getEventColorClass(evt.grades);
                  return (
                    <div key={idx} className={`${colorClass} rounded px-1 mb-1 text-[10px] truncate border border-white`}>
                      {evt.startTime} {content?.name || '?'}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
      <p className="text-xs text-right mt-2 text-slate-400">日付をクリックして枠を追加・編集</p>

      {/* スケジュール詳細モーダル */}
      {selectedDateStr && (
        <ScheduleModal
          dateStr={selectedDateStr}
          settings={settings}
          onClose={() => setSelectedDateStr(null)}
          onSaveSettings={onSaveSettings}
        />
      )}
    </div>
  );
};