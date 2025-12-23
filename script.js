// ==========================================
// 1. GLOBAL SETTINGS & DATA
// ==========================================

// Default data to populate if storage is empty
const defaultCards = [
  {id:1,name:'CLZS'}, {id:2,name:'MEL'}, {id:3,name:'MPGL'}, {id:4,name:'STPP'}, {id:5,name:'TSPL'}
];

// Initialize LocalStorage if empty
if(!localStorage.getItem('cards')) localStorage.setItem('cards', JSON.stringify(defaultCards));
if(!localStorage.getItem('folders')) localStorage.setItem('folders', JSON.stringify([]));
if(!localStorage.getItem('rootFiles')) localStorage.setItem('rootFiles', JSON.stringify([]));

// ==========================================
// 2. LOGIN PAGE LOGIC
// ==========================================

// Animation for the new Login Page
function toggleLoginView() {
  const container = document.getElementById('mainContainer');
  if(container) {
    container.classList.toggle('active');
  }
}

function login(){
  const u = document.getElementById('username').value;
  const p = document.getElementById('password').value;
  if(u==='ADMIN' && p==='ADMIN'){ 
    window.location = 'home.html'; 
  } else { 
    alert('Invalid credentials'); 
  }
}

function logout(){
  localStorage.removeItem('currentCard');
  localStorage.removeItem('currentFolderId');
  window.location = 'index.html';
}

// ==========================================
// 3. SHARED FUNCTIONS (Sidebar & Navigation)
// ==========================================

// Dynamically render the sidebar menu
function renderSidebar(){
  const nav = document.getElementById('sidebarNav');
  if(!nav) return; 

  const cards = JSON.parse(localStorage.getItem('cards'));
  const currentCardId = localStorage.getItem('currentCard');
  const isHome = window.location.pathname.includes('home.html');

  nav.innerHTML = ''; 

  // 1. Dashboard Link
  const dashBtn = document.createElement('a');
  dashBtn.className = `nav-item ${isHome ? 'active' : ''}`;
  dashBtn.innerText = 'Dashboard';
  dashBtn.onclick = () => goHome();
  nav.appendChild(dashBtn);

  // 2. Card Links
  cards.forEach(c => {
    const btn = document.createElement('a');
    const isActive = !isHome && c.id == currentCardId;
    btn.className = `nav-item ${isActive ? 'active' : ''}`;
    btn.innerText = c.name;
    btn.onclick = () => goTo('card.html', c.id);
    nav.appendChild(btn);
  });
}

function goHome(){ window.location = 'home.html'; }

function goTo(url, cardId){
  if(cardId) {
    localStorage.setItem('currentCard', cardId);
    localStorage.removeItem('currentFolderId');
  }
  window.location = url;
}

// ==========================================
// 4. HOME PAGE (DASHBOARD)
// ==========================================

function openCreateCard(){ document.getElementById('modal').classList.remove('hidden'); }
function closeModal(){ document.getElementById('modal').classList.add('hidden'); }

function createCard(){
  const name = document.getElementById('newCardName').value.trim();
  if(!name) return alert('Enter name');
  const cards = JSON.parse(localStorage.getItem('cards'));
  const id = Date.now();
  cards.unshift({id, name});
  localStorage.setItem('cards', JSON.stringify(cards));
  
  closeModal(); 
  renderCards();
  renderSidebar(); // Update sidebar immediately
}

function renderCards(filter){
  const cards = JSON.parse(localStorage.getItem('cards'));
  const grid = document.getElementById('cardsGrid');
  if(!grid) return;
  const q = (filter||'').toLowerCase();
  grid.innerHTML = '';
  
  cards.filter(c=>c.name.toLowerCase().includes(q)).forEach(c=>{
    const el = document.createElement('div');
    el.className = 'card-ui';
    
    el.innerHTML = `
      <button class="card-delete-btn" onclick="deleteCard(event, ${c.id})" title="Delete Card">×</button>
      <div class="card-header">
        <div class="card-icon">${c.name.charAt(0)}</div>
        <div>
            <div class="card-title">${c.name}</div>
            <div class="card-sub">Click to open</div>
        </div>
      </div>
    `;
    el.onclick = (e)=>{ 
       // Prevent navigation if clicking the delete button
       if(e.target.tagName === 'BUTTON' || e.target.closest('.card-delete-btn')) return;
       goTo('card.html', c.id); 
    };
    grid.appendChild(el);
  });
}

function deleteCard(e, id){
  e.stopPropagation(); 
  if(confirm("Are you sure? This will delete the Card and ALL its files/folders.")){
    let cards = JSON.parse(localStorage.getItem('cards'));
    cards = cards.filter(c => c.id != id);
    localStorage.setItem('cards', JSON.stringify(cards));

    // Clean up associated data (folders & files)
    let folders = JSON.parse(localStorage.getItem('folders')).filter(f => f.cardId != id);
    localStorage.setItem('folders', JSON.stringify(folders));
    
    let rootFiles = JSON.parse(localStorage.getItem('rootFiles')).filter(f => f.cardId != id);
    localStorage.setItem('rootFiles', JSON.stringify(rootFiles));

    renderCards();
    renderSidebar(); // Update sidebar immediately
  }
}

