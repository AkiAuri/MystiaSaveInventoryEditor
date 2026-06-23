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

// --- GLOBAL TAG CLICK HELPER ---
window.setSearchFilter = function(query) {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.value = query;
        refreshUI();
    }
};

// --- LISTENERS ---
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('searchInput')?.addEventListener('input', () => {
        if (currentCategory !== 'player' && currentCategory !== 'merchants' && currentCategory !== 'bonds') refreshUI();
    });

    document.getElementById('sortSelect')?.addEventListener('change', () => {
        if (currentCategory !== 'player' && currentCategory !== 'merchants' && currentCategory !== 'bonds') refreshUI();
    });

    document.getElementById('addSearchInput')?.addEventListener('input', () => {
        if (currentCategory !== 'player' && currentCategory !== 'merchants' && currentCategory !== 'bonds') updateAddDropdown(currentCategory);
    });

    document.getElementById('addItemBtn')?.addEventListener('click', () => {
        const select = document.getElementById('addItemSelect');
        const idToAdd = select.value;
        const itemName = select.options[select.selectedIndex]?.text;

        if (idToAdd && currentCategory !== 'player' && currentCategory !== 'merchants' && currentCategory !== 'bonds') {
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

            window.showToast(`Added ${itemName}!`, "success");
            refreshUI();
        }
    });

    document.getElementById('massAddBtn')?.addEventListener('click', () => {
        const amountToAdd = parseInt(document.getElementById('massAddAmount').value, 10) || 50;

        if (currentCategory !== 'player' && currentCategory !== 'merchants' && currentCategory !== 'bonds') {
            let modifiedCount = 0;

            for (const module in globalDictionary) {
                const itemsInModule = globalDictionary[module][currentCategory];
                if (!itemsInModule) continue;

                const targetStorage = getStorageTarget(module, currentCategory);

                for (const id in itemsInModule) {
                    if (targetStorage.hasOwnProperty(id)) {
                        const currentAmount = parseInt(targetStorage[id], 10) || 0;
                        if (parseInt(id, 10) < 0 || currentAmount < 0) continue;
                        targetStorage[id] = currentAmount + amountToAdd;
                        modifiedCount++;
                    }
                }
            }

            const gridSearch = document.getElementById('searchInput');
            if (gridSearch) gridSearch.value = "";

            window.showToast(`Added ${amountToAdd} to ${modifiedCount} existing items!`, "success");
            refreshUI();
        }
    });

    // Purge Zeroes Logic
    document.getElementById('purgeZeroesBtn')?.addEventListener('click', () => {
        if (currentCategory !== 'player' && currentCategory !== 'merchants' && currentCategory !== 'bonds') {
            let purgedCount = 0;

            // Clean Core
            const coreInv = saveState.storagePartial?.[currentCategory];
            if (coreInv) {
                for (const id in coreInv) {
                    if (parseInt(coreInv[id], 10) === 0) {
                        delete coreInv[id];
                        purgedCount++;
                    }
                }
            }

            // Clean DLCs
            if (saveState.storagePartialDLC) {
                for (const dlc in saveState.storagePartialDLC) {
                    const dlcInv = saveState.storagePartialDLC[dlc][currentCategory];
                    if (dlcInv) {
                        for (const id in dlcInv) {
                            if (parseInt(dlcInv[id], 10) === 0) {
                                delete dlcInv[id];
                                purgedCount++;
                            }
                        }
                    }
                }
            }

            window.showToast(purgedCount > 0 ? `Cleaned up! Removed ${purgedCount} items with 0 amount.` : "No items with 0 amount found.", purgedCount > 0 ? "success" : "warning");
            refreshUI();
        }
    });
});

