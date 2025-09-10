const bgVideo = document.getElementById('bgVideo');
const bgImage = document.getElementById('bgImage'); // added element for images
const speedDialContainer = document.getElementById('speed_dial_container');
const addSpeedDialBtn = document.getElementById('add_speed_dial_btn');
const dropZone = document.getElementById('drop_zone');

//-------------------------------------------------------------------------
// ---------- INDEXEDDB SETUP FOR MEDIA STORAGE ----------

let db;
const dbRequest = indexedDB.open('backgroundDB', 1);

dbRequest.onupgradeneeded = function(event) {
    db = event.target.result;
    db.createObjectStore('videos'); // still using 'videos' store
};

dbRequest.onsuccess = function(event) {
    db = event.target.result;
    loadMedia(); // renamed from loadVideo to loadMedia
};

dbRequest.onerror = function(event) {
    console.error('IndexedDB error:', event.target.error);
};

// ---------- Save media to IndexedDB ----------
function saveMedia(file) {
    const tx = db.transaction('videos', 'readwrite');
    const store = tx.objectStore('videos');
    store.put(file, 'background'); // store under key 'background'
}

// ---------- Load media from IndexedDB ----------
function loadMedia() {
    const tx = db.transaction('videos', 'readonly');
    const store = tx.objectStore('videos');
    const getRequest = store.get('background');

    getRequest.onsuccess = function() {
        const file = getRequest.result;
        if (file) {
            displayMedia(file);
            hideDropZone();
        } else {
            showDropZone();
        }
    };

    getRequest.onerror = function() {
        console.error('Failed to load media from IndexedDB');
        showDropZone();
    };
}

//-------------------------------------------------------------------------
// ---------- BACKGROUND INTERFACE ----------

// ---------- Helpers ----------
function showDropZone() {
    dropZone.style.display = 'flex';
    dropZone.setAttribute('aria-hidden', 'false');
}

function hideDropZone() {
    dropZone.style.display = 'none';
    dropZone.setAttribute('aria-hidden', 'true');
}

// ---------- Minimal change here: accept images too ----------
function isValidMediaFile(file) {
    if (!file) return false;
    const t = file.type || '';
    return t.startsWith('video') || t.startsWith('image') ||
           /\.(mp4|webm|jpe?g|png|gif|webp)$/i.test(file.name);
}

// ---------- Display video or image ----------
function displayMedia(file) {
    const url = URL.createObjectURL(file);
    if (file.type.startsWith('video') || /\.(mp4|webm)$/i.test(file.name)) {
        bgImage.style.display = 'none';
        bgVideo.src = url;
        bgVideo.style.display = 'block';
        bgVideo.play().catch(console.error);
    } else {
        bgVideo.style.display = 'none';
        bgImage.src = url;
        bgImage.style.display = 'block';
    }
}

// ---------- Handle Media Selection ----------
async function handleMedia(file) {
    if (!isValidMediaFile(file)) return alert('Unsupported file type.');

    displayMedia(file);
    hideDropZone();   // <<< added this line to auto-hide drop zone
    saveMedia(file);
}

// ---------- User Media Selection (Click) ----------
const fileInput = document.createElement('input');
fileInput.type = 'file';
fileInput.accept = 'video/mp4,video/webm,image/jpeg,image/png,image/gif,image/webp';
fileInput.style.display = 'none';
document.body.appendChild(fileInput);

fileInput.addEventListener('change', e => {
    const file = e.target.files[0];
    if (file) handleMedia(file);
    fileInput.value = '';
});

dropZone.addEventListener('click', () => fileInput.click());

// ---------- Drag & Drop ----------
['dragenter', 'dragover'].forEach(ev => {
    dropZone.addEventListener(ev, e => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.add('dragover');
    });
});

['dragleave', 'dragend', 'mouseout'].forEach(ev => {
    dropZone.addEventListener(ev, e => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('dragover');
    });
});

dropZone.addEventListener('drop', e => {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.remove('dragover');

    const file = e.dataTransfer?.files?.[0];
    if (file) handleMedia(file);
});

// ---------- Clear Background (Shift+Right-Click) ----------
document.addEventListener('contextmenu', e => {
    if (e.shiftKey) {
        e.preventDefault();
        if (confirm('Clear stored background media?')) {
            const tx = db.transaction('videos', 'readwrite');
            const store = tx.objectStore('videos');
            store.delete('background');
            bgVideo.pause();
            bgVideo.src = '';
            bgVideo.style.display = 'none';
            bgImage.src = '';
            bgImage.style.display = 'none';
            showDropZone();
        }
    }
});

//-------------------------------------------------------------------------
// ---------- SPEED DIALS ----------

// Load Speed Dials
(async function loadSpeedDials() {
    const { speedDialLinks = [], hide_speed_dial } = await chrome.storage.sync.get(['speedDialLinks', 'hide_speed_dial']);
    speedDialContainer.style.display = hide_speed_dial ? 'none' : 'flex';
    renderSpeedDials(speedDialLinks);
})();

// Render Speed Dials
function renderSpeedDials(links) {
    speedDialContainer.innerHTML = '';
    speedDialContainer.appendChild(addSpeedDialBtn);

    links.forEach(link => {
        const a = document.createElement('a');
        a.href = link.url;
        a.target = "_blank";
        a.title = link.name;
        a.className = "speed_dial_link";

        const img = document.createElement('img');
        try {
            img.src = `https://www.google.com/s2/favicons?domain=${new URL(link.url).hostname}&sz=64`;
        } catch {
            img.src = '';
        }
        img.alt = link.name;

        a.appendChild(img);
        speedDialContainer.appendChild(a);
    });
}

// Add Speed Dial Button
addSpeedDialBtn.addEventListener('click', () => {
    document.getElementById('speed_dial_form').style.display = 'block';
    document.getElementById('new_link_name').focus();
});
