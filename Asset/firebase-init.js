import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";

import {
  getMessaging,
  getToken,
  onMessage,
  isSupported
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-messaging.js";

import {
  getFirestore,
  doc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

console.log("Firebase init jalan");

const firebaseConfig = {
  apiKey: "AIzaSyCj_KSdwjSZy3v2D1Wry1VDxBlFTS4d518",
  authDomain: "zedkalkulator.firebaseapp.com",
  projectId: "zedkalkulator",
  storageBucket: "zedkalkulator.firebasestorage.app",
  messagingSenderId: "224764172",
  appId: "1:224764172:web:559f67b313bd782dba2929",
  measurementId: "G-WEY9ZV12D1"
};

const VAPID_KEY = "BEJ4JTcnkkQDPZRSaoOWmde04kLDHRv7XfQXyr0LZU3VPFAyWMX_-nT6dlp17HlT_CFycmGvZBYJJbYl37_ju0A";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const notifBtn = document.getElementById("notifBtn");

let messaging = null;

function updateTombolNotifikasi() {
  if (!notifBtn) return;

  if (!("Notification" in window)) {
    notifBtn.classList.add("hidden");
    return;
  }

  if (Notification.permission === "denied") {
    notifBtn.classList.remove("hidden");
    notifBtn.disabled = true;
    notifBtn.textContent = "Notifikasi Diblokir";
    return;
  }

  if (Notification.permission === "granted") {
    notifBtn.classList.remove("hidden");
    notifBtn.disabled = false;
    notifBtn.textContent = "Perbarui Token Notifikasi";
    return;
  }

  notifBtn.classList.remove("hidden");
  notifBtn.disabled = false;
  notifBtn.textContent = "Aktifkan Notifikasi";
}

async function aktifkanNotifikasi() {
  if (!notifBtn) return;

  try {
    notifBtn.disabled = true;
    notifBtn.textContent = "Memproses...";

    if (!("serviceWorker" in navigator)) {
      alert("Browser tidak mendukung Service Worker.");
      return;
    }

    if (!("Notification" in window)) {
      alert("Browser tidak mendukung notifikasi.");
      return;
    }

    if (!window.isSecureContext) {
      alert("Notifikasi hanya bisa aktif di HTTPS.");
      return;
    }

    const supported = await isSupported();

    if (!supported) {
      alert("Browser ini tidak mendukung Firebase Cloud Messaging.");
      return;
    }

    if (!messaging) {
      messaging = getMessaging(app);
    }

    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      alert("Izin notifikasi belum diberikan.");
      return;
    }

    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js", {
      scope: "/"
    });

    await navigator.serviceWorker.ready;

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration
    });

    if (!token) {
      alert("Token FCM tidak ditemukan.");
      return;
    }

    console.log("FCM Token:", token);

    await setDoc(doc(db, "fcmTokens", token), {
      token: token,
      userAgent: navigator.userAgent,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });

    alert("Notifikasi berhasil diaktifkan.");

  } catch (error) {
    console.error("Gagal aktifkan notifikasi:", error);
    alert("Gagal: " + error.message);
  } finally {
    updateTombolNotifikasi();

    if (notifBtn && Notification.permission !== "denied") {
      notifBtn.disabled = false;
    }
  }
}

async function initNotifikasi() {
  if (!notifBtn) return;

  updateTombolNotifikasi();

  notifBtn.addEventListener("click", aktifkanNotifikasi);

  try {
    const supported = await isSupported();

    if (!supported) {
      console.log("FCM tidak didukung di browser ini.");
      return;
    }

    messaging = getMessaging(app);

    onMessage(messaging, (payload) => {
      console.log("Notifikasi diterima saat aplikasi terbuka:", payload);

      const title = payload.notification?.title || "ZED Kalkulator";
      const body = payload.notification?.body || "Ada notifikasi baru.";

      if (Notification.permission === "granted") {
        new Notification(title, {
          body: body,
          icon: "/192x192.png"
        });
      }
    });

  } catch (error) {
    console.error("Gagal init FCM:", error);
  }
}

initNotifikasi();
