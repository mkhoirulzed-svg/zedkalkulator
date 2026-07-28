// Dukungan Icunes / Dexmedetomidine pada kalkulator Syringe Pump.
// Preset: 1 ampul = 200 mcg, volume akhir 50 ml = 4 mcg/ml.
(function () {
  function initIcunes() {
    if (location.pathname.split('/').pop() !== 'index.html' && location.pathname.split('/').pop() !== '') return;

    if (typeof BB_DRUGS !== 'undefined' && !BB_DRUGS.includes('Icunes')) {
      BB_DRUGS.push('Icunes');
    }

    if (typeof DRUG_SEARCH_ITEMS !== 'undefined' && !DRUG_SEARCH_ITEMS.some(item => item.value === 'Icunes')) {
      DRUG_SEARCH_ITEMS.push({
        value: 'Icunes',
        label: 'Icunes / Dexmedetomidine',
        aliases: ['icunes', 'dexmedetomidine', 'dexmedetomidin', 'dexmedetomidina']
      });
    }

    if (typeof DRUG_PRESETS !== 'undefined') {
      DRUG_PRESETS.Icunes = [
        { label: '1 ampul (200 mcg/50 ml → 4 mcg/ml)', mcgPerMl: 4 }
      ];
    }

    if (typeof BB_DOSE_META !== 'undefined') {
      BB_DOSE_META.Icunes = {
        unit: 'mcg/kgBB/jam',
        formula: 'mcg_per_kg_hour',
        example: 'Contoh: 0,5'
      };
    }

    const divider = [...document.querySelectorAll('#drugDropdown div')]
      .find(node => node.textContent.trim() === 'Tanpa Berat Badan');

    if (divider && !document.querySelector('.drug-option[data-value="Icunes"]')) {
      const option = document.createElement('button');
      option.type = 'button';
      option.className = 'drug-option w-full text-left px-3 py-2 text-sm hover:bg-blue-50';
      option.dataset.value = 'Icunes';
      option.dataset.label = 'Icunes / Dexmedetomidine';
      option.textContent = 'Icunes / Dexmedetomidine';
      divider.before(option);

      option.addEventListener('click', () => {
        const hiddenSelect = document.getElementById('drugSelect');
        const displayText = document.getElementById('drugDisplayText');
        const searchInput = document.getElementById('drugSearch');
        const clearBtn = document.getElementById('clearDrugBtn');
        const dropdown = document.getElementById('drugDropdown');
        const innerSearch = document.getElementById('innerSearchBox');

        if (hiddenSelect) hiddenSelect.value = 'Icunes';
        if (searchInput) searchInput.value = 'Icunes / Dexmedetomidine';
        if (displayText) {
          displayText.textContent = 'Icunes / Dexmedetomidine';
          displayText.className = 'text-slate-800 truncate font-medium';
        }
        clearBtn?.classList.remove('hidden');
        if (innerSearch) innerSearch.value = '';
        dropdown?.classList.add('hidden');
        if (typeof setDefaultConc === 'function') setDefaultConc();
      });

      document.getElementById('innerSearchBox')?.addEventListener('input', event => {
        const query = event.target.value.trim().toLowerCase();
        option.classList.toggle('hidden', Boolean(query) && !('icunes dexmedetomidine dexmedetomidin').includes(query));
      });
    }

    if (typeof calculateBB === 'function' && !window.__zedIcunesCalculatePatched) {
      const originalCalculateBB = calculateBB;
      calculateBB = function () {
        if (typeof selectedDrug !== 'function' || selectedDrug() !== 'Icunes') {
          return originalCalculateBB();
        }

        const result = document.getElementById('result');
        const concentration = getActiveConcentrationBB('Icunes');
        const weight = parseFloat(document.getElementById('weightInput')?.value);
        const dose = parseFloat(document.getElementById('doseInputBB')?.value);

        if (!concentration || !Number.isFinite(concentration)) {
          result.innerHTML = "<p class='text-red-600'>Konsentrasi Icunes belum diatur dengan benar.</p>";
          return;
        }
        if (!Number.isFinite(weight) || weight <= 0) {
          result.innerHTML = "<p class='text-red-600'>Masukkan berat badan yang valid.</p>";
          return;
        }

        const concentrationLabel = typeof getConcentrationLabelBB === 'function'
          ? getConcentrationLabelBB('Icunes')
          : '1 ampul (200 mcg/50 ml)';

        if (!Number.isFinite(dose) || dose <= 0) {
          const maintenanceDoses = [0.2, 0.3, 0.4, 0.5, 0.6, 0.7];
          const rows = maintenanceDoses.map(maintenanceDose => {
            const mlHour = (maintenanceDose * weight) / concentration;
            return `<tr>
              <td>${maintenanceDose.toFixed(1)} mcg/kgBB/jam</td>
              <td>${mlHour.toFixed(2)} ml/jam</td>
            </tr>`;
          }).join('');

          result.innerHTML = `
            <h3 class='font-semibold mb-1'>Icunes / Dexmedetomidine</h3>
            <p class='text-xs'>BB: <b>${weight} kg</b></p>
            <p class='text-xs'>Pengenceran: <b>${concentrationLabel}</b></p>
            <p class='text-xs'>Konsentrasi: <b>${concentration.toFixed(2)} mcg/ml</b></p>
            <hr class='my-2'>
            <p class='mb-2 text-xs font-bold uppercase tracking-wider text-blue-600'>Rentang dosis pemeliharaan</p>
            <table class='result-table'>
              <thead><tr><th>Dosis</th><th>Kecepatan</th></tr></thead>
              <tbody>${rows}</tbody>
            </table>
            <p class='mt-3 text-xs leading-5 text-slate-500'>Rentang referensi: 0,2–0,7 mcg/kgBB/jam. Sesuaikan laju infus untuk mencapai efek klinis yang diinginkan serta ikuti protokol fasilitas dan instruksi dokter.</p>`;
          return;
        }

        const mlHour = (dose * weight) / concentration;
        result.innerHTML = `
          <h3 class='font-semibold mb-1'>Icunes / Dexmedetomidine</h3>
          <p class='text-xs'>BB: <b>${weight} kg</b></p>
          <p class='text-xs'>Dosis: <b>${dose} mcg/kgBB/jam</b></p>
          <p class='text-xs'>Pengenceran: <b>${concentrationLabel}</b></p>
          <p class='text-xs'>Konsentrasi: <b>${concentration.toFixed(2)} mcg/ml</b></p>
          <hr class='my-2'>
          <div class='rounded-xl bg-blue-50 p-4'>
            <p class='text-xs font-bold uppercase tracking-wider text-blue-600'>Kecepatan syringe pump</p>
            <p class='mt-2 text-2xl font-bold text-blue-700'>${mlHour.toFixed(2)} ml/jam</p>
          </div>
          <p class='mt-3 text-xs leading-5 text-slate-500'>Rumus: dosis mcg/kgBB/jam × BB ÷ konsentrasi mcg/ml.</p>`;
      };
      window.__zedIcunesCalculatePatched = true;
    }
  }

  if (document.readyState === 'complete') initIcunes();
  else window.addEventListener('load', initIcunes, { once: true });
})();