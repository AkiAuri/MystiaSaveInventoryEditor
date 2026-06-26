// The EXP thresholds decoded from gameplay
function getBondMaxExp(level) {
    const thresholds = {
        1: 6,
        2: 17,
        3: 30,
        4: 45,
        5: 0   // Max Level
    };
    return thresholds[level] || 50;
}

// Function to safely extract character name from any DLC module
function getGuestName(id) {
    for (const module in globalDictionary) {
        if (globalDictionary[module].guests && globalDictionary[module].guests[id]) {
            return globalDictionary[module].guests[id].replace(/<\/?brief>/g, '');
        }
    }
    return `Character ID: ${id}`;
}

// Function to render the Bonds / Special Guests Tab
function renderBonds(container) {
    let allBonds = [];

    // 1. Gather CORE Characters
    if (saveState.albumPartial && saveState.albumPartial.specialSkinSelection) {
        for (const [id, data] of Object.entries(saveState.albumPartial.specialSkinSelection)) {
            allBonds.push({ id: id, data: data, module: 'CORE' });
        }
    }

    // 2. Gather DLC Characters
    if (saveState.albumPartialDLC) {
        for (const [dlc, dlcData] of Object.entries(saveState.albumPartialDLC)) {
            if (dlcData.specialSkinSelection) {
                for (const [id, data] of Object.entries(dlcData.specialSkinSelection)) {
                    allBonds.push({ id: id, data: data, module: dlc });
                }
            }
        }
    }

    if (allBonds.length === 0) {
        container.innerHTML = "<h3>No Bond Data Found in this Save</h3>";
        return;
    }

    // Reset container styling to handle our new layout properly
    container.innerHTML = "";
    container.style.gridTemplateColumns = "none";
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.gap = "15px";

    // --- FILTER & CHEAT TOOLBAR ---
    const toolbar = document.createElement('div');
    toolbar.className = "bonds-toolbar";
    toolbar.style.display = "flex";
    toolbar.style.flexDirection = "column";
    toolbar.style.gap = "15px";
    toolbar.style.padding = "15px";
    toolbar.style.background = "#fff";
    toolbar.style.border = "1px solid #ddd";
    toolbar.style.borderRadius = "8px";
    toolbar.style.boxShadow = "0 2px 4px rgba(0,0,0,0.05)";

    // Filters row
    const filterRow = document.createElement('div');
    filterRow.style.display = "flex";
    filterRow.style.flexWrap = "wrap";
    filterRow.style.gap = "15px";
    filterRow.style.alignItems = "flex-end";

    filterRow.innerHTML = `
        <div style="flex: 1; min-width: 150px;">
            <label style="font-size: 12px; font-weight: bold; color: #666; display: block; margin-bottom: 5px;">Filter Source</label>
            <select id="bondModuleFilter" class="search-bar" style="width: 100%; cursor: pointer;">
                <option value="ALL">All Sources</option>
                <option value="CORE">Core Characters Only</option>
                <option value="ALL_DLC">All DLC Characters</option>
                <option value="DLC1">DLC 1</option>
                <option value="DLC2">DLC 2</option>
                <option value="DLC2_5">DLC 2.5</option>
                <option value="DLC3">DLC 3</option>
                <option value="DLC4">DLC 4</option>
                <option value="DLC5">DLC 5</option>
                <option value="DLCMUSIC">DLC Rhythm / Music</option>
            </select>
        </div>
        <div style="flex: 1; min-width: 150px;">
            <label style="font-size: 12px; font-weight: bold; color: #666; display: block; margin-bottom: 5px;">Filter Level</label>
            <select id="bondLevelFilter" class="search-bar" style="width: 100%; cursor: pointer;">
                <option value="ALL">All Levels</option>
                <option value="NOT_MAX">Not Fully Leveled (< 5)</option>
                <option value="5">Level 5 (Maxed)</option>
                <option value="4">Level 4</option>
                <option value="3">Level 3</option>
                <option value="2">Level 2</option>
                <option value="1">Level 1</option>
            </select>
        </div>
        <div style="flex: 1; min-width: 150px;">
            <label style="font-size: 12px; font-weight: bold; color: #666; display: block; margin-bottom: 5px;">Sort By</label>
            <select id="bondSort" class="search-bar" style="width: 100%; cursor: pointer;">
                <option value="default">Default (ID)</option>
                <option value="levelDesc">Level (Highest First)</option>
                <option value="levelAsc">Level (Lowest First)</option>
            </select>
        </div>
        <div style="display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 10px; flex: 1; min-width: 150px;">
            <input type="checkbox" id="bondShowPlaceholders" style="width: 18px; height: 18px; cursor: pointer;">
            <label for="bondShowPlaceholders" style="font-size: 14px; font-weight: bold; cursor: pointer; color: #E91E63; margin: 0;">Show Placeholders</label>
        </div>
    `;

    // Cheat Buttons Row
    const cheatWrapper = document.createElement('div');
    cheatWrapper.style.display = "flex";
    cheatWrapper.style.gap = "10px";
    cheatWrapper.style.paddingTop = "10px";
    cheatWrapper.style.borderTop = "1px solid #eee";

    const prefCheatBtn = document.createElement('button');
    prefCheatBtn.className = "btn btn-danger";
    prefCheatBtn.innerText = "📖 Reveal All Preferences";
    prefCheatBtn.style.flex = "1"; prefCheatBtn.style.padding = "10px";

    prefCheatBtn.onclick = () => {
        const prefs = globalMechanics.guest_preferences || {};
        for (const char of allBonds) {
            if (prefs[char.id]) {
                char.data.RevealedFoodTags = [...(prefs[char.id].RevealedFoodTags || [])];
                char.data.RevealedHateFoodTags = [...(prefs[char.id].RevealedHateFoodTags || [])];
                char.data.RevealedBevTags = [...(prefs[char.id].RevealedBevTags || [])];
            }
        }
        renderCards(); // Refresh just the bonds UI instead of global refresh
    };

    const expCheatBtn = document.createElement('button');
    expCheatBtn.className = "btn btn-danger";
    expCheatBtn.innerText = "⭐ Prepare Next Level Up (Safe)";
    expCheatBtn.title = "Sets EXP just 1 point below the next level for non-placeholder, non-maxed characters.";
    expCheatBtn.style.flex = "1"; expCheatBtn.style.padding = "10px";

    expCheatBtn.onclick = () => {
        for (const char of allBonds) {
            const name = getGuestName(char.id);
            const isPh = name.includes("[Placeholder") || name.includes("Unknown");

            if (isPh) continue; // Safety: Ignore placeholders

            const currentLevel = char.data.CurrentBondLevel;
            if (currentLevel < 5) { // Safety: Ignore already maxed characters
                char.data.CurrentBondExp = getBondMaxExp(currentLevel) - 1;
            }
        }
        renderCards(); // Refresh UI
    };

    cheatWrapper.appendChild(prefCheatBtn);
    cheatWrapper.appendChild(expCheatBtn);

    toolbar.appendChild(filterRow);
    toolbar.appendChild(cheatWrapper);
    container.appendChild(toolbar);

    // --- GRID CONTAINER ---
    const grid = document.createElement('div');
    grid.style.display = "grid";
    grid.style.gridTemplateColumns = "repeat(auto-fill, minmax(320px, 1fr))";
    grid.style.gap = "15px";
    container.appendChild(grid);

    // --- TAG DECODING HELPER ---
    function decodeTags(tagArray, tagCategory) {
        if (!tagArray || tagArray.length === 0) return "<span style='color:#999'>None</span>";
        return tagArray.map(tagId => {
            const details = getItemDetails(tagCategory, tagId.toString());
            return details.name.startsWith("Unknown") ? `Tag ${tagId}` : details.name;
        }).join(", ");
    }

    // --- DYNAMIC RENDERING LOGIC ---
    function renderCards() {
        grid.innerHTML = '';

        const modFilter = document.getElementById('bondModuleFilter').value;
        const lvlFilter = document.getElementById('bondLevelFilter').value;
        const sortFilter = document.getElementById('bondSort').value;
        const showPh = document.getElementById('bondShowPlaceholders').checked;

        // 1. Apply Filters
        let filtered = allBonds.filter(char => {
            const name = getGuestName(char.id);
            const isPh = name.includes("[Placeholder") || name.includes("Unknown");

            // Placeholder filter
            if (!showPh && isPh) return false;

            // Module filter
            if (modFilter === 'CORE' && char.module !== 'CORE') return false;
            if (modFilter === 'ALL_DLC' && char.module === 'CORE') return false;
            if (modFilter !== 'ALL' && modFilter !== 'CORE' && modFilter !== 'ALL_DLC') {
                if (char.module !== modFilter) return false;
            }

            // Level filter
            const lvl = char.data.CurrentBondLevel;
            if (lvlFilter === 'NOT_MAX' && lvl >= 5) return false;
            if (lvlFilter !== 'ALL' && lvlFilter !== 'NOT_MAX' && lvl !== parseInt(lvlFilter)) return false;

            return true;
        });

        // 2. Apply Sorting
        filtered.sort((a, b) => {
            if (sortFilter === 'levelAsc') {
                return a.data.CurrentBondLevel - b.data.CurrentBondLevel || parseInt(a.id) - parseInt(b.id);
            } else if (sortFilter === 'levelDesc') {
                return b.data.CurrentBondLevel - a.data.CurrentBondLevel || parseInt(a.id) - parseInt(b.id);
            }
            return parseInt(a.id) - parseInt(b.id); // default ID sort
        });

        // 3. Render DOM
        if (filtered.length === 0) {
            grid.innerHTML = `<div style="grid-column: 1 / -1; padding: 30px; text-align: center; color: #888; font-style: italic;">No characters match the current filters.</div>`;
            return;
        }

        for (const char of filtered) {
            const charId = char.id;
            const charData = char.data;

            const card = document.createElement('div');
            card.className = 'item-card';

            const charName = getGuestName(charId);
            const likedFoodStr = decodeTags(charData.RevealedFoodTags, 'food_tags');
            const hatedFoodStr = decodeTags(charData.RevealedHateFoodTags, 'food_tags');
            const bevStr = decodeTags(charData.RevealedBevTags, 'beverage_tags');

            const maxExpInit = getBondMaxExp(charData.CurrentBondLevel);
            const pctInit = (charData.CurrentBondLevel >= 5) ? 100 : Math.min(100, (charData.CurrentBondExp / maxExpInit) * 100);
            const textInit = (charData.CurrentBondLevel >= 5) ? "MAX LEVEL" : `${charData.CurrentBondExp} / ${maxExpInit} EXP`;

            card.innerHTML = `
                <div class="module-tag">${char.module}</div>
                <span style="font-size: 18px; color: #E91E63; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-bottom: 10px; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${charName}">
                    ${charName}
                </span>
                
                <div style="font-size: 13px; line-height: 1.4; margin-bottom: 15px; padding: 10px; background: #fff; border: 1px solid #eee; border-radius: 4px;">
                    <div><strong style="color: #4CAF50;">Likes (Food):</strong> ${likedFoodStr}</div>
                    <div style="margin-top: 5px;"><strong style="color: #f44336;">Hates (Food):</strong> ${hatedFoodStr}</div>
                    <div style="margin-top: 5px;"><strong style="color: #2196F3;">Beverages:</strong> ${bevStr}</div>
                </div>
                
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <label style="font-weight: bold; font-size: 14px;">Bond Level:</label>
                    <input type="number" id="lvl-${charId}" value="${charData.CurrentBondLevel}" style="width: 80px;" min="1" max="5">
                </div>
                
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <label style="font-weight: bold; font-size: 14px;">Bond EXP:</label>
                    <input type="number" id="exp-${charId}" value="${charData.CurrentBondExp}" style="width: 80px;" min="0">
                </div>

                <div id="prog-text-${charId}" style="text-align: right; font-size: 12px; color: #E91E63; font-weight: bold; margin-top: 8px;">${textInit}</div>
                <div class="progress-wrapper">
                    <div id="prog-fill-${charId}" class="progress-fill" style="width: ${pctInit}%; background-color: #E91E63; transition: width 0.3s ease;"></div>
                </div>
            `;

            // Live updater function to render math locally without redrawing the whole tab
            const updateBondLive = () => {
                const currentLvl = charData.CurrentBondLevel;
                const currentExp = charData.CurrentBondExp;

                const max = getBondMaxExp(currentLvl);
                const pct = (currentLvl >= 5) ? 100 : Math.min(100, (currentExp / max) * 100);

                card.querySelector(`#prog-fill-${charId}`).style.width = `${pct}%`;
                card.querySelector(`#prog-text-${charId}`).innerText = currentLvl >= 5 ? "MAX LEVEL" : `${currentExp} / ${max} EXP`;
            };

            card.querySelector(`#lvl-${charId}`).addEventListener('input', (e) => {
                let parsedLvl = parseInt(e.target.value, 10) || 1;

                if (parsedLvl < 1) parsedLvl = 1;
                if (parsedLvl > 5) parsedLvl = 5;

                charData.CurrentBondLevel = parsedLvl;
                e.target.value = parsedLvl;

                const maxThreshold = getBondMaxExp(parsedLvl);
                const safeExp = parsedLvl >= 5 ? 0 : maxThreshold - 1;
                if (charData.CurrentBondExp > safeExp) {
                    charData.CurrentBondExp = safeExp;
                    card.querySelector(`#exp-${charId}`).value = safeExp;
                }

                updateBondLive();
            });

            card.querySelector(`#exp-${charId}`).addEventListener('input', (e) => {
                let parsedExp = parseInt(e.target.value, 10) || 0;
                if (parsedExp < 0) parsedExp = 0;

                const currentLvl = charData.CurrentBondLevel;
                const maxThreshold = getBondMaxExp(currentLvl);

                const safeExp = currentLvl >= 5 ? 0 : maxThreshold - 1;

                if (parsedExp > safeExp) parsedExp = safeExp;

                charData.CurrentBondExp = parsedExp;
                e.target.value = parsedExp;

                updateBondLive();
            });

            grid.appendChild(card);
        }
    }

    // Attach event listener to toolbar for automatic filtering/sorting when inputs change
    toolbar.addEventListener('change', (e) => {
        if (['bondModuleFilter', 'bondLevelFilter', 'bondSort', 'bondShowPlaceholders'].includes(e.target.id)) {
            renderCards();
        }
    });

    // Fire the initial render of cards based on default dropdown states
    renderCards();
}