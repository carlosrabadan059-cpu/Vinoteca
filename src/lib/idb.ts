import { openDB, type IDBPDatabase } from 'idb'
import type { Wine, Tasting, SyncOperation } from '../types'

const DB_NAME = 'vinoteca-offline'
const DB_VERSION = 1

interface VinotecaDB {
  wines_local: Wine
  tastings_local: Tasting
  sync_queue: SyncOperation
}

let _db: IDBPDatabase<VinotecaDB> | null = null

export async function getDB(): Promise<IDBPDatabase<VinotecaDB>> {
  if (_db) return _db
  _db = await openDB<VinotecaDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      db.createObjectStore('wines_local',    { keyPath: 'id' })
      db.createObjectStore('tastings_local', { keyPath: 'id' })
      db.createObjectStore('sync_queue',     { keyPath: 'id' })
    },
  })
  return _db
}

// ── Wines local ───────────────────────────────────────────────────────────────

export async function saveWineLocally(wine: Wine): Promise<void> {
  const db = await getDB()
  await db.put('wines_local', wine)
}

export async function getLocalWines(): Promise<Wine[]> {
  const db = await getDB()
  return db.getAll('wines_local')
}

export async function removeLocalWine(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('wines_local', id)
}

export async function clearLocalWines(): Promise<void> {
  const db = await getDB()
  await db.clear('wines_local')
}

// ── Tastings local ────────────────────────────────────────────────────────────

export async function saveTastingLocally(tasting: Tasting): Promise<void> {
  const db = await getDB()
  await db.put('tastings_local', tasting)
}

export async function getLocalTastings(): Promise<Tasting[]> {
  const db = await getDB()
  return db.getAll('tastings_local')
}

export async function removeLocalTasting(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('tastings_local', id)
}

// ── Sync queue ────────────────────────────────────────────────────────────────

export async function addToQueue(op: SyncOperation): Promise<void> {
  const db = await getDB()
  await db.put('sync_queue', op)
}

export async function getQueue(): Promise<SyncOperation[]> {
  const db = await getDB()
  return db.getAll('sync_queue')
}

export async function removeFromQueue(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('sync_queue', id)
}

export async function updateQueueItem(id: string, retries: number): Promise<void> {
  const db = await getDB()
  const op = await db.get('sync_queue', id)
  if (op) await db.put('sync_queue', { ...op, retries })
}

export async function clearQueue(): Promise<void> {
  const db = await getDB()
  await db.clear('sync_queue')
}

export async function getQueueCount(): Promise<number> {
  const db = await getDB()
  return db.count('sync_queue')
}
