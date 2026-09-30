export const catalog=[
['slab','Плита 300 мм','м²',13334],['usp','УШП','м²',15785],['strip','Ленточный фундамент (укрупнённо)','м² пятна',null],['basement','Цокольный этаж · от','м² пятна',50000],['gas','Стены D400 / 375 мм','м² стен',12400],['customWall','Другой материал наружных стен','м² стен',null],['bearing','Несущие D500 / 250 мм','м² стен',9671],['partition','Перегородки','м² стен',null],['floor','Межэтажное перекрытие','м²',null],['roofBase','Стропильная система / базовый состав','м² скатов',6800],['metal','Металлочерепица / покрытие','м² скатов',5300],['soft','Гибкая черепица / покрытие','м² скатов',7300],['seam','Кликфальц / покрытие','м² скатов',7100],['coldRoof','Холодная кровля, полный выбранный состав','м² скатов',null],['flatRoof','Плоская кровля, полный выбранный состав','м²',null],['windows','Окна 70 мм, двухкамерные','м²',17160],['door','Входная дверь с терморазрывом','шт.',68000],['plasterFacade','Декоративная штукатурка фасада','м²',9100],['brickFacade','Облицовочный кирпич · от','м²',13000],['clinker','Клинкерная плитка','м²',14700],['plasticSoffit','Пластиковые софиты','пог. м',4500],['woodSoffit','Деревянная подшивка','пог. м',6000],['plasticGutter','Пластиковый водосток','пог. м',4300],['metalGutter','Металлический водосток','пог. м',6800],['terrace','Терраса / крыльцо / балкон','м²',25000],['whitebox','White Box, полный пакет','м² дома',26000],['plaster','Штукатурка внутри','м² стен',2650],['screed','Полусухая стяжка','м² пола',2500],['heating','Отопление, предварительная ставка','м² дома',15200],['plumbing','Сантехническая точка (уточнить состав)','точка',25000],['electric','Черновая электрика','м² дома',3600],['ventilation','Приточный клапан КИВ','шт.',10000]];
// A strip foundation needs its own agreed project budget, not a made-up area tariff.
Object.assign(catalog.find(x=>x[0]==='strip'),{1:'Ленточный фундамент: согласованная сумма',2:'комплект'});
export const initialPrices={...Object.fromEntries(catalog.map(([k,,,p])=>[k,p])),mortgagePercent:10};
export const round=n=>Math.round((n+Number.EPSILON)*100)/100;
export function calculate(s,p){
 const missing=[],notes=[],rows=[];const addMissing=x=>{if(!missing.includes(x))missing.push(x)};
 const num=(k,def=null)=>{const raw=s[k];if(raw===''||raw==null)return def;const v=Number(raw);if(!Number.isFinite(v)||v<0){addMissing(`Некорректное число: ${k}`);return def}return v};
 const len=num('length'),width=num('width'),floors=num('floors',1),h1=num('height1',3),h2=num('height2',2.8);
 if(!(len>0&&width>0&&h1>0&&(floors===1||floors===2)&&(floors===1||h2>0)))return{rows:[],missing:['Заполните положительные размеры, высоты и этажность.'],notes:[],total:0,area:0,footprint:0,perimeter:0,roof:0,wall:0,mortgage:null};
 const footprint=num('footprintOverride',len*width),area=num('totalOverride',footprint*floors),perimeter=num('perimeterOverride',2*(len+width));
 if(!(footprint>0&&area>0&&perimeter>0))addMissing('Площади и периметр должны быть больше нуля.');
 const roof=num('roofOverride',footprint*({gable:1.4,hip:1.6,flat:1.05}[s.roofShape]??1.4));
 const gables=num('gableOverride',s.roofShape==='gable'?.3*roof:0);
 const glazing=s.glazing==='none'?0:s.glazing==='manual'?num('glazingArea'):area*Number(s.glazing||15)/100;
 if(glazing===null)addMissing('Укажите площадь остекления.');
 const windowsOpening=s.glazing==='none'?num('windowOpenings',0):(glazing||0);
 const gross=perimeter*(h1+(floors===2?h2:0))+gables,doorArea=num('doorArea',0);
 const wall=num('wallOverride',Math.max(0,gross-windowsOpening-doorArea));
 if(!s.wallOverride&&gross<windowsOpening+doorArea)addMissing('Проёмы больше площади стен. Проверьте размеры.');
 const add=(group,label,qty,key,unit='м²')=>{if(qty==null){addMissing(`Уточните объём: ${label.toLowerCase()}.`);return}if(qty===0)return;if(qty<0||!Number.isFinite(qty)){addMissing(`Некорректный объём: ${label}.`);return}const rate=p[key];if(rate==null||rate===''||!Number.isFinite(Number(rate))||Number(rate)<0){addMissing(`Задайте ставку: ${label.toLowerCase()}.`);return}rows.push({group,label,qty:round(qty),rate:Number(rate),amount:round(qty*Number(rate)),unit})};
 add('Фундамент',catalog.find(x=>x[0]===s.foundation)?.[1]||'Фундамент',s.foundation==='strip'?1:footprint,s.foundation,s.foundation==='strip'?'компл.':'м²');
 if(!(roof>0))addMissing('Площадь кровли должна быть больше нуля.');
 add('Стены и перекрытия',s.wall==='gas'?'Газоблок D400 / 375 мм':'Наружные стены',wall,s.wall);
 add('Стены и перекрытия','Внутренние несущие стены',num('bearingArea',0),'bearing');
 add('Стены и перекрытия','Перегородки',num('partitionArea',.8*area),'partition');
 if(s.partitionArea===''||s.partitionArea==null)notes.push('Перегородки: предварительно 0,8 × общая площадь; замените площадью по плану.');
 if(floors===2){const floorArea=num('floorArea',footprint);add('Стены и перекрытия','Межэтажное перекрытие',floorArea,'floor');if(!(floorArea>0))addMissing('Уточните положительную площадь межэтажного перекрытия.');}
 if(s.lintels==='unknown')addMissing('Уточните, включены ли перемычки в ставку стен.');
 if(s.lintels==='separate'){const cost=num('lintelCost');if(cost===null)addMissing('Укажите стоимость перемычек.');else rows.push({group:'Стены и перекрытия',label:'Перемычки по проекту',qty:1,unit:'компл.',rate:cost,amount:round(cost)})}
 if(s.roofShape==='flat')add('Кровля','Плоская кровля',roof,'flatRoof');
 else if(s.roofWarm==='cold')add('Кровля','Холодная кровля, выбранное покрытие',roof,'coldRoof');
 else{add('Кровля','Стропильная система / базовый состав',roof,'roofBase');add('Кровля',catalog.find(x=>x[0]===s.cover)?.[1]||'Покрытие',roof,s.cover)}
 add('Окна и двери','Остекление',glazing,'windows');add('Окна и двери','Входные двери',num('doors',1),'door','шт.');
 if(s.facade!=='none')add('Фасад','Отделка фасада',num('facadeOverride',wall),s.facade);
 add('Дополнительные работы','Терраса / крыльцо',num('terrace',0),'terrace');
 if(s.soffit!=='none')add('Дополнительные работы','Подшивка свесов',num('soffitLength'),s.soffit,'пог. м');
 if(s.gutter!=='none')add('Дополнительные работы','Водосточная система',num('gutterLength'),s.gutter,'пог. м');
 if(s.interior==='whitebox')add('Отделка и инженерия','White Box',area,'whitebox');
 else if(s.interior==='separate'){
 add('Отделка и инженерия','Штукатурка внутренних стен',num('plasterArea',0),'plaster');add('Отделка и инженерия','Стяжка',num('screedArea',0),'screed');
 if(s.heating)add('Отделка и инженерия','Отопление',area,'heating');if(s.electric)add('Отделка и инженерия','Электрика',area,'electric');
 add('Отделка и инженерия','Сантехника',num('plumbing',0),'plumbing','точка');add('Отделка и инженерия','Приточные клапаны',num('ventilation',0),'ventilation','шт.');}
 if(!s.deliveryIncluded){const base=num('deliveryBase'),km=num('deliveryKm'),distance=num('distance'),trips=num('trips',1),legs=num('legs',1);if(base===null||km===null||distance===null||trips<1||!Number.isInteger(trips)||![1,2].includes(legs))addMissing('Уточните тариф и условия доставки или подтвердите включение в ставки.');else{const amount=round((base+distance*km*legs)*trips);rows.push({group:'Доставка',label:'Доставка',qty:trips,unit:'рейс',rate:round(base+distance*km*legs),amount})}}
 for(const key of ['doors','plumbing','ventilation'])if(!Number.isInteger(num(key,0)))addMissing('Количество дверей, точек и клапанов должно быть целым.');
 if(!s.roofOverride)notes.push('Площадь кровли рассчитана по коэффициенту формы, без обмера скатов.');
 if(!s.gableOverride&&s.roofShape==='gable')notes.push('Фронтоны оценены как 30% площади скатов.');
 if(!s.wallOverride)notes.push('Из наружных стен вычтены указанные оконные и дверные проёмы.');
 if(s.foundation==='basement'||s.facade==='brickFacade')notes.push('Выбрана ставка «от»: результат — предварительная нижняя граница, не фиксированная цена.');
 notes.push('Сечения, армирование и несущую способность подтверждают по проекту.');
 const baseTotal=round(rows.reduce((sum,r)=>sum+r.amount,0));
 const rawPercent=p.mortgagePercent;
 const mortgagePercent=rawPercent!==null&&rawPercent!==undefined&&rawPercent!==''&&Number.isFinite(Number(rawPercent))&&Number(rawPercent)>=0?Number(rawPercent):null;
 let mortgageExtra=0;
 if(s.mortgageEnabled){
  if(mortgagePercent===null)addMissing('Укажите корректную надбавку за ипотеку в прайсе.');
  else{mortgageExtra=round(baseTotal*mortgagePercent/100);rows.push({group:'Надбавка за ипотеку',label:`Ипотека · ${mortgagePercent}%`,qty:1,unit:'компл.',rate:mortgageExtra,amount:mortgageExtra});}
 }
 const total=round(baseTotal+mortgageExtra);
 return{rows,missing,notes,total,baseTotal,mortgageExtra,mortgagePercent,area,footprint,perimeter,roof,wall,glazing,mortgage:s.mortgageEnabled&&mortgagePercent!==null?total:null,groups:Object.entries(rows.reduce((out,r)=>{out[r.group]=round((out[r.group]||0)+r.amount);return out},{}))};
}
