import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { AppState } from 'react-native'
import { isSupabaseConfigured, SUPABASE_ANON_KEY, SUPABASE_URL } from './env'

export { BOOTH_EMAIL, isSupabaseConfigured } from './env'

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
      auth: {
        storage: AsyncStorage,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    })
  : null

// Token refresh timers are paused while backgrounded so they do not fire against a sleeping JS thread.
if (supabase) {
  const client = supabase
  AppState.addEventListener('change', (state) => {
    if (state === 'active') void client.auth.startAutoRefresh()
    else void client.auth.stopAutoRefresh()
  })
}
