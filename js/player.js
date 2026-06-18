// Function to evaluate cumulative stateful changes up to a target level
function calculateStatsForLevel(targetLevel) {
    let baseStats = {
        levelUpExp: 0, startPassion: 0, startTipRate: 0, maxRecipes: 4,
        maxBeverages: 4, dayCookCount: 1, cookSpdMultiplier: 1, moveSpdMultiplier: 1,
        qteBuffTriggerProb: 0.15, qteBuffLengthMultiplier: 1, doubleCollectionProb: 0,
        shopPriceMultiplier: 1, maxTray: 2, additiveGuestPatient: 1,
        additiveGuestSpawnRate: 1, additiveGuestBaseMood: 0, additivePositiveBuffTime: 1
    };

    const levelLookup = globalMechanics.player_levels || {};

    for (let currentLvl = 0; currentLvl <= targetLevel; currentLvl++) {
        const data = levelLookup[currentLvl.toString()];
        if (!data) continue;

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

    const nextLevelNode = levelLookup[(targetLevel + 1).toString()];
    baseStats.levelUpExp = nextLevelNode ? (nextLevelNode.levelUpExp || 0) : 0;

    return baseStats;
}

// Main Tab Renderer Engine
function renderPlayerProfile(container) {
    const playerState = saveState.playerPartial;

    container.style.gridTemplateColumns = "1fr";
    container.style.maxWidth = "550px";

    const activeStats = calculateStatsForLevel(playerState.level);

    // 1. Safe Cheat Trigger Wrapper
    const cheatWrapper = document.createElement('div');
    cheatWrapper.style.marginBottom = "20px";

    const cheatBtn = document.createElement('button');
    cheatBtn.className = "btn btn-danger";
    cheatBtn.innerText = "Prepare Next Level Up (Safe: Max EXP - 1)";
    cheatBtn.style.width = "100%";
    cheatBtn.style.padding = "12px";
    cheatBtn.style.fontSize = "15px";

    cheatBtn.onclick = () => {
        if (activeStats.levelUpExp > 0) {
            playerState.exp = activeStats.levelUpExp - 1;
            window.showToast("EXP Set! You will level up next action.", "success");
            refreshUI();
        } else {
            window.showToast("You are already at Max Level!", "warning");
        }
    };
    cheatWrapper.appendChild(cheatBtn);
    container.appendChild(cheatWrapper);

    // Live Progress Updater
    function updatePlayerProgressLive() {
        const currentLvl = playerState.level || 0;
        const currentExp = playerState.exp || 0;
        const stats = calculateStatsForLevel(currentLvl);
        const nextExp = stats.levelUpExp || 1;

        const progressPercent = stats.levelUpExp === 0 ? 100 : Math.min(100, (currentExp / nextExp) * 100);

        const fillEl = document.getElementById('player-exp-fill');
        const textEl = document.getElementById('player-exp-text');

        if (fillEl) fillEl.style.width = `${progressPercent}%`;
        if (textEl) textEl.innerText = stats.levelUpExp === 0 ? "MAX LEVEL" : `${currentExp} / ${nextExp} EXP`;
    }

    // 2. Input Fields Generator
    function createNumField(label, key, isNestedDay = false) {
        const wrapper = document.createElement('div');
        wrapper.style.marginBottom = "15px";

        const row = document.createElement('div');
        row.style.display = "flex"; row.style.justifyContent = "space-between"; row.style.alignItems = "center";

        const span = document.createElement('span');
        span.innerText = label; span.style.fontWeight = "bold";

        const input = document.createElement('input');
        input.type = 'number';
        input.value = isNestedDay ? playerState.gameDate.day : playerState[key];
        input.style.padding = "8px"; input.style.width = "150px"; input.style.border = "1px solid #ccc"; input.style.borderRadius = "4px";

        input.addEventListener('input', (e) => {
            let parsedVal = parseInt(e.target.value, 10) || 0;

            if (parsedVal < 0) parsedVal = 0;

            if (isNestedDay) {
                playerState.gameDate.day = parsedVal;
            } else {
                if (key === 'level') {
                    if (parsedVal > 50) parsedVal = 50;
                    playerState[key] = parsedVal;

                    const newStats = calculateStatsForLevel(parsedVal);
                    const safeExpLimit = newStats.levelUpExp > 0 ? newStats.levelUpExp - 1 : 0;
                    if (playerState.exp > safeExpLimit) {
                        playerState.exp = safeExpLimit;
                        const expInputEl = document.getElementById('player-exp-input');
                        if (expInputEl) expInputEl.value = safeExpLimit;
                    }
                }
                else if (key === 'exp') {
                    const currentStats = calculateStatsForLevel(playerState.level);
                    const safeExpLimit = currentStats.levelUpExp > 0 ? currentStats.levelUpExp - 1 : 0;

                    if (parsedVal > safeExpLimit) parsedVal = safeExpLimit;
                    playerState[key] = parsedVal;
                }
                else {
                    playerState[key] = parsedVal;
                }
            }

            e.target.value = parsedVal;
            if (key === 'exp' || key === 'level') updatePlayerProgressLive();
        });

        input.addEventListener('change', (e) => {
            if (key === 'level') refreshUI();
        });

        if (key === 'exp') input.id = 'player-exp-input';

        row.appendChild(span);
        row.appendChild(input);
        wrapper.appendChild(row);

        if (key === 'exp') {
            const progWrap = document.createElement('div');
            progWrap.innerHTML = `
                <div id="player-exp-text" style="text-align: right; font-size: 12px; color: var(--primary); font-weight: bold; margin-top: 5px;"></div>
                <div class="progress-wrapper">
                    <div id="player-exp-fill" class="progress-fill" style="background-color: var(--primary);"></div>
                </div>
            `;
            wrapper.appendChild(progWrap);
        }

        return wrapper;
    }

    container.appendChild(createNumField("Money (Fund):", "fund"));
    container.appendChild(createNumField("Level:", "level"));
    container.appendChild(createNumField("Experience Points:", "exp"));
    container.appendChild(createNumField("Current Day:", "day", true));

    updatePlayerProgressLive();

    // 3. Status Display Block
    const statBox = document.createElement('div');
    statBox.style.marginTop = "25px";
    statBox.style.padding = "15px";
    statBox.style.background = "#fff";
    statBox.style.border = "1px solid #ddd";
    statBox.style.borderRadius = "6px";
    statBox.style.fontFamily = "inherit";

    statBox.innerHTML = `
        <h3 style="margin-top: 0; color: #333; border-bottom: 2px solid #eee; padding-bottom: 8px; display:flex; justify-content:space-between;">
            <span>Active Level Up Statistics</span>
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