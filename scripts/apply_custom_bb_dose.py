from pathlib import Path

INDEX = Path("index.html")
APP = Path("Asset/appgabunganheparin.js")

index_text = INDEX.read_text(encoding="utf-8")
app_text = APP.read_text(encoding="utf-8")

old_index = '''              <div id="weightWrapper" class="space-y-2"><label class="text-sm font-bold text-slate-700">Berat badan (kg)</label><input id="weightInput" type="number" min="1" class="field" placeholder="Contoh: 60"></div>
              <div id="doseWrapperHeparin" class="hidden space-y-2"><label class="text-sm font-bold text-slate-700">Dosis Heparin custom</label><div class="flex items-center gap-2"><input id="doseInputHeparin" type="number" step="0.01" min="0" class="field" placeholder="Contoh: 18"><span class="whitespace-nowrap text-xs text-slate-600">IU/kgBB/jam</span></div><p class="text-xs text-slate-400">Opsional. Kosongkan untuk tabel standar.</p></div>
              <div id="doseWrapperNoBB" class="hidden space-y-2">'''

new_index = '''              <div id="weightWrapper" class="space-y-2"><label class="text-sm font-bold text-slate-700">Berat badan (kg)</label><input id="weightInput" type="number" min="1" class="field" placeholder="Contoh: 60"></div>
              <div id="doseWrapperBB" class="hidden overflow-hidden rounded-xl border border-slate-200 bg-slate-50/70">
                <button id="doseBBToggle" type="button" onclick="toggleBBDoseInput()" class="flex min-h-12 w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-bold text-slate-700" aria-expanded="false" aria-controls="doseBBPanel">
                  <span>Dosis khusus <span class="font-normal text-slate-400">(opsional)</span></span>
                  <span id="doseBBChevron" class="text-lg text-slate-400 transition-transform">⌄</span>
                </button>
                <div id="doseBBPanel" class="hidden border-t border-slate-200 p-4">
                  <label id="doseBBLabel" for="doseInputBB" class="mb-2 block text-sm font-bold text-slate-700">Masukkan dosis</label>
                  <div class="flex items-center gap-2"><input id="doseInputBB" type="number" inputmode="decimal" step="any" min="0" class="field" placeholder="Contoh: 0,5"><span id="doseBBUnit" class="whitespace-nowrap text-xs font-semibold text-slate-600">mcg/kgBB/menit</span></div>
                  <p class="mt-2 text-xs leading-5 text-slate-400">Kosongkan untuk menampilkan tabel dosis standar. Dosis khusus tidak mengubah daftar protap.</p>
                </div>
              </div>
              <div id="doseWrapperNoBB" class="hidden space-y-2">'''

if old_index not in index_text:
    raise SystemExit("Target index snippet not found or already changed")
index_text = index_text.replace(old_index, new_index, 1)

old_meta = '''function selectedDrug(){ return el("drugSelect").value; }
function isNoWeightDrug(drug){ return NO_WEIGHT_DRUGS.includes(drug); }
'''
new_meta = '''function selectedDrug(){ return el("drugSelect").value; }
function isNoWeightDrug(drug){ return NO_WEIGHT_DRUGS.includes(drug); }

const BB_DOSE_META = {
  Heparin: { unit: "IU/kgBB/jam", formula: "iu_per_kg_hour", example: "Contoh: 18" },
  NE: { unit: "mcg/kgBB/menit", formula: "mcg_per_kg_min", example: "Contoh: 0,05" },
  Adrenalin: { unit: "mcg/kgBB/menit", formula: "mcg_per_kg_min", example: "Contoh: 0,1" },
  Dopamin: { unit: "mcg/kgBB/menit", formula: "mcg_per_kg_min", example: "Contoh: 5" },
  Dobutamin: { unit: "mcg/kgBB/menit", formula: "mcg_per_kg_min", example: "Contoh: 0,5" },
  Milrinone: { unit: "mcg/kgBB/menit", formula: "mcg_per_kg_min", example: "Contoh: 0,375" },
  Nicardipin: { unit: "mcg/kgBB/menit", formula: "mcg_per_kg_min", example: "Contoh: 0,5" },
  Herbeser: { unit: "mcg/kgBB/menit", formula: "mcg_per_kg_min", example: "Contoh: 1" },
  NTG_BB: { unit: "mcg/kgBB/menit", formula: "mcg_per_kg_min", example: "Contoh: 0,5" }
};

function toggleBBDoseInput(forceOpen){
  const panel = el("doseBBPanel");
  const button = el("doseBBToggle");
  const chevron = el("doseBBChevron");
  if(!panel || !button) return;
  const shouldOpen = typeof forceOpen === "boolean" ? forceOpen : panel.classList.contains("hidden");
  panel.classList.toggle("hidden", !shouldOpen);
  button.setAttribute("aria-expanded", String(shouldOpen));
  if(chevron) chevron.style.transform = shouldOpen ? "rotate(180deg)" : "";
  if(shouldOpen) setTimeout(() => el("doseInputBB")?.focus(), 30);
}

function updateBBDoseInput(drug){
  const wrapper = el("doseWrapperBB");
  const input = el("doseInputBB");
  const unit = el("doseBBUnit");
  const label = el("doseBBLabel");
  const meta = BB_DOSE_META[drug];
  if(!wrapper) return;
  wrapper.classList.toggle("hidden", !meta);
  if(!meta) return;
  if(input){ input.value = ""; input.placeholder = meta.example; }
  if(unit) unit.textContent = meta.unit;
  if(label) label.textContent = `Dosis khusus ${drug === "NE" ? "Norepinefrin" : drug}`;
  toggleBBDoseInput(false);
}
'''
if old_meta not in app_text:
    raise SystemExit("Metadata insertion target not found")
