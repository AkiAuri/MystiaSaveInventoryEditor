// The EXP thresholds decoded from gameplay
function getBondMaxExp(level) {
    const thresholds = {
        1: 6,
        2: 17,
        3: 30,
        4: 50,
        5: 0   // Max Level
    };
    return thresholds[level] || 50;
}

function renderBonds(container) {
    const bondsData = saveState.albumPartial?.specialSkinSelection || saveState.specialSkinSelection;

    if (!bondsData) {
        container.innerHTML = "<h3>No Bond Data Found in this Save</h3>";
        return;
    }

    container.style.gridTemplateColumns = "repeat(auto-fill, minmax(320px, 1fr))";
    container.style.maxWidth = "none";

    // --- 1. CHEAT BUTTONS ---
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
        for (const charId in bondsData) {
            if (prefs[charId]) {
                bondsData[charId].RevealedFoodTags = [...(prefs[charId].RevealedFoodTags || [])];
                bondsData[charId].RevealedHateFoodTags = [...(prefs[charId].RevealedHateFoodTags || [])];
                bondsData[charId].RevealedBevTags = [...(prefs[charId].RevealedBevTags || [])];
            }
        }
        refreshUI();
    };

    const expCheatBtn = document.createElement('button');
    expCheatBtn.className = "btn btn-danger";
    expCheatBtn.innerText = "⭐ Prepare Next Level Up (Safe)";
    expCheatBtn.style.flex = "1"; expCheatBtn.style.padding = "10px";

    expCheatBtn.onclick = () => {
        for (const charId in bondsData) {
            const currentLevel = bondsData[charId].CurrentBondLevel;
            if (currentLevel < 5) {
                bondsData[charId].CurrentBondExp = getBondMaxExp(currentLevel) - 1;
            }
        }
        refreshUI();
    };

    cheatWrapper.appendChild(prefCheatBtn);
    cheatWrapper.appendChild(expCheatBtn);
    container.appendChild(cheatWrapper);

    // --- 2. TAG DECODING HELPER ---
    function decodeTags(tagArray, tagCategory) {
        if (!tagArray || tagArray.length === 0) return "<span style='color:#999'>None</span>";
        return tagArray.map(tagId => {
            const details = getItemDetails(tagCategory, tagId.toString());
            return details.name.startsWith("Unknown") ? `Tag ${tagId}` : details.name;
        }).join(", ");
    }

    // --- 3. RENDER THE CARDS ---
    for (const [charId, charData] of Object.entries(bondsData)) {
        const card = document.createElement('div');
        card.className = 'item-card';

        let charName = `Character ID: ${charId}`;
        if (globalDictionary.CORE?.guests && globalDictionary.CORE.guests[charId]) {
            charName = globalDictionary.CORE.guests[charId].replace(/<\/?brief>/g, '');
        }

        const likedFoodStr = decodeTags(charData.RevealedFoodTags, 'food_tags');
        const hatedFoodStr = decodeTags(charData.RevealedHateFoodTags, 'food_tags');
        const bevStr = decodeTags(charData.RevealedBevTags, 'beverage_tags');

        const maxExpInit = getBondMaxExp(charData.CurrentBondLevel);
        const pctInit = (charData.CurrentBondLevel >= 5) ? 100 : Math.min(100, (charData.CurrentBondExp / maxExpInit) * 100);
        const textInit = (charData.CurrentBondLevel >= 5) ? "MAX LEVEL" : `${charData.CurrentBondExp} / ${maxExpInit} EXP`;

        card.innerHTML = `
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
            const currentLvl = bondsData[charId].CurrentBondLevel;
            const currentExp = bondsData[charId].CurrentBondExp;

            const max = getBondMaxExp(currentLvl);
            const pct = (currentLvl >= 5) ? 100 : Math.min(100, (currentExp / max) * 100);

            card.querySelector(`#prog-fill-${charId}`).style.width = `${pct}%`;
            card.querySelector(`#prog-text-${charId}`).innerText = currentLvl >= 5 ? "MAX LEVEL" : `${currentExp} / ${max} EXP`;
        };

        // --- HARD CLAMPING FOR BOND LEVEL ---
        card.querySelector(`#lvl-${charId}`).addEventListener('input', (e) => {
            let parsedLvl = parseInt(e.target.value, 10) || 1;

            if (parsedLvl < 1) parsedLvl = 1;
            if (parsedLvl > 5) parsedLvl = 5;

            bondsData[charId].CurrentBondLevel = parsedLvl;
            e.target.value = parsedLvl;

            // Re-evaluate EXP instantly if the level changes
            const maxThreshold = getBondMaxExp(parsedLvl);
            const safeExp = parsedLvl >= 5 ? 0 : maxThreshold - 1;
            if (bondsData[charId].CurrentBondExp > safeExp) {
                bondsData[charId].CurrentBondExp = safeExp;
                card.querySelector(`#exp-${charId}`).value = safeExp;
            }

            updateBondLive();
        });

        // --- HARD CLAMPING FOR BOND EXP ---
        card.querySelector(`#exp-${charId}`).addEventListener('input', (e) => {
            let parsedExp = parseInt(e.target.value, 10) || 0;
            if (parsedExp < 0) parsedExp = 0;

            const currentLvl = bondsData[charId].CurrentBondLevel;
            const maxThreshold = getBondMaxExp(currentLvl);

            // Limit EXP to Maximum allowed minus 1 (or exactly 0 if they are Max Level)
            const safeExp = currentLvl >= 5 ? 0 : maxThreshold - 1;

            if (parsedExp > safeExp) parsedExp = safeExp;

            bondsData[charId].CurrentBondExp = parsedExp;
            e.target.value = parsedExp; // Forces the UI box to shrink down to the cap

            updateBondLive();
        });

        container.appendChild(card);
    }
}