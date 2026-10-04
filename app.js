const KEY="hesabyar_v2";
const PROFILE="hesabyar_profile_v2";
const BACKUP="hesabyar_last_backup_v2";

const categories=["خوراک","خانه","حمل‌ونقل","خرید","تفریح","قبوض","سلامت","آموزش","سایر"];
const catIcons={"خوراک":"🍔","خانه":"🏠","حمل‌ونقل":"🚗","خرید":"🛍️","تفریح":"🎮","قبوض":"💡","سلامت":"💊","آموزش":"📚","سایر":"📦"};
const catColors=["#5b8cff","#35d6ff","#b46cff","#ff6f91","#43e6a5","#ffd166","#8e9eff","#ff9f68","#9da8bd"];

const TOUR="hesabyar_tour_done_v2";
function lsGet(k){try{return localStorage.getItem(k)}catch{return null}}
function lsSet(k,v){try{localStorage.setItem(k,v);return true}catch{return false}}

let state=loadJSON(KEY,{transactions:[]});
if(!state || !Array.isArray(state.transactions)) state={transactions:[]};
state.transactions=sanitizeTx(state.transactions);

let profile=loadJSON(PROFILE,{name:"",username:"",avatar:""});
if(!profile || typeof profile!=="object" || Array.isArray(profile)) profile={name:"",username:"",avatar:""};
profile={name:String(profile.name||""),username:String(profile.username||""),avatar:String(profile.avatar||"")};

let currentMonth=jalaliMonth(new Date());
let reportMonth=currentMonth;
let searchFilter="all";
let editingId=null;

const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];

function loadJSON(key,fallback){
  try{return JSON.parse(lsGet(key)||"")||fallback}catch{return fallback}
}
let storageWarned=false;
function saveState(){
  const ok=lsSet(KEY,JSON.stringify(state));
  if(!ok&&!storageWarned){storageWarned=true;toast("⚠️ ذخیره‌سازی ممکن نیست؛ حافظه پر است یا مرورگر در حالت خصوصی است. بکاپ بگیر.")}
  return ok;
}
function fy(n){return String(n).replace(/\d/g,d=>"۰۱۲۳۴۵۶۷۸۹"[d])}
function fa(n){return Number(n||0).toLocaleString("fa-IR")}
function money(n){return fa(Math.round(Number(n)||0))}
function digits(v){return String(v??"").replace(/[۰-۹]/g,d=>"۰۱۲۳۴۵۶۷۸۹".indexOf(d)).replace(/[٠-٩]/g,d=>"٠١٢٣٤٥٦٧٨٩".indexOf(d))}
function normText(v){return digits(String(v??"")).replace(/ي/g,"ی").replace(/ك/g,"ک").replace(/[‌‏‎]/g," ").replace(/\s+/g," ").toLowerCase().trim()}
function newId(){
  try{if(crypto&&crypto.randomUUID)return crypto.randomUUID()}catch{}
  return Date.now().toString(36)+Math.random().toString(36).slice(2,10);
}
function sanitizeTx(list){
  const seen=new Set(),out=[];
  (Array.isArray(list)?list:[]).forEach(raw=>{
    if(!raw||typeof raw!=="object")return;
    const type=raw.type==="income"?"income":raw.type==="expense"?"expense":null;
    if(!type)return;
    const date=normalizeDate(raw.date);
    if(!date)return;
    let id=String(raw.id||"");
    if(!id||seen.has(id))id=newId();
    seen.add(id);
    const items=type==="expense"&&Array.isArray(raw.items)?raw.items.filter(i=>i&&typeof i==="object").map(i=>({name:String(i.name||"").trim(),price:Math.max(0,Math.round(Number(i.price)||0))})).filter(i=>i.name):[];
    let amount=Math.max(0,Math.round(Number(raw.amount)||0));
    if(type==="expense"&&items.length)amount=items.reduce((s,i)=>s+i.price,0);
    const createdAt=Number(raw.createdAt)||Date.now();
    out.push({id,type,title:String(raw.title||"").trim(),category:type==="expense"?(categories.includes(raw.category)?raw.category:"سایر"):"درآمد",date,amount,items,note:String(raw.note||""),createdAt,updatedAt:Number(raw.updatedAt)||createdAt});
  });
  return out;
}
function parseMoney(v){return Number(digits(String(v??"")).replace(/[^\d]/g,""))||0}
function moneyInputValue(v){return Number(v||0).toLocaleString("en-US")}
function esc(s=""){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}

function toast(message){
  const e=$("#toast"); if(!e)return;
  e.textContent=message;
  e.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer=setTimeout(()=>e.classList.remove("show"),2600);
}