function filterCards(){ const q=document.getElementById('search').value||''; renderCards(q); }

// ==========================================
// 5. CARD DETAILS PAGE LOGIC
// ==========================================

function goBack(){
  const currentFolderId = localStorage.getItem('currentFolderId');
  if(currentFolderId) {
    // If inside a folder, go back to Card Root
    localStorage.removeItem('currentFolderId');
    renderCardView();
  } else {
    // If at Card Root, go back to Dashboard
    window.location='home.html';
  }
}

function renderCardView() {
  const cardId = localStorage.getItem('currentCard');
  const folderId = localStorage.getItem('currentFolderId');
  const cards = JSON.parse(localStorage.getItem('cards'));
  const card = cards.find(c=>c.id==cardId) || {name:'Untitled'};
  
  renderSidebar(); // Ensure sidebar highlighting is correct

  const titleEl = document.getElementById('cardTitle');
  const subEl = document.getElementById('cardSubtitle');
  const actionBtn = document.querySelector('.top-actions'); 

  if (folderId) {
    // --- SCENARIO A: INSIDE A SPECIFIC FOLDER ---
    const folders = JSON.parse(localStorage.getItem('folders'));
    const folder = folders.find(f=>f.id==folderId);
    titleEl.innerText = `${card.name} / ${folder.name}`;
    subEl.innerText = "Viewing folder contents";
    
    actionBtn.innerHTML = `
      <button class="btn" onclick="document.getElementById('folderFileInput').click()">+ Upload File</button>
      <input type="file" id="folderFileInput" class="hidden-input" onchange="uploadFileToFolder(${folder.id}, this.files[0])">
    `;
    renderFolderContents(folder);
    
  } else {
    // --- SCENARIO B: AT CARD ROOT (MIXED VIEW) ---
    titleEl.innerText = card.name;
    subEl.innerText = "Folders and Files";
    
    actionBtn.innerHTML = `
      <div style="display:flex; gap:10px;">
        <button class="btn" onclick="showNewFolder()">+ New Folder</button>
        <button class="btn" onclick="document.getElementById('cardRootInput').click()">+ Upload File</button>
      </div>
      <input type="file" id="cardRootInput" class="hidden-input" onchange="uploadFileToCardRoot(this.files[0])">
    `;
    renderMixedCardContent(cardId);
  }
}

// --- RENDERERS ---

