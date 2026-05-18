function toggleMenu() {
  const menu = document.getElementById("sideMenu");
  const backdrop = document.getElementById("backdrop");
  menu.classList.toggle("-translate-x-full");
  backdrop.classList.toggle("hidden");
}

function togglePPICustom() {
  ppiCustomWrapper.classList.toggle("hidden");
  ppiConc.classList.toggle("hidden");
    
}
    
function toggleFuroCustom() {
  furoCustomWrapper.classList.toggle("hidden");
  furoConcPreset.classList.toggle("hidden");
}

function setDefaultConc() {
  concWrapperPPI.classList.add("hidden");
  concWrapperFuro.classList.add("hidden");

  const d = drugSelect.value;
  const label = document.getElementById("ppiLabel");

  // Set unit dosis sesuai obat
  if (d === "NTG") {
    doseUnit.textContent = "mcg/menit";
  } else if (d) {
    doseUnit.textContent = "mg/jam";
  } else {
    doseUnit.textContent = "mg/jam";
  }

  // Opsional: kosongkan input dosis saat ganti obat
  doseInput.value = "";

  if (d === "NTG") {
    concWrapperPPI.classList.remove("hidden");
    label.textContent = "Konsentrasi NTG";
    ppiConc.innerHTML = '<option value="200">10mg/50ml</option>';
    ppiConc.classList.remove("hidden");
    ppiCustomWrapper.classList.add("hidden");
  }

  if (d === "PPI") {
    concWrapperPPI.classList.remove("hidden");
    label.textContent = "Konsentrasi PPI";
    ppiConc.innerHTML =
      '<option value="800">1 vial (40mg/50ml → 0,8 mg/ml)</option>' +
      '<option value="1600">2 vial (80mg/50ml)</option>';
    ppiConc.classList.remove("hidden");
    ppiCustomWrapper.classList.add("hidden");
  }

  if (d === "Lansoprazole") {
    concWrapperPPI.classList.remove("hidden");
    label.textContent = "Konsentrasi Lansoprazole";
    ppiConc.innerHTML =
      ppiConc.innerHTML =
  '<option value="600">1 vial (30mg/50ml)</option>' +
  '<option value="1200">2 vial (60mg/50ml )</option>' +
  '<option value="3000">2 vial (60mg/20ml)</option>';
    ppiConc.classList.remove("hidden");
    ppiCustomWrapper.classList.add("hidden");
  }

  if (d === "Furosemide") {
    concWrapperFuro.classList.remove("hidden");
  }
}

function getConc() {
  const d = drugSelect.value;

  // Furosemide pakai preset sendiri
  if (d === "Furosemide") {
  if (!furoConcPreset.classList.contains("hidden")) {
    return parseFloat(furoConcPreset.value);
  }

  const mg = parseFloat(furoCustomDose.value);
  const ml = parseFloat(furoCustomVolume.value);
  if (isNaN(mg) || isNaN(ml) || ml <= 0) return NaN;

  return (mg * 1000) / ml; // mg → mcg/ml
}


  // NTG / PPI / Lansoprazole: preset atau custom
  if (!ppiConc.classList.contains("hidden")) {
    return parseFloat(ppiConc.value);
  }

  const mg = parseFloat(ppiCustomDose.value);
  const ml = parseFloat(ppiCustomVolume.value);
  if (isNaN(mg) || isNaN(ml) || ml <= 0) return NaN;

  // mg → mcg
  return (mg * 1000) / ml;
}

function calculate() {
  const d = drugSelect.value;
  if (!d) {
    result.innerHTML = "Pilih obat dulu.";
    return;
  }

  const c = getConc();
  if (!c || isNaN(c)) {
    result.innerHTML = "Konsentrasi belum diatur dengan benar.";
    return;
  }

  let html =
    `<h3 class='font-semibold'>${d}</h3>` +
    `<p>Konsentrasi: ${c.toFixed(1)} mcg/ml</p><hr>`;

  const customDose = parseFloat(doseInput.value);

  // Jika dosis diisi → tampilkan 1 nilai spesifik
  if (!isNaN(customDose) && customDose > 0) {
    let mlH, label;
    if (d === "NTG") {
      // Dosis dalam mcg/menit → konversi ke mcg/jam
      mlH = (customDose * 60) / c;
      label = `${customDose} mcg/menit`;
    } else {
      // Dosis dalam mg/jam
      mlH = (customDose * 1000) / c; // mg → mcg
      label = `${customDose} mg/jam`;
    }
    html += row(label, mlH);
  } else {
    // Jika dosis kosong → tampilkan tabel standar seperti sebelumnya
    if (d === "NTG") {
      [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 100].forEach(x => {
        const mlH = (x * 60) / c;
        html += row(x + " mcg/menit", mlH);
      });
    } else {
      for (let x = 6; x <= 30; x += 2) {
        const mlH = (x * 1000) / c;
        html += row(x + " mg/jam", mlH);
      }
    }
  }

  result.innerHTML = html;
}

function row(t, mlh) {
  return `<div class='flex justify-between border-b py-0.5'>
            <span>${t}</span>
            <span class='font-semibold'>${mlh.toFixed(2)} ml/jam</span>
          </div>`;
}
