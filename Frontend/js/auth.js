// Archivo: Frontend/js/auth.js

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('authToken');
    const navbarLinks = document.getElementById('navbar-links');

    if (token && navbarLinks) {
        navbarLinks.innerHTML = `
            <li><a href="/upload.html">Subir Video</a></li>
            <li><a href="/history.html">Mi Historial</a></li>
            <li><a href="/profile.html">Mi Perfil</a></li>
            <li><a href="#" id="logoutBtn">Cerrar Sesión</a></li>
        `;

        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.removeItem('authToken');
                alert('Has cerrado sesión.');
                window.location.href = '/login.html';
            });
        }
    }
});
