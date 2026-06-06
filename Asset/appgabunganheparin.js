// ===============================
// ZED Kalkulator Gabungan
// BB + Non BB dalam 1 halaman
// ===============================

const NO_WEIGHT_DRUGS = ["NTG", "PPI", "Furosemide", "Lansoprazole"];
const BB_DRUGS = ["NE", "Adrenalin", "Dopamin", "Dobutamin", "Milrinone", "Nicardipin", "Herbeser", "NTG_BB", "Heparin"];

function el(id){ return document.getElementById(id); }

function toggleMenu(){
  const m = el('sideMenu');
  const b = el('backdrop');
  const o = !m.classList.contains('-translate-x-full');
  if(o){ m.classList.add('-translate-x-full'); b.classList.add('hidden'); }
  else{ m.classList.remove('-translate-x-full'); b.classList.remove('hidden'); }
}


const DRUG_SEARCH_ITEMS = [
  { value: "NE", label: "Norepinefrin (NE)", aliases: ["ne", "norepinefrin", "norepinephrine", "noradrenalin"] },
  { value: "Adrenalin", label: "Adrenalin", aliases: ["adrenalin", "epinefrin", "epinephrine"] },
  { value: "Dopamin", label: "Dopamin", aliases: ["dopamin", "dopamine"] },
  { value: "Dobutamin", label: "Dobutamin", aliases: ["dobutamin", "dobutamine"] },
  { value: "Milrinone", label: "Milrinone", aliases: ["milrinone", "milrinon"] },
  { value: "Nicardipin", label: "Nicardipin", aliases: ["nicardipin", "nicardipine", "cardene"] },
  { value: "Herbeser", label: "Herbeser", aliases: ["herbeser", "diltiazem"] },
  { value: "NTG_BB", label: "NTG (dengan BB)", aliases: ["ntg dengan bb", "nitrogliserin bb", "nitroglycerin bb"] },
  {value: "Heparin",label: "Heparin",aliases: ["heparin"]},
  { value: "NTG", label: "NTG (tanpa BB)", aliases: ["ntg tanpa bb", "ntg", "nitrogliserin", "nitroglycerin"] },
  { value: "PPI", label: "OMZ / Panto", aliases: ["ppi", "omz", "omeprazole", "omeprazol", "panto", "pantoprazole", "pantoprazol"] },
  { value: "Furosemide", label: "Furosemide", aliases: ["furosemide", "furosemid", "lasix"] },
  { value: "Lansoprazole", label: "Lansoprazole", aliases: ["lansoprazole", "lansoprazol"] }
];

