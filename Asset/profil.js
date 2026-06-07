
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
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  collectionGroup,
  getDocs,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

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

export const db = getFirestore(app);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();

let currentUser = null;
let currentProfile = null;

export function getCurrentUser() {
  return currentUser;
}

export function getCurrentProfile() {
  return currentProfile;
}

window.loginGoogle = async function () {
  await signInWithPopup(auth, provider);
};

window.logoutGoogle = async function () {
  await signOut(auth);
};

onAuthStateChanged(auth, async user => {
  currentUser = user;

  const loginBtn = document.getElementById("loginBtn");
  const userInfo = document.getElementById("userInfo");
  const profileBox = document.getElementById("profileBox");

  if (user) {
    loginBtn?.classList.add("hidden");

    if (userInfo) {
      userInfo.classList.remove("hidden");
      userInfo.classList.add("flex");
    }

    const userName = document.getElementById("userName");
    const userEmail = document.getElementById("userEmail");

    if (userName) userName.innerText = user.displayName || "Pengguna";
    if (userEmail) userEmail.innerText = user.email || "";

    profileBox?.classList.remove("hidden");

    await loadProfile();

  } else {
    loginBtn?.classList.remove("hidden");

    if (userInfo) {
      userInfo.classList.add("hidden");
      userInfo.classList.remove("flex");
    }

    profileBox?.classList.add("hidden");

    currentProfile = null;
  }
});

export async function loadProfile() {
  if (!currentUser) return;

  const ref = doc(db, "komunitas_users", currentUser.uid);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    currentProfile = snap.data();
  } else {
    currentProfile = {
      uid: currentUser.uid,
      name: currentUser.displayName || "Pengguna ZED",
      city: "",
      bio: "",
      profession: "",
      email: currentUser.email || "",
      photoURL: currentUser.photoURL || ""
    };
  }
  
const avatar =
  document.getElementById("profileAvatar");

if (avatar) {

  avatar.src =
    currentProfile.photoURL ||
    currentUser.photoURL ||
    "https://ui-avatars.com/api/?name=" +
      encodeURIComponent(currentProfile.name || "Z");
}
  const profileName = document.getElementById("profileName");
  const profileCity = document.getElementById("profileCity");
  const profileProfession = document.getElementById("profileProfession");
  const profileBio = document.getElementById("profileBio");

  if (profileName) profileName.value = currentProfile.name || "";
  if (profileCity) profileCity.value = currentProfile.city || "";
  if (profileProfession) profileProfession.value = currentProfile.profession || "";
  if (profileBio) profileBio.value = currentProfile.bio || "";
}

async function updateUserCommentsProfile(data) {
  const snap = await getDocs(collectionGroup(db, "comments"));

  const tasks = [];

  snap.forEach(docSnap => {
    const comment = docSnap.data();

    if (comment.uid === currentUser.uid) {
      tasks.push(
        updateDoc(docSnap.ref, {
          name: data.name,
          profession: data.profession || "",
          city: data.city || "",
          photoURL: data.photoURL || "",
          updatedProfileAt: serverTimestamp()
        })
      );
    }
  });

  await Promise.all(tasks);
}

window.saveProfile = async function () {
  if (!currentUser) {
    alert("Login dulu");
    return;
  }

  const name = document.getElementById("profileName")?.value.trim() || "";
  const city = document.getElementById("profileCity")?.value.trim() || "";
  const profession = document.getElementById("profileProfession")?.value || "";
  const bio = document.getElementById("profileBio")?.value.trim() || "";

  if (!name) {
    alert("Nama tidak boleh kosong");
    return;
  }

  const data = {
    uid: currentUser.uid,
    name,
    city,
    profession,
    bio,
    email: currentUser.email || "",
    photoURL: currentUser.photoURL || "",
    updatedAt: serverTimestamp()
  };

 await setDoc(
  doc(db, "komunitas_users", currentUser.uid),
  data
);

currentProfile = data;

await updateUserCommentsProfile(data);

alert("Profil berhasil disimpan");
}

window.toggleMenu = function () {
  document.getElementById("sideMenu")?.classList.toggle("-translate-x-full");
  document.getElementById("backdrop")?.classList.toggle("hidden");
};