function gregorianToJalali(gy,gm,gd){
  const gdm=[0,31,59,90,120,151,181,212,243,273,304,334];
  let jy=gy>1600?979:0;
  gy-=gy>1600?1600:621;
  const gy2=gm>2?gy+1:gy;
  let days=365*gy+Math.floor((gy2+3)/4)-Math.floor((gy2+99)/100)+Math.floor((gy2+399)/400)-80+gd+gdm[gm-1];
  jy+=33*Math.floor(days/12053); days%=12053;
  jy+=4*Math.floor(days/1461); days%=1461;
  if(days>365){jy+=Math.floor((days-1)/365);days=(days-1)%365}
  const jm=days<186?1+Math.floor(days/31):7+Math.floor((days-186)/30);
  const jd=1+(days<186?days%31:(days-186)%30);
  return [jy,jm,jd];
}
function jalaliNow(d=new Date()){
  const [y,m,day]=gregorianToJalali(d.getFullYear(),d.getMonth()+1,d.getDate());
  return `${y}/${String(m).padStart(2,"0")}/${String(day).padStart(2,"0")}`;
}
function jalaliMonth(d=new Date()){
  const [y,m]=gregorianToJalali(d.getFullYear(),d.getMonth()+1,d.getDate());
  return `${y}/${String(m).padStart(2,"0")}`;
}
const jmNames=["فروردین","اردیبهشت","خرداد","تیر","مرداد","شهریور","مهر","آبان","آذر","دی","بهمن","اسفند"];
function prettyDate(s){
  if(!s)return "";
  const [y,m,d]=s.split("/").map(Number);
  return m>=1&&m<=12?`${fy(d)} ${jmNames[m-1]} ${fy(y)}`:s;
}
function monthLabel(m){
  const [y,mo]=m.split("/").map(Number);
  return `${jmNames[mo-1]} ${fy(y)}`;
}
function monthShift(m,delta){
  let [y,mo]=m.split("/").map(Number);
  mo+=delta;
  if(mo<1){mo=12;y--}
  if(mo>12){mo=1;y++}
  return `${y}/${String(mo).padStart(2,"0")}`;
}
function normalizeDate(v){
  const clean=digits(String(v||"").trim()).replace(/[-.٫،]/g,"/").replace(/\s+/g,"");
  if(!/^\d{3,4}\/\d{1,2}\/\d{1,2}$/.test(clean))return null;
  const a=clean.split("/").map(Number);
  if(a[0]<1300||a[0]>1700||a[1]<1||a[1]>12||a[2]<1)return null;
  const leap=[1,5,9,13,17,22,26,30].includes(a[0]%33);
  const max=a[1]<=6?31:a[1]<=11?30:(leap?30:29);
  if(a[2]>max)return null;
  return `${a[0]}/${String(a[1]).padStart(2,"0")}/${String(a[2]).padStart(2,"0")}`;
}

function txMonth(t){return String(t.date||"").slice(0,7)}
function getMonthTx(month){return state.transactions.filter(t=>txMonth(t)===month)}
function sums(month){
  const a=getMonthTx(month);
  return {
    income:a.filter(t=>t.type==="income").reduce((s,t)=>s+Number(t.amount||0),0),
    expense:a.filter(t=>t.type==="expense").reduce((s,t)=>s+Number(t.amount||0),0)
  };
}

function renderAll(){
  renderHeader();
  renderHome();
  renderReports();
  renderSearch();
  renderSettings();
}

function renderHeader(){
  const name=profile.name||"کاربر";
  const avatar=Array.from(profile.avatar||name[0]||"B").slice(0,2).join("");
  if($("#greeting"))$("#greeting").textContent=`سلام ${name} 👋`;
  if($("#avatarText"))$("#avatarText").textContent=avatar;
}

function renderHome(){
  const tx=state.transactions;
  const month=getMonthTx(currentMonth);
  const inc=month.filter(t=>t.type==="income").reduce((s,t)=>s+Number(t.amount||0),0);
  const exp=month.filter(t=>t.type==="expense").reduce((s,t)=>s+Number(t.amount||0),0);
  const totalInc=tx.filter(t=>t.type==="income").reduce((s,t)=>s+Number(t.amount||0),0);
  const totalExp=tx.filter(t=>t.type==="expense").reduce((s,t)=>s+Number(t.amount||0),0);

  if($("#balance"))$("#balance").textContent=money(totalInc-totalExp);
  if($("#homeIncome"))$("#homeIncome").textContent=money(inc);
  if($("#homeExpense"))$("#homeExpense").textContent=money(exp);
  if($("#monthTitle"))$("#monthTitle").textContent=monthLabel(currentMonth);

  renderDonut(currentMonth);

  const recent=[...tx].sort((a,b)=>(b.updatedAt||b.createdAt||0)-(a.updatedAt||a.createdAt||0)).slice(0,6);
  const box=$("#recentList");
  if(box)box.innerHTML=recent.length?recent.map(txHTML).join(""):`<div class="empty">هنوز تراکنشی ثبت نشده</div>`;
  bindTxClicks();
  renderQuickSearch();
  renderBackupNote();
}

function renderDonut(month){
  const exp=getMonthTx(month).filter(t=>t.type==="expense");
  const total=exp.reduce((s,t)=>s+Number(t.amount||0),0);
  if($("#donutTotal"))$("#donutTotal").textContent=money(total);
  const by={};
  exp.forEach(t=>by[t.category||"سایر"]=(by[t.category||"سایر"]||0)+Number(t.amount||0));
  const arr=Object.entries(by).sort((a,b)=>b[1]-a[1]);
  let angle=0; const parts=[];
  arr.forEach(([,v],i)=>{
    const p=total?v/total*360:0;
    parts.push(`${catColors[i%catColors.length]} ${angle}deg ${angle+p}deg`);
    angle+=p;
  });
  if($("#donut"))$("#donut").style.background=parts.length?`conic-gradient(${parts.join(",")})`:"conic-gradient(#273149 0 360deg)";
  if($("#legend"))$("#legend").innerHTML=arr.length?
    arr.map(([k,v],i)=>`<div class="legend-row" title="${esc(k)}"><i class="dot" style="background:${catColors[i%catColors.length]}"></i><span>${catIcons[k]||"📦"} ${esc(k)}</span><em>${money(v)} تومان</em></div>`).join(""):
    `<div class="empty">برای این ماه هنوز هزینه‌ای ثبت نشده</div>`;
}

