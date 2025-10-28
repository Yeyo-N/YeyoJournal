// Global variables with lazy loading
let currentWeekStart = null;
let currentTaskId = null;
let currentDate = null;
let chartDataCache = null;

// Accurate Jalali (Persian) calendar conversion
function gregorianToJalali(gy, gm, gd) {
    const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
    let jy = (gy <= 1600) ? 0 : 979;
    gy -= (gy <= 1600) ? 621 : 1600;
    let gy2 = (gm > 2) ? (gy + 1) : gy;
    let days = (365 * gy) + (parseInt((gy2 + 3) / 4)) - (parseInt((gy2 + 99) / 100)) 
        + (parseInt((gy2 + 399) / 400)) - 80 + gd + g_d_m[gm - 1];
    jy += 33 * (parseInt(days / 12053)); 
    days %= 12053;
    jy += 4 * (parseInt(days / 1461));
    days %= 1461;
    jy += parseInt((days - 1) / 365);
    if (days > 365) days = (days - 1) % 365;
    let jm = (days < 186) ? 1 + parseInt(days / 31) : 7 + parseInt((days - 186) / 30);
    let jd = 1 + ((days < 186) ? (days % 31) : ((days - 186) % 30));
    
    return {
        year: jy,
        month: jm,
        day: jd,
        toString: function() {
            return `${this.year}/${this.month.toString().padStart(2, '0')}/${this.day.toString().padStart(2, '0')}`;
        }
    };
}

function toShamsi(date) {
    return gregorianToJalali(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

// Optimized date functions
function getWeekStartDate(date = new Date()) {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Monday as first day
    const weekStart = new Date(date);
    weekStart.setDate(diff);
    weekStart.setHours(0, 0, 0, 0);
    return weekStart;
}

function formatDate(date) {
    return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
    });
}

function getWeekDates(startDate) {
    return Array.from({ length: 7 }, (_, i) => {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        return date;
    });
}

function getMonthDates(year, month) {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);
    const dates = [];
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        dates.push(new Date(d));
    }
    
    return dates;
}

// Lazy initialization
function initializeApp() {
    if (!requireAuth()) return;
    
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    document.getElementById('userWelcome').textContent = currentUser.username;
    
    // Initialize with current week
    currentWeekStart = getWeekStartDate();
    
    setupEventListeners();
    updateWeekDisplay();
    loadTasks();
    
    // Load charts after a short delay for better performance
    setTimeout(() => {
        updateCharts();
        updateStats();
    }, 100);
}

function setupEventListeners() {
    const taskForm = document.getElementById('taskForm');
    if (taskForm) {
        taskForm.addEventListener('submit', function(e) {
            e.preventDefault();
            addTaskFromForm();
        });
    }
    
    // Close modal when clicking outside
    document.addEventListener('click', function(event) {
        const modal = document.getElementById('hourModal');
        if (event.target === modal) {
            closeModal();
        }
    });
}

function addTaskFromForm() {
    const name = document.getElementById('taskName').value.trim();
    const description = document.getElementById('taskDescription').value.trim();
    const category = document.getElementById('taskCategory').value;
    
    if (!name) return;
    
    addTask({
        id: Date.now(),
        name,
        description,
        category,
        createdAt: new Date().toISOString()
    });
    
    document.getElementById('taskForm').reset();
}

document.addEventListener('DOMContentLoaded', initializeApp);

function updateWeekDisplay() {
    if (!currentWeekStart) return;
    
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
    loadTasks();
}

function updateWeekHeaders() {
    const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const weekDates = getWeekDates(currentWeekStart);
    const today = new Date().toDateString();
    
    const headersHTML = weekDates.map((date, index) => {
        const shamsiDate = toShamsi(date);
        const isToday = date.toDateString() === today;
        const dayClass = `day-header ${weekDays[index].toLowerCase()} ${isToday ? 'today' : ''}`;
        
        return `
            <div class="${dayClass}">
                <div>${weekDays[index].substring(0, 3)}</div>
                <div>${date.getDate()}</div>
                <div style="font-size: 0.75em; color: var(--primary);">${shamsiDate.day}</div>
            </div>
        `;
    }).join('');
    
    document.getElementById('weekDaysHeader').innerHTML = headersHTML;
}

function addTask(task) {
    const tasks = getUserData('tasks');
    tasks.push(task);
    setUserData('tasks', tasks);
    
    loadTasks();
    updateStats();
    chartDataCache = null; // Invalidate chart cache
}

