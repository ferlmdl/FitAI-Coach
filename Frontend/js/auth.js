document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            
            try {
                const response = await fetch('/api/auth/logout', { method: 'GET' });
                const result = await response.json();

                if (result.success) {
                    alert('Has cerrado sesión.');
                    window.location.href = '/login';
                } else {
                    alert('Hubo un error al cerrar la sesión.');
                }
            } catch (error) {
                console.error('Error de conexión al cerrar sesión:', error);
                alert('No se pudo conectar con el servidor.');
            }
        });
    }
});