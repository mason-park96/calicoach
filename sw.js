const CACHE = 'calicoach-shell-v1.4.1-media-11';
const FILES = ['./','./index.html','./styles.css','./app.js','./video-catalog.js','./source-candidates.js','./coach-engine.js','./exercise-guides.js','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png','./icons/apple-touch-icon.png','./media/bird.gif','./media/bridge.gif','./media/chairsquat.gif','./media/clam.gif','./media/closepush.gif','./media/cool1.gif','./media/cool2.gif','./media/dead.gif','./media/hipabduct.gif','./media/incline.gif','./media/knee.gif','./media/plank.gif','./media/prep1.gif','./media/prep2.gif','./media/prep3.gif','./media/prep4.gif','./media/push.gif','./media/reverse.gif','./media/sideleft.gif','./media/sideright.gif','./media/singlebridge.gif','./media/snowangel.gif','./media/split.gif','./media/squat.gif','./media/tempo.gif','./media/temposquat.gif','./media/traise.gif','./media/wall.gif','./media/wraise.gif'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('calicoach-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  // Byte-range video requests are best handled by the browser/network; avoid SW 206 cache errors.
  if (/\.mp4$/i.test(new URL(event.request.url).pathname)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const response = await fetch(event.request);
      if (response.ok) cache.put(event.request, response.clone());
      return response;
    } catch (err) {
      const cached = await cache.match(event.request, {ignoreSearch:true});
      if (cached) return cached;
      if (event.request.mode === 'navigate') {
        const fallback = await cache.match(new URL('./index.html', self.registration.scope).href);
        if (fallback) return fallback;
      }
      throw err;
    }
  })());
});
