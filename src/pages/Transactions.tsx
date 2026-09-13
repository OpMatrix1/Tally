import { FormEvent, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { Trash2 } from 'lucide-react';
import EmptyState from '../components/EmptyState';
import { currency, formatDate } from '../lib/format';
import { supabase } from '../lib/supabase';
import { TransactionWithCategory, useSupabaseData } from '../lib/useSupabaseData';

type Props = { session: Session };

export default function Transactions({ session }: Props) {
  const { categories, transactions, setTransactions } = useSupabaseData(session.user);
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [receipt, setReceipt] = useState<File | null>(null);
  const [filter, setFilter] = useState('');
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return transactions.filter((item) => !filter || item.category_id === filter);
  }, [filter, transactions]);

  const runningTotal = filtered.reduce((sum, item) => {
    const sign = item.categories?.kind === 'income' ? 1 : -1;
    return sum + Number(item.amount) * sign;
  }, 0);

  async function uploadReceipt(transactionId: string) {
    if (!receipt) return null;
    const ext = receipt.name.split('.').pop() ?? 'bin';
    const path = `${session.user.id}/${transactionId}.${ext}`;
    const { error: uploadError } = await supabase.storage.from('receipts').upload(path, receipt, { upsert: true });
    if (uploadError) throw uploadError;
    return path;
  }

  async function addTransaction(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const selected = categories.find((item) => item.id === categoryId) ?? null;
    const tempId = crypto.randomUUID();
    const optimistic: TransactionWithCategory = {
      id: tempId,
      user_id: session.user.id,
      category_id: categoryId || null,
      amount: Number(amount),
      description: description || null,
      occurred_on: date,
      receipt_path: null,
      created_at: new Date().toISOString(),
      categories: selected ? { name: selected.name, kind: selected.kind, color: selected.color } : null
    };
    setTransactions((items) => [optimistic, ...items]);

    const { data, error: insertError } = await supabase
      .from('transactions')
      .insert({
        user_id: session.user.id,
        category_id: categoryId || null,
        amount: Number(amount),
        description: description || null,
        occurred_on: date
      })
      .select('*, categories(name, kind, color)')
      .single();

    if (insertError || !data) {
      setTransactions((items) => items.filter((item) => item.id !== tempId));
      setError(insertError?.message ?? 'Unable to add transaction.');
      return;
    }

    try {
      const receiptPath = await uploadReceipt(data.id);
      const saved = receiptPath
        ? await supabase.from('transactions').update({ receipt_path: receiptPath }).eq('id', data.id).select('*, categories(name, kind, color)').single()
        : { data, error: null };
      if (saved.error) throw saved.error;
      setTransactions((items) => items.map((item) => (item.id === tempId ? (saved.data as TransactionWithCategory) : item)));
    } catch (storageError) {
      setTransactions((items) => items.map((item) => (item.id === tempId ? (data as TransactionWithCategory) : item)));
      setError(storageError instanceof Error ? storageError.message : 'Receipt upload failed.');
    }

    setAmount('');
    setDescription('');
    setReceipt(null);
  }

  async function removeTransaction(id: string) {
    const previous = transactions;
    setTransactions((items) => items.filter((item) => item.id !== id));
    const { error: deleteError } = await supabase.from('transactions').delete().eq('id', id);
    if (deleteError) {
      setTransactions(previous);
      setError(deleteError.message);
    }
  }

  return (
    <section className="page-stack">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Ledger</p>
          <h1>Transactions</h1>
        </div>
        <strong className="running-total">{currency.format(runningTotal)}</strong>
      </div>
      <section className="panel">
        <form className="transaction-form" onSubmit={addTransaction}>
          <label>
            Category
            <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} required>
              <option value="">Select</option>
              {categories.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Amount
            <input type="number" min="0" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} required />
          </label>
          <label>
            Date
            <input type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
          </label>
          <label>
            Description
            <input value={description} onChange={(event) => setDescription(event.target.value)} />
          </label>
          <label>
            Receipt
            <input type="file" accept="image/*,.pdf" onChange={(event) => setReceipt(event.target.files?.[0] ?? null)} />
          </label>
          <button className="primary-button">Add transaction</button>
        </form>
        {error && <p className="notice">{error}</p>}
      </section>
      <section className="panel">
        <div className="toolbar">
          <label>
            Filter
            <select value={filter} onChange={(event) => setFilter(event.target.value)}>
              <option value="">All categories</option>
              {categories.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="list-table">
          {filtered.length === 0 ? (
            <EmptyState title="No transactions" detail="Add the first entry to start building your ledger." />
          ) : (
            filtered.map((item) => (
              <div className="table-row transaction-row" key={item.id}>
                <span>{formatDate(item.occurred_on)}</span>
                <span className="category-name">
                  <i style={{ backgroundColor: item.categories?.color ?? '#D9A441' }} />
                  {item.categories?.name ?? 'Uncategorized'}
                </span>
                <span>{item.description}</span>
                <span className={`amount ${item.categories?.kind === 'income' ? 'income' : 'expense'}`}>
                  {currency.format(Number(item.amount))}
                </span>
                <button className="icon-button" aria-label="Delete transaction" onClick={() => void removeTransaction(item.id)}>
                  <Trash2 size={17} />
                </button>
              </div>
            ))
          )}
        </div>
      </section>
    </section>
  );
}
