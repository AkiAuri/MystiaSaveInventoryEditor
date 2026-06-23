// --- HELPER: Find Item Name across all DLCs ---
function getItemDetails(category, id) {
    for (const module in globalDictionary) {
        if (globalDictionary[module][category] && globalDictionary[module][category][id]) {
            return { name: globalDictionary[module][category][id], module: module };
        }
    }
    return { name: `Unknown (ID: ${id})`, module: "UNKNOWN" };
}

// --- HELPER: Target Correct DLC Storage Block ---
function getStorageTarget(module, category) {
    if (module === 'CORE') {
        if (!saveState.storagePartial) saveState.storagePartial = {};
        if (!saveState.storagePartial[category]) saveState.storagePartial[category] = {};
        return saveState.storagePartial[category];
    } else {
        if (!saveState.storagePartialDLC) saveState.storagePartialDLC = {};
        if (!saveState.storagePartialDLC[module]) saveState.storagePartialDLC[module] = {};
        if (!saveState.storagePartialDLC[module][category]) saveState.storagePartialDLC[module][category] = {};
        return saveState.storagePartialDLC[module][category];
    }
}

// --- LIVE SEARCH LISTENERS ---
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('searchInput')?.addEventListener('input', () => {
        if (currentCategory !== 'player' && currentCategory !== 'merchants' && currentCategory !== 'bonds') {
            refreshUI();
        }
    });

    document.getElementById('addSearchInput')?.addEventListener('input', () => {
        if (currentCategory !== 'player' && currentCategory !== 'merchants' && currentCategory !== 'bonds') {
            updateAddDropdown(currentCategory);
        }
    });

    // Add Single Item (Routed to correct DLC)
    document.getElementById('addItemBtn')?.addEventListener('click', () => {
        const select = document.getElementById('addItemSelect');
        const idToAdd = select.value;

        if (idToAdd && currentCategory !== 'player' && currentCategory !== 'merchants' && currentCategory !== 'bonds') {
            // Find which module this item belongs to
            let itemModule = 'CORE';
            for (const mod in globalDictionary) {
                if (globalDictionary[mod][currentCategory] && globalDictionary[mod][currentCategory][idToAdd]) {
                    itemModule = mod; break;
                }
            }

            const targetStorage = getStorageTarget(itemModule, currentCategory);
            targetStorage[idToAdd] = 1;

            const addSearch = document.getElementById('addSearchInput');
            if (addSearch) addSearch.value = "";

            refreshUI();
        }
    });

    // Mass Add "Add to Existing" (Scans both Core and DLCs)
    document.getElementById('massAddBtn')?.addEventListener('click', () => {
        const amountToAdd = parseInt(document.getElementById('massAddAmount').value, 10) || 50;

        if (currentCategory !== 'player' && currentCategory !== 'merchants' && currentCategory !== 'bonds') {

            // Loop through the master dictionary to find all possible items
            for (const module in globalDictionary) {
                const itemsInModule = globalDictionary[module][currentCategory];
                if (!itemsInModule) continue;

                const targetStorage = getStorageTarget(module, currentCategory);

                // Add only if the item already exists in the save file
                for (const id in itemsInModule) {
                    if (targetStorage.hasOwnProperty(id)) {
                        const currentAmount = parseInt(targetStorage[id], 10) || 0;

                        if (parseInt(id, 10) < 0 || currentAmount < 0) {
                            continue; // Skip negative/infinite items
                        }
                        targetStorage[id] = currentAmount + amountToAdd;
                    }
                }
            }

            const gridSearch = document.getElementById('searchInput');
            if (gridSearch) gridSearch.value = "";
            refreshUI();
        }
    });
});

