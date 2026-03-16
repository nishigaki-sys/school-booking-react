import React, { useMemo, useState } from 'react';
import { useBookings } from '../../bookings/hooks/useBookings';
import { useLogs } from '../../logs/hooks/useLogs';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

// Chart.js のプラグイン・スケール登録
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface Props {
  schoolId: string;
  settings: any;
}

export const DashboardStats: React.FC<Props> = ({ schoolId, settings }) => {
  const { bookings } = useBookings(schoolId);
  const { logs } = useLogs(schoolId);

  // 1. 集計期間の状態（初期値：今月の1日〜末日）
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]
  });

  // 2. 統計ロジックの実行 (リファクタリング前コードを再現)
  const stats = useMemo(() => {
    const sDate = dateRange.start;
    const eDate = dateRange.end;

    // --- A. 期間内の予約フィルタリング ---
    const rangeBookings = bookings.filter(b => b.date >= sDate && b.date <= eDate);

    // --- B. 総定員数（稼働枠）の計算 ---
    let totalCapacity = 0;
    let d = new Date(sDate);
    const end = new Date(eDate);
    while (d <= end) {
      const dStr = d.toISOString().split('T')[0];
      if (settings?.schedule && settings.schedule[dStr]) {
        settings.schedule[dStr].forEach((s: any) => {
          totalCapacity += parseInt(s.capacity || 0);
        });
      }
      d.setDate(d.getDate() + 1);
    }

    // --- C. コンテンツ別パフォーマンス ---
    const contentStatsMap: any = {};
    (settings?.contents || []).forEach((c: any) => {
      contentStatsMap[c.id] = { name: c.name, capacity: 0, booking: 0 };
    });
    // 不明なコンテンツ（削除済み等）の受け皿
    contentStatsMap['unknown'] = { name: 'その他・不明', capacity: 0, booking: 0 };

    // 定員の集計
    let d2 = new Date(sDate);
    while (d2 <= end) {
      const dStr = d2.toISOString().split('T')[0];
      if (settings?.schedule && settings.schedule[dStr]) {
        settings.schedule[dStr].forEach((evt: any) => {
          const cid = contentStatsMap[evt.contentId] ? evt.contentId : 'unknown';
          contentStatsMap[cid].capacity += parseInt(evt.capacity || 0);
        });
      }
      d2.setDate(d2.getDate() + 1);
    }
    // 予約数の集計
    rangeBookings.forEach(b => {
      const cid = contentStatsMap[b.contentId] ? b.contentId : 'unknown';
      contentStatsMap[cid].booking++;
    });

    // --- D. 流入元分析 (Traffic Source) ---
    const sourceCounts: any = {};
    rangeBookings.forEach(b => {
      let label = '直接/検索';
      if (b.sourceType === 'admin') {
        label = '管理画面登録';
      } else if (b.utmSource) {
        label = b.utmSource;
        if (b.utmMedium) label += ` (${b.utmMedium})`;
      }
      sourceCounts[label] = (sourceCounts[label] || 0) + 1;
    });

    // --- E. 成約ファンネル分析 ---
    const funnel = {
      page_view: 0,
      grade_selection: 0,
      date_click: 0,
      content_selection: 0,
      form_input: 0,
      conversion: 0
    };

    logs.forEach(log => {
      if (!log.timestamp) return;
      const logDate = log.timestamp.toDate().toISOString().split('T')[0];
      if (logDate >= sDate && logDate <= eDate) {
        if (funnel[log.event as keyof typeof funnel] !== undefined) {
          funnel[log.event as keyof typeof funnel]++;
        }
      }
    });

    const cvr = funnel.page_view > 0 
      ? ((funnel.conversion / funnel.page_view) * 100).toFixed(2) 
      : "0.00";

    return {
      bookingCount: rangeBookings.length,
      totalCapacity,
      rate: totalCapacity > 0 ? Math.round((rangeBookings.length / totalCapacity) * 100) : 0,
      contentStats: Object.values(contentStatsMap).filter((s: any) => s.capacity > 0 || s.booking > 0),
      sourceLabels: Object.keys(sourceCounts),
      sourceData: Object.values(sourceCounts),
      funnel,
      cvr
    };
  }, [bookings, settings, logs, dateRange]);

  // 3. グラフ表示用設定
  const contentChartData = {
    labels: stats.contentStats.map((s: any) => s.name),
    datasets: [
      { label: '予約数', data: stats.contentStats.map((s: any) => s.booking), backgroundColor: '#f97316', borderRadius: 4 },
      { label: '定員数', data: stats.contentStats.map((s: any) => s.capacity), backgroundColor: '#cbd5e1', borderRadius: 4 }
    ]
  };

  const funnelChartData = {
    labels: ['ページPV', '学年選択', '日程選択', 'コース選択', '入力開始', '完了'],
    datasets: [{
      data: [
        stats.funnel.page_view,
        stats.funnel.grade_selection,
        stats.funnel.date_click,
        stats.funnel.content_selection,
        stats.funnel.form_input,
        stats.funnel.conversion
      ],
      backgroundColor: ['#f1f5f9', '#e2e8f0', '#cbd5e1', '#94a3b8', '#64748b', '#3b82f6'],
      borderRadius: 4,
      barPercentage: 0.6
    }]
  };

  const sourceChartData = {
    labels: stats.sourceLabels,
    datasets: [{
      data: stats.sourceData,
      backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'],
      borderWidth: 0
    }]
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 期間フィルター */}
      <div className="flex flex-wrap gap-4 items-end bg-slate-50 p-4 rounded-xl border border-slate-200">
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">集計開始日</label>
          <input type="date" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} className="block border-slate-200 rounded-lg p-2 text-sm font-bold shadow-sm focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
        <div className="text-slate-300 mb-2">〜</div>
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">集計終了日</label>
          <input type="date" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} className="block border-slate-200 rounded-lg p-2 text-sm font-bold shadow-sm focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
      </div>

      {/* サマリーパネル */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="期間内予約数" value={stats.bookingCount} unit="件" />
        <StatCard title="稼働定員数" value={stats.totalCapacity} unit="名" />
        <StatCard title="定員充足率" value={stats.rate} unit="%" color="text-blue-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ファンネル分析 */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <span className="w-1 h-4 bg-blue-500 rounded-full"></span>
              成約ファンネル (Conversion Funnel)
            </h3>
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase">CV Rate</p>
              <p className="text-xl font-black text-blue-600">{stats.cvr}%</p>
            </div>
          </div>
          <div className="h-[280px]">
            <Bar 
              data={funnelChartData} 
              options={{ 
                indexAxis: 'y' as const,
                maintainAspectRatio: false, 
                plugins: { legend: { display: false } },
                scales: { 
                  x: { grid: { display: false }, ticks: { display: false } }, 
                  y: { grid: { display: false }, ticks: { font: { weight: 'bold' } } } 
                }
              }} 
            />
          </div>
        </div>

        {/* 流入元分析 */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <h3 className="text-sm font-bold text-slate-700 mb-6 flex items-center gap-2">
            <span className="w-1 h-4 bg-indigo-500 rounded-full"></span>
            予約流入元
          </h3>
          <div className="flex-1 min-h-[200px]">
            <Doughnut 
              data={sourceChartData} 
              options={{ 
                maintainAspectRatio: false, 
                plugins: { 
                  legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10, weight: 'bold' } } } 
                },
                cutout: '65%'
              }} 
            />
          </div>
        </div>
      </div>

      {/* コース別比較 */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-sm font-bold text-slate-700 mb-6 flex items-center gap-2">
          <span className="w-1 h-4 bg-orange-500 rounded-full"></span>
          体験コース別パフォーマンス (予約数 vs 定員)
        </h3>
        <div className="h-[300px]">
          <Bar 
            data={contentChartData} 
            options={{ 
              maintainAspectRatio: false,
              plugins: { 
                legend: { position: 'top', align: 'end' as const, labels: { boxWidth: 12, font: { size: 11, weight: 'bold' } } } 
              },
              scales: {
                y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { stepSize: 1 } },
                x: { grid: { display: false }, ticks: { font: { weight: 'bold' } } }
              }
            }} 
          />
        </div>
      </div>
    </div>
  );
};

// サブコンポーネント: 統計カード
const StatCard = ({ title, value, unit, color = "text-slate-700" }: any) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm transition-transform hover:scale-[1.02]">
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
    <p className={`text-4xl font-black ${color}`}>{value}<span className="text-sm font-bold text-slate-300 ml-1">{unit}</span></p>
  </div>
);