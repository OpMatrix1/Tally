import { useCallback, useEffect, useMemo, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import type { Category, Transaction } from './database.types';

export type TransactionWithCategory = Transaction & {
  categories: Pick<Category, 'name' | 'kind' | 'color'> | null;
};

export function useSupabaseData(user: User | null) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<TransactionWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    const [categoryResult, transactionResult] = await Promise.all([
      supabase.from('categories').select('*').order('name'),
      supabase
        .from('transactions')
        .select('*, categories(name, kind, color)')
        .order('occurred_on', { ascending: false })
        .order('created_at', { ascending: false })
    ]);

    if (categoryResult.error || transactionResult.error) {
      setError(categoryResult.error?.message ?? transactionResult.error?.message ?? 'Unable to load data.');
    } else {
      setCategories(categoryResult.data ?? []);
      setTransactions((transactionResult.data ?? []) as TransactionWithCategory[]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const currentMonth = useMemo(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  }, []);

  return {
    categories,
    setCategories,
    transactions,
    setTransactions,
    loading,
    error,
    refresh,
    currentMonth
  };
}