// --- MAIN INVENTORY RENDERER ---
function renderInventory(container, category) {
    container.style.gridTemplateColumns = "repeat(auto-fill, minmax(220px, 1fr))";
    container.style.maxWidth = "none";

    const searchInput = document.getElementById('searchInput');
    const searchQuery = searchInput ? searchInput.value.toLowerCase() : "";
    let itemsRendered = 0;

    // Build unified inventory array containing Core and DLCs
    let unifiedInventory = [];

    // Extract CORE
    if (saveState.storagePartial && saveState.storagePartial[category]) {
        for (const [id, amount] of Object.entries(saveState.storagePartial[category])) {
            unifiedInventory.push({ id, amount, targetObj: saveState.storagePartial[category] });
        }
    }
    // Extract DLCs
    if (saveState.storagePartialDLC) {
        for (const dlc in saveState.storagePartialDLC) {
            if (saveState.storagePartialDLC[dlc][category]) {
                for (const [id, amount] of Object.entries(saveState.storagePartialDLC[dlc][category])) {
                    unifiedInventory.push({ id, amount, targetObj: saveState.storagePartialDLC[dlc][category] });
                }
            }
        }
    }

    for (const item of unifiedInventory) {
        const id = item.id;
        const amount = item.amount;
        const targetObj = item.targetObj;
        const details = getItemDetails(category, id);

        // --- TAG DECODING LOGIC ---
        let tagsHtml = '';
        let tagNames = [];

        if (globalMechanics.item_tags && globalMechanics.item_tags[category] && globalMechanics.item_tags[category][id]) {
            const mechData = globalMechanics.item_tags[category][id];
            let tagDictKey = (category === 'beverages') ? 'beverage_tags' : 'food_tags';

            if (mechData.tags && mechData.tags.length > 0) {
                tagNames = mechData.tags.map(tagId => {
                    const tagDetails = getItemDetails(tagDictKey, tagId.toString());
                    return tagDetails.name.startsWith("Unknown") ? `Tag ${tagId}` : tagDetails.name;
                });
                tagsHtml = `<div style="font-size: 11px; color: #1565C0; margin-bottom: 8px; font-weight: 500;">Tags: ${tagNames.join(', ')}</div>`;
            }
        }

        // --- SMART SEARCH FILTER ---
        const searchableText = `${details.name} ${details.module} ${tagNames.join(' ')}`.toLowerCase();
        if (searchQuery && !searchableText.includes(searchQuery)) {
            continue;
        }

        itemsRendered++;

        const card = document.createElement('div');
        card.className = 'item-card';

        const removeBtn = document.createElement('button');
        removeBtn.className = 'btn-remove';
        removeBtn.innerHTML = '&times;';
        removeBtn.onclick = () => {
            delete targetObj[id]; // Deletes from the exact Core or DLC object
            refreshUI();
        };

        card.innerHTML = `
            <div class="module-tag">${details.module}</div>
            <span>${details.name}</span>
            ${tagsHtml}
        `;

        const input = document.createElement('input');
        input.type = 'number';
        input.value = amount;
        input.min = "-1";

        input.addEventListener('change', (e) => {
            targetObj[id] = parseInt(e.target.value, 10);
        });

        card.appendChild(removeBtn);
        card.appendChild(input);
        container.appendChild(card);
    }

    if (itemsRendered === 0 && searchQuery !== "") {
        container.innerHTML = `<h3 style="grid-column: 1 / -1; color: #888;">No items match your search for "${searchQuery}"</h3>`;
    }

    updateAddDropdown(category);
}

// --- DROPDOWN & ADD ITEM LOGIC ---
function updateAddDropdown(category) {
    const select = document.getElementById('addItemSelect');
    const searchInput = document.getElementById('addSearchInput');
    const filterText = searchInput ? searchInput.value.toLowerCase() : "";

    if (!select) return;
    select.innerHTML = '<option value="">-- Select an item to add --</option>';

    // Build unified check for what we already own
    let unifiedOwned = {};
    if (saveState.storagePartial && saveState.storagePartial[category]) {
        Object.assign(unifiedOwned, saveState.storagePartial[category]);
    }
    if (saveState.storagePartialDLC) {
        for (const dlc in saveState.storagePartialDLC) {
            if (saveState.storagePartialDLC[dlc][category]) {
                Object.assign(unifiedOwned, saveState.storagePartialDLC[dlc][category]);
            }
        }
    }

    for (const module in globalDictionary) {
        const itemsInModule = globalDictionary[module][category];
        if (!itemsInModule) continue;

        const optgroup = document.createElement('optgroup');
        optgroup.label = module;

        for (const [id, name] of Object.entries(itemsInModule)) {
            if (!unifiedOwned.hasOwnProperty(id)) {

                let tagNames = [];
                if (globalMechanics.item_tags && globalMechanics.item_tags[category] && globalMechanics.item_tags[category][id]) {
                    const mechData = globalMechanics.item_tags[category][id];
                    let tagDictKey = (category === 'beverages') ? 'beverage_tags' : 'food_tags';

                    if (mechData.tags && mechData.tags.length > 0) {
                        tagNames = mechData.tags.map(tagId => {
                            const tagDetails = getItemDetails(tagDictKey, tagId.toString());
                            return tagDetails.name.startsWith("Unknown") ? `Tag ${tagId}` : tagDetails.name;
                        });
                    }
                }

                const searchableText = `${name} ${module} ${tagNames.join(' ')}`.toLowerCase();
                if (filterText && !searchableText.includes(filterText)) {
                    continue;
                }

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