function normalizeDrugText(text){
  return String(text || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function findDrugBySearch(text){
  const q = normalizeDrugText(text);
  if(!q) return null;

  let exact = DRUG_SEARCH_ITEMS.find(item =>
    normalizeDrugText(item.label) === q ||
    normalizeDrugText(item.value) === q ||
    item.aliases.some(alias => normalizeDrugText(alias) === q)
  );
  if(exact) return exact;

  const matches = DRUG_SEARCH_ITEMS.filter(item => {
    const haystack = [item.label, item.value, ...item.aliases]
      .map(normalizeDrugText)
      .join(" ");
    return haystack.includes(q);
  });

  return matches.length === 1 ? matches[0] : null;
}

function syncSearchFromSelect(){
  const select = el("drugSelect");
  const search = el("drugSearch");
  if(!select || !search) return;

  const item = DRUG_SEARCH_ITEMS.find(d => d.value === select.value);
  search.value = item ? item.label : "";
}

function clearDrugSearch(){
  const search = el("drugSearch");
  const select = el("drugSelect");
  if(search) search.value = "";
  if(select) select.value = "";
  setDefaultConc();
}

function initDrugSearch(){
  const search = el("drugSearch");
  const select = el("drugSelect");
  if(!search || !select) return;

  search.addEventListener("input", () => {
    const item = findDrugBySearch(search.value);
    if(item){
      select.value = item.value;
      setDefaultConc();
    } else if(!search.value.trim()){
      select.value = "";
      setDefaultConc();
    }
  });

  search.addEventListener("change", () => {
    const item = findDrugBySearch(search.value);
    if(item){
      select.value = item.value;
      search.value = item.label;
      setDefaultConc();
    }
  });
}

function selectedDrug(){ return el("drugSelect").value; }
function isNoWeightDrug(drug){ return NO_WEIGHT_DRUGS.includes(drug); }

// ===============================
// ROUTER UTAMA
// ===============================
function setDefaultConc(){
  const drug = selectedDrug();
  el("result").innerHTML = "";

  hideAllConcWrappers();
  resetNoBBWrappers();

  if(!drug){
    el("weightWrapper").classList.remove("hidden");
    el("doseWrapperNoBB").classList.add("hidden");
    return;
  }

  if(isNoWeightDrug(drug)){
    el("weightWrapper").classList.add("hidden");
    el("doseWrapperNoBB").classList.remove("hidden");
    setDefaultConcNoBB();
  } else {
    el("weightWrapper").classList.remove("hidden");
    el("doseWrapperNoBB").classList.add("hidden");
    setDefaultConcBB();
  }
}

function calculate(){
  const drug = selectedDrug();
  if(!drug){
    el("result").innerHTML = "<p class='text-red-600'>Silakan pilih obat.</p>";
    return;
  }

  if(isNoWeightDrug(drug)) calculateNoBB();
  else calculateBB();
}

// ===============================
// KALKULATOR BB
// ===============================
function toggleNEMode(){ toggleDual('ne'); }
function toggleNicaMode(){ toggleDual('nica'); }

function toggleDual(prefix){
  const wrap = el(prefix + "CustomWrapper");
  const sel = el(prefix + "Conc");
  const btn = el(prefix + "ToggleBtn");
  wrap.classList.toggle("hidden");
  sel.classList.toggle("hidden");
  btn.textContent = wrap.classList.contains("hidden") ? "Custom" : "Pakai preset";
}

const DRUG_PRESETS = {
  "Adrenalin": [
    { label: "4 mg/50 ml", mcgPerMl: 80 },
    { label: "8 mg/50 ml", mcgPerMl: 160 }
  ],
  "Dopamin": [{ label: "1 ampul (200 mg/50 ml)", mcgPerMl: 4000 }],
  "Dobutamin": [{ label: "1 ampul (250 mg/50 ml)", mcgPerMl: 5000 }],
  "Milrinone": [{ label: "20 mg/50 ml", mcgPerMl: 400 }],
  "Herbeser": [{ label: "1 ampul (50 mg/50 ml)", mcgPerMl: 1000 }],
  "NTG_BB": [
    { label: "1 ampul (10 mg/50 ml)", mcgPerMl: 200 },
    { label: "5 ampul (50 mg/50 ml)", mcgPerMl: 1000 }
  ],
  "Heparin": [
  { label: "25.000 IU/50 ml", mcgPerMl: 500 },
  { label: "50.000 IU/50 ml", mcgPerMl: 1000 }
]
};

function setDefaultConcBB(){
  hideAllConcWrappers();
  const drug = selectedDrug();
  const presetArea = el("otherPresetArea");
  presetArea.innerHTML = "";
  if(!drug) return;

  if(drug === "NE"){
    el("concWrapperNE").classList.remove("hidden");
    return;
  }

  if(drug === "Nicardipin"){
    el("concWrapperNica").classList.remove("hidden");
    return;
  }

  el("concWrapperOther").classList.remove("hidden");
  el("drugNameLabel").textContent = drug;
  if(drug === "Heparin"){
  el("otherCustomDose").placeholder = "IU";
  el("otherCustomVolume").placeholder = "ml";
}else{
  el("otherCustomDose").placeholder = "mg";
  el("otherCustomVolume").placeholder = "ml";
}

  if(DRUG_PRESETS[drug]){
    const presets = DRUG_PRESETS[drug];
    const wrap = document.createElement("div");
    wrap.className = "flex gap-2";

    const sel = document.createElement("select");
    sel.id = "otherPresetSelect";
    sel.className = "flex-1 rounded-lg border px-3 py-2 text-sm shadow-sm mt-1";

    presets.forEach(p => {
      const opt = document.createElement("option");
      opt.value = p.mcgPerMl;
      opt.textContent = p.label;
      sel.appendChild(opt);
    });

    const btn = document.createElement("button");
    btn.type = "button";
    btn.id = "otherToggleBtn";
    btn.className = "rounded-lg border px-3 py-2 text-xs mt-1";
    btn.textContent = "Custom";
    btn.onclick = () => toggleOtherMode(sel, btn);

    wrap.appendChild(sel);
    wrap.appendChild(btn);
    presetArea.appendChild(wrap);
  }
}

function toggleOtherMode(sel, btn){
  const wrapper = el("otherCustomWrapper");
  wrapper.classList.toggle("hidden");
  sel.classList.toggle("hidden");
  btn.textContent = wrapper.classList.contains("hidden") ? "Custom" : "Pakai preset";
}

function hideAllConcWrappers(){
  ["NE", "Nica", "Other"].forEach(id => {
    const node = el("concWrapper" + id);
    if(node) node.classList.add("hidden");
  });

  ["ne", "nica", "other"].forEach(p => {
    const c = el(p + "CustomWrapper");
    const s = el(p + "Conc");
    if(c) c.classList.add("hidden");
    if(s) s.classList.remove("hidden");
  });
}

function calculateConcentration(amount, ml, drug){
  if(!amount || !ml || ml <= 0) return null;

  if(drug === "Heparin"){
    return amount / ml; // IU/ml
  }

  return (amount * 1000) / ml; // mcg/ml
}

function getActiveConcentrationBB(drug){
  if(drug === "NE"){
    const custom = !el("neCustomWrapper").classList.contains("hidden");
    if(custom) return calculateConcentration(
  parseFloat(el("neCustomDose").value),
  parseFloat(el("neCustomVolume").value),
  drug
);
    return parseFloat(el("neConc").value);
  }

  if(drug === "Nicardipin"){
    const custom = !el("nicaCustomWrapper").classList.contains("hidden");
    if(custom) return calculateConcentration(
  parseFloat(el("nicaCustomDose").value),
  parseFloat(el("nicaCustomVolume").value),
  drug
);
    return parseFloat(el("nicaConc").value);
  }

  const presetSel = el("otherPresetSelect");
  if(presetSel && !presetSel.classList.contains("hidden")) return parseFloat(presetSel.value);

  if(!el("otherCustomWrapper").classList.contains("hidden")){
    return calculateConcentration(
  parseFloat(el("otherCustomDose").value),
  parseFloat(el("otherCustomVolume").value),
  drug
);
  }

  return null;
}

function rowHtml(doseText, unit, mlHour){
  return `<tr><td>${doseText} ${unit}</td><td>${mlHour.toFixed(2)} ml/jam</td></tr>`;
}

function calculateBB(){
  const drug = selectedDrug();
  const result = el("result");
  result.innerHTML = "";

  const conc = getActiveConcentrationBB(drug);
  if(!conc) return result.innerHTML = "<p class='text-red-600'>Isi konsentrasi dengan benar.</p>";

  const weight = parseFloat(el("weightInput").value);
  if(!weight || weight <= 0) return result.innerHTML = "<p class='text-red-600'>BB tidak valid.</p>";

  const concLabel = getConcentrationLabelBB(drug);

  let html = `<h3 class='font-semibold mb-1'>${drug}</h3>
<p class='text-xs'>BB: <b>${weight} kg</b></p>
<p class='text-xs'>Pengenceran: <b>${concLabel}</b></p>
<p class='text-xs'>Konsentrasi: <b>${conc.toFixed(2)} mcg/ml</b></p>
<hr class='my-2'>
<table class="result-table">
<thead><tr><th>Dosis</th><th>Kecepatan</th></tr></thead><tbody>`;

  let doses = [];
  if(drug === "Heparin"){

  html = `
  <h3 class='font-semibold mb-1'>Heparin</h3>
  <p class='text-xs'>BB: <b>${weight} kg</b></p>
  <p class='text-xs'>Pengenceran: <b>${concLabel}</b></p>
  <p class='text-xs'>Konsentrasi: <b>${conc.toFixed(2)} IU/ml</b></p>
  <hr class='my-2'>
  <table class="result-table">
  <thead>
  <tr>
    <th>Dosis</th>
    <th>Kecepatan</th>
  </tr>
  </thead>
  <tbody>
  `;

  for(let d=5; d<=30; d+=1){
    const iuHour = d * weight;
    const mlHour = iuHour / conc;

    html += `
      <tr>
        <td>${d} IU/kgBB/jam</td>
        <td>${mlHour.toFixed(2)} ml/jam</td>
      </tr>
    `;
  }

  html += "</tbody></table>";

  result.innerHTML = html;
  return;
}
  if(drug === "NE"){
    for(let d = 0.01; d <= 0.1; d += 0.01) doses.push(d);
    for(let d = 0.2; d <= 2.000001; d += 0.1) doses.push(d);
  } else if(drug === "Adrenalin"){
    for(let d = 0.05; d <= 0.6; d += 0.05) doses.push(d);
    for(let d = 0.7; d <= 2.000001; d += 0.1) doses.push(d);
  } else if(["Dopamin", "Dobutamin"].includes(drug)){
    for(let d = 1; d <= 20; d++) doses.push(d);
  } else if(drug === "Milrinone"){
    doses = [0.1, 0.375, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
  } else if(drug === "Herbeser"){
    doses = [0.5,1,1.5,2,2.5,3,3.5,4,4.5,5,5.5,6,6.5,7,7.5,8,8.5,9,9.5,10];
  } else if(drug === "NTG_BB"){
    doses = [0.25,0.5,0.6,0.75,1,1.25,1.5,1.75,2,2.25,2.5,2.75,3];
  } else {
    for(let d = 0.5; d <= 10; d += 0.5) doses.push(d);
  }

  doses.forEach(d => {
    const mlHour = (d * weight * 60) / conc;
    html += rowHtml(Number(d.toFixed(3)), "mcg/kg/menit", mlHour);
  });

  html += `</tbody></table>`;
  result.innerHTML = html;
}

function getConcentrationLabelBB(drug){
  if(drug === "NE"){
    if(!el("neConc").classList.contains("hidden")) return el("neConc").selectedOptions[0].text;
    return "Custom: " + el("neCustomDose").value + " mg / " + el("neCustomVolume").value + " ml";
  }

  if(drug === "Nicardipin"){
    if(!el("nicaConc").classList.contains("hidden")) return el("nicaConc").selectedOptions[0].text;
    return "Custom: " + el("nicaCustomDose").value + " mg / " + el("nicaCustomVolume").value + " ml";
  }

  const presetSel = el("otherPresetSelect");
  if(presetSel && !presetSel.classList.contains("hidden")) return presetSel.selectedOptions[0].text;

  return "Custom: " + el("otherCustomDose").value + " mg / " + el("otherCustomVolume").value + " ml";
}

// ===============================
// KALKULATOR NON BB
// ===============================
function resetNoBBWrappers(){
  el("concWrapperPPI").classList.add("hidden");
  el("concWrapperFuro").classList.add("hidden");
  el("ppiConc").classList.remove("hidden");
  el("ppiCustomWrapper").classList.add("hidden");
  el("furoConcPreset").classList.remove("hidden");
  el("furoCustomWrapper").classList.add("hidden");
}

function togglePPICustom(){
  el("ppiCustomWrapper").classList.toggle("hidden");
  el("ppiConc").classList.toggle("hidden");
}

function toggleFuroCustom(){
  el("furoCustomWrapper").classList.toggle("hidden");
  el("furoConcPreset").classList.toggle("hidden");
}

function setDefaultConcNoBB(){
  resetNoBBWrappers();

  const d = selectedDrug();
  const label = el("ppiLabel");
  el("doseInput").value = "";

  if(d === "NTG") el("doseUnit").textContent = "mcg/menit";
  else el("doseUnit").textContent = "mg/jam";

  if(d === "NTG"){
    el("concWrapperPPI").classList.remove("hidden");
    label.textContent = "Konsentrasi NTG";
    el("ppiConc").innerHTML = '<option value="200">10 mg/50 ml</option>';
  }

  if(d === "PPI"){
    el("concWrapperPPI").classList.remove("hidden");
    label.textContent = "Konsentrasi PPI";
    el("ppiConc").innerHTML =
      '<option value="800">1 vial (40 mg/50 ml → 0,8 mg/ml)</option>' +
      '<option value="1600">2 vial (80 mg/50 ml)</option>';
  }

  if(d === "Lansoprazole"){
    el("concWrapperPPI").classList.remove("hidden");
    label.textContent = "Konsentrasi Lansoprazole";
    el("ppiConc").innerHTML =
      '<option value="600">1 vial (30 mg/50 ml)</option>' +
      '<option value="1200">2 vial (60 mg/50 ml)</option>' +
      '<option value="3000">2 vial (60 mg/20 ml)</option>';
  }

  if(d === "Furosemide"){
    el("concWrapperFuro").classList.remove("hidden");
  }
}

function getActiveConcentrationNoBB(){
  const d = selectedDrug();

  if(d === "Furosemide"){
    if(!el("furoConcPreset").classList.contains("hidden")) return parseFloat(el("furoConcPreset").value);

    const mg = parseFloat(el("furoCustomDose").value);
    const ml = parseFloat(el("furoCustomVolume").value);
    if(isNaN(mg) || isNaN(ml) || ml <= 0) return NaN;
    return (mg * 1000) / ml;
  }

  if(!el("ppiConc").classList.contains("hidden")) return parseFloat(el("ppiConc").value);

  const mg = parseFloat(el("ppiCustomDose").value);
  const ml = parseFloat(el("ppiCustomVolume").value);
  if(isNaN(mg) || isNaN(ml) || ml <= 0) return NaN;
  return (mg * 1000) / ml;
}

function calculateNoBB(){
  const d = selectedDrug();
  const result = el("result");
  const c = getActiveConcentrationNoBB();

  if(!c || isNaN(c)){
    result.innerHTML = "<p class='text-red-600'>Konsentrasi belum diatur dengan benar.</p>";
    return;
  }

  let html = `<h3 class='font-semibold'>${d}</h3><p>Konsentrasi: ${c.toFixed(1)} mcg/ml</p><hr class='my-2'>`;
  const customDose = parseFloat(el("doseInput").value);

  if(!isNaN(customDose) && customDose > 0){
    let mlH, label;
    if(d === "NTG"){
      mlH = (customDose * 60) / c;
      label = `${customDose} mcg/menit`;
    } else {
      mlH = (customDose * 1000) / c;
      label = `${customDose} mg/jam`;
    }
    html += rowNoBB(label, mlH);
  } else {
    if(d === "NTG"){
      [10,15,20,25,30,35,40,45,50,55,60,65,70,75,80,85,90,100].forEach(x => {
        const mlH = (x * 60) / c;
        html += rowNoBB(x + " mcg/menit", mlH);
      });
    } else {
      for(let x = 6; x <= 30; x += 2){
        const mlH = (x * 1000) / c;
        html += rowNoBB(x + " mg/jam", mlH);
      }
    }
  }

  result.innerHTML = html;
}

function rowNoBB(t, mlh){
  return `<div class='flex justify-between border-b py-0.5'><span>${t}</span><span class='font-semibold'>${mlh.toFixed(2)} ml/jam</span></div>`;
}

// ===============================
// PRINT + INSTALL PWA
// ===============================
function printResultOnly(){
  const hasil = el("result").innerHTML.trim();
  if(!hasil) return alert("Belum ada hasil.");

  const w = window.open("", "_blank", "width=800,height=600");
  w.document.write(`<!DOCTYPE html><html><head><meta charset='utf-8'><title>Print</title>
<style>
@media print {
  body{font-size:14px;padding:5px;width:100mm;}
  .result-table{width:100%;table-layout:fixed;border-collapse:collapse;font-size:14px;}
  .result-table th,.result-table td{border:1px solid #000;padding:2px 4px;word-wrap:break-word;}
  .result-table td:first-child{width:55%;}
  .result-table td:last-child{width:45%;text-align:right;}
  h3{font-size:11px;margin-bottom:2px;}
  p{margin:1px 0;}
  .footer{font-size:9px;text-align:right;}
}
</style></head><body>${hasil}<div class="footer">Generated by ZED Kalkulator</div></body></html>`);
  w.document.close();
  w.print();
}

document.addEventListener("DOMContentLoaded", () => {
  initDrugSearch();
  setDefaultConc();

  let deferredPrompt;
  const installBtn = el("installBtn");

  if(installBtn){
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      deferredPrompt = e;
      installBtn.classList.remove("hidden");
    });

    installBtn.addEventListener("click", async () => {
      if(!deferredPrompt) return;
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if(outcome === "accepted") installBtn.classList.add("hidden");
      deferredPrompt = null;
    });
  }
});


// SERVICE WORKER REGISTER
if ("serviceWorker" in navigator && !window.__zedSwRegistered) {

  window.__zedSwRegistered = true;

  window.addEventListener("load", () => {

    navigator.serviceWorker.register("/sw.js")

      .then((reg) => {
        console.log("SW registered:", reg.scope);
      })

      .catch((err) => {
        console.log("SW failed:", err);
      });

  });

}
