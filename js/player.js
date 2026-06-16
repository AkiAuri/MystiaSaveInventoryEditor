// Function to render the Player Profile Tab
function renderPlayerProfile(container) {
    const playerState = saveState.playerPartial;

    // Change to a single-column settings layout instead of a grid
    container.style.gridTemplateColumns = "1fr";
    container.style.maxWidth = "500px";

    // Helper function for generating basic integer inputs
    function createNumField(label, key) {
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
        input.value = playerState[key];
        input.style.padding = "8px";
        input.style.width = "150px";
        input.style.border = "1px solid #ccc";
        input.style.borderRadius = "4px";

        // Bind data change to the global saveState
        input.addEventListener('change', (e) => {
            playerState[key] = parseInt(e.target.value, 10);
        });

        row.appendChild(span);
        row.appendChild(input);
        return row;
    }

    // Generate the standard fields
    container.appendChild(createNumField("Money (Fund):", "fund"));
    container.appendChild(createNumField("Level:", "level"));
    container.appendChild(createNumField("Experience Points:", "exp"));

    // Handle nested gameDate.day specifically
    const dayRow = document.createElement('div');
    dayRow.style.display = "flex";
    dayRow.style.justifyContent = "space-between";
    dayRow.style.marginBottom = "15px";
    dayRow.style.alignItems = "center";

    const daySpan = document.createElement('span');
    daySpan.innerText = "Current Day:";
    daySpan.style.fontWeight = "bold";

    const dayInput = document.createElement('input');
    dayInput.type = 'number';
    dayInput.value = playerState.gameDate.day;
    dayInput.style.padding = "8px";
    dayInput.style.width = "150px";
    dayInput.style.border = "1px solid #ccc";
    dayInput.style.borderRadius = "4px";

    dayInput.addEventListener('change', (e) => {
        playerState.gameDate.day = parseInt(e.target.value, 10);
    });

    dayRow.appendChild(daySpan);
    dayRow.appendChild(dayInput);
    container.appendChild(dayRow);
}