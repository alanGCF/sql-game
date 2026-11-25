import type { AlmacenLocal, GuardadoLocal } from "./guardado";

/**
 * Guardado en IndexedDB (un solo registro: la partida de este navegador). Si IndexedDB no está disponible
 * (modo privado, políticas del navegador) se comporta como vacío: el juego sigue y el servidor guarda.
 */
const BASE = "rastro-en-el-log";
const TABLA = "partida";
const LLAVE = "actual";

function abrir(): Promise<IDBDatabase> {
  return new Promise((resolver, fallar) => {
    if (typeof indexedDB === "undefined") return fallar(new Error("sin IndexedDB"));
    const r = indexedDB.open(BASE, 1);
    r.onupgradeneeded = () => {
      if (!r.result.objectStoreNames.contains(TABLA)) r.result.createObjectStore(TABLA);
    };
    r.onsuccess = () => resolver(r.result);
    r.onerror = () => fallar(r.error ?? new Error("IndexedDB"));
  });
}

function operar<T>(modo: IDBTransactionMode, f: (t: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return abrir().then(
    (db) =>
      new Promise<T>((resolver, fallar) => {
        const tx = db.transaction(TABLA, modo);
        const r = f(tx.objectStore(TABLA));
        tx.oncomplete = () => {
          db.close();
          resolver(r.result);
        };
        tx.onerror = tx.onabort = () => {
          db.close();
          fallar(tx.error ?? new Error("IndexedDB"));
        };
      }),
  );
}

export const almacenIndexedDb: AlmacenLocal = {
  leer: () => operar("readonly", (t) => t.get(LLAVE)),
  escribir: (g: GuardadoLocal) => operar("readwrite", (t) => t.put(g, LLAVE)).then(() => undefined),
  borrar: () => operar("readwrite", (t) => t.delete(LLAVE)).then(() => undefined),
};
