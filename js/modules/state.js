// --- 应用状态管理 ---

const state = {
    tasks: [], // 存储所有任务的核心数组
    labels: {}, // 存储所有标签和它们的颜色 e.g. { "重要": "#ff0000" }
    draggedTaskId: null, // 当前拖拽的任务ID
    currentView: 'all', // 'all', 'todo', 'in-progress', 'done', 'calendar', 'stats'
    isAnimating: false, // 防止动画期间重复点击
    multiPanelMode: true, // 默认开启多面板模式
    activeFilters: {
        status: ['todo', 'in-progress', 'done'],
        date: null,
        priority: 'all',
        labels: [] // 存储激活的标签名
    },
    // 日历视图状态
    currentCalendarDate: new Date(), // 当前显示的月份
    selectedTaskForDetail: null, // 选中查看详情的任务
    // 提醒功能状态
    notificationPermission: false, // 通知权限状态
    reminderCheckInterval: null, // 提醒检查定时器
    activeReminders: [], // 活跃的提醒列表
    // 拖拽子任务
    draggedSubtaskInfo: null,
};

export const TAG_STYLE_COUNT = 8; // 预定义的颜色变量数量

export default state;
