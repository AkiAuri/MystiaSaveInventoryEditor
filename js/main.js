// --- GLOBAL STATE ---
let globalDictionary = {};
let globalMechanics = {};
let saveState = {};
let currentCategory = 'player';

// 1. Load Dictionary and Mechanics
Promise.all([
    fetch('mystia_dictionary.json').then(res => res.json()),
    fetch('mystia_mechanics.json').then(res => res.json())
]).then(([dictData, mechData]) => {
    globalDictionary = dictData;
    globalMechanics = mechData;
    console.log("Dictionary and Mechanics loaded successfully!");
}).catch(err => alert("Error loading JSON files! Ensure your local server is running."));

// 2. Load Save File
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
            refreshUI();
        } catch (error) {
            alert("Error parsing save file!");
        }
    };
    reader.readAsText(file);
});

// 3. Tab Routing Logic
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        currentCategory = e.target.getAttribute('data-target');
        refreshUI();
    });
});

// 4. The Master Renderer
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

// 5. Export Logic
document.getElementById('exportBtn').addEventListener('click', () => {
    const modifiedJson = JSON.stringify(saveState, null, 2);
    const blob = new Blob([modifiedJson], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "Mystia#0_Edited.memory";
    a.click();
    URL.revokeObjectURL(url);
});