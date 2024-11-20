const app = document.getElementById('app');

// Constants
const INITIAL_DISPLACEMENT_X = 20;
const INITIAL_DISPLACEMENT_Y = 200;
const ORIGINAL_PLACEHOLDER = "Enter a film title...";

// Padding above the initial rectangle
const RECTANGLE_PADDING = 40;

let filmsData = {};
let openedBoxes = []; // Track all open rectangles

// Load films.json dynamically
fetch('films.json')
    .then(response => response.json())
    .then(data => {
        filmsData = data;
    })
    .catch(error => {
        console.error('Error loading films.json:', error);
    });

// Add padding to the initial rectangle
document.getElementById('initial-box').style.marginTop = `${RECTANGLE_PADDING}px`;

// Listen for Enter key press in the input box
document.getElementById('film-input').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
        const filmInput = e.target;
        const filmTitle = filmInput.value.trim();
        filmInput.value = '';
        closeAllBoxes(); // Close all rectangles before opening a new root

        // Find the closest match (case-insensitive)
        const matchedTitle = findClosestMatch(filmTitle);
        if (matchedTitle) {
            createFilmBox(matchedTitle, INITIAL_DISPLACEMENT_X, INITIAL_DISPLACEMENT_Y); // Use constants for padding
        } else {
            // Show a placeholder message and animate the input box
            filmInput.placeholder = "I haven't seen that film, try another one";
            filmInput.classList.add('shake', 'error');
            setTimeout(() => {
                filmInput.classList.remove('shake', 'error');
                filmInput.placeholder = ORIGINAL_PLACEHOLDER; // Reset placeholder
            }, 2000); // Reset placeholder after 2 seconds
        }
    }
});

// Find the closest match for a given title
function findClosestMatch(input) {
    if (!input) return null;

    const lowerInput = input.toLowerCase();
    let bestMatch = null;

    // Prioritize exact matches first
    for (const title of Object.keys(filmsData)) {
        if (title.toLowerCase() === lowerInput) {
            return title; // Exact match
        }
    }

    // Find partial matches
    for (const title of Object.keys(filmsData)) {
        if (title.toLowerCase().includes(lowerInput)) {
            bestMatch = title; // Closest partial match
            break;
        }
    }

    return bestMatch;
}

// Make a rectangle draggable
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

// Create a rectangle for a film
function createFilmBox(title, x, y) {
    const film = filmsData[title];
    const box = document.createElement('div');
    box.className = 'box';
    box.style.left = `${x}px`;
    box.style.top = `${y}px`;

    // Populate the box
    const description = film.description || "";
    box.innerHTML = `
        <div class="header">
            <h3>${title}</h3>
            <span class="year">${film.year || "Unknown year"}</span>
        </div>
        <p>${description}</p>
        <hr class="divider">
        <div>
            <h4>Recommendations:</h4>
            ${film.recommendations
                .map(rec => {
                    const year = filmsData[rec.title]?.year ? ` (${filmsData[rec.title].year})` : '';
                    const linkClass = filmsData[rec.title] ? 'recommendation-title' : 'recommendation-title missing';
                    const reason = rec.reason || "No reason provided";
                    return `
                        <div class="recommendation">
                            <span class="${linkClass}" data-title="${rec.title}">
                                ${rec.title}${year}
                            </span> - ${reason}
                        </div>
                    `;
                })
                .join('') || "<p>No recommendations available</p>"}
        </div>
    `;

    // Attach event listeners for recommendations and box click
    box.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent propagating the click
        closeChildBoxes(box); // Close child rectangles when parent is clicked
    });

    box.querySelectorAll('.recommendation-title').forEach(el => {
        el.addEventListener('click', function (e) {
            e.stopPropagation(); // Prevent triggering parent click event
            const mouseX = e.pageX;
            const mouseY = e.pageY;
            createFilmBox(el.dataset.title, mouseX + 20, mouseY + 20); // Spawn child box at mouse position
        });
    });

    // Make the box draggable
    makeDraggable(box);

    // Append the box to the app and track it
    app.appendChild(box);
    openedBoxes.push(box);
}

// Close all rectangles
function closeAllBoxes() {
    openedBoxes.forEach(box => box.remove());
    openedBoxes = [];
}

// Close child rectangles for a specific parent
function closeChildBoxes(parentBox) {
    const index = openedBoxes.indexOf(parentBox);
    if (index >= 0) {
        const childBoxes = openedBoxes.slice(index + 1);
        childBoxes.forEach(box => box.remove());
        openedBoxes = openedBoxes.slice(0, index + 1);
    }
}
