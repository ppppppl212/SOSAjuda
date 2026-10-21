const body = document.body;
const themeToggle = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");
const modalOverlay = document.getElementById("modalOverlay");
const modalClose = document.getElementById("modalClose");
const helpForm = document.getElementById("helpForm");
const categoryInput = document.getElementById("category");
const descriptionInput = document.getElementById("description");
const locationInput = document.getElementById("location");
const modalTitle = document.getElementById("modalTitle");
const modalIcon = document.getElementById("modalIcon");
const requestGrid = document.getElementById("requestGrid");
const emptyState = document.getElementById("emptyState");
const searchInput = document.getElementById("requestSearch");
const locationBtn = document.getElementById("locationBtn");
const toast = document.getElementById("toast");
const toastMessage = document.getElementById("toastMessage");
const toastIcon = document.getElementById("toastIcon");
const statRequests = document.getElementById("statRequests");

const THEME_KEY = "sos-ajuda-demo-theme";
const REQUESTS_KEY = "sos-ajuda-demo-requests";
let activeFilter = "Todos";
let toastTimer;

function setTheme(theme){
  body.classList.toggle("dark", theme === "dark");
  themeIcon.textContent = theme === "dark" ? "☀" : "☾";
  themeToggle.title = theme === "dark" ? "Tema claro" : "Tema escuro";
  themeToggle.setAttribute("aria-label", theme === "dark" ? "Ativar tema claro" : "Ativar tema escuro");
}
setTheme(localStorage.getItem(THEME_KEY) || "light");

themeToggle.addEventListener("click", ()=>{
  const next = body.classList.contains("dark") ? "light" : "dark";
  localStorage.setItem(THEME_KEY,next);
  setTheme(next);
  showToast(next === "dark" ? "Tema escuro ativado." : "Tema claro ativado.","☀");
});

function openModal(category=""){
  modalOverlay.classList.add("active");
  modalOverlay.setAttribute("aria-hidden","false");
  document.body.style.overflow="hidden";
  if(category){
    categoryInput.value=category;
    modalTitle.textContent=`Precisa de ajuda com ${category.toLowerCase()}?`;
    modalIcon.textContent=category==="Tecnologia"?"💻":category==="Casa"?"🏠":category==="Consertos"?"🔧":"🆘";
  }else{
    categoryInput.value="";
    modalTitle.textContent="Como podemos ajudar?";
    modalIcon.textContent="🆘";
  }
  setTimeout(()=>categoryInput.focus(),120);
}
function closeModal(){
  modalOverlay.classList.remove("active");
  modalOverlay.setAttribute("aria-hidden","true");
  document.body.style.overflow="";
}
document.querySelectorAll("[data-open-modal]").forEach(btn=>btn.addEventListener("click",()=>openModal()));
document.querySelectorAll("[data-category]").forEach(card=>card.addEventListener("click",()=>openModal(card.dataset.category)));
document.querySelectorAll("[data-quick-help]").forEach(btn=>btn.addEventListener("click",()=>showToast("Você escolheu ajudar o Marcos!","🤝")));
modalClose.addEventListener("click",closeModal);
modalOverlay.addEventListener("click",e=>{if(e.target===modalOverlay)closeModal()});
document.addEventListener("keydown",e=>{if(e.key==="Escape" && modalOverlay.classList.contains("active")) closeModal()});

