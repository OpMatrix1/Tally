import { useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import EmptyState from '../components/EmptyState';
import StatCard from '../components/StatCard';
import { currency, formatMonth } from '../lib/format';
import { supabase } from '../lib/supabase';
import { useSupabaseData } from '../lib/useSupabaseData';

type Props = { session: Session };

export default function Dashboard({ session }: Props) {
  const { transactions, currentMonth, loading } = useSupabaseData(session.user);
  const [byCategory, setByCategory] = useState<{ category_name: string; kind: string; total: number }[]>([]);
  const [byMonth, setByMonth] = useState<{ month: string; total_expense: number | null; total_income: number | null }[]>([]);
  const [budgets, setBudgets] = useState<
    { category_id: string; category_name: string; budget: number; spent: number; remaining: number }[]
  >([]);

  useEffect(() => {
    async function load() {
      const [categoryResult, monthResult, budgetResult] = await Promise.all([
        supabase.rpc('summary_by_category', { p_year: currentMonth.year, p_month: currentMonth.month }),
        supabase.rpc('summary_by_month', { p_months: 6 }),
        supabase.rpc('budget_vs_actual', { p_year: currentMonth.year, p_month: currentMonth.month })
      ]);
      setByCategory(categoryResult.data ?? []);
      setByMonth(monthResult.data ?? []);
      setBudgets(budgetResult.data ?? []);
    }
    void load();
  }, [currentMonth.month, currentMonth.year]);

  const totals = useMemo(() => {
    return transactions.reduce(
      (acc, item) => {
        const date = new Date(`${item.occurred_on}T00:00:00`);
        const isCurrent = date.getFullYear() === currentMonth.year && date.getMonth() + 1 === currentMonth.month;
        if (!isCurrent) return acc;
        if (item.categories?.kind === 'income') acc.income += Number(item.amount);
        else acc.expense += Number(item.amount);
        return acc;
      },
      { income: 0, expense: 0 }
    );
  }, [currentMonth.month, currentMonth.year, transactions]);

  const categoryChart = byCategory.filter((item) => item.kind === 'expense' && Number(item.total) > 0);
  const trendChart = byMonth.map((item) => ({
    month: formatMonth(item.month),
    expense: Number(item.total_expense ?? 0),
    income: Number(item.total_income ?? 0)
  }));

  return (
    <section className="page-stack">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Current month</p>
          <h1>Dashboard</h1>
        </div>
      </div>
      <div className="stats-grid">
        <StatCard label="Income" value={currency.format(totals.income)} tone="good" />
        <StatCard label="Spend" value={currency.format(totals.expense)} tone="bad" />
        <StatCard label="Net" value={currency.format(totals.income - totals.expense)} />
      </div>
      <div className="dashboard-grid">
        <section className="panel chart-panel">
          <h2>Spend by category</h2>
          {categoryChart.length === 0 && !loading ? (
            <EmptyState title="No category spend yet" detail="Add transactions to see where this month is going." />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={categoryChart}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="category_name" />
                <YAxis tickFormatter={(value) => currency.format(Number(value)).replace('.00', '')} />
                <Tooltip formatter={(value) => currency.format(Number(value))} />
                <Bar dataKey="total" fill="#D9A441" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </section>
        <section className="panel chart-panel">
          <h2>Six-month trend</h2>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={trendChart}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => currency.format(Number(value)).replace('.00', '')} />
              <Tooltip formatter={(value) => currency.format(Number(value))} />
              <Line type="monotone" dataKey="expense" stroke="#B4483A" strokeWidth={3} dot={false} />
              <Line type="monotone" dataKey="income" stroke="#D9A441" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </section>
      </div>
      <section className="panel">
        <h2>Budget vs actual</h2>
        <div className="budget-list">
          {budgets.length === 0 ? (
            <EmptyState title="No budgets set" detail="Add monthly budgets to expense categories to track progress." />
          ) : (
            budgets.map((item) => {
              const percent = Math.min(100, Math.round((Number(item.spent) / Number(item.budget)) * 100));
              const over = Number(item.remaining) < 0;
              return (
                <div className="budget-row" key={item.category_id}>
                  <div>
                    <strong>{item.category_name}</strong>
                    <span>
                      {currency.format(Number(item.spent))} of {currency.format(Number(item.budget))}
                    </span>
                  </div>
                  <div className={`progress ${over ? 'over' : ''}`}>
                    <span style={{ width: `${percent}%` }} />
                  </div>
                  <b>{currency.format(Number(item.remaining))}</b>
                </div>
              );
            })
          )}
        </div>
      </section>
    </section>
  );
}
