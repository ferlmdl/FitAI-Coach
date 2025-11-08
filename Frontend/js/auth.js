document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            
            try {
                const response = await fetch('/api/auth/logout', { method: 'GET' });
                const result = await response.json();

                if (result.success) {
                    if (window.SwalToast) {
                        SwalToast.fire({ icon: 'success', title: 'Has cerrado sesión.' }).then(() => window.location.href = '/login');
                    } else if (window.Swal) {
                        Swal.fire({ icon: 'success', title: 'Has cerrado sesión.' }).then(() => window.location.href = '/login');
                    } else {
                        alert('Has cerrado sesión.');
                        window.location.href = '/login';
                    }
                } else {
                    if (window.Swal) Swal.fire({ icon: 'error', title: 'Error', text: 'Hubo un error al cerrar la sesión.' });
                    else alert('Hubo un error al cerrar la sesión.');
                }
            } catch (error) {
                console.error('Error de conexión al cerrar sesión:', error);
                if (window.Swal) Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo conectar con el servidor.' });
                else alert('No se pudo conectar con el servidor.');
            }
        });
    }
});