function txHTML(t){
  const income=t.type==="income";
  const items=(t.items||[]).slice(0,3);
  const extra=(t.items||[]).length-3;
  const edited=Number(t.updatedAt||0)>Number(t.createdAt||0)+1000;
  return `<article class="transaction ${income?"income":"expense"}" data-id="${esc(t.id)}">
    <div class="tr-main">
      <div class="tr-icon">${income?"💰":catIcons[t.category]||"🧾"}</div>
      <div class="tr-info">
        <strong>${esc(t.title||"بدون عنوان")}</strong>
        <small>${income?"درآمد":`${catIcons[t.category]||"🧾"} ${esc(t.category||"سایر")}`} • ${prettyDate(t.date)}${edited?" • ✏️ ویرایش شده":""}</small>
      </div>
      <div class="tr-amount ${income?"income-text":"expense-text"}">${income?"+":"−"} ${money(t.amount)}<small> تومان</small></div>
    </div>
    ${!income&&items.length?`<div class="item-preview">${items.map(i=>`<span>${esc(i.name)} <b>${money(i.price)}</b></span>`).join("")}${extra>0?`<span class="more-items">+${fa(extra)} قلم</span>`:""}</div>`:""}
    <div class="tx-actions">
      ${!income&&t.items?.length?`<button type="button" class="view-items" data-view="${esc(t.id)}">مشاهده اقلام</button>`:""}
      <button type="button" class="edit-items" data-edit="${esc(t.id)}">ویرایش</button>
    </div>
  </article>`;
}
function bindTxClicks(){
  $$("[data-view]").forEach(b=>b.onclick=e=>{e.stopPropagation();openDetails(b.dataset.view)});
  $$("[data-edit]").forEach(b=>b.onclick=e=>{e.stopPropagation();editTransaction(b.dataset.edit)});
  $$(".transaction").forEach(card=>card.onclick=e=>{
    if(e.target.closest("button"))return;
    openDetails(card.dataset.id);
  });
}
function editTransaction(id){
  const t=state.transactions.find(x=>x.id===id);
  if(!t)return;
  openTxForm(t.type,t);
}
function openDetails(id){
  const t=state.transactions.find(x=>x.id===id);
  if(!t)return;
  const items=t.items||[];
  openModal(`<div class="modal-head">
    <div><small>${t.type==="income"?"درآمد":"هزینه"}</small><h2>${esc(t.title)}</h2></div>
    <button class="close" data-close>×</button>
  </div>
  <div class="detail-grid">
    <div><small>تاریخ</small><b>${prettyDate(t.date)}</b></div>
    <div><small>مبلغ کل</small><b class="${t.type==="income"?"income-text":"expense-text"}">${money(t.amount)} تومان</b></div>
    ${t.type==="expense"?`<div><small>دسته‌بندی</small><b>${catIcons[t.category]||"📦"} ${esc(t.category||"سایر")}</b></div>`:""}
  </div>
  ${items.length?`<div class="full-items"><h3>اقلام خرید</h3>${items.map((i,n)=>`<div class="full-item"><span>${fa(n+1)}. ${esc(i.name)}</span><b>${money(i.price)} تومان</b></div>`).join("")}<div class="full-total"><span>جمع کل اقلام</span><b>${money(items.reduce((s,i)=>s+Number(i.price||0),0))} تومان</b></div></div>`:""}
  ${t.note?`<div class="note-box">${esc(t.note)}</div>`:""}
  <div class="detail-actions">
    <button class="ghost" id="editTx">ویرایش</button>
    <button class="primary danger-btn" id="deleteTx">حذف</button>
  </div>`);
  $("#editTx").onclick=()=>{closeModal();editTransaction(t.id)};
  $("#deleteTx").onclick=()=>{
    if(!confirm("این تراکنش حذف شود؟"))return;
    state.transactions=state.transactions.filter(x=>x.id!==t.id);
    saveState();closeModal();renderAll();toast("تراکنش حذف شد");
  };
}

function openTxForm(type="expense",edit=null,draft={}){
  draft=draft||{};
  editingId=edit?.id||null;
  const income=type==="income";
  const oldItems=edit?.items?.length?edit.items:[{name:"",price:0}];

  openModal(`<div class="modal-head">
    <div><small>${income?"پول وارد شده":"پول خرج شده"}</small><h2>${edit?"ویرایش":"ثبت "+(income?"درآمد":"هزینه")}</h2></div>
    <button class="close" data-close>×</button>
  </div>
  <form id="txForm" class="form">
    <div class="seg">
      <button type="button" class="${income?"active":""}" data-type="income">＋ درآمد</button>
      <button type="button" class="${!income?"active":""}" data-type="expense">− هزینه</button>
    </div>

    <div class="field">
      <label>${income?"منبع درآمد":"فروشگاه / محل خرید"}</label>
      <input id="txTitle" required maxlength="80" placeholder="${income?"مثلاً حقوق، فروش، هدیه":"مثلاً مغازه رسول"}" value="${esc(draft.title??edit?.title??"")}">
    </div>

    ${!income?`<div class="field">
      <label>دسته‌بندی</label>
      <select id="txCategory" title="دسته‌بندی را انتخاب کنید">
        ${categories.map(c=>`<option value="${esc(c)}" ${(draft.category??edit?.category)===c?"selected":""}>${catIcons[c]} ${esc(c)}</option>`).join("")}
      </select>
    </div>
    <div class="field">
      <label>اقلام خریداری‌شده</label>
      <div class="items-box" id="itemsBox">
        ${oldItems.map(itemRow).join("")}
        <button type="button" class="add-item" id="addItem">＋ افزودن قلم</button>
      </div>
    </div>`:""}

    <div class="field">
      <label>تاریخ</label>
      <input id="txDate" type="text" inputmode="numeric" maxlength="10" placeholder="۱۴۰۵/۰۶/۱۲" value="${esc(draft.date??edit?.date??jalaliNow())}">
    </div>

    ${income?`<div class="field">
      <label>مبلغ درآمد</label>
      <input id="txAmount" class="money-input" inputmode="numeric" required value="${edit?.amount?moneyInputValue(edit.amount):""}" data-raw="${edit?.amount||0}" placeholder="۳۰,۰۰۰,۰۰۰">
    </div>`:`<div class="total-box"><span>جمع خودکار اقلام</span><strong id="autoTotal">۰ تومان</strong></div>`}

    <div class="field">
      <label>توضیحات</label>
      <textarea id="txNote" placeholder="توضیحات این تراکنش...">${esc(draft.note??edit?.note??"")}</textarea>
    </div>
    <button class="primary" type="submit">${edit?"ذخیره تغییرات":"ثبت تراکنش"}</button>
  </form>`);

  $$("[data-type]").forEach(b=>b.onclick=()=>{
    if(b.dataset.type===type)return;
    openTxForm(b.dataset.type,edit,{title:$("#txTitle")?.value,date:$("#txDate")?.value,note:$("#txNote")?.value});
  });

  if(income){
    bindMoneyInput($("#txAmount"));
  }else{
    $("#addItem").onclick=()=>{
      $("#addItem").insertAdjacentHTML("beforebegin",itemRow({name:"",price:0}));
      bindItemEvents();
      $$(".item-row").at(-1)?.querySelector(".item-name")?.focus();
    };
    bindItemEvents();
    updateAutoTotal();
  }

  $("#txDate")?.addEventListener("input",e=>{
    e.target.value=digits(e.target.value).replace(/[^\d/]/g,"").slice(0,10);
  });
  $("#txForm").onsubmit=e=>{
    e.preventDefault();
    submitTx(type,edit?.id||null);
  };
}

