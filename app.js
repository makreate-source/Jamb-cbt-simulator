// DOM Elements
const setupScreen = document.getElementById('setup-screen');
const examScreen = document.getElementById('exam-screen');
const resultsScreen = document.getElementById('results-screen');
const startBtn = document.getElementById('start-btn');
const loadingText = document.getElementById('loading-text');

// State Variables
let questions = [];
let userAnswers = {}; // Stores answers like { 0: 'a', 1: 'c' }
let currentQuestionIndex = 0;
let timeRemaining = 60 * 60; // 60 minutes in seconds
let timerInterval;

// Start Exam Event
startBtn.addEventListener('click', async () => {
    const subject = document.getElementById('subject-select').value;
    startBtn.classList.add('hidden');
    loadingText.classList.remove('hidden');

    // Fetch questions from our secure Vercel API
    await fetchQuestions(subject);

    if (questions.length > 0) {
        document.getElementById('current-subject').textContent = subject.toUpperCase();
        setupScreen.classList.remove('active');
        examScreen.classList.add('active');
        
        buildGrid();
        loadQuestion(0);
        startTimer();
    } else {
        alert("Failed to load questions. Please check your internet connection.");
        startBtn.classList.remove('hidden');
        loadingText.classList.add('hidden');
    }
});

// Fetch Questions (Calls your Vercel backend)
async function fetchQuestions(subject) {
    try {
        // ALOC API allows fetching up to 40 questions per request for free
        const response = await fetch(` api/api/get-questions?subject=${subject}`);
        const data = await response.json();
        
        if (data && data.data) {
            // ALOC returns data in a "data" array
            questions = Array.isArray(data.data) ? data.data : [data.data];
        }
    } catch (error) {
        console.error("API Error:", error);
    }
}

// Timer Logic
function startTimer() {
    const timerDisplay = document.getElementById('timer');
    
    timerInterval = setInterval(() => {
        timeRemaining--;
        let minutes = Math.floor(timeRemaining / 60);
        let seconds = timeRemaining % 60;
        
        if (minutes < 10) minutes = "0" + minutes;
        if (seconds < 10) seconds = "0" + seconds;
        
        timerDisplay.textContent = `Time Left: ${minutes}:${seconds}`;

        if (timeRemaining <= 0) {
            clearInterval(timerInterval);
            submitExam();
        }
    }, 1000);
}

// Load Question to Screen
function loadQuestion(index) {
    currentQuestionIndex = index;
    const q = questions[index];
    
    document.getElementById('question-number').textContent = `Question ${index + 1} of ${questions.length}`;
    document.getElementById('question-text').innerHTML = q.question; // .innerHTML in case of formatting
    
    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = ''; // Clear previous options

    // ALOC API options are usually stored in an "option" object: {a: "...", b: "...", c: "...", d: "..."}
    const optionsObj = q.option || {};
    
    for (const [key, value] of Object.entries(optionsObj)) {
        if (!value) continue; // Skip empty options
        
        const label = document.createElement('label');
        label.className = 'option-label';
        
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = 'answer';
        radio.value = key;
        
        // Restore user's previous selection if they already answered this
        if (userAnswers[index] === key) {
            radio.checked = true;
        }

        radio.addEventListener('change', (e) => {
            userAnswers[index] = e.target.value;
            updateGrid(); // Turn the grid box green!
        });

        label.appendChild(radio);
        label.appendChild(document.createTextNode(` ${key.toUpperCase()}. ${value}`));
        optionsContainer.appendChild(label);
    }

    // Handle Button States
    document.getElementById('prev-btn').disabled = index === 0;
    document.getElementById('next-btn').disabled = index === questions.length - 1;
    updateGrid(); // Update active state border
}

// Build Navigation Grid
function buildGrid() {
    const gridContainer = document.getElementById('grid-container');
    gridContainer.innerHTML = '';

    questions.forEach((_, index) => {
        const btn = document.createElement('button');
        btn.className = 'grid-btn';
        btn.textContent = index + 1;
        btn.id = `grid-btn-${index}`;
        
        btn.addEventListener('click', () => loadQuestion(index));
        gridContainer.appendChild(btn);
    });
}

// Update Grid Colors
function updateGrid() {
    questions.forEach((_, index) => {
        const btn = document.getElementById(`grid-btn-${index}`);
        if (!btn) return;

        // Reset classes
        btn.className = 'grid-btn'; 
        
        if (userAnswers[index]) btn.classList.add('answered');
        if (currentQuestionIndex === index) btn.classList.add('active');
    });
}

// Navigation Button Listeners
document.getElementById('prev-btn').addEventListener('click', () => {
    if (currentQuestionIndex > 0) loadQuestion(currentQuestionIndex - 1);
});

document.getElementById('next-btn').addEventListener('click', () => {
    if (currentQuestionIndex < questions.length - 1) loadQuestion(currentQuestionIndex + 1);
});

document.getElementById('submit-btn').addEventListener('click', () => {
    const confirmSubmit = confirm("Are you sure you want to submit your exam?");
    if (confirmSubmit) submitExam();
});

// Submit and Calculate Score
function submitExam() {
    clearInterval(timerInterval); // Stop the clock
    examScreen.classList.remove('active');
    resultsScreen.classList.add('active');

    let score = 0;
    const correctionsContainer = document.getElementById('corrections-container');
    correctionsContainer.innerHTML = '';

    questions.forEach((q, index) => {
        const userAnswer = userAnswers[index];
        const correctAnswer = q.answer; // ALOC uses "answer" property holding 'a', 'b', 'c', or 'd'
        
        const isCorrect = userAnswer === correctAnswer;
        if (isCorrect) score++;

        // Build Correction Item
        const div = document.createElement('div');
        div.className = `correction-item ${isCorrect ? 'correct' : ''}`;
        
        const userText = userAnswer ? userAnswer.toUpperCase() : "No Answer";
        
        div.innerHTML = `
            <p><strong>Q${index + 1}:</strong> ${q.question}</p>
            <p>Your Answer: <strong>${userText}</strong></p>
            <p>Correct Answer: <strong>${correctAnswer.toUpperCase()}</strong></p>
        `;
        correctionsContainer.appendChild(div);
    });

    document.getElementById('final-score').textContent = `Your Score: ${score} / ${questions.length}`;
}
