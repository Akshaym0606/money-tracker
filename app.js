const KEY = "moneyTrackerV1";

const defaultState = {
  userName: "there",
  openingBalance: 0,
  transactions: []
};

let state = loadState();

function loadState(){
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    return saved ? {...defaultState, ...saved} : {...defaultState};
  } catch(e){ return {...defaultState}; }
}
function save(){ localStorage.setItem(KEY, JSON.stringify(state)); render(); }
function money(n){ return "₹" + Math.round(Number(n)||0).toLocaleString("en-IN"); }
function dateKey(d=new Date()){ return new Date(d).toISOString().slice(0,10); }
function today(){ return dateKey(); }
function formatDate(s){
  return new Date(s+"T12:00:00").toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"});
}
function monthName(){ return new Date().toLocaleDateString("en-IN",{month:"long"}); }

function totals(){
  let earnings=0, deductions=0, returned=0;
  state.transactions.forEach(t=>{
    if(t.type==="earning") earnings += t.amount;
    if(["grocery","expense","lent"].includes(t.type)) deductions += t.amount;
    if(t.type==="returned") returned += t.amount;
  });
  return {earnings, balance: state.openingBalance - deductions + returned};
}
function todayTotals(){
  const ts=state.transactions.filter(t=>t.date===today());
  return {
    earning: ts.filter(t=>t.type==="earning").reduce((a,t)=>a+t.amount,0),
    grocery: ts.filter(t=>t.type==="grocery").reduce((a,t)=>a+t.amount,0),
    expense: ts.filter(t=>t.type==="expense").reduce((a,t)=>a+t.amount,0),
    lent: ts.filter(t=>t.type==="lent").reduce((a,t)=>a+t.amount,0)
  };
}
function outstanding(){
  return state.transactions.filter(t=>t.type==="lent"&&!t.returned).reduce((a,t)=>a+t.amount,0);
}
function icon(type){ return ({earning:"💰",grocery:"🛒",expense:"💸",lent:"🤝",returned:"↩️"})[type]||"•"; }
function label(type){ return ({earning:"Earning",grocery:"Grocery",expense:"Other Expense",lent:"Money Lent",returned:"Money Returned"})[type]||type; }

function render(){
  const t=totals(), d=todayTotals();
  document.getElementById("userName").textContent=state.userName || "there";
  document.getElementById("earningsValue").textContent=money(t.earnings);
  document.getElementById("balanceValue").textContent=money(t.balance);
  document.getElementById("monthLabel").textContent=monthName();
  document.getElementById("todayLabel").textContent=new Date().toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long"});
  document.getElementById("todayGroceries").textContent=money(d.grocery);
  document.getElementById("todayLent").textContent=money(d.lent);
  document.getElementById("todayExpenses").textContent=money(d.expense);
  document.getElementById("todayEarnings").textContent=money(d.earning);
  document.getElementById("outstandingLent").textContent=money(outstanding());

  const list=document.getElementById("transactionsList");
  const recent=[...state.transactions].sort((a,b)=>new Date(b.date)-new Date(a.date)||b.created-a.created).slice(0,8);
  list.innerHTML=recent.map(t=>`
    <div class="transaction">
      <div class="tx-icon">${icon(t.type)}</div>
      <div class="tx-main">
        <div class="tx-name">${escapeHtml(t.name)}</div>
        <div class="tx-meta">${label(t.type)} · ${formatDate(t.date)}${t.person ? " · "+escapeHtml(t.person):""}</div>
      </div>
      <div class="tx-amount ${t.type==="earning"||t.type==="returned"?"positive":"negative"}">${t.type==="earning"||t.type==="returned"?"+":"−"}${money(t.amount)}</div>
    </div>`).join("");
  document.getElementById("emptyState").classList.toggle("hidden",recent.length>0);
  list.classList.toggle("hidden",recent.length===0);
}
function escapeHtml(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));}

const backdrop=document.getElementById("modalBackdrop");
const modalContent=document.getElementById("modalContent");
function openModal(content){modalContent.innerHTML=content;backdrop.classList.remove("hidden");}
function closeModal(){backdrop.classList.add("hidden");modalContent.innerHTML="";}
document.getElementById("closeModal").onclick=closeModal;
backdrop.addEventListener("click",e=>{if(e.target===backdrop)closeModal();});

