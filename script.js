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
// 2. LOGIN PAGE LOGIC
// ==========================================

function toggleLoginView() {
  const container = document.getElementById('mainContainer');
  if(container) container.classList.toggle('active');
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
// 3. SHARED FUNCTIONS
// ==========================================

function renderSidebar(){
  const nav = document.getElementById('sidebarNav');
  if(!nav) return; 

  const cards = JSON.parse(localStorage.getItem('cards'));
  const currentCardId = localStorage.getItem('currentCard');
  const isHome = window.location.pathname.includes('home.html');

  nav.innerHTML = ''; 

  const dashBtn = document.createElement('a');
  dashBtn.className = `nav-item ${isHome ? 'active' : ''}`;
  dashBtn.innerText = 'Dashboard';
  dashBtn.onclick = () => goHome();
  nav.appendChild(dashBtn);

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
  renderSidebar();
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

    let folders = JSON.parse(localStorage.getItem('folders')).filter(f => f.cardId != id);
    localStorage.setItem('folders', JSON.stringify(folders));
    
    let rootFiles = JSON.parse(localStorage.getItem('rootFiles')).filter(f => f.cardId != id);
    localStorage.setItem('rootFiles', JSON.stringify(rootFiles));

    renderCards();
    renderSidebar();
  }
}

function filterCards(){ const q=document.getElementById('search').value||''; renderCards(q); }

// ==========================================
// 5. CARD DETAILS PAGE LOGIC
// ==========================================

function goBack(){
  const currentFolderId = localStorage.getItem('currentFolderId');
  if(currentFolderId) {
    // Check if we are inside a nested folder
    const allFolders = JSON.parse(localStorage.getItem('folders'));
    const currentFolder = allFolders.find(f => f.id == currentFolderId);
    
    if(currentFolder && currentFolder.parentId) {
      // Go up one level to parent folder
      localStorage.setItem('currentFolderId', currentFolder.parentId);
    } else {
      // Go back to root
      localStorage.removeItem('currentFolderId');
    }
    renderCardView();
  } else {
    window.location='home.html';
  }
}

