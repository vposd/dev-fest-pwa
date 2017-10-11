const store = {
  db: null,

  init() {
    if (store.db) { return Promise.resolve(store.db); }

    return idb.open('devfest', 1, upgradeDb => {
      if (!upgradeDb.objectStoreNames.contains('news')) {
        upgradeDb.createObjectStore('news', { keyPath: 'id' });
      }
    })
      .then(db => store.db = db);
  },

  news(mode) {
    return store.init().then(db => db.transaction('news', mode).objectStore('news'));
  }
}