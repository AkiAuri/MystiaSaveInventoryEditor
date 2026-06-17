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
    container.style.gridTemplateColumns = "repeat(auto-fill, minmax(220px, 1fr))";
    container.style.maxWidth = "none";

    const inventory = saveState.storagePartial[category] || {};

    for (const [id, amount] of Object.entries(inventory)) {
        const details = getItemDetails(category, id);

        const card = document.createElement('div');
        card.className = 'item-card';

        const removeBtn = document.createElement('button');
        removeBtn.className = 'btn-remove';
        removeBtn.innerHTML = '&times;';
        removeBtn.title = "Remove item entirely";
        removeBtn.onclick = () => {
            delete saveState.storagePartial[category][id];
            refreshUI();
        };

        // --- TAG DECODING LOGIC ---
        let tagsHtml = '';
        if (globalMechanics.item_tags && globalMechanics.item_tags[category] && globalMechanics.item_tags[category][id]) {
            const mechData = globalMechanics.item_tags[category][id];
            let tagDictKey = (category === 'beverages') ? 'beverage_tags' : 'food_tags';

            if (mechData.tags && mechData.tags.length > 0) {
                const readableTags = mechData.tags.map(tagId => {
                    const tagDetails = getItemDetails(tagDictKey, tagId.toString());
                    return tagDetails.name.startsWith("Unknown") ? `Tag ${tagId}` : tagDetails.name;
                });
                tagsHtml = `<div style="font-size: 11px; color: #1565C0; margin-bottom: 8px; font-weight: 500;">Tags: ${readableTags.join(', ')}</div>`;
            }
        }

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

    updateAddDropdown(category);
}

// --- DROPDOWN & ADD ITEM LOGIC ---
function updateAddDropdown(category) {
    const select = document.getElementById('addItemSelect');
    select.innerHTML = '<option value="">-- Select an item to add --</option>';

    const inventory = saveState.storagePartial[category] || {};

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

document.getElementById('addItemBtn').addEventListener('click', () => {
    const select = document.getElementById('addItemSelect');
    const idToAdd = select.value;

    if (idToAdd && currentCategory !== 'player' && currentCategory !== 'merchants' && currentCategory !== 'bonds') {
        if (!saveState.storagePartial[currentCategory]) {
            saveState.storagePartial[currentCategory] = {};
        }

        saveState.storagePartial[currentCategory][idToAdd] = 1;
        refreshUI();
    }
});