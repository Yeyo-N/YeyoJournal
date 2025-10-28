// Global variables
let currentWeekStart = new Date();
let currentTaskId = null;
let currentDate = null;

// Shamsi (Jalali) date conversion functions
function toShamsi(date) {
    // Simple conversion - for accurate conversion, you might want to use a library
    const gregorianYear = date.getFullYear();
    const gregorianMonth = date.getMonth() + 1;
    const gregorianDay = date.getDate();
    
    // Approximate conversion (this is simplified)
    let shamsiYear = gregorianYear - 621;
    let shamsiMonth = gregorianMonth - 3;
    let shamsiDay = gregorianDay - 21;
    
    if (shamsiMonth <= 0) {
        shamsiYear--;
        shamsiMonth += 12;
    }
    
    if (shamsiDay <= 0) {
        shamsiMonth--;
        shamsiDay += 30;
        if (shamsiMonth <= 0) {
            shamsiYear--;
            shamsiMonth += 12;
        }
    }
    
    return {
        year: shamsiYear,
        month: shamsiMonth,
        day: shamsiDay,
        toString: function() {
            return `${this.year}/${this.month.toString().padStart(2, '0')}/${this.day.toString().padStart(2, '0')}`;
        }
    };
}

function getWeekStartDate(date) {
    // Week starts on Saturday (0=Sunday, 6=Saturday in JavaScript)
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 6 ? 0 : -6);
    if (day === 6) diff = date.getDate(); // If it's Saturday, start from today
    return new Date(date.setDate(diff));
}

function formatDate(date) {
    return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

function getWeekDates(startDate) {
    const dates = [];
    for (let i = 0; i < 7; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        dates.push(date);
    }
    return dates;
}

document.addEventListener('DOMContentLoaded', function() {
    requireAuth();
    
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    document.getElementById('userWelcome').textContent = currentUser.username;
    
    initializeTracker();
    loadTasks();
    updateCharts();
    updateStats();
});

function initializeTracker() {
    // Set current week to start from last Saturday
    const today = new Date();
    currentWeekStart = getWeekStartDate(today);
    
    // Initialize task form
    const taskForm = document.getElementById('taskForm');
    taskForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const name = document.getElementById('taskName').value;
        const description = document.getElementById('taskDescription').value;
        const category = document.getElementById('taskCategory').value;
        
        addTask({
            id: Date.now(),
            name,
            description,
            category,
            createdAt: new Date().toISOString()
        });
        
        taskForm.reset();
    });
    
    updateWeekDisplay();
}

function updateWeekDisplay() {
    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(currentWeekStart.getDate() + 6);
    
    // Update Western date display
    document.getElementById('currentWeekRange').textContent = 
        `${formatDate(currentWeekStart)} - ${formatDate(weekEnd)}`;
    
    // Update Shamsi date display
    const shamsiStart = toShamsi(currentWeekStart);
    const shamsiEnd = toShamsi(weekEnd);
    document.getElementById('shamsiWeekRange').textContent = 
        `${shamsiStart.toString()} - ${shamsiEnd.toString()}`;
    
    updateWeekHeaders();
    loadTasks(); // Reload tasks to update the grid
}

function updateWeekHeaders() {
    const weekDays = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const weekDates = getWeekDates(currentWeekStart);
    const today = new Date().toDateString();
    
    let headersHTML = '';
    weekDates.forEach((date, index) => {
        const shamsiDate = toShamsi(date);
        const isToday = date.toDateString() === today;
        const dayClass = `day-header ${weekDays[index].toLowerCase()} ${isToday ? 'today' : ''}`;
        
        headersHTML += `
            <div class="${dayClass}">
                <div>${weekDays[index]}</div>
                <div>${date.getDate()}/${date.getMonth() + 1}</div>
                <div style="font-size: 0.8em; color: #64ffda;">${shamsiDate.toString()}</div>
            </div>
        `;
    });
    
    document.getElementById('weekDaysHeader').innerHTML = headersHTML;
}

function addTask(task) {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    const tasks = JSON.parse(localStorage.getItem(`tasks_${user.username}`) || '[]');
    
    tasks.push(task);
    localStorage.setItem(`tasks_${user.username}`, JSON.stringify(tasks));
    
    loadTasks();
    updateStats();
}

