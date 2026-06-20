importScripts('https://www.gstatic.com/firebasejs/12.13.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.13.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCj_KSdwjSZy3v2D1Wry1VDxBlFTS4d518",
  authDomain: "zedkalkulator.firebaseapp.com",
  projectId: "zedkalkulator",
  storageBucket: "zedkalkulator.firebasestorage.app",
  messagingSenderId: "224764172",
  appId: "1:224764172:web:559f67b313bd782dba2929"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("FCM background:", payload);

  const title = payload.notification?.title || payload.data?.title || "ZED Kalkulator";

  const options = {
    body: payload.notification?.body || payload.data?.body || "Ada update terbaru.",
    icon: "https://zedkalkulator.site/192x192.png",
    badge: "https://zedkalkulator.site/192x192.png",
    data: {
      url: payload.data?.url || "https://zedkalkulator.site"
    }
  };

  return self.registration.showNotification(title, options);
});
  return self.registration.showNotification(title, options);
});
