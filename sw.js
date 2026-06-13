const CACHE_NAME = "zedkalkulator-v3";

const FILES_TO_CACHE = [
  "/",
  "/index.html",
  "/infus.html",
  "/insulin.html",
  "/anestesi.html",
  "/kalkulatorpengenceranobat.html",
  "/asidosis.html",
  "/kalkulatormanual.html",
  "/spmanual.html",
  "/komunitas.html",
  "/profil.html",
  "/about.html",
  "/manifest.json",
  "/192x192.png",
  "/512x512.png",
  "/Asset/Archicoco.otf",
  "/Asset/Perdarahan.svg",
  "/Asset/SP.svg",
  "/Asset/SPnoBB.svg",
  "/Asset/appgabungan.js",
  "/Asset/appgabunganheparin.js",
  "/Asset/appindex.js",
  "/Asset/appindexnobb.js",
  "/Asset/calendar.svg",
  "/Asset/firebase-init.js",
  "/Asset/infus.svg",
  "/Asset/insulin.svg",
  "/Asset/komunitas.css",
  "/Asset/komunitas.js",
  "/Asset/pengenceran.js",
  "/Asset/profil.js",
  "/Asset/swipe.css",
  "/Asset/swipe.js",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES_TO_CACHE))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Stale While Revalidate
self.addEventListener("fetch", (event) => {
  if (event.request.url.includes("firebase") ||
      event.request.url.includes("firestore") ||
      event.request.url.includes("googleapis")) {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cached) => {
        const fetchPromise = fetch(event.request).then((response) => {
          if (response.ok) cache.put(event.request, response.clone());
          return response;
        }).catch(() => null);

        return cached || fetchPromise;
      });
    })
  );
});