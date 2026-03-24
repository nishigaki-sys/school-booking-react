import React, { useState } from 'react';
import { useBookings } from '../../bookings/hooks/useBookings';

interface Props {
  schoolId: string;
  settings: any;
}

export const ScheduleCalendar: React.FC<Props> = ({ schoolId, settings }) => {
  const { bookings, loading } = useBookings(schoolId);
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const emptyCells = Array.from({ length: firstDay });
  const dayCells = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // 学年によってイベントブロックの色を変更する
  const getEventColorClass = (grades: string[] = []) => {
    if (grades.includes('all_grades')) return "bg-green-500 text-white";
    if (grades.some(g => g.startsWith('preschool'))) return "bg-pink-400 text-white";
    if (grades.some(g => g === 'grade1' || g === 'grade2')) return "bg-orange-400 text-white";
    return "bg-cyan-500 text-white";
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">カレンダーデータを読み込み中...</div>;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 min-h-[600px] animate-fade-in">
      {/* ヘッダー：月送りコントロール */}
      <div className="flex justify-between items-center mb-6">
        <button 
          onClick={handlePrevMonth} 
          className="px-4 py-2 border border-slate-300 rounded text-sm font-bold text-slate-600 hover:bg-slate-50 transition"
        >
          &lt; 前月
        </button>
        <h2 className="text-xl font-black text-slate-800">{year}年 {month + 1}月</h2>
        <button 
          onClick={handleNextMonth} 
          className="px-4 py-2 border border-slate-300 rounded text-sm font-bold text-slate-600 hover:bg-slate-50 transition"
        >
          翌月 &gt;
        </button>
      </div>

      {/* カレンダーグリッド */}
      <div className="border border-slate-200 rounded-lg overflow-hidden bg-slate-200">
        <div className="grid grid-cols-7 gap-px">
          {/* 曜日ヘッダー */}
          <div className="bg-white text-center py-2 text-xs font-bold text-red-500">日</div>
          <div className="bg-white text-center py-2 text-xs font-bold text-slate-600">月</div>
          <div className="bg-white text-center py-2 text-xs font-bold text-slate-600">火</div>
          <div className="bg-white text-center py-2 text-xs font-bold text-slate-600">水</div>
          <div className="bg-white text-center py-2 text-xs font-bold text-slate-600">木</div>
          <div className="bg-white text-center py-2 text-xs font-bold text-slate-600">金</div>
          <div className="bg-white text-center py-2 text-xs font-bold text-blue-500">土</div>

          {/* 前月の空セル */}
          {emptyCells.map((_, i) => (
            <div key={`empty-${i}`} className="bg-slate-50 min-h-[120px]"></div>
          ))}

          {/* 当月の日付セル */}
          {dayCells.map(day => {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayEvents = settings?.schedule?.[dateStr] || [];

            return (
              <div key={day} className="bg-white min-h-[120px] p-1 relative flex flex-col">
                <div className="text-[10px] font-bold text-slate-500 mb-1 ml-1">{day}</div>
                <div className="space-y-1">
                  {dayEvents.map((evt: any, idx: number) => {
                    const content = (settings?.contents || []).find((c: any) => c.id === evt.contentId);
                    
                    // その枠に対する予約数を計算
                    const bookedCount = bookings.filter(b => b.date === dateStr && b.startTime === evt.startTime && b.contentId === evt.contentId).length;
                    const remaining = Math.max(0, parseInt(evt.capacity) - bookedCount);
                    
                    const colorClass = getEventColorClass(evt.grades);

                    return (
                      <div key={idx} className={`${colorClass} p-1.5 rounded flex flex-col gap-0.5 transition-transform hover:scale-[1.02] cursor-default`}>
                        <div className="text-xs font-black leading-none">{evt.startTime}</div>
                        <div className="text-[10px] font-bold truncate leading-tight" title={content?.name}>
                          {content?.name || '不明なコンテンツ'}
                        </div>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-[9px] font-bold">
                            予約:{bookedCount}/{evt.capacity}
                          </span>
                          <span className="bg-white text-slate-800 px-1 rounded text-[9px] font-black">
                            残:{remaining}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};