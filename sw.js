// Service Worker: macht die App offline nutzbar.
// Bei jeder neuen Version die Nummer erhöhen, damit Handys das Update laden.
const VERSION = 'vwl-labor-v4';
const DATEIEN = ['./', 'index.html', 'manifest.json', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(DATEIEN)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  // Eigene Seite: zuerst online versuchen (Updates), sonst aus dem Speicher
  if (url.origin === location.origin) {
    e.respondWith(fetch(e.request).then(r => { const k = r.clone(); caches.open(VERSION).then(c => c.put(e.request, k)); return r; })
      .catch(() => caches.match(e.request).then(r => r || caches.match('index.html'))));
    return;
  }
  // Schriftarten von Google: aus dem Speicher, im Hintergrund aktualisieren
  if (url.host.includes('fonts.googleapis.com') || url.host.includes('fonts.gstatic.com')) {
    e.respondWith(caches.open(VERSION).then(c => c.match(e.request).then(hit => {
      const net = fetch(e.request).then(r => { c.put(e.request, r.clone()); return r; }).catch(() => hit);
      return hit || net;
    })));
  }
});
