function toggleMenu(){
  const m=document.getElementById('sideMenu');
  const b=document.getElementById('backdrop');
  const o=!m.classList.contains('-translate-x-full');
  if(o){m.classList.add('-translate-x-full');b.classList.add('hidden')}
  else{m.classList.remove('-translate-x-full');b.classList.remove('hidden')}
}

// Toggles
function toggleNEMode(){toggleDual('ne')}
function toggleNicaMode(){toggleDual('nica')}
function toggleDual(prefix){
  const wrap=document.getElementById(prefix+"CustomWrapper");
  const sel=document.getElementById(prefix+"Conc");
  const btn=document.getElementById(prefix+"ToggleBtn");
  wrap.classList.toggle("hidden");
  sel.classList.toggle("hidden");
  btn.textContent=wrap.classList.contains("hidden")?"Custom":"Pakai preset";
}

const DRUG_PRESETS={
  "Adrenalin":[
  { label: "4 mg/50 ml", mcgPerMl: 80 },
  { label: "8 mg/50 ml", mcgPerMl: 160 }],
  "Dopamin":[{label:"1 ampul (200 mg/50 ml)",mcgPerMl:4000}],
  "Dobutamin":[{label:"1 ampul (250 mg/50 ml)",mcgPerMl:5000}],
  "Milrinone":[{label:"20 mg/50 ml",mcgPerMl:400}],
  "Herbeser":[{label:"1 ampul (50 mg/50 ml)",mcgPerMl:1000}],
  "NTG_BB":[
  { label:"1 ampul (10 mg/50 ml)", mcgPerMl:200 },
  { label:"5 ampul (50 mg/50 ml)", mcgPerMl:1000 }]
};

function setDefaultConc(){
  hideAllConcWrappers();
  document.getElementById("weightWrapper").classList.remove("hidden");
  const drug=document.getElementById("drugSelect").value;
  const presetArea=document.getElementById("otherPresetArea");
  presetArea.innerHTML="";
  if(!drug)return;

  if(drug==="NE"){document.getElementById("concWrapperNE").classList.remove("hidden");return}
  if(drug==="Nicardipin"){document.getElementById("concWrapperNica").classList.remove("hidden");return}

  document.getElementById("concWrapperOther").classList.remove("hidden");
  document.getElementById("drugNameLabel").textContent=drug;

  if(DRUG_PRESETS[drug]){
    const presets=DRUG_PRESETS[drug];
    const wrap=document.createElement("div");
    wrap.className="flex gap-2";
    const sel=document.createElement("select");
    sel.id="otherPresetSelect";
    sel.className="flex-1 rounded-lg border px-3 py-2 text-sm shadow-sm mt-1";
    presets.forEach(p=>{
      const opt=document.createElement("option");
      opt.value=p.mcgPerMl;
      opt.textContent=p.label;
      sel.appendChild(opt);
    });
    const btn=document.createElement("button");
    btn.type="button";
    btn.id="otherToggleBtn";
    btn.className="rounded-lg border px-3 py-2 text-xs mt-1";
    btn.textContent="Custom";
    btn.onclick=()=>toggleOtherMode(sel,btn);
    wrap.appendChild(sel);wrap.appendChild(btn);
    presetArea.appendChild(wrap);
  }
}

function toggleOtherMode(sel,btn){
  const wrapper=document.getElementById("otherCustomWrapper");
  wrapper.classList.toggle("hidden");
  sel.classList.toggle("hidden");
  btn.textContent=wrapper.classList.contains("hidden")?"Custom":"Pakai preset";
}

function hideAllConcWrappers(){
  ["NE","Nica","Other"].forEach(id=>{
    const el=document.getElementById("concWrapper"+id);
    if(el)el.classList.add("hidden");
  });
  ["ne","nica","other"].forEach(p=>{
    const c=document.getElementById(p+"CustomWrapper");
    const s=document.getElementById(p+"Conc");
    if(c)c.classList.add("hidden");
    if(s)s.classList.remove("hidden");
  });
}

function calculateConcentration(mg,ml){
  if(!mg||!ml)return null;
  return (mg*1000)/ml;
}

function getActiveConcentration(drug){
  if(drug==="NE"){
    const custom=!document.getElementById("neCustomWrapper").classList.contains("hidden");
    if(custom) return calculateConcentration(
      parseFloat(document.getElementById("neCustomDose").value),
      parseFloat(document.getElementById("neCustomVolume").value)
    );
    return parseFloat(document.getElementById("neConc").value);
  }

  if(drug==="Nicardipin"){
    const custom=!document.getElementById("nicaCustomWrapper").classList.contains("hidden");
    if(custom) return calculateConcentration(
      parseFloat(document.getElementById("nicaCustomDose").value),
      parseFloat(document.getElementById("nicaCustomVolume").value)
    );
    return parseFloat(document.getElementById("nicaConc").value);
  }

  const presetSel=document.getElementById("otherPresetSelect");
  if(presetSel&&!presetSel.classList.contains("hidden"))
    return parseFloat(presetSel.value);

  if(!document.getElementById("otherCustomWrapper").classList.contains("hidden"))
    return calculateConcentration(
      parseFloat(document.getElementById("otherCustomDose").value),
      parseFloat(document.getElementById("otherCustomVolume").value)
    );

  return null;
}

