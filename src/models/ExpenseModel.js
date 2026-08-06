import { supabase } from '../config/supabase.js';
import { sanitizeInput, sanitizeNumber, getSafeErrorMessage } from '../utils/security.js';

export async function fetchExpensesFromSupabase(userId) {
  try {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.warn('[DB] Error al cargar gastos');
    return null;
  }
}

export async function saveExpenseToSupabase(userId, expense) {
  const safeTitle = sanitizeInput(expense.title || '');
  const safeAmount = sanitizeNumber(expense.amount, { min: 0.01, max: 99999 });
  const safeCategory = sanitizeInput(expense.category || 'fixed');

  try {
    const { data, error } = await supabase
      .from('expenses')
      .insert([
        {
          user_id: userId,
          title: safeTitle,
          amount: safeAmount,
          notes: safeCategory,
          is_shared: !!expense.isShared,
          expense_date: expense.date || new Date().toISOString().split('T')[0]
        }
      ])
      .select();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.warn('[DB] Error al guardar gasto');
    return { success: false, error: getSafeErrorMessage(err) };
  }
}

export async function deleteExpenseFromSupabase(userId, expenseId) {
  try {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', expenseId)
      .eq('user_id', userId);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.warn('[DB] Error al eliminar gasto');
    return { success: false, error: getSafeErrorMessage(err) };
  }
}

export function saveExpensesToLocal(userId, expenses) {
  const key = `verde_expenses_${userId || 'default'}`;
  try {
    localStorage.setItem(key, JSON.stringify(expenses));
  } catch (e) {}
}

export function getExpensesFromLocal(userId) {
  const key = `verde_expenses_${userId || 'default'}`;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}
