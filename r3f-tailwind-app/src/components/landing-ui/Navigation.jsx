import React, { useState } from 'react'
import { navigateTo } from '../../utils/navigation.js'
import AuthModal from './AuthModal.jsx'
import useAuthStore from '../../store/useAuthStore.js'

export default function Navigation() {
  const [authMode, setAuthMode] = useState(null)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  return <>
    <nav className="navbar">
      <div className="nav-logo">IntelliSpace</div>
      <div className="nav-links"><span>Product</span><span>How it Works</span><span>Workspace</span></div>
      <div className="nav-actions"><button className="nav-signin" type="button" onClick={() => setAuthMode('login')}>Sign in</button><button onClick={() => isAuthenticated ? navigateTo('/editor') : setAuthMode('login')} className="nav-cta">Enter Workspace</button></div>
    </nav>
    {authMode && <AuthModal mode={authMode} onClose={() => setAuthMode(null)} onModeChange={setAuthMode} />}
  </>
}
