import { create } from 'zustand'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  requestPasswordReset: (email: string) => Promise<void>
  updatePassword: (password: string) => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => {
  supabase.auth.getSession().then(({ data: { session } }) => {
    set({ session, user: session?.user ?? null, loading: false })
  })

  supabase.auth.onAuthStateChange((_event, session) => {
    set({ session, user: session?.user ?? null, loading: false })
  })

  return {
    user: null,
    session: null,
    loading: true,

    async login(email, password) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      if (data.user) {
        // Best-effort: no debe bloquear el login si falla.
        supabase
          .from('profiles')
          .update({ last_login_at: new Date().toISOString() })
          .eq('id', data.user.id)
          .then(() => {})
      }
    },

    async register(email, password) {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) throw error
    },

    async logout() {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    },

    async requestPasswordReset(email) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/restablecer`,
      })
      if (error) throw error
    },

    async updatePassword(password) {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
    },
  }
})
