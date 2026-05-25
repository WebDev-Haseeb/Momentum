import { kvGet, kvSet } from "@/lib/db";

export function createIDBPersist<T>(key: string) {
  return {
    load: () => kvGet<T>(key),
    save: (value: T) => kvSet<T>(key, value),
  };
}
