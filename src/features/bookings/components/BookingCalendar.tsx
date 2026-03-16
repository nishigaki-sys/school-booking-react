import React, { useState } from 'react';

interface Props {
  settings: any;
  allBookings: any[];
  selectedGrade: string | null;
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
}

// 学年マッチング用ヘルパー関数
const checkGradeMatch = (selectedBtnGrade: string | null, eventGrades: string[]) => {
  if (!selectedBtnGrade) return false;
  if (!eventGrades || eventGrades.length === 0) return false;
  if (eventGrades.includes('all_grades')) return true;
  return eventGrades.includes(selectedBtnGrade);
};

export const BookingCalendar: React.FC<Props> = ({ settings, allBookings, selectedGrade, selectedDate, onSelectDate }) => {
  const [viewDate, setViewDate] = useState(new Date());

  if (!selectedGrade) return null; // 学年が選ばれていない場合はカレンダーを表示しない

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const emptyCells = Array.from({ length: firstDay });
  const dayCells = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div className="mt-10 animate-fade-in">
      <h2 className="text-lg font-bold mb-4 text-center flex items-center justify-center gap-2">
        <span className="bg-teal-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">2</span>
        日程選択
      </h2>
      
      <div className="flex items-center justify-between mb-4 px-4">
        <button 
          onClick={() => setViewDate(new Date(year, month - 1, 1))}
          className="px-3 py-1 bg-slate-100 rounded-md hover:bg-slate-200 text-slate-600 font-bold"
        >&lt;</button>
        <h3 className="text-lg font-bold text-slate-700">{year}年 {month + 1}月</h3>
        <button 
          onClick={() => setViewDate(new Date(year, month + 1, 1))}
          className="px-3 py-1 bg-slate-100 rounded-md hover:bg-slate-200 text-slate-600 font-bold"
        >&gt;</button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-sm mb-2">
        <div className="font-bold text-red-400 py-2">日</div>
        <div className="font-bold text-slate-500 py-2">月</div>
        <div className="font-bold text-slate-500 py-2">火</div>
        <div className="font-bold text-slate-500 py-2">水</div>
        <div className="font-bold text-slate-500 py-2">木</div>
        <div className="font-bold text-slate-500 py-2">金</div>
        <div className="font-bold text-blue-400 py-2">土</div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-sm">
        {emptyCells.map((_, i) => <div key={`empty-${i}`} />)}

        {dayCells.map(day => {
          const dateObj = new Date(year, month, day);
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          
          let totalRemaining = 0;
          let hasEvent = false;

          // その日のイベントの空き枠を計算
          if (settings.schedule && settings.schedule[dateStr]) {
            settings.schedule[dateStr].forEach((evt: any) => {
              const content = (settings.contents || []).find((c: any) => c.id === evt.contentId);
              if (!content) return;

              const targetGrades = evt.grades || content.grades || [];
              if (checkGradeMatch(selectedGrade, targetGrades)) {
                hasEvent = true;
                const bookedCount = allBookings.filter(b => b.date === dateStr && b.startTime === evt.startTime && b.contentId === evt.contentId).length;
                const remaining = Math.max(0, parseInt(evt.capacity) - bookedCount);
                totalRemaining += remaining;
              }
            });
          }

          const isPast = dateObj < today;
          const isClickable = !isPast && hasEvent && totalRemaining > 0;
          const isSelected = selectedDate?.getTime() === dateObj.getTime();

          let cellClass = "aspect-square flex flex-col items-center justify-center rounded-lg transition border border-transparent ";
          let symbolHtml = <span className="text-xs text-slate-300">-</span>;

          if (isSelected) {
            cellClass += "bg-teal-600 text-white shadow-md transform scale-105";
            symbolHtml = <span className="text-white font-bold text-xs">○</span>;
          } else if (isPast || !hasEvent) {
            cellClass += "text-slate-400 bg-slate-50";
          } else if (totalRemaining >= 5) {
            cellClass += "bg-teal-50 text-teal-600 cursor-pointer hover:bg-teal-100 hover:scale-105 font-bold";
            symbolHtml = <span className="text-red-500 font-bold text-xs">◎</span>;
          } else if (totalRemaining > 0) {
            cellClass += "bg-teal-50 text-teal-600 cursor-pointer hover:bg-teal-100 hover:scale-105 font-bold";
            symbolHtml = <span className="text-blue-500 font-bold text-xs">○</span>;
          } else {
            cellClass += "text-slate-400 bg-slate-50";
            symbolHtml = <span className="text-slate-400 font-bold text-xs">×</span>;
          }

          return (
            <div 
              key={day} 
              className={cellClass}
              onClick={() => isClickable && onSelectDate(dateObj)}
            >
              <span className="text-sm font-bold leading-tight">{day}</span>
              {symbolHtml}
            </div>
          );
        })}
      </div>

      <div className="mt-3 text-xs text-center text-slate-500 flex justify-center gap-4">
        <span className="flex items-center"><span className="text-red-500 font-bold mr-1">◎</span> 余裕あり</span>
        <span className="flex items-center"><span className="text-blue-500 font-bold mr-1">○</span> 空きあり</span>
        <span className="flex items-center"><span className="text-slate-400 font-bold mr-1">×</span> 満席</span>
      </div>
    </div>
  );
};