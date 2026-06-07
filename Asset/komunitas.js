import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  deleteDoc,
  setDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  doc,
  updateDoc,
  increment
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

import {
  db,
  getCurrentUser,
  getCurrentProfile
} from "./profil.js";

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

let visiblePosts = 10;

function isAdmin() {
  const currentUser = getCurrentUser();
  return currentUser && currentUser.email === "mkhoirulzed@gmail.com";
}

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

    document.getElementById("loadingText")?.classList.add("hidden");

    renderPosts();

    posts.forEach(post => {
      listenLikeCount(post.id);
      listenCommentCount(post.id);
    });

  }, error => {
    console.error("Error postingan:", error);
    document.getElementById("loadingText").innerText =
      "Gagal memuat postingan. Cek Firestore Rules.";
  });
}

function renderCategoryOptions() {
  const select = document.getElementById("categoryInput");
  if (!select) return;

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
  if (!tabs) return;

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
  if (!feed) return;

  const currentUser = getCurrentUser();

  feed.innerHTML = "";

  const filteredPosts = currentFilter === "Semua"
    ? posts
    : posts.filter(post => post.category === currentFilter);

  const visibleFilteredPosts =
  filteredPosts.slice(0, visiblePosts);

  if (filteredPosts.length === 0) {
    feed.innerHTML = `
      <div class="bg-white border border-slate-200 rounded-2xl p-5 text-center text-sm text-slate-500">
        Belum ada diskusi pada kategori ini.
      </div>
    `;
    return;
  }

  visibleFilteredPosts.forEach(post => {
    feed.innerHTML += `
      <div class="post-card bg-white shadow-xl border border-slate-200 rounded-2xl p-4 sm:p-5">
        <div class="flex gap-3">
          ${
            post.photoURL
              ? `
                <img
                  src="${escapeHtml(post.photoURL)}"
                  class="w-10 h-10 rounded-full object-cover border border-slate-200"
                  referrerpolicy="no-referrer"
                  alt="Foto profil"
                >
              `
              : `
                <div class="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center font-bold text-teal-700">
                  ${escapeHtml((post.name || "P").charAt(0))}
                </div>
              `          
          }

          <div class="flex-1">
            <div class="flex items-start justify-between gap-2">
              <div>
                <div class="font-semibold text-sm text-slate-800">
                  ${escapeHtml(post.name || "Pengguna")}

                  ${
                    post.email === "mkhoirulzed@gmail.com"
                      ? `<span class="ml-1 text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full">ADMIN</span>`
                      : ""
                  }
                </div>

                <div class="text-[11px] text-slate-500">
                  ${escapeHtml(post.profession || post.role || "Member")}
                  ${post.city ? " · " + escapeHtml(post.city) : ""}
                  · ${formatDate(post.createdAt)}
                </div>
              </div>

              <span class="text-[10px] bg-teal-50 text-teal-700 border border-teal-100 px-2 py-1 rounded-full">
                ${escapeHtml(post.category || "Umum")}
              </span>
            </div>

            ${renderPostText(post)}

            <div class="flex flex-wrap gap-4 mt-4 text-sm text-slate-500">
              <button onclick="likePost('${post.id}')" class="hover:text-red-500">
                ❤️ <span id="like-count-${post.id}">0</span>
              </button>

              <button onclick="toggleComments('${post.id}')" class="hover:text-blue-500">
                💬 <span id="comment-count-${post.id}">0</span>
              </button>

              <button onclick="sharePost('${escapeJs(post.text || "")}')" class="hover:text-teal-600">
                Bagikan
              </button>

              ${
                currentUser &&
                (
                  currentUser.uid === post.uid ||
                  currentUser.email === "mkhoirulzed@gmail.com"
                )
                  ? `
                    <button onclick="editPost('${post.id}')" class="hover:text-amber-600">
                      Edit
                    </button>

                    <button onclick="deletePostConfirm('${post.id}')" class="hover:text-red-600">
                      Hapus
                    </button>
                  `
                  : ""
              }
            </div>

            <div id="comments-${post.id}" class="hidden mt-3">
              <div id="commentList-${post.id}" class="space-y-2 mb-2"></div>

              ${
                currentUser
                  ? `
                    <div class="flex gap-2">
                      <input
                        id="commentInput-${post.id}"
                        class="flex-1 border rounded-xl px-3 py-2 text-sm"
                        placeholder="Tulis komentar..."
                      >
                      <button
                        onclick="addComment('${post.id}')"
                        class="bg-blue-600 text-white px-3 rounded-xl"
                      >
                        Kirim
                      </button>
                    </div>
                  `
                  : ""
              }
            </div>
          </div>
        </div>
      </div>
    `;
  });

  if (filteredPosts.length > visiblePosts) {
  feed.innerHTML += `
    <div class="text-center mt-4">
      <button
        onclick="loadMorePosts()"
        class="px-4 py-2 bg-teal-600 text-white rounded-xl text-sm font-medium"
      >
        Muat Lagi
      </button>
    </div>
  `;
}
}

