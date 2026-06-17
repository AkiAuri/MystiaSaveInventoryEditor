// Function to evaluate cumulative stateful changes up to a target level
function calculateStatsForLevel(targetLevel) {
    // Standard Level 0 Fallback Baselines
    let baseStats = {
        levelUpExp: 0,
        startPassion: 0,
        startTipRate: 0,
        maxRecipes: 4,
        maxBeverages: 4,
        dayCookCount: 1,
        cookSpdMultiplier: 1,
        moveSpdMultiplier: 1,
        qteBuffTriggerProb: 0.15,
        qteBuffLengthMultiplier: 1,
        doubleCollectionProb: 0,
        shopPriceMultiplier: 1,
        maxTray: 2,
        additiveGuestPatient: 1,
        additiveGuestSpawnRate: 1,
        additiveGuestBaseMood: 0,
        additivePositiveBuffTime: 1
    };

    const levelLookup = globalMechanics.player_levels || {};

    // Progressively build state based on hasDiff triggers
    for (let currentLvl = 0; currentLvl <= targetLevel; currentLvl++) {
        const data = levelLookup[currentLvl.toString()];
        if (!data) continue;

        // Process active overrides
        const properties = [
            "startPassion", "startTipRate", "maxRecipes", "maxBeverages",
            "dayCookCount", "cookSpdMultiplier", "moveSpdMultiplier",
            "qteBuffTriggerProb", "qteBuffLengthMultiplier", "doubleCollectionProb",
            "shopPriceMultiplier", "maxTray", "additiveGuestPatient",
            "additiveGuestSpawnRate", "additiveGuestBaseMood", "additivePositiveBuffTime"
        ];

        properties.forEach(prop => {
            if (data[prop + "_hasDiff"] === 1) {
                baseStats[prop] = data[prop + "_value"];
            }
        });
    }

    // Determine target max exp requirement bound to the targetLevel + 1 profile node
    const nextLevelNode = levelLookup[(targetLevel + 1).toString()];
    baseStats.levelUpExp = nextLevelNode ? (nextLevelNode.levelUpExp || 0) : 0;

    return baseStats;
}

// Main Tab Renderer Engine
function renderPlayerProfile(container) {
    const playerState = saveState.playerPartial;

    container.style.gridTemplateColumns = "1fr";
    container.style.maxWidth = "550px";

    // 1. Cheat Trigger Wrapper
    const cheatWrapper = document.createElement('div');
    cheatWrapper.style.marginBottom = "20px";

    const cheatBtn = document.createElement('button');
    cheatBtn.className = "btn btn-danger";
    cheatBtn.innerText = "⭐ Maximize Player EXP (Brute Force)";
    cheatBtn.style.width = "100%";
    cheatBtn.style.padding = "12px";
    cheatBtn.style.fontSize = "15px";

    cheatBtn.onclick = () => {
        playerState.exp = 999999;
        refreshUI();
    };
    cheatWrapper.appendChild(cheatBtn);
    container.appendChild(cheatWrapper);

    // 2. Input Fields Generator
    function createNumField(label, key, isNestedDay = false) {
        const row = document.createElement('div');
        row.style.display = "flex";
        row.style.justifyContent = "space-between";
        row.style.marginBottom = "15px";
        row.style.alignItems = "center";

        const span = document.createElement('span');
        span.innerText = label;
        span.style.fontWeight = "bold";

        const input = document.createElement('input');
        input.type = 'number';
        input.value = isNestedDay ? playerState.gameDate.day : playerState[key];
        input.style.padding = "8px";
        input.style.width = "150px";
        input.style.border = "1px solid #ccc";
        input.style.borderRadius = "4px";

        input.addEventListener('change', (e) => {
            const parsedVal = parseInt(e.target.value, 10);
            if (isNestedDay) {
                playerState.gameDate.day = parsedVal;
            } else {
                playerState[key] = parsedVal;
            }
            // Real-time stat box update if the main level changes
            if (key === 'level') refreshUI();
        });

        row.appendChild(span);
        row.appendChild(input);
        return row;
    }

    container.appendChild(createNumField("Money (Fund):", "fund"));
    container.appendChild(createNumField("Level:", "level"));
    container.appendChild(createNumField("Experience Points:", "exp"));
    container.appendChild(createNumField("Current Day:", "day", true));

    // 3. Status Display Block
    const activeStats = calculateStatsForLevel(playerState.level);

    const statBox = document.createElement('div');
    statBox.style.marginTop = "25px";
    statBox.style.padding = "15px";
    statBox.style.background = "#fff";
    statBox.style.border = "1px solid #ddd";
    statBox.style.borderRadius = "6px";
    statBox.style.fontFamily = "inherit";

    // Format fields clean to mimic game percentages and scales
    statBox.innerHTML = `
        <h3 style="margin-top: 0; color: #333; border-bottom: 2px solid #eee; padding-bottom: 8px; display:flex; justify-content:space-between;">
            <span>📊 Active Level Up Statistics</span>
            <span style="color:#E91E63; font-size:14px;">Next Level Threshold: ${activeStats.levelUpExp || 'N/A'} EXP</span>
        </h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px 20px; font-size: 13px; line-height: 1.5;">
            <div><strong>Base Vibe:</strong> ${activeStats.startPassion}</div>
            <div><strong>Base Tip Rate:</strong> ${(activeStats.startTipRate * 100).toFixed(0)}%</div>
            <div><strong>Menu Dish Limit:</strong> ${activeStats.maxRecipes}</div>
            <div><strong>Menu Drink Limit:</strong> ${activeStats.maxBeverages}</div>
            <div><strong>Daily Prep Amount:</strong> ${activeStats.dayCookCount}</div>
            <div><strong>Movement Speed:</strong> ${activeStats.moveSpdMultiplier}x</div>
            <div><strong>Cooking Time:</strong> ${(activeStats.cookSpdMultiplier * 100).toFixed(0)}%</div>
            <div><strong>Sparrow Tune Buff Chance:</strong> ${(activeStats.qteBuffTriggerProb * 100).toFixed(0)}%</div>
            <div><strong>Sparrow Tune Buff Duration:</strong> ${(activeStats.qteBuffLengthMultiplier * 100).toFixed(0)}%</div>
            <div><strong>Extra Ingredient Chance:</strong> ${(activeStats.doubleCollectionProb * 100).toFixed(0)}%</div>
            <div><strong>Trade Discount:</strong> ${(activeStats.shopPriceMultiplier * 100).toFixed(0)}%</div>
            <div><strong>Max Trays:</strong> ${activeStats.maxTray}</div>
            <div><strong>Base Guest Mood:</strong> +${activeStats.additiveGuestBaseMood}</div>
            <div><strong>Max Guest Patience:</strong> ${(activeStats.additiveGuestPatient * 100).toFixed(0)}%</div>
            <div><strong>Guest Refresh Rate:</strong> ${(activeStats.additiveGuestSpawnRate * 100).toFixed(0)}%</div>
            <div><strong>Reward Spell Card Duration:</strong> ${(activeStats.additivePositiveBuffTime * 100).toFixed(0)}%</div>
        </div>
    `;
    container.appendChild(statBox);
}