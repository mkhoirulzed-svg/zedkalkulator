const pages = [
  "index.html",
  "infus.html",
  "insulin.html",
  "kalkulatorpengenceranobat.html"
];

const currentPage = location.pathname.split("/").pop() || "index.html";
const currentIndex = pages.indexOf(currentPage);
let startX = 0;
let endX = 0;
let isAnimating = false;

document.addEventListener("touchstart", event => {
  startX = event.touches[0].clientX;
}, { passive: true });

document.addEventListener("touchend", event => {
  endX = event.changedTouches[0].clientX;
  if (document.getElementById("sideMenu")?.classList.contains("zed-menu-open")) return;
  const diff = startX - endX;
  if (isAnimating || Math.abs(diff) < 80) return;
  if (diff > 0 && currentIndex < pages.length - 1) slideTo(pages[currentIndex + 1], "left");
  if (diff < 0 && currentIndex > 0) slideTo(pages[currentIndex - 1], "right");
}, { passive: true });

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
  if (currentPage !== "index.html") return;

  const resultColumn = document.querySelector(".result-column");
  const calculatorForm = document.getElementById("mainForm");
  const resultBox = document.getElementById("result");

  // Metadata satuan eksplisit untuk obat yang tidak menggunakan satuan massa.
  window.ZED_CLINICAL_UNIT_METADATA = Object.freeze({
    Heparin: Object.freeze({
      amountUnit: "IU",
      concentrationUnit: "IU/ml",
      doseUnit: "IU/kgBB/jam",
      rateUnit: "ml/jam"
    })
  });

  // Tambahkan Nicardipin tanpa BB sebagai mode tersendiri.
  if (typeof NO_WEIGHT_DRUGS !== "undefined" && !NO_WEIGHT_DRUGS.includes("Nicardipin_NoBB")) {
    NO_WEIGHT_DRUGS.push("Nicardipin_NoBB");
  }
  if (typeof DRUG_SEARCH_ITEMS !== "undefined" && !DRUG_SEARCH_ITEMS.some(item => item.value === "Nicardipin_NoBB")) {
    DRUG_SEARCH_ITEMS.push({
      value: "Nicardipin_NoBB",
      label: "Nicardipin (tanpa BB)",
      aliases: ["nicardipin tanpa bb", "nicardipine tanpa bb", "cardene tanpa bb"]
    });
  }

  if (typeof setDefaultConcNoBB === "function") {
    const originalSetDefaultConcNoBB = setDefaultConcNoBB;
    setDefaultConcNoBB = function() {
      originalSetDefaultConcNoBB();
      if (selectedDrug() !== "Nicardipin_NoBB") return;

      const wrapper = document.getElementById("concWrapperPPI");
      const label = document.getElementById("ppiLabel");
      const preset = document.getElementById("ppiConc");
      const doseUnit = document.getElementById("doseUnit");
      const doseInput = document.getElementById("doseInput");

      wrapper?.classList.remove("hidden");
      if (label) label.textContent = "Konsentrasi Nicardipin";
      if (doseUnit) doseUnit.textContent = "mg/jam";
      if (doseInput) doseInput.placeholder = "Contoh: 5";
      if (preset) {
        preset.innerHTML = [
          '<option value="200">1 ampul (10 mg/50 ml → 0,2 mg/ml)</option>',
          '<option value="400">2 ampul (20 mg/50 ml → 0,4 mg/ml)</option>',
          '<option value="600">3 ampul (30 mg/50 ml → 0,6 mg/ml)</option>',
          '<option value="800">4 ampul (40 mg/50 ml → 0,8 mg/ml)</option>',
          '<option value="1000">5 ampul (50 mg/50 ml → 1 mg/ml)</option>'
        ].join("");
      }
    };
  }

  if (typeof calculateNoBB === "function") {
    const originalCalculateNoBB = calculateNoBB;
    calculateNoBB = function() {
      if (selectedDrug() !== "Nicardipin_NoBB") {
        originalCalculateNoBB();
        return;
      }

      const result = document.getElementById("result");
      const concentration = getActiveConcentrationNoBB();
      const dose = parseFloat(document.getElementById("doseInput")?.value);

      if (!concentration || !Number.isFinite(concentration)) {
        result.innerHTML = "<p class='text-red-600'>Konsentrasi Nicardipin belum diatur dengan benar.</p>";
        return;
      }
      if (!Number.isFinite(dose) || dose <= 0) {
        result.innerHTML = "<p class='text-red-600'>Masukkan dosis Nicardipin dalam mg/jam.</p>";
        return;
      }

      const mlHour = (dose * 1000) / concentration;
      const preset = document.getElementById("ppiConc");
      const customMode = preset?.classList.contains("hidden");
      const concentrationLabel = customMode
        ? `Custom: ${document.getElementById("ppiCustomDose")?.value || ""} mg / ${document.getElementById("ppiCustomVolume")?.value || ""} ml`
        : (preset?.selectedOptions[0]?.text || "Preset Nicardipin");

      result.innerHTML = `
        <h3 class='font-semibold mb-1'>Nicardipin (tanpa BB)</h3>
        <p class='text-xs'>Dosis: <b>${dose} mg/jam</b></p>
        <p class='text-xs'>Pengenceran: <b>${concentrationLabel}</b></p>
        <p class='text-xs'>Konsentrasi: <b>${(concentration / 1000).toFixed(2)} mg/ml</b></p>
        <hr class='my-2'>
        <div class='rounded-xl bg-blue-50 p-4'>
          <p class='text-xs font-bold uppercase tracking-wider text-blue-600'>Kecepatan syringe pump</p>
          <p class='mt-2 text-2xl font-bold text-blue-700'>${mlHour.toFixed(2)} ml/jam</p>
        </div>
        <p class='mt-3 text-xs leading-5 text-slate-500'>Rumus: dosis mg/jam ÷ konsentrasi mg/ml.</p>`;
    };
  }

  // Pastikan label custom Heparin tidak pernah tampil sebagai mg/ml.
  if (typeof getConcentrationLabelBB === "function") {
    const originalGetConcentrationLabelBB = getConcentrationLabelBB;
    getConcentrationLabelBB = function(drug) {
      if (drug === "Heparin") {
        const presetSelect = document.getElementById("otherPresetSelect");
        if (presetSelect && !presetSelect.classList.contains("hidden")) {
          return presetSelect.selectedOptions[0]?.text || "Preset Heparin";
        }
        const amount = document.getElementById("otherCustomDose")?.value || "";
        const volume = document.getElementById("otherCustomVolume")?.value || "";
        return `Custom: ${amount} IU / ${volume} ml`;
      }
      return originalGetConcentrationLabelBB(drug);
    };
  }

  // Kembalikan pemilih obat seperti index original.
  const currentDisplayBtn = document.getElementById("drugDisplayBtn");
  const drugField = currentDisplayBtn?.closest(".space-y-2") || currentDisplayBtn?.parentElement?.parentElement;

  if (drugField) {
    drugField.className = "space-y-1";
    drugField.innerHTML = `
      <label class="text-sm font-medium text-slate-700">Cari / pilih obat</label>
      <div class="relative">
        <div id="drugDisplayBtn" class="w-full rounded-lg border px-3 py-2 pr-10 shadow-sm text-sm cursor-pointer flex justify-between items-center bg-white focus:ring-2 focus:ring-blue-500">
          <span id="drugDisplayText" class="text-slate-400 truncate">Pilih obat di sini...</span>
          <svg class="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
        </div>
        <input type="hidden" id="drugSearch" value="">
        <button id="clearDrugBtn" type="button" class="absolute right-2 top-1/2 -translate-y-1/2 hidden text-slate-400 hover:text-slate-700 text-lg leading-none px-1 z-20" aria-label="Bersihkan pilihan obat">×</button>
        <div id="drugDropdown" class="absolute z-50 mt-1 w-full bg-white border rounded-xl shadow-lg max-h-72 overflow-y-auto hidden">
          <div class="sticky top-0 z-20 bg-white p-2 border-b border-slate-100">
            <input id="innerSearchBox" type="text" placeholder="Ketik untuk mencari obat..." class="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">
          </div>
          <div class="px-3 py-2 text-xs font-semibold text-slate-500 bg-slate-50 sticky top-[45px] border-b border-slate-100">Dengan Berat Badan</div>
          <button type="button" class="drug-option w-full text-left px-3 py-2 text-sm hover:bg-blue-50" data-value="NE" data-label="Norepinefrin (NE)">Norepinefrin (NE)</button>
          <button type="button" class="drug-option w-full text-left px-3 py-2 text-sm hover:bg-blue-50" data-value="Adrenalin" data-label="Adrenalin">Adrenalin</button>
          <button type="button" class="drug-option w-full text-left px-3 py-2 text-sm hover:bg-blue-50" data-value="Dopamin" data-label="Dopamin">Dopamin</button>
          <button type="button" class="drug-option w-full text-left px-3 py-2 text-sm hover:bg-blue-50" data-value="Dobutamin" data-label="Dobutamin">Dobutamin</button>
          <button type="button" class="drug-option w-full text-left px-3 py-2 text-sm hover:bg-blue-50" data-value="Milrinone" data-label="Milrinone">Milrinone</button>
          <button type="button" class="drug-option w-full text-left px-3 py-2 text-sm hover:bg-blue-50" data-value="Nicardipin" data-label="Nicardipin">Nicardipin</button>
          <button type="button" class="drug-option w-full text-left px-3 py-2 text-sm hover:bg-blue-50" data-value="Herbeser" data-label="Herbeser">Herbeser</button>
          <button type="button" class="drug-option w-full text-left px-3 py-2 text-sm hover:bg-blue-50" data-value="NTG_BB" data-label="NTG (dengan BB)">NTG (dengan BB)</button>
          <button type="button" class="drug-option w-full text-left px-3 py-2 text-sm hover:bg-blue-50" data-value="Heparin" data-label="Heparin">Heparin</button>
          <div class="px-3 py-2 text-xs font-semibold text-slate-500 bg-slate-50 border-t border-b border-slate-100 sticky top-[45px]">Tanpa Berat Badan</div>
          <button type="button" class="drug-option w-full text-left px-3 py-2 text-sm hover:bg-blue-50" data-value="Nicardipin_NoBB" data-label="Nicardipin (tanpa BB)">Nicardipin (tanpa BB)</button>
          <button type="button" class="drug-option w-full text-left px-3 py-2 text-sm hover:bg-blue-50" data-value="NTG" data-label="NTG (tanpa BB)">NTG (tanpa BB)</button>
          <button type="button" class="drug-option w-full text-left px-3 py-2 text-sm hover:bg-blue-50" data-value="PPI" data-label="OMZ / Panto">OMZ / Panto</button>
          <button type="button" class="drug-option w-full text-left px-3 py-2 text-sm hover:bg-blue-50" data-value="Furosemide" data-label="Furosemide">Furosemide</button>
          <button type="button" class="drug-option w-full text-left px-3 py-2 text-sm hover:bg-blue-50" data-value="Lansoprazole" data-label="Lansoprazole">Lansoprazole</button>
          <div id="drugEmptyState" class="hidden px-3 py-3 text-sm text-slate-500">Obat tidak ditemukan.</div>
        </div>
      </div>
      <input type="hidden" id="drugSelect" value="">
      <p class="text-[11px] text-slate-400">Klik kotak untuk melihat daftar. Gunakan pencarian di dalamnya jika ingin memfilter obat. Klik [x] jika ingin menghapus atau mengganti obat.</p>`;
  }

  const searchInput = document.getElementById("drugSearch");
  const displayBtn = document.getElementById("drugDisplayBtn");
  const displayText = document.getElementById("drugDisplayText");
  const dropdown = document.getElementById("drugDropdown");
  const innerSearch = document.getElementById("innerSearchBox");
  const hiddenSelect = document.getElementById("drugSelect");
  const clearBtn = document.getElementById("clearDrugBtn");
  const drugOptions = [...document.querySelectorAll(".drug-option")];
  const emptyState = document.getElementById("drugEmptyState");

  const filterOptions = (keyword = "") => {
    const query = keyword.trim().toLowerCase();
    let visibleCount = 0;
    drugOptions.forEach(option => {
      const matches = !query || option.dataset.label.toLowerCase().includes(query) || option.dataset.value.toLowerCase().includes(query);
      option.classList.toggle("hidden", !matches);
      if (matches) visibleCount += 1;
    });
    emptyState?.classList.toggle("hidden", visibleCount !== 0);
  };

  const openDropdown = () => {
    dropdown?.classList.remove("hidden");
    filterOptions("");
  };
  const closeDropdown = () => dropdown?.classList.add("hidden");
  const setDisplay = label => {
    if (searchInput) searchInput.value = label;
    if (displayText) {
      displayText.textContent = label || "Pilih obat di sini...";
      displayText.className = label ? "text-slate-800 truncate font-medium" : "text-slate-400 truncate";
    }
  };

  displayBtn?.addEventListener("click", event => {
    event.stopPropagation();
    openDropdown();
  });

  drugOptions.forEach(option => {
    option.addEventListener("click", () => {
      if (hiddenSelect) hiddenSelect.value = option.dataset.value;
      setDisplay(option.dataset.label);
      clearBtn?.classList.remove("hidden");
      if (innerSearch) innerSearch.value = "";
      closeDropdown();
      if (typeof setDefaultConc === "function") setDefaultConc();
      if (option.dataset.value === "Heparin") {
        const label = document.getElementById("drugNameLabel");
        if (label) label.textContent = "Heparin (IU/ml)";
      }
    });
  });

  innerSearch?.addEventListener("input", () => {
    filterOptions(innerSearch.value);
    if (hiddenSelect) hiddenSelect.value = "";
    clearBtn?.classList.add("hidden");
  });

  clearBtn?.addEventListener("click", event => {
    event.stopPropagation();
    if (hiddenSelect) hiddenSelect.value = "";
    if (innerSearch) innerSearch.value = "";
    setDisplay("");
    clearBtn.classList.add("hidden");
    filterOptions("");
    closeDropdown();
    if (typeof setDefaultConc === "function") setDefaultConc();
  });

  document.addEventListener("click", event => {
    if (!dropdown?.contains(event.target) && !displayBtn?.contains(event.target) && !clearBtn?.contains(event.target)) closeDropdown();
  });
  document.addEventListener("keydown", event => { if (event.key === "Escape") closeDropdown(); });

  // Identitas aplikasi pada header.
  const topHeader = document.querySelector(".top-card > header");
  const headerLeft = topHeader?.querySelector(":scope > div:first-child");
  const oldTitle = headerLeft?.querySelector("p");
  if (headerLeft && oldTitle && !headerLeft.querySelector('img[alt="Logo ZED Kalkulator"]')) {
    const brand = document.createElement("div");
    brand.className = "flex min-w-0 items-center gap-2";
    brand.innerHTML = `<img src="192x192.png" class="h-9 w-9 shrink-0 rounded-lg" alt="Logo ZED Kalkulator"><div class="min-w-0"><p class="truncate text-sm font-bold text-slate-800">ZED Kalkulator</p><p class="hidden text-xs text-slate-500 sm:block">Perhitungan klinis dalam satu aplikasi</p></div>`;
    oldTitle.replaceWith(brand);
  }

  const actionRow = calculatorForm?.querySelector(".action-row");
  const warningText = [...(resultColumn?.querySelectorAll("p") || [])].find(paragraph => paragraph.textContent.includes("Periksa kembali nama obat"));
  if (calculatorForm && actionRow && warningText) {
    warningText.className = "clinical-warning mt-3 text-xs leading-5 text-slate-500 no-print";
    actionRow.insertAdjacentElement("afterend", warningText);
  }

  const style = document.createElement("style");
  style.textContent = `
    .clinical-warning{display:flex;align-items:flex-start;gap:8px;padding-top:2px}
    .clinical-warning::before{content:"ⓘ";flex:0 0 auto;color:#2563eb;font-size:14px;line-height:1.35}
    .result-card-unified{overflow:hidden;border:1px solid #e2e8f0;border-radius:16px;background:#fff;box-shadow:0 12px 35px rgba(15,23,42,.06)}
    .result-card-unified__header{padding:16px 20px;border-bottom:1px solid #e2e8f0;font-weight:800;color:#1e293b;background:#fff}
    .result-card-unified #result{min-height:260px;max-height:520px;overflow:auto;border:0!important;border-radius:0!important;box-shadow:none!important;padding:20px!important;scroll-margin-top:90px}
    .result-card-unified + button{margin-top:12px;min-height:48px}
    .zed-mobile-bottom{display:none}
    footer{display:none!important}
    @media(min-width:900px){
      .app-shell{width:min(100%,1280px)!important}.desktop-grid{grid-template-columns:260px minmax(0,1fr)!important;gap:24px!important}.main-grid{grid-template-columns:minmax(420px,.95fr) minmax(420px,1.05fr)!important;align-items:start!important;gap:24px!important}.calculator-card,.result-column{height:auto!important;min-height:0!important}.calculator-card{overflow:visible!important;padding:28px!important}.result-column{display:block!important}.field{min-height:48px!important;font-size:15px!important}.side-link{font-size:14px!important}.quick-nav a{font-size:12px!important;padding-top:12px!important;padding-bottom:12px!important}.action-row button{min-height:48px!important;font-size:15px!important}
    }
    @media(max-width:899px){
      body{padding-bottom:86px!important}.top-card .quick-nav{display:none!important}.top-card>header{min-height:64px!important;padding:10px 14px!important}.top-card>header>div:last-child{display:none!important}.top-card>header>div:first-child{display:flex!important;width:100%;align-items:center!important}.mobile-menu-button{order:2!important;margin-left:auto!important;background:#eff6ff!important;color:#2563eb!important}.top-card>header>div:first-child>.flex{order:1!important}.mobile-footer-nav{display:none!important}.min-w-0.space-y-4>nav.grid.grid-cols-3{position:sticky;top:0;z-index:25;margin-inline:8px;border-radius:12px!important;padding:3px!important;font-size:12px!important}.min-w-0.space-y-4>nav.grid.grid-cols-3 a{padding-block:8px!important}.main-grid{display:block!important}.calculator-card,.result-column{height:auto!important;min-height:0!important}.result-column{margin-top:14px}.result-card-unified #result{min-height:210px;max-height:440px}
      #backdrop{z-index:65!important}
      #sideMenu{left:auto!important;right:0!important;z-index:70!important;width:min(82vw,320px)!important;transform:none!important;translate:105% 0!important;background:#f8fafc!important;visibility:hidden!important;pointer-events:none!important;transition:translate .22s ease!important}
      #sideMenu.zed-menu-open{translate:0 0!important;visibility:visible!important;pointer-events:auto!important}
      #sideMenu>div:first-child{padding:14px 16px!important;background:#fff!important}
      #sideMenu nav{display:flex!important;flex-direction:column!important;gap:7px!important;padding:12px 12px calc(110px + env(safe-area-inset-bottom))!important}
      #sideMenu .side-link{min-height:52px!important;width:100%!important;align-items:center!important;justify-content:flex-start!important;flex-direction:row!important;gap:12px!important;padding:10px 14px!important;border:1px solid #dbeafe!important;border-radius:12px!important;background:#fff!important;box-shadow:none!important;font-size:13px!important;font-weight:650!important;color:#1e3a8a!important}
      #sideMenu .side-link::before{content:"";display:block;width:8px;height:8px;flex:0 0 auto;border-radius:50%;background:#60a5fa}
      #sideMenu .side-link.active{border-color:#93c5fd!important;background:#eff6ff!important;color:#1d4ed8!important}
      .zed-mobile-bottom{position:fixed;left:0;right:0;bottom:0;z-index:60;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));align-items:end;padding:6px 6px calc(6px + env(safe-area-inset-bottom));border-top:1px solid #dbeafe;background:rgba(255,255,255,.98);box-shadow:0 -8px 24px rgba(15,23,42,.11);backdrop-filter:blur(14px)}
      .zed-mobile-bottom a{position:relative;display:flex;min-width:0;min-height:56px;flex-direction:column;align-items:center;justify-content:center;gap:3px;border-radius:12px;color:#2563eb;font-size:10px;font-weight:700;text-decoration:none}
      .zed-mobile-bottom .nav-icon{display:grid;width:25px;height:25px;place-items:center;color:#2563eb}.zed-mobile-bottom .nav-icon img,.zed-mobile-bottom .nav-icon svg{display:block;width:23px;height:23px;object-fit:contain}.zed-mobile-bottom .nav-icon img{filter:brightness(0) saturate(100%) invert(36%) sepia(96%) saturate(1602%) hue-rotate(207deg) brightness(91%) contrast(96%)}.zed-mobile-bottom .home-item{transform:translateY(-11px)}.zed-mobile-bottom .home-item .nav-icon{width:50px;height:50px;border-radius:50%;background:#dbeafe;box-shadow:0 7px 20px rgba(37,99,235,.22)}.zed-mobile-bottom .home-item .nav-icon img{width:28px;height:28px;border-radius:7px}.zed-mobile-bottom a.active{background:#eff6ff;color:#1d4ed8}.zed-mobile-bottom .home-item.active{background:transparent}
    }`;
  document.head.appendChild(style);

  // Tambahkan Privacy Policy ke menu kiri desktop bila belum ada.
  const desktopNav = document.querySelector(".desktop-aside nav");
  if (desktopNav && !desktopNav.querySelector('a[href="about.html"]')) {
    const privacyLink = document.createElement("a");
    privacyLink.href = "about.html";
    privacyLink.className = "side-link";
    privacyLink.textContent = "Privacy Policy & Disclaimer";
    desktopNav.appendChild(privacyLink);
  }

  const infoCard = resultColumn?.querySelector(".info-card");
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
  const closeRightMenu = () => {
    sideMenu?.classList.remove("zed-menu-open");
    if (sideMenu) sideMenu.style.translate = "105% 0";
    backdrop?.classList.add("hidden");
    document.body.style.overflow = "";
  };
  const openRightMenu = event => {
    if (!window.matchMedia("(max-width: 899px)").matches) return;
    event?.preventDefault();
    event?.stopPropagation();
    sideMenu?.classList.add("zed-menu-open");
    if (sideMenu) sideMenu.style.translate = "0 0";
    backdrop?.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  };
  closeRightMenu();
  window.addEventListener("pageshow", closeRightMenu);
  window.matchMedia("(min-width: 900px)").addEventListener("change", event => { if (event.matches) closeRightMenu(); });
  menuButton?.removeAttribute("onclick");
  closeButton?.removeAttribute("onclick");
  backdrop?.removeAttribute("onclick");
  menuButton?.addEventListener("click", openRightMenu, true);
  closeButton?.addEventListener("click", closeRightMenu);
  backdrop?.addEventListener("click", closeRightMenu);
  sideMenu?.querySelectorAll("a").forEach(link => link.addEventListener("click", closeRightMenu));

  document.querySelector(".zed-mobile-bottom")?.remove();
  const mobileBottom = document.createElement("nav");
  mobileBottom.className = "zed-mobile-bottom no-print";
  mobileBottom.setAttribute("aria-label", "Navigasi utama mobile");
  mobileBottom.innerHTML = `<a href="infus.html"><span class="nav-icon"><img src="Asset/infus.svg" alt=""></span><span>Infus</span></a><a href="insulin.html"><span class="nav-icon"><img src="Asset/insulin.svg" alt=""></span><span>Actrapid</span></a><a href="index.html" class="home-item active"><span class="nav-icon"><img src="Asset/SP.svg" alt=""></span><span>Home</span></a><a href="komunitas.html"><span class="nav-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 8h10M7 12h6"/><path d="M5 4h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-7l-5 3v-3H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"/></svg></span><span>Diskusi</span></a><a href="profil.html"><span class="nav-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0"/></svg></span><span>Akun</span></a>`;
  document.body.appendChild(mobileBottom);
  document.querySelector("footer")?.remove();

  let calculationRequested = false;
  calculatorForm?.querySelector('button[type="submit"]')?.addEventListener("click", () => { calculationRequested = true; });
  if (resultBox) {
    const observer = new MutationObserver(() => {
      if (!calculationRequested) return;
      const text = resultBox.textContent.trim();
      const isPlaceholder = !text || text.includes("Hasil akan tampil di sini");
      const isError = /pilih|masukkan|wajib|tidak valid|error|gagal|kosong/i.test(text);
      if (isPlaceholder || isError) return;
      calculationRequested = false;
      setTimeout(() => resultBox.closest(".result-card-unified")?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
    });
    observer.observe(resultBox, { childList: true, subtree: true, characterData: true });
  }
});