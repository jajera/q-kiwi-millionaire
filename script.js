// Game state variables
let questions = [];
let prizes = [];
let currentQuestionIndex = 0;
let usedLifelines = {
    fiftyFifty: false,
    askAudience: false,
    phoneFriend: false
};
let gameActive = false;
let language = 'en'; // Default language

// DOM Elements
const welcomeScreen = document.getElementById('welcome-screen');
const gameScreen = document.getElementById('game-screen');
const resultsScreen = document.getElementById('results-screen');
const questionText = document.getElementById('question-text');
const questionNumber = document.getElementById('question-number');
const prizeAmount = document.getElementById('prize-amount');
const prizeList = document.getElementById('prize-list');
const optionButtons = [
    document.getElementById('option-0'),
    document.getElementById('option-1'),
    document.getElementById('option-2'),
    document.getElementById('option-3')
];
const feedbackMessage = document.getElementById('feedback-message');
const resultHeading = document.getElementById('result-heading');
const resultMessage = document.getElementById('result-message');
const finalPrize = document.getElementById('final-prize');

// Lifeline elements
const fiftyFiftyBtn = document.getElementById('fifty-fifty');
const askAudienceBtn = document.getElementById('ask-audience');
const phoneFriendBtn = document.getElementById('phone-friend');
const audienceResults = document.getElementById('audience-results');
const phoneFriendModal = document.getElementById('phone-friend-modal');
const friendResponse = document.getElementById('friend-response');

// Language toggle elements
const langEnBtn = document.getElementById('lang-en');
const langMiBtn = document.getElementById('lang-mi');

// Button elements
const startGameBtn = document.getElementById('start-game');
const playAgainBtn = document.getElementById('play-again');
const closeAudienceBtn = document.getElementById('close-audience');
const closePhoneBtn = document.getElementById('close-phone');
const withdrawBtn = document.getElementById('withdraw-btn');

// Audio context for sound effects
let audioContext;

// Language translations
const translations = {
    en: {
        startGame: 'Start Quiz',
        playAgain: 'Play Again',
        questionPrefix: 'Question',
        correct: 'Correct!',
        incorrect: 'Incorrect!',
        win: 'Congratulations!',
        lose: 'Game Over!',
        winMessage: 'You\'ve reached the top of the prize ladder!',
        loseMessage: 'Better luck next time!',
        finalPrizePrefix: 'You won: $',
        close: 'Close',
        prizeLadder: 'Prize Ladder',
        audienceResults: 'Audience Results',
        phoneAFriend: 'Phone a Friend',
        withdraw: 'Withdraw',
        withdrawMessage: 'You decided to walk away with your winnings.'
    },
    mi: {
        startGame: 'Tīmata Quiz',
        playAgain: 'Tākaro Anō',
        questionPrefix: 'Pātai',
        correct: 'Tika!',
        incorrect: 'Hē!',
        win: 'Kia ora!',
        lose: 'Kua Mutu!',
        winMessage: 'Kua tae koe ki te taumata o te arawhata!',
        loseMessage: 'Ka pai ake ā muri ake nei!',
        finalPrizePrefix: 'Kua wikitōria koe: $',
        close: 'Kati',
        prizeLadder: 'Arawhata Utu',
        audienceResults: 'Hua o te Hunga Mātakitaki',
        phoneAFriend: 'Waea ki a Hoa',
        withdraw: 'Tangohia',
        withdrawMessage: 'I whiriwhiri koe ki te tango i ō wikitōria.'
    }
};

// Initialize the game
async function initGame() {
    try {
        // Load questions from JSON file
        const response = await fetch('questions.json');
        const data = await response.json();

        // Check if questions were loaded properly
        if (!data.questions || data.questions.length === 0) {
            throw new Error('No questions found in the JSON file');
        }

        console.log(`Loaded ${data.questions.length} questions from JSON`);

        questions = data.questions;
        prizes = data.prizes;

        // Validate we have enough questions
        if (questions.length < 15) {
            console.warn(`Only ${questions.length} questions available, but 15 are needed for a full game`);
        }

        // Select random questions for the game
        const questionCount = Math.min(15, questions.length);
        questions = selectRandomQuestions(questions, questionCount);
        console.log(`Selected ${questions.length} questions for the game`);

        // Set up event listeners
        setupEventListeners();

        // Initialize audio context
        initAudio();

        // Populate prize ladder
        populatePrizeLadder();

        // Set option button letters
        setOptionLetters();

        // Update withdraw button state
        updateWithdrawButton();

        console.log('Game initialization complete!');

    } catch (error) {
        console.error('Error initializing game:', error);
        alert('Failed to load game data. Please refresh the page.');
    }
}

