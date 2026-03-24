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

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

interface Props {
  schoolId: string;
  settings: any;
}

// 日付リストを生成するヘルパー関数
function getDateList(start: string, end: string) {
  const dates = [];
  let d = new Date(start);
  const endDate = new Date(end);
  while (d <= endDate) {
    dates.push(d.toISOString().split('T')[0]);
    d.setDate(d.getDate() + 1);
  }
  return dates;
}

// 色生成ヘルパー
function getColorForId(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
  return '#' + "00000".substring(0, 6 - c.length) + c;
}

export const DashboardStats: React.FC<Props> = ({ schoolId, settings }) => {
  const { bookings } = useBookings(schoolId);
  const { logs } = useLogs(schoolId);

  const [draftDate, setDraftDate] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]
  });
  const [appliedDate, setAppliedDate] = useState({ ...draftDate });
  
  const [trendMode, setTrendMode] = useState<'created' | 'event'>('event');

  // --- トップサマリー用データの計算 ---
  const topSummary = useMemo(() => {
    const totalCount = bookings.length;
    const now = new Date();
    const thisMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const thisMonthBookings = bookings.filter(b => b.date.startsWith(thisMonthPrefix));
    
    let thisMonthSales = 0;
    thisMonthBookings.forEach(b => {
      const content = settings?.contents?.find((c: any) => c.id === b.contentId);
      if (content) thisMonthSales += Number(content.price || 0);
    });

    return { totalCount, thisMonthCount: thisMonthBookings.length, thisMonthSales };
  }, [bookings, settings]);

  // --- 指定期間内の統計データ計算 ---
  const stats = useMemo(() => {
    const sDate = appliedDate.start;
    const eDate = appliedDate.end;
    const datesInPeriod = getDateList(sDate, eDate);

    // 1. 期間指定集計
    const periodBookings = bookings.filter(b => b.date >= sDate && b.date <= eDate);
    
    let periodCapacity = 0;
    datesInPeriod.forEach(dStr => {
      settings?.schedule?.[dStr]?.forEach((evt: any) => {
        periodCapacity += parseInt(evt.capacity || 0);
      });
    });
    
    const periodRate = periodCapacity > 0 ? Math.round((periodBookings.length / periodCapacity) * 100) : 0;

    // 2. 予約実績推移
    const contentTrendMap: any = {};
    (settings?.contents || []).forEach((c: any) => {
      contentTrendMap[c.id] = { label: c.name, data: Array(datesInPeriod.length).fill(0), color: getColorForId(c.id) };
    });
    contentTrendMap['unknown'] = { label: 'その他', data: Array(datesInPeriod.length).fill(0), color: '#94a3b8' };

    bookings.forEach(b => {
      let targetDate = '';
      if (trendMode === 'event') {
        targetDate = b.date;
      } else {
        if (b.createdAt) {
          const cd = b.createdAt.toDate ? b.createdAt.toDate() : new Date(b.createdAt.seconds * 1000);
          targetDate = cd.toISOString().split('T')[0];
        }
      }
      if (targetDate >= sDate && targetDate <= eDate) {
        const dIdx = datesInPeriod.indexOf(targetDate);
        if (dIdx !== -1) {
          const cid = contentTrendMap[b.contentId] ? b.contentId : 'unknown';
          contentTrendMap[cid].data[dIdx]++;
        }
      }
    });

    const trendDatasets = Object.values(contentTrendMap)
      .filter((c: any) => c.data.some((v: number) => v > 0))
      .map((c: any) => ({
        label: c.label,
        data: c.data,
        backgroundColor: c.color,
      }));

    // 3. コンテンツ別 予実管理
    const contentStatsMap: any = {};
    (settings?.contents || []).forEach((c: any) => {
      contentStatsMap[c.id] = { name: c.name, capacity: 0, booking: 0 };
    });
    contentStatsMap['unknown'] = { name: 'その他・不明', capacity: 0, booking: 0 };

    datesInPeriod.forEach(dStr => {
      settings?.schedule?.[dStr]?.forEach((evt: any) => {
        const cid = contentStatsMap[evt.contentId] ? evt.contentId : 'unknown';
        contentStatsMap[cid].capacity += parseInt(evt.capacity || 0);
      });
    });
    periodBookings.forEach(b => {
      const cid = contentStatsMap[b.contentId] ? b.contentId : 'unknown';
      contentStatsMap[cid].booking++;
    });

    // 4. 下部表示用（流入元、ファネル）
    const sourceCounts: any = {};
    periodBookings.forEach(b => {
      let label = b.sourceType === 'admin' ? '管理画面' : (b.utmSource || '直接/検索');
      sourceCounts[label] = (sourceCounts[label] || 0) + 1;
    });

    const funnel = { page_view: 0, grade_selection: 0, date_click: 0, content_selection: 0, form_input: 0, conversion: 0 };
    logs.forEach(log => {
      if (!log.timestamp || log.schoolId !== schoolId) return;
      const logDate = log.timestamp.toDate().toISOString().split('T')[0];
      if (logDate >= sDate && logDate <= eDate && funnel[log.event as keyof typeof funnel] !== undefined) {
        funnel[log.event as keyof typeof funnel]++;
      }
    });

    return {
      periodBookingCount: periodBookings.length,
      periodCapacity,
      periodRate,
      trendLabels: datesInPeriod.map(d => d.substring(5).replace('-', '/')),
      trendDatasets,
      contentStats: Object.values(contentStatsMap).filter((s: any) => s.capacity > 0 || s.booking > 0),
      sourceData: sourceCounts,
      funnel,
      cvr: funnel.page_view > 0 ? ((funnel.conversion / funnel.page_view) * 100).toFixed(2) : "0.00"
    };
  }, [bookings, settings, logs, appliedDate, trendMode, schoolId]);

  // ファネルのリスト用データ
  const funnelSteps = [
    { key: 'grade_selection', label: '学年選択' },
    { key: 'date_click', label: '日程クリック' },
    { key: 'content_selection', label: 'コンテンツ選択' },
    { key: 'form_input', label: 'フォーム入力' },
    { key: 'conversion', label: '申込完了' },
  ];

  // ファネルグラフデータ
  const funnelChartData = {
    labels: ['ページPV', '学年選択', '日程クリック', 'コンテンツ選択', 'フォーム入力', '申込完了'],
    datasets: [{
      label: 'アクセス数', // ツールチップ用
      data: [
        stats.funnel.page_view,
        stats.funnel.grade_selection,
        stats.funnel.date_click,
        stats.funnel.content_selection,
        stats.funnel.form_input,
        stats.funnel.conversion
      ],
      backgroundColor: ['#f1f5f9', '#cbd5e1', '#94a3b8', '#64748b', '#475569', '#ffffff'],
      borderRadius: 4,
      barPercentage: 0.5
    }]
  };

  return (
    <div className="space-y-6 bg-slate-50 min-h-screen font-sans">
      
      {/* トップサマリー */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-500 mb-2">現在の予約総数</p>
          <p className="text-4xl font-black text-slate-800">{topSummary.totalCount}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-500 mb-2">今月の予約</p>
          <p className="text-4xl font-black text-blue-600">{topSummary.thisMonthCount}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-500 mb-2">今月の売上金額</p>
          <p className="text-4xl font-black text-slate-800">¥{topSummary.thisMonthSales.toLocaleString()}</p>
        </div>
      </div>

      {/* 期間集計 ＆ 推移グラフ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col">
          <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            期間指定集計
          </h3>
          
          <div className="flex items-end gap-2 mb-8">
            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-500 mb-1">開始日</label>
              <input type="date" value={draftDate.start} onChange={e => setDraftDate({...draftDate, start: e.target.value})} className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-slate-800 outline-none" />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-500 mb-1">終了日</label>
              <input type="date" value={draftDate.end} onChange={e => setDraftDate({...draftDate, end: e.target.value})} className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-slate-800 outline-none" />
            </div>
            <button 
              onClick={() => setAppliedDate(draftDate)}
              className="bg-slate-700 text-white font-bold text-sm px-4 py-2 h-[38px] rounded hover:bg-slate-800 transition"
            >
              集計
            </button>
          </div>

          <div className="flex justify-between border border-slate-100 bg-slate-50 rounded-lg p-6 mt-auto">
            <div className="text-center">
              <p className="text-xs font-bold text-slate-500 mb-1">予約数</p>
              <p className="text-2xl font-black text-slate-800">{stats.periodBookingCount}</p>
            </div>
            <div className="text-center">
              <p className="text-xs font-bold text-slate-500 mb-1">総枠数</p>
              <p className="text-2xl font-black text-slate-800">{stats.periodCapacity}</p>
            </div>
            <div className="text-center">
              <p className="text-xs font-bold text-slate-500 mb-1">予約率</p>
              <p className="text-2xl font-black text-blue-600">{stats.periodRate}%</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold text-slate-700">予約実績推移 (積み上げ)</h3>
            <div className="flex bg-slate-100 p-1 rounded-md text-xs font-bold border border-slate-200">
              <button 
                onClick={() => setTrendMode('created')}
                className={`px-3 py-1 rounded transition-colors ${trendMode === 'created' ? 'bg-white border border-slate-300 shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
              >
                受付日
              </button>
              <button 
                onClick={() => setTrendMode('event')}
                className={`px-3 py-1 rounded transition-colors ${trendMode === 'event' ? 'bg-white border border-slate-300 shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
              >
                参加日
              </button>
            </div>
          </div>
          
          <div className="h-[250px]">
            <Bar 
              data={{ labels: stats.trendLabels, datasets: stats.trendDatasets }} 
              options={{ 
                maintainAspectRatio: false, 
                plugins: { legend: { display: false } },
                scales: { 
                  x: { stacked: true, grid: { display: false } }, 
                  y: { stacked: true, beginAtZero: true, ticks: { stepSize: 1 } } 
                } 
              }} 
            />
          </div>
        </div>
      </div>

      {/* コンテンツ別 予実管理 */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-sm font-bold text-slate-700 mb-6 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          コンテンツ別 予実管理 (総枠数 vs 予約数) <span className="text-xs text-slate-400 font-normal ml-2">※指定期間内の開催分を集計</span>
        </h3>
        <div className="h-[300px]">
          <Bar 
            data={{
              labels: stats.contentStats.map((s: any) => s.name),
              datasets: [
                { label: '予約数', data: stats.contentStats.map((s: any) => s.booking), backgroundColor: '#ea580c', barPercentage: 0.6 },
                { label: '総枠数(定員)', data: stats.contentStats.map((s: any) => s.capacity), backgroundColor: '#cbd5e1', barPercentage: 0.6 }
              ]
            }} 
            options={{ 
              maintainAspectRatio: false,
              plugins: { legend: { position: 'top', labels: { boxWidth: 12, font: { weight: 'bold' } } } },
              scales: {
                y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { stepSize: 1 } },
                x: { grid: { display: false }, ticks: { font: { weight: 'bold' } } }
              }
            }} 
          />
        </div>
      </div>

      {/* アクセス解析・流入元 */}
      <div className="mb-4">
        <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
          アクセス解析 & 流入元分析 <span className="text-xs text-slate-400 font-normal ml-2">※指定期間のログ集計値</span>
        </h3>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 左側: ファネル */}
        <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
          <div className="flex flex-col sm:flex-row gap-8 mb-8">
            <div className="flex flex-col items-center justify-start min-w-[120px] pt-4">
              <span className="text-blue-500 font-bold text-sm mb-1">CVR</span>
              <span className="text-4xl font-black text-blue-600">{stats.cvr}%</span>
            </div>
            
            <div className="flex-1">
              <p className="text-center text-sm font-bold text-slate-600 mb-4">コンバージョンファネル</p>
              <div className="space-y-1">
                <div className="flex justify-between items-center py-2 border-b border-white">
                  <span className="text-sm font-bold text-slate-700">ページPV</span>
                  <span className="text-sm font-bold text-slate-800 pr-1">{stats.funnel.page_view}</span>
                </div>
                {funnelSteps.map(step => {
                  const count = stats.funnel[step.key as keyof typeof stats.funnel];
                  const topRatio = stats.funnel.page_view > 0 ? Math.round((count / stats.funnel.page_view) * 100) : 0;
                  return (
                    <div key={step.key} className="flex justify-between items-center py-2 border-b border-white last:border-0">
                      <span className="text-sm font-bold text-slate-700">{step.label}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-slate-500 w-8 text-right">{count}</span>
                        <span className="text-[10px] font-bold text-blue-500 border border-blue-200 bg-white px-2 py-0.5 rounded w-20 text-center shadow-sm">
                          TOP比 {topRatio}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="h-[220px]">
            <Bar 
              data={funnelChartData} 
              options={{ 
                indexAxis: 'y' as const,
                maintainAspectRatio: false, 
                plugins: { legend: { display: false } },
                scales: { 
                  x: { display: false, grid: { display: false } }, 
                  y: { 
                    grid: { display: false }, 
                    border: { display: false },
                    ticks: { font: { weight: 'bold' }, color: '#475569' } 
                  } 
                }
              }} 
            />
          </div>
        </div>

        {/* 右側: 流入元 */}
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 flex flex-col items-center">
          <p className="text-center text-sm font-bold text-slate-600 mb-6">予約流入経路 (Source)</p>
          <div className="flex-1 w-full min-h-[300px]">
            <Doughnut 
              data={{
                labels: Object.keys(stats.sourceData),
                datasets: [{ data: Object.values(stats.sourceData), backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'], borderWidth: 0 }]
              }} 
              options={{ 
                maintainAspectRatio: false, 
                plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, padding: 20 } } }, 
                cutout: '65%' 
              }} 
            />
          </div>
        </div>
      </div>
      
    </div>
  );
};