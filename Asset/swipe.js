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
  // Keyboard tetap muncul ketika pengguna menyentuh kotak pencarian secara langsung.
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

  // Pindahkan peringatan ke bawah kotak hasil dan tepat sebelum tombol print.
  const resultColumn = document.querySelector(".result-column");
  const resultBox = document.getElementById("result");
  const infoCard = resultColumn?.querySelector(".info-card");
  const warningText = infoCard?.querySelector("p");
  const printButton = resultColumn?.querySelector('button[onclick="printResultOnly()"]');
  const printRow = printButton?.parentElement;

  if (resultColumn && resultBox && warningText && printRow) {
    const warningBox = document.createElement("div");
    warningBox.className = "rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 no-print";
    warningText.className = "text-sm leading-6 text-amber-800";
    warningBox.appendChild(warningText);
    resultColumn.insertBefore(warningBox, printRow);
  }
});
