import React from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useInquiries } from '../../inquiries/hooks/useInquiries';

interface Props {
  schoolId: string;
}

const APP_ID = 'robot-school-booking-v4';

export const InquiryManagement: React.FC<Props> = ({ schoolId }) => {
  const { inquiries, loading } = useInquiries(schoolId);

  // ステータス更新処理
  const handleStatusChange = async (inquiryId: string, newStatus: string) => {
    try {
      const docRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'inquiries', inquiryId);
      await updateDoc(docRef, { status: newStatus });
      // ※必要に応じてトースト通知などを追加
    } catch (error: any) {
      alert("ステータスの更新に失敗しました: " + error.message);
    }
  };

  // タイムスタンプをフォーマットするヘルパー関数
  const formatDate = (timestamp: any) => {
    if (!timestamp || !timestamp.toDate) return '-';
    const d = timestamp.toDate();
    return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  if (loading) return <div className="p-4 text-slate-500">データを読み込み中...</div>;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-fit">
      <h3 className="text-lg font-bold text-slate-700 mb-4">お問い合わせ (日時リクエスト) 一覧</h3>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-slate-600">
          <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500 border-b">
            <tr>
              <th className="px-6 py-4 w-32">受信日時</th>
              <th className="px-6 py-4">送信者情報</th>
              <th className="px-6 py-4">希望内容・質問</th>
              <th className="px-6 py-4 w-32 text-center">ステータス</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {inquiries.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-slate-400 text-sm">
                  お問い合わせはありません。
                </td>
              </tr>
            ) : (
              inquiries.map((inq) => {
                const status = inq.status || 'pending';
                
                // ステータスに応じた背景色の設定
                let selectBg = 'bg-white';
                if (status === 'pending') selectBg = 'bg-red-50 text-red-700 border-red-200';
                else if (status === 'in_progress') selectBg = 'bg-yellow-50 text-yellow-700 border-yellow-200';
                else if (status === 'completed') selectBg = 'bg-gray-50 text-gray-500 border-gray-200';

                return (
                  <tr key={inq.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4 text-xs font-mono text-slate-500 whitespace-nowrap">
                      {formatDate(inq.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-xs">
                      <div className="font-bold text-slate-700">{inq.name} 様</div>
                      <div className="text-slate-500 mt-1">{inq.phone}</div>
                      <div className="text-slate-500">{inq.email}</div>
                      <div className="mt-1 inline-block bg-slate-100 px-2 py-0.5 rounded text-[10px] text-slate-500">
                        学年: {inq.grade}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 whitespace-pre-wrap">
                      {inq.preferredSchedule}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <select
                        value={status}
                        onChange={(e) => handleStatusChange(inq.id, e.target.value)}
                        className={`text-xs p-1.5 rounded border ${selectBg} font-bold focus:outline-none focus:ring-2 focus:ring-blue-300 transition-colors cursor-pointer w-full text-center`}
                      >
                        <option value="pending">未対応</option>
                        <option value="in_progress">対応中</option>
                        <option value="completed">完了</option>
                      </select>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};