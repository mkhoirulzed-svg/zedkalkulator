
// SIDEBAR
function toggleMenu(){
  const sideMenu = document.getElementById("sideMenu");
  const backdrop = document.getElementById("backdrop");
  if (!sideMenu || !backdrop) return;
  sideMenu.classList.toggle("-translate-x-full");
  backdrop.classList.toggle("hidden");
}

// PRINT HELPER
function printElement(elementId){
  const el = document.getElementById(elementId);
  if(!el){
    alert('Elemen untuk dicetak tidak ditemukan.');
    return;
  }

  // Pastikan elemen target punya kelas print-area
  if (!el.classList.contains('print-area')) {
    el.classList.add('print-area');
  }

  window.print();
}

// LOGIKA KALKULATOR PENGEVERAN OBAT
window.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('dilutionForm');
  const resetBtn = document.getElementById('resetBtn');
  const resultText = document.getElementById('resultText');
  const doseTotalInput = document.getElementById('doseTotal');
  const volumeTotalInput = document.getElementById('volumeTotal');
  const doseRequestedInput = document.getElementById('doseRequested');

  if (doseTotalInput) {
    doseTotalInput.focus();
  }

  function parseInput(inputEl) {
    if (!inputEl) return NaN;
    const raw = String(inputEl.value || '').trim().replace(',', '.');
    return parseFloat(raw);
  }

  function formatNumber(num) {
    if (!isFinite(num)) return '-';
    return num.toFixed(3).replace(/(?:\.0+|(\.\d+?)0+)$/, '$1');
  }

  if (form && resultText) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const doseTotal = parseInput(doseTotalInput);
      const volumeTotal = parseInput(volumeTotalInput);
      const doseRequested = parseInput(doseRequestedInput);

      if (!doseTotal || doseTotal <= 0 || !isFinite(doseTotal)) {
        resultText.innerHTML = '<span class="text-red-600">Isi dosis total dalam vial dengan benar (&gt; 0).</span>';
        return;
      }
      if (!volumeTotal || volumeTotal <= 0 || !isFinite(volumeTotal)) {
        resultText.innerHTML = '<span class="text-red-600">Isi volume total pelarut dengan benar (&gt; 0).</span>';
        return;
      }
      if (!doseRequested || doseRequested <= 0 || !isFinite(doseRequested)) {
        resultText.innerHTML = '<span class="text-red-600">Isi dosis yang diminta dengan benar (&gt; 0).</span>';
        return;
      }

      // Konsentrasi obat dalam vial/ampul (mg/ml atau unit/ml)
      const concentration = doseTotal / volumeTotal; // satuan per ml
      // Volume yang harus diambil
      const volumeNeeded = doseRequested / concentration; // ml

      resultText.innerHTML = `
        <p class="mb-1">Volume yang harus diambil:<br>
          <span class="text-lg font-semibold text-blue-700">${formatNumber(volumeNeeded)} ml</span>
        </p>
        <ul class="mt-2 list-disc list-inside text-xs sm:text-sm text-slate-700 space-y-1">
          <li>Dosis tersedia: <span class="font-medium">${formatNumber(doseTotal)}</span> unit dalam <span class="font-medium">${formatNumber(volumeTotal)}</span> ml.</li>
          <li>Konsentrasi: <span class="font-medium">${formatNumber(concentration)}</span> unit/ml.</li>
          <li>Dosis yang diminta: <span class="font-medium">${formatNumber(doseRequested)}</span> unit.</li>
        </ul>
        <p class="mt-3 text-[11px] sm:text-xs text-slate-500">
          Catatan: "Unit" di sini bisa berupa mg, mikrogram, IU, dll, selama konsisten antara dosis total dan dosis permintaan.
          Selalu verifikasi kembali perhitungan sebelum pemberian obat.
        </p>
      `;
    });
  }

  if (resetBtn && resultText) {
    resetBtn.addEventListener('click', () => {
      if (doseTotalInput) doseTotalInput.value = '';
      if (volumeTotalInput) volumeTotalInput.value = '';
      if (doseRequestedInput) doseRequestedInput.value = '';
      resultText.innerHTML = 'Belum ada perhitungan. Masukkan data di formulir di atas, lalu klik <span class="font-semibold">Hitung</span>.';
      if (doseTotalInput) doseTotalInput.focus();
    });
  }
});
