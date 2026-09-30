import React from 'react';
import { Sparkles, TrendingDown, Award, AlertCircle } from 'lucide-react';

export default function MonthlyReport({ transactions, currentDate }) {
  // 현재 보고 있는 연도와 월
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0~11

  // 해당 월의 거래 내역만 필터링 (YYYY-MM 형식 일치 확인)
  const formattedMonth = String(month + 1).padStart(2, '0');
  const targetYearMonth = `${year}-${formattedMonth}`;

  const monthTransactions = transactions.filter(t => t.date && t.date.startsWith(targetYearMonth));
  const monthExpenses = monthTransactions.filter(t => t.type === 'expense');
  const monthIncomes = monthTransactions.filter(t => t.type === 'income');

  const totalMonthExpense = monthExpenses.reduce((acc, t) => acc + t.amount, 0);
  const totalMonthIncome = monthIncomes.reduce((acc, t) => acc + t.amount, 0);

  // 카테고리별 지출 집계
  const categoryStats = monthExpenses.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {});

  const sortedCategories = Object.entries(categoryStats).sort((a, b) => b[1] - a[1]);
  const topCategory = sortedCategories.length > 0 ? sortedCategories[0] : null;

  // 맞춤형 지출 줄이기 제안(피드백) 생성 로직
  const getBudgetAdvice = () => {
    if (totalMonthExpense === 0) {
      return "아직 이번 달 지출 내역이 없습니다. 지출을 기록하면 맞춤형 절약 팁을 확인할 수 있어요!";
    }
    if (!topCategory) return "소비 패턴을 분석할 데이터가 충분하지 않습니다.";

    const [catName, catAmount] = topCategory;
    const percentage = ((catAmount / totalMonthExpense) * 100).toFixed(1);

    if (catName === '식비' && percentage > 40) {
      return `이번 달은 전체 지출 중 '식비'가 ${percentage}%(${catAmount.toLocaleString()}원)로 비중이 가장 높습니다. 외식 횟수를 조금 줄이고 배달 음식을 줄이면 상당한 금액을 절약할 수 있어요!`;
    } else if (catName === '문화/여가' && percentage > 30) {
      return `취미 및 문화생활 지출이 ${percentage}%를 차지하고 있네요. 다음 달에는 예산을 미리 정해두고 문화·여가 활동을 즐겨보는 건 어떨까요?`;
    } else {
      return `가장 지출이 큰 카테고리는 '${catName}'(으)로 총 ${catAmount.toLocaleString()}원(${percentage}%)이 소요되었습니다. 해당 항목의 고정 비용을 점검해 보면 지출을 효과적으로 줄일 수 있습니다.`;
    }
  };

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 shadow-xl space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Sparkles size={16} className="text-amber-500 dark:text-amber-400" />
          {year}년 {month + 1}월 월별 소비 리포트
        </h3>
        <span className="text-xs px-2.5 py-1 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold rounded-lg">
          총 지출: ₩ {totalMonthExpense.toLocaleString()}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 소비 요약 카드 */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/50 rounded-xl space-y-2">
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <TrendingDown size={14} className="text-rose-500" /> 핵심 소비 요약
          </h4>
          <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
            <p>• 총 수입: <span className="font-bold text-emerald-600 dark:text-emerald-400">₩ {totalMonthIncome.toLocaleString()}</span></p>
            <p>• 총 지출: <span className="font-bold text-rose-600 dark:text-rose-400">₩ {totalMonthExpense.toLocaleString()}</span></p>
            <p>• 최다 지출 항목: <span className="font-bold text-slate-800 dark:text-slate-200">{topCategory ? `${topCategory[0]} (₩ ${topCategory[1].toLocaleString()})` : '없음'}</span></p>
          </div>
        </div>

        {/* AI 절약 피드백 카드 */}
        <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 rounded-xl space-y-2">
          <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
            <Award size={14} /> 맞춤형 지출 줄이기 제안
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            {getBudgetAdvice()}
          </p>
        </div>
      </div>
    </div>
  );
}