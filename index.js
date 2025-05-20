const gameBoard = document.getElementById("game-board");
const statusHeader = document.getElementById("status-header");
const startButton = document.getElementById("start");
const resetButton = document.getElementById("reset");
const difficultySelect = document.getElementById("difficulty");
const themeToggle = document.getElementById("theme-toggle");
const powerUpButton = document.getElementById("power-up");

let flippedCards = [];
let matchedPairs = 0;
let moves = 0;
let totalPairs = 0;
let timer;

async function fetchPokemon() {
    const response = await fetch("https://pokeapi.co/api/v2/pokemon?limit=100");
    const data = await response.json();
    const pokemonList = data.results.map(pokemon => pokemon.url);

    let selectedPokemon = [];
    let selectedNames = new Set();

    while (selectedPokemon.length < totalPairs) {
        const randomIndex = Math.floor(Math.random() * pokemonList.length);
        const url = pokemonList[randomIndex];

        // Avoid duplicates in pairs selection
        if(selectedNames.has(url)) continue;

        const pokemonData = await fetch(url);
        const pokemonInfo = await pokemonData.json();

        if (!pokemonInfo.sprites.other["official-artwork"].front_default) continue;

        selectedPokemon.push({
            name: pokemonInfo.name,
            image: pokemonInfo.sprites.other["official-artwork"].front_default
        });
        selectedNames.add(url);
    }
    return selectedPokemon;
}

async function setupGame() {
    clearInterval(timer);
    gameBoard.innerHTML = "";
    moves = 0;
    matchedPairs = 0;
    flippedCards = [];
    totalPairs = difficultySelect.value === "easy" ? 4 : difficultySelect.value === "medium" ? 6 : 8;

    let pokemonPairs = await fetchPokemon();
    let deck = [...pokemonPairs, ...pokemonPairs]; 
    deck.sort(() => Math.random() - 0.5); 

    deck.forEach((pokemon, index) => {
        let card = document.createElement("div");
        card.classList.add("card");
        card.dataset.name = pokemon.name;

        card.innerHTML = `
            <div class="card-inner">
                <div class="card-front">
                    <img src="${pokemon.image}" alt="${pokemon.name}" />
                </div>
                <div class="card-back">
                    <img src="back.webp" alt="pokemon card" />
                </div>
            </div>
        `;

        card.addEventListener("click", () => handleCardClick(card));
        gameBoard.appendChild(card);
    });

    updateStatus();
}

function handleCardClick(card) {
    if (flippedCards.length < 2 && !card.classList.contains("matched") && !card.classList.contains("flipped")) {
        card.classList.add("flipped");
        flippedCards.push(card);

        if (flippedCards.length === 2) {
            setTimeout(checkMatch, 1000);
        }
    }
}

function checkMatch() {
    const [card1, card2] = flippedCards;
    if (card1.dataset.name === card2.dataset.name) {
        card1.classList.add("matched");
        card2.classList.add("matched");
        matchedPairs++;
        if (matchedPairs === totalPairs) {
            endGame(true);
        }
    } else {
        card1.classList.remove("flipped");
        card2.classList.remove("flipped");
    }

    flippedCards = [];
    moves++;
    updateStatus();
}

function updateStatus() {
    statusHeader.innerHTML = `Moves: ${moves} | Matches: ${matchedPairs}/${totalPairs}`;
}

function startTimer() {
    let timeLeft = difficultySelect.value === "easy" ? 60 : difficultySelect.value === "medium" ? 45 : 30;
    clearInterval(timer);
    timer = setInterval(() => {
        timeLeft--;
        statusHeader.innerHTML = `Time Left: ${timeLeft}s | Moves: ${moves} | Matches: ${matchedPairs}/${totalPairs}`;
        if (timeLeft <= 0) {
            endGame(false);
        }
    }, 1000);
}

function endGame(won) {
    clearInterval(timer);
    statusHeader.innerHTML = won ? "You Win! 🎉" : "Game Over 😞";
    document.querySelectorAll(".card").forEach(card => card.classList.add("disabled"));
}

function activatePowerUp() {
    document.querySelectorAll(".card").forEach(card => card.classList.add("flipped"));
    setTimeout(() => {
        document.querySelectorAll(".card").forEach(card => {
            if (!card.classList.contains("matched")) card.classList.remove("flipped");
        });
    }, 2000);
}

startButton.addEventListener("click", () => {
    setupGame().then(() => startTimer());
});
resetButton.addEventListener("click", () => {
    clearInterval(timer);
    setupGame();
});
themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark-theme");
});
powerUpButton.addEventListener("click", activatePowerUp);
