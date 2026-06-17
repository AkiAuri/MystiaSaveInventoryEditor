// --- HELPER: Find Item Name across all DLCs ---
function getItemDetails(category, id) {
    for (const module in globalDictionary) {
        if (globalDictionary[module][category] && globalDictionary[module][category][id]) {
            return { name: globalDictionary[module][category][id], module: module };
        }
    }
    return { name: `Unknown (ID: ${id})`, module: "UNKNOWN" };
}

// --- LIVE SEARCH LISTENERS ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. Main Grid Filter
    document.getElementById('searchInput')?.addEventListener('input', () => {
        if (currentCategory !== 'player' && currentCategory !== 'merchants' && currentCategory !== 'bonds') {
            refreshUI();
        }
    });

    // 2. Dropdown List Filter
    document.getElementById('addSearchInput')?.addEventListener('input', () => {
        if (currentCategory !== 'player' && currentCategory !== 'merchants' && currentCategory !== 'bonds') {
            updateAddDropdown(currentCategory);
        }
    });

    // 3. Add Single Item Button
    document.getElementById('addItemBtn')?.addEventListener('click', () => {
        const select = document.getElementById('addItemSelect');
        const idToAdd = select.value;

        if (idToAdd && currentCategory !== 'player' && currentCategory !== 'merchants' && currentCategory !== 'bonds') {
            if (!saveState.storagePartial[currentCategory]) {
                saveState.storagePartial[currentCategory] = {};
            }
            saveState.storagePartial[currentCategory][idToAdd] = 1;

            const addSearch = document.getElementById('addSearchInput');
            if (addSearch) addSearch.value = "";

            refreshUI();
        }
    });

    // 4. Mass Add "Add to Existing" Button
    document.getElementById('massAddBtn')?.addEventListener('click', () => {
        const amountToAdd = parseInt(document.getElementById('massAddAmount').value, 10) || 50;

        if (currentCategory !== 'player' && currentCategory !== 'merchants' && currentCategory !== 'bonds') {
            const inventory = saveState.storagePartial[currentCategory];
            if (!inventory) return;

            // Loop through ONLY the items you already own
            for (const id in inventory) {
                const currentAmount = parseInt(inventory[id], 10) || 0;

                // SAFEGUARD: Skip any items with a negative ID, or items already set to a negative amount (Infinite Flag)
                if (parseInt(id, 10) < 0 || currentAmount < 0) {
                    continue;
                }

                // Add the new amount to the existing amount
                saveState.storagePartial[currentCategory][id] = currentAmount + amountToAdd;
            }

            // Clear the grid search to ensure the user can see everything that was just added
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

    const inventory = saveState.storagePartial[category] || {};
    const searchInput = document.getElementById('searchInput');
    const searchQuery = searchInput ? searchInput.value.toLowerCase() : "";

    let itemsRendered = 0;

    for (const [id, amount] of Object.entries(inventory)) {
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
        input.min = "-1"; // Re-enabled -1 so users can manually set items to infinite

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

                // DECODE TAGS FOR THE DROPDOWN FILTER
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

                // CHECK SEARCH FILTER (Includes Name, Tag, and Module)
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