function renderMixedCardContent(cardId) {
  const area = document.getElementById('foldersArea');
  if(!area) return;
  area.innerHTML = '';
  
  const grid = document.createElement('div');
  grid.className = 'items-grid';
  
  const folders = JSON.parse(localStorage.getItem('folders')).filter(f=>f.cardId==cardId);
  const rootFiles = JSON.parse(localStorage.getItem('rootFiles')).filter(f=>f.cardId==cardId);

  // Render Folders
  folders.forEach(f => {
    const el = document.createElement('div');
    el.className = 'folder-square';
    el.onclick = (e) => {
       if(e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
       enterFolder(f.id);
    };
    el.innerHTML = `
      <div class="actions-overlay">
        <button class="btn-icon" onclick="renameFolder(${f.id})" title="Rename">✎</button>
        <button class="btn-icon danger" onclick="deleteFolder(${f.id})" title="Delete">×</button>
      </div>
      <div class="folder-icon-large">📁</div>
      <div class="folder-name">${f.name}</div>
    `;
    grid.appendChild(el);
  });

  // Render Root Files
  rootFiles.forEach(f => {
    const el = document.createElement('div');
    el.className = 'file-square';
    el.innerHTML = `
      <div class="actions-overlay">
        <button class="btn-icon" onclick="renameRootFile(${f.id})" title="Rename">✎</button>
        <button class="btn-icon danger" onclick="deleteRootFile(${f.id})" title="Delete">×</button>
      </div>
      <div class="file-icon-large">📄</div>
      <a href="${f.data}" download="${f.name}" class="file-name" title="${f.name}">${f.name}</a>
    `;
    grid.appendChild(el);
  });
  
  area.appendChild(grid);
  if(folders.length === 0 && rootFiles.length === 0) {
    area.innerHTML = '<div class="muted">Empty card. Create a folder or upload a file.</div>';
  }
}

function renderFolderContents(folder) {
  const area = document.getElementById('foldersArea');
  area.innerHTML = ''; 
  const grid = document.createElement('div');
  grid.className = 'items-grid';
  
  if(!folder.files || folder.files.length === 0) {
    area.innerHTML = '<div class="muted">Empty folder. Upload a file.</div>';
    return;
  }

  folder.files.forEach((file, index) => {
    const el = document.createElement('div');
    el.className = 'file-square';
    el.innerHTML = `
      <div class="actions-overlay">
        <button class="btn-icon" onclick="renameFileInFolder(${folder.id}, ${index})" title="Rename">✎</button>
        <button class="btn-icon danger" onclick="deleteFileInFolder(${folder.id}, ${index})" title="Delete">×</button>
      </div>
      <div class="file-icon-large">📄</div>
      <a href="${file.data}" download="${file.name}" class="file-name" title="${file.name}">${file.name}</a>
    `;
    grid.appendChild(el);
  });
  
  area.appendChild(grid);
}

// ==========================================
// 6. ACTIONS & CRUD OPERATIONS
// ==========================================

function enterFolder(folderId) { 
  localStorage.setItem('currentFolderId', folderId); 
  renderCardView(); 
}

function showNewFolder(){ document.getElementById('folderModal').classList.remove('hidden'); }
function closeFolderModal(){ document.getElementById('folderModal').classList.add('hidden'); }

function createFolder(){
  const name = document.getElementById('folderInput').value.trim();
  if(!name) return alert('Enter name');
  const folders = JSON.parse(localStorage.getItem('folders'));
  const cardId = localStorage.getItem('currentCard');
  folders.unshift({id: Date.now(), cardId, name, files: []});
  localStorage.setItem('folders', JSON.stringify(folders));
  closeFolderModal();
  renderCardView();
}

// --- FOLDER CRUD ---
function renameFolder(id) { 
  const folders = JSON.parse(localStorage.getItem('folders'));
  const f = folders.find(x=>x.id==id);
  const n = prompt("New name:", f.name);
  if(n){ 
    f.name=n.trim(); 
    localStorage.setItem('folders', JSON.stringify(folders)); 
    renderCardView(); 
  }
}

function deleteFolder(id) { 
  if(confirm("Delete folder?")){ 
    const folders = JSON.parse(localStorage.getItem('folders')).filter(x=>x.id!=id); 
    localStorage.setItem('folders', JSON.stringify(folders)); 
    renderCardView(); 
  }
}

// --- FILE CRUD (Inside Folders) ---
function uploadFileToFolder(folderId, file) { 
  if(!file) return;
  if(file.size > 2000000) return alert("File too large (Max 2MB)"); 
  const reader = new FileReader(); 
  reader.onload = e => { 
    const folders = JSON.parse(localStorage.getItem('folders'));
    const f = folders.find(x=>x.id==folderId);
    if(!f.files) f.files = [];
    f.files.unshift({name:file.name, data:e.target.result}); 
    localStorage.setItem('folders', JSON.stringify(folders)); 
    renderCardView(); 
  }; 
  reader.readAsDataURL(file); 
}

function renameFileInFolder(fid, idx) { 
  const folders = JSON.parse(localStorage.getItem('folders'));
  const f = folders.find(x=>x.id==fid); 
  const n = prompt("Rename:", f.files[idx].name); 
  if(n){ 
    f.files[idx].name=n; 
    localStorage.setItem('folders', JSON.stringify(folders)); 
    renderCardView(); 
  }
}

function deleteFileInFolder(fid, idx) { 
  if(confirm("Delete file?")){ 
    const folders = JSON.parse(localStorage.getItem('folders'));
    const f = folders.find(x=>x.id==fid); 
    f.files.splice(idx,1); 
    localStorage.setItem('folders', JSON.stringify(folders)); 
    renderCardView(); 
  }
}

// --- FILE CRUD (Root of Card) ---
function uploadFileToCardRoot(file) { 
  if(!file) return;
  if(file.size > 2000000) return alert("File too large (Max 2MB)");
  const reader = new FileReader(); 
  reader.onload = e => { 
    const rootFiles = JSON.parse(localStorage.getItem('rootFiles'));
    rootFiles.unshift({
      id: Date.now(), 
      cardId: localStorage.getItem('currentCard'), 
      name: file.name, 
      data: e.target.result
    }); 
    localStorage.setItem('rootFiles', JSON.stringify(rootFiles)); 
    renderCardView(); 
  }; 
  reader.readAsDataURL(file); 
}

function renameRootFile(id) { 
  const rootFiles = JSON.parse(localStorage.getItem('rootFiles'));
  const f = rootFiles.find(x=>x.id==id); 
  const n = prompt("Rename:", f.name); 
  if(n){ 
    f.name=n; 
    localStorage.setItem('rootFiles', JSON.stringify(rootFiles)); 
    renderCardView(); 
  }
}

function deleteRootFile(id) { 
  if(confirm("Delete file?")){ 
    const rootFiles = JSON.parse(localStorage.getItem('rootFiles')).filter(x=>x.id!=id); 
    localStorage.setItem('rootFiles', JSON.stringify(rootFiles)); 
    renderCardView(); 
  }
}

// ==========================================
// 7. INITIALIZATION
// ==========================================
// Check which page we are on and run appropriate functions

if(document.getElementById('sidebarNav')) renderSidebar();

if(window.location.pathname.includes('home.html')) {
  renderCards();
}

if(window.location.pathname.includes('card.html')) {
  renderCardView();
}