function itemRow(i){
  const v=Number(i.price||0);
  return `<div class="item-row">
    <input class="item-name" placeholder="نام قلم" value="${esc(i.name||"")}">
    <input class="item-price money-input" inputmode="numeric" placeholder="مبلغ" value="${v?moneyInputValue(v):""}" data-raw="${v}">
    <button type="button" class="remove-item" title="حذف قلم">×</button>
  </div>`;
}
function bindMoneyInput(el){
  if(!el)return;
  const format=()=>{
    const n=parseMoney(el.value);
    el.dataset.raw=String(n);
    el.value=n?moneyInputValue(n):"";
  };
  el.addEventListener("input",format);
  format();
}
function rawMoney(el){return Number(el?.dataset.raw||parseMoney(el?.value))||0}
function bindItemEvents(){
  $$(".item-price").forEach(bindMoneyInput);
  $$(".item-price").forEach(x=>x.addEventListener("input",updateAutoTotal));
  $$(".item-name").forEach(x=>x.addEventListener("input",updateAutoTotal));
  $$(".remove-item").forEach(x=>x.onclick=()=>{
    const rows=$$(".item-row");
    if(rows.length>1)x.closest(".item-row")?.remove();
    else{
      const row=x.closest(".item-row");
      if(row){row.querySelector(".item-name").value="";row.querySelector(".item-price").value="";row.querySelector(".item-price").dataset.raw="0"}
    }
    updateAutoTotal();
  });
}
function updateAutoTotal(){
  const el=$("#autoTotal"); if(!el)return;
  const total=$$(".item-price").reduce((s,e)=>s+rawMoney(e),0);
  el.textContent=`${money(total)} تومان`;
}

function submitTx(type,id){
  const title=$("#txTitle")?.value.trim();
  const date=normalizeDate($("#txDate")?.value);
  if(!title){toast(type==="income"?"منبع درآمد را وارد کن":"نام فروشگاه را وارد کن");return}
  if(!date){toast("تاریخ را مثل ۱۴۰۵/۰۶/۱۲ وارد کن");return}

  let amount=0,items=[];
  if(type==="expense"){
    const rows=$$(".item-row").map(r=>({
      name:r.querySelector(".item-name")?.value.trim()||"",
      price:rawMoney(r.querySelector(".item-price"))
    })).filter(i=>i.name||i.price);
    if(rows.some(i=>!i.name)){toast("برای همه مبلغ‌ها نام قلم را وارد کن");return}
    items=rows;
    if(!items.length){toast("حداقل یک قلم خرید وارد کن");return}
    if(items.some(i=>!i.price)){toast("برای همه اقلام مبلغ وارد کن");return}
    amount=items.reduce((s,i)=>s+i.price,0);
  }else{
    amount=rawMoney($("#txAmount"));
    if(!amount){toast("مبلغ درآمد را وارد کن");return}
  }

  const old=id?state.transactions.find(t=>t.id===id):null;
  if(id&&!old){toast("این تراکنش دیگر وجود ندارد");closeModal();return}
  const now=Date.now();
  const tx={
    id:id||newId(),
    type,
    title,
    category:type==="expense"?($("#txCategory")?.value||"سایر"):"درآمد",
    date,
    amount,
    items:type==="expense"?items:[],
    note:$("#txNote")?.value.trim()||"",
    createdAt:old?.createdAt||now,
    updatedAt:now
  };

  const prev=state.transactions;
  if(id)state.transactions=prev.map(t=>t.id===id?tx:t);
  else state.transactions=[...prev,tx];

  if(!saveState()){state.transactions=prev;return}
  closeModal();
  renderAll();
  toast(id?"تراکنش با موفقیت ویرایش شد":"تراکنش با موفقیت ثبت شد");
}

