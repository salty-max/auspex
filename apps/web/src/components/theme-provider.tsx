import {
  createContext,
  type ReactNode,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

export type Theme = 'light' | 'dark' | 'system'
type Resolved = 'light' | 'dark'

interface ThemeState {
  theme: Theme
  /** The theme actually applied, after resolving `'system'`. */
  resolved: Resolved
  setTheme: (theme: Theme) => void
}

const STORAGE_KEY = 'auspex-theme'
const ThemeContext = createContext<ThemeState | null>(null)

function systemTheme(): Resolved {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

function apply(resolved: Resolved): void {
  const root = document.documentElement
  root.classList.remove('light', 'dark')
  root.classList.add(resolved)
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(
    () => (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? 'dark'
  )
  const [resolved, setResolved] = useState<Resolved>(() =>
    theme === 'system' ? systemTheme() : theme
  )

  useEffect(() => {
    const next = theme === 'system' ? systemTheme() : theme
    apply(next)
    setResolved(next)

    if (theme !== 'system') return
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      const sys = systemTheme()
      apply(sys)
      setResolved(sys)
    }
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [theme])

  const setTheme = useCallback((next: Theme) => {
    localStorage.setItem(STORAGE_KEY, next)
    setThemeState(next)
  }, [])

  const value = useMemo<ThemeState>(
    () => ({ theme, resolved, setTheme }),
    [theme, resolved, setTheme]
  )

  return <ThemeContext value={value}>{children}</ThemeContext>
}

export function useTheme(): ThemeState {
  const context = use(ThemeContext)
  if (!context) throw new Error('useTheme must be used within a ThemeProvider')
  return context
}
