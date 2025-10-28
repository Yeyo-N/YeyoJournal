// Simple encryption function
function simpleEncrypt(text) {
    return btoa(text).split('').reverse().join('');
}

function simpleDecrypt(text) {
    return atob(text.split('').reverse().join(''));
}

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

// Check if user is logged in
function checkAuth() {
    return localStorage.getItem('currentUser');
}

// Redirect if not authenticated
function requireAuth() {
    if (!checkAuth()) {
        window.location.href = 'login.html';
    }
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
                
                if (user.role === 'admin') {
                    window.location.href = 'admin.html';
                } else {
                    window.location.href = 'journal.html';
                }
            } else {
                document.getElementById('error-message').textContent = 'Invalid username or password';
            }
        });
    }
    
    // Add logout functionality to all pages
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            localStorage.removeItem('currentUser');
            window.location.href = 'index.html';
        });
    }
});