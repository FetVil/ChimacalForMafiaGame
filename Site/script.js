let no = 'Нет'; 

let currentPuzzleIndex = {
    easy: 0,
    medium: 0,
    hard: 0
};

function startLevel(level) {
    document.querySelectorAll('.puzzle-container, .admin-panel').forEach(el => el.style.display = 'none');
    const container = document.getElementById(`${level}-puzzle`);
    container.style.display = 'block';
    loadPuzzle(level);
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function loadPuzzle(level) {
    const index = currentPuzzleIndex[level];
    const puzzle = puzzles[level][index];
    const descEl = document.getElementById(`${level}-desc`);
    descEl.textContent = puzzle.desc;

    if (level === 'easy' || level === 'medium') {
        const cardsContainer = document.getElementById(`${level}-cards`);
        cardsContainer.innerHTML = '';
        let cardsToDisplay = [...puzzle.cards];
        if (level === 'medium') {
            cardsToDisplay = [...new Set(cardsToDisplay)]; // Удаляем дубли для medium
        }
        const shuffledCards = shuffle(cardsToDisplay);
        shuffledCards.forEach((cardText, i) => {
            const el = document.createElement('div');
            el.className = 'card';
            el.draggable = true;
            el.textContent = cardText;
            el.id = `${level}-card-${i}`;
            el.ondragstart = (ev) => drag(ev, level);
            cardsContainer.appendChild(el);
        });
        const dropZone = document.getElementById(`${level}-drop`);
        dropZone.innerHTML = '';
    } else if (level === 'hard') {
        document.getElementById(`${level}-input`).value = '';
    }

    document.getElementById(`${level}-feedback`).textContent = '';
}

function allowDrop(ev) {
    ev.preventDefault();
}

function drag(ev, level) {
    ev.dataTransfer.setData("text", ev.target.id);
    ev.dataTransfer.setData("level", level);
    ev.dataTransfer.setData("source", ev.target.parentNode.id);
}

function drop(ev) {
    ev.preventDefault();
    const id = ev.dataTransfer.getData("text");
    const level = ev.dataTransfer.getData("level");
    const source = ev.dataTransfer.getData("source");
    const card = document.getElementById(id);
    if (card) {
        if (level === 'medium' && source.includes('-cards')) {
            // Для medium: копируем карточку, не удаляем из cards-container
            const clone = card.cloneNode(true);
            clone.id = `${level}-clone-${Date.now()}`; // Уникальный ID для клона
            clone.ondragstart = (ev) => drag(ev, level);
            ev.target.appendChild(clone);
        } else {
            // Для easy и drop-zone: перемещаем
            ev.target.appendChild(card);
        }
    }
}

function checkAnswer(level) {
    const index = currentPuzzleIndex[level];
    const puzzle = puzzles[level][index];
    let userAnswer = '';

    if (level === 'easy' || level === 'medium') {
        const dropZone = document.getElementById(`${level}-drop`);
        userAnswer = Array.from(dropZone.children).map(child => child.textContent).join('');
    } else if (level === 'hard') {
        userAnswer = document.getElementById(`${level}-input`).value.trim();
    }

    const normalizedUser = userAnswer.replace(/\s/g, '');
    const normalizedCorrect = puzzle.correct.replace(/\s/g, '');

    const feedbackEl = document.getElementById(`${level}-feedback`);
    if (normalizedUser === normalizedCorrect) {
        feedbackEl.textContent = 'Правильно!';
        feedbackEl.className = 'feedback success';
        currentPuzzleIndex[level] = (index + 1) % puzzles[level].length;
        setTimeout(() => loadPuzzle(level), 2000);
    } else {
        feedbackEl.textContent = 'Неправильно. Попробуйте снова.';
        feedbackEl.className = 'feedback';
    }
}

function showAdminPanel() {
    if (no === 'Да') {
        document.querySelectorAll('.puzzle-container').forEach(el => el.style.display = 'none');
        const adminPanel = document.getElementById('admin-panel');
        adminPanel.style.display = 'block';
        loadAdminList();
    } else {
        alert('Админский доступ запрещен.');
    }
}

function loadAdminList() {
    const adminList = document.getElementById('admin-list');
    adminList.innerHTML = '';
    Object.keys(puzzles).forEach(level => {
        const h3 = document.createElement('h3');
        h3.textContent = `Уровень: ${level}`;
        adminList.appendChild(h3);
        puzzles[level].forEach((puzzle, index) => {
            const p = document.createElement('p');
            p.textContent = `${index + 1}. ${puzzle.desc} - ${puzzle.correct}`;
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Удалить';
            deleteBtn.className = 'admin-delete-btn';
            deleteBtn.onclick = () => deletePuzzle(level, index);
            p.appendChild(deleteBtn);
            adminList.appendChild(p);
        });
    });
}

function addPuzzle(event) {
    event.preventDefault();
    const level = document.getElementById('admin-level').value;
    const desc = document.getElementById('admin-desc').value.trim();
    const cardsInput = document.getElementById('admin-cards').value.trim();
    const correct = document.getElementById('admin-correct').value.trim();

    if (!desc || !correct) {
        document.getElementById('admin-feedback').textContent = 'Заполните все обязательные поля.';
        return;
    }

    const newPuzzle = { desc, correct };
    if (level !== 'hard') {
        newPuzzle.cards = cardsInput ? cardsInput.split(',').map(c => c.trim()) : [];
    }

    puzzles[level].push(newPuzzle);
    document.getElementById('admin-feedback').textContent = 'Головоломка добавлена!';
    document.getElementById('admin-desc').value = '';
    document.getElementById('admin-cards').value = '';
    document.getElementById('admin-correct').value = '';
    loadAdminList();
}

function deletePuzzle(level, index) {
    if (confirm('Вы уверены, что хотите удалить эту головоломку?')) {
        puzzles[level].splice(index, 1);
        loadAdminList();
        document.getElementById('admin-feedback').textContent = 'Головоломка удалена!';
    }
}

function exportData() {
    const dataStr = `const puzzles = ${JSON.stringify(puzzles, null, 4)};`;
    const blob = new Blob([dataStr], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data.js';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    document.getElementById('admin-feedback').textContent = 'Файл data.js экспортирован! Замените им оригинальный файл для сохранения изменений.';
}

// Показывать кнопку админ панели только если доступ разрешен
document.getElementById('admin-btn').style.display = no === 'Да' ? 'inline-block' : 'none';