function renderQuickSearch(){
  const box=$("#homeSearchResults"),input=$("#homeSearch");
  if(!box||!input)return;
  const q=(input.value||"").trim();
  if(!q){box.innerHTML="";return}
  const result=state.transactions.filter(t=>transactionMatches(t,q)).slice(0,6);
  box.innerHTML=result.length?result.map(txHTML).join(""):`<div class="empty">نتیجه‌ای پیدا نشد</div>`;
  bindTxClicks();
}
function transactionMatches(t,q){
  q=normText(q);
  if(!q)return true;
  const items=(t.items||[]).flatMap(i=>[i.name,String(i.price),Number(i.price||0).toLocaleString("en-US")]);
  const hay=normText([t.title,t.note,t.category,t.type==="income"?"درآمد":"هزینه",t.date,prettyDate(t.date),String(t.amount),Number(t.amount||0).toLocaleString("en-US"),...items].join(" "));
  const qn=q.replace(/[,٬]/g,"");
  return hay.includes(q)||hay.replace(/[,٬]/g,"").includes(qn);
}
function byDateDesc(a,b){return String(b.date).localeCompare(String(a.date))||(b.createdAt||0)-(a.createdAt||0)}

function renderSearch(){
  const q=($("#searchInput")?.value||"").trim();
  let result=state.transactions.filter(t=>transactionMatches(t,q));
  if(searchFilter==="expense")result=result.filter(t=>t.type==="expense");
  if(searchFilter==="income")result=result.filter(t=>t.type==="income");
  result.sort(byDateDesc);
  if($("#searchResults"))$("#searchResults").innerHTML=result.length?result.map(txHTML).join(""):`<div class="empty">نتیجه‌ای پیدا نشد</div>`;
  $$(".filter-chip").forEach(x=>x.classList.toggle("active",(x.dataset.filter||"all")===searchFilter));
  bindTxClicks();
}

function renderReports(){
  const tx=getMonthTx(reportMonth);
  const income=tx.filter(t=>t.type==="income").reduce((s,t)=>s+Number(t.amount||0),0);
  const expense=tx.filter(t=>t.type==="expense").reduce((s,t)=>s+Number(t.amount||0),0);
  if($("#reportMonth"))$("#reportMonth").textContent=monthLabel(reportMonth);
  if($("#reportIncome"))$("#reportIncome").textContent=money(income);
  if($("#reportExpense"))$("#reportExpense").textContent=money(expense);

  const max=Math.max(income,expense,1);
  const ib=$("#incomeBar"),eb=$("#expenseBar");
  if(ib){ib.style.height=`${Math.max(12,Math.round(income/max*190))}px`;ib.parentElement?.classList.add("vertical-bar-item")}
  if(eb){eb.style.height=`${Math.max(12,Math.round(expense/max*190))}px`;eb.parentElement?.classList.add("vertical-bar-item")}
  if($("#incomeBarText"))$("#incomeBarText").textContent=money(income);
  if($("#expenseBarText"))$("#expenseBarText").textContent=money(expense);

  const cats={};
  tx.filter(t=>t.type==="expense").forEach(t=>cats[t.category||"سایر"]=(cats[t.category||"سایر"]||0)+Number(t.amount||0));
  const entries=Object.entries(cats).sort((a,b)=>b[1]-a[1]);
  if($("#categoryReport"))$("#categoryReport").innerHTML=entries.length?
    entries.map(([k,v],i)=>`<div class="cat-row" title="${esc(k)}"><span>${catIcons[k]||"📦"} ${esc(k)}</span><strong>${money(v)} تومان</strong></div>`).join(""):
    `<div class="empty">برای این ماه هزینه‌ای ثبت نشده</div>`;

  const full=$("#fullTransactions");
  if(full)full.innerHTML=tx.length?
    [...tx].sort(byDateDesc).map(txHTML).join(""):
    `<div class="empty">در این ماه تراکنشی ثبت نشده</div>`;
  bindTxClicks();
}

function openModal(content){
  const modal=$("#modal"),card=$("#modalCard");
  if(!modal||!card)return;
  card.innerHTML=content;
  card.scrollTop=0;
  modal.classList.remove("hidden");
  document.body.style.overflow="hidden";
  card.querySelectorAll("[data-close]").forEach(x=>x.onclick=closeModal);
}
function closeModal(){
  $("#modal")?.classList.add("hidden");
  document.body.style.overflow="";
  if(!lsGet("hesabyar_profile_setup")&&$("#profileForm"))lsSet("hesabyar_profile_setup","1");
  const card=$("#modalCard");if(card)card.innerHTML="";
  maybeStartTour();
}

function openProfile(){
  openModal(`<div class="modal-head"><div><small>حساب کاربری</small><h2>پروفایل من</h2></div><button class="close" data-close>×</button></div>
  <form id="profileForm" class="form">
    <div class="field"><label>نام نمایشی</label><input id="pName" value="${esc(profile.name)}" placeholder="مثلاً علی" required></div>
    <div class="field"><label>نام کاربری</label><input id="pUser" value="${esc(profile.username)}" placeholder="مثلاً ali" required></div>
    <div class="field"><label>آواتار</label><input id="pAvatar" maxlength="4" value="${esc(profile.avatar||"")}" placeholder="خالی = حرف اول نام"></div>
    <button class="primary">ذخیره پروفایل</button>
  </form>`);
  $("#profileForm").onsubmit=e=>{
    e.preventDefault();
    profile={name:$("#pName").value.trim()||"کاربر",username:$("#pUser").value.trim().replace(/^@/,"")||"user",avatar:Array.from($("#pAvatar").value.trim()).slice(0,2).join("")};
    lsSet(PROFILE,JSON.stringify(profile));
    lsSet("hesabyar_profile_setup","1");
    closeModal();renderAll();toast("پروفایل ذخیره شد");
  };
}