// Set up event listeners
function setupEventListeners() {
    // Game navigation buttons
    startGameBtn.addEventListener('click', startGame);
    playAgainBtn.addEventListener('click', resetGame);
    withdrawBtn.addEventListener('click', handleWithdraw);

    // Option buttons
    optionButtons.forEach((button, index) => {
        button.addEventListener('click', () => checkAnswer(index));
    });

    // Lifeline buttons
    fiftyFiftyBtn.addEventListener('click', useFiftyFifty);
    askAudienceBtn.addEventListener('click', useAskAudience);
    phoneFriendBtn.addEventListener('click', usePhoneFriend);

    // Modal close buttons
    closeAudienceBtn.addEventListener('click', () => {
        audienceResults.style.display = 'none';
    });

    closePhoneBtn.addEventListener('click', () => {
        phoneFriendModal.style.display = 'none';
    });

    // Language toggle
    langEnBtn.addEventListener('click', () => setLanguage('en'));
    langMiBtn.addEventListener('click', () => setLanguage('mi'));
}

// Initialize Web Audio API
function initAudio() {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (error) {
        console.warn('Web Audio API not supported:', error);
    }
}

// Play sound effect
function playSound(type) {
    if (!audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    switch (type) {
        case 'click':
            oscillator.frequency.value = 300;
            gainNode.gain.value = 0.1;
            oscillator.start();
            setTimeout(() => oscillator.stop(), 100);
            break;
        case 'correct':
            // Softer, more pleasant sound for correct answers
            oscillator.type = 'sine';
            oscillator.frequency.value = 600;
            gainNode.gain.value = 0.1;
            oscillator.start();

            // Create a second oscillator for a pleasant chord
            const oscillator2 = audioContext.createOscillator();
            const gainNode2 = audioContext.createGain();
            oscillator2.connect(gainNode2);
            gainNode2.connect(audioContext.destination);
            oscillator2.type = 'sine';
            oscillator2.frequency.value = 750;
            gainNode2.gain.value = 0.05;
            oscillator2.start();

            // Gentle fade out
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5);
            gainNode2.gain.setValueAtTime(0.05, audioContext.currentTime);
            gainNode2.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.6);

            setTimeout(() => {
                oscillator.stop();
                oscillator2.stop();
            }, 600);
            break;
        case 'incorrect':
            // Softer, less jarring incorrect sound
            oscillator.type = 'sine';
            oscillator.frequency.value = 250;
            gainNode.gain.value = 0.1;

            // Gentle fade in and out
            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.1);
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime + 0.5);
            gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.8);

            oscillator.start();
            setTimeout(() => oscillator.stop(), 800);
            break;
        case 'win':
            playWinSequence();
            break;
    }
}

// Play win sequence
function playWinSequence() {
    if (!audioContext) return;

    // Softer, more pleasant win sequence
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    const durations = [0.2, 0.2, 0.2, 0.5];

    notes.forEach((note, index) => {
        setTimeout(() => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.type = 'sine';
            oscillator.frequency.value = note;
            gainNode.gain.value = 0.1; // Reduced volume

            // Gentle attack and release
            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.05);
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime + durations[index] - 0.05);
            gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + durations[index]);

            oscillator.start();
            setTimeout(() => oscillator.stop(), durations[index] * 1000);
        }, index * 250);
    });
}

// Set option button letters
function setOptionLetters() {
    const letters = ['A', 'B', 'C', 'D'];
    optionButtons.forEach((button, index) => {
        button.setAttribute('data-letter', letters[index]);
    });
}

// Populate prize ladder
function populatePrizeLadder() {
    prizeList.innerHTML = '';

    prizes.slice().reverse().forEach((prize, index) => {
        const actualIndex = prizes.length - 1 - index;
        const li = document.createElement('li');
        li.textContent = `$${prize}`;
        li.setAttribute('data-index', actualIndex);

        // Mark milestone prizes (guaranteed amounts)
        // Dynamically determine milestones based on prize ladder
        // Typically milestones are at positions 5 and 10 (counting from 1)
        if (actualIndex === 4 || actualIndex === 9 || actualIndex === 14) {
            li.classList.add('milestone');
        }

        prizeList.appendChild(li);
    });
}

