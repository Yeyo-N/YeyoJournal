let entriesChart = null;

function updateChart() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    const entries = JSON.parse(localStorage.getItem(`entries_${user.username}`) || '[]');
    
    const completed = entries.filter(entry => entry.completed).length;
    const pending = entries.filter(entry => !entry.completed).length;
    
    // Mood distribution
    const moodCounts = {};
    entries.forEach(entry => {
        moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
    });
    
    const ctx = document.getElementById('entriesChart').getContext('2d');
    
    if (entriesChart) {
        entriesChart.destroy();
    }
    
    entriesChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Completed', 'Pending'],
            datasets: [{
                data: [completed, pending],
                backgroundColor: ['#4CAF50', '#FF9800'],
                borderColor: ['#45a049', '#e68900'],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#e0e0e0',
                        font: {
                            size: 12
                        }
                    }
                },
                title: {
                    display: true,
                    text: 'Entries Completion',
                    color: '#e0e0e0',
                    font: {
                        size: 16
                    }
                }
            }
        }
    });
}