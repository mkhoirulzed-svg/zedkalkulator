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

  if (headerLeft && oldTitle && !headerLeft.querySelector('img[alt="Logo ZED Kalkulator"]')) {
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
    warningText.className = "clinical-warning mt-3 text-xs leading-5 text-slate-500 no-print";
    actionRow.insertAdjacentElement("afterend", warningText);
  }

  // Rapikan tampilan desktop: tinggi alami, ukuran lebih nyaman, dan hasil menjadi satu kartu.
  const style = document.createElement("style");
  style.textContent = `
    @media (min-width: 900px) {
      .app-shell { width: min(100%, 1280px) !important; }
      .desktop-grid { grid-template-columns: 260px minmax(0,1fr) !important; gap: 24px !important; }
      .main-grid { grid-template-columns: minmax(420px,.95fr) minmax(420px,1.05fr) !important; align-items: start !important; gap: 24px !important; }
      .calculator-card, .result-column { height: auto !important; min-height: 0 !important; }
      .calculator-card { overflow: visible !important; padding: 28px !important; }
      .result-column { display: block !important; }
      .field { min-height: 48px !important; font-size: 15px !important; }
      .side-link { font-size: 14px !important; }
      .quick-nav a { font-size: 12px !important; padding-top: 12px !important; padding-bottom: 12px !important; }
      .action-row button { min-height: 48px !important; font-size: 15px !important; }
      footer { margin-top: 8px !important; }
    }
    .clinical-warning {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      padding-top: 2px;
    }
    .clinical-warning::before {
      content: "ⓘ";
      flex: 0 0 auto;
      color: #b45309;
      font-size: 14px;
      line-height: 1.35;
    }
    .result-card-unified {
      overflow: hidden;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      background: #fff;
      box-shadow: 0 12px 35px rgba(15,23,42,.06);
    }
    .result-card-unified__header {
      padding: 16px 20px;
      border-bottom: 1px solid #e2e8f0;
      font-weight: 800;
      color: #1e293b;
      background: #fff;
    }
    .result-card-unified #result {
      min-height: 260px;
      max-height: 520px;
      overflow: auto;
      border: 0 !important;
      border-radius: 0 !important;
      box-shadow: none !important;
      padding: 20px !important;
    }
    .result-card-unified + button {
      margin-top: 12px;
      min-height: 48px;
    }
  `;
  document.head.appendChild(style);

  const infoCard = resultColumn?.querySelector(".info-card");
  const resultBox = document.getElementById("result");
  const printButton = resultColumn?.querySelector('button[onclick="printResultOnly()"]');

  if (resultColumn && infoCard && resultBox && !resultColumn.querySelector(".result-card-unified")) {
    const unifiedCard = document.createElement("section");
    unifiedCard.className = "result-card-unified";

    const unifiedHeader = document.createElement("div");
    unifiedHeader.className = "result-card-unified__header";
    unifiedHeader.textContent = infoCard.textContent.trim() || "Hasil perhitungan";

    unifiedCard.appendChild(unifiedHeader);
    unifiedCard.appendChild(resultBox);
    resultColumn.insertBefore(unifiedCard, printButton || null);
    infoCard.remove();
  }
});
