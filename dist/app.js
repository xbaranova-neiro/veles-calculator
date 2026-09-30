import {catalog,initialPrices,calculate} from './model.mjs';
const $=id=>document.getElementById(id),form=$('calculator'),prices={...initialPrices};
const money=n=>new Intl.NumberFormat('ru-RU',{maximumFractionDigits:0}).format(n)+' ₽';
const measure=n=>new Intl.NumberFormat('ru-RU',{maximumFractionDigits:1}).format(n);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let current;
function state(){return Object.fromEntries([...form.elements].filter(x=>x.name).map(x=>[x.name,x.type==='checkbox'?x.checked:x.value]))}
function update(){const s=state();current=calculate(s,prices);const r=current;
 $('footprint').textContent=measure(r.footprint)+' м²';$('total-area').textContent=measure(r.area)+' м²';$('perimeter').textContent=measure(r.perimeter)+' м';$('roof-area').textContent=measure(r.roof)+' м²';
 $('total').textContent=money(r.total);$('per-m').textContent=r.area>0?money(r.total/r.area)+' / м² общей площади':'';
 $('result-title').textContent=r.missing.length?'Учтённая часть стоимости':'Предварительная стоимость';
 $('breakdown').innerHTML=(r.groups||[]).filter(([name])=>name!=='Надбавка за ипотеку').map(([name,value])=>`<div class="break-row"><span>${esc(name)}</span><strong>${money(value)}</strong></div>`).join('');
 $('mortgage-percent-label').textContent=Number.isFinite(r.mortgagePercent)?measure(r.mortgagePercent)+'%':'по прайсу';
 $('mortgage-result').textContent=!s.mortgageEnabled?'Не выбрана':r.mortgage===null?'Укажите процент в прайсе':'+'+money(r.mortgageExtra)+' · '+measure(r.mortgagePercent)+'%';
 $('warnings').innerHTML=(r.missing.length?`<strong>Для завершения расчёта</strong><ul>${r.missing.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:'<strong>Выбранные позиции рассчитаны</strong>')+(!$('prices-confirmed').checked?'<p>Перед выдачей КП проверьте и подтвердите цены в разделе «Настроить прайс».</p>':'')+`<details><summary>Допущения расчёта</summary><ul>${r.notes.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></details>`;
 $('floor-area-label').hidden=s.floors==='1';$('separate-fields').hidden=s.interior!=='separate';$('whitebox-info').hidden=s.interior!=='whitebox';
 form.elements.cover.disabled=s.roofShape==='flat';form.elements.roofWarm.disabled=s.roofShape==='flat';
 form.elements.glazingArea.disabled=s.glazing!=='manual';form.elements.lintelCost.disabled=s.lintels!=='separate';
 form.elements.deliveryBase.disabled=s.deliveryIncluded;form.elements.deliveryKm.disabled=s.deliveryIncluded;
 $('proposal-confirmed').checked=false;if($('proposal-dialog').open)proposal();return r;}
function proposal(){const r=current,s=state();const selected=name=>form.elements[name].selectedOptions[0].textContent;
 const complete=!r.missing.length&&$('prices-confirmed').checked;
 const exclusions=[s.facade==='none'?'Отделка фасада':null,s.interior==='none'?'Внутренняя отделка и инженерия':null,s.glazing==='none'?'Остекление':null,s.soffit==='none'?'Подшивка свесов':null,s.gutter==='none'?'Водосток':null].filter(Boolean);
 const html=`<div class="proposal-brand">${esc($('organization').value||'Организация не указана')}</div><p>${esc($('contact').value)}</p><h1>Коммерческое предложение</h1><p>Предварительный расчёт строительства дома · ${new Date().toLocaleDateString('ru-RU')}</p><p>${$('client').value?'Для: '+esc($('client').value)+'<br>':''}${$('object').value?'Объект: '+esc($('object').value):''}</p>${!complete?'<div class="proposal-note">Предпросмотр. Для выдачи КП завершите комплектацию и подтвердите цены.</div>':''}<div class="quote-description"><p>${s.floors==='1'?'Одноэтажный':'Двухэтажный'} дом, ${measure(r.area)} м². Пятно застройки ${measure(r.footprint)} м².</p><ul><li>${esc(selected('foundation'))}</li><li>${esc(selected('wall'))}; чистая площадь наружных стен ${measure(r.wall)} м².</li><li>${esc(selected('roofShape'))}; ${s.roofShape==='flat'?'система плоской кровли':esc(selected('cover'))+'; '+esc(selected('roofWarm'))}. Площадь ${measure(r.roof)} м².</li><li>Остекление ${measure(r.glazing||0)} м²; входные двери ${esc(s.doors)} шт.</li></ul></div><table class="quote-table">${(r.groups||[]).map(([n,v])=>`<tr><td>${esc(n)}</td><td>${money(v)}</td></tr>`).join('')}</table><div class="quote-total">${r.missing.length?'Учтённая часть':s.mortgageEnabled?'С ипотекой':'Без ипотеки'}: ${money(r.total)}</div><p>Условия оплаты: ${s.mortgageEnabled?'ипотека':'без ипотеки'}.</p>${r.missing.length?`<div class="proposal-note">Требует уточнения:<ul>${r.missing.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>`:''}<div class="quote-description">${exclusions.length?`<p>Не включено в выбранную комплектацию: ${esc(exclusions.join(', '))}.</p>`:''}<p>Допущения:</p><ul>${r.notes.map(x=>`<li>${esc(x)}</li>`).join('')}</ul><p>Ориентировочная стоимость по выбранной комплектации. Уточняется после проверки проекта, объёмов и условий строительства. Это коммерческое предложение, не подробная смета и не договор.</p></div>`;
 $('proposal-preview').innerHTML=html;$('print-sheet').innerHTML=html;
 $('print').disabled=!complete||!$('proposal-confirmed').checked||!$('organization').value.trim();
 $('print-reason').textContent=!complete?'Для печати заполните недостающие ставки и объёмы, затем подтвердите прайс.':!$('proposal-confirmed').checked?'Подтвердите комплектацию перед печатью.':'';
}
function open(id){$(id).showModal()}
$('price-fields').innerHTML='<label>Надбавка за ипотеку, %<input type="number" min="0" step="0.01" data-price="mortgagePercent" value="10" placeholder="Укажите процент"></label>'+catalog.map(([key,label,unit,value])=>`<label>${esc(label)} · ₽/${esc(unit)}<input type="number" min="0" step="0.01" data-price="${key}" value="${value??''}" placeholder="Нужно уточнить"></label>`).join('');
form.addEventListener('input',update);form.addEventListener('change',update);
$('rates-button').onclick=()=>open('rates-dialog');document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>$(b.dataset.close).close());
$('price-fields').addEventListener('input',e=>{if(!e.target.dataset.price)return;const raw=e.target.value;prices[e.target.dataset.price]=raw===''?null:Number(raw);$('prices-confirmed').checked=false;update()});
$('prices-confirmed').onchange=update;
$('reset').onclick=()=>{if(confirm('Вернуть исходные параметры и прайс? Текущие изменения будут потеряны.')){form.reset();Object.assign(prices,initialPrices);document.querySelectorAll('[data-price]').forEach(i=>i.value=prices[i.dataset.price]??'');$('prices-confirmed').checked=false;update()}};
$('proposal').onclick=()=>{proposal();open('proposal-dialog')};
['organization','client','contact','object'].forEach(id=>$(id).oninput=()=>{$('proposal-confirmed').checked=false;proposal()});$('proposal-confirmed').onchange=proposal;
$('print').onclick=()=>{proposal();if(!$('print').disabled){$('proposal-dialog').close();window.print()}};
update();
// Optional browser-agent integration uses the exact visible state. No server.
if(document.modelContext?.registerTool){const lifecycle=new AbortController();try{Promise.resolve(document.modelContext.registerTool({name:'get_house_calculation',title:'Прочитать текущий расчёт дома',description:'Возвращает текущую предварительную стоимость, недостающие данные и укрупнённые разделы. Ничего не подтверждает и не отправляет.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:true},execute(input){if(!input||Object.keys(input).length)throw new Error('Ожидается пустой объект');return{total:current.total,missing:current.missing,groups:current.groups,pricesConfirmed:$('prices-confirmed').checked}}},{signal:lifecycle.signal})).catch(()=>{});window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true})}catch{}}
