document.addEventListener("DOMContentLoaded", () => {
    const toggleBtn = document.getElementById("theme-toggle");
    const icon = document.querySelector('.mode-icon');
    const body = document.body;

    const updateIcon = (isDark) => {
        icon.textContent = isDark ? '☀️' : '🌙';
    };

    const savedTheme = localStorage.getItem('theme');

    if (savedTheme === 'dark') {
        body.classList.add('dark-mode');
        updateIcon(true);
    } else {
        body.classList.remove('dark-mode');
        updateIcon(false);
    }

    toggleBtn.addEventListener("click", () => {
        body.classList.toggle('dark-mode');

        const isDark = body.classList.contains('dark-mode');

        localStorage.setItem('theme', isDark ? 'dark' : 'light');

        updateIcon(isDark);
    });

});