import { writable } from 'svelte/store'

export type Theme = 'light' | 'dark'

function createThemeStore() {
  let initial: Theme = 'dark'

  if (typeof window !== 'undefined') {
    const stored = window.localStorage.getItem('theme') as Theme | null
    if (stored === 'light' || stored === 'dark') {
      initial = stored
    }
  }

  const { subscribe, set, update } = writable<Theme>(initial)

  // keep DOM and localStorage in sync
  if (typeof window !== 'undefined') {
    subscribe((value) => {
      const root = document.documentElement
      root.classList.remove('light', 'dark')
      root.classList.add(value)
      window.localStorage.setItem('theme', value)
    })
  }

  return {
    subscribe,
    setTheme: (theme: Theme) => set(theme),
    toggleTheme: () => update((prev) => (prev === 'dark' ? 'light' : 'dark')),
  }
}

export const theme = createThemeStore()


