let taskHistoryChart = null;
let productivityChart = null;
let monthlyTrendChart = null;

function updateCharts() {
    updateMonthlyTrendChart();
    updateProductivityTrendChart();
}

function getMonthlyData() {
    if (chartDataCache) return chartDataCache;
    
    const taskLogs = getUserData('taskLogs');
    const tasks = getUserData('tasks');
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Get all dates for current month
    const monthDates = getMonthDates(currentYear, currentMonth);
    const dateLabels = monthDates.map(d => d.getDate());
    
    // Prepare task data
    const taskData = tasks.map(task => {
        const hoursByDate = {};
        taskLogs
            .filter(log => {
                const logDate = new Date(log.date);
                return logDate.getMonth() === currentMonth && 
                       logDate.getFullYear() === currentYear &&
                       log.taskId === task.id;
            })
            .forEach(log => {
                const day = new Date(log.date).getDate();
                hoursByDate[day] = (hoursByDate[day] || 0) + log.hours;
            });
        
        return {
            label: task.name,
            data: dateLabels.map(day => hoursByDate[day] || 0),
            borderColor: getTaskColor(task.id),
            backgroundColor: 'transparent',
            tension: 0.4,
            borderWidth: 2,
            pointBackgroundColor: getTaskColor(task.id),
            pointBorderColor: '#0a0a0a',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6
        };
    });
    
    // Prepare productivity data (total hours per day)
    const dailyProductivity = dateLabels.map(day => {
        const dateStr = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        return taskLogs
            .filter(log => log.date === dateStr)
            .reduce((sum, log) => sum + log.hours, 0);
    });
    
    chartDataCache = {
        dateLabels,
        taskData,
        dailyProductivity,
        monthName: now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    };
    
    return chartDataCache;
}

function updateMonthlyTrendChart() {
    const { dateLabels, taskData, monthName } = getMonthlyData();
    const ctx = document.getElementById('taskHistoryChart').getContext('2d');
    
    if (taskHistoryChart) {
        taskHistoryChart.destroy();
    }
    
    taskHistoryChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dateLabels,
            datasets: taskData
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: '#e0e0e0',
                        font: {
                            size: 11
                        },
                        usePointStyle: true
                    }
                },
                title: {
                    display: true,
                    text: `Task Hours - ${monthName}`,
                    color: '#00ff88',
                    font: {
                        size: 14,
                        weight: '300'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(26, 26, 26, 0.9)',
                    titleColor: '#00ff88',
                    bodyColor: '#e0e0e0',
                    borderColor: '#00ff88',
                    borderWidth: 1,
                    cornerRadius: 8,
                    displayColors: true,
                    usePointStyle: true
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#888',
                        maxTicksLimit: 15
                    },
                    title: {
                        display: true,
                        text: 'Day of Month',
                        color: '#888'
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#888'
                    },
                    title: {
                        display: true,
                        text: 'Hours',
                        color: '#888'
                    },
                    beginAtZero: true
                }
            },
            elements: {
                line: {
                    tension: 0.4
                }
            }
        }
    });
}

function updateProductivityTrendChart() {
    const { dateLabels, dailyProductivity, monthName } = getMonthlyData();
    const ctx = document.getElementById('productivityChart').getContext('2d');
    
    // Calculate 7-day moving average
    const movingAverage = [];
    for (let i = 0; i < dailyProductivity.length; i++) {
        const start = Math.max(0, i - 3);
        const end = i + 1;
        const slice = dailyProductivity.slice(start, end);
        const average = slice.reduce((a, b) => a + b, 0) / slice.length;
        movingAverage.push(average);
    }
    
    if (productivityChart) {
        productivityChart.destroy();
    }
    
    productivityChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dateLabels,
            datasets: [
                {
                    label: 'Daily Hours',
                    data: dailyProductivity,
                    borderColor: '#00ff88',
                    backgroundColor: 'rgba(0, 255, 136, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#00ff88',
                    pointBorderColor: '#0a0a0a',
                    pointBorderWidth: 2,
                    pointRadius: 3
                },
                {
                    label: 'Trend (7-day avg)',
                    data: movingAverage,
                    borderColor: '#00d4ff',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    fill: false,
                    tension: 0.4,
                    pointRadius: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: '#e0e0e0',
                        font: {
                            size: 11
                        }
                    }
                },
                title: {
                    display: true,
                    text: `Productivity Trend - ${monthName}`,
                    color: '#00ff88',
                    font: {
                        size: 14,
                        weight: '300'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(26, 26, 26, 0.9)',
                    titleColor: '#00ff88',
                    bodyColor: '#e0e0e0',
                    borderColor: '#00ff88',
                    borderWidth: 1
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#888',
                        maxTicksLimit: 15
                    },
                    title: {
                        display: true,
                        text: 'Day of Month',
                        color: '#888'
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#888'
                    },
                    title: {
                        display: true,
                        text: 'Hours',
                        color: '#888'
                    },
                    beginAtZero: true
                }
            }
        }
    });
}

function getTaskColor(taskId) {
    const colors = [
        '#00ff88', '#00d4ff', '#ff6b6b', '#ffd93d', '#6c5ce7',
        '#fd79a8', '#00b894', '#e17055', '#0984e3', '#d63031'
    ];
    return colors[taskId % colors.length];
}

// Export function to manually refresh charts if needed
window.refreshCharts = function() {
    chartDataCache = null;
    updateCharts();
};