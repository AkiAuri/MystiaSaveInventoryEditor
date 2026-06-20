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

// MAIN TAB RENDERER: THE NOTEBOOK UI
function renderPlayerProfile(container) {
    const playerState = saveState.playerPartial;
    const activeStats = calculateStatsForLevel(playerState.level);

    container.style = "";

    // Generate the stats list dynamically with the red diamonds
    const statRowsHTML = [
        { label: "Base Vibe", val: activeStats.startPassion },
        { label: "Base Tip Rate", val: `${(activeStats.startTipRate * 100).toFixed(0)}%` },
        { label: "Menu Dish Limit", val: activeStats.maxRecipes },
        { label: "Menu Drink Limit", val: activeStats.maxBeverages },
        { label: "Daily Prep Amount", val: activeStats.dayCookCount },
        { label: "Movement Speed", val: activeStats.moveSpdMultiplier },
        { label: "Cooking Time", val: `${(activeStats.cookSpdMultiplier * 100).toFixed(0)}%` },
        { label: "Sparrow Tune Buff Chance", val: `${(activeStats.qteBuffTriggerProb * 100).toFixed(0)}%` },
        { label: "Sparrow Tune Buff Duration", val: `${(activeStats.qteBuffLengthMultiplier * 100).toFixed(0)}%` },
        { label: "Extra Ingredient Chance", val: `${(activeStats.doubleCollectionProb * 100).toFixed(0)}%` },
        { label: "Trade Discount", val: `${(activeStats.shopPriceMultiplier * 100).toFixed(0)}%` },
        { label: "Max Trays", val: activeStats.maxTray },
        { label: "Base Guest Mood", val: `+${activeStats.additiveGuestBaseMood}` },
        { label: "Max Guest Patience", val: `${(activeStats.additiveGuestPatient * 100).toFixed(0)}%` },
        { label: "Guest Refresh Rate", val: `${(activeStats.additiveGuestSpawnRate * 100).toFixed(0)}%` },
        { label: "Reward Spell Card Duration", val: `${(activeStats.additivePositiveBuffTime * 100).toFixed(0)}%` }
    ].map(s => `<div class="stat-row"><span>${s.label}</span> <span class="stat-diamond">♦</span> <span class="stat-val">${s.val}</span></div>`).join('');

    // --- BUILD THE HTML STRUCTURE ---
    container.innerHTML = `
        <div style="margin-bottom: 15px; text-align: right;">
            <button class="btn btn-danger" id="safeLevelUpBtn">Auto-Set EXP for Next Level</button>
        </div>

        <div class="book-wrapper">
            <div class="book-layout">
                <!-- LEFT PAGE -->
                <div class="book-left">
                    <img src="sactx-0-256x512-BC7-Mystia_Default_Portrayal_Primary_Atlas-d4056389.png" class="mystia-sprite" alt="Mystia">
                    <div class="book-left-text">
                        <h2>The Proprietress!</h2>
                        <h1>Mystia Lorelei</h1>
                        <hr>
                        <h3>The Night Sparrow</h3>
                        <p>Inedible Bird<br>Indebted Singer...</p>
                    </div>
                </div>

                <!-- RIGHT PAGE -->
                <div class="book-right">
                    
                    <div class="book-header">
                        <div class="level-badge">
                            <span class="level-text">Lv</span>
                            <input type="number" id="playerLevelInput" class="seamless-input" style="font-size: 38px; color: #fceea7; text-shadow: 2px 2px 0 #333; width: 60px;" value="${playerState.level}">
                        </div>
                        
                        <div class="next-level-box">
                            <div style="color: #1a1a1a;">Next Level <span style="color: #c22020;" id="reqExpText">${activeStats.levelUpExp || 'MAX'}</span></div>
                            <div style="margin-top: 5px;">Current Day <input type="number" id="playerDayInput" class="seamless-input" style="font-size: 14px; color: #c22020; width: 50px; background: rgba(255,255,255,0.3);" value="${playerState.gameDate.day}"></div>
                        </div>
                    </div>

                    <div class="exp-wrapper">
                        <div class="exp-bar-container">
                            <input type="number" id="playerExpInput" class="seamless-input exp-orb-input" value="${playerState.exp}" title="Current EXP">
                            <div class="exp-bar-fill-wrapper">
                                <div id="playerExpFill" class="exp-bar-fill"></div>
                            </div>
                        </div>
                        <div class="exp-arrow"></div>
                        <span class="next-lv-text">Lv <span id="nextLvText">${playerState.level + 1}</span></span>
                    </div>

                    <div class="stat-list">
                        ${statRowsHTML}
                    </div>

                    <div class="money-bag-container">
                        <div class="money-plaque">
                            <input type="number" id="playerFundInput" class="seamless-input" style="font-size: 20px; color: #fff; width: 80px;" value="${playerState.fund}">
                            <span>¥</span>
                        </div>
                        <div class="money-icon"></div>
                    </div>

                </div>
            </div>
        </div>
    `;

    // --- LOGIC AND BINDINGS ---
    const updatePlayerProgressLive = () => {
        const currentLvl = playerState.level || 0;
        const currentExp = playerState.exp || 0;
        const stats = calculateStatsForLevel(currentLvl);
        const nextExp = stats.levelUpExp || 1;

        const progressPercent = stats.levelUpExp === 0 ? 100 : Math.min(100, (currentExp / nextExp) * 100);

        const fillEl = document.getElementById('playerExpFill');
        const nextLvlText = document.getElementById('nextLvText');
        const reqExpText = document.getElementById('reqExpText');

        if (fillEl) fillEl.style.width = `${progressPercent}%`;
        if (nextLvlText) nextLvlText.innerText = stats.levelUpExp === 0 ? "MAX" : currentLvl + 1;
        if (reqExpText) reqExpText.innerText = stats.levelUpExp === 0 ? "MAX" : stats.levelUpExp;
    };

    updatePlayerProgressLive();

    document.getElementById('safeLevelUpBtn').addEventListener('click', () => {
        const currentStats = calculateStatsForLevel(playerState.level);
        if (currentStats.levelUpExp > 0) {
            playerState.exp = currentStats.levelUpExp - 1;
            window.showToast("EXP Set! You will level up next action.", "success");
            refreshUI();
        } else {
            window.showToast("You are already at Max Level!", "warning");
        }
    });

    document.getElementById('playerLevelInput').addEventListener('input', (e) => {
        let parsedVal = parseInt(e.target.value, 10) || 0;
        if (parsedVal < 0) parsedVal = 0;
        if (parsedVal > 50) parsedVal = 50;

        playerState.level = parsedVal;
        e.target.value = parsedVal;

        const newStats = calculateStatsForLevel(parsedVal);
        const safeExpLimit = newStats.levelUpExp > 0 ? newStats.levelUpExp - 1 : 0;
        if (playerState.exp > safeExpLimit) {
            playerState.exp = safeExpLimit;
            document.getElementById('playerExpInput').value = safeExpLimit;
        }

        updatePlayerProgressLive();
    });

    document.getElementById('playerLevelInput').addEventListener('change', () => { refreshUI(); });

    document.getElementById('playerExpInput').addEventListener('input', (e) => {
        let parsedVal = parseInt(e.target.value, 10) || 0;
        if (parsedVal < 0) parsedVal = 0;

        const currentStats = calculateStatsForLevel(playerState.level);
        const safeExpLimit = currentStats.levelUpExp > 0 ? currentStats.levelUpExp - 1 : 0;

        if (parsedVal > safeExpLimit) parsedVal = safeExpLimit;

        playerState.exp = parsedVal;
        e.target.value = parsedVal;

        updatePlayerProgressLive();
    });

    document.getElementById('playerDayInput').addEventListener('input', (e) => {
        let parsedVal = parseInt(e.target.value, 10) || 1;
        if (parsedVal < 1) parsedVal = 1;
        playerState.gameDate.day = parsedVal;
        e.target.value = parsedVal;
    });

    document.getElementById('playerFundInput').addEventListener('input', (e) => {
        let parsedVal = parseInt(e.target.value, 10) || 0;
        if (parsedVal < 0) parsedVal = 0;
        playerState.fund = parsedVal;
        e.target.value = parsedVal;
    });
}