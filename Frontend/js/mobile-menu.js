document.addEventListener('DOMContentLoaded', () => {
    const menuToggleBtn = document.getElementById('menu-toggle-btn');
    const navbar = document.querySelector('.navbar');
    if (menuToggleBtn && navbar) {
        menuToggleBtn.addEventListener('click', () => {
            navbar.classList.toggle('is-active');
            menuToggleBtn.classList.toggle('is-active');
        });
    }
});