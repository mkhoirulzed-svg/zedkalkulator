import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";

import {
  getMessaging,
  getToken,
  onMessage
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-messaging.js";

const firebaseConfig = {
  apiKey: "AIzaSyCj_KSdwjSZy3v2D1Wry1VDxBlFTS4d518",
  authDomain: "zedkalkulator.firebaseapp.com",
  projectId: "zedkalkulator",
  storageBucket: "zedkalkulator.firebasestorage.app",
  messagingSenderId: "224764172",
  appId: "1:224764172:web:559f67b313bd782dba2929",
  measurementId: "G-WEY9ZV12D1"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// Minta izin notifikasi
Notification.requestPermission().then(async (permission) => {

  if (permission === "granted") {

    const token = await getToken(messaging, {
      vapidKey: "BEJ4JTcnkkQDPZRSaoOWmde04kLDHRv7XfQXyr0LZU3VPFAyWMX_-nT6dlp17HlT_CFycmGvZBYJJbYl37_ju0A"
    });

    console.log("TOKEN:", token);

    alert("Notifikasi berhasil diaktifkan!");

  } else {
    alert("Izin notifikasi ditolak");
  }

});

// Saat notif diterima
onMessage(messaging, (payload) => {
  console.log("Pesan diterima:", payload);
});
