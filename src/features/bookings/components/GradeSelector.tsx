import React from 'react';

// 学年の設定（元の GRADE_CONFIG を移植）
const GRADE_CONFIG: Record<string, { label: string; colorClass: string }> = {
  preschool_mid: { label: '年中', colorClass: 'border-pink-300 text-pink-500 hover:bg-pink-50' },
  preschool_senior: { label: '年長', colorClass: 'border-pink-300 text-pink-500 hover:bg-pink-50' },
  grade1: { label: '小1', colorClass: 'border-orange-400 text-orange-500 hover:bg-orange-50' },
  grade2: { label: '小2', colorClass: 'border-orange-400 text-orange-500 hover:bg-orange-50' },
  grade3: { label: '小3', colorClass: 'border-cyan-400 text-cyan-500 hover:bg-cyan-50' },
  grade4: { label: '小4', colorClass: 'border-cyan-400 text-cyan-500 hover:bg-cyan-50' },
  grade5: { label: '小5', colorClass: 'border-cyan-400 text-cyan-500 hover:bg-cyan-50' },
  grade6: { label: '小6', colorClass: 'border-cyan-400 text-cyan-500 hover:bg-cyan-50' },
  older: { label: 'それ以上', colorClass: 'border-cyan-400 text-cyan-500 hover:bg-cyan-50' }
};

interface Props {
  selectedGrade: string | null;
  onSelectGrade: (grade: string) => void;
}

export const GradeSelector: React.FC<Props> = ({ selectedGrade, onSelectGrade }) => {
  return (
    <div id="step1">
      <h2 className="text-lg font-bold mb-4 text-center flex items-center justify-center gap-2">
        <span className="bg-teal-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">1</span>
        お子様の学年
      </h2>
      <div className="grid grid-cols-3 gap-3">
        {Object.entries(GRADE_CONFIG).map(([gradeKey, config]) => {
          const isSelected = selectedGrade === gradeKey;
          // 選択されている場合は背景色を塗りつぶすなどのスタイル変更
          const activeClass = isSelected 
            ? 'bg-opacity-100 text-white transform scale-105 shadow-md ' + config.colorClass.replace('text-', 'bg-').split(' ')[0]
            : 'bg-white ' + config.colorClass;

          return (
            <button
              key={gradeKey}
              onClick={() => onSelectGrade(gradeKey)}
              className={`w-full text-sm font-bold py-3 px-2 border-2 rounded-xl transition-transform hover:scale-105 ${activeClass}`}
            >
              {config.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};