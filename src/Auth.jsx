import React, { useState } from 'react';
import { Wallet } from 'lucide-react';
import { supabase } from '../App'; // Supabase 클라이언트가 있는 경로에 맞게 수정해주세요 (예: './App' 또는 './supabaseClient')

export default function AuthView() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) alert(error.message);
      else alert('회원가입 확인 메일이 발송되었습니다. 메일함을 확인해주세요!');
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert(error.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl backdrop-blur">
        <div className="flex flex-col items-center justify-center space-y-3 mb-8">
          <div className="w-16 h-16 rounded-3xl overflow-hidden shadow-xl border border-slate-700/50 flex items-center justify-center bg-indigo-600 text-white font-bold">
            <Wallet size={32} />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">가계부</h1>
          <p className="text-xs text-slate-400">스마트한 자산 관리와 커뮤니티 랭킹</p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 block mb-1">이메일 주소</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-colors shadow-lg shadow-indigo-600/30 disabled:opacity-50"
          >
            {loading ? '처리 중...' : isSignUp ? '회원가입하기' : '로그인'}
          </button>
        </form>

        <div className="text-center mt-6">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-xs text-slate-400 hover:text-indigo-400 transition-colors"
          >
            {isSignUp ? '이미 계정이 있으신가요? 로그인' : '계정이 없으신가요? 회원가입'}
          </button>
        </div>
      </div>
    </div>
  );
}