import { useState, useEffect } from 'react'
import { useNavigate, useMatch, Link } from 'react-router-dom'
import PersonRail from './PersonRail'

type Theme = 'light' | 'warm' | 'dark'

function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('fd-theme') as Theme) ?? 'light'
  })

  useEffect(() => {
    document.documentElement.dataset.theme = theme === 'light' ? '' : theme
    localStorage.setItem('fd-theme', theme)
  }, [theme])

  return (
    <div className="theme-toggle">
      {(['light', 'warm', 'dark'] as Theme[]).map(t => (
        <button
          key={t}
          className={`theme-btn${theme === t ? ' active' : ''}`}
          onClick={() => setTheme(t)}
        >
          {t === 'light' ? 'Light' : t === 'warm' ? 'Warm' : 'Dark'}
        </button>
      ))}
    </div>
  )
}

export default function TopBar() {
  const navigate = useNavigate()
  const match = useMatch('/:personSlug/*')
  const slug = match?.params.personSlug ?? 'jon'

  return (
    <header className="topbar">
      <nav className="topbar-nav">
        <Link to={`/${slug}`}>Dashboard</Link>
        <Link to={`/${slug}/chores`}>Chores</Link>
        <Link to={`/${slug}/calendar`}>Calendar</Link>
      </nav>
      <div className="topbar-grow" />

      <div className="topbar-actions">
        <PersonRail />
        <ThemeToggle />
        <button className="switch-btn" onClick={() => navigate('/')}>
          Switch
        </button>
      </div>
    </header>
  )
}