function rowHtml(doseText,unit,mlHour){
  return `<tr>
    <td>${doseText} ${unit}</td>
    <td>${mlHour.toFixed(2)} ml/jam</td>
  </tr>`;
}

function calculate(){
  const drug=document.getElementById("drugSelect").value;
  const result=document.getElementById("result");
  result.innerHTML="";

  if(!drug)return result.innerHTML="<p class='text-red-600'>Silakan pilih obat.</p>";

  const conc=getActiveConcentration(drug);
  if(!conc)return result.innerHTML="<p class='text-red-600'>Isi konsentrasi dengan benar.</p>";

  const weight=parseFloat(document.getElementById("weightInput").value);
  if(!weight||weight<=0)
    return result.innerHTML="<p class='text-red-600'>BB tidak valid.</p>";

  const concLabel = getConcentrationLabel(drug);

let html=`<h3 class='font-semibold mb-1'>${drug}</h3>
<p class='text-xs'>BB: <b>${weight} kg</b></p>
<p class='text-xs'>Pengenceran: <b>${concLabel}</b></p>
<p class='text-xs'>Konsentrasi: <b>${conc.toFixed(2)} mcg/ml</b></p>
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

  let doses=[];
  if(drug==="NE"){
    for(let d=0.01;d<=0.1;d+=0.01)doses.push(d);
    for(let d=0.2;d<=2.000001;d+=0.1)doses.push(d);
  } else if(drug==="Adrenalin"){
    for(let d=0.05;d<=0.6;d+=0.05)doses.push(d);
    for(let d=0.7;d<=2.000001;d+=0.1)doses.push(d);
  } else if(["Dopamin","Dobutamin"].includes(drug)){
    for(let d=1;d<=20;d++)doses.push(d);
  } else if(drug==="Milrinone"){
    doses=[0.1,0.375,0.5,0.75,1,1.25,1.5,1.75,2];
  } else if(drug==="Herbeser"){
    doses=[0.5,1,1.5,2,2.5,3,3.5,4,4.5,5,5.5,6,6.5,7,7.5,8,8.5,9,9.5,10];
  } else if(drug==="NTG_BB"){
    doses=[0.25,0.5,0.6,0.75,1,1.25,1.5,1.75,2,2.25,2.5,2.75,3];
  } else {
    for(let d=0.5;d<=10;d+=0.5)doses.push(d);
  }

  doses.forEach(d=>{
    const mlHour=(d*weight*60)/conc;
    html+=rowHtml(Number(d.toFixed(3)),"mcg/kg/menit",mlHour);
  });
  html += `</tbody></table>`;
  result.innerHTML=html;
}

function printResultOnly(){
  const hasil=document.getElementById("result").innerHTML.trim();
  if(!hasil)return alert("Belum ada hasil.");

  const w=window.open("", "_blank","width=800,height=600");

  w.document.write(`<!DOCTYPE html>
<html>
<head>
<meta charset='utf-8'>
<title>Print</title>

<style>
@media print {

  body{
    font-size: 14px;
    padding: 5px;
    width: 100mm; /* 🔥 KUNCI: batasi lebar seperti struk */
  }

  .result-table{
    width: 100%;
    table-layout: fixed; /* 🔥 biar gak melebar liar */
    border-collapse: collapse;
    font-size: 14px;
  }

  .result-table th,
  .result-table td{
    border: 1px solid #000;
    padding: 2px 4px; /* kecilin */
    word-wrap: break-word; /* biar gak maksa melebar */
  }

  .result-table td:first-child{
    width: 55%;
  }

  .result-table td:last-child{
    width: 45%;
    text-align: right;
  }

  h3{
    font-size: 11px;
    margin-bottom: 2px;
  }

  p{
    margin: 1px 0;
  }

  .footer{
    font-size: 9px;
    text-align: right;
  }
}

</style>

</head>
<body>

${hasil}

<div class="footer">
  Generated by ZED Kalkulator
</div>

</body>
</html>`);

  w.document.close(); // penting
  w.print();
}

document.addEventListener("DOMContentLoaded",setDefaultConc);
  let deferredPrompt;
  const installBtn = document.getElementById("installBtn");

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installBtn.classList.remove("hidden");
  });

  installBtn.addEventListener("click", async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      installBtn.classList.add("hidden");
    }

    deferredPrompt = null;
  });

  function getConcentrationLabel(drug){
  if(drug==="NE"){
    if(!document.getElementById("neConc").classList.contains("hidden")){
      return document.getElementById("neConc").selectedOptions[0].text;
    } else {
      return "Custom: " + 
        document.getElementById("neCustomDose").value + " mg / " +
        document.getElementById("neCustomVolume").value + " ml";
    }
  }

  if(drug==="Nicardipin"){
    if(!document.getElementById("nicaConc").classList.contains("hidden")){
      return document.getElementById("nicaConc").selectedOptions[0].text;
    } else {
      return "Custom: " + 
        document.getElementById("nicaCustomDose").value + " mg / " +
        document.getElementById("nicaCustomVolume").value + " ml";
    }
  }

  const presetSel=document.getElementById("otherPresetSelect");
  if(presetSel && !presetSel.classList.contains("hidden")){
    return presetSel.selectedOptions[0].text;
  }

  return "Custom: " + 
    document.getElementById("otherCustomDose").value + " mg / " +
    document.getElementById("otherCustomVolume").value + " ml";
}
