document.addEventListener('DOMContentLoaded', () => {

    const registerForm = document.getElementById('registerForm');

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const allName = document.getElementById('allName').value;
            const userName = document.getElementById('userName').value;
            const email = document.getElementById('email').value;
            const age = document.getElementById('age').value;
            const newPassword = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmarpassword').value;

            if (password !== confirmPassword) {
                Swal.fire({ icon: 'error', title: 'Error', text: 'Las contraseñas no coinciden.' });
                return;
            }

            try {
                const response = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ allName, userName, email, age, password })
                });

                const result = await response.json();

                if (result.success) {
                    Swal.fire({
                        icon: 'success',
                        title: '¡Casi listo!',
                        text: result.message
                    }).then(() => {
                        registerForm.reset();
                    });
                } else {
                    Swal.fire({ icon: 'error', title: 'Error de Registro', text: result.error });
                }

            } catch (error) {
                console.error('Error de conexión al registrar:', error);
                Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo conectar con el servidor.' });
            }
        });
    }

    const logoutBtn = document.getElementById('logoutBtn');
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            
            try {
                const response = await fetch('/api/auth/logout', { method: 'GET' });
                const result = await response.json();

                if (result.success) {
                    if (window.SwalToast) {
                        SwalToast.fire({ icon: 'success', title: 'Has cerrado sesión, esperamos que vuelvas pronto' }).then(() => window.location.href = '/login');
                    } else if (window.Swal) {
                        Swal.fire({ icon: 'success', title: 'Has cerrado sesión.' }).then(() => window.location.href = '/login');
                    } else {
                        alert('Has cerrado sesión.');
                        window.location.href = '/login';
                    }
                } else {
                    if (window.Swal) Swal.fire({ icon: 'error', title: 'Error', text: 'Hubo un error al cerrar la sesión...' });
                    else alert('Hubo un error al cerrar la sesión.');
                }
            } catch (error) {
                console.error('Error de conexión al cerrar sesión:', error);
                if (window.Swal) Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo conectar con el servidor.' });
                else alert('No se pudo conectar con el servidor.');
            }
        });
    }

    const recoveryForm = document.getElementById('recoveryForm');

    if (recoveryForm) {
        recoveryForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;

            try {
                const response = await fetch('/api/auth/request-reset', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                });

                const result = await response.json();

                if (result.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Correo Enviado',
                        text: result.message
                    });
                    recoveryForm.reset();
                } else {
                    Swal.fire({ icon: 'error', title: 'Error', text: result.error });
                }
            } catch (error) {
                Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo conectar con el servidor.' });
            }
        });
    }

    const updatePasswordForm = document.getElementById('updatePasswordForm');

    if (updatePasswordForm) {
        const hash = window.location.hash.substring(1);
        const params = {};
        hash.split('&').forEach(part => {
            const [key, value] = part.split('=');
            params[key] = decodeURIComponent(value);
        });

        const accessToken = params.access_token;
        const refreshToken = params.refresh_token;

        if (!accessToken || !refreshToken) {
            Swal.fire({
                icon: 'error',
                title: 'Enlace Inválido',
                text: 'El enlace de reseteo no es válido o ha expirado. Por favor, solicita uno nuevo.'
            });
            updatePasswordForm.querySelector('button').disabled = true;
            updatePasswordForm.querySelector('button').style.opacity = 0.5;
        }

        updatePasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            if (newPassword !== confirmPassword) {
                Swal.fire({ icon: 'error', title: 'Error', text: 'Las contraseñas no coinciden.' });
                return;
            }

            try {
                const response = await fetch('/api/auth/update-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ accessToken, refreshToken, newPassword })
                });

                const result = await response.json();

                if (result.success) {
                    Swal.fire({
                        icon: 'success',
                        title: '¡Éxito!',
                        text: 'Tu contraseña ha sido actualizada. Ya puedes iniciar sesión.'
                    }).then(() => {
                        window.location.href = '/login';
                    });
                } else {
                    Swal.fire({ icon: 'error', title: 'Error', text: result.error });
                }
            } catch (error) {
                Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo conectar con el servidor.' });
            }
        });
    }

});