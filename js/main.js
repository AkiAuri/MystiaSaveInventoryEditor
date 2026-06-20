// --- GLOBAL STATE ---
let globalDictionary = {};
let globalMechanics = {};
let saveState = {};
let currentCategory = 'player';

// --- TOAST SYSTEM ---
window.showToast = function(message, type = "success") {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerText = message;
    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
};

// Load Base Dictionaries
Promise.all([
    fetch('mystia_dictionary.json').then(res => res.json()),
    fetch('mystia_mechanics.json').then(res => res.json())
]).then(([dictData, mechData]) => {
    globalDictionary = dictData;
    globalMechanics = mechData;
}).catch(err => {
    window.showToast("Error loading JSON files! Ensure local server is active.", "error");
});

// --- SAVE FILE UPLOAD LOGIC ---
document.getElementById('saveUpload').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            saveState = JSON.parse(e.target.result);
            populateLandingCard();
            window.showToast("Save file loaded!", "success");
        } catch (error) {
            window.showToast("Error parsing save file!", "error");
        }
    };
    reader.readAsText(file);
});

// --- POPULATE THE THEMATIC SAVE CARD ---
function populateLandingCard() {
    const saveCard = document.getElementById('saveCard');
    const player = saveState.playerPartial || {};

    // 1. Day Badge
    const day = player.gameDate?.day || 1;
    document.getElementById('dayBadge').innerText = `${day}/100`; // Assuming 100 days limit visual

    // 2. Title & Date
    document.getElementById('cardTitle').innerText = "Renewing Your Save ~\nSave Editor ~";
    const dateObj = new Date();
    document.getElementById('cardDate').innerText = dateObj.toLocaleDateString('en-US') + "\n" + dateObj.toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit'});

    // 3. Money & Level
    document.getElementById('cardMoney').innerText = `¥${player.fund || 0}`;
    document.getElementById('cardLevel').innerText = `Lv${player.level || 1}`;

    // 4. DLC Tags
    const dlcContainer = document.getElementById('cardDLCs');
    dlcContainer.innerHTML = "";
    if (saveState.dayScenePartialDLC) {
        for (const dlc in saveState.dayScenePartialDLC) {
            const badge = document.createElement('div');
            badge.className = "dlc-tag";
            badge.innerText = dlc;
            dlcContainer.appendChild(badge);
        }
    }

    // 5. Transform Card State
    saveCard.classList.add('has-data');

    // REMOVE the 'for' attribute so clicking the card no longer opens the file dialog, allowing the overlay buttons to function safely.
    saveCard.removeAttribute('for');
}

// --- LANDING SCREEN BUTTONS ---
document.getElementById('btnEdit').addEventListener('click', (e) => {
    e.preventDefault(); // Stop label trigger
    document.getElementById('landingScreen').style.display = 'none';
    document.getElementById('editorMain').style.display = 'block';
    refreshUI();
});

document.getElementById('btnDownload').addEventListener('click', (e) => {
    e.preventDefault();
    downloadSave();
});

document.getElementById('btnClear').addEventListener('click', (e) => {
    e.preventDefault();
    saveState = {};
    document.getElementById('saveCard').classList.remove('has-data');
    document.getElementById('saveCard').setAttribute('for', 'saveUpload'); // Re-enable file upload click

    // Reset Card Visuals
    document.getElementById('dayBadge').innerText = "New";
    document.getElementById('cardTitle').innerHTML = 'Select Save File<br><span style="font-size: 14px; font-weight: normal;">(Mystia#0.memory)</span>';
    document.getElementById('cardDate').innerText = "--/--/----";
    document.getElementById('cardMoney').innerText = "¥ 0";
    document.getElementById('cardLevel').innerText = "Lv --";
    document.getElementById('cardDLCs').innerHTML = "";

    document.getElementById('saveUpload').value = ""; // Clear file input cache
    window.showToast("Save file cleared from memory.", "warning");
});

document.getElementById('closeEditorBtn').addEventListener('click', () => {
    document.getElementById('editorMain').style.display = 'none';
    document.getElementById('landingScreen').style.display = 'flex';
    populateLandingCard(); // Update the card with the new edited stats
});

// --- TAB ROUTING ---
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        currentCategory = e.target.getAttribute('data-target');
        refreshUI();
    });
});

// --- MASTER RENDERER ---
function refreshUI() {
    const container = document.getElementById('editorContainer');
    const toolbar = document.getElementById('toolbar');
    container.innerHTML = '';

    if (currentCategory === 'player') {
        toolbar.style.display = 'none';
        renderPlayerProfile(container);
    }
    else if (currentCategory === 'merchants') {
        toolbar.style.display = 'none';
        renderMerchants(container);
    }
    else if (currentCategory === 'bonds') {
        toolbar.style.display = 'none';
        renderBonds(container);
    }
    else {
        toolbar.style.display = 'flex';
        renderInventory(container, currentCategory);
    }
}

// --- EXPORT LOGIC ---
function downloadSave() {
    if (!saveState || Object.keys(saveState).length === 0) {
        window.showToast("No save loaded!", "error");
        return;
    }
    const modifiedJson = JSON.stringify(saveState, null, 2);
    const blob = new Blob([modifiedJson], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "Mystia#0_Edited.memory";
    a.click();
    URL.revokeObjectURL(url);
    window.showToast("Save file downloaded successfully!", "success");
}