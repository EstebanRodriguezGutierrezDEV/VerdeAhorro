import { supabase } from '../config/supabase.js';
import { sanitizeInput, sanitizeNumber, isValidEmail, validatePassword, getSafeErrorMessage } from '../utils/security.js';

export async function registerUser({ name, email, password, income, goal }) {
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
      
      const errorCode = error.code || error.error_code || '';
      const fallbackCodes = ['over_request_rate_limit', 'email_provider_disabled', 'email_rate_limit_exceeded'];
      
      if (!fallbackCodes.includes(errorCode)) {
        return { success: false, error: getSafeErrorMessage(error) };
      }

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

export async function logoutUser() {
  try {
    await supabase.auth.signOut();
  } catch (e) {
    console.log('Sesión cerrada');
  }
}
