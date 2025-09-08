(function() {
    'use strict';

    const themeSwitcher = document.getElementById('theme-switcher');
    if (!themeSwitcher) return;

    /**
     * Loads the theme from localStorage and applies it.
     */
    function loadTheme() {
        const storedTheme = localStorage.getItem('kanban_theme') || 'light';
        document.documentElement.setAttribute('data-theme', storedTheme);
        updateSwitcherA11y(storedTheme);
    }

    /**
     * Saves the selected theme to localStorage.
     * @param {string} theme - The theme to save ('light' or 'dark').
     */
    function saveTheme(theme) {
        localStorage.setItem('kanban_theme', theme);
    }

    /**
     * Updates the text on the theme switcher button.
     * @param {string} theme - The current theme.
     */
    function updateSwitcherA11y(theme) {
        const label = theme === 'light' ? '切换到深色' : '切换到浅色';
        themeSwitcher.setAttribute('aria-label', label);
    }

    /**
     * Handles the click event on the theme switcher button.
     */
    function handleThemeSwitch() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        updateSwitcherA11y(newTheme);
        saveTheme(newTheme);
    }

    // Add event listener
    themeSwitcher.addEventListener('click', handleThemeSwitch);

    // Load the theme when the script runs
    loadTheme();

})();
