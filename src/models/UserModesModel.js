import { supabase } from '../config/supabase.js';
import { isValidUUID } from '../utils/helpers.js';

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

export function saveUserModes(userId, modes) {
  const key = `verde_user_modes_${userId || 'default'}`;
  try {
    localStorage.setItem(key, JSON.stringify(modes));
  } catch (e) {}

  if (isValidUUID(userId)) {
    saveUserModesToSupabase(modes);
  }
}

export function getUserModes(user) {
  if (user?.user_metadata?.active_modes) {
    return user.user_metadata.active_modes;
  }
  const key = `verde_user_modes_${user?.id || 'default'}`;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function generateInviteCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'VA-';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function getUserInviteCode(userId) {
  const key = `verde_invite_code_${userId || 'default'}`;
  try {
    const saved = localStorage.getItem(key);
    if (saved) return saved;
    const newCode = generateInviteCode();
    localStorage.setItem(key, newCode);
    return newCode;
  } catch (e) {
    return generateInviteCode();
  }
}

export function saveLinkedPartner(userId, partnerData) {
  const key = `verde_linked_partner_${userId || 'default'}`;
  try {
    localStorage.setItem(key, JSON.stringify(partnerData));
  } catch (e) {}
}

export function getLinkedPartner(userId) {
  const key = `verde_linked_partner_${userId || 'default'}`;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function removeLinkedPartner(userId) {
  const key = `verde_linked_partner_${userId || 'default'}`;
  try {
    localStorage.removeItem(key);
  } catch (e) {}
}
