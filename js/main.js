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

    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10);

    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
};

// Load both JSON files
Promise.all([
    fetch('mystia_dictionary.json').then(res => res.json()),
    fetch('mystia_mechanics.json').then(res => res.json())
]).then(([dictData, mechData]) => {
    globalDictionary = dictData;
    globalMechanics = mechData;
    console.log("Dictionary and Mechanics loaded successfully!");
}).catch(err => {
    window.showToast("Error loading JSON files! Ensure local server is active.", "error");
});

// Load Save File
document.getElementById('saveUpload').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            saveState = JSON.parse(e.target.result);
            document.getElementById('status').innerText = "Loaded successfully!";
            document.getElementById('exportBtn').style.display = "block";
            document.getElementById('tabContainer').style.display = "flex";
            window.showToast("Save file loaded!", "success");
            refreshUI();
        } catch (error) {
            window.showToast("Error parsing save file!", "error");
        }
    };
    reader.readAsText(file);
});

// Tab Routing Logic
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        currentCategory = e.target.getAttribute('data-target');
        refreshUI();
    });
});

// Master Renderer
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

// Export Logic
document.getElementById('exportBtn').addEventListener('click', () => {
    const modifiedJson = JSON.stringify(saveState, null, 2);
    const blob = new Blob([modifiedJson], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "Mystia#0_Edited.memory";
    a.click();
    URL.revokeObjectURL(url);
    window.showToast("Save file downloaded successfully!", "success");
});