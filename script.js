// ==========================================
// 1. GLOBAL SETTINGS & DATA
// ==========================================
const defaultCards = [
  {id:1,name:'CLZS'}, {id:2,name:'MEL'}, {id:3,name:'MPGL'}, {id:4,name:'STPP'}, {id:5,name:'TSPL'}
];

if(!localStorage.getItem('cards')) localStorage.setItem('cards', JSON.stringify(defaultCards));
if(!localStorage.getItem('folders')) localStorage.setItem('folders', JSON.stringify([]));
if(!localStorage.getItem('rootFiles')) localStorage.setItem('rootFiles', JSON.stringify([]));

// ==========================================
// 2. AUTHENTICATION
// ==========================================
function login(){
  const u = document.getElementById('username').value;
  const p = document.getElementById('password').value;
  if(u==='ADMIN' && p==='ADMIN'){ window.location = 'home.html'; }
  else alert('Invalid credentials');
}
function logout(){
  localStorage.removeItem('currentCard');
  localStorage.removeItem('currentFolderId');
  window.location = 'index.html';
}

// ==========================================
// 3. NAVIGATION & DASHBOARD
// ==========================================
function goHome(){ window.location = 'home.html'; }

function goTo(url, cardId){
  if(cardId) {
    localStorage.setItem('currentCard', cardId);
    localStorage.removeItem('currentFolderId'); // Reset folder when switching cards
  }
  window.location = url;
}

function openCreateCard(){ document.getElementById('modal').classList.remove('hidden'); }
function closeModal(){ document.getElementById('modal').classList.add('hidden'); }

function createCard(){
  const name = document.getElementById('newCardName').value.trim();
  if(!name) return alert('Enter name');
  const cards = JSON.parse(localStorage.getItem('cards'));
  const id = Date.now();
  cards.unshift({id, name});
  localStorage.setItem('cards', JSON.stringify(cards));
  closeModal(); renderCards();
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
    el.innerHTML = `<div class="card-header"><div class="card-icon">${c.name.charAt(0)}</div><div><div class="card-title">${c.name}</div><div class="card-sub">Click to open</div></div></div>`;
    el.onclick = ()=>{ goTo('card.html', c.id); };
    grid.appendChild(el);
  });
}
function filterCards(){ const q=document.getElementById('search').value||''; renderCards(q); }
if(window.location.pathname.includes('home.html')){ renderCards(); }


// ==========================================
// 4. CARD DETAILS PAGE logic
// ==========================================

function goBack(){
  const currentFolderId = localStorage.getItem('currentFolderId');
  if(currentFolderId) {
    // If inside a folder, go back to Card Root
    localStorage.removeItem('currentFolderId');
    renderCardView();
  } else {
    // If in Card Root, go back to Home
    window.location='home.html';
  }
}

if(window.location.pathname.includes('card.html')){
  renderCardView();
}

function renderCardView() {
  const cardId = localStorage.getItem('currentCard');
  const folderId = localStorage.getItem('currentFolderId');
  const cards = JSON.parse(localStorage.getItem('cards'));
  const card = cards.find(c=>c.id==cardId) || {name:'Untitled'};
  
  // 1. Highlight Sidebar Item (NEW)
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  const activeNav = document.getElementById('nav-'+cardId);
  if(activeNav) activeNav.classList.add('active');

  // 2. Update Titles & Buttons
  const titleEl = document.getElementById('cardTitle');
  const subEl = document.getElementById('cardSubtitle');
  const actionBtn = document.querySelector('.top-actions'); 

  if (folderId) {
    // --- INSIDE FOLDER ---
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
    // --- CARD ROOT ---
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

// --- ACTIONS ---

function enterFolder(folderId) { localStorage.setItem('currentFolderId', folderId); renderCardView(); }
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

// Rename/Delete Functions
function renameFolder(id) {
  const folders = JSON.parse(localStorage.getItem('folders'));
  const f = folders.find(x=>x.id==id);
  const n = prompt("New name:", f.name);
  if(n){ f.name=n.trim(); localStorage.setItem('folders', JSON.stringify(folders)); renderCardView(); }
}
function deleteFolder(id) {
  if(confirm("Delete folder?")){
    const folders = JSON.parse(localStorage.getItem('folders')).filter(x=>x.id!=id);
    localStorage.setItem('folders', JSON.stringify(folders));
    renderCardView();
  }
}
function uploadFileToFolder(folderId, file) {
  if(!file) return;
  if(file.size > 2000000) return alert("Max 2MB for demo");
  const reader = new FileReader();
  reader.onload = e => {
    const folders = JSON.parse(localStorage.getItem('folders'));
    const f = folders.find(x=>x.id==folderId);
    if(!f.files) f.files = [];
    f.files.unshift({name: file.name, data: e.target.result});
    localStorage.setItem('folders', JSON.stringify(folders));
    renderCardView();
  };
  reader.readAsDataURL(file);
}
function renameFileInFolder(fid, idx) {
  const folders = JSON.parse(localStorage.getItem('folders'));
  const f = folders.find(x=>x.id==fid);
  const n = prompt("Rename file:", f.files[idx].name);
  if(n){ f.files[idx].name=n.trim(); localStorage.setItem('folders', JSON.stringify(folders)); renderCardView(); }
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
function uploadFileToCardRoot(file) {
  if(!file) return;
  if(file.size > 2000000) return alert("Max 2MB for demo");
  const reader = new FileReader();
  reader.onload = e => {
    const rootFiles = JSON.parse(localStorage.getItem('rootFiles'));
    const cardId = localStorage.getItem('currentCard');
    rootFiles.unshift({id: Date.now(), cardId: cardId, name: file.name, data: e.target.result});
    localStorage.setItem('rootFiles', JSON.stringify(rootFiles));
    renderCardView();
  };
  reader.readAsDataURL(file);
}
function renameRootFile(id) {
  const rootFiles = JSON.parse(localStorage.getItem('rootFiles'));
  const f = rootFiles.find(x=>x.id==id);
  const n = prompt("Rename file:", f.name);
  if(n){ f.name=n.trim(); localStorage.setItem('rootFiles', JSON.stringify(rootFiles)); renderCardView(); }
}
function deleteRootFile(id) {
  if(confirm("Delete file?")){
    const rootFiles = JSON.parse(localStorage.getItem('rootFiles')).filter(x=>x.id!=id);
    localStorage.setItem('rootFiles', JSON.stringify(rootFiles));
    renderCardView();
  }
}