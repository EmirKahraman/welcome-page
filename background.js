// -------------------------------------------------------------------------
// ------------------- ELEMENT REFERENCES ----------------------------------
// Cache references to DOM elements for background video, image, and drop zone
const bgVideo = document.getElementById('bgVideo');
const bgImage = document.getElementById('bgImage'); 
const dropZone = document.getElementById('drop_zone');

// -------------------------------------------------------------------------
// ------------------- BACKGROUND STORAGE (IndexedDB) ----------------------
// Initialize IndexedDB for storing background media
let db;
const dbRequest = indexedDB.open('backgroundDB', 1);

// Triggered when the database is created or upgraded
dbRequest.onupgradeneeded = event => {
    db = event.target.result;
    db.createObjectStore('videos'); // Create an object store named "videos"
};

// Triggered when the database is successfully opened
dbRequest.onsuccess = event => {
    db = event.target.result;
    loadMedia(); // Attempt to load saved background media
};

// Triggered on database errors
dbRequest.onerror = event => {
    console.error('IndexedDB error:', event.target.error);
};

// Save a media file to the IndexedDB
function saveMedia(file) {
    const tx = db.transaction('videos', 'readwrite');
    tx.objectStore('videos').put(file, 'background'); 
}

// Load the background media from IndexedDB and display it
function loadMedia() {
    const tx = db.transaction('videos', 'readonly');
    const store = tx.objectStore('videos');
    const req = store.get('background');

    req.onsuccess = () => {
        const file = req.result;
        if (file) {
            displayMedia(file); // Show saved media
            hideDropZone();
        } else showDropZone(); // Show drop zone if no media saved
    };

    req.onerror = () => {
        console.error('Failed to load background');
        showDropZone();
    };
}

// -------------------------------------------------------------------------
// ------------------- BACKGROUND INTERFACE --------------------------------
// Show the drag-and-drop overlay
function showDropZone() {
    dropZone.style.display = 'flex';
    dropZone.setAttribute('aria-hidden', 'false');
}

// Hide the drag-and-drop overlay
function hideDropZone() {
    dropZone.style.display = 'none';
    dropZone.setAttribute('aria-hidden', 'true');
}

// Validate if the selected file is an acceptable image or video
function isValidMediaFile(file) {
    if (!file) return false;
    return file.type.startsWith('video') || file.type.startsWith('image') ||
           /\.(mp4|webm|jpe?g|png|gif|webp)$/i.test(file.name);
}

// Display the media file (video or image) on the page
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

// Handle a new media file: validate, display, hide drop zone, and save
async function handleMedia(file) {
    if (!isValidMediaFile(file)) return alert('Unsupported file type.');
    displayMedia(file);
    hideDropZone();
    saveMedia(file);
}

// -------------------------------------------------------------------------
// ------------------- USER INPUT HANDLING ---------------------------------
// Create a hidden file input for selecting media manually
const fileInput = document.createElement('input');
fileInput.type = 'file';
fileInput.accept = 'video/mp4,video/webm,image/*';
fileInput.style.display = 'none';
document.body.appendChild(fileInput);

// Handle file selection via the hidden input
fileInput.addEventListener('change', e => {
    const file = e.target.files[0];
    if (file) handleMedia(file);
    fileInput.value = ''; // Reset input value
});

// Open file selector when the drop zone is clicked
dropZone.addEventListener('click', () => fileInput.click());

// Highlight drop zone when a file is dragged over
['dragenter', 'dragover'].forEach(ev => {
    dropZone.addEventListener(ev, e => {
        e.preventDefault(); 
        e.stopPropagation();
        dropZone.classList.add('dragover');
    });
});

// Remove highlight when the drag leaves the drop zone
['dragleave', 'dragend', 'mouseout'].forEach(ev => {
    dropZone.addEventListener(ev, e => {
        e.preventDefault(); 
        e.stopPropagation();
        dropZone.classList.remove('dragover');
    });
});

// Handle dropping a file onto the drop zone
dropZone.addEventListener('drop', e => {
    e.preventDefault(); 
    e.stopPropagation();
    dropZone.classList.remove('dragover');
    const file = e.dataTransfer?.files?.[0];
    if (file) handleMedia(file);
});

// Clear the stored background media when Shift + Right-Click is used
document.addEventListener('contextmenu', e => {
    if (e.shiftKey) {
        e.preventDefault();
        if (confirm('Clear stored background media?')) {
            const tx = db.transaction('videos', 'readwrite');
            tx.objectStore('videos').delete('background');
            bgVideo.pause(); 
            bgVideo.src = ''; 
            bgVideo.style.display = 'none';
            bgImage.src = ''; 
            bgImage.style.display = 'none';
            showDropZone();
        }
    }
});
