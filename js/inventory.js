// --- HELPER: Find Item Name across all DLCs ---
function getItemDetails(category, id) {
    for (const module in globalDictionary) {
        if (globalDictionary[module][category] && globalDictionary[module][category][id]) {
            return { name: globalDictionary[module][category][id], module: module };
        }
    }
    return { name: `Unknown (ID: ${id})`, module: "UNKNOWN" };
}

// --- MAIN INVENTORY RENDERER ---
function renderInventory(container, category) {
    // Reset grid styling for inventory items
    container.style.gridTemplateColumns = "repeat(auto-fill, minmax(220px, 1fr))";
    container.style.maxWidth = "none";

    const inventory = saveState.storagePartial[category] || {};

    // 1. Loop through user's current items
    for (const [id, amount] of Object.entries(inventory)) {
        const details = getItemDetails(category, id);

        const card = document.createElement('div');
        card.className = 'item-card';

        // Red "X" button to delete items
        const removeBtn = document.createElement('button');
        removeBtn.className = 'btn-remove';
        removeBtn.innerHTML = '&times;';
        removeBtn.title = "Remove item entirely";
        removeBtn.onclick = () => {
            delete saveState.storagePartial[category][id];
            refreshUI();
        };

        card.innerHTML = `
            <div class="module-tag">${details.module}</div>
            <span>${details.name}</span>
        `;

        const input = document.createElement('input');
        input.type = 'number';
        input.value = amount;
        input.min = "-1";

        input.addEventListener('change', (e) => {
            saveState.storagePartial[category][id] = parseInt(e.target.value, 10);
        });

        card.appendChild(removeBtn);
        card.appendChild(input);
        container.appendChild(card);
    }

    // 2. Dynamically update the Add Item Dropdown
    updateAddDropdown(category);
}

// --- DROPDOWN & ADD ITEM LOGIC ---
function updateAddDropdown(category) {
    const select = document.getElementById('addItemSelect');
    select.innerHTML = '<option value="">-- Select an item to add --</option>';

    const inventory = saveState.storagePartial[category] || {};

    // Loop through the master dictionary to find items the user DOES NOT have
    for (const module in globalDictionary) {
        const itemsInModule = globalDictionary[module][category];
        if (!itemsInModule) continue;

        const optgroup = document.createElement('optgroup');
        optgroup.label = module;

        for (const [id, name] of Object.entries(itemsInModule)) {
            if (!inventory.hasOwnProperty(id)) {
                const option = document.createElement('option');
                option.value = id;
                option.innerText = name;
                optgroup.appendChild(option);
            }
        }

        if (optgroup.children.length > 0) {
            select.appendChild(optgroup);
        }
    }
}

// Attach the Add Button listener ONCE when the script loads
document.getElementById('addItemBtn').addEventListener('click', () => {
    const select = document.getElementById('addItemSelect');
    const idToAdd = select.value;

    // Make sure we have a selection and aren't on a settings tab
    if (idToAdd && currentCategory !== 'player' && currentCategory !== 'merchants' && currentCategory !== 'bonds') {

        // Ensure the category array exists in the user's save
        if (!saveState.storagePartial[currentCategory]) {
            saveState.storagePartial[currentCategory] = {};
        }

        // Add it with a quantity of 1
        saveState.storagePartial[currentCategory][idToAdd] = 1;
        refreshUI();
    }
});