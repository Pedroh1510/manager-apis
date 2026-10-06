import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { getPreferredTheme, setTheme, type Theme } from '../../lib/theme'
import { Button } from '../ui/Button'
import { FOCUS_RING } from '../ui/focusRing'

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

const linkBase = `flex h-7 items-center rounded-md px-2 text-[13px] transition-colors ${FOCUS_RING}`
const activeCls = 'bg-surface-raised font-medium text-text'
const inactiveCls = 'text-text-muted hover:bg-surface-raised hover:text-text'
const linkClass = ({ isActive }: { isActive: boolean }) => `${linkBase} ${isActive ? activeCls : inactiveCls}`

export function Sidebar() {
  const [theme, setThemeState] = useState<Theme>(() => getPreferredTheme())

  function toggleTheme() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    setThemeState(next)
  }

  return (
    <nav className='flex h-full w-56 shrink-0 flex-col border-r border-border bg-surface px-3 py-4'>
      <div className='mb-6 flex items-center gap-2 px-2'>
        <span aria-hidden='true' className='grid h-5 w-5 place-items-center rounded-sm bg-accent font-mono text-[10px] font-semibold text-white'>
          M
        </span>
        <h1 className='text-sm font-semibold tracking-tight text-text'>Manager APIs</h1>
      </div>
      <NavLink to='/status' className={linkClass}>
        Status
      </NavLink>
      {navItems.map(({ section, links }) => (
        <div key={section} className='mt-5'>
          <p className='mb-1 px-2 text-[11px] font-medium uppercase tracking-wider text-text-subtle'>{section}</p>
          <ul className='space-y-0.5'>
            {links.map(({ to, label }) => (
              <li key={to}>
                <NavLink to={to} className={linkClass}>
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
      <div className='mt-auto'>
        <Button variant='ghost' size='sm' className='w-full !justify-start' onClick={toggleTheme}>
          {theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
        </Button>
      </div>
    </nav>
  )
}
