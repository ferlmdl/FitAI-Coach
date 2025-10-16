document.addEventListener('DOMContentLoaded', () => {
    const menuToggleBtn = document.getElementById('menu-toggle-btn');
    const header = document.querySelector('.menu');

    if (menuToggleBtn && header) {
        menuToggleBtn.addEventListener('click', () => {
             header.classList.toggle('menu-open');
        });
    }
});