app_text = app_text.replace(old_meta, new_meta, 1)

old_router = '''  hideAllConcWrappers();
  resetNoBBWrappers();

  if(!drug){'''
new_router = '''  hideAllConcWrappers();
  resetNoBBWrappers();
  updateBBDoseInput(drug);

  if(!drug){'''
if old_router not in app_text:
    raise SystemExit("Router target not found")
app_text = app_text.replace(old_router, new_router, 1)

old_heparin_toggle = '''  const heparinDose = el("doseWrapperHeparin");
if(heparinDose){
  heparinDose.classList.toggle("hidden", drug !== "Heparin");
}
  const presetArea = el("otherPresetArea");'''
new_heparin_toggle = '''  const presetArea = el("otherPresetArea");'''
if old_heparin_toggle not in app_text:
    raise SystemExit("Old Heparin wrapper target not found")
app_text = app_text.replace(old_heparin_toggle, new_heparin_toggle, 1)

old_hide = '''  const heparinDose = el("doseWrapperHeparin");
  if(heparinDose) heparinDose.classList.add("hidden");
}'''
new_hide = '''}'''
if old_hide not in app_text:
    raise SystemExit("Old hide wrapper target not found")
app_text = app_text.replace(old_hide, new_hide, 1)

old_heparin_input = '''  const customDose = parseFloat(el("doseInputHeparin")?.value);'''
new_heparin_input = '''  const customDose = parseFloat(el("doseInputBB")?.value);'''
if old_heparin_input not in app_text:
    raise SystemExit("Heparin input target not found")
app_text = app_text.replace(old_heparin_input, new_heparin_input, 1)

old_before_doses = '''  let doses = [];
  if(drug === "Heparin"){'''
new_before_doses = '''  let doses = [];
  const customBBDose = parseFloat(el("doseInputBB")?.value);
  if(drug !== "Heparin" && Number.isFinite(customBBDose) && customBBDose > 0){
    const meta = BB_DOSE_META[drug] || BB_DOSE_META.NE;
    const mlHour = meta.formula === "iu_per_kg_hour"
      ? (customBBDose * weight) / conc
      : (customBBDose * weight * 60) / conc;
    result.innerHTML = `<h3 class='font-semibold mb-1'>${drug}</h3>
      <p class='text-xs'>BB: <b>${weight} kg</b></p>
      <p class='text-xs'>Dosis khusus: <b>${customBBDose} ${meta.unit}</b></p>
      <p class='text-xs'>Pengenceran: <b>${concLabel}</b></p>
      <p class='text-xs'>Konsentrasi: <b>${conc.toFixed(2)} mcg/ml</b></p>
      <hr class='my-2'>
      <div class='rounded-xl bg-blue-50 p-4'>
        <p class='text-xs font-bold uppercase tracking-wider text-blue-600'>Kecepatan syringe pump</p>
        <p class='mt-2 text-2xl font-bold text-blue-700'>${mlHour.toFixed(2)} ml/jam</p>
      </div>
      <p class='mt-3 text-xs leading-5 text-slate-500'>Hasil dihitung dari dosis khusus. Kosongkan input dosis untuk kembali menampilkan tabel standar.</p>`;
    return;
  }
  if(drug === "Heparin"){'''
if old_before_doses not in app_text:
    raise SystemExit("Custom dose calculation insertion target not found")
app_text = app_text.replace(old_before_doses, new_before_doses, 1)

INDEX.write_text(index_text, encoding="utf-8")
APP.write_text(app_text, encoding="utf-8")
print("Optional BB dose input applied")