function loadTasks() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    const tasks = JSON.parse(localStorage.getItem(`tasks_${user.username}`) || '[]');
    const taskLogs = JSON.parse(localStorage.getItem(`taskLogs_${user.username}`) || '[]');
    const weekDates = getWeekDates(currentWeekStart);
    
    let gridHTML = '';
    
    // Header row
    gridHTML += `<div class="task-row-header">Tasks</div>`;
    weekDates.forEach(date => {
        gridHTML += `<div class="day-header">${date.getDate()}/${date.getMonth() + 1}</div>`;
    });
    
    // Task rows
    tasks.forEach(task => {
        gridHTML += `<div class="task-row-header">
            <span>${task.name}</span>
            <button onclick="deleteTask(${task.id})" class="delete" style="padding: 2px 8px; font-size: 0.8em;">×</button>
        </div>`;
        
        weekDates.forEach(date => {
            const dateStr = date.toISOString().split('T')[0];
            const log = taskLogs.find(log => 
                log.taskId === task.id && log.date === dateStr
            );
            const hours = log ? log.hours : 0;
            const heatmapClass = hours > 0 ? `heatmap-${Math.min(Math.ceil(hours / 2), 5)}` : '';
            
            gridHTML += `
                <div class="task-hours-cell ${heatmapClass}" 
                     onclick="openHourModal(${task.id}, '${dateStr}', '${task.name}')">
                    ${hours > 0 ? hours + 'h' : '+'}
                </div>
            `;
        });
    });
    
    document.getElementById('taskGrid').innerHTML = gridHTML;
    updateStats();
}

function openHourModal(taskId, date, taskName) {
    currentTaskId = taskId;
    currentDate = date;
    
    const user = JSON.parse(localStorage.getItem('currentUser'));
    const taskLogs = JSON.parse(localStorage.getItem(`taskLogs_${user.username}`) || '[]');
    const existingLog = taskLogs.find(log => log.taskId === taskId && log.date === date);
    
    document.getElementById('modalTaskName').textContent = taskName;
    document.getElementById('hoursInput').value = existingLog ? existingLog.hours : 0;
    document.getElementById('hourModal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('hourModal').style.display = 'none';
    currentTaskId = null;
    currentDate = null;
}

function saveHours() {
    const hours = parseFloat(document.getElementById('hoursInput').value);
    
    if (hours >= 0) {
        const user = JSON.parse(localStorage.getItem('currentUser'));
        let taskLogs = JSON.parse(localStorage.getItem(`taskLogs_${user.username}`) || '[]');
        
        // Remove existing log for this task and date
        taskLogs = taskLogs.filter(log => 
            !(log.taskId === currentTaskId && log.date === currentDate)
        );
        
        // Add new log if hours > 0
        if (hours > 0) {
            taskLogs.push({
                id: Date.now(),
                taskId: currentTaskId,
                date: currentDate,
                hours: hours
            });
        }
        
        localStorage.setItem(`taskLogs_${user.username}`, JSON.stringify(taskLogs));
        closeModal();
        loadTasks();
        updateCharts();
        updateStats();
    }
}

function deleteTask(taskId) {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    let tasks = JSON.parse(localStorage.getItem(`tasks_${user.username}`) || '[]');
    let taskLogs = JSON.parse(localStorage.getItem(`taskLogs_${user.username}`) || '[]');
    
    tasks = tasks.filter(task => task.id !== taskId);
    taskLogs = taskLogs.filter(log => log.taskId !== taskId);
    
    localStorage.setItem(`tasks_${user.username}`, JSON.stringify(tasks));
    localStorage.setItem(`taskLogs_${user.username}`, JSON.stringify(taskLogs));
    
    loadTasks();
    updateCharts();
    updateStats();
}

function changeWeek(weeks) {
    currentWeekStart.setDate(currentWeekStart.getDate() + (weeks * 7));
    updateWeekDisplay();
}

function goToToday() {
    currentWeekStart = getWeekStartDate(new Date());
    updateWeekDisplay();
}

function updateStats() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    const tasks = JSON.parse(localStorage.getItem(`tasks_${user.username}`) || '[]');
    const taskLogs = JSON.parse(localStorage.getItem(`taskLogs_${user.username}`) || '[]');
    
    const today = new Date().toISOString().split('T')[0];
    const weekDates = getWeekDates(currentWeekStart).map(d => d.toISOString().split('T')[0]);
    
    const totalTasks = tasks.length;
    const todayHours = taskLogs
        .filter(log => log.date === today)
        .reduce((sum, log) => sum + log.hours, 0);
    
    const weekHours = taskLogs
        .filter(log => weekDates.includes(log.date))
        .reduce((sum, log) => sum + log.hours, 0);
    
    // Simple productivity score (could be more sophisticated)
    const productivityScore = Math.min(Math.round((weekHours / 40) * 100), 100);
    
    document.getElementById('totalTasks').textContent = totalTasks;
    document.getElementById('todayHours').textContent = todayHours.toFixed(1);
    document.getElementById('weekHours').textContent = weekHours.toFixed(1);
    document.getElementById('productivityScore').textContent = productivityScore + '%';
}