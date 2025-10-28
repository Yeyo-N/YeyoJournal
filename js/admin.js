document.addEventListener('DOMContentLoaded', function() {
    requireAuth();
    
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser.role !== 'admin') {
        window.location.href = 'journal.html';
        return;
    }
    
    loadUsers();
    
    document.getElementById('userForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const username = document.getElementById('newUsername').value;
        const password = document.getElementById('newPassword').value;
        const role = document.getElementById('newUserRole').value;
        
        addUser(username, password, role);
        this.reset();
    });
});

function loadUsers() {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const userList = document.getElementById('userList');
    
    userList.innerHTML = '';
    
    users.forEach(user => {
        const userElement = document.createElement('div');
        userElement.className = 'user-item';
        userElement.innerHTML = `
            <div>
                <strong>${user.username}</strong> (${user.role})
            </div>
            ${user.role !== 'admin' ? `<button onclick="deleteUser('${user.username}')" class="delete">Delete</button>` : '<span>Admin</span>'}
        `;
        userList.appendChild(userElement);
    });
}

function addUser(username, password, role) {
    const users = JSON.parse(localStorage.getItem('users'));
    
    if (users.find(u => u.username === username)) {
        alert('Username already exists!');
        return;
    }
    
    users.push({
        username,
        password: simpleEncrypt(password),
        role
    });
    
    localStorage.setItem('users', JSON.stringify(users));
    loadUsers();
}

function deleteUser(username) {
    const users = JSON.parse(localStorage.getItem('users'));
    const filteredUsers = users.filter(user => user.username !== username);
    
    localStorage.setItem('users', JSON.stringify(filteredUsers));
    loadUsers();
}