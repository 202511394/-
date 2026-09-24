import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Wallet, TrendingUp, TrendingDown, PlusCircle, Trash2, 
  Search, Calendar, DollarSign, Sparkles, LogOut, Trophy, 
  Repeat, X, Eye, EyeOff, UserX, Sun, Moon, Edit3, 
  ChevronLeft, ChevronRight, LayoutList, CalendarDays
} from 'lucide-react';

// Supabase 클라이언트 초기화
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [recurringList, setRecurringList] = useState([]);
  const [rankings, setRankings] = useState([]);
  
  // 테마 상태 관리
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) {
      if (saved === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return saved;
    }
    document.documentElement.classList.add('dark');
    return 'dark';
  });

  // 팝업(모달) 상태
  const [modalType, setModalType] = useState(null);
  const [selectedDateTransactions, setSelectedDateTransactions] = useState(null); // 캘린더 날짜 클릭 시 상세 팝업

  // 거래 입력 및 수정 폼 상태
  const [editingId, setEditingId] = useState(null);
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('식비');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // 고정지출 폼 상태
  const [recTitle, setRecTitle] = useState('');
  const [recAmount, setRecAmount] = useState('');
  const [recDate, setRecDate] = useState('25');

  // UI 필터 및 설정 상태
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [viewMode, setViewMode] = useState('list'); // 'list' 또는 'calendar'
  const [currentDate, setCurrentDate] = useState(new Date()); // 캘린더 현재 연/월
  const [hideRanking, setHideRanking] = useState(() => {
    return localStorage.getItem('hide_ranking') === 'true';
  });

  // 테마 적용 효과
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

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
      fetchRecurring();
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

  const fetchRecurring = async () => {
    const { data, error } = await supabase
      .from('recurring_expenses')
      .select('*')
      .order('pay_date', { ascending: true });

    if (error) console.error('고정지출 조회 에러:', error.message);
    else setRecurringList(data || []);
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

  const handleSubmitTransaction = async (e) => {
    e.preventDefault();
    if (!amount || !category) return;

    if (editingId) {
      const { error } = await supabase
        .from('transactions')
        .update({ type, amount: parseFloat(amount), category, description, date })
        .eq('id', editingId);

      if (error) alert('수정 실패: ' + error.message);
      else {
        resetForm();
        fetchTransactions();
        fetchRankings();
      }
    } else {
      const { error } = await supabase.from('transactions').insert([
        { user_id: session.user.id, type, amount: parseFloat(amount), category, description, date }
      ]);

      if (error) alert('추가 실패: ' + error.message);
      else {
        resetForm();
        fetchTransactions();
        fetchRankings();
      }
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setAmount('');
    setDescription('');
    setDate(new Date().toISOString().split('T')[0]);
  };

  const handleEditClick = (t) => {
    setEditingId(t.id);
    setType(t.type);
    setAmount(t.amount);
    setCategory(t.category);
    setDescription(t.description || '');
    setDate(t.date);
    setModalType(null);
    setSelectedDateTransactions(null);
    window.scrollTo({ top: 200, behavior: 'smooth' });
  };

  const handleDeleteTransaction = async (id) => {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) {
      alert('삭제 실패: ' + error.message);
    } else {
      if (editingId === id) resetForm();
      fetchTransactions();
      fetchRankings();
      if (selectedDateTransactions) {
        setSelectedDateTransactions(prev => prev.filter(item => item.id !== id));
      }
    }
  };

  const handleAddRecurring = async (e) => {
    e.preventDefault();
    if (!recTitle || !recAmount) return;

    const { error } = await supabase.from('recurring_expenses').insert([
      { user_id: session.user.id, title: recTitle, amount: parseFloat(recAmount), pay_date: parseInt(recDate) }
    ]);

    if (error) alert('고정지출 추가 실패: ' + error.message);
    else {
      setRecTitle('');
      setRecAmount('');
      fetchRecurring();
    }
  };

  const handleDeleteRecurring = async (id) => {
    const { error } = await supabase.from('recurring_expenses').delete().eq('id', id);
    if (error) alert('삭제 실패: ' + error.message);
    else fetchRecurring();
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm("정말 탈퇴하시겠습니까? 모든 자산 기록이 영구적으로 삭제되며 복구할 수 없습니다.");
    if (!confirmed) return;

    try {
      const { error } = await supabase.rpc('delete_user_account');
      if (error) throw error;

      await supabase.auth.signOut();
      alert("회원탈퇴가 정상적으로 처리되었습니다.");
      window.location.reload();
    } catch (err) {
      console.error("탈퇴 중 에러 발생:", err.message);
      alert("탈퇴 처리에 실패했습니다. 다시 시도해 주세요.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-slate-500 dark:text-slate-400">
        로딩 중...
      </div>
    );
  }

  if (!session) return <AuthView />;

  // 자산 계산
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const netBalance = totalIncome - totalExpense;

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.description?.toLowerCase().includes(searchTerm.toLowerCase()) || t.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || t.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const getModalData = () => {
    if (modalType === 'income') return transactions.filter(t => t.type === 'income');
    if (modalType === 'expense') return transactions.filter(t => t.type === 'expense');
    if (modalType === 'balance') return transactions;
    return [];
  };

  // 캘린더 관련 계산 로직
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0~11
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 요일 (0: 일요일)
  const daysInMonth = new Date(year, month + 1, 0).getDate(); // 해당 월의 총 일수

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // 날짜별 거래 내역 매핑 헬퍼 (YYYY-MM-DD 형식)
  const getTransactionsForDay = (day) => {
    const formattedMonth = String(month + 1).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    const dateStr = `${year}-${formattedMonth}-${formattedDay}`;
    return transactions.filter(t => t.date === dateStr);
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans pb-24 relative transition-colors duration-200">
      {/* 상단 헤더 */}
      <header className="border-b border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-700/50 flex items-center justify-center bg-indigo-600 text-white font-bold">
              <Wallet size={22} />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                가계부 <Sparkles size={15} className="text-amber-500 dark:text-amber-400" />
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">스마트 자산 관리 & 랭킹</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={toggleTheme}
              className="p-2 bg-slate-200/70 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300 transition-colors"
              title="테마 전환"
            >
              {theme === 'dark' ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-indigo-600" />}
            </button>
            <button 
              onClick={handleDeleteAccount}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-xl text-xs font-semibold text-rose-500 dark:text-rose-400 transition-colors"
            >
              <UserX size={14} /> <span className="hidden sm:inline">회원탈퇴</span>
            </button>
            <button 
              onClick={() => supabase.auth.signOut()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-200/70 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
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
          <div onClick={() => setModalType('balance')} className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 shadow-xl backdrop-blur cursor-pointer hover:border-indigo-500/50 transition-all">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">총 자산 잔액 (클릭하여 전체보기)</p>
            <h2 className={`text-2xl font-black mt-1 ${netBalance >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-500 dark:text-rose-400'}`}>
              ₩ {netBalance.toLocaleString()}
            </h2>
          </div>
          <div onClick={() => setModalType('income')} className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 shadow-xl backdrop-blur cursor-pointer hover:border-emerald-500/50 transition-all">
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
              <TrendingUp size={14} /> 총 수입 (클릭하여 내역보기)
            </p>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-1">₩ {totalIncome.toLocaleString()}</h2>
          </div>
          <div onClick={() => setModalType('expense')} className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 shadow-xl backdrop-blur cursor-pointer hover:border-rose-500/50 transition-all">
            <p className="text-xs text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1">
              <TrendingDown size={14} /> 총 지출 (클릭하여 내역보기)
            </p>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-1">₩ {totalExpense.toLocaleString()}</h2>
          </div>
        </div>

        {/* 입력/수정 폼 & 랭킹 그리드 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* 거래 입력 및 수정 폼 */}
          <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                {editingId ? (
                  <span className="flex items-center gap-2 text-amber-500 dark:text-amber-400">
                    <Edit3 size={16} /> 거래 내역 수정 중
                  </span>
                ) : (
                  <span className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                    <PlusCircle size={16} /> 새 거래 내역 추가
                  </span>
                )}
              </h3>
              {editingId && (
                <button type="button" onClick={resetForm} className="text-xs text-slate-500 dark:text-slate-400 hover:underline">
                  수정 취소
                </button>
              )}
            </div>

            <form onSubmit={handleSubmitTransaction} className="space-y-4">
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setType('expense')}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${type === 'expense' ? 'bg-rose-500 text-white shadow' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
                >
                  지출
                </button>
                <button
                  type="button"
                  onClick={() => setType('income')}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${type === 'income' ? 'bg-emerald-500 text-white shadow' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
                >
                  수입
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">금액 (원)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="금액을 입력하세요"
                    required
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">카테고리</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
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
                  <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">날짜</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">메모</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="상세 내용을 적어주세요"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className={`w-full py-3 font-bold text-xs rounded-xl transition-colors shadow-lg text-white ${editingId ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/30' : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30'}`}
              >
                {editingId ? '수정 완료하기' : '내역 추가하기'}
              </button>
            </form>
          </div>

          {/* 커뮤니티 랭킹 영역 */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Trophy size={16} className="text-amber-500 dark:text-amber-400" /> 지출 랭킹 톱 10
                </h3>
                <button
                  onClick={handleToggleHideRanking}
                  title={hideRanking ? "랭킹 참여하기" : "랭킹 숨기기"}
                  className="p-1.5 bg-slate-100 dark:bg-slate-950 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  {hideRanking ? <EyeOff size={14} className="text-rose-500 dark:text-rose-400" /> : <Eye size={14} className="text-indigo-600 dark:text-indigo-400" />}
                </button>
              </div>

              {hideRanking ? (
                <div className="text-center py-10 text-xs text-slate-400 dark:text-slate-500">
                  랭킹 참여가 숨겨져 있습니다.<br />상단 눈 모양 아이콘을 눌러 참여하세요.
                </div>
              ) : rankings.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-400 dark:text-slate-500">
                  표시할 랭킹 데이터가 없습니다.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
                  {rankings.map((r, idx) => (
                    <div key={r.user_id} className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/50 rounded-xl text-xs">
                      <div className="flex items-center gap-2.5">
                        <span className={`w-5 h-5 flex items-center justify-center font-bold rounded-full text-[10px] ${idx === 0 ? 'bg-amber-400 text-slate-950' : idx === 1 ? 'bg-slate-300 text-slate-950' : idx === 2 ? 'bg-amber-700 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                          {idx + 1}
                        </span>
                        <span className="text-slate-700 dark:text-slate-300 truncate max-w-[100px]">
                          {r.user_id === session.user.id ? '나 (Me)' : `유저 ...${r.user_id.slice(-4)}`}
                        </span>
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white">₩ {Number(r.total_expense).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-4 pt-3 border-t border-slate-200 dark:border-slate-800/60">
              * 지출이 적은 순서대로 10명이 노출됩니다.
            </p>
          </div>

        </div>

        {/* 고정지출 관리 영역 */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Repeat size={16} className="text-indigo-600 dark:text-indigo-400" /> 고정지출 관리 (월 정기 지출)
          </h3>

          <form onSubmit={handleAddRecurring} className="grid grid-cols-1 sm:grid-cols-4 gap-2">
            <input
              type="text"
              value={recTitle}
              onChange={(e) => setRecTitle(e.target.value)}
              placeholder="항목명 (예: 넷플릭스)"
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              required
            />
            <input
              type="number"
              value={recAmount}
              onChange={(e) => setRecAmount(e.target.value)}
              placeholder="금액 (원)"
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              required
            />
            <div className="flex items-center gap-1">
              <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">매월</span>
              <input
                type="number"
                min="1"
                max="31"
                value={recDate}
                onChange={(e) => setRecDate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 text-center"
                required
              />
              <span className="text-xs text-slate-500 dark:text-slate-400">일</span>
            </div>
            <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl py-2 transition-colors shadow-lg shadow-indigo-600/20">
              고정지출 추가
            </button>
          </form>

          <div className="space-y-2 pt-2">
            {recurringList.length === 0 ? (
              <p className="text-center py-4 text-xs text-slate-400 dark:text-slate-500">등록된 고정지출이 없습니다.</p>
            ) : (
              recurringList.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/50 rounded-xl text-xs">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-1 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold rounded-lg">매월 {item.pay_date}일</span>
                    <span className="text-slate-800 dark:text-slate-200 font-medium">{item.title}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-rose-600 dark:text-rose-400">₩ {Number(item.amount).toLocaleString()}</span>
                    <button onClick={() => handleDeleteRecurring(item.id)} className="text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 내역 보기 영역 (목록 뷰 / 캘린더 뷰 전환 기능) */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">상세 거래 내역</h3>
              {/* 보기 모드 전환 버튼 */}
              <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${viewMode === 'list' ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
                >
                  <LayoutList size={13} /> 목록
                </button>
                <button
                  onClick={() => setViewMode('calendar')}
                  className={`flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${viewMode === 'calendar' ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
                >
                  <CalendarDays size={13} /> 달력
                </button>
              </div>
            </div>

            {/* 목록 뷰일 때만 검색 및 필터 표시 */}
            {viewMode === 'list' && (
              <div className="flex items-center gap-2">
                <div className="relative flex-1 sm:w-60">
                  <Search size={14} className="absolute left-3 top-2.5 text-slate-400 dark:text-slate-500" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="내역 또는 카테고리 검색"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="all">전체</option>
                  <option value="expense">지출만</option>
                  <option value="income">수입만</option>
                </select>
              </div>
            )}
          </div>

          {/* 목록 뷰 (List View) */}
          {viewMode === 'list' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                    <th className="pb-3 font-medium">날짜</th>
                    <th className="pb-3 font-medium">분류</th>
                    <th className="pb-3 font-medium">메모</th>
                    <th className="pb-3 font-medium text-right">금액</th>
                    <th className="pb-3 font-medium text-center">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/50">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-8 text-slate-400 dark:text-slate-500">
                        등록된 거래 내역이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-950/40 transition-colors">
                        <td className="py-3 text-slate-500 dark:text-slate-400">{t.date}</td>
                        <td className="py-3">
                          <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300 font-medium">
                            {t.category}
                          </span>
                        </td>
                        <td className="py-3 text-slate-700 dark:text-slate-300">{t.description || '-'}</td>
                        <td className={`py-3 text-right font-bold ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-100'}`}>
                          {t.type === 'income' ? '+' : '-'} ₩ {Number(t.amount).toLocaleString()}
                        </td>
                        <td className="py-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button onClick={() => handleEditClick(t)} className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors" title="수정">
                              <Edit3 size={14} />
                            </button>
                            <button onClick={() => handleDeleteTransaction(t.id)} className="p-1 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors" title="삭제">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* 캘린더 뷰 (Calendar View) */}
          {viewMode === 'calendar' && (
            <div className="space-y-4">
              {/* 캘린더 월 이동 컨트롤 */}
              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-950 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                <button onClick={prevMonth} className="p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors">
                  <ChevronLeft size={16} />
                </button>
                <h4 className="text-sm font-black text-slate-900 dark:text-white">
                  {year}년 {month + 1}월
                </h4>
                <button onClick={nextMonth} className="p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors">
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* 요일 헤더 */}
              <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-slate-400 dark:text-slate-500 pb-2 border-b border-slate-200 dark:border-slate-800">
                <span className="text-rose-500">일</span>
                <span>월</span>
                <span>화</span>
                <span>수</span>
                <span>목</span>
                <span>금</span>
                <span className="text-indigo-500">토</span>
              </div>

              {/* 날짜 그리드 */}
              <div className="grid grid-cols-7 gap-1.5">
                {/* 빈 칸 채우기 (시작 요일 전까지) */}
                {Array.from({ length: firstDayOfMonth }).map((_, index) => (
                  <div key={`empty-${index}`} className="h-24 sm:h-28 bg-slate-50/40 dark:bg-slate-950/20 rounded-2xl border border-transparent opacity-30"></div>
                ))}

                {/* 실제 날짜 칸 채우기 */}
                {Array.from({ length: daysInMonth }).map((_, index) => {
                  const day = index + 1;
                  const dayTransactions = getTransactionsForDay(day);
                  const dayIncome = dayTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
                  const dayExpense = dayTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);

                  return (
                    <div
                      key={`day-${day}`}
                      onClick={() => setSelectedDateTransactions({ day, list: dayTransactions })}
                      className="h-24 sm:h-28 bg-slate-50 dark:bg-slate-950/60 hover:bg-indigo-500/5 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-1.5 flex flex-col justify-between cursor-pointer transition-all overflow-hidden group shadow-sm"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                          {day}
                        </span>
                        {dayTransactions.length > 0 && (
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                        )}
                      </div>

                      <div className="space-y-0.5 overflow-hidden text-[10px]">
                        {dayIncome > 0 && (
                          <div className="text-emerald-600 dark:text-emerald-400 font-semibold truncate">
                            +{dayIncome.toLocaleString()}
                          </div>
                        )}
                        {dayExpense > 0 && (
                          <div className="text-rose-600 dark:text-rose-400 font-semibold truncate">
                            -{dayExpense.toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

      </main>

      {/* 캘린더 날짜 클릭 시 나타나는 해당 일자 상세 내역 팝업 */}
      {selectedDateTransactions && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar size={16} className="text-indigo-600 dark:text-indigo-400" />
                {year}년 {month + 1}월 {selectedDateTransactions.day}일 상세 내역
              </h3>
              <button 
                onClick={() => setSelectedDateTransactions(null)}
                className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="max-h-[350px] overflow-y-auto space-y-2 pr-1">
              {selectedDateTransactions.list.length === 0 ? (
                <p className="text-center py-10 text-xs text-slate-400 dark:text-slate-500">이 날 등록된 내역이 없습니다.</p>
              ) : (
                selectedDateTransactions.list.map((t) => (
                  <div key={t.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/50 rounded-xl text-xs">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-850 rounded text-slate-700 dark:text-slate-300 font-medium">{t.category}</span>
                      </div>
                      <p className="text-slate-800 dark:text-slate-200">{t.description || '메모 없음'}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`font-bold ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {t.type === 'income' ? '+' : '-'} ₩ {Number(t.amount).toLocaleString()}
                      </span>
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleEditClick(t)} className="px-2 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold rounded-lg transition-colors">
                          수정
                        </button>
                        <button onClick={() => handleDeleteTransaction(t.id)} className="p-1 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors" title="삭제">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedDateTransactions(null)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold text-xs rounded-xl transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 요약 카드 클릭 시 나타나는 상세 내역 팝업 모달 */}
      {modalType && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {modalType === 'income' && <span className="text-emerald-600 dark:text-emerald-400">수입 상세 내역</span>}
                {modalType === 'expense' && <span className="text-rose-600 dark:text-rose-400">지출 상세 내역</span>}
                {modalType === 'balance' && <span className="text-indigo-600 dark:text-indigo-400">전체 자산 상세 내역</span>}
              </h3>
              <button onClick={() => setModalType(null)} className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors">
                <X size={16} />
              </button>
            </div>

            <div className="max-h-[350px] overflow-y-auto space-y-2 pr-1">
              {getModalData().length === 0 ? (
                <p className="text-center py-10 text-xs text-slate-400 dark:text-slate-500">해당 내역이 없습니다.</p>
              ) : (
                getModalData().map((t) => (
                  <div key={t.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/50 rounded-xl text-xs">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 dark:text-slate-400">{t.date}</span>
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-850 rounded text-slate-700 dark:text-slate-300 font-medium">{t.category}</span>
                      </div>
                      <p className="text-slate-800 dark:text-slate-200">{t.description || '메모 없음'}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`font-bold ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {t.type === 'income' ? '+' : '-'} ₩ {Number(t.amount).toLocaleString()}
                      </span>
                      <button onClick={() => handleEditClick(t)} className="px-2.5 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold rounded-lg transition-colors">
                        수정
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button onClick={() => setModalType(null)} className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold text-xs rounded-xl transition-colors">
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
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
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex items-center justify-center p-4 transition-colors duration-200">
      <div className="max-w-md w-full p-8 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-2xl backdrop-blur">
        <div className="flex flex-col items-center justify-center space-y-3 mb-8">
          <div className="w-16 h-16 rounded-3xl overflow-hidden shadow-xl border border-slate-200 dark:border-slate-700/50 flex items-center justify-center bg-indigo-600 text-white font-bold">
            <Wallet size={32} />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">스마트 가계부</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">시작하려면 로그인해주세요</p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">이메일</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              required
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요"
              required
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button type="submit" disabled={loading} className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl transition-colors shadow-lg shadow-indigo-600/30">
            {loading ? '처리 중...' : isSignUp ? '회원가입' : '로그인'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button onClick={() => setIsSignUp(!isSignUp)} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
            {isSignUp ? '이미 계정이 있으신가요? 로그인하기' : '계정이 없으신가요? 회원가입하기'}
          </button>
        </div>
      </div>
    </div>
  );
}