// modules/settings.js

// Get one or multiple settings
export function getSetting(keys, callback) {
    chrome.storage.sync.get(keys, callback);
}

// Set one or multiple settings
export function setSetting(items, callback) {
    chrome.storage.sync.set(items, callback);
}

// Listen for changes to settings
export function onSettingChange(callback) {
    chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'sync') callback(changes);
    });
}

// Save local data like ZIP files
export function saveLocalData(key, arrayBuffer, callback) {
    chrome.storage.local.set({ [key]: arrayBuffer }, callback);
}

// Load local data
export function loadLocalData(key, callback) {
    chrome.storage.local.get(key, callback);
}
