import { useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { getPreferredTheme, setTheme, type Theme } from '../../lib/theme'
import { useServerConfig } from '../../features/server-config/hooks/useServerConfig'
import type { ServerConfig } from '../../features/server-config/services/api'
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

// Each link shows only when the server says its integration is configured (GET /api/config).
// Séries matches only the library and a series detail: /sonarr/adicionar and /sonarr/faltantes have their own links.
const mediaLinks: { to: string; label: string; integration: keyof ServerConfig; activeOn?: RegExp }[] = [
  { to: '/sonarr', label: 'Séries', integration: 'sonarr', activeOn: /^\/sonarr(\/\d+)?$/ },
  { to: '/sonarr/adicionar', label: 'Adicionar série', integration: 'sonarr' },
  { to: '/sonarr/faltantes', label: 'Faltantes', integration: 'sonarr' },
  { to: '/torrents', label: 'Torrents', integration: 'qbittorrent' },
]

const linkBase = `flex h-7 items-center rounded-md px-2 text-[13px] transition-colors ${FOCUS_RING}`
const activeCls = 'bg-surface-raised font-medium text-text'
const inactiveCls = 'text-text-muted hover:bg-surface-raised hover:text-text'
const linkClass = ({ isActive }: { isActive: boolean }) => `${linkBase} ${isActive ? activeCls : inactiveCls}`
// /mangas/:idManga is reached from the list, so the list stays highlighted there.
const MANGA_DETAIL_PATH = /^\/mangas\/\d+$/

/** A link whose highlight follows `isActive` instead of NavLink's prefix match. */
function PinnedLink({ to, label, isActive }: { to: string; label: string; isActive: boolean }) {
  return (
    <Link to={to} aria-current={isActive ? 'page' : undefined} className={linkClass({ isActive })}>
      {label}
    </Link>
  )
}

export function Sidebar() {
  const [theme, setThemeState] = useState<Theme>(() => getPreferredTheme())
  const { pathname } = useLocation()
  const isMangaDetail = MANGA_DETAIL_PATH.test(pathname)
  const config = useServerConfig().data
  const enabledMediaLinks = mediaLinks.filter(({ integration }) => config?.[integration] === true)
  const sections = enabledMediaLinks.length ? [...navItems, { section: 'Mídia', links: enabledMediaLinks }] : navItems

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
      <NavLink to='/filas' className={linkClass}>
        Filas
      </NavLink>
      {sections.map(({ section, links }) => (
        <div key={section} className='mt-5'>
          <p className='mb-1 px-2 text-[11px] font-medium uppercase tracking-wider text-text-subtle'>{section}</p>
          <ul className='space-y-0.5'>
            {links.map(({ to, label, activeOn }: { to: string; label: string; activeOn?: RegExp }) => (
              <li key={to}>
                {to === '/mangas/list' && isMangaDetail ? (
                  <PinnedLink to={to} label={label} isActive />
                ) : activeOn ? (
                  <PinnedLink to={to} label={label} isActive={activeOn.test(pathname)} />
                ) : (
                  <NavLink to={to} className={linkClass}>
                    {label}
                  </NavLink>
                )}
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
