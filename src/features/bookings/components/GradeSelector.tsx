import React from 'react';

// 学年の設定：非アクティブ時(baseClass)とアクティブ時(activeClass)のスタイルを明示的に定義
const GRADE_CONFIG: Record<string, { label: string; baseClass: string; activeClass: string }> = {
  preschool_mid: { 
    label: '年中', 
    baseClass: 'bg-white border-pink-400 text-pink-500 hover:bg-pink-50',
    activeClass: 'bg-pink-400 border-pink-400 text-white shadow-md'
  },
  preschool_senior: { 
    label: '年長', 
    baseClass: 'bg-white border-pink-400 text-pink-500 hover:bg-pink-50',
    activeClass: 'bg-pink-400 border-pink-400 text-white shadow-md'
  },
  grade1: { 
    label: '小1', 
    baseClass: 'bg-white border-orange-400 text-orange-500 hover:bg-orange-50',
    activeClass: 'bg-orange-400 border-orange-400 text-white shadow-md'
  },
  grade2: { 
    label: '小2', 
    baseClass: 'bg-white border-orange-400 text-orange-500 hover:bg-orange-50',
    activeClass: 'bg-orange-400 border-orange-400 text-white shadow-md'
  },
  grade3: { 
    label: '小3', 
    baseClass: 'bg-white border-cyan-400 text-cyan-500 hover:bg-cyan-50',
    activeClass: 'bg-cyan-400 border-cyan-400 text-white shadow-md'
  },
  grade4: { 
    label: '小4', 
    baseClass: 'bg-white border-cyan-400 text-cyan-500 hover:bg-cyan-50',
    activeClass: 'bg-cyan-400 border-cyan-400 text-white shadow-md'
  },
  grade5: { 
    label: '小5', 
    baseClass: 'bg-white border-cyan-400 text-cyan-500 hover:bg-cyan-50',
    activeClass: 'bg-cyan-400 border-cyan-400 text-white shadow-md'
  },
  grade6: { 
    label: '小6', 
    baseClass: 'bg-white border-cyan-400 text-cyan-500 hover:bg-cyan-50',
    activeClass: 'bg-cyan-400 border-cyan-400 text-white shadow-md'
  },
  older: { 
    label: 'それ以上', 
    baseClass: 'bg-white border-cyan-400 text-cyan-500 hover:bg-cyan-50',
    activeClass: 'bg-cyan-400 border-cyan-400 text-white shadow-md'
  }
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
          // 選択状態に応じて適用するクラスを切り替え
          const btnClass = isSelected 
            ? `${config.activeClass} transform scale-105`
            : `${config.baseClass}`;

          return (
            <button
              key={gradeKey}
              onClick={() => onSelectGrade(gradeKey)}
              className={`w-full text-sm font-bold py-3 px-2 border-2 rounded-xl transition-transform hover:scale-105 ${btnClass}`}
            >
              {config.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};