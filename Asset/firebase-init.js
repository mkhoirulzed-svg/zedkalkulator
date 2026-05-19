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

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";

import {
  getMessaging,
  getToken,
  onMessage
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-messaging.js";

import {
  getFirestore,
  doc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

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
const db = getFirestore(app);

async function aktifkanNotifikasi() {
  try {
    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      console.log("Izin notifikasi ditolak");
      return;
    }

    const token = await getToken(messaging, {
      vapidKey: "BEJ4JTcnkkQDPZRSaoOWmde04kLDHRv7XfQXyr0LZU3VPFAyWMX_-nT6dlp17HlT_CFycmGvZBYJJbYl37_ju0A"
    });

    if (!token) {
      console.log("Token tidak ditemukan");
      return;
    }

    await setDoc(doc(db, "fcmTokens", token), {
      token: token,
      userAgent: navigator.userAgent,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    console.log("Token berhasil disimpan:", token);

  } catch (error) {
    console.error("Gagal mengaktifkan notifikasi:", error);
  }
}

aktifkanNotifikasi();

onMessage(messaging, (payload) => {
  console.log("Notifikasi diterima:", payload);
});
