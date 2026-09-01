import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { getPreferredTheme, setTheme, type Theme } from '../../lib/theme'
import { Button } from '../ui/Button'

const navItems = [
  {
    section: 'Anime RSS',
    links: [
      { to: '/anime-rss/rss', label: 'Consulta RSS' },
      { to: '/anime-rss/admin', label: 'ADM' },
    ],
  },
  {
    section: 'Mangas Manager',
    links: [
      { to: '/mangas/admin', label: 'Configurações / ADM' },
      { to: '/mangas/list', label: 'Mangas' },
    ],
  },
]

const activeCls = 'bg-accent-muted text-accent border-l-2 border-accent'
const inactiveCls = 'text-text-muted hover:bg-surface-raised hover:text-text border-l-2 border-transparent'

export function Sidebar() {
  const [theme, setThemeState] = useState<Theme>(() => getPreferredTheme())

  function toggleTheme() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    setThemeState(next)
  }

  return (
    <nav className='flex h-full w-60 flex-col border-r border-border bg-surface px-4 py-6'>
      <h1 className='mb-8 text-xl font-semibold tracking-tight text-text'>Manager APIs</h1>
      <NavLink
        to='/status'
        className={({ isActive }) =>
          `mb-6 block rounded-md px-3 py-2 text-sm transition-colors ${isActive ? activeCls : inactiveCls}`
        }
      >
        Status
      </NavLink>
      {navItems.map(({ section, links }) => (
        <div key={section} className='mb-6'>
          <p className='mb-2 text-xs font-semibold uppercase tracking-wider text-text-subtle'>
            {section}
          </p>
          <ul className='space-y-1'>
            {links.map(({ to, label }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  className={({ isActive }) =>
                    `block rounded-md px-3 py-2 text-sm transition-colors ${isActive ? activeCls : inactiveCls}`
                  }
                >
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
      <div className='mt-auto'>
        <Button variant='ghost' className='w-full' onClick={toggleTheme}>
          {theme === 'dark' ? 'Claro' : 'Escuro'}
        </Button>
      </div>
    </nav>
  )
}
