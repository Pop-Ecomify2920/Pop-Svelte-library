export type AlbumPhoto = {
  albumId: string
  photoId: number
  addedAt: string
}

const STORAGE_KEY = 'album_photos'

function loadAll(): AlbumPhoto[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as AlbumPhoto[]) : []
  } catch (e) {
    console.error('Failed to load album photos', e)
    return []
  }
}

function saveAll(list: AlbumPhoto[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch (e) {
    console.error('Failed to save album photos', e)
  }
}

export function getAlbumPhotos(albumId: string): number[] {
  return loadAll()
    .filter((ap) => ap.albumId === albumId)
    .map((ap) => ap.photoId)
}

export function addPhotosToAlbum(albumId: string, photoIds: number[]) {
  const existing = loadAll()
  const now = new Date().toISOString()
  const filtered = existing.filter((ap) => ap.albumId !== albumId)
  const newItems: AlbumPhoto[] = photoIds.map((photoId) => ({ albumId, photoId, addedAt: now }))
  saveAll([...filtered, ...newItems])
}

export function removePhotoFromAlbum(albumId: string, photoId: number) {
  const existing = loadAll()
  saveAll(existing.filter((ap) => !(ap.albumId === albumId && ap.photoId === photoId)))
}

export function removeAllPhotosFromAlbum(albumId: string) {
  const existing = loadAll()
  saveAll(existing.filter((ap) => ap.albumId !== albumId))
}

export function getPhotoCount(albumId: string) {
  return getAlbumPhotos(albumId).length
}