function renderPostText(post) {
  const fullText = escapeHtml(post.text || "");
  const shortText =
    fullText.length > 250
      ? fullText.substring(0, 250) + "..."
      : fullText;

  return `
    <p
      id="post-text-${post.id}"
      class="text-sm text-slate-700 mt-3 leading-relaxed whitespace-pre-line"
    >
      ${shortText}
    </p>

    ${
      fullText.length > 250
        ? `
          <button
            onclick="togglePostText('${post.id}')"
            class="text-xs text-teal-600 mt-2"
          >
            Lihat selengkapnya
          </button>
        `
        : ""
    }

    <input
      type="hidden"
      id="full-post-${post.id}"
      value="${escapeHtml(post.text || "")}"
    >
  `;
}

window.addPost = async function () {
  const currentUser = getCurrentUser();
  const currentProfile = getCurrentProfile();

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
    name: currentProfile?.name || currentUser.displayName || "Pengguna ZED",
    email: currentUser.email || "",
    photoURL: currentProfile?.photoURL || currentUser.photoURL || "",
    city: currentProfile?.city || "",
    bio: currentProfile?.bio || "",
    profession: currentProfile?.profession || "",
    role: currentProfile?.profession || "Member",
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
  const currentUser = getCurrentUser();

  if (!currentUser) {
    alert("Login dulu");
    return;
  }

  const likeRef = doc(
    db,
    "komunitas_posts",
    postId,
    "likes",
    currentUser.uid
  );

  const snap = await getDoc(likeRef);

  if (snap.exists()) {
    alert("Kamu sudah like postingan ini");
    return;
  }

  await setDoc(likeRef, {
    uid: currentUser.uid,
    createdAt: serverTimestamp()
  });

  await updateDoc(
    doc(db, "komunitas_posts", postId),
    {
      likes: increment(1)
    }
  );
};

window.filterPosts = function (category, btn) {
  visiblePosts = 10;
  currentFilter = category;

  document.querySelectorAll(".cat-btn").forEach(el => {
    el.classList.remove("active");
    el.classList.add("bg-slate-100");
  });

  btn.classList.add("active");
  btn.classList.remove("bg-slate-100");

  renderPosts();
};

