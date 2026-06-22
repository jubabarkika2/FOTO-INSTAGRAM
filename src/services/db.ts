/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SavedPhoto {
  id: string;
  blob: Blob;
  createdAt: Date;
  title?: string;
  favorite?: boolean;
}

const DB_NAME = "camera_gallery_db";
const STORE_NAME = "photos";
const DB_VERSION = 1;

function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error("Falha ao abrir o banco de dados IndexedDB"));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
  });
}

export const dbService = {
  async savePhoto(photo: Omit<SavedPhoto, "createdAt">): Promise<SavedPhoto> {
    const db = await getDB();
    const fullPhoto: SavedPhoto = {
      ...photo,
      createdAt: new Date(),
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(fullPhoto);

      request.onsuccess = () => {
        resolve(fullPhoto);
      };

      request.onerror = () => {
        reject(new Error("Erro ao salvar foto na galeria"));
      };
    });
  },

  async getAllPhotos(): Promise<SavedPhoto[]> {
    const db = await getDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        // Sort photos by date descending
        const photos = request.result as SavedPhoto[];
        photos.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        resolve(photos);
      };

      request.onerror = () => {
        reject(new Error("Erro ao recuperar fotos da galeria"));
      };
    });
  },

  async deletePhoto(id: string): Promise<void> {
    const db = await getDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error("Erro ao excluir foto da galeria"));
      };
    });
  },

  async toggleFavorite(id: string): Promise<SavedPhoto> {
    const db = await getDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const getReq = store.get(id);

      getReq.onsuccess = () => {
        const photo = getReq.result as SavedPhoto;
        if (!photo) {
          reject(new Error("Foto não encontrada"));
          return;
        }

        photo.favorite = !photo.favorite;
        const putReq = store.put(photo);

        putReq.onsuccess = () => {
          resolve(photo);
        };

        putReq.onerror = () => {
          reject(new Error("Erro ao salvar alteração de favorito"));
        };
      };

      getReq.onerror = () => {
        reject(new Error("Erro ao carregar detalhes da foto"));
      };
    });
  }
};
