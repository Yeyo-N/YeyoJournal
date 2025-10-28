// Simple encryption function
function simpleEncrypt(text) {
    return btoa(encodeURIComponent(text)).split('').reverse().join('');
}

function simpleDecrypt(text) {
    return decodeURIComponent(atob(text.split('').reverse().join('')));
}

// Cache for user data
const userCache = new Map();

// Initialize users in localStorage if not exists
function initializeUsers() {
    if (!localStorage.getItem('users')) {
        const defaultUsers = [
            { 
                username: 'Admin', 
                password: simpleEncrypt('@dm!n1376yeYo'),
                role: 'admin'
            },
            { 
                username: 'Yeyo', 
                password: simpleEncrypt('1376Yahya'),
                role: 'user'
            }
        ];
        localStorage.setItem('users', JSON.stringify(defaultUsers));
    }
}

// Initialize task data for user
function initializeTaskData(username) {
    if (!localStorage.getItem(`tasks_${username}`)) {
        localStorage.setItem(`tasks_${username}`, JSON.stringify([]));
    }
    if (!localStorage.getItem(`taskLogs_${username}`)) {
        localStorage.setItem(`taskLogs_${username}`, JSON.stringify([]));
    }
}

// Check if user is logged in
function checkAuth() {
    return localStorage.getItem('currentUser');
}

// Redirect if not authenticated
function requireAuth() {
    if (!checkAuth()) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// Optimized user data getter
function getUserData(key) {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    const cacheKey = `${user.username}_${key}`;
    
    if (userCache.has(cacheKey)) {
        return userCache.get(cacheKey);
    }
    
    const data = JSON.parse(localStorage.getItem(`${key}_${user.username}`) || '[]');
    userCache.set(cacheKey, data);
    return data;
}

// Optimized user data setter
function setUserData(key, data) {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    const cacheKey = `${user.username}_${key}`;
    
    localStorage.setItem(`${key}_${user.username}`, JSON.stringify(data));
    userCache.set(cacheKey, data);
}

// Login function
document.addEventListener('DOMContentLoaded', function() {
    initializeUsers();
    
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
            const users = JSON.parse(localStorage.getItem('users'));
            const user = users.find(u => u.username === username);
            
            if (user && simpleDecrypt(user.password) === password) {
                localStorage.setItem('currentUser', JSON.stringify(user));
                initializeTaskData(user.username);
                userCache.clear(); // Clear cache on login
                
                if (user.role === 'admin') {
                    window.location.href = 'admin.html';
                } else {
                    window.location.href = 'journal.html';
                }
            } else {
                const errorEl = document.getElementById('error-message');
                if (errorEl) {
                    errorEl.textContent = 'Invalid username or password';
                }
            }
        });
    }
    
    // Add logout functionality to all pages
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            localStorage.removeItem('currentUser');
            userCache.clear();
            window.location.href = 'index.html';
        });
    }
});