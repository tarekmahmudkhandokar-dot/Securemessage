const DB_NAME = "PrivateMessengerDatabase";
const DB_VERSION = 1;
let dbInstance = null;

function connectIndexedDB() {
    return new Promise((resolve, reject) => {
        if (dbInstance) return resolve(dbInstance);
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        
        req.onupgradeneeded = (e) => {
            const db = e.target.result;
            if(!db.objectStoreNames.contains('users')) db.createObjectStore('users', { keyPath: 'phone' });
            if(!db.objectStoreNames.contains('messages')) db.createObjectStore('messages', { keyPath: 'id', autoIncrement: true });
            if(!db.objectStoreNames.contains('calls')) db.createObjectStore('calls', { keyPath: 'id', autoIncrement: true });
            if(!db.objectStoreNames.contains('media')) db.createObjectStore('media', { keyPath: 'id', autoIncrement: true });
            if(!db.objectStoreNames.contains('settings')) db.createObjectStore('settings', { keyPath: 'key' });
            if(!db.objectStoreNames.contains('stickers')) db.createObjectStore('stickers', { keyPath: 'id', autoIncrement: true });
        };
        
        req.onsuccess = (e) => {
            dbInstance = e.target.result;
            resolve(dbInstance);
        };
        req.onerror = (e) => reject(e.target.error);
    });
}
