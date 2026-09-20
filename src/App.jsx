import React, { useState, useEffect } from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend 
} from 'recharts';
import { 
  Wallet, TrendingUp, TrendingDown, PlusCircle, Trash2, Search, Calendar, DollarSign, Sparkles 
} from 'lucide-react';

export default function App() {
  const [transactions, setTransactions] = useState(() => {
    const saved = localStorage.getItem('clean_ledger_data');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [
      { id: 1, type: 'income', category: '월급', amount: 3500000, date: '2026-09-01', description: '9월 급여' },
      { id: 2, type: 'expense', category: '식비', amount: 18000, date: '2026-09-20', description: '점심 식사' },
      { id: 3, type: 'expense', category: '쇼핑', amount: 89000, date: '2026-09-20', description: '의류 구입' },
    ];
  });

  const [type, setType] = useState('expense');
  const [category, setCategory] = useState('식비');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');

  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    localStorage.setItem('clean_ledger_data', JSON.stringify(transactions));
  }, [transactions]);

  const categories = {
    income: ['월급', '용돈', '부수입', '기타'],
    expense: ['식비', '교통', '쇼핑', '주거/통신', '문화/여가', '기타']
  };

  const handleTypeChange = (newType) => {
    setType(newType);
    setCategory(categories[newType][0]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      alert('올바른 금액을 입력해주세요.');
      return;
    }

    const newTx = {
      id: Date.now(),
      type,
      category,
      amount: Number(amount),
      date,
      description: description.trim() || category
    };

    setTransactions([newTx, ...transactions]);
    setAmount('');
    setDescription('');
  };

  const handleDelete = (id) => {
    setTransactions(transactions.filter(item => item.id !== id));
  };

  const totalIncome = transactions
    .filter(item => item.type === 'income')
    .reduce((acc, cur) => acc + cur.amount, 0);

  const totalExpense = transactions
    .filter(item => item.type === 'expense')
    .reduce((acc, cur) => acc + cur.amount, 0);

  const totalBalance = totalIncome - totalExpense;

  const filteredTransactions = transactions.filter(item => {
    const matchesType = filterType === 'all' || item.type === filterType;
    const matchesSearch = item.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  const expenseDataMap = transactions
    .filter(item => item.type === 'expense')
    .reduce((acc, cur) => {
      acc[cur.category] = (acc[cur.category] || 0) + cur.amount;
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
              <p className="text-xs text-slate-400 mt-0.5">스마트하고 감각적인 자산 관리</p>
            </div>
          </div>
          <div className="text-right sm:block flex justify-between w-full sm:w-auto border-t border-slate-700 sm:border-t-0 pt-3 sm:pt-0">
            <span className="text-xs text-slate-400 block uppercase tracking-wider">Total Balance</span>
            <span className={`text-2xl font-black ${totalBalance >= 0 ? 'text-indigo-400' : 'text-rose-400'}`}>
              {totalBalance.toLocaleString()} 원
            </span>
          </div>
        </header>

        {/* 요약 카드 그리드 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-slate-800/60 backdrop-blur-md p-6 rounded-3xl border border-slate-700/50 shadow-lg flex items-center justify-between relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl"></div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">이번 달 총 수입</p>
              <p className="text-2xl font-black text-emerald-400 mt-1">+{totalIncome.toLocaleString()} 원</p>
            </div>
            <div className="p-4 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20">
              <TrendingUp size={26} />
            </div>
          </div>

          <div className="bg-slate-800/60 backdrop-blur-md p-6 rounded-3xl border border-slate-700/50 shadow-lg flex items-center justify-between relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-rose-500/10 rounded-full blur-xl"></div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">이번 달 총 지출</p>
              <p className="text-2xl font-black text-rose-400 mt-1">-{totalExpense.toLocaleString()} 원</p>
            </div>
            <div className="p-4 bg-rose-500/10 text-rose-400 rounded-2xl border border-rose-500/20">
              <TrendingDown size={26} />
            </div>
          </div>
        </div>

        {/* 메인 콘텐츠 영역 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* 입력 폼 */}
          <div className="bg-slate-800/60 backdrop-blur-md p-6 rounded-3xl border border-slate-700/50 shadow-lg lg:col-span-1">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <PlusCircle size={20} className="text-indigo-400" /> 새 내역 기록
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex bg-slate-900/80 p-1 rounded-2xl border border-slate-700/60">
                <button
                  type="button"
                  onClick={() => handleTypeChange('expense')}
                  className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${type === 'expense' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30' : 'text-slate-400 hover:text-white'}`}
                >
                  지출
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeChange('income')}
                  className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${type === 'income' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'text-slate-400 hover:text-white'}`}
                >
                  수입
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

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">메모</label>
                <input 
                  type="text" 
                  placeholder="내용을 입력하세요" 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-900/80 border border-slate-700/80 rounded-2xl px-4 py-3.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <button 
                type="submit" 
                className="w-full bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-bold py-3.5 rounded-2xl transition-all shadow-lg shadow-indigo-500/25 active:scale-[0.99]"
              >
                기록 추가하기
              </button>
            </form>
          </div>

          {/* 차트 영역 */}
          <div className="bg-slate-800/60 backdrop-blur-md p-6 rounded-3xl border border-slate-700/50 shadow-lg lg:col-span-2 flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-bold text-white mb-1">카테고리별 지출 분석</h2>
              <p className="text-xs text-slate-400 mb-4">어디에 가장 많이 지출했는지 확인해보세요.</p>
            </div>
            
            <div className="h-64 w-full flex items-center justify-center">
              {chartData.length > 0 ? (
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
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(15, 23, 42, 0.5)" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '1rem', color: '#fff' }}
                      formatter={(value) => `${value.toLocaleString()} 원`} 
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-slate-500">표시할 지출 데이터가 없습니다.</p>
              )}
            </div>
          </div>

        </div>

        {/* 내역 리스트 영역 */}
        <div className="bg-slate-800/60 backdrop-blur-md p-6 rounded-3xl border border-slate-700/50 shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-lg font-bold text-white">상세 거래 내역</h2>
            
            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
              <div className="flex bg-slate-900/80 p-1 rounded-2xl border border-slate-700/60">
                <button 
                  onClick={() => setFilterType('all')}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all ${filterType === 'all' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                >
                  전체
                </button>
                <button 
                  onClick={() => setFilterType('income')}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all ${filterType === 'income' ? 'bg-emerald-500 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                >
                  수입
                </button>
                <button 
                  onClick={() => setFilterType('expense')}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all ${filterType === 'expense' ? 'bg-rose-500 text-white shadow' : 'text-slate-400 hover:text-white'}`}
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
                  className="w-full bg-slate-900/80 border border-slate-700/80 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
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
                        {item.type === 'income' ? '+' : '-'}{item.amount.toLocaleString()} 원
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button 
                          onClick={() => handleDelete(item.id)}
                          className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
                          title="삭제"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-slate-500 text-sm">
                      거래 내역이 없습니다. 새로운 내역을 추가해 보세요!
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