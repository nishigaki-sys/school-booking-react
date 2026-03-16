import React, { useState, useEffect } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase'; // ステップ1で作成したパスに合わせて調整してください

export const AdminLogin: React.FC = () => {
  // 入力フォームの状態管理
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // IPアドレスとUIの状態管理
  const [ipAddress, setIpAddress] = useState<string>('取得中...');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 初回マウント時にIPアドレスを取得
  useEffect(() => {
    const fetchIp = async () => {
      try {
        const res = await fetch('https://api.ipify.org?format=json');
        const data = await res.json();
        setIpAddress(data.ip);
      } catch (e) {
        console.error("IP取得失敗", e);
        setIpAddress('取得失敗');
      }
    };
    fetchIp();
  }, []);

  // ログイン処理
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); // フォームの標準送信（画面リロード）をキャンセル
    setError(null);

    if (!email || !password) {
      setError('メールアドレスとパスワードを入力してください');
      return;
    }

    setIsLoading(true);
    try {
      // Firebase Authでログイン処理
      await signInWithEmailAndPassword(auth, email, password);
      // ※ログイン成功後の画面遷移は、App.tsxに記述した <Route> の判定によって自動的に行われます
    } catch (err: any) {
      console.error(err);
      setError('ログイン失敗: メールアドレスまたはパスワードが間違っています。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-800">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-sm">
        <h1 className="text-2xl font-extrabold text-center text-slate-700 mb-2">管理者ログイン</h1>
        <p className="text-xs text-center text-slate-400 mb-4">ロボットプログラミング教室 管理システム</p>

        {/* IPアドレス表示エリア */}
        <div className="bg-slate-100 p-2 rounded text-center mb-6 border border-slate-200">
          <p className="text-[10px] text-slate-500">あなたのIPアドレス</p>
          <p className="text-xs font-mono font-bold text-slate-700">{ipAddress}</p>
        </div>

        {/* エラーメッセージ表示エリア */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded mb-4 font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-600 mb-1">メールアドレス</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="admin@example.com"
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-600 mb-1">パスワード</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="••••••••"
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-slate-700 text-white font-bold rounded-lg hover:bg-slate-600 transition disabled:opacity-50"
          >
            {isLoading ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>
        
        <p className="text-[10px] text-center text-slate-400 mt-4">
          ※登録されたユーザー情報でログインしてください
        </p>
      </div>
    </div>
  );
};