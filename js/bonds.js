// Function to render the Bonds / Special Guests Tab
function renderBonds(container) {
    // Determine where the game saved the specialSkinSelection (Usually inside albumPartial)
    const bondsData = saveState.albumPartial?.specialSkinSelection || saveState.specialSkinSelection;

    if (!bondsData) {
        container.innerHTML = "<h3>No Bond Data Found in this Save</h3>";
        return;
    }

    // Use a slightly wider card layout to fit the text tags nicely
    container.style.gridTemplateColumns = "repeat(auto-fill, minmax(320px, 1fr))";
    container.style.maxWidth = "none";

    // --- 1. THE CHEAT BUTTON ---
    const cheatWrapper = document.createElement('div');
    cheatWrapper.style.gridColumn = "1 / -1";
    cheatWrapper.style.marginBottom = "20px";

    const cheatBtn = document.createElement('button');
    cheatBtn.className = "btn btn-danger";
    cheatBtn.innerText = "📖 Reveal All Preferences for Unlocked Guests";
    cheatBtn.style.width = "100%";
    cheatBtn.style.padding = "15px";
    cheatBtn.style.fontSize = "18px";

    cheatBtn.onclick = () => {
        // Loop through all guests in the save file
        for (const charId in bondsData) {
            // If we have their preferences in our cheat sheet, overwrite the save data
            if (guestPreferences[charId]) {
                bondsData[charId].RevealedFoodTags = [...(guestPreferences[charId].RevealedFoodTags || [])];
                bondsData[charId].RevealedHateFoodTags = [...(guestPreferences[charId].RevealedHateFoodTags || [])];
                bondsData[charId].RevealedBevTags = [...(guestPreferences[charId].RevealedBevTags || [])];
            }
        }
        refreshUI(); // Re-render to show the newly revealed tags
    };

    cheatWrapper.appendChild(cheatBtn);
    container.appendChild(cheatWrapper);

    // --- 2. TAG DECODING HELPER ---
    // Turns an array of tag IDs into a comma-separated list of readable names
    function decodeTags(tagArray, tagCategory) {
        if (!tagArray || tagArray.length === 0) return "<span style='color:#999'>None</span>";

        return tagArray.map(tagId => {
            // Uses the getItemDetails function from your main/inventory script
            const details = getItemDetails(tagCategory, tagId.toString());
            // If it returns the default "Unknown", just show the ID number to keep it clean
            return details.name.startsWith("Unknown") ? `Tag ${tagId}` : details.name;
        }).join(", ");
    }

    // --- 3. RENDER THE CARDS ---
    for (const [charId, charData] of Object.entries(bondsData)) {
        const card = document.createElement('div');
        card.className = 'item-card';

        // Find the Character Name from the dictionary
        let charName = `Character ID: ${charId}`;
        if (globalDictionary.CORE?.guests && globalDictionary.CORE.guests[charId]) {
            // Strip out <brief> tags for a clean UI
            charName = globalDictionary.CORE.guests[charId].replace(/<\/?brief>/g, '');
        }

        // Decode the arrays into readable strings
        const likedFoodStr = decodeTags(charData.RevealedFoodTags, 'food_tags');
        const hatedFoodStr = decodeTags(charData.RevealedHateFoodTags, 'food_tags');
        const bevStr = decodeTags(charData.RevealedBevTags, 'beverage_tags');

        // Build the visual card
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
                <input type="number" id="lvl-${charId}" value="${charData.CurrentBondLevel}" style="width: 80px;">
            </div>
            
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <label style="font-weight: bold; font-size: 14px;">Bond EXP:</label>
                <input type="number" id="exp-${charId}" value="${charData.CurrentBondExp}" style="width: 80px;">
            </div>
        `;

        // Data Binding: Update the JSON when the user types a new level or EXP
        card.querySelector(`#lvl-${charId}`).addEventListener('change', (e) => {
            bondsData[charId].CurrentBondLevel = parseInt(e.target.value, 10);
        });

        card.querySelector(`#exp-${charId}`).addEventListener('change', (e) => {
            bondsData[charId].CurrentBondExp = parseInt(e.target.value, 10);
        });

        container.appendChild(card);
    }
}