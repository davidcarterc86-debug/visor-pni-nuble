'use strict';
const D=window.PNI_DATA;
if(!D) throw new Error('Falta datos_mensuales.js; conservar todos los archivos juntos.');
const idMap={"grupo": "group", "formula": "formulation", "dosis": "dose", "anio": "year", "provincia": "province", "comuna": "commune", "ambito": "scope", "comunas": "communesCount", "promedio": "avg", "mensual": "monthly", "exportar": "export"};
const $=id=>document.getElementById(idMap[id]||id),fmt=n=>Math.round(n).toLocaleString('es-CL');
const escapeHtml=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let currentRows=[],lastResult=null;
const ALL='*',months=['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
function options(el,values,selected){el.innerHTML='';for(const x of values){const [value,label]=Array.isArray(x)?x:[x,x];const o=document.createElement('option');o.value=value;o.textContent=label;el.appendChild(o)}if(selected!==undefined&&values.some(x=>(Array.isArray(x)?x[0]:x)===selected))el.value=selected;}
const sorted=a=>[...new Set(a)].sort((a,b)=>a.localeCompare(b,'es'));
options($('grupo'),[[ALL,'Todos los productos'],...sorted(D.classes.map(c=>c[0]))],ALL);
const years=Object.keys(D.lastMonth).map(Number).sort((a,b)=>a-b);
options($('anio'),years.slice().reverse().map(String),String(years.at(-1)));
const dosesByGroup=new Map(),availableDoses=new Set();
for(const [,cl,dose] of D.rows){const group=D.classes[cl][0];if(!dosesByGroup.has(group))dosesByGroup.set(group,new Set());dosesByGroup.get(group).add(dose);availableDoses.add(dose);}
function refreshDoses(){const prior=$('dosis').value,group=$('grupo').value,valid=group===ALL?availableDoses:(dosesByGroup.get(group)||new Set());options($('dosis'),[[ALL,'Todas las dosis'],...D.doses.flatMap((d,i)=>valid.has(i)?[[String(i),d||'(Dosis vacia)']]:[])],prior);}

options($('provincia'),[[ALL,'Todas'],...sorted(D.communes.map(c=>c[2]))],ALL);
$('ambito').value='Todos';
function formulas(){const old=$('formula').value,g=$('grupo').value;options($('formula'),[[ALL,'Todas'],...sorted(D.classes.filter(c=>g===ALL||c[0]===g).map(c=>c[1]))],old);}
function comunas(){const old=$('comuna').value,p=$('provincia').value;options($('comuna'),[[ALL,'Todas'],...D.communes.map((c,i)=>[String(i),c]).filter(([i,c])=>p===ALL||c[2]===p).sort((a,b)=>a[1][1].localeCompare(b[1][1],'es')).map(([i,c])=>[i,c[1]+' ('+c[0]+')'])],old);}
function state(){return {year:+$('anio').value,group:$('grupo').value,formula:$('formula').value,dose:$('dosis').value,province:$('provincia').value,commune:$('comuna').value,scope:$('ambito').value};}
function compute(s){
 const limitMonth=D.lastMonth[s.year],annual=Array(years.length).fill(0),monthly=Array(limitMonth).fill(0),counts=Array(D.communes.length).fill(0);
 const classOK=D.classes.map(c=>(s.group===ALL||c[0]===s.group)&&(s.formula===ALL||c[1]===s.formula)&&(s.scope==='Todos'||c[2]===s.scope));
 const communeOK=D.communes.map((c,i)=>(s.province===ALL||c[2]===s.province)&&(s.commune===ALL||String(i)===s.commune));
 for(const [ym,cl,do_,co,n] of D.rows){
  if(!classOK[cl]||!communeOK[co]||(s.dose!==ALL&&String(do_)!==s.dose))continue;
  const y=+ym.slice(0,4),m=+ym.slice(5)-1;annual[years.indexOf(y)]+=n;
  if(y===s.year){monthly[m]+=n;counts[co]+=n}
 }
 const total=monthly.reduce((a,b)=>a+b,0);
 const rows=D.communes.map((c,i)=>({code:c[0],c:c[1],p:c[2],n:counts[i]})).filter((r,i)=>communeOK[i]);
 const provinces=new Map();for(const r of rows)provinces.set(r.p,(provinces.get(r.p)||0)+r.n);
 return {cut:String(limitMonth).padStart(2,'0'),annual,monthly,total,rows,provinces,active:rows.filter(r=>r.n>0).length};
}
function tooltipPeriod(id,i,label){
 const y=id==='annual'?+label:state().year;
 if(id==='annual')return label+' | enero a '+months[D.lastMonth[y]-1]+(D.completeMonths[y]<D.lastMonth[y]?' (periodo no acreditado como completo)':'');
 return y+'-'+String(i+1).padStart(2,'0')+(D.completeMonths[y]<i+1?' (completitud no acreditada)':'');
}
function svgChart(id,values,labels){const el=$(id),W=600,H=250,L=54,R=18,T=28,B=35,w=W-L-R,h=H-T-B,max=Math.max(1,...values)*1.16;let s='';for(let j=0;j<=4;j++){const y=T+h-j*h/4;s+=`<line class="gridline" x1="${L}" x2="${W-R}" y1="${y}" y2="${y}"/><text x="${L-8}" y="${y+4}" text-anchor="end">${fmt(max*j/4)}</text>`}const x=i=>L+(labels.length===1?w/2:i*w/(labels.length-1)),y=v=>T+h-v/max*h;s+=`<polyline points="${values.map((v,i)=>x(i)+','+y(v)).join(' ')}" fill="none" stroke="#0872da" stroke-width="3"/>`;values.forEach((v,i)=>s+=`<circle cx="${x(i)}" cy="${y(v)}" r="3.8" fill="#0872da"><title>${escapeHtml(tooltipPeriod(id,i,labels[i]))} | ${fmt(v)} registros</title></circle>`);labels.forEach((v,i)=>{if(labels.length>18&&i%4!==0)return;s+=`<text x="${x(i)}" y="${H-10}" text-anchor="middle">${v}</text>`});el.innerHTML=s}

let tableSort='value',tableDesc=true;
function render(){const s=state(),r=compute(s);lastResult=r;
 const rangeBox=document.getElementById('rangeYears');if(rangeBox)rangeBox.textContent=years[0]+'-'+years.at(-1);
 const latest=String(years.at(-1)),cut=D.cutDates?.[latest]||latest+'-'+String(D.lastMonth[latest]).padStart(2,'0');
 const cutBox=document.querySelector('.cut');if(cutBox)cutBox.textContent='DATOS REALES | CORTE OBSERVADO '+cut;
 const notice=document.querySelector('.notice');if(notice)notice.textContent='Corte observado: '+cut+'. Completitud solo acreditada mediante evidencia de extraccion; totales por ano y meses observados.';

 $('total').textContent=fmt(r.total);
 $('period').textContent='Enero a '+months[r.monthly.length-1]+' de '+s.year+(D.completeMonths[s.year]<r.monthly.length?' (completitud del periodo no acreditada)':'');
 $('avg').textContent=fmt(r.total/r.monthly.length);$('communesCount').textContent=r.active+' / '+r.rows.length;
 $('annualCaption').textContent=years[0]+'-'+years.at(-1)+' - totales por ano; se incluyen todos los meses observados';
 svgChart('annual',r.annual,years.map(String));
 $('withinCaption').textContent='Meses de '+s.year+(D.completeMonths[s.year]<r.monthly.length?' - ultimo mes parcial':'');
 svgChart('within',r.monthly,months.slice(0,r.monthly.length));
 const largest=Math.max(1,...r.provinces.values());
 $('provinces').innerHTML=[...r.provinces].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0],'es')).map(([name,n])=>'<div class="prow" title="'+escapeHtml(name+' | '+s.year+' | enero a '+months[r.monthly.length-1]+' | '+fmt(n)+' registros')+'"><span>'+escapeHtml(name)+'</span><div class="track"><div class="bar" style="width:'+100*n/largest+'%"></div></div><strong>'+fmt(n)+'</strong></div>').join('');
 const keys={province:'p',name:'c',value:'n'};
 currentRows=[...r.rows].sort((a,b)=>{const k=keys[tableSort];return (typeof a[k]==='number'?a[k]-b[k]:String(a[k]).localeCompare(String(b[k]),'es'))*(tableDesc?-1:1)});
 $('tbody').innerHTML=currentRows.map(x=>'<tr><td>'+escapeHtml(x.p)+'</td><td>'+escapeHtml(x.c)+' ('+escapeHtml(x.code)+')</td><td class="num"><b>'+fmt(x.n)+'</b></td></tr>').join('');
}
$('grupo').addEventListener('change',()=>{formulas();refreshDoses();render()});$('provincia').addEventListener('change',()=>{comunas();render()});
['formula','dosis','anio','comuna','ambito'].forEach(id=>$(id).addEventListener('change',render));

$('exportar').addEventListener('click',()=>{const s=state(),r=lastResult;const cell=x=>'"'+String(x).replace(/"/g,'""')+'"';const head=['Provincia','Codigo comuna','Comuna','Dosis registradas','Ano','Ultimo mes observado','Grupo','Formulacion','Dosis literal','Ambito'];let csv=[head,...currentRows.map(x=>[x.p,x.code,x.c,x.n,s.year,r.cut,s.group===ALL?'Todos':s.group,s.formula===ALL?'Todas':s.formula,s.dose===ALL?'Todas':D.doses[+s.dose],s.scope])].map(a=>a.map(cell).join(';')).join('\r\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}));a.download='PNI_REAL_'+s.year+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)});
formulas();refreshDoses();comunas();render();
window.PNI_TEST={compute,state,render,get result(){return lastResult;}};

document.querySelectorAll('th[data-sort]').forEach(th=>th.addEventListener('click',()=>{const k=th.dataset.sort;tableDesc=tableSort===k?!tableDesc:k==='value';tableSort=k;render()}));
