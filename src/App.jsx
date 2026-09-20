import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabase';
import Auth from './Auth';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend 
} from 'recharts';
import { 
  Wallet, TrendingUp, TrendingDown, PlusCircle, Trash2, Search, Calendar, DollarSign, Sparkles, LogOut, Trophy, Repeat 
} from 'lucide-react';

export default function App() {
  const [session, setSession] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);

  const [transactions, setTransactions] = useState([]);
  const [fixedExpenses, setFixedExpenses] = useState([]);

  const [type, setType] = useState('expense'); // 'income', 'expense', 'fixed'
  const [category, setCategory] = useState('식비');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [paymentDay, setPaymentDay] = useState('25');
  const [description, setDescription] = useState('');

  const [filterType, setFilterType] = useState('all'); // 'all', 'income', 'expense'
  const [searchTerm, setSearchTerm] = useState('');

  const [rankingList, setRankingList] = useState([]);

  // 고정지출 목록 섹션 참조용 ref
  const fixedSectionRef = useRef(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoadingSession(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      fetchTransactions();
      fetchFixedExpenses();
      fetchCommunityRanking();
    }
  }, [session]);

  const fetchTransactions = async () => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', session.user.id)
      .order('date', { ascending: false });

    if (!error) {
      setTransactions(data || []);
    }
  };

  const fetchFixedExpenses = async () => {
    const { data, error } = await supabase
      .from('fixed_expenses')
      .select('*')
      .eq('user_id', session.user.id)
      .order('payment_day', { ascending: true });

    if (!error) {
      setFixedExpenses(data || []);
    }
  };

  const fetchCommunityRanking = async () => {
    const { data, error } = await supabase.rpc('get_community_ranking');
    if (!error && data) {
      const adjectives = ['절약하는', '소비요정', '티클모아', '플렉스하는', '알뜰살뜰', '고민많은', '부자될', '현명한'];
      const nouns = ['쿼카', '판다', '고양이', '사자', '햄스터', '부엉이', '너구리', '토끼'];

      const mapped = data.map((item, index) => {
        const charCodeSum = item.user_id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const adj = adjectives[charCodeSum % adjectives.length];
        const noun = nouns[(charCodeSum >> 1) % nouns.length];
        
        return {
          rank: index + 1,
          nickname: `${adj} ${noun} #${index + 1}`,
          totalExpense: Number(item.total_expense),
          isMe: item.user_id === session.user.id
        };
      });

      setRankingList(mapped);
    }
  };

  const categories = {
    income: ['월급', '용돈', '부수입', '기타'],
    expense: ['식비', '교통', '쇼핑', '주거/통신', '문화/여가', '기타'],
    fixed: ['주거(월세)', '통신비', '구독서비스(OTT)', '보험', '대출상환', '기타']
  };

  const handleTypeChange = (newType) => {
    setType(newType);
    setCategory(categories[newType][0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      alert('올바른 금액을 입력해주세요.');
      return;
    }

    if (type === 'fixed') {
      const newFixed = {
        user_id: session.user.id,
        title: description.trim() || category,
        amount: Number(amount),
        payment_day: Number(paymentDay),
        category
      };

      const { data, error } = await supabase
        .from('fixed_expenses')
        .insert([newFixed])
        .select();

      if (error) {
        alert('저장 중 오류가 발생했습니다: ' + error.message);
      } else if (data) {
        setFixedExpenses([...fixedExpenses, data[0]]);
        setAmount('');
        setDescription('');
      }
    } else {
      const newTx = {
        user_id: session.user.id,
        type,
        category,
        amount: Number(amount),
        date,
        description: description.trim() || category
      };

      const { data, error } = await supabase
        .from('transactions')
        .insert([newTx])
        .select();

      if (error) {
        alert('저장 중 오류가 발생했습니다: ' + error.message);
      } else if (data) {
        setTransactions([data[0], ...transactions]);
        setAmount('');
        setDescription('');
        fetchCommunityRanking();
      }
    }
  };

  const handleDelete = async (id, isFixed = false) => {
    const tableName = isFixed ? 'fixed_expenses' : 'transactions';
    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', id);

    if (error) {
      alert('삭제 중 오류가 발생했습니다: ' + error.message);
    } else {
      if (isFixed) {
        setFixedExpenses(fixedExpenses.filter(item => item.id !== id));
      } else {
        setTransactions(transactions.filter(item => item.id !== id));
        fetchCommunityRanking();
      }
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loadingSession) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center">
        <p className="text-sm text-slate-400">로딩 중...</p>
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  const totalIncome = transactions
    .filter(item => item.type === 'income')
    .reduce((acc, cur) => acc + Number(cur.amount), 0);

  const totalExpense = transactions
    .filter(item => item.type === 'expense')
    .reduce((acc, cur) => acc + Number(cur.amount), 0);

  const totalFixedExpense = fixedExpenses
    .reduce((acc, cur) => acc + Number(cur.amount), 0);

  const totalBalance = totalIncome - (totalExpense + totalFixedExpense);

  const filteredTransactions = transactions.filter(item => {
    const matchesType = filterType === 'all' || item.type === filterType;
    const matchesSearch = item.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  const expenseDataMap = transactions
    .filter(item => item.type === 'expense')
    .reduce((acc, cur) => {
      acc[cur.category] = (acc[cur.category] || 0) + Number(cur.amount);
      return acc;
    }, {});

  const chartData = Object.keys(expenseDataMap).map(cat => ({
    name: cat,
    value: expenseDataMap[cat]
  }));

  const COLORS = ['#6366f1', '#ec4899', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b'];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* 헤더 */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-800/60 backdrop-blur-md p-6 rounded-3xl border border-slate-700/50 shadow-xl gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-tr from-indigo-500 to-violet-500 rounded-2xl shadow-lg shadow-indigo-500/30 text-white">
              <Wallet size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                Neon Ledger <Sparkles size={18} className="text-amber-400" />
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">{session.user.email.split('@')[0]} 님의 자산 관리</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t border-slate-700 sm:border-t-0 pt-3 sm:pt-0">
            <div className="text-right">
              <span className="text-xs text-slate-400 block uppercase tracking-wider">Total Balance</span>
              <span className={`text-2xl font-black ${totalBalance >= 0 ? 'text-indigo-400' : 'text-rose-400'}`}>
                {totalBalance.toLocaleString()} 원
              </span>
            </div>
            <button 
              onClick={handleLogout}
              className="p-3 bg-slate-700/50 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 rounded-2xl border border-slate-600/50 transition-all"
              title="로그아웃"
            >
              <LogOut size={20} />
            </button>
          </div>
        </header>

        {/* 🏆 커뮤니티 지출 랭킹 리더보드 */}
        <div className="bg-gradient-to-r from-slate-800/80 via-indigo-950/40 to-slate-800/80 backdrop-blur-md p-6 rounded-3xl border border-indigo-500/20 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-2xl border border-indigo-500/30">
                <Trophy size={24} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">익명 커뮤니티 지출 랭킹</h3>
                <p className="text-xs text-slate-400">Neon Ledger 사용자들의 실시간 지출 순위입니다.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {rankingList.length > 0 ? (
              rankingList.map((user) => (
                <div 
                  key={user.rank} 
                  className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${user.isMe ? 'bg-indigo-600/20 border-indigo-500 shadow-md shadow-indigo-500/10' : 'bg-slate-900/50 border-slate-700/50'}`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black ${user.rank === 1 ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' : user.rank === 2 ? 'bg-slate-300 text-slate-900' : user.rank === 3 ? 'bg-amber-700 text-white' : 'bg-slate-800 text-slate-400'}`}>
                      {user.rank}
                    </span>
                    <div>
                      <span className="text-xs font-bold text-slate-200 block flex items-center gap-1.5">
                        {user.nickname}
                        {user.isMe && <span className="text-[10px] bg-indigo-500 text-white px-1.5 py-0.5 rounded-md font-semibold">나</span>}
                      </span>
                      <span className="text-[10px] text-slate-400">총 지출 금액</span>
                    </div>
                  </div>
                  <span className="text-sm font-black text-rose-400">-{user.totalExpense.toLocaleString()}원</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 col-span-full text-center py-4">등록된 커뮤니티 랭킹 데이터가 없습니다.</p>
            )}
          </div>
        </div>

        {/* 요약 카드 그리드 (클릭 시 해당 내역 필터링 또는 고정지출 섹션으로 이동) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button 
            onClick={() => setFilterType('income')}
            className={`bg-slate-800/60 backdrop-blur-md p-6 rounded-3xl border shadow-lg flex items-center justify-between text-left transition-all hover:scale-[1.02] cursor-pointer ${filterType === 'income' ? 'border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/30' : 'border-slate-700/50 hover:border-slate-500'}`}
          >
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                나의 총 수입 <span className="text-[10px] text-emerald-400 font-bold">(클릭시 보기)</span>
              </p>
              <p className="text-xl font-black text-emerald-400 mt-1">+{totalIncome.toLocaleString()} 원</p>
            </div>
            <div className="p-3.5 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20">
              <TrendingUp size={22} />
            </div>
          </button>

          <button 
            onClick={() => setFilterType('expense')}
            className={`bg-slate-800/60 backdrop-blur-md p-6 rounded-3xl border shadow-lg flex items-center justify-between text-left transition-all hover:scale-[1.02] cursor-pointer ${filterType === 'expense' ? 'border-rose-500 bg-rose-500/10 ring-2 ring-rose-500/30' : 'border-slate-700/50 hover:border-slate-500'}`}
          >
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                변동 지출 <span className="text-[10px] text-rose-400 font-bold">(클릭시 보기)</span>
              </p>
              <p className="text-xl font-black text-rose-400 mt-1">-{totalExpense.toLocaleString()} 원</p>
            </div>
            <div className="p-3.5 bg-rose-500/10 text-rose-400 rounded-2xl border border-rose-500/20">
              <TrendingDown size={22} />
            </div>
          </button>

          <button 
            onClick={() => {
              if (fixedSectionRef.current) {
                fixedSectionRef.current.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="bg-slate-800/60 backdrop-blur-md p-6 rounded-3xl border border-slate-700/50 hover:border-amber-500 shadow-lg flex items-center justify-between text-left transition-all hover:scale-[1.02] cursor-pointer"
          >
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                고정 지출 (월) <span className="text-[10px] text-amber-400 font-bold">(목록으로 이동)</span>
              </p>
              <p className="text-xl font-black text-amber-400 mt-1">-{totalFixedExpense.toLocaleString()} 원</p>
            </div>
            <div className="p-3.5 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/20">
              <Repeat size={22} />
            </div>
          </button>
        </div>

        {/* 메인 콘텐츠 영역 (입력 폼 및 차트) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-slate-800/60 backdrop-blur-md p-6 rounded-3xl border border-slate-700/50 shadow-lg lg:col-span-1">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <PlusCircle size={20} className="text-indigo-400" /> 새 내역 기록
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex bg-slate-900/80 p-1 rounded-2xl border border-slate-700/60 gap-1">
                <button
                  type="button"
                  onClick={() => handleTypeChange('expense')}
                  className={`flex-1 py-2 text-[11px] font-bold rounded-xl transition-all ${type === 'expense' ? 'bg-rose-500 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                >
                  지출
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeChange('income')}
                  className={`flex-1 py-2 text-[11px] font-bold rounded-xl transition-all ${type === 'income' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                >
                  수입
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeChange('fixed')}
                  className={`flex-1 py-2 text-[11px] font-bold rounded-xl transition-all ${type === 'fixed' ? 'bg-amber-500 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                >
                  고정지출
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">카테고리</label>
                <select 
                  value={category} 
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-900/80 border border-slate-700/80 rounded-2xl p-3.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  {categories[type].map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">금액 (원)</label>
                <div className="relative">
                  <DollarSign size={16} className="absolute left-3.5 top-4 text-slate-500" />
                  <input 
                    type="number" 
                    placeholder="0" 
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-slate-900/80 border border-slate-700/80 rounded-2xl pl-10 pr-4 py-3.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              {type === 'fixed' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">매월 납부일</label>
                  <div className="relative">
                    <Calendar size={16} className="absolute left-3.5 top-4 text-slate-500" />
                    <input 
                      type="number" 
                      min="1" 
                      max="31" 
                      placeholder="예: 25" 
                      value={paymentDay}
                      onChange={(e) => setPaymentDay(e.target.value)}
                      className="w-full bg-slate-900/80 border border-slate-700/80 rounded-2xl pl-10 pr-4 py-3.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">날짜</label>
                  <div className="relative">
                    <Calendar size={16} className="absolute left-3.5 top-4 text-slate-500" />
                    <input 
                      type="date" 
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full bg-slate-900/80 border border-slate-700/80 rounded-2xl pl-10 pr-4 py-3.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">메모 / 항목명</label>
                <input 
                  type="text" 
                  placeholder={type === 'fixed' ? "예: 월세, 넷플릭스" : "내용을 입력하세요"} 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-900/80 border border-slate-700/80 rounded-2xl px-4 py-3.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <button 
                type="submit" 
                className="w-full bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-bold py-3.5 rounded-2xl transition-all shadow-lg shadow-indigo-500/25"
              >
                {type === 'fixed' ? '고정지출 추가하기' : '기록 추가하기'}
              </button>
            </form>
          </div>

          <div className="bg-slate-800/60 backdrop-blur-md p-6 rounded-3xl border border-slate-700/50 shadow-lg lg:col-span-2 flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-bold text-white mb-1">카테고리별 지출 비중</h2>
              <p className="text-xs text-slate-400 mb-4">변동 지출의 카테고리별 분포를 원형 차트로 확인해보세요.</p>
            </div>
            
            <div className="h-64 w-full flex items-center justify-center">
              {chartData.length > 0 ? (
                <div className="w-full h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={90}
                        paddingAngle={6}
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '1rem', color: '#fff' }} formatter={(v) => `${Number(v).toLocaleString()}원`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-xs text-slate-500">표시할 변동 지출 데이터가 없습니다.</p>
              )}
            </div>
          </div>
        </div>

        {/* 고정지출 목록 영역 (참조 ref 설정) */}
        <div ref={fixedSectionRef} className="bg-slate-800/60 backdrop-blur-md p-6 rounded-3xl border border-slate-700/50 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Repeat size={18} className="text-amber-400" /> 고정지출 관리 목록
            </h2>
            <span className="text-xs text-slate-400">총 {fixedExpenses.length}개 항목</span>
          </div>

          {fixedExpenses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {fixedExpenses.map((item) => (
                <div key={item.id} className="bg-slate-900/60 border border-slate-700/60 p-4 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-md font-bold">
                      매월 {item.payment_day}일 ({item.category})
                    </span>
                    <h4 className="text-sm font-bold text-slate-200 mt-1">{item.title}</h4>
                    <span className="text-xs font-black text-amber-400">-{Number(item.amount).toLocaleString()} 원</span>
                  </div>
                  <button 
                    onClick={() => handleDelete(item.id, true)}
                    className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 text-center py-6">등록된 고정지출 항목이 없습니다. 상단에서 고정지출을 추가해 보세요!</p>
          )}
        </div>

        {/* 내역 리스트 영역 */}
        <div className="bg-slate-800/60 backdrop-blur-md p-6 rounded-3xl border border-slate-700/50 shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-lg font-bold text-white">상세 거래 내역</h2>
            
            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
              <div className="flex bg-slate-900/80 p-1 rounded-2xl border border-slate-700/60">
                <button 
                  onClick={() => setFilterType('all')}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all ${filterType === 'all' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  전체
                </button>
                <button 
                  onClick={() => setFilterType('income')}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all ${filterType === 'income' ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  수입
                </button>
                <button 
                  onClick={() => setFilterType('expense')}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all ${filterType === 'expense' ? 'bg-rose-500 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  지출
                </button>
              </div>

              <div className="relative flex-1 sm:w-60">
                <Search size={16} className="absolute left-3.5 top-3 text-slate-500" />
                <input 
                  type="text" 
                  placeholder="내역 검색" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-900/80 border border-slate-700/80 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-700/60 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">날짜</th>
                  <th className="py-3 px-4">유형</th>
                  <th className="py-3 px-4">카테고리</th>
                  <th className="py-3 px-4">메모</th>
                  <th className="py-3 px-4 text-right">금액</th>
                  <th className="py-3 px-4 text-center">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30 text-sm">
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-700/20 transition-colors">
                      <td className="py-3.5 px-4 text-slate-400 text-xs">{item.date}</td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold ${item.type === 'income' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                          {item.type === 'income' ? '수입' : '지출'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-200">{item.category}</td>
                      <td className="py-3.5 px-4 text-slate-400">{item.description}</td>
                      <td className={`py-3.5 px-4 text-right font-black ${item.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {item.type === 'income' ? '+' : '-'}{Number(item.amount).toLocaleString()} 원
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button 
                          onClick={() => handleDelete(item.id, false)}
                          className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-slate-500 text-sm">
                      조건에 맞는 거래 내역이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}