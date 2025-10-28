let taskHistoryChart = null;
let productivityChart = null;

function updateCharts() {
    updateTaskHistoryChart();
    updateProductivityChart();
}

function updateTaskHistoryChart() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    const tasks = JSON.parse(localStorage.getItem(`tasks_${user.username}`) || '[]');
    const taskLogs = JSON.parse(localStorage.getItem(`taskLogs_${user.username}`) || '[]');
    
    // Get last 30 days
    const dates = [];
    for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dates.push(date.toISOString().split('T')[0]);
    }
    
    // Prepare dataset for each task
    const datasets = tasks.map(task => {
        const hoursByDate = {};
        taskLogs
            .filter(log => log.taskId === task.id && dates.includes(log.date))
            .forEach(log => {
                hoursByDate[log.date] = log.hours;
            });
        
        const data = dates.map(date => hoursByDate[date] || 0);
        
        return {
            label: task.name,
            data: data,
            borderColor: getRandomColor(),
            backgroundColor: 'rgba(100, 255, 218, 0.1)',
            tension: 0.4,
            fill: true
        };
    });
    
    const ctx = document.getElementById('taskHistoryChart').getContext('2d');
    
    if (taskHistoryChart) {
        taskHistoryChart.destroy();
    }
    
    taskHistoryChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates.map(date => {
                const d = new Date(date);
                return `${d.getDate()}/${d.getMonth() + 1}`;
            }),
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: '#e0e0e0'
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#b0b0b0'
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#b0b0b0'
                    },
                    title: {
                        display: true,
                        text: 'Hours',
                        color: '#b0b0b0'
                    }
                }
            }
        }
    });
}

function updateProductivityChart() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    const taskLogs = JSON.parse(localStorage.getItem(`taskLogs_${user.username}`) || '[]');
    
    // Get last 30 days
    const dates = [];
    const dailyHours = [];
    
    for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        dates.push(dateStr);
        
        const hours = taskLogs
            .filter(log => log.date === dateStr)
            .reduce((sum, log) => sum + log.hours, 0);
        
        dailyHours.push(hours);
    }
    
    const ctx = document.getElementById('productivityChart').getContext('2d');
    
    if (productivityChart) {
        productivityChart.destroy();
    }
    
    productivityChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: dates.map(date => {
                const d = new Date(date);
                return `${d.getDate()}/${d.getMonth() + 1}`;
            }),
            datasets: [{
                label: 'Daily Hours',
                data: dailyHours,
                backgroundColor: dailyHours.map(hours => 
                    hours >= 8 ? 'rgba(76, 175, 80, 0.8)' :
                    hours >= 6 ? 'rgba(139, 195, 74, 0.8)' :
                    hours >= 4 ? 'rgba(255, 193, 7, 0.8)' :
                    hours >= 2 ? 'rgba(255, 152, 0, 0.8)' :
                    'rgba(244, 67, 54, 0.8)'
                ),
                borderColor: '#64ffda',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#b0b0b0',
                        maxTicksLimit: 10
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#b0b0b0'
                    },
                    title: {
                        display: true,
                        text: 'Hours',
                        color: '#b0b0b0'
                    }
                }
            }
        }
    });
}

function getRandomColor() {
    const colors = [
        '#64ffda', '#00bcd4', '#2196f3', '#3f51b5', 
        '#673ab7', '#9c27b0', '#e91e63', '#f44336',
        '#ff9800', '#ffeb3b', '#8bc34a', '#4caf50'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}