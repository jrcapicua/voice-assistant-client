/**
 * audioDB.ts
 * Unifies the persistence of messages (text and audio) in a single "messages" store.
 */

import type { Message } from "../hooks/useConversation";

const DB_NAME = "voice-assistant";
const MESSAGE_STORE = "messages";
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(MESSAGE_STORE)) {
        db.createObjectStore(MESSAGE_STORE, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveMessage(message: Message & { audioBlob?: Blob }) {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(MESSAGE_STORE, "readwrite");
    const store = tx.objectStore(MESSAGE_STORE);
    store.put(message);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getAllMessages(): Promise<(Message & { audioBlob?: Blob })[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(MESSAGE_STORE, "readonly");
    const store = tx.objectStore(MESSAGE_STORE);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function clearAllMessages() {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(MESSAGE_STORE, "readwrite");
    const store = tx.objectStore(MESSAGE_STORE);
    store.clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Deletes a message by id from the "messages" store
 */
export async function deleteMessage(id: string) {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(MESSAGE_STORE, "readwrite");
    const store = tx.objectStore(MESSAGE_STORE);
    store.delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
