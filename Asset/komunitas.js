import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";

import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  doc,
  updateDoc,
  increment
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

//firestore

const firebaseConfig = {
  apiKey: "AIzaSyDzL1TQvSe622JvmJzbjx0JqlPlhIetHUU",
  authDomain: "zedkomunitas.firebaseapp.com",
  projectId: "zedkomunitas",
  storageBucket: "zedkomunitas.firebasestorage.app",
  messagingSenderId: "571357898541",
  appId: "1:571357898541:web:63ec4b51c1ce3c452655a4",
  measurementId: "G-BLWCMQ6TYN"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

let currentUser = null;

window.loginGoogle = async function () {
  await signInWithPopup(auth, provider);
};

window.logoutGoogle = async function () {
  await signOut(auth);
};

onAuthStateChanged(auth, user => {
  currentUser = user;

  const loginBtn = document.getElementById("loginBtn");
  const userInfo = document.getElementById("userInfo");

  if (user) {
    loginBtn.classList.add("hidden");
    userInfo.classList.remove("hidden");
    userInfo.classList.add("flex");

    document.getElementById("userName").innerText = user.displayName || "Pengguna ZED";
    document.getElementById("userEmail").innerText = user.email || "";
  } else {
    loginBtn.classList.remove("hidden");
    userInfo.classList.add("hidden");
    userInfo.classList.remove("flex");
  }
});

const defaultCategories = [
  "Bebas",
  "EKG",
  "Obat",
  "Stroke",
  "Cerita Jaga"
];

let categories = [];
let posts = [];
let currentFilter = "Semua";

window.toggleMenu = function () {
  document.getElementById("sideMenu").classList.toggle("-translate-x-full");
  document.getElementById("backdrop").classList.toggle("hidden");
};

async function seedDefaultCategories() {
  const snap = await getDocs(collection(db, "komunitas_categories"));

  if (!snap.empty) return;

  for (const cat of defaultCategories) {
    await addDoc(collection(db, "komunitas_categories"), {
      name: cat,
      createdAt: serverTimestamp()
    });
  }
}

function listenCategories() {
  const q = query(
    collection(db, "komunitas_categories"),
    orderBy("name", "asc")
  );

  onSnapshot(q, snapshot => {
    categories = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    renderCategoryOptions();
    renderCategoryTabs();
  }, error => {
    console.error("Error kategori:", error);
    document.getElementById("loadingText").innerText =
      "Gagal memuat kategori. Cek Firestore Rules.";
  });
}

function listenPosts() {
  const q = query(
    collection(db, "komunitas_posts"),
    orderBy("createdAt", "desc")
  );

  onSnapshot(q, snapshot => {
    posts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    document.getElementById("loadingText").classList.add("hidden");
    renderPosts();
  }, error => {
    console.error("Error postingan:", error);
    document.getElementById("loadingText").innerText =
      "Gagal memuat postingan. Cek Firestore Rules.";
  });
}

function renderCategoryOptions() {
  const select = document.getElementById("categoryInput");
  select.innerHTML = "";

  categories.forEach(cat => {
    select.innerHTML += `
      <option value="${escapeHtml(cat.name)}">
        ${escapeHtml(cat.name)}
      </option>
    `;
  });

  select.innerHTML += `
    <option value="Custom">+ Tambah Tema Baru</option>
  `;
}

function renderCategoryTabs() {
  const tabs = document.getElementById("categoryTabs");

  tabs.innerHTML = `
    <button onclick="filterPosts('Semua', this)" class="cat-btn px-4 py-2 rounded-xl whitespace-nowrap ${currentFilter === "Semua" ? "active" : "bg-slate-100"}">
      Semua
    </button>
  `;

  categories.forEach(cat => {
    const activeClass = currentFilter === cat.name ? "active" : "bg-slate-100";

    tabs.innerHTML += `
      <button onclick="filterPosts('${escapeJs(cat.name)}', this)" class="cat-btn ${activeClass} px-4 py-2 rounded-xl whitespace-nowrap">
        ${escapeHtml(cat.name)}
      </button>
    `;
  });
}

window.toggleCustomCategory = function () {
  const selected = document.getElementById("categoryInput").value;
  const input = document.getElementById("customCategoryInput");

  if (selected === "Custom") {
    input.classList.remove("hidden");
  } else {
    input.classList.add("hidden");
    input.value = "";
  }
};

function renderPosts() {
  const feed = document.getElementById("feed");
  feed.innerHTML = "";

  const filteredPosts = currentFilter === "Semua"
    ? posts
    : posts.filter(post => post.category === currentFilter);

  if (filteredPosts.length === 0) {
    feed.innerHTML = `
      <div class="bg-white border border-slate-200 rounded-2xl p-5 text-center text-sm text-slate-500">
        Belum ada diskusi pada kategori ini.
      </div>
    `;
    return;
  }

  filteredPosts.forEach(post => {
    feed.innerHTML += `
      <div class="post-card bg-white shadow-xl border border-slate-200 rounded-2xl p-4 sm:p-5">
        <div class="flex gap-3">
          <div class="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center font-bold text-teal-700">
            ${escapeHtml((post.name || "P").charAt(0))}
          </div>

          <div class="flex-1">
            <div class="flex items-start justify-between gap-2">
              <div>
                <div class="font-semibold text-sm text-slate-800">
                  ${escapeHtml(post.name || "Pengguna ZED")}
                </div>
                <div class="text-[11px] text-slate-500">
                  ${escapeHtml(post.role || "Member")} · ${formatDate(post.createdAt)}
                </div>
              </div>

              <span class="text-[10px] bg-teal-50 text-teal-700 border border-teal-100 px-2 py-1 rounded-full">
                ${escapeHtml(post.category || "Umum")}
              </span>
            </div>

            <p class="text-sm text-slate-700 mt-3 leading-relaxed whitespace-pre-line">
              ${escapeHtml(post.text || "")}
            </p>

            <div class="flex gap-4 mt-4 text-sm text-slate-500">
              <button onclick="likePost('${post.id}')" class="hover:text-red-500">
                ❤️ ${post.likes || 0}
              </button>

              <button class="hover:text-blue-500">
                💬 ${post.comments || 0}
              </button>

              <button onclick="sharePost('${escapeJs(post.text || "")}')" class="hover:text-teal-600">
                ↗️ Bagikan
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  });
}

window.addPost = async function () {
  if (!currentUser) {
    alert("Silakan login Google dulu untuk membuat postingan.");
    return;
  }

  const textInput = document.getElementById("postInput");
  const customInput = document.getElementById("customCategoryInput");
  const text = textInput.value.trim();

  if (!text) {
    alert("Tulis isi diskusi terlebih dahulu.");
    return;
  }

  let category = document.getElementById("categoryInput").value;

  if (category === "Custom") {
    const customCategory = customInput.value.trim();

    if (!customCategory) {
      alert("Masukkan nama tema baru.");
      return;
    }

    category = customCategory;

    const exists = categories.some(
      cat => cat.name.toLowerCase() === category.toLowerCase()
    );

    if (!exists) {
      await addDoc(collection(db, "komunitas_categories"), {
        name: category,
        createdAt: serverTimestamp()
      });
    }
  }

  await addDoc(collection(db, "komunitas_posts"), {
    uid: currentUser.uid,
    name: currentUser.displayName || "Pengguna ZED",
    email: currentUser.email || "",
    photoURL: currentUser.photoURL || "",
    role: "Member",
    category: category,
    text: text,
    likes: 0,
    comments: 0,
    createdAt: serverTimestamp()
  });

  textInput.value = "";
  customInput.value = "";
  customInput.classList.add("hidden");

  currentFilter = "Semua";
  renderCategoryTabs();
};

window.likePost = async function (postId) {
 if (!currentUser) {
  alert("Silakan login Google dulu untuk like.");
  return;
}
  const postRef = doc(db, "komunitas_posts", postId);

  await updateDoc(postRef, {
    likes: increment(1)
  });
};

window.filterPosts = function (category, btn) {
  currentFilter = category;

  document.querySelectorAll(".cat-btn").forEach(el => {
    el.classList.remove("active");
    el.classList.add("bg-slate-100");
  });

  btn.classList.add("active");
  btn.classList.remove("bg-slate-100");

  renderPosts();
};

window.sharePost = async function (text) {
  const shareText = `Diskusi Komunitas ZED:\n\n${text}`;

  if (navigator.share) {
    await navigator.share({
      title: "Komunitas ZED",
      text: shareText,
      url: window.location.href
    });
  } else {
    await navigator.clipboard.writeText(shareText);
    alert("Teks diskusi disalin.");
  }
};

function formatDate(timestamp) {
  if (!timestamp || !timestamp.toDate) return "Baru saja";

  const date = timestamp.toDate();

  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeJs(text) {
  return String(text)
    .replaceAll("\\", "\\\\")
    .replaceAll("'", "\\'")
    .replaceAll('"', '\\"')
    .replaceAll("\n", "\\n")
    .replaceAll("\r", "");
}

async function initKomunitas() {
  try {
    await seedDefaultCategories();
    listenCategories();
    listenPosts();
  } catch (error) {
    console.error("Gagal memuat Komunitas ZED:", error);
    document.getElementById("loadingText").innerText =
      "Gagal memuat komunitas. Cek koneksi Firebase atau Firestore Rules.";
  }
}

initKomunitas();