function renderCardView() {
  const cardId = localStorage.getItem('currentCard');
  const folderId = localStorage.getItem('currentFolderId');
  const cards = JSON.parse(localStorage.getItem('cards'));
  const card = cards.find(c=>c.id==cardId) || {name:'Untitled'};
  
  renderSidebar();

  const titleEl = document.getElementById('cardTitle');
  const subEl = document.getElementById('cardSubtitle');
  const actionBtn = document.querySelector('.top-actions'); 

  if (folderId) {
    const folders = JSON.parse(localStorage.getItem('folders'));
    const folder = folders.find(f=>f.id==folderId);
    
    // Safety check if folder was deleted
    if(!folder) {
        localStorage.removeItem('currentFolderId');
        return renderCardView();
    }

    titleEl.innerText = `${card.name} / ... / ${folder.name}`;
    subEl.innerText = "Viewing folder contents";
    
    // UPDATED: Added "New Folder" button here to allow nesting
    actionBtn.innerHTML = `
      <div style="display:flex; gap:10px;">
        <button class="btn" onclick="showNewFolder()">+ New Folder</button>
        <button class="btn" onclick="document.getElementById('folderFileInput').click()">+ Upload File</button>
      </div>
      <input type="file" id="folderFileInput" class="hidden-input" onchange="uploadFileToFolder(${folder.id}, this.files[0])">
    `;
    renderFolderContents(folder);
    
  } else {
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

function renderMixedCardContent(cardId) {
  const area = document.getElementById('foldersArea');
  if(!area) return;
  area.innerHTML = '';
  const grid = document.createElement('div');
  grid.className = 'items-grid';
  
  // UPDATED: Only show folders that have NO parentId (Root Folders)
  const folders = JSON.parse(localStorage.getItem('folders')).filter(f => f.cardId == cardId && !f.parentId);
  const rootFiles = JSON.parse(localStorage.getItem('rootFiles')).filter(f => f.cardId == cardId);

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
  if(folders.length === 0 && rootFiles.length === 0) area.innerHTML = '<div class="muted">Empty card. Create a folder or upload a file.</div>';
}

function renderFolderContents(folder) {
  const area = document.getElementById('foldersArea');
  area.innerHTML = ''; 
  const grid = document.createElement('div');
  grid.className = 'items-grid';
  
  // 1. RENDER SUB-FOLDERS
  // Find folders where parentId matches the current folder's ID
  const allFolders = JSON.parse(localStorage.getItem('folders'));
  const subFolders = allFolders.filter(f => f.parentId == folder.id);

  subFolders.forEach(f => {
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

  // 2. RENDER FILES
  if((!folder.files || folder.files.length === 0) && subFolders.length === 0) {
    area.innerHTML = '<div class="muted">Empty folder. Create a subfolder or upload a file.</div>';
    return;
  }

  if(folder.files) {
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
  }
  
  area.appendChild(grid);
}

// ==========================================
// 6. ACTIONS & PROGRESS UI
// ==========================================

function enterFolder(folderId) { localStorage.setItem('currentFolderId', folderId); renderCardView(); }
function showNewFolder(){ document.getElementById('folderModal').classList.remove('hidden'); }
function closeFolderModal(){ document.getElementById('folderModal').classList.add('hidden'); }

function createFolder(){
  const name = document.getElementById('folderInput').value.trim();
  if(!name) return alert('Enter name');
  
  const folders = JSON.parse(localStorage.getItem('folders'));
  const cardId = localStorage.getItem('currentCard');
  const parentId = localStorage.getItem('currentFolderId'); // Check if inside another folder

  // UPDATED: Add parentId to new folder object
  folders.unshift({
      id: Date.now(), 
      cardId, 
      name, 
      parentId: parentId ? parseInt(parentId) : null, // Set parent ID if exists
      files: []
  });
  
  localStorage.setItem('folders', JSON.stringify(folders));
  closeFolderModal();
  renderCardView();
}

function renameFolder(id) { const f = JSON.parse(localStorage.getItem('folders')).find(x=>x.id==id); const n = prompt("New name:", f.name); if(n){ f.name=n.trim(); const all = JSON.parse(localStorage.getItem('folders')).map(x=>x.id==id?f:x); localStorage.setItem('folders', JSON.stringify(all)); renderCardView(); }}

// UPDATED: Delete folder and all its subfolders recursively
function deleteFolder(id) { 
  if(confirm("Delete folder and all its contents?")){ 
    let all = JSON.parse(localStorage.getItem('folders'));
    
    // Function to find all children IDs recursively
    function getChildrenIds(parentId) {
        return all.filter(f => f.parentId == parentId).map(f => f.id);
    }

    let idsToDelete = [id];
    let queue = [id];

    // Identify all nested folders
    while(queue.length > 0) {
        let currentId = queue.pop();
        let children = getChildrenIds(currentId);
        idsToDelete = idsToDelete.concat(children);
        queue = queue.concat(children);
    }

    // Filter out all deleted folders
    all = all.filter(x => !idsToDelete.includes(x.id));
    
    localStorage.setItem('folders', JSON.stringify(all)); 
    renderCardView(); 
  }
}

function updateProgressUI(fileName, percent) {
  let toast = document.getElementById('uploadToast');
  if(!toast) {
    toast = document.createElement('div');
    toast.id = 'uploadToast';
    toast.className = 'upload-toast';
    toast.innerHTML = `
      <div class="progress-header">
        <span class="progress-filename" id="pFileName">Uploading...</span>
        <span class="progress-percent" id="pPercent">0%</span>
      </div>
      <div class="progress-bar-bg">
        <div class="progress-bar-fill" id="pBar"></div>
      </div>
    `;
    document.body.appendChild(toast);
  }
  toast.classList.add('show');
  document.getElementById('pFileName').textContent = fileName;
  document.getElementById('pPercent').textContent = percent + '%';
  document.getElementById('pBar').style.width = percent + '%';
  if(percent >= 100) {
    setTimeout(() => { toast.classList.remove('show'); }, 2500);
  }
}

// ==========================================
// 7. SERVER UPLOAD FUNCTIONS
// ==========================================

function uploadFileToFolder(folderId, file) { 
  if(!file) return;
  // 2GB Limit Check
  if(file.size > 2147483648) return alert("File too large (Max 2GB)"); 

  const formData = new FormData();
  formData.append('file', file);

  const xhr = new XMLHttpRequest();
  xhr.open('POST', 'upload.php', true);

  xhr.upload.onprogress = (event) => {
    if (event.lengthComputable) {
      const percent = Math.round((event.loaded / event.total) * 100);
      updateProgressUI(file.name, percent);
    }
  };

  xhr.onload = () => {
    if (xhr.status === 200) {
      const response = JSON.parse(xhr.responseText);
      
      if(response.success) {
        updateProgressUI(file.name, 100);
        
        const folders = JSON.parse(localStorage.getItem('folders'));
        const f = folders.find(x=>x.id==folderId);
        if(!f.files) f.files = [];
        
        f.files.unshift({
            name: file.name, 
            data: response.filePath 
        }); 

        localStorage.setItem('folders', JSON.stringify(folders)); 
        renderCardView();
      } else {
        alert("Upload failed: " + response.message);
      }
    } else {
      alert("Server Error. Check upload_max_filesize in php.ini");
    }
  };

  xhr.send(formData); 
}

function uploadFileToCardRoot(file) { 
  if(!file) return;
  if(file.size > 2147483648) return alert("File too large (Max 2GB)");

  const formData = new FormData();
  formData.append('file', file);

  const xhr = new XMLHttpRequest();
  xhr.open('POST', 'upload.php', true);

  xhr.upload.onprogress = (event) => {
    if (event.lengthComputable) {
      const percent = Math.round((event.loaded / event.total) * 100);
      updateProgressUI(file.name, percent);
    }
  };

  xhr.onload = () => {
    if (xhr.status === 200) {
      const response = JSON.parse(xhr.responseText);
      
      if(response.success) {
        updateProgressUI(file.name, 100);

        const rootFiles = JSON.parse(localStorage.getItem('rootFiles'));
        rootFiles.unshift({
          id: Date.now(), 
          cardId: localStorage.getItem('currentCard'), 
          name: file.name, 
          data: response.filePath 
        }); 

        localStorage.setItem('rootFiles', JSON.stringify(rootFiles)); 
        renderCardView(); 
      } else {
        alert("Upload failed: " + response.message);
      }
    } else {
      alert("Server Error. Check upload_max_filesize in php.ini");
    }
  };

  xhr.send(formData); 
}

function renameRootFile(id) { const all = JSON.parse(localStorage.getItem('rootFiles')); const f = all.find(x=>x.id==id); const n = prompt("Rename:", f.name); if(n){ f.name=n; localStorage.setItem('rootFiles', JSON.stringify(all)); renderCardView(); }}
function deleteRootFile(id) { if(confirm("Delete?")){ const all = JSON.parse(localStorage.getItem('rootFiles')).filter(x=>x.id!=id); localStorage.setItem('rootFiles', JSON.stringify(all)); renderCardView(); }}
function renameFileInFolder(fid, idx) { const all = JSON.parse(localStorage.getItem('folders')); const f = all.find(x=>x.id==fid); const n = prompt("Rename:", f.files[idx].name); if(n){ f.files[idx].name=n; localStorage.setItem('folders', JSON.stringify(all)); renderCardView(); }}
function deleteFileInFolder(fid, idx) { if(confirm("Delete?")){ const all = JSON.parse(localStorage.getItem('folders')); const f = all.find(x=>x.id==fid); f.files.splice(idx,1); localStorage.setItem('folders', JSON.stringify(all)); renderCardView(); }}

// Initialization
if(document.getElementById('sidebarNav')) renderSidebar();
if(window.location.pathname.includes('home.html')) renderCards();
if(window.location.pathname.includes('card.html')) renderCardView();