// Update prize ladder highlighting
function updatePrizeLadder() {
    const items = prizeList.querySelectorAll('li');
    items.forEach(item => {
        item.classList.remove('current');

        // Mark questions that have been reached
        const itemIndex = parseInt(item.getAttribute('data-index'));
        if (itemIndex < currentQuestionIndex) {
            item.classList.add('reached');
        }
    });

    const currentItem = prizeList.querySelector(`li[data-index="${currentQuestionIndex}"]`);
    if (currentItem) {
        currentItem.classList.add('current');
    }

    // Update withdraw button state
    updateWithdrawButton();
}

// Update withdraw button state
function updateWithdrawButton() {
    // Withdraw button should only be enabled if player has answered at least one question
    if (currentQuestionIndex > 0 && gameActive) {
        withdrawBtn.disabled = false;
        // Show current prize amount on button
        const currentPrize = prizes[currentQuestionIndex - 1];
        withdrawBtn.title = `Take $${currentPrize} and end the game`;
        withdrawBtn.innerHTML = `Withdraw ($${currentPrize})`;
    } else {
        withdrawBtn.disabled = true;
        withdrawBtn.title = "Answer at least one question to withdraw";
        withdrawBtn.innerHTML = "Withdraw";
    }
}

// Start the game
function startGame() {
    playSound('click');
    gameActive = true;
    currentQuestionIndex = 0;

    // Reset lifelines
    usedLifelines = {
        fiftyFifty: false,
        askAudience: false,
        phoneFriend: false
    };

    // Reset lifeline buttons
    fiftyFiftyBtn.classList.remove('used');
    askAudienceBtn.classList.remove('used');
    phoneFriendBtn.classList.remove('used');

    // Reset prize ladder highlights
    const prizeItems = prizeList.querySelectorAll('li');
    prizeItems.forEach(item => {
        item.classList.remove('current', 'reached');
    });

    // Shuffle questions
    shuffleQuestions();

    // Show game screen
    welcomeScreen.classList.remove('active');
    gameScreen.classList.add('active');
    resultsScreen.classList.remove('active');

    // Load first question
    loadQuestion();

    // Update withdraw button state
    updateWithdrawButton();
}

// Shuffle questions array
function shuffleQuestions() {
    for (let i = questions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [questions[i], questions[j]] = [questions[j], questions[i]];
    }
}

// Select random questions from the pool
function selectRandomQuestions(questionPool, count) {
    // Create a copy of the question pool
    const pool = [...questionPool];

    // Shuffle the pool
    for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    // Return the first 'count' questions
    return pool.slice(0, count);
}

// Load current question
function loadQuestion() {
    const currentQuestion = questions[currentQuestionIndex];

    // Update question text and number
    questionText.textContent = language === 'en' ?
        currentQuestion.question.en :
        currentQuestion.question.mi;

    questionNumber.textContent = `${translations[language].questionPrefix} ${currentQuestionIndex + 1}`;
    prizeAmount.textContent = `$${prizes[currentQuestionIndex]}`;

    // Update prize ladder
    updatePrizeLadder();

    // Set option texts
    optionButtons.forEach((button, index) => {
        button.textContent = language === 'en' ?
            currentQuestion.options[index].en :
            currentQuestion.options[index].mi;
        button.className = 'option-btn';
        button.disabled = false;
        button.style.display = 'block';
    });
}

// Check selected answer
function checkAnswer(selectedIndex) {
    if (!gameActive) return;

    const currentQuestion = questions[currentQuestionIndex];
    const correctIndex = currentQuestion.correct;

    // Disable all option buttons
    optionButtons.forEach(button => {
        button.disabled = true;
    });

    // Highlight correct and incorrect answers
    optionButtons[selectedIndex].classList.add(selectedIndex === correctIndex ? 'correct' : 'incorrect');
    if (selectedIndex !== correctIndex) {
        optionButtons[correctIndex].classList.add('correct');
    }

    // Show feedback message
    showFeedback(selectedIndex === correctIndex);

    // Wait before proceeding
    setTimeout(() => {
        if (selectedIndex === correctIndex) {
            handleCorrectAnswer();
        } else {
            handleIncorrectAnswer();
        }
    }, 2000);
}

