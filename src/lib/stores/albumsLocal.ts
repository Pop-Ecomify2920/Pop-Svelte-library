import { writable } from 'svelte/store'

export type Album = {
  id: string
  name: string
  description: string | null
  cover_photo_id: string | null
  is_shared: boolean
  created_at: string
  updated_at: string
  user_id: string
}

const STORAGE_KEY = 'local_albums'

function loadAlbums(): Album[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Album[]) : []
  } catch (e) {
    console.error('Failed to load albums', e)
    return []
  }
}

function saveAlbums(albums: Album[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(albums))
  } catch (e) {
    console.error('Failed to save albums', e)
  }
}

export const albums = writable<Album[]>([])

if (typeof window !== 'undefined') {
  albums.set(loadAlbums())
  window.addEventListener('storage', () => albums.set(loadAlbums()))
}

export function createAlbum(data: { name: string; description?: string | null; coverPhotoId?: string | null }) {
  const now = new Date().toISOString()
  const newAlbum: Album = {
    id: `album_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    name: data.name,
    description: data.description ?? null,
    cover_photo_id: data.coverPhotoId ?? null,
    is_shared: false,
    created_at: now,
    updated_at: now,
    user_id: 'local_user',
  }

  albums.update((prev) => {
    const next = [newAlbum, ...prev]
    saveAlbums(next)
    return next
  })

  return newAlbum
}

export function updateAlbum(id: string, data: { name?: string; description?: string | null; coverPhotoId?: string | null }) {
  albums.update((prev) => {
    const next = prev.map((a) => {
      if (a.id !== id) return a
      return {
        ...a,
        name: data.name ?? a.name,
        description: data.description !== undefined ? data.description : a.description,
        cover_photo_id: data.coverPhotoId !== undefined ? data.coverPhotoId : a.cover_photo_id,
        updated_at: new Date().toISOString(),
      }
    })
    saveAlbums(next)
    return next
  })
}

export function deleteAlbum(id: string) {
  albums.update((prev) => {
    const next = prev.filter((a) => a.id !== id)
    saveAlbums(next)
    return next
  })
}


