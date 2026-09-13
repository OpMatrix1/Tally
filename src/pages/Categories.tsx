import { FormEvent, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { Trash2 } from 'lucide-react';
import EmptyState from '../components/EmptyState';
import { currency } from '../lib/format';
import { supabase } from '../lib/supabase';
import { useSupabaseData } from '../lib/useSupabaseData';

type Props = { session: Session };

const swatches = ['#D9A441', '#B4483A', '#1F3A34', '#5B6660', '#3F7D6B', '#7A5C99'];

export default function Categories({ session }: Props) {
  const { categories, setCategories } = useSupabaseData(session.user);
  const [name, setName] = useState('');
  const [kind, setKind] = useState<'expense' | 'income'>('expense');
  const [color, setColor] = useState(swatches[0]);
  const [budget, setBudget] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function addCategory(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const { data, error: insertError } = await supabase
      .from('categories')
      .insert({
        user_id: session.user.id,
        name,
        kind,
        color,
        monthly_budget: kind === 'expense' && budget ? Number(budget) : null
      })
      .select()
      .single();
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setCategories((items) => [...items, data].sort((a, b) => a.name.localeCompare(b.name)));
    setName('');
    setBudget('');
  }

  async function removeCategory(id: string) {
    const previous = categories;
    setCategories((items) => items.filter((item) => item.id !== id));
    const { error: deleteError } = await supabase.from('categories').delete().eq('id', id);
    if (deleteError) {
      setCategories(previous);
      setError(deleteError.message);
    }
  }

  return (
    <section className="page-stack">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Plan</p>
          <h1>Categories</h1>
        </div>
      </div>
      <section className="panel">
        <form className="category-form" onSubmit={addCategory}>
          <label>
            Name
            <input value={name} onChange={(event) => setName(event.target.value)} required />
          </label>
          <label>
            Kind
            <select value={kind} onChange={(event) => setKind(event.target.value as 'expense' | 'income')}>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </label>
          <label>
            Monthly budget
            <input
              type="number"
              min="0"
              step="0.01"
              value={budget}
              onChange={(event) => setBudget(event.target.value)}
              disabled={kind === 'income'}
            />
          </label>
          <div className="swatch-row" aria-label="Color">
            {swatches.map((item) => (
              <button
                type="button"
                key={item}
                className={`swatch ${item === color ? 'selected' : ''}`}
                style={{ backgroundColor: item }}
                onClick={() => setColor(item)}
                aria-label={item}
              />
            ))}
          </div>
          <button className="primary-button">Add category</button>
        </form>
        {error && <p className="notice">{error}</p>}
      </section>
      <section className="panel">
        <div className="list-table">
          {categories.length === 0 ? (
            <EmptyState title="No categories yet" detail="Create income and expense categories before adding transactions." />
          ) : (
            categories.map((item) => (
              <div className="table-row" key={item.id}>
                <span className="category-name">
                  <i style={{ backgroundColor: item.color ?? '#D9A441' }} />
                  {item.name}
                </span>
                <span>{item.kind}</span>
                <span className="amount">{item.monthly_budget ? currency.format(Number(item.monthly_budget)) : ''}</span>
                <button className="icon-button" aria-label="Delete category" onClick={() => void removeCategory(item.id)}>
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
