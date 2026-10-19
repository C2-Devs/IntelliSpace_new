import React, { useState } from 'react'
import { navigateTo } from '../utils/navigation.js'
import useAuthStore from '../store/useAuthStore.js'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function AuthPlaceholder({ mode }) {
  const isLogin = mode === 'login'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [validationError, setValidationError] = useState('')
  const { login, register, isLoading, error } = useAuthStore()

  async function submit(event) {
    event.preventDefault()
    setValidationError('')
    const normalizedEmail = email.trim().toLowerCase()
    if (!emailPattern.test(normalizedEmail)) return setValidationError('Enter a valid email address.')
    if (password.length < 8) return setValidationError('Password must be at least 8 characters.')
    if (!isLogin && !displayName.trim()) return setValidationError('Enter your display name.')
    try {
      await (isLogin ? login({ email: normalizedEmail, password }) : register({ email: normalizedEmail, password, displayName: displayName.trim() }))
      navigateTo('/editor')
    } catch {
      // The store exposes a safe, user-facing error message.
    }
  }

  return (
    <main className="placeholder-page">
      <div className="eyebrow">INTELLISPACE / {isLogin ? 'LOGIN' : 'REGISTER'}</div>
      <h1 className="placeholder-title">{isLogin ? 'Welcome back' : 'Create your account'}</h1>
      <form className="auth-form" onSubmit={submit} noValidate>
        {!isLogin && <input placeholder="Display name" aria-label="Display name" className="auth-input" value={displayName} onChange={(event) => setDisplayName(event.target.value)} autoComplete="name" />}
        <input placeholder="Email" aria-label="Email" className="auth-input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" />
        <input placeholder="At least 8 characters" aria-label="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="auth-input" autoComplete={isLogin ? 'current-password' : 'new-password'} />
        {(validationError || error) && <p className="auth-status" role="alert">{validationError || error}</p>}
        <button className="btn-primary full-width" type="submit" disabled={isLoading}>{isLoading ? 'Connecting…' : isLogin ? 'Sign In' : 'Sign Up'}</button>
      </form>
      <button onClick={() => navigateTo('/')} className="btn-link mt-lg" type="button">← Back to landing</button>
    </main>
  )
}
