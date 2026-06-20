messaging.onBackgroundMessage((payload) => {
  console.log("FCM background:", payload);

  // Kalau payload dari Firebase Console sudah punya notification,
  // jangan tampilkan ulang agar tidak dobel
  if (payload.notification) {
    return;
  }

  const title = payload.data?.title || "ZED Kalkulator";

  const options = {
    body: payload.data?.body || "Ada update terbaru.",
    icon: "https://zedkalkulator.site/192x192.png",
    badge: "https://zedkalkulator.site/192x192.png",
    data: {
      url: payload.data?.url || "https://zedkalkulator.site"
    }
  };

  return self.registration.showNotification(title, options);
});
