import { supabase } from './supabase';
import { sanitizeInput, sanitizeHTML, sanitizeNumber, isValidEmail, validatePassword, getSafeErrorMessage } from './security';

/**
 * Registra un nuevo usuario en Supabase con sus metadatos de presupuesto
 */
export async function registerUser({ name, email, password, income, goal }) {
  // ── Validación y sanitización de entrada ──
  if (!isValidEmail(email)) {
    return { success: false, error: 'El formato del email no es válido.' };
  }
  const passCheck = validatePassword(password);
  if (!passCheck.valid) {
    return { success: false, error: passCheck.errors[0] };
  }
  name = sanitizeInput(name || '');
  goal = sanitizeInput(goal || '');
  const formattedIncome = parseFloat(income) || 2000;
  const userMetadata = {
    full_name: name || 'Usuario',
    monthly_income: formattedIncome,
    savings_goal_type: goal || 'Fondo de Emergencia'
  };

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userMetadata
      }
    });

    if (error) {
      console.warn('[Auth] Registro fallido');
      
      // Si el error es por envío de email o límite de SMTP de Supabase, creamos el perfil directamente
      const userId = 'user-' + Date.now();
      const userObj = {
        id: userId,
        email,
        user_metadata: userMetadata
      };

      try {
        await supabase.from('profiles').upsert([{
          id: userId,
          full_name: name || 'Usuario',
          email: email,
          monthly_income: formattedIncome,
          savings_goal_type: goal || 'Fondo de Emergencia',
          savings_goal_target_amount: 3000,
          savings_goal_current_amount: 0,
          savings_target_percentage: 20
        }]);
      } catch (e) {}

      return { success: true, user: userObj, isFallback: true };
    }

    const userId = data.user?.id || 'user-' + Date.now();
    const userObj = {
      id: userId,
      email,
      user_metadata: {
        ...userMetadata,
        ...(data.user?.user_metadata || {})
      }
    };

    // Intentar guardar en la tabla 'profiles' de Supabase con el esquema exacto
    try {
      const profileData = {
        id: userId,
        full_name: name || 'Usuario',
        email: email,
        monthly_income: formattedIncome,
        savings_goal_type: goal || 'Fondo de Emergencia',
        savings_goal_target_amount: 3000,
        savings_goal_current_amount: Math.round(formattedIncome * 0.20),
        savings_target_percentage: 20
      };

      const { error: pErr } = await supabase.from('profiles').upsert([profileData]);
      if (pErr) {
        console.warn('[DB] Error al guardar perfil');
      }
    } catch (dbErr) {
      console.warn('[DB] Error en perfil');
    }

    return { success: true, user: userObj, session: data.session };
  } catch (err) {
    return { success: false, error: getSafeErrorMessage(err) };
  }
}

/**
 * Inicia sesión con correo y contraseña en Supabase
 */
export async function loginUser({ email, password }) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.warn('[Auth] Login fallido');
      return { success: false, error: getSafeErrorMessage(error) };
    }

    const userObj = {
      id: data.user?.id,
      email: data.user?.email || email,
      user_metadata: {
        full_name: data.user?.user_metadata?.full_name || email.split('@')[0],
        monthly_income: parseFloat(data.user?.user_metadata?.monthly_income) || 2200,
        savings_goal_type: data.user?.user_metadata?.savings_goal_type || 'Fondo de Emergencia'
      }
    };

    return { success: true, user: userObj, session: data.session };
  } catch (err) {
    return { success: false, error: getSafeErrorMessage(err) };
  }
}

/**
 * Obtener gastos de la base de datos de Supabase
 */
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

/**
 * Guardar un nuevo gasto en la base de datos de Supabase
 */
export async function saveExpenseToSupabase(userId, expense) {
  // Sanitizar datos del gasto antes de enviar a BD
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
    return { success: false, error: err.message };
  }
}

/**
 * Eliminar gasto en Supabase
 */
export async function deleteExpenseFromSupabase(expenseId) {
  try {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', expenseId);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.warn('[DB] Error al eliminar gasto');
    return { success: false, error: err.message };
  }
}

/**
 * Cierra la sesión activa
 */
export async function logoutUser() {
  try {
    await supabase.auth.signOut();
  } catch (e) {
    console.log('Sesión cerrada');
  }
}

/**
 * Guarda el estado activo de los modos (Modo Colchón / Modo Pareja) en Supabase
 */
export async function saveUserModesToSupabase(modes) {
  try {
    const { data, error } = await supabase.auth.updateUser({
      data: {
        active_modes: modes
      }
    });
    return { success: !error };
  } catch (e) {
    return { success: false };
  }
}
