// auth.js
import supabase from './utils/supabaseClient.js';

export async function checkAuth() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    alert('User not authenticated. Please sign in.');
    window.location.href = 'login.html';
    return null;
  }
  return user;
}

export function subscribeToAuthChanges(callback) {
  supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
}