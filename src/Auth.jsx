]// src/Auth.jsx
import React, { useState } from 'react';
import { supabase } from './supabase';
import { Wallet, Sparkles, Lock, User } from 'lucide-react';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    // 4자리 비밀번호 유효성 검사
    if (password.length !== 4 || isNaN(password)) {
      setErrorMessage('비밀번호는 숫자 4자리여야 합니다.');
      setLoading(false);
      return;
    }

    // Supabase 인증을 위해 가상의 이메일과 6자리 이상 비밀번호로 변환
    // (예: 아이디 "test1234" -> "test1234@ledger.com", 4자리 비밀번호 "1234" -> "12341234")
    const pseudoEmail = `${username.trim().toLowerCase()}@ledger.com`;
    const pseudoPassword = password + password; 

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ 
        email: pseudoEmail, 
        password: pseudoPassword 
      });
      
      if (error) {
        if (error.message.includes('already registered')) {
          setErrorMessage('이미 존재하는 아이디입니다.');
        } else {
          setErrorMessage('회원가입 실패: ' + error.message);
        }
      } else {
        alert('회원가입이 완료되었습니다! 로그인해 주세요.');
        setIsSignUp(false);
        setPassword('');
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ 
        email: pseudoEmail, 
        password: pseudoPassword 
      });
      
      if (error) {
        setErrorMessage('아이디 또는 4자리 비밀번호가 올바르지 않습니다.');
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-800/60 backdrop-blur-md p-8 rounded-3xl border border-slate-700/50 shadow-2xl space-y-6">
        
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-gradient-to-tr from-indigo-500 to-violet-500 rounded-2xl shadow-lg shadow-indigo-500/30 text-white mb-2">
            <Wallet size={32} />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-2">
            Neon Ledger <Sparkles size={18} className="text-amber-400" />
          </h1>
          <p className="text-xs text-slate-400">간편하게 시작하는 나만의 자산 관리</p>
        </div>

        {errorMessage && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs p-3 rounded-xl text-center">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">아이디</label>
            <div className="relative">
              <User size={16} className="absolute left-3.5 top-4 text-slate-500" />
              <input 
                type="text" 
                required
                placeholder="사용할 아이디 입력"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-900/80 border border-slate-700/80 rounded-2xl pl-10 pr-4 py-3.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">비밀번호 (숫자 4자리)</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-4 text-slate-500" />
              <input 
                type="password" 
                maxLength="4"
                required
                placeholder="••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900/80 border border-slate-700/80 rounded-2xl pl-10 pr-4 py-3.5 text-sm text-slate-200 tracking-widest focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-bold py-3.5 rounded-2xl transition-all shadow-lg shadow-indigo-500/25 active:scale-[0.99]"
          >
            {loading ? '처리 중...' : (isSignUp ? '간편 회원가입' : '로그인')}
          </button>
        </form>

        <div className="text-center">
          <button 
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-xs text-indigo-400 hover:underline"
          >
            {isSignUp ? '이미 계정이 있으신가요? 로그인하기' : '계정이 없으신가요? 회원가입하기'}
          </button>
        </div>

      </div>
    </div>
  );
}