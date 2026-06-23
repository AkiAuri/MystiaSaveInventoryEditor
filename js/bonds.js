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

    container.style.gridTemplateColumns = "repeat(auto-fill, minmax(320px, 1fr))";
    container.style.maxWidth = "none";

    // --- CHEAT BUTTONS ---
    const cheatWrapper = document.createElement('div');
    cheatWrapper.style.gridColumn = "1 / -1";
    cheatWrapper.style.marginBottom = "20px";
    cheatWrapper.style.display = "flex";
    cheatWrapper.style.gap = "10px";

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
        refreshUI();
    };

    const expCheatBtn = document.createElement('button');
    expCheatBtn.className = "btn btn-danger";
    expCheatBtn.innerText = "⭐ Prepare Next Level Up (Safe)";
    expCheatBtn.style.flex = "1"; expCheatBtn.style.padding = "10px";

    expCheatBtn.onclick = () => {
        for (const char of allBonds) {
            const currentLevel = char.data.CurrentBondLevel;
            if (currentLevel < 5) {
                char.data.CurrentBondExp = getBondMaxExp(currentLevel) - 1;
            }
        }
        refreshUI();
    };

    cheatWrapper.appendChild(prefCheatBtn);
    cheatWrapper.appendChild(expCheatBtn);
    container.appendChild(cheatWrapper);

    // --- TAG DECODING HELPER ---
    function decodeTags(tagArray, tagCategory) {
        if (!tagArray || tagArray.length === 0) return "<span style='color:#999'>None</span>";
        return tagArray.map(tagId => {
            const details = getItemDetails(tagCategory, tagId.toString());
            return details.name.startsWith("Unknown") ? `Tag ${tagId}` : details.name;
        }).join(", ");
    }

    // --- RENDER THE CARDS ---
    for (const char of allBonds) {
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
            <span style="font-size: 18px; color: #E91E63; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-bottom: 10px;">
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
                <div id="prog-fill-${charId}" class="progress-fill" style="width: ${pctInit}%; background-color: #E91E63;"></div>
            </div>
        `;

        // Live updater function to render math
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

        container.appendChild(card);
    }
}