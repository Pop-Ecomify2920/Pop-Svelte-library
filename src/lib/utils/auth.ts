export function isAuthed() {
  if (typeof window === 'undefined') return false
  return Boolean(localStorage.getItem('user'))
}


