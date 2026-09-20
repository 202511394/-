import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabase';
import Auth from './Auth';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend 
} from 'recharts';
import { 
  Wallet, TrendingUp, TrendingDown, PlusCircle, Trash2, Search, Calendar, DollarSign, Sparkles, LogOut, Trophy, Repeat, X, Eye, EyeOff 
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

  // 팝업 관련 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalFilterType, setModalFilterType] = useState('all'); // 'all', 'income', 'expense'
  const [searchTerm, setSearchTerm] = useState('');

  const [rankingList, setRankingList] = useState([]);
  
  // 🏆 랭킹 공개 여부 상태 (로컬 스토리지 연동)
  const [isRankingPublic, setIsRankingPublic] = useState(() => {
    const saved = localStorage.getItem('is_ranking_public');
    return saved !== null ? JSON.parse(saved) : true;
  });

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
  }, [session, isRankingPublic]);

  const handleToggleRankingPrivacy = () => {
    const nextState = !isRankingPublic;
    setIsRankingPublic(nextState);
    localStorage.setItem('is_ranking_public', JSON.stringify(nextState));
    if (nextState) {
      fetchCommunityRanking();
    }
  };

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

      let mapped = data.map((item, index) => {
        const charCodeSum = item.user_id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const adj = adjectives[charCodeSum % adjectives.length];
        const noun = nouns[(charCodeSum >> 1) % nouns.length];
        
        return {
          rank: index + 1,
          nickname: `${adj} ${noun} #${index + 1}`,
          totalExpense: Number(item.total_expense),
          isMe: item.user_id === session.user.id,
          userId: item.user_id
        };
      });

      // 만약 내가 랭킹 비공개를 선택했다면, 리더보드 목록에서 내 계정을 아예 숨기거나 익명 처리
      if (!isRankingPublic) {
        mapped = mapped.filter(item => !item.isMe);
      }

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
        if (isRankingPublic) fetchCommunityRanking();
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
        if (isRankingPublic) fetchCommunityRanking();
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
    const matchesType = modalFilterType === 'all' || item.type === modalFilterType;
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
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans p-3 sm:p-8 overflow-x-hidden box-border">
      <div className="max-w-6xl mx-auto space-y-5 w-full">
        
        {/* 헤더 (이름 변경: AssetPulse - 원하시는 이름으로 수정 가능합니다) */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-800/60 backdrop-blur-md p-5 sm:p-6 rounded-3xl border border-slate-700/50 shadow-xl gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-tr from-indigo-500 to-violet-500 rounded-2xl shadow-lg shadow-indigo-500/30 text-white">
              <Wallet size={26} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                AssetPulse <Sparkles size={16} className="가계부" />
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">{session.user.email.split('@')[0]} 님의 자산 관리</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t border-slate-700 sm:border-t-0 pt-3 sm:pt-0">
            <div className="text-right">
              <span className="text-[10px] sm:text-xs text-slate-400 block uppercase tracking-wider">Total Balance</span>
              <span className={`text-xl sm:text-2xl font-black ${totalBalance >= 0 ? 'text-indigo-400' : 'text-rose-400'}`}>
                {totalBalance.toLocaleString()} 원
              </span>
            </div>
            <button 
              onClick={handleLogout}
              className="p-3 bg-slate-700/50 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 rounded-2xl border border-slate-600/50 transition-all cursor-pointer"
              title="로그아웃"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {/* 🏆 커뮤니티 지출 랭킹 리더보드 & 프라이버시 설정 */}
        <div className="bg-gradient-to-r from-slate-800/80 via-indigo-950/40 to-slate-800/80 backdrop-blur-md p-5 sm:p-6 rounded-3xl border border-indigo-500/20 shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-2xl border border-indigo-500/30">
                <Trophy size={22} />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white">익명 커뮤니티 지출 랭킹</h3>
                <p className="text-[11px] sm:text-xs text-slate-400">사용자들의 실시간 지출 순위입니다.</p>
              </div>
            </div>

            {/* 🔒 랭킹 공개 여부 토글 버튼 */}
            <button
              onClick={handleToggleRankingPrivacy}
              className={`px-4 py-2 rounded-2xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${isRankingPublic ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300 hover:bg-indigo-600/30' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'}`}
            >
              {isRankingPublic ? <Eye size={15} className="text-indigo-400" /> : <EyeOff size={15} />}
              {isRankingPublic ? '랭킹 공개 중 (숨기기)' : '랭킹 숨김 상태 (참여하기)'}
            </button>
          </div>

          {isRankingPublic ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {rankingList.length > 0 ? (
                rankingList.map((user) => (
                  <div 
                    key={user.rank} 
                    className={`p-3.5 sm:p-4 rounded-2xl border flex items-center justify-between transition-all ${user.isMe ? 'bg-indigo-600/20 border-indigo-500 shadow-md shadow-indigo-500/10' : 'bg-slate-900/50 border-slate-700/50'}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 sm:w-7 sm:h-7 rounded-xl flex items-center justify-center text-xs font-black ${user.rank === 1 ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' : user.rank === 2 ? 'bg-slate-300 text-slate-900' : user.rank === 3 ? 'bg-amber-700 text-white' : 'bg-slate-800 text-slate-400'}`}>
                        {user.rank}
                      </span>
                      <div>
                        <span className="text-xs font-bold text-slate-200 block flex items-center gap-1.5">
                          {user.nickname}
                          {user.isMe && <span className="text-[9px] bg-indigo-500 text-white px-1.5 py-0.5 rounded-md font-semibold">나</span>}
                        </span>
                        <span className="text-[10px] text-slate-400">총 지출 금액</span>
                      </div>
                    </div>
                    <span className="text-xs sm:text-sm font-black text-rose-400">-{user.totalExpense.toLocaleString()}원</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 col-span-full text-center py-4">등록된 커뮤니티 랭킹 데이터가 없습니다.</p>
              )}
            </div>
          ) : (
            <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl text-center space-y-2">
              <p className="text-xs font-semibold text-slate-300">현재 랭킹 숨김 모드가 활성화되어 있습니다.</p>
              <p className="text-[11px] text-slate-500">내 지출 내역이 리더보드에 노출되지 않으며, 다른 사용자들의 순위도 보이지 않습니다.</p>
            </div>
          )}
        </div>

        {/* 요약 카드 그리드 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <button 
            onClick={() => {
              setModalFilterType('income');
              setIsModalOpen(true);
            }}
            className="bg-slate-800/60 backdrop-blur-md p-5 sm:p-6 rounded-3xl border border-slate-700/50 hover:border-emerald-500 shadow-lg flex items-center justify-between text-left transition-all hover:scale-[1.01] cursor-pointer"
          >
            <div>
              <p className="text-[11px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                나의 총 수입 <span className="text-[9px] sm:text-[10px] text-emerald-400 font-bold">(팝업 보기)</span>
              </p>
              <p className="text-lg sm:text-xl font-black text-emerald-400 mt-1">+{totalIncome.toLocaleString()} 원</p>
            </div>
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20">
              <TrendingUp size={20} />
            </div>
          </button>

          <button 
            onClick={() => {
              setModalFilterType('expense');
              setIsModalOpen(true);
            }}
            className="bg-slate-800/60 backdrop-blur-md p-5 sm:p-6 rounded-3xl border border-slate-700/50 hover:border-rose-500 shadow-lg flex items-center justify-between text-left transition-all hover:scale-[1.01] cursor-pointer"
          >
            <div>
              <p className="text-[11px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                변동 지출 <span className="text-[9px] sm:text-[10px] text-rose-400 font-bold">(팝업 보기)</span>
              </p>
              <p className="text-lg sm:text-xl font-black text-rose-400 mt-1">-{totalExpense.toLocaleString()} 원</p>
            </div>
            <div className="p-3 bg-rose-500/10 text-rose-400 rounded-2xl border border-rose-500/20">
              <TrendingDown size={20} />
            </div>
          </button>

          <button 
            onClick={() => {
              if (fixedSectionRef.current) {
                fixedSectionRef.current.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="bg-slate-800/60 backdrop-blur-md p-5 sm:p-6 rounded-3xl border border-slate-700/50 hover:border-amber-500 shadow-lg flex items-center justify-between text-left transition-all hover:scale-[1.01] cursor-pointer"
          >
            <div>
              <p className="text-[11px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                고정 지출 (월) <span className="text-[9px] sm:text-[10px] text-amber-400 font-bold">(목록 이동)</span>
              </p>
              <p className="text-lg sm:text-xl font-black text-amber-400 mt-1">-{totalFixedExpense.toLocaleString()} 원</p>
            </div>
            <div className="p-3 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/20">
              <Repeat size={20} />
            </div>
          </button>
        </div>

        {/* 메인 콘텐츠 영역 (입력 폼 및 차트) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="bg-slate-800/60 backdrop-blur-md p-5 sm:p-6 rounded-3xl border border-slate-700/50 shadow-lg lg:col-span-1 overflow-hidden">
            <h2 className="text-base sm:text-lg font-bold text-white mb-4 flex items-center gap-2">
              <PlusCircle size={18} className="text-indigo-400" /> 새 내역 기록
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="flex bg-slate-900/80 p-1 rounded-2xl border border-slate-700/60 gap-1">
                <button
                  type="button"
                  onClick={() => handleTypeChange('expense')}
                  className={`flex-1 py-2 text-[11px] font-bold rounded-xl transition-all cursor-pointer ${type === 'expense' ? 'bg-rose-500 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                >
                  지출
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeChange('income')}
                  className={`flex-1 py-2 text-[11px] font-bold rounded-xl transition-all cursor-pointer ${type === 'income' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                >
                  수입
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeChange('fixed')}
                  className={`flex-1 py-2 text-[11px] font-bold rounded-xl transition-all cursor-pointer ${type === 'fixed' ? 'bg-amber-500 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                >
                  고정지출
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">카테고리</label>
                <select 
                  value={category} 
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-900/80 border border-slate-700/80 rounded-2xl p-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors box-border"
                >
                  {categories[type].map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">금액 (원)</label>
                <div className="relative overflow-hidden rounded-2xl">
                  <DollarSign size={16} className="absolute left-3.5 top-3.5 text-slate-500 z-10" />
                  <input 
                    type="number" 
                    placeholder="0" 
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-slate-900/80 border border-slate-700/80 rounded-2xl pl-10 pr-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors box-border"
                  />
                </div>
              </div>

              {type === 'fixed' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">매월 납부일</label>
                  <div className="relative overflow-hidden rounded-2xl">
                    <Calendar size={16} className="absolute left-3.5 top-3.5 text-slate-500 z-10" />
                    <input 
                      type="number" 
                      min="1" 
                      max="31" 
                      placeholder="예: 25" 
                      value={paymentDay}
                      onChange={(e) => setPaymentDay(e.target.value)}
                      className="w-full bg-slate-900/80 border border-slate-700/80 rounded-2xl pl-10 pr-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors box-border"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">날짜</label>
                  <div className="relative overflow-hidden rounded-2xl">
                    <Calendar size={16} className="absolute left-3.5 top-3.5 text-slate-500 z-10" />
                    <input 
                      type="date" 
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full bg-slate-900/80 border border-slate-700/80 rounded-2xl pl-10 pr-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors box-border"
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
                  className="w-full bg-slate-900/80 border border-slate-700/80 rounded-2xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors box-border"
                />
              </div>

              <button 
                type="submit" 
                className="w-full bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-bold py-3.5 rounded-2xl transition-all shadow-lg shadow-indigo-500/25 cursor-pointer text-sm"
              >
                {type === 'fixed' ? '고정지출 추가하기' : '기록 추가하기'}
              </button>
            </form>
          </div>

          <div className="bg-slate-800/60 backdrop-blur-md p-5 sm:p-6 rounded-3xl border border-slate-700/50 shadow-lg lg:col-span-2 flex flex-col justify-between overflow-hidden">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-2">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white mb-1">카테고리별 지출 비중</h2>
                <p className="text-xs text-slate-400">변동 지출의 카테고리별 분포를 원형 차트로 확인해보세요.</p>
              </div>
              
              <button 
                onClick={() => {
                  setModalFilterType('all');
                  setIsModalOpen(true);
                }}
                className="px-3.5 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 rounded-2xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer w-full sm:w-auto justify-center"
              >
                <Wallet size={15} /> 전체 거래 내역 팝업 열기
              </button>
            </div>
            
            <div className="h-60 w-full flex items-center justify-center">
              {chartData.length > 0 ? (
                <div className="w-full h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={5}
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

        {/* 고정지출 목록 영역 */}
        <div ref={fixedSectionRef} className="bg-slate-800/60 backdrop-blur-md p-5 sm:p-6 rounded-3xl border border-slate-700/50 shadow-lg space-y-3.5 overflow-hidden">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Repeat size={17} className="text-amber-400" /> 고정지출 관리 목록
            </h2>
            <span className="text-xs text-slate-400">총 {fixedExpenses.length}개 항목</span>
          </div>

          {fixedExpenses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {fixedExpenses.map((item) => (
                <div key={item.id} className="bg-slate-900/60 border border-slate-700/60 p-3.5 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-md font-bold">
                      매월 {item.payment_day}일 ({item.category})
                    </span>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-200 mt-1">{item.title}</h4>
                    <span className="text-xs font-black text-amber-400">-{Number(item.amount).toLocaleString()} 원</span>
                  </div>
                  <button 
                    onClick={() => handleDelete(item.id, true)}
                    className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 text-center py-5">등록된 고정지출 항목이 없습니다. 상단에서 고정지출을 추가해 보세요!</p>
          )}
        </div>

        {/* 💡 모바일 하단 가림 방지 여백 박스 */}
        <div className="h-40 w-full" aria-hidden="true" />

      </div>

      {/* 상세 거래 내역 모달 팝업창 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-3 sm:p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700/80 w-full max-w-4xl max-h-[85vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden">
            
            {/* 팝업 헤더 */}
            <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/90">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-2xl border border-indigo-500/20">
                  <Wallet size={20} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white">상세 거래 내역</h3>
                  <p className="text-[11px] sm:text-xs text-slate-400">등록된 수입 및 지출 내역을 관리할 수 있습니다.</p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-2xl transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* 필터 및 검색 바 */}
            <div className="p-4 sm:p-6 border-b border-slate-800 bg-slate-900/50 flex flex-col sm:flex-row justify-between items-center gap-3">
              <div className="flex bg-slate-800/80 p-1 rounded-2xl border border-slate-700/60 w-full sm:w-auto">
                <button 
                  onClick={() => setModalFilterType('all')}
                  className={`flex-1 sm:flex-none px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${modalFilterType === 'all' ? 'bg-slate-700 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                >
                  전체보기
                </button>
                <button 
                  onClick={() => setModalFilterType('income')}
                  className={`flex-1 sm:flex-none px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${modalFilterType === 'income' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                >
                  수입 내역
                </button>
                <button 
                  onClick={() => setModalFilterType('expense')}
                  className={`flex-1 sm:flex-none px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${modalFilterType === 'expense' ? 'bg-rose-500 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                >
                  지출 내역
                </button>
              </div>

              <div className="relative w-full sm:w-72 overflow-hidden rounded-2xl">
                <Search size={15} className="absolute left-3.5 top-3 text-slate-500 z-10" />
                <input 
                  type="text" 
                  placeholder="내용 또는 카테고리 검색" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700/80 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors box-border"
                />
              </div>
            </div>

            {/* 리스트 테이블 영역 */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider sticky top-0 bg-slate-900">
                    <th className="py-3 px-3">날짜</th>
                    <th className="py-3 px-3">유형</th>
                    <th className="py-3 px-3">카테고리</th>
                    <th className="py-3 px-3">메모</th>
                    <th className="py-3 px-3 text-right">금액</th>
                    <th className="py-3 px-3 text-center">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-xs sm:text-sm">
                  {filteredTransactions.length > 0 ? (
                    filteredTransactions.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-3 text-slate-400 text-[11px]">{item.date}</td>
                        <td className="py-3 px-3">
                          <span className={`inline-block px-2 py-0.5 rounded-lg text-[10px] font-bold ${item.type === 'income' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                            {item.type === 'income' ? '수입' : '지출'}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-200">{item.category}</td>
                        <td className="py-3 px-3 text-slate-400 truncate max-w-[100px] sm:max-w-none">{item.description}</td>
                        <td className={`py-3 px-3 text-right font-black ${item.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {item.type === 'income' ? '+' : '-'}{Number(item.amount).toLocaleString()} 원
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button 
                            onClick={() => handleDelete(item.id, false)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer"
                            title="삭제"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-slate-500 text-xs sm:text-sm">
                        조건에 맞는 거래 내역이 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* 팝업 푸터 */}
            <div className="p-4 border-t border-slate-800 bg-slate-900/95 flex justify-end">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-2xl text-xs transition-all cursor-pointer"
              >
                닫기
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}