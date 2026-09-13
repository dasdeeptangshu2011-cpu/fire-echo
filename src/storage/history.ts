export type HistoryRecord = Record<string, unknown> & { timestamp?: number; source?: string }

const DB_NAME = 'fire-echo-history'
const DB_VERSION = 1
const STORE = 'telemetry'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is unavailable in this browser.'))
      return
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Unable to open local history database.'))
  })
}

export async function loadHistory(limit = 500): Promise<HistoryRecord[]> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const request = tx.objectStore(STORE).getAll()
    request.onsuccess = () => {
      const rows = (request.result as HistoryRecord[]).slice(-limit)
      db.close()
      resolve(rows)
    }
    request.onerror = () => {
      db.close()
      reject(request.error ?? new Error('Unable to read local history.'))
    }
  })
}

export async function appendHistory(records: HistoryRecord[]): Promise<void> {
  if (!records.length) return
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    const store = tx.objectStore(STORE)
    for (const record of records) store.add(record)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error ?? new Error('Unable to write local history.'))
    tx.onabort = () => reject(tx.error ?? new Error('Local history transaction aborted.'))
  })
  db.close()
}

export async function clearHistory(): Promise<void> {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).clear()
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error ?? new Error('Unable to clear local history.'))
  })
  db.close()
}