function applyAppearance(theme, palette, custom={}){
  document.body.classList.toggle("soft-theme", theme === "light");
  document.body.classList.toggle("theme-blue", palette === "blue");
  document.body.classList.toggle("theme-pink", palette === "pink");
  document.body.classList.toggle("theme-mint", palette === "mint");
  document.body.classList.toggle("theme-purple", palette === "purple");

  const root=document.documentElement;
  if(custom.accent) root.style.setProperty("--accent", custom.accent);
  else root.style.removeProperty("--accent");
  if(custom.accent2) root.style.setProperty("--accent2", custom.accent2);
  else root.style.removeProperty("--accent2");
  if(custom.bg) root.style.setProperty("--custom-bg", custom.bg);
  else root.style.removeProperty("--custom-bg");

  lsSet("hesabyar_theme", theme);
  lsSet("hesabyar_palette", palette);
  lsSet("hesabyar_custom_colors", JSON.stringify(custom));
}
function getCustomColors(){
  try{const c=JSON.parse(lsGet("hesabyar_custom_colors")||"{}");return c&&typeof c==="object"&&!Array.isArray(c)?c:{}}catch{return {}}
}
function openAppearance(){
  const theme=lsGet("hesabyar_theme")||"dark";
  const palette=lsGet("hesabyar_palette")||"blue";
  const custom=getCustomColors();
  openModal(`<div class="modal-head"><div><small>شخصی‌سازی</small><h2>ظاهر حساب‌یار</h2></div><button class="close" data-close>×</button></div>
  <div class="appearance-box">
    <div class="appearance-title">حالت نمایش</div>
    <div class="theme-toggle-wrap">
      <span class="theme-label">🌙 تیره</span>
      <button type="button" class="theme-toggle ${theme==='light'?'is-light':''}" id="themeToggle" aria-label="تغییر حالت روشن و تیره"><span></span></button>
      <span class="theme-label">روشن ☀️</span>
    </div>

    <div class="appearance-title">رنگ آماده</div>
    <div class="palette-grid">
      <button type="button" class="palette-choice palette-blue ${palette==='blue'?'active':''}" data-palette="blue"><i></i><span>آبی آسمانی</span></button>
      <button type="button" class="palette-choice palette-pink ${palette==='pink'?'active':''}" data-palette="pink"><i></i><span>صورتی پاستلی</span></button>
      <button type="button" class="palette-choice palette-purple ${palette==='purple'?'active':''}" data-palette="purple"><i></i><span>بنفش مدرن</span></button>
      <button type="button" class="palette-choice palette-mint ${palette==='mint'?'active':''}" data-palette="mint"><i></i><span>سبز نعنایی</span></button>
    </div>

    <div class="appearance-title">رنگ دلخواه خودت</div>
    <div class="custom-colors">
      <label class="color-control"><span>رنگ اصلی</span><input id="customAccent" type="color" value="${custom.accent||'#5b8cff'}"></label>
      <label class="color-control"><span>رنگ پس‌زمینه</span><input id="customBg" type="color" value="${custom.bg|| (theme==='light'?'#f5f7fc':'#080d1b')}"></label>
    </div>
    <button type="button" class="save-colors" id="saveCustomColors">اعمال رنگ دلخواه</button>
    <button type="button" class="reset-colors" id="resetCustomColors">برگرداندن رنگ پیش‌فرض</button>
    <p class="appearance-note">هر رنگی که انتخاب کنی ذخیره می‌شود و دفعه بعد هم همان ظاهر را می‌بینی.</p>
  </div>`);

  const toggle=$("#themeToggle");
  toggle.onclick=()=>{
    const next=document.body.classList.contains("soft-theme")?"dark":"light";
    applyAppearance(next, lsGet("hesabyar_palette")||"blue", getCustomColors());
    openAppearance();
    renderSettings();
    toast(next==='light'?"حالت روشن فعال شد":"حالت تیره فعال شد");
  };
  $$('[data-palette]').forEach(btn=>btn.onclick=()=>{
    const next=btn.dataset.palette;
    applyAppearance(lsGet("hesabyar_theme")||"dark",next,{});
    openAppearance();
    renderSettings();
    toast("رنگ برنامه تغییر کرد");
  });
  $("#saveCustomColors").onclick=()=>{
    const accent=$("#customAccent").value;
    const bg=$("#customBg").value;
    const accent2=adjustColor(accent,18);
    applyAppearance(lsGet("hesabyar_theme")||"dark","custom",{accent,accent2,bg});
    openAppearance();
    renderSettings();
    toast("رنگ دلخواهت اعمال شد 🎨");
  };
  $("#resetCustomColors").onclick=()=>{
    applyAppearance(lsGet("hesabyar_theme")||"dark","blue",{});
    openAppearance();
    renderSettings();
    toast("رنگ‌ها به حالت پیش‌فرض برگشتند");
  };
}
function adjustColor(hex, amount){
  const h=String(hex).replace('#','');
  if(!/^[0-9a-fA-F]{6}$/.test(h)) return '#8d67ff';
  const n=parseInt(h,16);
  const r=Math.max(0,Math.min(255,(n>>16)+amount));
  const g=Math.max(0,Math.min(255,((n>>8)&255)+amount));
  const b=Math.max(0,Math.min(255,(n&255)+amount));
  return '#'+[r,g,b].map(x=>x.toString(16).padStart(2,'0')).join('');
}
function renderSettings(){
  const name=profile.name||"کاربر";
  const avatar=Array.from(profile.avatar||name[0]||"B").slice(0,2).join("");
  const p=document.querySelector("#settingsPage .profile");
  if(p)p.innerHTML=`<div class="avatar">${esc(avatar)}</div><div><small>حساب کاربری</small><h2>${esc(name)}</h2><span>@${esc(profile.username||"user")}</span></div><button class="link-btn" id="settingsProfileEdit" type="button">ویرایش</button>`;
  const theme=lsGet("hesabyar_theme")||"dark";
  const palette=lsGet("hesabyar_palette")||"blue";
  $("#appearanceStatus")&&($("#appearanceStatus").textContent=`${theme==='light'?'روشن':'تیره'} · ${palette==='pink'?'صورتی':palette==='purple'?'بنفش':palette==='mint'?'نعنایی':palette==='custom'?'دلخواه':'آبی'}`);
  $("#settingsProfileEdit")?.addEventListener("click",openProfile);
}