function getSavedRequests(){
  try{return JSON.parse(localStorage.getItem(REQUESTS_KEY)) || []}catch{return []}
}
function saveRequest(item){
  const list=getSavedRequests();
  list.unshift(item);
  localStorage.setItem(REQUESTS_KEY,JSON.stringify(list.slice(0,12)));
}
function escapeHTML(value){
  return String(value).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
}
function iconFor(category){
  return {Consertos:"🔧",Tecnologia:"💻",Transporte:"🚗",Casa:"🏠",Animais:"🐶",Estudos:"📚",Compras:"🛒","Outra necessidade":"🆘"}[category] || "🆘";
}
function titleFrom(description){
  const clean=description.trim().replace(/\s+/g," ");
  return clean.length>42 ? clean.slice(0,42)+"..." : clean;
}
function addUserRequest(item){
  const article=document.createElement("article");
  article.className="request-card";
  article.dataset.category=item.category;
  article.dataset.search=`${item.category} ${item.description} ${item.location}`.toLowerCase();
  article.innerHTML=`
    <div class="request-card-top"><span class="tag">${iconFor(item.category)} ${escapeHTML(item.category)}</span><span class="distance">Novo</span></div>
    <h3>${escapeHTML(titleFrom(item.description))}</h3>
    <p>${escapeHTML(item.description)}</p>
    <div class="request-person"><div class="avatar">${iconFor(item.category)}</div><div><strong>Você</strong><span>Agora · ${escapeHTML(item.location)}</span></div></div>
    <button class="card-action" data-request-title="${escapeHTML(titleFrom(item.description))}">Pedido criado</button>`;
  requestGrid.prepend(article);
  bindRequestButton(article.querySelector(".card-action"));
}
function restoreRequests(){
  getSavedRequests().reverse().forEach(addUserRequest);
}
helpForm.addEventListener("submit",e=>{
  e.preventDefault();
  const item={
    id:Date.now(),
    category:categoryInput.value,
    description:descriptionInput.value.trim(),
    location:locationInput.value.trim()
  };
  if(!item.category || !item.description || !item.location){
    showToast("Preencha todos os campos.","!");
    return;
  }
  saveRequest(item);
  addUserRequest(item);
  closeModal();
  helpForm.reset();
  statRequests.textContent=Number(statRequests.textContent)+1;
  showToast("Pedido publicado no protótipo!","✓");
  setTimeout(()=>document.getElementById("pedidos").scrollIntoView({behavior:"smooth"}),250);
});
function bindRequestButton(button){
  if(!button)return;
  button.addEventListener("click",()=>{
    showToast(`Pedido: ${button.dataset.requestTitle}`,"→");
  });
}
document.querySelectorAll(".card-action").forEach(bindRequestButton);
restoreRequests();

document.querySelectorAll(".filter").forEach(filter=>{
  filter.addEventListener("click",()=>{
    document.querySelectorAll(".filter").forEach(f=>f.classList.remove("active"));
    filter.classList.add("active");
    activeFilter=filter.dataset.filter;
    applyFilters();
  });
});
searchInput.addEventListener("input",applyFilters);
function applyFilters(){
  const query=searchInput.value.trim().toLowerCase();
  let visible=0;
  requestGrid.querySelectorAll(".request-card").forEach(card=>{
    const category=card.dataset.category;
    const text=card.dataset.search || card.textContent.toLowerCase();
    const categoryOK=activeFilter==="Todos" || category===activeFilter;
    const searchOK=!query || text.includes(query);
    const show=categoryOK && searchOK;
    card.classList.toggle("hidden",!show);
    if(show)visible++;
  });
  emptyState.hidden=visible!==0;
}
locationBtn.addEventListener("click",()=>{
  locationBtn.disabled=true;
  locationBtn.textContent="📍 Localizando...";
  if(!navigator.geolocation){
    finishLocation("Localização não disponível neste navegador.");
    return;
  }
  navigator.geolocation.getCurrentPosition(
    ()=>finishLocation("Região atualizada para a demonstração."),
    ()=>finishLocation("Não foi possível acessar sua localização."),
    {timeout:7000}
  );
});
function finishLocation(message){
  locationBtn.disabled=false;
  locationBtn.textContent="📍 Minha região";
  showToast(message,message.includes("atualizada")?"✓":"!");
}
function showToast(message,icon="✓"){
  clearTimeout(toastTimer);
  toastMessage.textContent=message;
  toastIcon.textContent=icon;
  toast.classList.add("show");
  toastTimer=setTimeout(()=>toast.classList.remove("show"),2800);
}
document.getElementById("demoLink").addEventListener("click",e=>{
  e.preventDefault();
  showToast("Este site é um protótipo navegável para apresentação.","ℹ");
});

const sections=[...document.querySelectorAll("main section[id]")];
const navLinks=[...document.querySelectorAll(".nav-link")];
window.addEventListener("scroll",()=>{
  let current="inicio";
  sections.forEach(section=>{
    if(window.scrollY >= section.offsetTop-140) current=section.id;
  });
  navLinks.forEach(link=>link.classList.toggle("active",link.getAttribute("href")===`#${current}`));
},{passive:true});

applyFilters();
