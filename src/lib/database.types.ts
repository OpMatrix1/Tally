export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          kind: 'expense' | 'income';
          color: string | null;
          monthly_budget: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          kind?: 'expense' | 'income';
          color?: string | null;
          monthly_budget?: number | null;
          created_at?: string;
        };
        Update: {
          name?: string;
          kind?: 'expense' | 'income';
          color?: string | null;
          monthly_budget?: number | null;
        };
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          category_id: string | null;
          amount: number;
          description: string | null;
          occurred_on: string;
          receipt_path: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          category_id?: string | null;
          amount: number;
          description?: string | null;
          occurred_on?: string;
          receipt_path?: string | null;
          created_at?: string;
        };
        Update: {
          category_id?: string | null;
          amount?: number;
          description?: string | null;
          occurred_on?: string;
          receipt_path?: string | null;
        };
      };
    };
    Views: Record<string, never>;
    Functions: {
      summary_by_category: {
        Args: { p_year: number; p_month: number };
        Returns: { category_id: string; category_name: string; kind: string; total: number }[];
      };
      summary_by_month: {
        Args: { p_months?: number };
        Returns: { month: string; total_expense: number | null; total_income: number | null }[];
      };
      budget_vs_actual: {
        Args: { p_year: number; p_month: number };
        Returns: { category_id: string; category_name: string; budget: number; spent: number; remaining: number }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Category = Database['public']['Tables']['categories']['Row'];
export type Transaction = Database['public']['Tables']['transactions']['Row'];
