import {
  createContext,
  type ReactNode,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

import { isPalette, type Palette } from '@/theme/theme'

interface ThemeState {
  palette: Palette
  setPalette: (palette: Palette) => void
  crt: boolean
  setCrt: (crt: boolean) => void
}

const PALETTE_KEY = 'auspex-palette'
const CRT_KEY = 'auspex-crt'
const ThemeContext = createContext<ThemeState | null>(null)

function readPalette(): Palette {
  const stored = localStorage.getItem(PALETTE_KEY)
  return isPalette(stored) ? stored : 'mechanicus'
}

function readCrt(): boolean {
  return localStorage.getItem(CRT_KEY) !== 'off'
}

/** Apply the palette to `<html>`; the default `'mechanicus'` uses no data-theme. */
function applyPalette(palette: Palette): void {
  const root = document.documentElement
  if (palette === 'mechanicus') root.removeAttribute('data-theme')
  else root.setAttribute('data-theme', palette)
}

/** Provides the active palette and CRT toggle, persisting both to local storage. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [palette, setPaletteState] = useState<Palette>(readPalette)
  const [crt, setCrtState] = useState<boolean>(readCrt)

  useEffect(() => {
    applyPalette(palette)
  }, [palette])

  useEffect(() => {
    document.documentElement.classList.toggle('crt', crt)
  }, [crt])

  const setPalette = useCallback((next: Palette) => {
    localStorage.setItem(PALETTE_KEY, next)
    setPaletteState(next)
  }, [])

  const setCrt = useCallback((next: boolean) => {
    localStorage.setItem(CRT_KEY, next ? 'on' : 'off')
    setCrtState(next)
  }, [])

  const value = useMemo<ThemeState>(
    () => ({ palette, setPalette, crt, setCrt }),
    [palette, setPalette, crt, setCrt]
  )

  return <ThemeContext value={value}>{children}</ThemeContext>
}

/** Read the active theme; throws outside a `ThemeProvider`. */
export function useTheme(): ThemeState {
  const context = use(ThemeContext)
  if (!context) throw new Error('useTheme must be used within a ThemeProvider')
  return context
}
