const CACHE_NAME = "zedkalkulator-v6";

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
  "/Asset/infus.svg",
  "/Asset/insulin.svg",
  "/Asset/komunitas.css",
  "/Asset/komunitas.js",
  "/Asset/pengenceran.js",
  "/Asset/profil.js",
  "/Asset/swipe.css",
  "/Asset/swipe.js",
];

self.addEventListener("fetch", (event) => {
  const url = event.request.url;

  if (
    url.includes("firebase") ||
    url.includes("firestore") ||
    url.includes("googleapis") ||
    url.includes("/Asset/firebase-init.js") ||
    url.includes("/firebase-messaging-sw.js")
  ) {
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
