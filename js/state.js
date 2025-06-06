// --- 2. 应用状态管理 ---
export const state = {
    tasks: [],
    labels: {},
    draggedTaskId: null,
    currentView: 'all',
    isAnimating: false,
    multiPanelMode: true,
    activeFilters: {
        status: ['todo', 'in-progress', 'done'],
        date: null,
        priority: 'all',
        labels: []
    },
    TAG_STYLE_COUNT: 8,
    currentCalendarDate: new Date(),
    selectedTaskForDetail: null,
    notificationPermission: false,
    reminderCheckInterval: null,
    activeReminders: []
};
