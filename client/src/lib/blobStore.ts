/*
Simple IndexedDB helper for storing image blobs and returning blobIds.
Non-blocking minimal API: putBlob(file) -> id, getBlobUrl(id) -> object URL
*/

export async function putBlob(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('ldc-blobs', 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      db.createObjectStore('blobs', { keyPath: 'id' });
    };
    req.onsuccess = () => {
      const db = req.result;
      const tx = db.transaction('blobs', 'readwrite');
      const store = tx.objectStore('blobs');
      const id = `blob_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
      store.put({ id, file });
      tx.oncomplete = () => {
        db.close();
        resolve(id);
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    };
    req.onerror = () => reject(req.error);
  });
}

export async function getBlobUrl(id: string): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('ldc-blobs', 1);
    req.onsuccess = () => {
      const db = req.result;
      const tx = db.transaction('blobs', 'readonly');
      const store = tx.objectStore('blobs');
      const getReq = store.get(id);
      getReq.onsuccess = () => {
        const rec = getReq.result;
        if (rec && rec.file) {
          const url = URL.createObjectURL(rec.file as File);
          resolve(url);
        } else {
          resolve(null);
        }
        db.close();
      };
      getReq.onerror = () => {
        db.close();
        reject(getReq.error);
      };
    };
    req.onerror = () => reject(req.error);
  });
}

export async function deleteBlob(id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('ldc-blobs', 1);
    req.onsuccess = () => {
      const db = req.result;
      const tx = db.transaction('blobs', 'readwrite');
      const store = tx.objectStore('blobs');
      store.delete(id);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    };
    req.onerror = () => reject(req.error);
  });
}
