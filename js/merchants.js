// Function to render the Merchants Tab
function renderMerchants(container) {
    // Set up a wider grid for merchant names
    container.style.gridTemplateColumns = "repeat(auto-fill, minmax(250px, 1fr))";
    container.style.maxWidth = "none";

    // 1. Generate the Global Cheat Button
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
        const dlcData = saveState.dayScenePartialDLC || {};
        for (const dlc in dlcData) {
            const merchants = dlcData[dlc].alltrackedMerchants;
            if (merchants) {
                // Force every merchant's float value to 0.0
                merchants.forEach(m => m.currentPriceMultiplier = 0.0);
            }
        }
        refreshUI(); // Trigger UI reload from main.js
    };

    cheatWrapper.appendChild(cheatBtn);
    container.appendChild(cheatWrapper);

    // 2. Render individual Merchant Cards
    const dlcData = saveState.dayScenePartialDLC || {};

    for (const dlc in dlcData) {
        const merchants = dlcData[dlc].alltrackedMerchants;
        if (!merchants) continue;

        merchants.forEach((merchant, index) => {
            const card = document.createElement('div');
            card.className = 'item-card';

            // Clean up Unity internal ID names
            let cleanName = merchant.key.replace("Merchant_", "").split("_").reverse().join(" (") + ")";

            card.innerHTML = `
                <div class="module-tag">${dlc}</div>
                <span>${cleanName}</span>
                <label style="font-size: 12px; color: #666; margin-bottom: 5px;">Price Multiplier:</label>
            `;

            const input = document.createElement('input');
            input.type = 'number';
            input.step = '0.01'; // Allow float decimals
            input.value = merchant.currentPriceMultiplier;

            input.addEventListener('change', (e) => {
                saveState.dayScenePartialDLC[dlc].alltrackedMerchants[index].currentPriceMultiplier = parseFloat(e.target.value);
            });

            card.appendChild(input);
            container.appendChild(card);
        });
    }
}