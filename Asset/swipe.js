const pages = [
  "index.html",
  "infus.html",
  "insulin.html",
  "kalkulatorpengenceranobat.html"
];

const currentPage = location.pathname.split("/").pop();
const currentIndex = pages.indexOf(currentPage);

let startX = 0;
let endX = 0;
let isAnimating = false;

document.addEventListener("touchstart", e => {
  startX = e.touches[0].clientX;
}, { passive: true });

document.addEventListener("touchend", e => {
  endX = e.changedTouches[0].clientX;
  handleSwipe();
}, { passive: true });

function handleSwipe() {
  if (isAnimating) return;

  const diff = startX - endX;
  const threshold = 80;

  if (Math.abs(diff) < threshold) return;

  if (diff > 0 && currentIndex < pages.length - 1) {
    slideTo(pages[currentIndex + 1], "left");
  }

  if (diff < 0 && currentIndex > 0) {
    slideTo(pages[currentIndex - 1], "right");
  }
}

function slideTo(url, direction) {
  isAnimating = true;

  const iframe = document.createElement("iframe");
  iframe.src = url;
  iframe.className = "page-slide";
  iframe.style.border = "none";

  iframe.classList.add(
    direction === "left" ? "slide-in-right" : "slide-in-left"
  );

  document.body.appendChild(iframe);

  requestAnimationFrame(() => {
    iframe.classList.remove("slide-in-right", "slide-in-left");
    iframe.classList.add("slide-center");

    document.body.classList.add(
      direction === "left" ? "slide-out-left" : "slide-out-right"
    );
  });

  setTimeout(() => {
    window.location.href = url;
  }, 300);
}

// Penyesuaian khusus halaman Syringe Pump versi pengembangan.
document.addEventListener("DOMContentLoaded", () => {
  const pageName = location.pathname.split("/").pop() || "index.html";
  if (pageName !== "index.html") return;

  const innerSearch = document.getElementById("innerSearchBox");
  const displayBtn = document.getElementById("drugDisplayBtn");
  const drugOptions = [...document.querySelectorAll(".drug-option")];
  const emptyState = document.getElementById("drugEmptyState");
  const mobileHint = document.getElementById("mobileDrugHint");

  // Cegah keyboard muncul hanya karena dropdown dibuka.
  // Keyboard tetap muncul saat kotak pencarian disentuh langsung.
  if (innerSearch) {
    const nativeFocus = innerSearch.focus.bind(innerSearch);
    innerSearch.focus = () => {};
    innerSearch.addEventListener("pointerdown", () => {
      innerSearch.focus = nativeFocus;
    }, { once: true });
  }

  const showAllMobileDrugs = () => {
    if (!window.matchMedia("(max-width: 899px)").matches) return;
    if (innerSearch?.value.trim()) return;
    drugOptions.forEach(option => option.classList.remove("hidden"));
    emptyState?.classList.add("hidden");
    mobileHint?.classList.add("hidden");
  };

  displayBtn?.addEventListener("click", () => {
    setTimeout(showAllMobileDrugs, 60);
  });

  innerSearch?.addEventListener("input", () => {
    if (!innerSearch.value.trim()) setTimeout(showAllMobileDrugs, 0);
  });

  // Kembalikan logo dan judul ZED Kalkulator pada header utama.
  // Sidebar Menu utama sengaja tidak disentuh.
  const topHeader = document.querySelector(".top-card > header");
  const headerLeft = topHeader?.querySelector(":scope > div:first-child");
  const oldTitle = headerLeft?.querySelector("p");

  if (headerLeft && oldTitle) {
    const brand = document.createElement("div");
    brand.className = "flex min-w-0 items-center gap-2";
    brand.innerHTML = `
      <img src="192x192.png" class="h-9 w-9 shrink-0 rounded-lg" alt="Logo ZED Kalkulator">
      <div class="min-w-0">
        <p class="truncate text-sm font-bold text-slate-800">ZED Kalkulator</p>
        <p class="hidden text-xs text-slate-500 sm:block">Perhitungan klinis dalam satu aplikasi</p>
      </div>
    `;
    oldTitle.replaceWith(brand);
  }

  // Pindahkan peringatan ke dalam kotak Syringe Pump, tepat di bawah tombol Hitung.
  const resultColumn = document.querySelector(".result-column");
  const calculatorForm = document.getElementById("mainForm");
  const actionRow = calculatorForm?.querySelector(".action-row");
  const warningText = [...(resultColumn?.querySelectorAll("p") || [])].find(p =>
    p.textContent.includes("Periksa kembali nama obat")
  );

  if (calculatorForm && actionRow && warningText) {
    warningText.className = "mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800 no-print";
    actionRow.insertAdjacentElement("afterend", warningText);
  }
});