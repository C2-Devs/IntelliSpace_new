import { create } from 'zustand'
import { clearSession, getSession, loginUser, registerUser, setSession } from '../lib/apiClient.js'

const initialSession = getSession()

const useAuthStore = create((set) => ({
  session: initialSession,
  isAuthenticated: Boolean(initialSession?.token),
  isLoading: false,
  error: '',
  async login(credentials) {
    set({ isLoading: true, error: '' })
    try {
      const session = await loginUser(credentials)
      if (!session?.token || !session?.userId) throw new Error('The server returned an incomplete session.')
      setSession(session)
      set({ session, isAuthenticated: true, isLoading: false })
      return session
    } catch (error) {
      set({ isLoading: false, error: error.message })
      throw error
    }
  },
  async register(credentials) {
    set({ isLoading: true, error: '' })
    try {
      const session = await registerUser(credentials)
      if (!session?.token || !session?.userId) throw new Error('The server returned an incomplete session.')
      setSession(session)
      set({ session, isAuthenticated: true, isLoading: false })
      return session
    } catch (error) {
      set({ isLoading: false, error: error.message })
      throw error
    }
  },
  logout() {
    clearSession()
    set({ session: null, isAuthenticated: false, error: '' })
  },
}))

export default useAuthStore
