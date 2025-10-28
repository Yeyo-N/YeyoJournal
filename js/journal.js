document.addEventListener('DOMContentLoaded', function() {
    requireAuth();
    
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    document.getElementById('userWelcome').textContent = currentUser.username;
    
    initializeJournal();
    loadEntries();
    updateChart();
    updateStats();
    
    // Initialize mood selector
    setupMoodSelector();
});

function setupMoodSelector() {
    const moodOptions = document.querySelectorAll('.mood-option');
    moodOptions.forEach(option => {
        option.addEventListener('click', function() {
            moodOptions.forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');
        });
    });
}

function initializeJournal() {
    const entryForm = document.getElementById('entryForm');
    
    entryForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const title = document.getElementById('entryTitle').value;
        const content = document.getElementById('entryContent').value;
        const mood = document.querySelector('.mood-option.selected')?.dataset.mood || 'neutral';
        const priority = document.getElementById('entryPriority').value;
        const category = document.getElementById('entryCategory').value;
        
        addEntry({
            id: Date.now(),
            title,
            content,
            mood,
            priority,
            category,
            completed: false,
            createdAt: new Date().toISOString(),
            date: new Date().toLocaleDateString()
        });
        
        entryForm.reset();
        // Reset mood selection
        document.querySelectorAll('.mood-option').forEach(opt => opt.classList.remove('selected'));
        document.querySelector('.mood-option[data-mood="neutral"]').classList.add('selected');
    });
}

function addEntry(entry) {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    const entries = JSON.parse(localStorage.getItem(`entries_${user.username}`) || '[]');
    
    entries.push(entry);
    localStorage.setItem(`entries_${user.username}`, JSON.stringify(entries));
    
    loadEntries();
    updateChart();
    updateStats();
}

function loadEntries() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    const entries = JSON.parse(localStorage.getItem(`entries_${user.username}`) || '[]');
    const entryList = document.getElementById('entryList');
    
    entryList.innerHTML = '';
    
    // Sort entries by date (newest first)
    entries.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    entries.forEach(entry => {
        const entryElement = document.createElement('div');
        entryElement.className = `entry-item ${entry.completed ? 'completed' : ''}`;
        entryElement.innerHTML = `
            <h3>${entry.title}</h3>
            <p>${entry.content}</p>
            <div class="entry-meta">
                <span>Mood: ${getMoodEmoji(entry.mood)}</span>
                <span>Priority: ${entry.priority}</span>
                <span>Category: ${entry.category}</span>
                <span>Date: ${entry.date}</span>
            </div>
            <div class="entry-actions">
                <button onclick="toggleEntry(${entry.id})">${entry.completed ? 'Mark Incomplete' : 'Mark Complete'}</button>
                <button onclick="deleteEntry(${entry.id})" class="delete">Delete</button>
            </div>
        `;
        entryList.appendChild(entryElement);
    });
}

function getMoodEmoji(mood) {
    const emojis = {
        'happy': '😊',
        'sad': '😔',
        'excited': '😄',
        'tired': '😴',
        'neutral': '😐',
        'productive': '💪'
    };
    return emojis[mood] || '😐';
}

function toggleEntry(entryId) {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    const entries = JSON.parse(localStorage.getItem(`entries_${user.username}`) || '[]');
    
    const entryIndex = entries.findIndex(entry => entry.id === entryId);
    if (entryIndex !== -1) {
        entries[entryIndex].completed = !entries[entryIndex].completed;
        localStorage.setItem(`entries_${user.username}`, JSON.stringify(entries));
        loadEntries();
        updateChart();
        updateStats();
    }
}

function deleteEntry(entryId) {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    let entries = JSON.parse(localStorage.getItem(`entries_${user.username}`) || '[]');
    
    entries = entries.filter(entry => entry.id !== entryId);
    localStorage.setItem(`entries_${user.username}`, JSON.stringify(entries));
    loadEntries();
    updateChart();
    updateStats();
}

function updateStats() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    const entries = JSON.parse(localStorage.getItem(`entries_${user.username}`) || '[]');
    
    const totalEntries = entries.length;
    const completedEntries = entries.filter(entry => entry.completed).length;
    const todayEntries = entries.filter(entry => 
        new Date(entry.createdAt).toDateString() === new Date().toDateString()
    ).length;
    
    document.getElementById('totalEntries').textContent = totalEntries;
    document.getElementById('completedEntries').textContent = completedEntries;
    document.getElementById('todayEntries').textContent = todayEntries;
    document.getElementById('completionRate').textContent = 
        totalEntries > 0 ? Math.round((completedEntries / totalEntries) * 100) + '%' : '0%';
}