// --- MAIN INVENTORY RENDERER ---
function renderInventory(container, category) {
    container.style.gridTemplateColumns = "repeat(auto-fill, minmax(220px, 1fr))";
    container.style.maxWidth = "none";

    const searchInput = document.getElementById('searchInput');
    const sortMode = document.getElementById('sortSelect')?.value || 'default';

    // Split the search query by commas to support multiple tags, remove empty spaces
    const rawSearch = searchInput ? searchInput.value.toLowerCase() : "";
    const searchTerms = rawSearch.split(',').map(t => t.trim()).filter(t => t.length > 0);

    let unifiedInventory = [];

    // Extract CORE
    if (saveState.storagePartial && saveState.storagePartial[category]) {
        for (const [id, amount] of Object.entries(saveState.storagePartial[category])) {
            unifiedInventory.push({ id, amount: parseInt(amount, 10), targetObj: saveState.storagePartial[category], details: getItemDetails(category, id) });
        }
    }
    // Extract DLCs
    if (saveState.storagePartialDLC) {
        for (const dlc in saveState.storagePartialDLC) {
            if (saveState.storagePartialDLC[dlc][category]) {
                for (const [id, amount] of Object.entries(saveState.storagePartialDLC[dlc][category])) {
                    unifiedInventory.push({ id, amount: parseInt(amount, 10), targetObj: saveState.storagePartialDLC[dlc][category], details: getItemDetails(category, id) });
                }
            }
        }
    }

    // --- SORTING LOGIC ---
    if (sortMode === 'az') {
        unifiedInventory.sort((a, b) => a.details.name.localeCompare(b.details.name));
    } else if (sortMode === 'high') {
        unifiedInventory.sort((a, b) => b.amount - a.amount);
    } else if (sortMode === 'low') {
        unifiedInventory.sort((a, b) => a.amount - b.amount);
    } else if (sortMode === 'dlc') {
        unifiedInventory.sort((a, b) => a.details.module.localeCompare(b.details.module));
    }

    let itemsRendered = 0;

    for (const item of unifiedInventory) {
        const id = item.id;
        const amount = item.amount;
        const targetObj = item.targetObj;
        const details = item.details;

        // --- TAG DECODING LOGIC ---
        let tagsHtml = '';
        let tagNames = [];

        if (globalMechanics.item_tags && globalMechanics.item_tags[category] && globalMechanics.item_tags[category][id]) {
            const mechData = globalMechanics.item_tags[category][id];
            let tagDictKey = (category === 'beverages') ? 'beverage_tags' : 'food_tags';

            if (mechData.tags && mechData.tags.length > 0) {
                tagNames = mechData.tags.map(tagId => {
                    const tagDetails = getItemDetails(tagDictKey, tagId.toString());
                    const name = tagDetails.name.startsWith("Unknown") ? `Tag ${tagId}` : tagDetails.name;
                    const safeName = name.replace(/'/g, "\\'");
                    return `<span class="clickable-tag" onclick="window.setSearchFilter('${safeName}')">${name}</span>`;
                });
                tagsHtml = `<div style="font-size: 11px; color: #1565C0; margin-bottom: 8px; font-weight: 500;">Tags: ${tagNames.join(', ')}</div>`;
            }
        }

        // --- SMART MULTI-SEARCH FILTER ---
        // Strip HTML from tags for purely text-based searching
        const rawTagsText = tagsHtml.replace(/<[^>]*>?/gm, '');
        const searchableText = `${details.name} ${details.module} ${rawTagsText}`.toLowerCase();

        // Every comma-separated term typed must exist in the text to pass
        const matchesAllTerms = searchTerms.every(term => searchableText.includes(term));
        if (searchTerms.length > 0 && !matchesAllTerms) {
            continue;
        }

        itemsRendered++;

        const card = document.createElement('div');
        card.className = 'item-card';

        const removeBtn = document.createElement('button');
        removeBtn.className = 'btn-remove';
        removeBtn.innerHTML = '&times;';
        removeBtn.onclick = () => {
            delete targetObj[id];
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

    if (itemsRendered === 0 && rawSearch !== "") {
        container.innerHTML = `<h3 style="grid-column: 1 / -1; color: #888;">No items match your search.</h3>`;
    }

    updateAddDropdown(category);
}

// --- DROPDOWN & ADD ITEM LOGIC ---
function updateAddDropdown(category) {
    const select = document.getElementById('addItemSelect');
    const searchInput = document.getElementById('addSearchInput');

    // Split the dropdown search box terms by comma as well
    const rawSearch = searchInput ? searchInput.value.toLowerCase() : "";
    const searchTerms = rawSearch.split(',').map(t => t.trim()).filter(t => t.length > 0);

    if (!select) return;
    select.innerHTML = '<option value="">-- Select an item to add --</option>';

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

                // Must match ALL comma-separated terms to show up in the dropdown
                const matchesAllTerms = searchTerms.every(term => searchableText.includes(term));
                if (searchTerms.length > 0 && !matchesAllTerms) {
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