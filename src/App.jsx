import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Wallet, TrendingUp, TrendingDown, PlusCircle, Trash2, 
  Search, Calendar, DollarSign, Sparkles, LogOut, Trophy, 
  Repeat, X, Eye, EyeOff, UserX, Sun, Moon, Edit3, 
  ChevronLeft, ChevronRight, LayoutList, CalendarDays, PieChart, Tag, FileText
} from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

// Chart.js 컴포넌트 등록
ChartJS.register(ArcElement, Tooltip, Legend);

// Supabase 클라이언트 초기화
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * 월별 리포트 컴포넌트 (모달용)
 */
function MonthlyReportModal({ transactions, currentDate, onClose }) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthlyTransactions = transactions.filter(t => {
    const [tYear, tMonth] = t.date.split('-').map(Number);
    return tYear === year && tMonth === (month + 1);
  });

  const income = monthlyTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const expense = monthlyTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const balance = income - expense;

  const categoryStats = monthlyTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});

  const sortedCategories = Object.entries(categoryStats).sort((a, b) => b[1] - a[1]);
  const topCategory = sortedCategories.length > 0 ? sortedCategories[0] : null;

  const chartData = {
    labels: sortedCategories.map(([cat]) => cat),
    datasets: [
      {
        data: sortedCategories.map(([_, amount]) => amount),
        backgroundColor: [
          '#3B82F6', 
          '#10B981', 
          '#F59E0B', 
          '#6366F1', 
          '#EC4899', 
          '#8B5CF6', 
          '#9CA3AF', 
        ],
        borderWidth: 0,
        hoverOffset: 4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          boxWidth: 10,
          font: { size: 11 },
          color: '#94A3B8',
        },
      },
    },
    cutout: '65%',
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText size={16} className="text-indigo-600 dark:text-indigo-400" /> 
            {year}년 {month + 1}월 월별 리포트 요약
          </h3>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl">
            <p className="text-[11px] text-slate-500 dark:text-slate-400">이달의 수입</p>
            <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">₩ {income.toLocaleString()}</p>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl">
            <p className="text-[11px] text-slate-500 dark:text-slate-400">이달의 지출</p>
            <p className="text-base font-bold text-rose-600 dark:text-rose-400 mt-0.5">₩ {expense.toLocaleString()}</p>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl">
            <p className="text-[11px] text-slate-500 dark:text-slate-400">총 순수익</p>
            <p className={`text-base font-bold mt-0.5 ${balance >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-500'}`}>
              ₩ {balance.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-2xl">
          <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-1.5">
            <PieChart size={14} className="text-indigo-500" /> 카테고리별 지출 비중
          </p>
          {sortedCategories.length === 0 ? (
            <p className="text-center py-8 text-xs text-slate-400 dark:text-slate-500">지출 데이터가 없습니다.</p>
          ) : (
            <div className="relative w-full h-56 flex justify-center items-center">
              <Doughnut data={chartData} options={chartOptions} />
            </div>
          )}
        </div>

        <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 rounded-xl space-y-2 text-xs">
          <p className="font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
            <Sparkles size={14} className="text-amber-500" /> AI 소비 패턴 분석 피드백
          </p>
          {monthlyTransactions.length === 0 ? (
            <p className="text-slate-500 dark:text-slate-400">선택하신 월에 등록된 거래 내역이 없습니다. 내역을 추가해 보세요!</p>
          ) : (
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              이번 달 가장 많은 지출이 발생한 카테고리는 <span className="font-bold text-indigo-600 dark:text-indigo-400">'{topCategory ? topCategory[0] : '없음'}'</span>(₩ {topCategory ? topCategory[1].toLocaleString() : 0})입니다. 
              {topCategory && topCategory[1] > expense * 0.4 ? ' 해당 항목의 지출 비중이 다소 높으므로 다음 달 예산 조정 시 참고해 보세요.' : ' 지출 분포가 비교적 안정적으로 관리되고 있습니다!'}
            </p>
          )}
        </div>

        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold text-xs rounded-xl transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRecoveringPin, setIsRecoveringPin] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [recurringList, setRecurringList] = useState([]);
  const [rankings, setRankings] = useState([]);
  
  // 초기 통장 잔액 상태 (localStorage 연동)
  const [initialBalance, setInitialBalance] = useState(() => {
    const saved = localStorage.getItem('initial_balance');
    const parsedBalance = Number(saved);
    return saved !== null && Number.isFinite(parsedBalance) ? parsedBalance : 0;
  });
  const [isEditingInitialBalance, setIsEditingInitialBalance] = useState(false);
  const [tempInitialBalance, setTempInitialBalance] = useState(initialBalance);

  const [categories, setCategories] = useState(() => {
    const saved = localStorage.getItem('custom_categories');
    return saved ? JSON.parse(saved) : ['식비', '교통', '주거/통신', '문화/여가', '급여', '기타'];
  });
  const [newCategoryName, setNewCategoryName] = useState('');

  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved;
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  });

  const [modalType, setModalType] = useState(null);
  const [selectedDateTransactions, setSelectedDateTransactions] = useState(null);
  const [selectedCategoryModal, setSelectedCategoryModal] = useState(null);
  const [isMonthlyReportOpen, setIsMonthlyReportOpen] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(categories[0] || '식비');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const [recTitle, setRecTitle] = useState('');
  const [recAmount, setRecAmount] = useState('');
  const [recDate, setRecDate] = useState('25');

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [viewMode, setViewMode] = useState('calendar');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [hideRanking, setHideRanking] = useState(() => {
    return localStorage.getItem('hide_ranking') === 'true';
  });

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

  useEffect(() => {
    localStorage.setItem('custom_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('initial_balance', initialBalance);
  }, [initialBalance]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setIsRecoveringPin(event === 'PASSWORD_RECOVERY');
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      initAppData();
    }
  }, [session, hideRanking]);

  const initAppData = async () => {
    await fetchInitialBalance();
    await fetchRecurringAndProcess();
    await fetchTransactions();
    fetchRankings();
  };

  const fetchInitialBalance = async () => {
    const { data, error } = await supabase
      .from('user_settings')
      .select('initial_balance')
      .eq('user_id', session.user.id)
      .maybeSingle();

    if (error) {
      console.error('초기자본 조회 실패:', error.message);
      return;
    }

    const cloudBalance = Number(data?.initial_balance ?? 0);
    const nextInitialBalance = Number.isFinite(cloudBalance) ? cloudBalance : 0;
    localStorage.setItem('initial_balance', String(nextInitialBalance));
    setInitialBalance(nextInitialBalance);
  };

  const fetchRecurringAndProcess = async () => {
    const { data: recData, error: recError } = await supabase
      .from('recurring_expenses')
      .select('*')
      .eq('user_id', session.user.id)
      .order('pay_date', { ascending: true });

    if (recError) return;
    setRecurringList(recData || []);

    if (!recData || recData.length === 0) return;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const currentDay = now.getDate();
    const formattedMonth = String(currentMonth).padStart(2, '0');

    const { data: txData, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', session.user.id);

    if (txError) return;
    const existingTransactions = txData || [];

    for (const rec of recData) {
      if (currentDay >= rec.pay_date) {
        const formattedDay = String(rec.pay_date).padStart(2, '0');
        const targetDate = `${currentYear}-${formattedMonth}-${formattedDay}`;
        const memoText = `[고정지출] ${rec.title}`;

        const alreadyExists = existingTransactions.some(
          t => t.date === targetDate && t.description === memoText && t.amount === rec.amount
        );

        if (!alreadyExists) {
          await supabase.from('transactions').insert([
            {
              user_id: session.user.id,
              type: 'expense',
              amount: rec.amount,
              category: '주거/통신',
              description: memoText,
              date: targetDate
            }
          ]);
        }
      }
    }
  };

  const fetchTransactions = async () => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', session.user.id)
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

  const handleAddCategory = (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    if (categories.includes(newCategoryName.trim())) {
      alert('이미 존재하는 카테고리입니다.');
      return;
    }
    setCategories([...categories, newCategoryName.trim()]);
    setNewCategoryName('');
  };

  const handleDeleteCategory = (catToDelete) => {
    if (categories.length <= 1) {
      alert('최소 1개 이상의 카테고리가 존재해야 합니다.');
      return;
    }
    if (window.confirm(`'${catToDelete}' 카테고리를 삭제하시겠습니까?`)) {
      setCategories(categories.filter(c => c !== catToDelete));
      if (category === catToDelete) {
        setCategory(categories.filter(c => c !== catToDelete)[0]);
      }
    }
  };

  const handleSubmitTransaction = async (e) => {
    e.preventDefault();
    if (!amount || !category) return;

    if (editingId) {
      const { error } = await supabase
        .from('transactions')
        .update({ type, amount: parseFloat(amount), category, description, date })
        .eq('id', editingId)
        .eq('user_id', session.user.id);

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
    if (!categories.includes(t.category)) {
      setCategories(prev => [...prev, t.category]);
    }
    setCategory(t.category);
    setDescription(t.description || '');
    setDate(t.date);
    setModalType(null);
    setSelectedDateTransactions(null);
    setSelectedCategoryModal(null);
    window.scrollTo({ top: 200, behavior: 'smooth' });
  };

  const handleDeleteTransaction = async (id) => {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', session.user.id);
    if (error) {
      alert('삭제 실패: ' + error.message);
    } else {
      if (editingId === id) resetForm();
      fetchTransactions();
      fetchRankings();
      if (selectedDateTransactions) {
        setSelectedDateTransactions(prev => ({
          ...prev,
          list: prev.list.filter(item => item.id !== id)
        }));
      }
      if (selectedCategoryModal) {
        setSelectedCategoryModal(prev => ({
          ...prev,
          list: prev.list.filter(item => item.id !== id)
        }));
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
      initAppData();
    }
  };

  const handleDeleteRecurring = async (id) => {
    const { error } = await supabase
      .from('recurring_expenses')
      .delete()
      .eq('id', id)
      .eq('user_id', session.user.id);
    if (error) alert('삭제 실패: ' + error.message);
    else initAppData();
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

  if (!session) return <AuthView theme={theme} toggleTheme={toggleTheme} />;
  if (isRecoveringPin) return <PinReset onComplete={() => setIsRecoveringPin(false)} />;
  if (!session.user.user_metadata?.username) return <AccountSetup />;

  // 전체 거래 내역 기반 총 순수익 계산 및 초기 통장 잔액 반영
  const totalIncomeAll = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const totalExpenseAll = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const totalNetBalance = initialBalance + totalIncomeAll - totalExpenseAll;

  // 현재 선택된 월(Year-Month)에 해당하는 거래 내역 필터링
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); 

  const monthlyTransactions = transactions.filter(t => {
    const [tYear, tMonth] = t.date.split('-').map(Number);
    return tYear === year && tMonth === (month + 1);
  });

  const monthlyIncome = monthlyTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const monthlyExpense = monthlyTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const monthlyRecurringTotal = recurringList.reduce((total, item) => total + Number(item.amount || 0), 0);

  // 이전 달과 비교할 수입·지출을 계산한다.
  const previousDate = new Date(year, month - 1, 1);
  const previousYear = previousDate.getFullYear();
  const previousMonth = previousDate.getMonth();
  const previousMonthTransactions = transactions.filter(t => {
    const [tYear, tMonth] = t.date.split('-').map(Number);
    return tYear === previousYear && tMonth === previousMonth + 1;
  });
  const previousIncome = previousMonthTransactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);
  const previousExpense = previousMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);
  const incomeChange = monthlyIncome - previousIncome;
  const expenseChange = monthlyExpense - previousExpense;
  const expenseChangeRate = previousExpense === 0
    ? null
    : (expenseChange / previousExpense) * 100;

  const expenseTransactions = monthlyTransactions.filter(t => t.type === 'expense');
  const categoryStats = expenseTransactions.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {});

  const sortedCategories = Object.entries(categoryStats).sort((a, b) => b[1] - a[1]);

  const firstDayOfMonth = new Date(year, month, 1).getDay(); 
  const daysInMonth = new Date(year, month + 1, 0).getDate(); 

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const filteredTransactions = monthlyTransactions.filter(t => {
    const matchesSearch = t.description?.toLowerCase().includes(searchTerm.toLowerCase()) || t.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || t.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const getModalData = () => {
    if (modalType === 'income') return monthlyTransactions.filter(t => t.type === 'income');
    if (modalType === 'expense') return monthlyTransactions.filter(t => t.type === 'expense');
    if (modalType === 'balance') return transactions;
    return [];
  };

  const getTransactionsForDay = (day) => {
    const formattedMonth = String(month + 1).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    const dateStr = `${year}-${formattedMonth}-${formattedDay}`;
    return transactions.filter(t => t.date === dateStr);
  };

  // 작은 화면의 7열 달력에서도 금액이 잘리지 않도록 축약 표기한다.
  const formatCalendarAmount = (amount) => {
    if (amount >= 10000) {
      const value = amount / 10000;
      return `${value % 1 === 0 ? value : value.toFixed(1)}만`;
    }
    return amount.toLocaleString();
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
              onClick={() => setIsMonthlyReportOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-xl text-xs font-semibold text-indigo-600 dark:text-indigo-400 transition-colors"
              title="월별 리포트 열람"
            >
              <FileText size={14} /> <span className="hidden sm:inline">월별 리포트</span>
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
        
        {/* 초기 통장 잔액 설정 영역 */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <DollarSign size={18} className="text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">초기 통장 잔액 설정:</span>
          </div>
          
          {isEditingInitialBalance ? (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="number"
                value={tempInitialBalance}
                onChange={(e) => setTempInitialBalance(e.target.value)}
                placeholder="금액 입력"
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={async () => {
                  const nextInitialBalance = Number(tempInitialBalance) || 0;

                  const { error } = await supabase
                    .from('user_settings')
                    .upsert(
                      {
                        user_id: session.user.id,
                        initial_balance: nextInitialBalance,
                        updated_at: new Date().toISOString(),
                      },
                      { onConflict: 'user_id' }
                    );

                  if (error) {
                    alert('초기자본 저장 실패: ' + error.message);
                    return;
                  }

                  localStorage.setItem('initial_balance', String(nextInitialBalance));
                  setInitialBalance(nextInitialBalance);
                  setIsEditingInitialBalance(false);
                }}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-colors"
              >
                저장
              </button>
              <button
                onClick={() => setIsEditingInitialBalance(false)}
                className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-colors"
              >
                취소
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
              <span className="text-sm font-black text-slate-900 dark:text-white">
                ₩ {initialBalance.toLocaleString()}
              </span>
              <button
                onClick={() => {
                  setTempInitialBalance(initialBalance);
                  setIsEditingInitialBalance(true);
                }}
                className="px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold text-xs rounded-xl transition-colors"
              >
                금액 수정
              </button>
            </div>
          )}
        </div>

        {/* 요약 카드 영역 (전체 남은 자산, 월수입, 월지출 반영) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div onClick={() => setModalType('balance')} className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 shadow-xl backdrop-blur cursor-pointer hover:border-indigo-500/50 transition-all">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">현재 총 남은 자산 (클릭하여 전체보기)</p>
            <h2 className={`text-2xl font-black mt-1 ${totalNetBalance >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-500 dark:text-rose-400'}`}>
              ₩ {totalNetBalance.toLocaleString()}
            </h2>
          </div>
          <div onClick={() => setModalType('income')} className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 shadow-xl backdrop-blur cursor-pointer hover:border-emerald-500/50 transition-all">
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
              <TrendingUp size={14} /> {year}년 {month + 1}월 월수입 (클릭하여 내역보기)
            </p>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-1">₩ {monthlyIncome.toLocaleString()}</h2>
          </div>
          <div onClick={() => setModalType('expense')} className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 shadow-xl backdrop-blur cursor-pointer hover:border-rose-500/50 transition-all">
            <p className="text-xs text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1">
              <TrendingDown size={14} /> {year}년 {month + 1}월 월지출 (클릭하여 내역보기)
            </p>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-1">₩ {monthlyExpense.toLocaleString()}</h2>
          </div>
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 shadow-xl backdrop-blur">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">지난달 대비</p>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              수입:{' '}
              <span className={`font-bold ${incomeChange >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {incomeChange >= 0 ? '+' : ''}₩ {incomeChange.toLocaleString()}
              </span>
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              지출:{' '}
              <span className={`font-bold ${expenseChange <= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {expenseChange >= 0 ? '+' : ''}₩ {expenseChange.toLocaleString()}
              </span>
              {expenseChangeRate !== null && (
                <span className="ml-1">({expenseChangeRate >= 0 ? '+' : ''}{expenseChangeRate.toFixed(1)}%)</span>
              )}
            </p>
          </div>
        </div>

        {/* 카테고리별 지출 통계 차트 영역 */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <PieChart size={16} className="text-indigo-600 dark:text-indigo-400" /> {year}년 {month + 1}월 카테고리별 지출 통계 (항목 클릭 시 상세 내역 표시)
          </h3>

          {sortedCategories.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-400 dark:text-slate-500">
              분석할 지출 데이터가 없습니다.
            </div>
          ) : (
            <div className="space-y-3">
              <div className="w-full h-3 bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden flex border border-slate-200 dark:border-slate-800">
                {sortedCategories.map(([cat, amount], index) => {
                  const percentage = monthlyExpense > 0 ? (amount / monthlyExpense) * 100 : 0;
                  const colors = ['bg-amber-500', 'bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 'bg-emerald-500', 'bg-rose-500', 'bg-cyan-500'];
                  const colorClass = colors[index % colors.length];
                  return (
                    <div 
                      key={cat} 
                      style={{ width: `${percentage}%` }} 
                      className={`h-full ${colorClass} cursor-pointer hover:opacity-80 transition-all duration-500`}
                      onClick={() => {
                        const list = expenseTransactions.filter(t => t.category === cat);
                        setSelectedCategoryModal({ category: cat, list });
                      }}
                      title={`${cat}: ₩ ${amount.toLocaleString()} (${percentage.toFixed(1)}%) - 클릭하여 내역 보기`}
                    />
                  );
                })}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-2">
                {sortedCategories.map(([cat, amount], index) => {
                  const percentage = monthlyExpense > 0 ? ((amount / monthlyExpense) * 100).toFixed(1) : 0;
                  const colors = ['bg-amber-500', 'bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 'bg-emerald-500', 'bg-rose-500', 'bg-cyan-500'];
                  const dotColor = colors[index % colors.length];
                  return (
                    <div 
                      key={cat} 
                      onClick={() => {
                        const list = expenseTransactions.filter(t => t.category === cat);
                        setSelectedCategoryModal({ category: cat, list });
                      }}
                      className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950/70 hover:bg-indigo-500/5 border border-slate-200 dark:border-slate-800/50 rounded-xl text-xs cursor-pointer transition-all group"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />
                        <span className="font-medium text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{cat}</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">({percentage}%)</span>
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white">₩ {amount.toLocaleString()}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 카테고리 관리 영역 */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Tag size={16} className="text-indigo-600 dark:text-indigo-400" /> 카테고리 설정 (추가 및 삭제)
          </h3>

          <form onSubmit={handleAddCategory} className="flex gap-2">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="새 카테고리 이름 입력"
              className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            />
            <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-colors shadow">
              카테고리 추가
            </button>
          </form>

          <div className="flex flex-wrap gap-2 pt-2">
            {categories.map((cat) => (
              <div key={cat} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300">
                <span>{cat}</span>
                <button 
                  type="button" 
                  onClick={() => handleDeleteCategory(cat)} 
                  className="text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors ml-1"
                  title="삭제"
                >
                  <X size={13} />
                </button>
              </div>
            ))}
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
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Repeat size={16} className="text-indigo-600 dark:text-indigo-400" /> 고정지출 관리 (월 정기 지출)
            </h3>
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-rose-600 dark:text-rose-400">월 합계 ₩ {monthlyRecurringTotal.toLocaleString()}</span>
              <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">* 설정한 날짜가 지나면 자동 반영됩니다.</span>
            </div>
          </div>

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

        {/* 내역 보기 영역 */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 shadow-xl space-y-4">
          
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-slate-50 dark:bg-slate-950 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between sm:justify-start gap-2">
              <button onClick={prevMonth} className="p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors">
                <ChevronLeft size={16} />
              </button>
              <h4 className="text-sm font-black text-slate-900 dark:text-white px-2">
                {year}년 {month + 1}월 내역
              </h4>
              <button onClick={nextMonth} className="p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors">
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="flex items-center justify-end gap-2">
              <div className="flex items-center p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
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
          </div>

          {viewMode === 'list' && (
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 pt-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {year}년 {month + 1}월 상세 거래 목록
              </span>
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
            </div>
          )}

          {/* 목록 뷰 */}
          {viewMode === 'list' && (
            <div className="overflow-x-auto pt-2">
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
                        {year}년 {month + 1}월에 등록된 거래 내역이 없습니다.
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

          {/* 캘린더 뷰 */}
          {viewMode === 'calendar' && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-slate-400 dark:text-slate-500 pb-2 border-b border-slate-200 dark:border-slate-800">
                <span className="text-rose-500">일</span>
                <span>월</span>
                <span>화</span>
                <span>수</span>
                <span>목</span>
                <span>금</span>
                <span className="text-indigo-500">토</span>
              </div>

              <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
                {Array.from({ length: firstDayOfMonth }).map((_, index) => (
                  <div key={`empty-${index}`} className="h-16 sm:h-28 bg-slate-50/40 dark:bg-slate-950/20 rounded-lg sm:rounded-2xl border border-transparent opacity-30"></div>
                ))}

                {Array.from({ length: daysInMonth }).map((_, index) => {
                  const day = index + 1;
                  const dayTransactions = getTransactionsForDay(day);
                  const dayIncome = dayTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
                  const dayExpense = dayTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);

                  return (
                    <div
                      key={`day-${day}`}
                      onClick={() => setSelectedDateTransactions({ day, list: dayTransactions })}
                      className="h-16 sm:h-28 bg-slate-50 dark:bg-slate-950/60 hover:bg-indigo-500/5 border border-slate-200 dark:border-slate-800/80 rounded-lg sm:rounded-2xl p-1 sm:p-1.5 flex flex-col justify-between cursor-pointer transition-all overflow-hidden group shadow-sm"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                          {day}
                        </span>
                        {dayTransactions.length > 0 && (
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                        )}
                      </div>

                      <div className="space-y-0.5 overflow-hidden text-[9px] sm:text-[10px] leading-none">
                        {dayIncome > 0 && (
                          <div className="text-emerald-600 dark:text-emerald-400 font-semibold truncate">
                            <span className="sm:hidden">+{formatCalendarAmount(dayIncome)}</span>
                            <span className="hidden sm:inline">+{dayIncome.toLocaleString()}</span>
                          </div>
                        )}
                        {dayExpense > 0 && (
                          <div className="text-rose-600 dark:text-rose-400 font-semibold truncate">
                            <span className="sm:hidden">-{formatCalendarAmount(dayExpense)}</span>
                            <span className="hidden sm:inline">-{dayExpense.toLocaleString()}</span>
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

      {/* 월별 리포트 모달 */}
      {isMonthlyReportOpen && (
        <MonthlyReportModal 
          transactions={transactions} 
          currentDate={currentDate} 
          onClose={() => setIsMonthlyReportOpen(false)} 
        />
      )}

      {/* 카테고리별 상세 내역 팝업 모달 */}
      {selectedCategoryModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <PieChart size={16} className="text-indigo-600 dark:text-indigo-400" />
                '{selectedCategoryModal.category}' 지출 상세 내역
              </h3>
              <button 
                onClick={() => setSelectedCategoryModal(null)}
                className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="max-h-[350px] overflow-y-auto space-y-2 pr-1">
              {selectedCategoryModal.list.length === 0 ? (
                <p className="text-center py-10 text-xs text-slate-400 dark:text-slate-500">이 카테고리에 등록된 지출 내역이 없습니다.</p>
              ) : (
                selectedCategoryModal.list.map((t) => (
                  <div key={t.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/50 rounded-xl text-xs">
                    <div className="space-y-0.5">
                      <span className="text-slate-500 dark:text-slate-400">{t.date}</span>
                      <p className="text-slate-800 dark:text-slate-200">{t.description || '메모 없음'}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-rose-600 dark:text-rose-400">
                        - ₩ {Number(t.amount).toLocaleString()}
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
                onClick={() => setSelectedCategoryModal(null)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold text-xs rounded-xl transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 날짜 상세 팝업 */}
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
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-850 rounded text-slate-700 dark:text-slate-300 font-medium">{t.category}</span>
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

      {/* 요약 카드 팝업 모달 */}
      {modalType && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {modalType === 'income' && <span className="text-emerald-600 dark:text-emerald-400">{year}년 {month + 1}월 월수입 상세 내역</span>}
                {modalType === 'expense' && <span className="text-rose-600 dark:text-rose-400">{year}년 {month + 1}월 월지출 상세 내역</span>}
                {modalType === 'balance' && <span className="text-indigo-600 dark:text-indigo-400">전체 자산 상세 내역 (초기 잔액 포함)</span>}
              </h3>
              <button onClick={() => setModalType(null)} className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors">
                <X size={16} />
              </button>
            </div>

            <div className="max-h-[350px] overflow-y-auto space-y-2 pr-1">
              {modalType === 'balance' && (
                <div className="flex items-center justify-between p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-xs mb-2">
                  <span className="font-bold text-indigo-700 dark:text-indigo-300">초기 통장 잔액 설정값</span>
                  <span className="font-bold text-indigo-700 dark:text-indigo-300">₩ {initialBalance.toLocaleString()}</span>
                </div>
              )}
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

function PinReset({ onComplete }) {
  const [loading, setLoading] = useState(false);
  const [pin, setPin] = useState('');
  const [message, setMessage] = useState('');

  const reset = async (event) => {
    event.preventDefault();
    if (!/^\d{6}$/.test(pin)) {
      setMessage('PIN은 숫자 6자리로 입력해주세요.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: pin });
    setLoading(false);
    if (error) setMessage(error.message);
    else onComplete();
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full p-8 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-2xl text-center space-y-5">
        <div className="w-16 h-16 mx-auto rounded-3xl bg-indigo-600 text-white flex items-center justify-center"><Wallet size={32} /></div>
        <div className="space-y-2"><h1 className="text-xl font-black text-slate-900 dark:text-white">PIN 재설정</h1><p className="text-sm text-slate-500 dark:text-slate-400">새로운 숫자 6자리 PIN을 입력하세요.</p></div>
        <form onSubmit={reset} className="space-y-3">
          <input type="password" inputMode="numeric" pattern="[0-9]{6}" maxLength="6" value={pin} onChange={(event) => setPin(event.target.value.replace(/\D/g, ''))} placeholder="새 PIN 6자리" required className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-center text-lg tracking-[0.5em] text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500" />
          {message && <p className="text-xs text-rose-500">{message}</p>}
          <button disabled={loading} className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl transition-colors disabled:opacity-50">{loading ? '저장 중...' : '새 PIN 저장'}</button>
        </form>
      </div>
    </div>
  );
}

function AccountSetup() {
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const save = async (event) => {
    event.preventDefault();
    const cleanUsername = username.trim().toLowerCase();
    if (!/^\S{3,20}$/.test(cleanUsername) || !/^\d{6}$/.test(pin)) {
      setMessage('아이디는 공백 없는 3~20자, PIN은 숫자 6자리로 입력해주세요.');
      return;
    }
    setLoading(true);
    const { error: userError } = await supabase.auth.updateUser({ password: pin, data: { username: cleanUsername } });
    const { error: profileError } = userError ? { error: userError } : await supabase.from('user_profiles').insert({ user_id: (await supabase.auth.getUser()).data.user.id, username: cleanUsername });
    setLoading(false);
    if (profileError) setMessage(profileError.message);
    else setMessage('설정이 완료되었습니다.');
  };

  return <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex items-center justify-center p-4"><div className="max-w-md w-full p-8 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-2xl text-center space-y-5"><div className="w-16 h-16 mx-auto rounded-3xl bg-indigo-600 text-white flex items-center justify-center"><Wallet size={32} /></div><div className="space-y-2"><h1 className="text-xl font-black text-slate-900 dark:text-white">로그인 정보 설정</h1><p className="text-sm text-slate-500 dark:text-slate-400">앞으로 사용할 아이디와 PIN을 정해주세요.</p></div><form onSubmit={save} className="space-y-3"><input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="아이디" required className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500" /><input type="password" inputMode="numeric" maxLength="6" value={pin} onChange={(event) => setPin(event.target.value.replace(/\D/g, ''))} placeholder="PIN 6자리" required className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-center text-lg tracking-[0.5em] text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500" />{message && <p className="text-xs text-rose-500">{message}</p>}<button disabled={loading} className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl transition-colors disabled:opacity-50">{loading ? '저장 중...' : '설정 완료'}</button></form></div></div>;
}

// 최초 가입은 이메일 인증, 이후 로그인은 아이디와 PIN으로 처리한다.
function AuthView({ theme, toggleTheme }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    const cleanUsername = username.trim().toLowerCase();
    if (!['migrate', 'reset'].includes(mode) && (!/^\S{3,20}$/.test(cleanUsername) || !/^\d{6}$/.test(pin))) {
      setMessage('아이디는 공백 없는 3~20자, PIN은 숫자 6자리로 입력해주세요.');
      return;
    }
    setLoading(true);
    setMessage('');
    if (mode === 'reset') {
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
      setMessage(error ? error.message : 'PIN 재설정 링크를 이메일로 보냈어요.');
    } else if (mode === 'migrate') {
      const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } });
      setMessage(error ? error.message : '이메일로 계정 전환 링크를 보냈어요.');
    } else if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email,
        password: pin,
        options: { data: { username: cleanUsername }, emailRedirectTo: window.location.origin },
      });
      setMessage(error ? error.message : '인증 링크를 이메일로 보냈어요. 링크를 열면 가입이 완료됩니다.');
    } else {
      const { data, error } = await supabase.functions.invoke('login-with-id', {
        body: { username: cleanUsername, pin },
      });
      if (error || !data?.access_token) {
        setMessage('아이디 또는 PIN이 올바르지 않습니다.');
      } else {
        const { error: sessionError } = await supabase.auth.setSession(data);
        if (sessionError) setMessage(sessionError.message);
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex items-center justify-center p-4 transition-colors duration-200 relative">
      <div className="absolute top-4 right-4">
        <button 
          onClick={toggleTheme}
          className="p-2 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300 transition-colors shadow"
          title="테마 전환"
        >
          {theme === 'dark' ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-indigo-600" />}
        </button>
      </div>

      <div className="max-w-md w-full p-8 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-2xl backdrop-blur">
        <div className="flex flex-col items-center justify-center space-y-3 mb-8">
          <div className="w-16 h-16 rounded-3xl overflow-hidden shadow-xl border border-slate-200 dark:border-slate-700/50 flex items-center justify-center bg-indigo-600 text-white font-bold">
            <Wallet size={32} />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">스마트 가계부</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">가입은 이메일 인증으로, 로그인은 아이디와 PIN으로.</p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {['signup', 'migrate', 'reset'].includes(mode) && <div><label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">이메일</label><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="example@email.com" required className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500" /></div>}
          {!['migrate', 'reset'].includes(mode) && <div>
            <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">아이디</label>
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="공백 없는 3~20자"
              required
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            />
          </div>}
          {!['migrate', 'reset'].includes(mode) && <div><label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">PIN</label><input type="password" inputMode="numeric" pattern="[0-9]{6}" maxLength="6" value={pin} onChange={(event) => setPin(event.target.value.replace(/\D/g, ''))} placeholder="숫자 6자리" required className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-center text-lg tracking-[0.5em] text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500" /></div>}

          <button type="submit" disabled={loading} className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl transition-colors shadow-lg shadow-indigo-600/30">
            {loading ? '처리 중...' : mode === 'signup' ? '이메일 인증하고 가입하기' : mode === 'migrate' ? '이메일로 전환 링크 받기' : mode === 'reset' ? 'PIN 재설정 링크 받기' : '로그인'}
          </button>
        </form>

        <div className="mt-5 flex items-center justify-between text-xs">
          <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setMessage(''); }} className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium">{mode === 'login' ? '처음이신가요? 가입하기' : '이미 계정이 있나요? 로그인'}</button>
          {mode === 'login' && <button onClick={() => { setMode('reset'); setMessage(''); }} disabled={loading} className="text-slate-500 dark:text-slate-400 hover:underline">PIN을 잊으셨나요?</button>}
        </div>
        {mode === 'login' && <button onClick={() => { setMode('migrate'); setMessage(''); }} className="mt-3 w-full text-xs text-slate-500 dark:text-slate-400 hover:underline">기존 이메일 계정을 아이디 로그인으로 전환</button>}
        {message && <p className="mt-4 text-center text-xs text-slate-500 dark:text-slate-400">{message}</p>}
      </div>
    </div>
  );
}
