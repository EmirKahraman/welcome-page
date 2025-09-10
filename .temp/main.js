const bgVideo = document.getElementById('bgVideo');
const speedDialContainer = document.getElementById('speed_dial_container');
const addSpeedDialBtn = document.getElementById('add_speed_dial_btn');
const dropZone = document.getElementById('drop_zone');

//-------------------------------------------------------------------------
// ---------- INDEXEDDB SETUP FOR VIDEO STORAGE ----------

let db;
const dbRequest = indexedDB.open('backgroundDB', 1);

dbRequest.onupgradeneeded = function(event) {
    db = event.target.result;
    db.createObjectStore('videos'); // store videos with keys
};

dbRequest.onsuccess = function(event) {
    db = event.target.result;
    loadVideo(); // load video on page load
};

dbRequest.onerror = function(event) {
    console.error('IndexedDB error:', event.target.error);
};

// ---------- Save video to IndexedDB ----------
function saveVideo(file) {
    const tx = db.transaction('videos', 'readwrite');
    const store = tx.objectStore('videos');
    store.put(file, 'background'); // store under key 'background'
}

// ---------- Load video from IndexedDB ----------
function loadVideo() {
    const tx = db.transaction('videos', 'readonly');
    const store = tx.objectStore('videos');
    const getRequest = store.get('background');

    getRequest.onsuccess = function() {
        const file = getRequest.result;
        if (file) {
            const url = URL.createObjectURL(file);
            bgVideo.src = url;
            bgVideo.style.display = 'block';
            bgVideo.play().catch(console.error);
            hideDropZone();
        } else {
            showDropZone();
        }
    };

    getRequest.onerror = function() {
        console.error('Failed to load video from IndexedDB');
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

function isValidVideoFile(file) {
    if (!file) return false;
    const t = file.type || '';
    return t === 'video/mp4' || t === 'video/webm' || /\.mp4$/i.test(file.name) || /\.webm$/i.test(file.name);
}

// ---------- Handle Video Selection ----------
async function handleVideo(file) {
    if (!isValidVideoFile(file)) return alert('Please select a .mp4 or .webm file.');

    // Display video
    const url = URL.createObjectURL(file);
    bgVideo.src = url;
    bgVideo.style.display = 'block';
    bgVideo.play().catch(console.error);
    hideDropZone();

    // Save video to IndexedDB
    saveVideo(file);
}

// ---------- User Video Selection (Click) ----------
const fileInput = document.createElement('input');
fileInput.type = 'file';
fileInput.accept = 'video/mp4,video/webm';
fileInput.style.display = 'none';
document.body.appendChild(fileInput);

fileInput.addEventListener('change', e => {
    const file = e.target.files[0];
    if (file) handleVideo(file);
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
    if (file) handleVideo(file);
});

// ---------- Clear Background (Shift+Right-Click) ----------
document.addEventListener('contextmenu', e => {
    if (e.shiftKey) {
        e.preventDefault();
        if (confirm('Clear stored background video?')) {
            const tx = db.transaction('videos', 'readwrite');
            const store = tx.objectStore('videos');
            store.delete('background');
            bgVideo.pause();
            bgVideo.src = '';
            bgVideo.style.display = 'none';
            showDropZone();
        }
    }
});

//-------------------------------------------------------------------------
// ---------- SPEED DIALS ----------

// ---------- Load Speed Dials ----------
(async function loadSpeedDials() {
    const { speedDialLinks = [], hide_speed_dial } = await chrome.storage.sync.get(['speedDialLinks', 'hide_speed_dial']);
    speedDialContainer.style.display = hide_speed_dial ? 'none' : 'flex';
    renderSpeedDials(speedDialLinks);
})();

// ---------- Render Speed Dials ----------
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

// ---------- Add Speed Dial Button ----------
addSpeedDialBtn.addEventListener('click', () => {
    document.getElementById('speed_dial_form').style.display = 'block';
    document.getElementById('new_link_name').focus();
});
