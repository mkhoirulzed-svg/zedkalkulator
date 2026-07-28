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
  if (diff > 0 && currentIndex < pages.length - 1) slideTo(pages[currentIndex + 1], "left");
  if (diff < 0 && currentIndex > 0) slideTo(pages[currentIndex - 1], "right");
}

function slideTo(url, direction) {
  isAnimating = true;
  const iframe = document.createElement("iframe");
  iframe.src = url;
  iframe.className = "page-slide";
  iframe.style.border = "none";
  iframe.classList.add(direction === "left" ? "slide-in-right" : "slide-in-left");
  document.body.appendChild(iframe);
  requestAnimationFrame(() => {
    iframe.classList.remove("slide-in-right", "slide-in-left");
    iframe.classList.add("slide-center");
    document.body.classList.add(direction === "left" ? "slide-out-left" : "slide-out-right");
  });
  setTimeout(() => { window.location.href = url; }, 300);
}

document.addEventListener("DOMContentLoaded", () => {
  const pageName = location.pathname.split("/").pop() || "index.html";
  if (pageName !== "index.html") return;

  const innerSearch = document.getElementById("innerSearchBox");
  const displayBtn = document.getElementById("drugDisplayBtn");
  const drugOptions = [...document.querySelectorAll(".drug-option")];
  const emptyState = document.getElementById("drugEmptyState");
  const mobileHint = document.getElementById("mobileDrugHint");

  if (innerSearch) {
    const nativeFocus = innerSearch.focus.bind(innerSearch);
    innerSearch.focus = () => {};
    innerSearch.addEventListener("pointerdown", () => { innerSearch.focus = nativeFocus; }, { once: true });
  }

  const showAllMobileDrugs = () => {
    if (!window.matchMedia("(max-width: 899px)").matches) return;
    if (innerSearch?.value.trim()) return;
    drugOptions.forEach(option => option.classList.remove("hidden"));
    emptyState?.classList.add("hidden");
    mobileHint?.classList.add("hidden");
  };

  displayBtn?.addEventListener("click", () => setTimeout(showAllMobileDrugs, 60));
  innerSearch?.addEventListener("input", () => {
    if (!innerSearch.value.trim()) setTimeout(showAllMobileDrugs, 0);
  });

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
      </div>`;
    oldTitle.replaceWith(brand);
  }

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

  const style = document.createElement("style");
  style.textContent = `
    .clinical-warning{display:flex;align-items:flex-start;gap:8px;padding-top:2px}
    .clinical-warning::before{content:"ⓘ";flex:0 0 auto;color:#b45309;font-size:14px;line-height:1.35}
    .result-card-unified{overflow:hidden;border:1px solid #e2e8f0;border-radius:16px;background:#fff;box-shadow:0 12px 35px rgba(15,23,42,.06)}
    .result-card-unified__header{padding:16px 20px;border-bottom:1px solid #e2e8f0;font-weight:800;color:#1e293b;background:#fff}
    .result-card-unified #result{min-height:260px;max-height:520px;overflow:auto;border:0!important;border-radius:0!important;box-shadow:none!important;padding:20px!important}
    .result-card-unified + button{margin-top:12px;min-height:48px}
    .zed-mobile-bottom{display:none}
    @media(min-width:900px){
      .app-shell{width:min(100%,1280px)!important}
      .desktop-grid{grid-template-columns:260px minmax(0,1fr)!important;gap:24px!important}
      .main-grid{grid-template-columns:minmax(420px,.95fr) minmax(420px,1.05fr)!important;align-items:start!important;gap:24px!important}
      .calculator-card,.result-column{height:auto!important;min-height:0!important}
      .calculator-card{overflow:visible!important;padding:28px!important}
      .result-column{display:block!important}
      .field{min-height:48px!important;font-size:15px!important}
      .side-link{font-size:14px!important}
      .quick-nav a{font-size:12px!important;padding-top:12px!important;padding-bottom:12px!important}
      .action-row button{min-height:48px!important;font-size:15px!important}
      footer{margin-top:8px!important}
    }
    @media(max-width:899px){
      body{padding-bottom:92px!important}
      .top-card .quick-nav{display:none!important}
      .top-card>header{min-height:64px!important;padding:10px 14px!important}
      .top-card>header>div:last-child{display:none!important}
      .top-card>header>div:first-child{display:flex!important;width:100%;align-items:center!important}
      .mobile-menu-button{order:2!important;margin-left:auto!important;background:#f1f5f9!important;color:#0f172a!important}
      .top-card>header>div:first-child>.flex{order:1!important}
      .mobile-footer-nav{display:none!important}
      .min-w-0.space-y-4>nav.grid.grid-cols-3{position:sticky;top:0;z-index:25;margin-inline:8px;border-radius:12px!important;padding:3px!important;font-size:12px!important}
      .min-w-0.space-y-4>nav.grid.grid-cols-3 a{padding-block:8px!important}
      .main-grid{display:block!important}
      .calculator-card,.result-column{height:auto!important;min-height:0!important}
      .result-column{margin-top:14px}
      .result-card-unified #result{min-height:210px;max-height:440px}
      #sideMenu{left:auto!important;right:0!important;width:min(88vw,360px)!important;transform:translateX(100%)!important;background:#f8fafc!important}
      #sideMenu.zed-menu-open{transform:translateX(0)!important}
      #sideMenu>div:first-child{padding:16px!important;background:#fff!important}
      #sideMenu nav{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px!important;padding:14px!important}
      #sideMenu .side-link{min-height:94px!important;align-items:flex-start!important;justify-content:flex-end!important;flex-direction:column!important;padding:14px!important;border:1px solid #e2e8f0!important;border-radius:16px!important;background:#fff!important;box-shadow:0 5px 16px rgba(15,23,42,.05);font-size:12px!important;font-weight:700!important;color:#334155!important}
      #sideMenu .side-link::before{content:"▦";display:grid;width:34px;height:34px;place-items:center;margin-bottom:10px;border-radius:10px;background:#e0f2fe;color:#0369a1;font-size:18px}
      #sideMenu .side-link.active{border-color:#99f6e4!important;background:#ecfdf5!important;color:#0f766e!important}
      .zed-mobile-bottom{position:fixed;left:0;right:0;bottom:0;z-index:60;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));align-items:end;padding:8px 8px calc(8px + env(safe-area-inset-bottom));border-top:1px solid #dbe3ee;background:rgba(255,255,255,.97);box-shadow:0 -10px 30px rgba(15,23,42,.12);backdrop-filter:blur(14px)}
      .zed-mobile-bottom a{position:relative;display:flex;min-width:0;min-height:58px;flex-direction:column;align-items:center;justify-content:center;gap:4px;border-radius:14px;color:#64748b;font-size:10px;font-weight:700;text-decoration:none}
      .zed-mobile-bottom a:active{background:#eff6ff}
      .zed-mobile-bottom .nav-icon{font-size:21px;line-height:1}
      .zed-mobile-bottom .home-item{transform:translateY(-13px)}
      .zed-mobile-bottom .home-item .nav-icon{display:grid;width:54px;height:54px;place-items:center;border-radius:50%;background:#2563eb;color:#fff;box-shadow:0 8px 22px rgba(37,99,235,.35);font-size:24px}
      .zed-mobile-bottom .home-item span:last-child{color:#2563eb}
      .zed-mobile-bottom a.active:not(.home-item){color:#2563eb;background:#eff6ff}
    }`;
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

  const sideMenu = document.getElementById("sideMenu");
  const backdrop = document.getElementById("backdrop");
  const menuButton = document.querySelector(".mobile-menu-button");
  const closeButton = sideMenu?.querySelector("button");

  const openRightMenu = () => {
    sideMenu?.classList.add("zed-menu-open");
    backdrop?.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  };
  const closeRightMenu = () => {
    sideMenu?.classList.remove("zed-menu-open");
    backdrop?.classList.add("hidden");
    document.body.style.overflow = "";
  };

  menuButton?.removeAttribute("onclick");
  closeButton?.removeAttribute("onclick");
  backdrop?.removeAttribute("onclick");
  menuButton?.addEventListener("click", openRightMenu);
  closeButton?.addEventListener("click", closeRightMenu);
  backdrop?.addEventListener("click", closeRightMenu);
  document.addEventListener("keydown", event => { if (event.key === "Escape") closeRightMenu(); });

  const mobileBottom = document.createElement("nav");
  mobileBottom.className = "zed-mobile-bottom no-print";
  mobileBottom.setAttribute("aria-label", "Navigasi utama mobile");
  mobileBottom.innerHTML = `
    <a href="infus.html"><span class="nav-icon">▥</span><span>Infus</span></a>
    <a href="insulin.html"><span class="nav-icon">◫</span><span>Actrapid</span></a>
    <a href="index.html" class="home-item active"><span class="nav-icon">⌂</span><span>Home</span></a>
    <a href="komunitas.html"><span class="nav-icon">◌</span><span>Diskusi</span></a>
    <a href="profil.html"><span class="nav-icon">♙</span><span>Akun</span></a>`;
  document.body.appendChild(mobileBottom);
});