function loadTasks() {
    const tasks = getUserData('tasks');
    const taskLogs = getUserData('taskLogs');
    const weekDates = getWeekDates(currentWeekStart);
    
    if (tasks.length === 0) {
        document.getElementById('taskGrid').innerHTML = `
            <div class="task-row-header" style="grid-column: 1 / -1; text-align: center; color: var(--text-secondary); padding: 40px;">
                No tasks yet. Add your first task above!
            </div>
        `;
        return;
    }
    
    let gridHTML = '<div class="task-row-header">Tasks</div>';
    
    // Add day headers
    weekDates.forEach(date => {
        gridHTML += `<div class="day-header">${date.getDate()}</div>`;
    });
    
    // Add task rows
    tasks.forEach(task => {
        gridHTML += `
            <div class="task-row-header">
                <span title="${task.description || 'No description'}">${task.name}</span>
                <button onclick="deleteTask(${task.id})" class="delete" style="padding: 4px 8px; font-size: 0.8em;">×</button>
            </div>
        `;
        
        weekDates.forEach(date => {
            const dateStr = date.toISOString().split('T')[0];
            const log = taskLogs.find(log => log.taskId === task.id && log.date === dateStr);
            const hours = log ? log.hours : 0;
            const heatmapClass = hours > 0 ? `heatmap-${Math.min(Math.ceil(hours / 2), 5)} filled` : '';
            
            gridHTML += `
                <div class="task-hours-cell ${heatmapClass}" 
                     onclick="openHourModal(${task.id}, '${dateStr}', '${task.name}')"
                     title="${task.name} - ${date.toDateString()}: ${hours} hours">
                    ${hours > 0 ? hours + 'h' : '+'}
                </div>
            `;
        });
    });
    
    document.getElementById('taskGrid').innerHTML = gridHTML;
}

function openHourModal(taskId, date, taskName) {
    currentTaskId = taskId;
    currentDate = date;
    
    const taskLogs = getUserData('taskLogs');
    const existingLog = taskLogs.find(log => log.taskId === taskId && log.date === date);
    
    document.getElementById('modalTaskName').textContent = taskName;
    document.getElementById('hoursInput').value = existingLog ? existingLog.hours : 0;
    document.getElementById('hourModal').style.display = 'flex';
    document.getElementById('hoursInput').focus();
}

function closeModal() {
    document.getElementById('hourModal').style.display = 'none';
    currentTaskId = null;
    currentDate = null;
}

function saveHours() {
    const hours = parseFloat(document.getElementById('hoursInput').value);
    
    if (isNaN(hours) || hours < 0) return;
    
    const taskLogs = getUserData('taskLogs');
    const updatedLogs = taskLogs.filter(log => 
        !(log.taskId === currentTaskId && log.date === currentDate)
    );
    
    if (hours > 0) {
        updatedLogs.push({
            id: Date.now(),
            taskId: currentTaskId,
            date: currentDate,
            hours: hours,
            loggedAt: new Date().toISOString()
        });
    }
    
    setUserData('taskLogs', updatedLogs);
    closeModal();
    loadTasks();
    chartDataCache = null; // Invalidate cache
    updateCharts();
    updateStats();
}

function deleteTask(taskId) {
    if (!confirm('Delete this task and all its logged hours?')) return;
    
    const tasks = getUserData('tasks');
    const taskLogs = getUserData('taskLogs');
    
    const updatedTasks = tasks.filter(task => task.id !== taskId);
    const updatedLogs = taskLogs.filter(log => log.taskId !== taskId);
    
    setUserData('tasks', updatedTasks);
    setUserData('taskLogs', updatedLogs);
    
    loadTasks();
    chartDataCache = null;
    updateCharts();
    updateStats();
}

function changeWeek(weeks) {
    currentWeekStart.setDate(currentWeekStart.getDate() + (weeks * 7));
    updateWeekDisplay();
}

function goToToday() {
    currentWeekStart = getWeekStartDate();
    updateWeekDisplay();
}

function updateStats() {
    const tasks = getUserData('tasks');
    const taskLogs = getUserData('taskLogs');
    
    const today = new Date().toISOString().split('T')[0];
    const weekDates = getWeekDates(currentWeekStart).map(d => d.toISOString().split('T')[0]);
    
    const totalTasks = tasks.length;
    const todayHours = taskLogs
        .filter(log => log.date === today)
        .reduce((sum, log) => sum + log.hours, 0);
    
    const weekHours = taskLogs
        .filter(log => weekDates.includes(log.date))
        .reduce((sum, log) => sum + log.hours, 0);
    
    const productivityScore = Math.min(Math.round((weekHours / 40) * 100), 100);
    
    document.getElementById('totalTasks').textContent = totalTasks;
    document.getElementById('todayHours').textContent = todayHours.toFixed(1);
    document.getElementById('weekHours').textContent = weekHours.toFixed(1);
    document.getElementById('productivityScore').textContent = productivityScore + '%';
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeModal();
    }
    if (e.ctrlKey || e.metaKey) {
        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            changeWeek(-1);
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            changeWeek(1);
        } else if (e.key === 't') {
            e.preventDefault();
            goToToday();
        }
    }
});