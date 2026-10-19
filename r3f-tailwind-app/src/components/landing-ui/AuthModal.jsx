import React, { useState } from 'react'
import { X } from 'lucide-react'
import { navigateTo } from '../../utils/navigation.js'
import useAuthStore from '../../store/useAuthStore.js'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function AuthModal({ mode, onClose, onModeChange }) {
  const isLogin = mode === 'login'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)
  const { login, register } = useAuthStore()

  async function submit(event) {
    event.preventDefault()
    const normalizedEmail = email.trim().toLowerCase()
    setStatus('')
    if (!emailPattern.test(normalizedEmail)) return setStatus('Enter a valid email address.')
    if (password.length < 8) return setStatus('Password must be at least 8 characters.')
    if (!isLogin && !name.trim()) return setStatus('Enter your display name.')
    if (!isLogin && password !== confirmation) return setStatus('Passwords do not match.')
    setBusy(true)
    try {
      await (isLogin ? login({ email: normalizedEmail, password }) : register({ email: normalizedEmail, password, displayName: name.trim() }))
      onClose()
      navigateTo('/editor')
    } catch (error) {
      setStatus(error.message || 'Authentication failed. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return <div className="auth-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title"><button className="auth-close" type="button" onClick={onClose} aria-label="Close"><X size={18} /></button><p className="auth-eyebrow">INTELLISPACE / {isLogin ? 'SIGN IN' : 'CREATE ACCOUNT'}</p><h2 id="auth-title">{isLogin ? 'Welcome back.' : 'Make room for better ideas.'}</h2><p className="auth-subtitle">{isLogin ? 'Continue shaping spaces with precision.' : 'Start designing with your IntelliSpace account.'}</p><form onSubmit={submit} noValidate>{!isLogin && <label>Display name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" autoComplete="name" /></label>}<label>Email<input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="you@example.com" autoComplete="email" required /></label><label>Password<input value={password} onChange={(event) => setPassword(event.target.value)} type="password" placeholder="At least 8 characters" autoComplete={isLogin ? 'current-password' : 'new-password'} minLength={8} required /></label>{!isLogin && <label>Confirm password<input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} type="password" placeholder="Repeat your password" autoComplete="new-password" minLength={8} required /></label>}{status && <p className="auth-status" role="alert">{status}</p>}<button className="auth-submit" type="submit" disabled={busy}>{busy ? 'Connecting…' : isLogin ? 'Sign in' : 'Create account'}</button></form><p className="auth-switch">{isLogin ? 'New to IntelliSpace?' : 'Already have an account?'} <button type="button" onClick={() => { setStatus(''); onModeChange(isLogin ? 'register' : 'login') }}>{isLogin ? 'Create an account' : 'Sign in'}</button></p></section></div>
}
