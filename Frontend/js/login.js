document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.querySelector('.login-form');
    if (!loginForm) return;

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const result = await response.json();

            if (response.ok) {
                localStorage.setItem('authToken', result.token);
                localStorage.setItem('user', JSON.stringify(result.user));
                if (window.SwalToast) {
                    SwalToast.fire({ icon: 'success', title: 'Inicio de sesión exitoso' });
                    setTimeout(() => window.location.href = '/', 800);
                } else if (window.Swal) {
                    Swal.fire({ icon: 'success', title: 'Inicio de sesión exitoso' }).then(() => window.location.href = '/');
                } else {
                    alert('¡Inicio de sesión exitoso!');
                    window.location.href = '/';
                }
            } else {
                if (window.Swal) {
                    Swal.fire({ icon: 'error', title: 'Error', text: result.error || 'Credenciales inválidas' });
                } else {
                    alert(`Error: ${result.error}`);
                }
            }
        } catch (error) {
            console.error('Error de conexión:', error);
            if (window.Swal) {
                Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo conectar con el servidor.' });
            } else {
                alert('No se pudo conectar con el servidor.');
            }
        }
    });
});