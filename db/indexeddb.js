const DB_NAME = 'PrivateMessengerDB';
const DB_VERSION = 1;
let db = null;

function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (e) => reject("Database failed to open: " + e.target.errorCode);
        request.onsuccess = (e) => {
            db = e.target.result;
            resolve(db);
        };

        request.onupgradeneeded = (e) => {
            let database = e.target.result;

            if (!database.objectStoreNames.contains('users')) {
                database.createObjectStore('users', { keyPath: 'userId' });
            }
            if (!database.objectStoreNames.contains('messages')) {
                let msgStore = database.createObjectStore('messages', { keyPath: 'msgId' });
                msgStore.createIndex('chatId', 'chatId', { unique: false });
                msgStore.createIndex('timestamp', 'timestamp', { unique: false });
            }
            if (!database.objectStoreNames.contains('calls')) {
                database.createObjectStore('calls', { keyPath: 'callId' });
            }
            if (!database.objectStoreNames.contains('media')) {
                database.createObjectStore('media', { keyPath: 'mediaId' });
            }
            if (!database.objectStoreNames.contains('settings')) {
                database.createObjectStore('settings', { keyPath: 'key' });
            }
            if (!database.objectStoreNames.contains('stickers')) {
                database.createObjectStore('stickers', { keyPath: 'id' });
            }
        };
    });
}

function writeData(storeName, data) {
    return new Promise((resolve, reject) => {
        if (!db) return reject("DB not initialized");
        let tx = db.transaction([storeName], "readwrite");
        let store = tx.objectStore(storeName);
        let req = store.put(data);
        req.onsuccess = () => resolve(true);
        req.onerror = () => reject(req.error);
    });
}

function readData(storeName, key) {
    return new Promise((resolve, reject) => {
        if (!db) return reject("DB not initialized");
        let tx = db.transaction([storeName], "readonly");
        let store = tx.objectStore(storeName);
        let req = store.get(key);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

function readAllData(storeName) {
    return new Promise((resolve, reject) => {
        if (!db) return reject("DB not initialized");
        let tx = db.transaction([storeName], "readonly");
        let store = tx.objectStore(storeName);
        let req = store.getAll();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

function deleteData(storeName, key) {
    return new Promise((resolve, reject) => {
        if (!db) return reject("DB not initialized");
        let tx = db.transaction([storeName], "readwrite");
        let store = tx.objectStore(storeName);
        let req = store.delete(key);
        req.onsuccess = () => resolve(true);
        req.onerror = () => reject(req.error);
    });
}

function queryMessages(chatId) {
    return new Promise((resolve, reject) => {
        if (!db) return reject("DB not initialized");
        let tx = db.transaction(['messages'], "readonly");
        let store = tx.objectStore('messages');
        let index = store.index('chatId');
        let req = index.getAll(chatId);
        req.onsuccess = () => {
            let sorted = req.result.sort((a,b) => a.timestamp - b.timestamp);
            resolve(sorted);
        };
        req.onerror = () => reject(req.error);
    });
      }
