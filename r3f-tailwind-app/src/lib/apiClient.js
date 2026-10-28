const DEFAULT_API_BASE_URL = 'https://backend-intellispace.onrender.com'
const SESSION_KEY = 'intellispace.session'

const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL
export const API_BASE_URL = (import.meta.env.DEV && !import.meta.env.VITE_API_BASE_URL ? '' : configuredApiBaseUrl).replace(/\/+$/, '')

function readSession() {
  try {
    const value = sessionStorage.getItem(SESSION_KEY)
    return value ? JSON.parse(value) : null
  } catch {
    return null
  }
}

export function getSession() {
  return readSession()
}

export function setSession(session) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ userId: session.userId, token: session.token }))
}

export function clearSession() {
  sessionStorage.removeItem(SESSION_KEY)
}

async function parseResponse(response) {
  const text = await response.text()
  if (!text) return null
  try { return JSON.parse(text) } catch { return { message: text } }
}

function errorMessage(payload, status) {
  if (typeof payload?.message === 'string') return payload.message
  if (typeof payload?.error === 'string') return payload.error
  if (typeof payload?.detail === 'string') return payload.detail
  if (status === 401) return 'Invalid email or password.'
  if (status === 409) return 'An account with this email already exists.'
  return 'The request could not be completed. Please try again.'
}

export async function request(path, options = {}) {
  const session = readSession()
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) }
  if (session?.token) headers.Authorization = `Bearer ${session.token}`

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers })
  const payload = await parseResponse(response)
  if (!response.ok) {
    if (response.status === 401) clearSession()
    const error = new Error(errorMessage(payload, response.status))
    error.status = response.status
    error.payload = payload
    throw error
  }
  return payload
}

export function registerUser({ email, password, displayName }) {
  return request('/api/auth/register', { method: 'POST', body: JSON.stringify({ email, password, displayName }) })
}

export function loginUser({ email, password }) {
  return request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })
}

export function listWorkspaces() {
  return request('/api/workspaces')
}

export function getWorkspace(id) {
  return request(`/api/workspaces/${encodeURIComponent(id)}`)
}

export function createWorkspace(payload) {
  return request('/api/workspaces', { method: 'POST', body: JSON.stringify(payload) })
}

export function updateWorkspace(id, payload) {
  return request(`/api/workspaces/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export { DEFAULT_API_BASE_URL, SESSION_KEY }
