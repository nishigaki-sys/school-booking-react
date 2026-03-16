import React, { useState } from 'react';

interface Props {
  schoolId: string;
}

export const UrlGenerator: React.FC<Props> = ({ schoolId }) => {
  // 入力値のState
  const [utmSource, setUtmSource] = useState('');
  const [utmMedium, setUtmMedium] = useState('');
  const [utmCampaign, setUtmCampaign] = useState('');
  const [copied, setCopied] = useState(false);

  // 入力値からURLを動的に生成する処理
  const generateUrl = () => {
    if (!schoolId) return '';

    // 本番環境のURLに合わせてベースURLを変更してください
    // ここでは現在のホスト名を使用する想定にしています
    const baseUrl = `${window.location.origin}/?school=${schoolId}`;
    
    const params = new URLSearchParams();
    if (utmSource) params.append('utm_source', utmSource);
    if (utmMedium) params.append('utm_medium', utmMedium);
    if (utmCampaign) params.append('utm_campaign', utmCampaign);

    const queryString = params.toString();
    return queryString ? `${baseUrl}&${queryString}` : baseUrl;
  };

  const generatedUrl = generateUrl();

  // クリップボードにコピーする処理
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedUrl);
      setCopied(true);
      // 3秒後に「コピーしました」の表示を元に戻す
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      alert('コピーに失敗しました。手動でコピーしてください。');
    }
  };

  return (
    <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 max-w-2xl mx-auto h-fit">
      <h3 className="text-xl font-bold text-slate-700 mb-6 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
        集客用URL作成ツール
      </h3>
      <p className="text-sm text-slate-500 mb-6">
        広告やSNS投稿用の計測パラメータ（UTM）付きURLを作成します。<br />
        ここで作成したURLを使用することで、「どの媒体から」「どのキャンペーンで」予約が入ったかを集計できます。
      </p>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">参照元 (utm_source) <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={utmSource}
              onChange={(e) => setUtmSource(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="例: instagram, google, flyer"
            />
            <p className="text-[10px] text-slate-400 mt-1">流入元（インスタ、Google検索、チラシなど）</p>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">メディア (utm_medium)</label>
            <input
              type="text"
              value={utmMedium}
              onChange={(e) => setUtmMedium(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="例: story, cpc, qr"
            />
            <p className="text-[10px] text-slate-400 mt-1">媒体の種類（ストーリーズ、検索広告、QRなど）</p>
          </div>
        </div>
        
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">キャンペーン名 (utm_campaign)</label>
          <input
            type="text"
            value={utmCampaign}
            onChange={(e) => setUtmCampaign(e.target.value)}
            className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            placeholder="例: spring_campaign_2025"
          />
          <p className="text-[10px] text-slate-400 mt-1">特定のキャンペーンやプロモーション名</p>
        </div>

        <div className="pt-4 border-t mt-4">
          <label className="block text-xs font-bold text-slate-600 mb-2">生成されたURL</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={generatedUrl}
              className="flex-1 p-3 border border-indigo-200 bg-indigo-50 rounded text-sm text-slate-600 font-mono focus:outline-none"
              readOnly
            />
            <button
              onClick={handleCopy}
              className={`font-bold px-4 py-2 rounded transition whitespace-nowrap ${
                copied 
                  ? 'bg-green-500 text-white hover:bg-green-600' 
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              {copied ? 'コピーしました！' : 'コピー'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};