// Show feedback message
function showFeedback(isCorrect) {
    feedbackMessage.textContent = isCorrect ?
        translations[language].correct :
        translations[language].incorrect;

    feedbackMessage.style.backgroundColor = isCorrect ?
        'rgba(40, 167, 69, 0.9)' :
        'rgba(220, 53, 69, 0.9)';

    feedbackMessage.style.display = 'block';

    // Play sound
    playSound(isCorrect ? 'correct' : 'incorrect');

    // Hide feedback after delay
    setTimeout(() => {
        feedbackMessage.style.display = 'none';
    }, 1500);
}

// Handle correct answer
function handleCorrectAnswer() {
    currentQuestionIndex++;

    if (currentQuestionIndex >= questions.length) {
        // Player won the game
        endGame(true);
    } else {
        // Load next question
        loadQuestion();

        // Update withdraw button state
        updateWithdrawButton();

        console.log(`Advanced to question ${currentQuestionIndex}, withdraw amount: $${prizes[currentQuestionIndex-1]}`);
    }
}

// Handle incorrect answer
function handleIncorrectAnswer() {
    // Determine final prize based on milestones
    let finalPrizeAmount = 0;

    // Find the highest milestone reached
    // Dynamically determine based on the prize ladder
    if (currentQuestionIndex > 9) {
        finalPrizeAmount = prizes[9]; // Second milestone (typically $32,000)
    } else if (currentQuestionIndex > 4) {
        finalPrizeAmount = prizes[4]; // First milestone (typically $1,000)
    }

    // End game with the appropriate prize amount
    endGame(false, finalPrizeAmount);
}

// End the game
function endGame(isWin, finalPrizeAmount = null) {
    gameActive = false;

    // Calculate final prize
    if (finalPrizeAmount === null) {
        if (isWin) {
            finalPrizeAmount = prizes[prizes.length - 1]; // Top prize for winning
        } else {
            // This should not happen as finalPrizeAmount should be set in handleIncorrectAnswer
            // But as a fallback:
            if (currentQuestionIndex > 9) {
                finalPrizeAmount = prizes[9]; // Second milestone
            } else if (currentQuestionIndex > 4) {
                finalPrizeAmount = prizes[4]; // First milestone
            } else {
                finalPrizeAmount = 0;
            }
        }
    }

    // Update results screen
    resultHeading.textContent = isWin ?
        translations[language].win :
        translations[language].lose;

    resultMessage.textContent = isWin ?
        translations[language].winMessage :
        translations[language].loseMessage;

    finalPrize.textContent = `${translations[language].finalPrizePrefix}${finalPrizeAmount}`;

    // Disable withdraw button
    withdrawBtn.disabled = true;

    // Show results screen
    gameScreen.classList.remove('active');
    resultsScreen.classList.add('active');

    // Play win sound if player won
    if (isWin) {
        playSound('win');
    }
}

// Reset game
function resetGame() {
    playSound('click');
    welcomeScreen.classList.add('active');
    resultsScreen.classList.remove('active');
}

// Use 50:50 lifeline
function useFiftyFifty() {
    if (usedLifelines.fiftyFifty || !gameActive) return;

    playSound('click');
    usedLifelines.fiftyFifty = true;
    fiftyFiftyBtn.classList.add('used');

    const currentQuestion = questions[currentQuestionIndex];
    const correctIndex = currentQuestion.correct;

    // Get two random incorrect options to remove
    let indicesToRemove = [];
    while (indicesToRemove.length < 2) {
        const randomIndex = Math.floor(Math.random() * 4);
        if (randomIndex !== correctIndex && !indicesToRemove.includes(randomIndex)) {
            indicesToRemove.push(randomIndex);
        }
    }

    // Hide the selected incorrect options
    indicesToRemove.forEach(index => {
        optionButtons[index].style.display = 'none';
    });
}

// Use Ask the Audience lifeline
function useAskAudience() {
    if (usedLifelines.askAudience || !gameActive) return;

    playSound('click');
    usedLifelines.askAudience = true;
    askAudienceBtn.classList.add('used');

    const currentQuestion = questions[currentQuestionIndex];
    const correctIndex = currentQuestion.correct;

    // Generate audience percentages
    let percentages = generateAudiencePercentages(correctIndex);

    // Update audience results display
    for (let i = 0; i < 4; i++) {
        const barElement = document.getElementById(`audience-${i}`);
        const percentElement = document.getElementById(`audience-percent-${i}`);

        barElement.style.width = `${percentages[i]}%`;
        percentElement.textContent = `${percentages[i]}%`;
    }

    // Show audience results
    audienceResults.style.display = 'block';
}

