// Function to render the Merchants Tab
function renderMerchants(container) {
    container.style.gridTemplateColumns = "repeat(auto-fill, minmax(250px, 1fr))";
    container.style.maxWidth = "none";

    // Build unified array of all merchant locations
    let allMerchantsGroups = [];

    // Core
    if (saveState.dayScenePartial && saveState.dayScenePartial.alltrackedMerchants) {
        allMerchantsGroups.push({ module: 'CORE', merchants: saveState.dayScenePartial.alltrackedMerchants });
    }

    // DLC
    if (saveState.dayScenePartialDLC) {
        for (const [dlc, data] of Object.entries(saveState.dayScenePartialDLC)) {
            if (data.alltrackedMerchants) {
                allMerchantsGroups.push({ module: dlc, merchants: data.alltrackedMerchants });
            }
        }
    }

    // 1. Global Cheat Button
    const cheatWrapper = document.createElement('div');
    cheatWrapper.style.gridColumn = "1 / -1";
    cheatWrapper.style.marginBottom = "20px";

    const cheatBtn = document.createElement('button');
    cheatBtn.className = "btn btn-danger";
    cheatBtn.innerText = "🌟 Make All Shops Free (Set Multipliers to 0)";
    cheatBtn.style.width = "100%";
    cheatBtn.style.padding = "15px";
    cheatBtn.style.fontSize = "18px";

    cheatBtn.onclick = () => {
        for (const group of allMerchantsGroups) {
            group.merchants.forEach(m => m.currentPriceMultiplier = 0.0);
        }
        refreshUI();
    };

    cheatWrapper.appendChild(cheatBtn);
    container.appendChild(cheatWrapper);

    // 2. Render individual Merchant Cards
    for (const group of allMerchantsGroups) {
        group.merchants.forEach((merchant) => {
            const card = document.createElement('div');
            card.className = 'item-card';

            let cleanName = merchant.key.replace("Merchant_", "").replace("WineMerchant_", "").split("_").reverse().join(" (") + ")";

            card.innerHTML = `
                <div class="module-tag">${group.module}</div>
                <span>${cleanName}</span>
                <label style="font-size: 12px; color: #666; margin-bottom: 5px;">Price Multiplier:</label>
            `;

            const input = document.createElement('input');
            input.type = 'number';
            input.step = '0.01';
            input.value = merchant.currentPriceMultiplier;

            input.addEventListener('change', (e) => {
                merchant.currentPriceMultiplier = parseFloat(e.target.value);
            });

            card.appendChild(input);
            container.appendChild(card);
        });
    }
}