function downloadText(filename,text,type="application/json"){
  const blob=new Blob([text],{type});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob);a.download=filename;
  document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
function backupData(){
  downloadText(`hesabyar-backup-${jalaliNow().replaceAll("/","-")}.json`,JSON.stringify({version:5,exportedAt:new Date().toISOString(),profile,state},null,2));
  lsSet(BACKUP,String(Date.now()));
  toast("بکاپ با موفقیت گرفته شد");
}
function restoreData(){
  const input=document.createElement("input");
  input.type="file";input.accept=".json,application/json";
  input.onchange=()=>{
    const file=input.files?.[0];if(!file)return;
    const r=new FileReader();
    r.onerror=()=>toast("خواندن فایل ممکن نشد");
    r.onload=()=>{
      let d,restored;
      try{
        d=JSON.parse(String(r.result).replace(/^\uFEFF/,""));
        const raw=d?.state?.transactions??d?.transactions;
        if(!Array.isArray(raw))throw Error();
        restored=sanitizeTx(raw);
      }catch{toast("فایل بکاپ معتبر نیست");return}
      if(!restored.length&&(d.state?.transactions??d.transactions).length){toast("هیچ تراکنش معتبری در فایل پیدا نشد");return}
      if(!confirm(`${fa(restored.length)} تراکنش بازیابی می‌شود و اطلاعات فعلی جایگزین خواهد شد. ادامه می‌دهی؟`))return;
      const prev=state.transactions,prevProfile=profile;
      state.transactions=restored;
      if(d.profile&&typeof d.profile==="object"&&!Array.isArray(d.profile))profile={name:String(d.profile.name||""),username:String(d.profile.username||""),avatar:String(d.profile.avatar||"")};
      if(!saveState()){state.transactions=prev;profile=prevProfile;return}
      lsSet(PROFILE,JSON.stringify(profile));
      renderAll();toast("اطلاعات با موفقیت بازیابی شد");
    };
    r.readAsText(file);
  };
  input.click();
}
function csvCell(v){
  let t=String(v??"");
  if(/^[=+\-@\t\r]/.test(t)&&!/^-?\d+(\.\d+)?$/.test(t))t="'"+t;
  return `"${t.replaceAll('"','""')}"`;
}
function exportCSV(){
  if(!state.transactions.length){toast("تراکنشی برای خروجی وجود ندارد");return}
  const rows=[["نوع","عنوان","دسته","تاریخ","مبلغ","اقلام","توضیحات"]];
  [...state.transactions].sort(byDateDesc).forEach(t=>rows.push([
    t.type==="income"?"درآمد":"هزینه",t.title||"",t.category||"",t.date||"",t.amount||0,
    (t.items||[]).map(i=>`${i.name}:${i.price}`).join(" | "),t.note||""
  ]));
  const csv="\uFEFF"+rows.map(r=>r.map(csvCell).join(",")).join("\r\n");
  downloadText("hesabyar.csv",csv,"text/csv;charset=utf-8");
  toast("CSV آماده شد");
}
function clearAllData(){
  if(!confirm("همه تراکنش‌ها پاک شوند؟ این کار قابل برگشت نیست."))return;
  const prev=state;
  state={transactions:[]};
  if(!saveState()){state=prev;return}
  renderAll();toast("اطلاعات پاک شد");
}

const tourSteps=[
  {sel:'[data-tour="balance"]',page:"home",t:"موجودی فعلی",p:"اینجا مجموع همه درآمدها منهای هزینه‌ها را می‌بینی."},
  {sel:'[data-tour="quick"]',page:"home",t:"ثبت سریع",p:"با این دو دکمه درآمد یا هزینه جدید ثبت کن. برای هزینه می‌توانی اقلام خرید را جدا بنویسی تا جمع خودکار حساب شود."},
  {sel:'[data-tour="analysis"]',page:"home",t:"پول کجا رفت؟",p:"نمودار هزینه‌های هر ماه بر اساس دسته‌بندی. با فلش‌ها ماه را عوض کن."},
  {sel:".bottom-nav",page:"home",t:"منوی پایین",p:"جستجو، گزارش ماهانه و تنظیمات (بکاپ، خروجی CSV و ظاهر برنامه) از اینجا در دسترس است. دکمه + هم برای ثبت سریع است."}
];
let tourIndex=-1;
function maybeStartTour(){
  if(tourIndex>=0||lsGet(TOUR)||!lsGet("hesabyar_profile_setup"))return;
  if(!$("#modal")?.classList.contains("hidden"))return;
  startTour();
}
function startTour(){
  endTour(true);
  nav("home");
  tourIndex=0;
  const box=document.createElement("div");
  box.className="tutorial";box.id="tour";
  box.innerHTML='<div class="tutorial-shade"></div><div class="tutorial-card" role="dialog" aria-live="polite"></div>';
  document.body.appendChild(box);
  showTourStep();
}
function showTourStep(){
  const box=$("#tour");if(!box)return;
  $$(".tour-focus").forEach(x=>x.classList.remove("tour-focus"));
  const st=tourSteps[tourIndex];
  const target=$(st.sel);
  if(target){target.classList.add("tour-focus");target.scrollIntoView({block:"center"})}
  const last=tourIndex===tourSteps.length-1;
  box.querySelector(".tutorial-card").classList.toggle("top",st.sel===".bottom-nav");
  box.querySelector(".tutorial-card").innerHTML=`<span>مرحله ${fa(tourIndex+1)} از ${fa(tourSteps.length)}</span><h2>${esc(st.t)}</h2><p>${esc(st.p)}</p><div><button type="button" class="link-btn" id="tourSkip">رد کردن</button><button type="button" class="primary" id="tourNext" style="width:auto;padding:10px 22px">${last?"شروع":"بعدی"}</button></div>`;
  $("#tourSkip").onclick=()=>endTour();
  $("#tourNext").onclick=()=>{if(last)endTour();else{tourIndex++;showTourStep()}};
}
function endTour(silent){
  $("#tour")?.remove();
  $$(".tour-focus").forEach(x=>x.classList.remove("tour-focus"));
  if(tourIndex>=0&&!silent)lsSet(TOUR,"1");
  tourIndex=-1;
}

