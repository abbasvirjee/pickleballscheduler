let players = [];
let fixtures = [];
let scores = [];
let playerWins = {};
let playerPoints = {};
let gamesPlayed = {};

function createPlayerInputs() {
    const numPlayers = parseInt(document.getElementById('numberOfPlayers').value, 10);
    if (isNaN(numPlayers) || numPlayers < 4 || numPlayers > 20) {
        alert("Please enter a number between 4 and 20.");
        return;
    }

    const playerNamesDiv = document.getElementById('playerNames');
    playerNamesDiv.innerHTML = ""; // Clear any previous input fields
    for (let i = 1; i <= numPlayers; i++) {
        playerNamesDiv.innerHTML += `<input type="text" id="player${i}" placeholder="Player ${i}">`;
    }
}

function setPlayers() {
    players = [];
    const numPlayers = parseInt(document.getElementById('numberOfPlayers').value, 10);

    for (let i = 1; i <= numPlayers; i++) {
        const playerName = document.getElementById(`player${i}`).value.trim();
        if (playerName) {
            players.push(playerName);
        }
    }

    if (players.length !== numPlayers) {
        alert(`Please enter exactly ${numPlayers} player names.`);
        return;
    }

    // Initialize wins, points, and games played for each player
    players.forEach(player => {
        playerWins[player] = 0;
        playerPoints[player] = 0;
        gamesPlayed[player] = 0;
    });

    alert("Players set successfully!");
    updateGamesPlayedTable(); // Update the table immediately after setting players
}

function generateFixtures() {
    fixtures = [];
    scores = [];
    const numPlayers = players.length;
    const allTeams = [];

    // Generate all possible teams of 2 players
    for (let i = 0; i < numPlayers; i++) {
        for (let j = i + 1; j < numPlayers; j++) {
            allTeams.push([players[i], players[j]]);
        }
    }

    // Shuffle teams randomly
    allTeams.sort(() => Math.random() - 0.5);

    const usedPlayers = new Set();

    // Create fixtures ensuring no player repeats in a match
    while (allTeams.length > 1) {
        const match = [];
        usedPlayers.clear();

        for (let i = 0; i < allTeams.length; i++) {
            const team = allTeams[i];
            if (team.every(player => !usedPlayers.has(player))) {
                match.push(team);
                team.forEach(player => usedPlayers.add(player));
                allTeams.splice(i, 1);  // Remove selected team
                i--;  // Adjust index due to removal
            }
            if (match.length === 2) {
                break;
            }
        }

        if (match.length === 2) {
            fixtures.push(match);
            // Update games played count
            match.forEach(team => team.forEach(player => gamesPlayed[player]++));
        } else {
            break;  // No more valid matches can be created
        }
    }

    if (fixtures.length === 0) {
        alert("Unable to generate fixtures. Not enough teams available.");
    } else {
        displayFixtures();
        updateGamesPlayedTable();
    }
}

function displayFixtures() {
    const fixturesList = document.getElementById('fixturesList');
    fixturesList.innerHTML = "";
    fixtures.forEach((match, index) => {
        if (match.length === 2) {
            fixturesList.innerHTML += `
                <div>
                    Game ${index + 1}: Team 1 - ${match[0].join(" and ")} vs Team 2 - ${match[1].join(" and ")}
                    <div class="score-inputs">
                        <label>Team 1 Score:</label>
                        <select class="score" data-match-index="${index}" data-team-index="0">${[...Array(16).keys()].map(i => `<option value="${i}">${i}</option>`).join('')}</select>
                        <label>Team 2 Score:</label>
                        <select class="score" data-match-index="${index}" data-team-index="1">${[...Array(16).keys()].map(i => `<option value="${i}">${i}</option>`).join('')}</select>
                    </div>
                </div>
            `;
        }
    });
}

function addGame() {
    const numPlayers = players.length;
    let playersSortedByGames = players.slice().sort((a, b) => gamesPlayed[a] - gamesPlayed[b]);

    // Create new teams by prioritizing players with the least number of games
    const newTeams = [];
    for (let i = 0; i < numPlayers - 1; i++) {
        for (let j = i + 1; j < numPlayers; j++) {
            const player1 = playersSortedByGames[i];
            const player2 = playersSortedByGames[j];

            if (newTeams.length < 2 && !newTeams.some(team => team.includes(player1) || team.includes(player2))) {
                newTeams.push([player1, player2]);
            }
        }
    }

    // Shuffle remaining players if needed
    if (newTeams.length < 2) {
        const remainingPlayers = playersSortedByGames.filter(player => !newTeams.flat().includes(player));
        while (newTeams.length < 2) {
            const shuffledPlayers = remainingPlayers.sort(() => 0.5 - Math.random());
            newTeams.push([shuffledPlayers[0], shuffledPlayers[1]]);
        }
    }

    if (newTeams.length === 2) {
        fixtures.push(newTeams);
        newTeams.forEach(team => team.forEach(player => gamesPlayed[player]++));
        displayFixtures();
        updateGamesPlayedTable();
    } else {
        alert("Unable to add more games.");
    }
}

function deleteGame() {
    if (fixtures.length === 0) {
        alert("No games to delete.");
        return;
    }

    const lastGame = fixtures.pop();

    // Update games played count
    lastGame.forEach(team => team.forEach(player => gamesPlayed[player]--));

    displayFixtures();
    updateGamesPlayedTable();
}

