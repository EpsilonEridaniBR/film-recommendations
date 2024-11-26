// Constants
let filmsData = {};
let openedBoxes = []; // Track all opened boxes
let pinnedBoxes = []; // Track pinned boxes

// Load films.json dynamically
fetch('films.json')
    .then(response => response.json())
    .then(data => {
        filmsData = data;
    })
    .catch(error => {
        console.error('Error loading films.json:', error);
    });

// Handle Enter key press in the input box
document.getElementById('film-input').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
        const filmInput = e.target;
        const filmTitle = filmInput.value.trim();
        filmInput.value = '';
        closeAllUnpinnedBoxes(); // Close all unpinned boxes when a new film is searched

        // Find the closest match (case-insensitive)
        const matchedTitle = findClosestMatch(filmTitle);
        if (matchedTitle) {
            createFilmBox(matchedTitle, 20, 200); // Fixed initial position
        } else {
            // Handle invalid film input
            filmInput.placeholder = "I haven't seen that film, try another one";
            filmInput.classList.add('shake', 'error');
            setTimeout(() => {
                filmInput.classList.remove('shake', 'error');
                filmInput.placeholder = "Enter a film title...";
            }, 2000);
        }
    }
});

// Find the closest match for a given title
function findClosestMatch(input) {
    if (!input) return null;

    const lowerInput = input.toLowerCase();
    let bestMatch = null;

    for (const title of Object.keys(filmsData)) {
        if (title.toLowerCase() === lowerInput) {
            return title; // Exact match
        }
    }

    for (const title of Object.keys(filmsData)) {
        if (title.toLowerCase().includes(lowerInput)) {
            bestMatch = title; // Closest partial match
            break;
        }
    }

    return bestMatch;
}

// Create a film box
function createFilmBox(title, x, y) {
    const film = filmsData[title];
    const box = document.createElement('div');
    box.className = 'box';
    box.style.left = `${x}px`;
    box.style.top = `${y}px`;

    let isPinned = false; // Track whether the box is pinned

    // Populate the box
    const description = film.description || "";
    const author = film.author || ""; // Get the author from the JSON
    box.innerHTML = `
    <div class="header">
        <h3>${title}</h3>
        <span class="year">(${film.year || ""})</span>
        <span class="pin-button" title="Pin/Unpin">📌</span>
    </div>
    <p>${description}</p>
    <div class="author">
        - ${author}
    </div>
    <hr class="divider">
    <div>
        <h4>Recommendations:</h4>
        ${film.recommendations
            .map(rec => {
                const year = filmsData[rec.title]?.year ? ` (${filmsData[rec.title].year})` : '';
                const linkClass = filmsData[rec.title] ? 'recommendation-title' : 'recommendation-title missing';
                const reason = rec.reason || "";
                return `
                    <div class="recommendation">
                        <span class="${linkClass}" data-title="${rec.title}">
                            ${rec.title}${year}
                        </span> - ${reason}
                    </div>
                `;
            })
            .join('') || "<p></p>"}
    </div>
`;

    // Add pin button functionality
    const pinButton = box.querySelector('.pin-button');
    pinButton.addEventListener('click', () => {
        isPinned = !isPinned;
        pinButton.textContent = isPinned ? '📍' : '📌';
        box.classList.toggle('pinned', isPinned);

        if (isPinned) {
            pinnedBoxes.push(box); // Add to pinned boxes
        } else {
            pinnedBoxes = pinnedBoxes.filter(pinnedBox => pinnedBox !== box); // Remove from pinned boxes
        }
    });

    // Handle box clicks to close child boxes
    box.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!isPinned) closeChildBoxes(box); // Only close if not pinned
    });

    // Make recommendations clickable
    box.querySelectorAll('.recommendation-title').forEach(el => {
        el.addEventListener('click', (e) => {
            e.stopPropagation();
            const mouseX = e.pageX;
            const mouseY = e.pageY;
            createFilmBox(el.dataset.title, mouseX + 20, mouseY + 20);
        });
    });

    // Make the box draggable
    makeDraggable(box);

    // Append and track the box
    app.appendChild(box);
    openedBoxes.push(box);
}

// Close all unpinned boxes
function closeAllUnpinnedBoxes() {
    openedBoxes.forEach(box => {
        if (!pinnedBoxes.includes(box)) {
            box.remove();
        }
    });
    openedBoxes = openedBoxes.filter(box => pinnedBoxes.includes(box)); // Keep only pinned boxes
}

// Close child boxes
function closeChildBoxes(parentBox) {
    const index = openedBoxes.indexOf(parentBox);
    if (index >= 0) {
        const childBoxes = openedBoxes.slice(index + 1);
        childBoxes.forEach(box => {
            if (!pinnedBoxes.includes(box)) {
                box.remove();
            }
        });
        openedBoxes = [
            ...openedBoxes.slice(0, index + 1),
            ...childBoxes.filter(box => pinnedBoxes.includes(box)),
        ];
    }
}

// Make elements draggable
function makeDraggable(element) {
    let offsetX = 0, offsetY = 0, initialX = 0, initialY = 0;

    element.addEventListener('mousedown', function (e) {
        initialX = e.clientX;
        initialY = e.clientY;

        function move(e) {
            offsetX = e.clientX - initialX;
            offsetY = e.clientY - initialY;
            element.style.left = `${element.offsetLeft + offsetX}px`;
            element.style.top = `${element.offsetTop + offsetY}px`;
            initialX = e.clientX;
            initialY = e.clientY;
        }

        function stopMove() {
            document.removeEventListener('mousemove', move);
            document.removeEventListener('mouseup', stopMove);
        }

        document.addEventListener('mousemove', move);
        document.addEventListener('mouseup', stopMove);
    });
}