function addModal(initialType="grocery"){
  openModal(`
    <h2>Add transaction</h2>
    <div class="type-grid">
      ${choice("earning","💰","Earnings",initialType)}
      ${choice("grocery","🛒","Groceries",initialType)}
      ${choice("expense","💸","Other Expense",initialType)}
      ${choice("lent","🤝","Money Lent",initialType)}
    </div>
    <form id="txForm" class="form-grid">
      <input type="hidden" id="txType" value="${initialType}">
      <div class="field"><label id="nameLabel">Item / Description</label><input id="txName" required placeholder="${initialType==="grocery"?"Milk":initialType==="lent"?"Loan":initialType==="earning"?"Daily earning":"Description"}"></div>
      <div class="field ${initialType==="lent"?"":"hidden"}" id="personField"><label>Person</label><input id="txPerson" placeholder="Person's name"></div>
      <div class="field"><label>Amount</label><input id="txAmount" type="number" min="1" step="1" required placeholder="₹"></div>
      <div class="field"><label>Date</label><input id="txDate" type="date" value="${today()}" required></div>
      <div class="field"><label>Note (optional)</label><textarea id="txNote" rows="2" placeholder="Add a note..."></textarea></div>
      <button class="submit-btn">Save transaction</button>
    </form>
  `);
  document.querySelectorAll(".type-choice").forEach(b=>b.onclick=()=>switchType(b.dataset.type));
  document.getElementById("txForm").onsubmit=e=>{
    e.preventDefault();
    const type=document.getElementById("txType").value;
    const amount=Number(document.getElementById("txAmount").value);
    const tx={id:crypto.randomUUID(),created:Date.now(),type,amount,date:document.getElementById("txDate").value,name:document.getElementById("txName").value.trim(),person:document.getElementById("txPerson")?.value.trim()||"",note:document.getElementById("txNote").value.trim(),returned:false};
    state.transactions.push(tx); save(); closeModal();
  };
}
function choice(type,ico,text,active){return `<button type="button" class="type-choice ${type===active?"active":""}" data-type="${type}">${ico} ${text}</button>`}
function switchType(type){
  document.getElementById("txType").value=type;
  document.querySelectorAll(".type-choice").forEach(b=>b.classList.toggle("active",b.dataset.type===type));
  const person=document.getElementById("personField"), name=document.getElementById("nameLabel"), input=document.getElementById("txName");
  person.classList.toggle("hidden",type!=="lent");
  if(type==="grocery"){name.textContent="Item";input.placeholder="Milk, Banana, Vegetables...";}
  if(type==="expense"){name.textContent="Description";input.placeholder="Travel, recharge, shopping...";}
  if(type==="earning"){name.textContent="Source / Description";input.placeholder="Daily earning";}
  if(type==="lent"){name.textContent="Reason / Description";input.placeholder="Borrowed money";}
}

function historyModal(){
  const groups={};
  [...state.transactions].sort((a,b)=>new Date(b.date)-new Date(a.date)||b.created-a.created).forEach(t=>(groups[t.date]??=[]).push(t));
  const dates=Object.keys(groups);
  openModal(`<h2>Transaction history</h2>${dates.length?dates.map(d=>{
    const arr=groups[d];
    return `<div class="history-item"><div class="history-date">${formatDate(d)}</div>${arr.map(t=>`<div class="history-total"><span>${icon(t.type)} ${escapeHtml(t.name)}</span><strong class="${t.type==="earning"||t.type==="returned"?"positive":""}">${t.type==="earning"||t.type==="returned"?"+":"−"}${money(t.amount)}</strong></div>`).join("")}</div>`;
  }).join(""):`<p style="color:#777">No transactions yet.</p>`}`);
}

function lentModal(){
  const loans=state.transactions.filter(t=>t.type==="lent");
  openModal(`<h2>Money Lent</h2>${loans.length?loans.map(t=>`
    <div class="lend-row">
      <div class="tx-icon">🤝</div>
      <div class="lend-person"><strong>${escapeHtml(t.person||"Unknown")}</strong><small>${escapeHtml(t.name)} · ${money(t.amount)} · ${formatDate(t.date)}</small></div>
      ${t.returned?`<span class="positive" style="font-size:11px">Returned</span>`:`<button class="return-btn" data-return="${t.id}">Mark returned</button>`}
    </div>`).join(""):`<p style="color:#777">No money has been lent yet.</p>`}`);
  document.querySelectorAll("[data-return]").forEach(b=>b.onclick=()=>{
    const loan=state.transactions.find(t=>t.id===b.dataset.return);
    if(!loan)return;
    loan.returned=true;
    state.transactions.push({id:crypto.randomUUID(),created:Date.now(),type:"returned",amount:loan.amount,date:today(),name:`Return from ${loan.person||"borrower"}`,person:loan.person||"",note:"Loan returned",returned:false});
    save(); lentModal();
  });
}

function settingsModal(){
  openModal(`
    <h2>Settings</h2>
    <div class="setting-row"><span>Your name</span><input id="settingsName" value="${escapeHtml(state.userName)}"></div>
    <div class="setting-row"><span>Opening balance</span><input id="settingsBalance" type="number" min="0" value="${state.openingBalance}"></div>
    <button class="submit-btn" id="saveSettings">Save settings</button>
    <button class="secondary-btn" id="resetData">Reset all data</button>
  `);
  document.getElementById("saveSettings").onclick=()=>{
    state.userName=document.getElementById("settingsName").value.trim()||"there";
    state.openingBalance=Number(document.getElementById("settingsBalance").value)||0;
    save();closeModal();
  };
  document.getElementById("resetData").onclick=()=>{
    if(confirm("Delete all transactions and reset the app?")){
      state={...defaultState};save();closeModal();
    }
  };
}

document.getElementById("addBtn").onclick=()=>addModal();
document.getElementById("emptyAddBtn").onclick=()=>addModal();
document.querySelectorAll(".category-card").forEach(b=>b.onclick=()=>addModal(b.dataset.type));
document.getElementById("historyBtn").onclick=historyModal;
document.getElementById("todayDetailsBtn").onclick=historyModal;
document.getElementById("dateBtn").onclick=historyModal;
document.querySelectorAll(".nav-item").forEach(b=>b.onclick=()=>{
  const v=b.dataset.view;
  if(v==="history")historyModal();
  else if(v==="lent")lentModal();
  else if(v==="settings")settingsModal();
  else window.scrollTo({top:0,behavior:"smooth"});
  document.querySelectorAll(".nav-item").forEach(x=>x.classList.remove("active"));b.classList.add("active");
});
render();