function renderBackupNote(){
  const box=$("#backupNote");if(!box)return;
  if(!lsGet("hesabyar_first_seen"))lsSet("hesabyar_first_seen",String(Date.now()));
  const last=Number(lsGet(BACKUP))||Number(lsGet("hesabyar_first_seen"))||Date.now();
  const snooze=Number(lsGet("hesabyar_backup_snooze"))||0;
  const days=(Date.now()-last)/864e5;
  if(!state.transactions.length||days<7||Date.now()<snooze){box.innerHTML="";return}
  box.innerHTML=`<div class="warning backup-note"><span>💾 ${fa(Math.floor(days))} روز است بکاپ نگرفته‌ای.</span><div><button type="button" class="link-btn" id="noteBackup">بکاپ بگیر</button><button type="button" class="link-btn" id="noteLater">بعداً</button></div></div>`;
  $("#noteBackup").onclick=()=>{backupData();renderBackupNote()};
  $("#noteLater").onclick=()=>{lsSet("hesabyar_backup_snooze",String(Date.now()+3*864e5));renderBackupNote()};
}

function nav(page){
  const map={home:"#homePage",search:"#searchPage",reports:"#reportsPage",settings:"#settingsPage"};
  $$(".view").forEach(v=>v.classList.remove("active"));
  const target=$(map[page]||"#homePage");
  target?.classList.add("active");
  $$(".nav").forEach(n=>n.classList.toggle("active",n.dataset.page===page));
  if(page==="reports")renderReports();
  if(page==="search")renderSearch();
  if(page==="settings")renderSettings();
  window.scrollTo({top:0,behavior:"smooth"});
}

function setup(){
  $$(".nav").forEach(n=>n.addEventListener("click",()=>nav(n.dataset.page)));
  $$("[data-page]").filter(x=>!x.classList.contains("nav")).forEach(n=>n.addEventListener("click",()=>nav(n.dataset.page)));

  $("#incomeBtn")?.addEventListener("click",()=>openTxForm("income"));
  $("#expenseBtn")?.addEventListener("click",()=>openTxForm("expense"));
  $("#plusBtn")?.addEventListener("click",()=>openTxForm("expense"));
  $("#profileBtn")?.addEventListener("click",openProfile);
  $("#fullReport")?.addEventListener("click",()=>nav("reports"));

  $("#prevMonth")?.addEventListener("click",()=>{currentMonth=monthShift(currentMonth,-1);renderHome()});
  $("#nextMonth")?.addEventListener("click",()=>{currentMonth=monthShift(currentMonth,1);renderHome()});
  $("#rPrev")?.addEventListener("click",()=>{reportMonth=monthShift(reportMonth,-1);renderReports()});
  $("#rNext")?.addEventListener("click",()=>{reportMonth=monthShift(reportMonth,1);renderReports()});

  $("#homeSearch")?.addEventListener("input",renderQuickSearch);
  $("#searchInput")?.addEventListener("input",renderSearch);
  $$(".filter-chip").forEach(b=>b.addEventListener("click",()=>{
    searchFilter=b.dataset.filter||"all";renderSearch();
  }));

  document.addEventListener("click",e=>{
    const b=e.target.closest("[data-setting]");
    if(!b)return;
    const action=b.dataset.setting;
    if(action==="backup")backupData();
    else if(action==="restore")restoreData();
    else if(action==="csv")exportCSV();
    else if(action==="clear")clearAllData();
    else if(action==="appearance")openAppearance();
    else if(action==="tour")startTour();
  });

  document.addEventListener("keydown",e=>{
    if(e.key!=="Escape")return;
    if($("#tour"))endTour();
    else if(!$("#modal")?.classList.contains("hidden"))closeModal();
  });
  $("#modal")?.addEventListener("click",e=>{if(e.target.dataset.close!==undefined)closeModal()});

  applyAppearance(lsGet("hesabyar_theme")||"dark", lsGet("hesabyar_palette")||"blue", getCustomColors());
  renderAll();
  if(!lsGet("hesabyar_profile_setup")){
    setTimeout(openProfile,280);
  }else{
    setTimeout(maybeStartTour,500);
  }
  try{navigator.storage?.persist?.()}catch{}
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",setup);
else setup();

if("serviceWorker" in navigator){
  window.addEventListener("load",()=>{
    navigator.serviceWorker.register("sw.js").then(reg=>{
      reg.addEventListener("updatefound",()=>{
        const w=reg.installing;
        w?.addEventListener("statechange",()=>{
          if(w.state==="installed"&&navigator.serviceWorker.controller)toast("نسخه جدید آماده شد؛ برنامه را یک بار ببند و دوباره باز کن");
        });
      });
    }).catch(()=>{});
  });
}
