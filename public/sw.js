importScripts('./scripts/idb-promised.js');
importScripts('./scripts/store.js');

const filesToCache = [
  '.',
  'sw.js',
  'manifest.json',
  'index.html',  
  'scripts/app.js',
  'images/icon.png',
  'scripts/store.js',
  'scripts/idb-promised.js',
  'images/favicon-16x16.png',
  'images/favicon-32x32.png',
  'images/ic_add_white_24px.svg',
  'images/icon.png',
  'images/safari-pinned-tab.svg',
  'styles/style.css',
  'https://fonts.googleapis.com/css?family=Roboto:400,500',
  'https://fonts.gstatic.com/s/roboto/v16/oMMgfZMQthOryQo9n22dcuvvDin1pK8aKteLpeZ5c0A.woff2',
  'https://fonts.gstatic.com/s/roboto/v16/RxZJdnzeo3R5zSexge8UUZBw1xU1rKptJj_0jans920.woff2'
];

const cacheName = 'cache-' + Number(new Date);

self.addEventListener('install', e => {
  console.log('[SW] Install');
  e.waitUntil(
    caches.open(cacheName).then(cache => {
      console.log('[SW] Caching app shell');
      return cache.addAll(filesToCache);
    })
  );
});

self.addEventListener('activate', e => {
  console.log('[SW] Activate');
  e.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(keyList.map(key => {
        if (key !== cacheName) {
          console.log('[SW] Removing old cache', key);
          return caches.delete(key);
        }
      }));
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', e => {
  const isApi = (new URL(e.request.url).pathname.match(/\/api\//g) || []).length > 0;
  if (e.request.method !== 'GET' || isApi) {
    return;
  }
  console.log('[SW] Fetch', e.request.url);  
  e.respondWith(
    caches.match(e.request).then(response => {
      return response || fetch(e.request);
    })
  );
});

self.addEventListener('sync', e => {
  console.log('[SW] Sync event', { e });
  if (e.tag === 'outbox') {
    store.outbox('readonly')
      .then(outboxStore => outboxStore.getAll())
      .then(newsItems => {
        return Promise.all(
          newsItems.map(newsItem => {
            const headers = new Headers({ 'Content-Type': 'application/json' });        
            const body = JSON.stringify(newsItem);
            return fetch('/api/add', { method: 'POST', headers, body })
              .then(response => response.json())
              .then(data => {
                if (data.success) {
                  store.outbox('readwrite').then(outboxStore => outboxStore.delete(newsItem.id));
                }
              })
          })
        );
      })
    .catch(e => console.error(e));
  }
});