import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Wallet, TrendingUp, TrendingDown, PlusCircle, Trash2, 
  Search, Calendar, DollarSign, Sparkles, LogOut, Trophy, 
  Repeat, X, Eye, EyeOff, UserX
} from 'lucide-react';

// Supabase 클라이언트 초기화 (환경 변수 또는 직접 입력)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [rankings, setRankings] = useState([]);
  
  // 폼 입력 상태
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('식비');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // UI 필터 및 설정 상태
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [hideRanking, setHideRanking] = useState(() => {
    return localStorage.getItem('hide_ranking') === 'true';
  });

  // 인증 상태 관리
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 데이터 불러오기
  useEffect(() => {
    if (session) {
      fetchTransactions();
      fetchRankings();
    }
  }, [session, hideRanking]);

  const fetchTransactions = async () => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false });

    if (error) console.error('트랜잭션 조회 에러:', error.message);
    else setTransactions(data || []);
  };

  const fetchRankings = async () => {
    if (hideRanking) {
      setRankings([]);
      return;
    }

    const { data, error } = await supabase.rpc('get_community_ranking');
    if (error) {
      console.error('랭킹 조회 에러:', error.message);
    } else {
      setRankings(data || []);
    }
  };

  // 랭킹 숨김 토글 핸들러
  const handleToggleHideRanking = () => {
    const nextVal = !hideRanking;
    setHideRanking(nextVal);
    localStorage.setItem('hide_ranking', nextVal);
    if (nextVal) {
      setRankings([]);
    } else {
      fetchRankings();
    }
  };

  // 거래 내역 추가
  const handleAddTransaction = async (e) => {
    e.preventDefault();
    if (!amount || !category) return;

    const { error } = await supabase.from('transactions').insert([
      {
        user_id: session.user.id,
        type,
        amount: parseFloat(amount),
        category,
        description,
        date,
      },
    ]);

    if (error) {
      alert('추가 실패: ' + error.message);
    } else {
      setAmount('');
      setDescription('');
      fetchTransactions();
      fetchRankings();
    }
  };

  // 거래 내역 삭제
  const handleDeleteTransaction = async (id) => {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) {
      alert('삭제 실패: ' + error.message);
    } else {
      fetchTransactions();
      fetchRankings();
    }
  };

  // 회원탈퇴 기능
  const handleDeleteAccount = async () => {
    const confirmed = window.confirm("정말 탈퇴하시겠습니까? 모든 자산 기록이 영구적으로 삭제되며 복구할 수 없습니다.");
    if (!confirmed) return;

    try {
      const { error } = await supabase.rpc('delete_user_account');
      
      if (error) {
        console.error("Supabase RPC 에러 상세:", error);
        alert(`탈퇴 실패: ${error.message || JSON.stringify(error)}`);
        return;
      }

      await supabase.auth.signOut();
      alert("회원탈퇴가 정상적으로 처리되었습니다.");
      window.location.reload();
    } catch (err) {
      console.error("예외 발생:", err);
      alert("탈퇴 처리 중 예외가 발생했습니다: " + (err.message || err));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        로딩 중...
      </div>
    );
  }

  // 로그인이 안 되어 있는 경우 (로그인/회원가입 화면)
  if (!session) {
    return <AuthView />;
  }

  // 계산 로직
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const netBalance = totalIncome - totalExpense;

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.description?.toLowerCase().includes(searchTerm.toLowerCase()) || t.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || t.type === filterType;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-24">
      {/* 상단 헤더 */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl overflow-hidden shadow-lg border border-slate-700/50 flex items-center justify-center bg-indigo-600 text-white font-bold">
              <Wallet size={22} />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-1.5">
                AssetPulse <Sparkles size={15} className="text-amber-400" />
              </h1>
              <p className="text-xs text-slate-400">스마트 자산 관리 & 랭킹</p>
            </div>
          </div>

          {/* 우측 버튼 그룹 (회원탈퇴 + 로그아웃) */}
          <div className="flex items-center gap-2">
            <button 
              onClick={handleDeleteAccount}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-xl text-xs font-semibold text-rose-400 transition-colors"
              title="계정 삭제 및 회원탈퇴"
            >
              <UserX size={14} /> <span className="hidden sm:inline">회원탈퇴</span>
            </button>
            <button 
              onClick={() => supabase.auth.signOut()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 transition-colors"
            >
              <LogOut size={14} /> <span className="hidden sm:inline">로그아웃</span>
            </button>
          </div>
        </div>
      </header>

      {/* 메인 컨테이너 */}
      <main className="max-w-5xl mx-auto px-4 pt-6 space-y-6">
        
        {/* 요약 카드 영역 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-xl backdrop-blur">
            <p className="text-xs text-slate-400 font-medium">총 자산 잔액</p>
            <h2 className={`text-2xl font-black mt-1 ${netBalance >= 0 ? 'text-indigo-400' : 'text-rose-400'}`}>
              ₩ {netBalance.toLocaleString()}
            </h2>
          </div>
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-xl backdrop-blur">
            <p className="text-xs text-emerald-400 font-medium flex items-center gap-1">
              <TrendingUp size={14} /> 총 수입
            </p>
            <h2 className="text-2xl font-black text-white mt-1">₩ {totalIncome.toLocaleString()}</h2>
          </div>
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-xl backdrop-blur">
            <p className="text-xs text-rose-400 font-medium flex items-center gap-1">
              <TrendingDown size={14} /> 총 지출
            </p>
            <h2 className="text-2xl font-black text-white mt-1">₩ {totalExpense.toLocaleString()}</h2>
          </div>
        </div>

        {/* 입력 폼 & 랭킹 그리드 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* 거래 입력 폼 */}
          <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-xl">
            <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
              <PlusCircle size={16} className="text-indigo-400" />새 거래 내역 추가
            </h3>
            <form onSubmit={handleAddTransaction} className="space-y-4">
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setType('expense')}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${type === 'expense' ? 'bg-rose-500 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  지출
                </button>
                <button
                  type="button"
                  onClick={() => setType('income')}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${type === 'income' ? 'bg-emerald-500 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  수입
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">금액 (원)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="금액을 입력하세요"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">카테고리</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="식비">식비</option>
                    <option value="교통">교통</option>
                    <option value="주거/통신">주거/통신</option>
                    <option value="문화/여가">문화/여가</option>
                    <option value="급여">급여</option>
                    <option value="기타">기타</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">날짜</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">메모</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="상세 내용을 적어주세요"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-colors shadow-lg shadow-indigo-600/30"
              >
                내역 추가하기
              </button>
            </form>
          </div>

          {/* 커뮤니티 랭킹 영역 */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <Trophy size={16} className="text-amber-400" /> 지출 랭킹 톱 10
                </h3>
                <button
                  onClick={handleToggleHideRanking}
                  title={hideRanking ? "랭킹 참여하기" : "랭킹 숨기기"}
                  className="p-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                >
                  {hideRanking ? <EyeOff size={14} className="text-rose-400" /> : <Eye size={14} className="text-indigo-400" />}
                </button>
              </div>

              {hideRanking ? (
                <div className="text-center py-10 text-xs text-slate-500">
                  랭킹 참여가 숨겨져 있습니다.<br />상단 눈 모양 아이콘을 눌러 참여하세요.
                </div>
              ) : rankings.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-500">
                  표시할 랭킹 데이터가 없습니다.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
                  {rankings.map((r, idx) => (
                    <div key={r.user_id} className="flex items-center justify-between p-2.5 bg-slate-950/70 border border-slate-800/50 rounded-xl text-xs">
                      <div className="flex items-center gap-2.5">
                        <span className={`w-5 h-5 flex items-center justify-center font-bold rounded-full text-[10px] ${idx === 0 ? 'bg-amber-400 text-slate-950' : idx === 1 ? 'bg-slate-300 text-slate-950' : idx === 2 ? 'bg-amber-700 text-white' : 'bg-slate-800 text-slate-400'}`}>
                          {idx + 1}
                        </span>
                        <span className="text-slate-300 truncate max-w-[100px]">
                          {r.user_id === session.user.id ? '나 (Me)' : `유저 ...${r.user_id.slice(-4)}`}
                        </span>
                      </div>
                      <span className="font-bold text-white">₩ {Number(r.total_expense).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <p className="text-[11px] text-slate-500 mt-4 pt-3 border-t border-slate-800/60">
              * 지출이 적은 순서대로 10명이 노출됩니다.
            </p>
          </div>

        </div>

        {/* 내역 목록 테이블 및 검색/필터 */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
            <h3 className="text-sm font-bold text-slate-200">상세 거래 내역</h3>
            
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-60">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="내역 또는 카테고리 검색"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="all">전체</option>
                <option value="expense">지출만</option>
                <option value="income">수입만</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-3 font-medium">날짜</th>
                  <th className="pb-3 font-medium">분류</th>
                  <th className="pb-3 font-medium">메모</th>
                  <th className="pb-3 font-medium text-right">금액</th>
                  <th className="pb-3 font-medium text-center">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-slate-500">
                      등록된 거래 내역이 없습니다.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-950/40 transition-colors">
                      <td className="py-3 text-slate-400">{t.date}</td>
                      <td className="py-3">
                        <span className="px-2 py-1 bg-slate-800 rounded-lg text-slate-300 font-medium">
                          {t.category}
                        </span>
                      </td>
                      <td className="py-3 text-slate-300">{t.description || '-'}</td>
                      <td className={`py-3 text-right font-bold ${t.type === 'income' ? 'text-emerald-400' : 'text-slate-100'}`}>
                        {t.type === 'income' ? '+' : '-'} ₩ {Number(t.amount).toLocaleString()}
                      </td>
                      <td className="py-3 text-center">
                        <button
                          onClick={() => handleDeleteTransaction(t.id)}
                          className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                          title="삭제"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}

// 로그인 및 회원가입 컴포넌트
function AuthView() {
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
          <h1 className="text-2xl font-black text-white tracking-tight">AssetPulse</h1>
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