// Generate audience percentages
function generateAudiencePercentages(correctIndex) {
    // Correct answer gets higher percentage
    let percentages = [0, 0, 0, 0];

    // Correct answer gets between 40% and 65%
    percentages[correctIndex] = Math.floor(Math.random() * 26) + 40;

    // Distribute remaining percentage among other options
    let remaining = 100 - percentages[correctIndex];

    for (let i = 0; i < 4; i++) {
        if (i !== correctIndex) {
            // Last option gets whatever is left
            if (i === 3 || (i === 2 && correctIndex === 3)) {
                percentages[i] = remaining;
            } else {
                // Random percentage for this option
                const max = remaining - (3 - i);
                const value = Math.floor(Math.random() * max);
                percentages[i] = value;
                remaining -= value;
            }
        }
    }

    return percentages;
}

// Use Phone a Friend lifeline
function usePhoneFriend() {
    if (usedLifelines.phoneFriend || !gameActive) return;

    playSound('click');
    usedLifelines.phoneFriend = true;
    phoneFriendBtn.classList.add('used');

    const currentQuestion = questions[currentQuestionIndex];
    const correctIndex = currentQuestion.correct;
    const correctLetter = ['A', 'B', 'C', 'D'][correctIndex];

    // Generate friend's response
    let response;
    const confidence = Math.random();

    if (confidence > 0.7) {
        // Friend is confident and correct
        response = `I'm pretty sure the answer is ${correctLetter}. I remember reading about this recently.`;
    } else if (confidence > 0.4) {
        // Friend is unsure but guesses correctly
        response = `I'm not 100% certain, but I think it might be ${correctLetter}. That sounds right to me.`;
    } else if (confidence > 0.2) {
        // Friend narrows it down
        const wrongIndex = (correctIndex + 1) % 4;
        const wrongLetter = ['A', 'B', 'C', 'D'][wrongIndex];
        response = `I'm torn between ${correctLetter} and ${wrongLetter}, but if I had to choose, I'd go with ${correctLetter}.`;
    } else {
        // Friend is unsure or gives wrong answer
        const wrongIndex = (correctIndex + Math.floor(Math.random() * 3) + 1) % 4;
        const wrongLetter = ['A', 'B', 'C', 'D'][wrongIndex];
        response = `I'm really not sure about this one. Maybe ${wrongLetter}? But don't quote me on that!`;
    }

    // Update and show friend response
    friendResponse.textContent = response;
    phoneFriendModal.style.display = 'block';
}

// Set language
function setLanguage(lang) {
    language = lang;

    // Update active language button
    langEnBtn.classList.toggle('active', lang === 'en');
    langMiBtn.classList.toggle('active', lang === 'mi');

    // Update button texts
    startGameBtn.textContent = translations[lang].startGame;
    playAgainBtn.textContent = translations[lang].playAgain;
    closeAudienceBtn.textContent = translations[lang].close;
    closePhoneBtn.textContent = translations[lang].close;
    withdrawBtn.textContent = translations[lang].withdraw;

    // Update current question if game is active
    if (gameActive) {
        questionNumber.textContent = `${translations[lang].questionPrefix} ${currentQuestionIndex + 1}`;

        // Update question and options text with the new language
        const currentQuestion = questions[currentQuestionIndex];
        questionText.textContent = currentQuestion.question[lang];

        optionButtons.forEach((button, index) => {
            if (button.style.display !== 'none') { // Only update visible options (for 50:50)
                button.textContent = currentQuestion.options[index][lang];
            }
        });
    }
}

// Handle withdraw (player decides to walk away with current winnings)
function handleWithdraw() {
    if (!gameActive || currentQuestionIndex === 0) return;

    playSound('click');
    gameActive = false;

    // Calculate current prize amount (prize for the last correctly answered question)
    const currentPrize = prizes[currentQuestionIndex - 1];

    console.log(`Player withdrew with $${currentPrize} at question ${currentQuestionIndex}`);

    // Update results screen
    resultHeading.textContent = translations[language].win;
    resultMessage.textContent = translations[language].withdrawMessage;
    finalPrize.textContent = `${translations[language].finalPrizePrefix}${currentPrize}`;

    // Show results screen
    gameScreen.classList.remove('active');
    resultsScreen.classList.add('active');
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', initGame);
