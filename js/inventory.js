// --- HELPER: Find Item Name across all DLCs ---
function getItemDetails(category, id) {
    for (const module in globalDictionary) {
        if (globalDictionary[module][category] && globalDictionary[module][category][id]) {
            return { name: globalDictionary[module][category][id], module: module };
        }
    }
    return { name: `Unknown (ID: ${id})`, module: "UNKNOWN" };
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
            if (!saveState.storagePartial[currentCategory]) saveState.storagePartial[currentCategory] = {};
            saveState.storagePartial[currentCategory][idToAdd] = 1;

            const addSearch = document.getElementById('addSearchInput');
            if (addSearch) addSearch.value = "";

            window.showToast(`Added ${itemName}!`, "success");
            refreshUI();
        }
    });

    document.getElementById('massAddBtn')?.addEventListener('click', () => {
        const amountToAdd = parseInt(document.getElementById('massAddAmount').value, 10) || 50;

        if (currentCategory !== 'player' && currentCategory !== 'merchants' && currentCategory !== 'bonds') {
            const inventory = saveState.storagePartial[currentCategory];
            if (!inventory) return;

            let modifiedCount = 0;
            for (const id in inventory) {
                const currentAmount = parseInt(inventory[id], 10) || 0;
                if (parseInt(id, 10) < 0 || currentAmount < 0) continue;
                saveState.storagePartial[currentCategory][id] = currentAmount + amountToAdd;
                modifiedCount++;
            }

            const gridSearch = document.getElementById('searchInput');
            if (gridSearch) gridSearch.value = "";

            window.showToast(`Added ${amountToAdd} to ${modifiedCount} existing items!`, "success");
            refreshUI();
        }
    });

    // NEW: Purge Zeroes Logic
    document.getElementById('purgeZeroesBtn')?.addEventListener('click', () => {
        if (currentCategory !== 'player' && currentCategory !== 'merchants' && currentCategory !== 'bonds') {
            const inventory = saveState.storagePartial[currentCategory];
            if (!inventory) return;

            let purgedCount = 0;
            for (const id in inventory) {
                if (parseInt(inventory[id], 10) === 0) {
                    delete saveState.storagePartial[currentCategory][id];
                    purgedCount++;
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

    const inventory = saveState.storagePartial[category] || {};
    const searchInput = document.getElementById('searchInput');
    const searchQuery = searchInput ? searchInput.value.toLowerCase() : "";
    const sortMode = document.getElementById('sortSelect')?.value || 'default';

    // 1. Build an array of items so we can sort them
    let inventoryEntries = [];
    for (const [id, amount] of Object.entries(inventory)) {
        inventoryEntries.push({ id, amount: parseInt(amount, 10), details: getItemDetails(category, id) });
    }

    // 2. Sort Logic
    if (sortMode === 'az') {
        inventoryEntries.sort((a, b) => a.details.name.localeCompare(b.details.name));
    } else if (sortMode === 'high') {
        inventoryEntries.sort((a, b) => b.amount - a.amount);
    } else if (sortMode === 'low') {
        inventoryEntries.sort((a, b) => a.amount - b.amount);
    } else if (sortMode === 'dlc') {
        inventoryEntries.sort((a, b) => a.details.module.localeCompare(b.details.module));
    }

    let itemsRendered = 0;

    for (const entry of inventoryEntries) {
        const id = entry.id;
        const amount = entry.amount;
        const details = entry.details;

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

                    // Create Clickable HTML tags
                    const safeName = name.replace(/'/g, "\\'");
                    return `<span class="clickable-tag" onclick="window.setSearchFilter('${safeName}')">${name}</span>`;
                });
                tagsHtml = `<div style="font-size: 11px; color: #1565C0; margin-bottom: 8px; font-weight: 500;">Tags: ${tagNames.join(', ')}</div>`;
            }
        }

        // --- SMART SEARCH FILTER ---
        // Strip HTML from tags for purely text-based searching
        const rawTagsText = tagsHtml.replace(/<[^>]*>?/gm, '');
        const searchableText = `${details.name} ${details.module} ${rawTagsText}`.toLowerCase();

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
            delete saveState.storagePartial[category][id];
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
            saveState.storagePartial[category][id] = parseInt(e.target.value, 10);
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

    const inventory = saveState.storagePartial[category] || {};

    for (const module in globalDictionary) {
        const itemsInModule = globalDictionary[module][category];
        if (!itemsInModule) continue;

        const optgroup = document.createElement('optgroup');
        optgroup.label = module;

        for (const [id, name] of Object.entries(itemsInModule)) {
            if (!inventory.hasOwnProperty(id)) {
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