function calculateResults() {
    const scoreInputs = document.querySelectorAll('.score');
    scores = [];

    scoreInputs.forEach(input => {
        const matchIndex = input.getAttribute('data-match-index');
        const teamIndex = input.getAttribute('data-team-index');
        if (!scores[matchIndex]) scores[matchIndex] = [];
        scores[matchIndex][teamIndex] = parseInt(input.value, 10);
    });

    // Reset wins and points
    players.forEach(player => {
        playerWins[player] = 0;
        playerPoints[player] = 0;
    });

    scores.forEach((score, index) => {
        const match = fixtures[index];
        const team1 = match[0];
        const team2 = match[1];
        const team1Score = score[0];
        const team2Score = score[1];

        if (team1Score > team2Score) {
            team1.forEach(player => playerWins[player]++);
        } else if (team2Score > team1Score) {
            team2.forEach(player => playerWins[player]++);
        }

        team1.forEach(player => playerPoints[player] += (team1Score - team2Score));
        team2.forEach(player => playerPoints[player] += (team2Score - team1Score));
    });

    updateResultsTable();
}

function updateResultsTable() {
    const resultsList = document.getElementById('resultsList');
    resultsList.innerHTML = "";
    players.sort((a, b) => playerWins[b] - playerWins[a] || playerPoints[b] - playerPoints[a]);

    players.forEach(player => {
        resultsList.innerHTML += `<tr>
            <td>${player}</td>
            <td>${playerWins[player]}</td>
            <td>${playerPoints[player]}</td>
        </tr>`;
    });
}

function updateGamesPlayedTable() {
    const gamesPlayedTable = document.getElementById('gamesPlayedTable');
    gamesPlayedTable.innerHTML = `
        <tr>
            <th>Player</th>
            <th>Games Played</th>
        </tr>
    `;

    Object.keys(gamesPlayed).forEach(player => {
        gamesPlayedTable.innerHTML += `
            <tr>
                <td>${player}</td>
                <td>${gamesPlayed[player]}</td>
            </tr>
        `;
    });
}

function setupFinalGame() {
    const finalGameTeamsDiv = document.getElementById('finalGameTeams');
    const finalGameScoreDiv = document.getElementById('finalGameScore');

    players.sort((a, b) => playerWins[b] - playerWins[a] || playerPoints[b] - playerPoints[a]);
    const team1 = [players[0], players[1]];
    const team2 = [players[2], players[3]];

    finalGameTeamsDiv.innerHTML = `
        <p>Team 1: ${team1.join(" and ")}</p>
        <p>Team 2: ${team2.join(" and ")}</p>
    `;

    // Replace the finalWinner select with textboxes for final game scores
    finalGameScoreDiv.innerHTML = `
        <label for="finalScore1">Team 1 Score:</label>
        <input type="text" id="finalScore1" placeholder="Score">
        <label for="finalScore2">Team 2 Score:</label>
        <input type="text" id="finalScore2" placeholder="Score">
    `;
    
    finalGameScoreDiv.style.display = "block";
}


function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();

    pdf.text("Pickleball Scheduler Results", 10, 10);

    // Use the AutoTable plugin to add tables for results
    pdf.autoTable({ html: '#resultsTable', startY: 20 });

    pdf.text("Games Played", 10, pdf.lastAutoTable.finalY + 10);
    pdf.autoTable({ html: '#gamesPlayedTable', startY: pdf.lastAutoTable.finalY + 20 });

    // Add all games played with scores
    pdf.text("All Games and Scores", 10, pdf.lastAutoTable.finalY + 10);
    let allGamesContent = [];
    fixtures.forEach((fixture, index) => {
        const team1 = fixture[0].join(" and ");
        const team2 = fixture[1].join(" and ");
        const score1 = scores[index] ? scores[index][0] : 0;
        const score2 = scores[index] ? scores[index][1] : 0;
        allGamesContent.push([`Game ${index + 1}`, team1, score1, team2, score2]);
    });

    pdf.autoTable({
        head: [['Game', 'Team 1', 'Score', 'Team 2', 'Score']],
        body: allGamesContent,
        startY: pdf.lastAutoTable.finalY + 10
    });

    // Calculate the final winner
    const finalWinnerSelect = document.getElementById('finalWinner');
    const finalScore1 = parseInt(document.getElementById('finalScore1').value, 10);
    const finalScore2 = parseInt(document.getElementById('finalScore2').value, 10);

    let finalWinner = '';
    if (finalWinnerSelect) {
        // Ensure the finalWinnerSelect element exists
        if (finalScore1 > finalScore2) {
            finalWinner = finalWinnerSelect.options[0] ? finalWinnerSelect.options[0].text : 'N/A';
        } else {
            finalWinner = finalWinnerSelect.options[1] ? finalWinnerSelect.options[1].text : 'N/A';
        }
    } else {
        // Handle case where finalWinnerSelect is not found
        finalWinner = 'N/A';
    }

    // Add final game details and winner
    pdf.text("Final Game Details", 10, pdf.lastAutoTable.finalY + 10);
    pdf.autoTable({
        head: [['Winner', 'Score 1', 'Score 2']],
        body: [[finalWinner, finalScore1, finalScore2]],
        startY: pdf.lastAutoTable.finalY + 20
    });

    // Centered and slightly adjusted congratulatory text
    const pageWidth = pdf.internal.pageSize.width;
    const congratText = `Congratulations to ${finalWinner}!`;
    const textWidth = pdf.getTextWidth(congratText);
    const textX = (pageWidth - textWidth) / 2;
    const textY = pdf.lastAutoTable.finalY + 40; // Adjust Y position to move text up slightly

    pdf.setFontSize(20);
    pdf.text(congratText, textX, textY);

    pdf.save("Pickleball_Scheduler_Results.pdf");
}

