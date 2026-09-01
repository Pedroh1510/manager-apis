import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { getStoredTheme, getPreferredTheme, applyTheme, setTheme, THEME_STORAGE_KEY } from './theme'

describe('theme', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('dark')
  })

  afterEach(() => {
    vi.restoreAllMocks()
    // @ts-expect-error jsdom does not implement matchMedia by default
    delete window.matchMedia
  })

  it('getStoredTheme returns null when nothing is stored', () => {
    expect(getStoredTheme()).toBeNull()
  })

  it('getStoredTheme returns the stored valid theme', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark')
    expect(getStoredTheme()).toBe('dark')
  })

  it('getStoredTheme ignores an invalid stored value', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'sepia')
    expect(getStoredTheme()).toBeNull()
  })

  it('getPreferredTheme prefers the stored theme over system preference', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'light')
    window.matchMedia = vi.fn().mockReturnValue({ matches: true }) as unknown as typeof window.matchMedia
    expect(getPreferredTheme()).toBe('light')
  })

  it('getPreferredTheme falls back to system preference when nothing is stored', () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: true }) as unknown as typeof window.matchMedia
    expect(getPreferredTheme()).toBe('dark')
  })

  it('applyTheme toggles the dark class on <html>', () => {
    applyTheme('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    applyTheme('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('setTheme persists to localStorage and applies the class', () => {
    setTheme('dark')
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })
})
