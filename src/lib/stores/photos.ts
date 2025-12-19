import { writable } from 'svelte/store'

export type Photo = {
  id: number
  date: string
  src: string
  alt: string
  width?: number
  height?: number
  isUploaded?: boolean
  fileSize?: number
}

const DB_NAME = 'PhotoGalleryDB'
const DB_VERSION = 1
const STORE_NAME = 'photos'

let db: IDBDatabase | null = null

function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db)
      return
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => {
      reject(request.error ?? new Error('Failed to open IndexedDB'))
    }

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result

      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const photoStore = database.createObjectStore(STORE_NAME, { keyPath: 'id' })
        photoStore.createIndex('dateIndex', 'date', { unique: false })
      }
    }

    request.onsuccess = () => {
      db = request.result
      resolve(db as IDBDatabase)
    }
  })
}

async function loadPhotosFromDB(): Promise<Photo[]> {
  try {
    const database = await initDB()
    return await new Promise((resolve, reject) => {
      const tx = database.transaction(STORE_NAME, 'readonly')
      const store = tx.objectStore(STORE_NAME)
      const req = store.getAll()
      req.onerror = () => reject(new Error('Failed to load photos'))
      req.onsuccess = () => resolve(req.result as Photo[])
    })
  } catch (err) {
    console.error('Error loading photos from IndexedDB:', err)
    return []
  }
}

async function savePhotoDB(photo: Photo): Promise<void> {
  const database = await initDB()
  await new Promise<void>((resolve, reject) => {
    const tx = database.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const req = store.add(photo)
    req.onerror = () => reject(new Error('Failed to save photo'))
    req.onsuccess = () => resolve()
  })
}

async function deletePhotoDB(id: number): Promise<void> {
  const database = await initDB()
  await new Promise<void>((resolve, reject) => {
    const tx = database.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const req = store.delete(id)
    req.onerror = () => reject(new Error('Failed to delete photo'))
    req.onsuccess = () => resolve()
  })
}

async function clearPhotosDB(): Promise<void> {
  const database = await initDB()
  await new Promise<void>((resolve, reject) => {
    const tx = database.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const req = store.clear()
    req.onerror = () => reject(new Error('Failed to clear photos'))
    req.onsuccess = () => resolve()
  })
}

export const uploadedPhotos = writable<Photo[]>([])
const uploadProgress = writable(0)
const isInitialized = writable(false)

if (typeof window !== 'undefined') {
  // initial load
  loadPhotosFromDB().then((photos) => {
    uploadedPhotos.set(photos)
    isInitialized.set(true)
  })
}

async function uploadPhoto(file: File): Promise<Photo> {
  return new Promise((resolve, reject) => {
    const fileSizeMB = file.size / (1024 * 1024)
    if (fileSizeMB > 500) {
      reject(new Error(`File size (${fileSizeMB.toFixed(2)}MB) exceeds maximum allowed size of 500MB`))
      return
    }

    const reader = new FileReader()

    reader.onprogress = (e) => {
      if (e.lengthComputable) {
        const progress = (e.loaded / e.total) * 100
        uploadProgress.set(progress)
      }
    }

    reader.onload = (e) => {
      const result = e.target?.result as string
      const img = new Image()
      img.onload = async () => {
        const newPhoto: Photo = {
          id: Date.now() + Math.random(),
          date: 'Today',
          src: result,
          alt: file.name,
          width: img.width,
          height: img.height,
          fileSize: file.size,
          isUploaded: true,
        }

        try {
          uploadedPhotos.update((prev) => [newPhoto, ...prev])
          try {
            await savePhotoDB(newPhoto)
          } catch (err) {
            uploadedPhotos.update((prev) => prev.filter((p) => p.id !== newPhoto.id))
            throw err
          }
          uploadProgress.set(0)
          resolve(newPhoto)
        } catch (err) {
          uploadProgress.set(0)
          reject(err)
        }
      }

      img.onerror = () => {
        uploadProgress.set(0)
        reject(new Error('Failed to load image'))
      }

      img.src = result
    }

    reader.onerror = () => {
      uploadProgress.set(0)
      reject(new Error('Failed to read file'))
    }

    reader.readAsDataURL(file)
  })
}

async function uploadMultiplePhotos(files: FileList | File[]): Promise<Photo[]> {
  const fileArray = Array.from(files)
  const results: Photo[] = []

  for (let i = 0; i < fileArray.length; i++) {
    const photo = await uploadPhoto(fileArray[i])
    results.push(photo)
    uploadProgress.set(((i + 1) / fileArray.length) * 100)
  }

  uploadProgress.set(0)
  return results
}

async function deletePhoto(id: number): Promise<void> {
  await deletePhotoDB(id)
  uploadedPhotos.update((prev) => prev.filter((p) => p.id !== id))
}

async function clearAllPhotos(): Promise<void> {
  await clearPhotosDB()
  uploadedPhotos.set([])
}

async function reloadFromDB(): Promise<Photo[]> {
  const photos = await loadPhotosFromDB()
  uploadedPhotos.set(photos)
  return photos
}

export const photosStore = {
  uploadedPhotos,
  uploadProgress,
  isInitialized,
  uploadPhoto,
  uploadMultiplePhotos,
  deletePhoto,
  clearAllPhotos,
  reloadFromDB,
}