window.loadMorePosts = function () {
  visiblePosts += 10;
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

window.togglePostText = function (postId) {
  const textEl = document.getElementById(`post-text-${postId}`);
  const btn = event.target;
  const full = document.getElementById(`full-post-${postId}`).value;

  if (btn.dataset.open === "1") {
    textEl.innerHTML = escapeHtml(full.substring(0, 250)) + "...";
    btn.innerText = "Lihat selengkapnya";
    btn.dataset.open = "0";
  } else {
    textEl.innerHTML = escapeHtml(full);
    btn.innerText = "Sembunyikan";
    btn.dataset.open = "1";
  }
};

window.editPost = async function (postId) {
  const post = posts.find(p => p.id === postId);

  if (!post) return;

  const text = prompt("Edit postingan", post.text);

  if (text === null) return;

  await updateDoc(
    doc(db, "komunitas_posts", postId),
    {
      text: text.trim(),
      updatedAt: serverTimestamp()
    }
  );
};

window.deletePostConfirm = async function (postId) {
  const currentUser = getCurrentUser();
  const post = posts.find(p => p.id === postId);

  if (!post || !currentUser) return;

  const allowed =
    currentUser.uid === post.uid ||
    currentUser.email === "mkhoirulzed@gmail.com";

  if (!allowed) {
    alert("Tidak memiliki izin");
    return;
  }

  if (!confirm("Hapus postingan ini?")) return;

  await deleteDoc(
    doc(db, "komunitas_posts", postId)
  );
};

window.toggleComments = function (postId) {
  const el = document.getElementById(`comments-${postId}`);

  el.classList.toggle("hidden");

  loadComments(postId);
};

window.loadComments = function (postId) {
  const currentUser = getCurrentUser();

  const q = query(
    collection(db, "komunitas_posts", postId, "comments"),
    orderBy("createdAt", "asc")
  );

  onSnapshot(q, snapshot => {
    const target = document.getElementById(`commentList-${postId}`);

    if (!target) return;

    target.innerHTML = "";

    snapshot.forEach(docSnap => {
      const c = docSnap.data();

      const canEdit =
        currentUser &&
        currentUser.uid === c.uid;

      const canDelete =
        currentUser &&
        (
          currentUser.uid === c.uid ||
          currentUser.email === "mkhoirulzed@gmail.com"
        );

      target.innerHTML += `
        <div class="bg-slate-50 rounded-xl p-2 text-sm">
          <div class="flex items-start justify-between gap-2">
            <div class="font-semibold">
              ${escapeHtml(c.name || "Member")}
            </div>

            ${
              canEdit || canDelete
                ? `
                 <div class="flex gap-2 shrink-0">
                    ${
                      canEdit
                        ? `
                          <button
  onclick="editComment('${postId}', '${docSnap.id}')"
  class="px-2 py-1 rounded-lg bg-amber-100 text-amber-700 text-[11px] font-semibold"
>
  Edit
</button>
                        `
                        : ""
                    }

                    ${
                      canDelete
                        ? `
                          <button
  onclick="deleteComment('${postId}', '${docSnap.id}')"
  class="px-2 py-1 rounded-lg bg-red-100 text-red-700 text-[11px] font-semibold"
>
  Hapus
</button>
                        `
                        : ""
                    }
                  </div>
                `
                : ""
            }
          </div>

          <div class="mt-1 whitespace-pre-line">
            ${escapeHtml(c.text)}
          </div>
        </div>
      `;
    });
  });
};

window.editComment = async function (postId, commentId) {
  const currentUser = getCurrentUser();

  if (!currentUser) {
    alert("Login dulu");
    return;
  }

  const ref = doc(
    db,
    "komunitas_posts",
    postId,
    "comments",
    commentId
  );

  const snap = await getDoc(ref);

  if (!snap.exists()) return;

  const comment = snap.data();

  if (comment.uid !== currentUser.uid) {
    alert("Kamu hanya bisa edit komentar sendiri");
    return;
  }

  const newText = prompt("Edit komentar", comment.text || "");

  if (newText === null) return;

  if (!newText.trim()) {
    alert("Komentar tidak boleh kosong");
    return;
  }

  await updateDoc(ref, {
    text: newText.trim(),
    updatedAt: serverTimestamp()
  });
};

window.deleteComment = async function (postId, commentId) {
  const currentUser = getCurrentUser();

  if (!currentUser) {
    alert("Login dulu");
    return;
  }

  const ref = doc(
    db,
    "komunitas_posts",
    postId,
    "comments",
    commentId
  );

  const snap = await getDoc(ref);

  if (!snap.exists()) return;

  const comment = snap.data();

  const allowed =
    comment.uid === currentUser.uid ||
    currentUser.email === "mkhoirulzed@gmail.com";

  if (!allowed) {
    alert("Tidak memiliki izin");
    return;
  }

  if (!confirm("Hapus komentar ini?")) return;

  await deleteDoc(ref);
};


function listenLikeCount(postId) {
  onSnapshot(
    collection(db, "komunitas_posts", postId, "likes"),
    snap => {
      const el = document.getElementById(`like-count-${postId}`);

      if (el) {
        el.textContent = snap.size;
      }
    }
  );
}

function listenCommentCount(postId) {
  onSnapshot(
    collection(db, "komunitas_posts", postId, "comments"),
    snap => {
      const el = document.getElementById(`comment-count-${postId}`);

      if (el) {
        el.textContent = snap.size;
      }
    }
  );
}

window.addComment = async function (postId) {
  const currentUser = getCurrentUser();
  const currentProfile = getCurrentProfile();

  if (!currentUser) return;

  const input = document.getElementById(`commentInput-${postId}`);
  const text = input.value.trim();

  if (!text) return;

  await addDoc(
    collection(db, "komunitas_posts", postId, "comments"),
    {
      uid: currentUser.uid,
      name: currentProfile?.name || currentUser.displayName || "Member",
      photoURL: currentProfile?.photoURL || currentUser.photoURL || "",
      profession: currentProfile?.profession || "Member",
      city: currentProfile?.city || "",
      text: text,
      createdAt: serverTimestamp()
    }
  );

  input.value = "";
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

    const loadingText = document.getElementById("loadingText");

    if (loadingText) {
      loadingText.innerText =
        "Gagal memuat komunitas. Cek koneksi Firebase atau Firestore Rules.";
    }
  }
}

initKomunitas();
