window.StatsModule = (function() {
    'use strict';

    // --- 1. DOM Element Selection (deferred to init) ---
    let timeRangeFilter, completionRateEl, avgCompletionTimeEl, dueTasksListEl, trendChartCanvas, labelChartCanvas;

    // --- 2. State Management ---
    let allTasks = [];
    let trendChart = null;
    let labelChart = null;
    let isInitialized = false;

    // --- 3. Data Handling ---

    /**
     * Loads tasks from local storage.
     * @returns {Array} An array of task objects.
     */
    function loadTasks() {
        const storedTasks = localStorage.getItem('kanban_tasks');
        return storedTasks ? JSON.parse(storedTasks) : [];
    }

    /**
     * Filters tasks based on the selected time range.
     * @param {string} range - The selected time range ('all', '7', '30', '90').
     * @returns {Array} The filtered array of task objects.
     */
    function filterTasksByTime(range) {
        if (range === 'all') {
            return allTasks;
        }
        const days = parseInt(range, 10);
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        cutoffDate.setHours(0, 0, 0, 0);

        return allTasks.filter(task => {
            const createdAt = new Date(task.createdAt);
            return createdAt >= cutoffDate;
        });
    }

    // --- 4. Data Processing and Calculation ---

    /**
     * Processes data for the task trend chart.
     * @param {Array} tasks - The tasks to process.
     * @returns {Object} Data formatted for Chart.js.
     */
    function processTrendData(tasks) {
        const datasets = {
            todo: {},
            'in-progress': {},
            done: {}
        };
        const labels = new Set();

        tasks.forEach(task => {
            const date = new Date(task.createdAt).toISOString().split('T')[0];
            labels.add(date);
            if (!datasets[task.status][date]) {
                datasets[task.status][date] = 0;
            }
            datasets[task.status][date]++;
        });

        const sortedLabels = Array.from(labels).sort();
        
        const finalDatasets = Object.keys(datasets).map(status => {
            const data = sortedLabels.map(label => datasets[status][label] || 0);
            const color = getStatusColor(status);
            return {
                label: status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
                data: data,
                borderColor: color,
                backgroundColor: `${color}33`, // Semi-transparent fill
                fill: true,
                tension: 0.3
            };
        });

        return { labels: sortedLabels, datasets: finalDatasets };
    }

    /**
     * Processes data for the label distribution chart.
     * @param {Array} tasks - The tasks to process.
     * @returns {Object} Data formatted for Chart.js.
     */
    function processLabelData(tasks) {
        const labelCounts = {};
        tasks.forEach(task => {
            if (task.labels && task.labels.length > 0) {
                task.labels.forEach(label => {
                    if (!labelCounts[label]) {
                        labelCounts[label] = 0;
                    }
                    labelCounts[label]++;
                });
            }
        });

        const sortedLabels = Object.keys(labelCounts).sort((a, b) => labelCounts[b] - labelCounts[a]);
        const data = sortedLabels.map(label => labelCounts[label]);
        const backgroundColors = sortedLabels.map((_, index) => `hsl(${(index * 45) % 360}, 70%, 60%)`);

        return {
            labels: sortedLabels,
            datasets: [{
                data: data,
                backgroundColor: backgroundColors
            }]
        };
    }

    /**
     * Calculates completion rate and average completion time.
     * @param {Array} tasks - The tasks to process.
     */
    function calculateSummaryMetrics(tasks) {
        const doneTasks = tasks.filter(t => t.status === 'done' && t.completedAt);
        const totalTasks = tasks.length;

        // Completion Rate
        const rate = totalTasks > 0 ? `${doneTasks.length} / ${totalTasks}` : '0 / 0';
        completionRateEl.textContent = rate;

        // Average Completion Time
        if (doneTasks.length === 0) {
            avgCompletionTimeEl.textContent = 'N/A';
            return;
        }

        const totalDuration = doneTasks.reduce((acc, task) => {
            const created = new Date(task.createdAt);
            // Use completedAt for accurate calculation
            const completed = new Date(task.completedAt);
            return acc + (completed - created);
        }, 0);

        const avgDuration = totalDuration / doneTasks.length;
        avgCompletionTimeEl.textContent = formatDuration(avgDuration);
    }

    /**
     * Updates the list of upcoming due tasks.
     */
    function updateDueTasksList() {
        const now = new Date();
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(now.getDate() + 7);

        const dueTasks = allTasks.filter(task => {
            if (!task.dueDate || task.status === 'done') return false;
            const dueDate = new Date(task.dueDate);
            return dueDate >= now && dueDate <= sevenDaysFromNow;
        }).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

        dueTasksListEl.innerHTML = '';
        if (dueTasks.length === 0) {
            dueTasksListEl.innerHTML = '<li class="due-tasks-placeholder">没有即将到期的任务。</li>';
            return;
        }

        dueTasks.forEach(task => {
            const li = document.createElement('li');
            const remaining = Math.ceil((new Date(task.dueDate) - now) / (1000 * 60 * 60 * 24));
            const remainingText = remaining > 1 ? `${remaining} 天后` : (remaining === 1 ? '明天' : '今天');
            
            li.innerHTML = `
                <span class="due-task-title">${task.title}</span>
                <div class="due-task-details">
                    <span class="due-task-status status-${task.status}">${task.status}</span>
                    <span class="due-task-date">${task.dueDate}</span>
                    <span class="due-task-remaining ${remaining <= 1 ? 'urgent' : ''}">${remainingText}</span>
                </div>
            `;
            dueTasksListEl.appendChild(li);
        });
    }


    // --- 5. Chart Rendering ---

    /**
     * Renders or updates the task trend chart.
     * @param {Object} data - Data from processTrendData.
     */
    function renderTrendChart(data) {
        if (trendChart) {
            trendChart.data.labels = data.labels;
            trendChart.data.datasets = data.datasets;
            trendChart.update();
        } else {
            trendChart = new Chart(trendChartCanvas, {
                type: 'line',
                data: data,
                options: getChartOptions('任务数量')
            });
        }
    }

    /**
     * Renders or updates the label distribution chart.
     * @param {Object} data - Data from processLabelData.
     */
    function renderLabelChart(data) {
        if (labelChart) {
            labelChart.data.labels = data.labels;
            labelChart.data.datasets = data.datasets;
            labelChart.update();
        } else {
            labelChart = new Chart(labelChartCanvas, {
                type: 'doughnut',
                data: data,
                options: getChartOptions('标签分布', true)
            });
        }
    }

    /**
     * Provides default options for charts.
     * @param {string} title - The chart title for the tooltip.
     * @param {boolean} isDoughnut - Whether the chart is a doughnut chart.
     * @returns {Object} Chart.js options object.
     */
    function getChartOptions(title, isDoughnut = false) {
        const style = getComputedStyle(document.documentElement);
        const textColor = style.getPropertyValue('--text-secondary');
        const gridColor = style.getPropertyValue('--border-color-light');

        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: isDoughnut ? 'right' : 'top',
                    labels: {
                        color: textColor
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                }
            },
            scales: isDoughnut ? {} : {
                x: {
                    grid: { color: gridColor },
                    ticks: { color: textColor }
                },
                y: {
                    beginAtZero: true,
                    grid: { color: gridColor },
                    ticks: { color: textColor }
                }
            }
        };
    }


    // --- 6. Utility Functions ---

    /**
     * Formats duration in milliseconds to a human-readable string.
     * @param {number} ms - Duration in milliseconds.
     * @returns {string} Formatted duration string.
     */
    function formatDuration(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days} 天 ${hours % 24} 小时`;
        if (hours > 0) return `${hours} 小时 ${minutes % 60} 分`;
        return `${minutes} 分`;
    }

    /**
     * Gets a color for a given task status.
     * @param {string} status - The task status.
     * @returns {string} A hex color code.
     */
    function getStatusColor(status) {
        switch (status) {
            case 'todo': return '#5A95E5';
            case 'in-progress': return '#F2C94C';
            case 'done': return '#6FCF97';
            default: return '#9B9B9B';
        }
    }

    // --- 7. Main Application Logic ---

    /**
     * Main function to update all stats on the page.
     */
    function updateAllStats() {
        const range = timeRangeFilter.value;
        const filteredTasks = filterTasksByTime(range);

        // Process and render all components
        const trendData = processTrendData(filteredTasks);
        renderTrendChart(trendData);

        const labelData = processLabelData(filteredTasks);
        renderLabelChart(labelData);

        calculateSummaryMetrics(filteredTasks);
        
        // Due tasks list is independent of the time filter
        updateDueTasksList();
    }

    /**
     * Initializes the application.
     */
    function init() {
        if (isInitialized) {
            // On subsequent calls, just refresh the data as it might have changed
            allTasks = loadTasks();
            updateAllStats();
            return;
        }
        
        // First-time setup
        timeRangeFilter = document.getElementById('time-range-filter');
        completionRateEl = document.getElementById('completion-rate');
        avgCompletionTimeEl = document.getElementById('avg-completion-time');
        dueTasksListEl = document.getElementById('due-tasks-list');
        trendChartCanvas = document.getElementById('task-trend-chart');
        labelChartCanvas = document.getElementById('label-distribution-chart');

        if (!timeRangeFilter || !trendChartCanvas || !labelChartCanvas) {
            console.error("Stats view elements not found. Initialization aborted.");
            return;
        }

        allTasks = loadTasks();
        updateAllStats();

        // Add event listeners
        timeRangeFilter.addEventListener('change', updateAllStats);

        // Add theme change listener to redraw charts with new colors
        const themeSwitcher = document.getElementById('theme-switcher');
        if (themeSwitcher) {
            new MutationObserver(() => {
                // Check if the stats view is actually visible before destroying/redrawing charts
                if (trendChartCanvas && trendChartCanvas.offsetParent !== null) {
                    if (trendChart) trendChart.destroy();
                    if (labelChart) labelChart.destroy();
                    trendChart = null;
                    labelChart = null;
                    updateAllStats();
                }
            }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
        }
        
        isInitialized = true;
    }

    // --- 8. Public Interface ---
    return {
        init: init
    };
})();
