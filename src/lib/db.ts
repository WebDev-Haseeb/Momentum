import { openDB, type IDBPDatabase } from "idb";

const DB_NAME = "momentum";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase> | null = null;

export function getDB() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("IndexedDB unavailable on server"));
  }
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("kv")) {
          db.createObjectStore("kv");
        }
      },
    });
  }
  return dbPromise;
}

export async function kvGet<T>(key: string): Promise<T | undefined> {
  const db = await getDB();
  return (await db.get("kv", key)) as T | undefined;
}

export async function kvSet<T>(key: string, value: T): Promise<void> {
  const db = await getDB();
  await db.put("kv", value, key);
}

export async function kvDel(key: string): Promise<void> {
  const db = await getDB();
  await db.delete("kv", key);
}

export async function kvClear(): Promise<void> {
  const db = await getDB();
  await db.clear("kv");
}

export async function estimateUsage(): Promise<number | null> {
  if (typeof navigator === "undefined" || !navigator.storage?.estimate) return null;
  const est = await navigator.storage.estimate();
  return est.usage ?? null;
}
