self.addEventListener('install', e => {
  console.log('[SW] Install');
});

self.addEventListener('activate', e => {
  console.log('[SW] Activate');
});