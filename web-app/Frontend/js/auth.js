document.addEventListener('DOMContentLoaded', () => {
    const hash = window.location.hash;
    const path = window.location.pathname;

    if (hash && hash.includes('type=recovery') && !path.includes('/update-password')) {
        console.log('🔄 Token de recuperación detectado. Redirigiendo a /update-password...');
        window.location.href = '/update-password' + hash;
        return;
    }
    const registerForm = document.getElementById('registerForm');

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const allName = document.getElementById('allName').value;
            const userName = document.getElementById('userName').value;
            const email = document.getElementById('email').value;
            const age = document.getElementById('age').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

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
                console.error(error);
                Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo conectar con el servidor.' });
            }
        });
    }

    const updatePasswordForm = document.getElementById('updatePasswordForm');

    if (updatePasswordForm) {
        
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');

        if (!accessToken || !refreshToken) {
            Swal.fire({
                icon: 'error',
                title: 'Enlace Inválido',
                text: 'El enlace de recuperación no es válido o ha expirado. Solicita uno nuevo.'
            }).then(() => {
                window.location.href = '/recovery'; 
            });
            const btn = updatePasswordForm.querySelector('button');
            if(btn) btn.disabled = true;
        }

        updatePasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const newPassword = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmarpassword').value;

            if (newPassword !== confirmPassword) {
                Swal.fire({ icon: 'error', title: 'Error', text: 'Las contraseñas no coinciden.' });
                return;
            }

            try {
                const response = await fetch('/api/auth/update-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        accessToken, 
                        refreshToken, 
                        newPassword 
                    })
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
                console.error(error);
                Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo conectar con el servidor.' });
            }
        });
    }
}); 