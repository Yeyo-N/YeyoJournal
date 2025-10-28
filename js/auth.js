// Add this to the initializeUsers function or create a new initialization for task data
function initializeTaskData() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (user && !localStorage.getItem(`tasks_${user.username}`)) {
        localStorage.setItem(`tasks_${user.username}`, JSON.stringify([]));
        localStorage.setItem(`taskLogs_${user.username}`, JSON.stringify([]));
    }
}

// Call this after requireAuth() in journal.js