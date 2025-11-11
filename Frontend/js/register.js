document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.querySelector('.login-form');
    const passwordInput = document.getElementById('password');

    // URLs de las imágenes
    const eyeOpenUrl = 'https://cdn-icons-png.flaticon.com/512/565/565654.png';
    const eyeClosedUrl = 'https://cdn-icons-png.flaticon.com/512/565/565655.png';

    // Configuración del toggle de contraseña
    function setupPasswordToggle(toggleEl, inputEl) {
        if (!toggleEl || !inputEl) return;

        toggleEl.style.cursor = 'pointer';
        toggleEl.setAttribute('tabindex', '0');
        toggleEl.setAttribute('role', 'button');

        toggleEl.addEventListener('click', function() {
            const type = inputEl.getAttribute('type') === 'password' ? 'text' : 'password';
            inputEl.setAttribute('type', type);

            if (toggleEl.src.includes('565654.png') || toggleEl.src.includes('eye-open')) {
                toggleEl.src = eyeClosedUrl;
                toggleEl.setAttribute('alt', 'Mostrar contraseña');
            } else {
                toggleEl.src = eyeOpenUrl;
                toggleEl.setAttribute('alt', 'Ocultar contraseña');
            }
            
            inputEl.focus();
        });

        toggleEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleEl.click();
            }
        });
    }

    // Inicializar el toggle
    const togglePassword = document.getElementById('togglePassword');
    console.log('togglePassword en login:', togglePassword);

    if (togglePassword) {
        setupPasswordToggle(togglePassword, passwordInput);
    } else {
        console.error('❌ NO se encontró togglePassword en login');
    }

    // Manejo del envío del formulario
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = passwordInput.value; 

            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const result = await response.json();

                if (response.ok) {
                    if (window.SwalToast) {
                        SwalToast.fire({ icon: 'success', title: 'Bienvenido, ya te extrañabamos' });
                        setTimeout(() => window.location.href = '/', 800);
                    } else {
                        alert('¡Inicio de sesión exitoso!');
                        window.location.href = '/';
                    }
                } else {
                    if (window.Swal) Swal.fire({ icon: 'error', title: 'Error', text: result.error || 'Credenciales inválidas' });
                    else alert(`Error: ${result.error}`);
                }
            } catch (error) {
                console.error('Error de conexión:', error);
                if (window.Swal) Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo conectar con el servidor.' });
                else alert('No se pudo conectar con el servidor.');
            }
        });
    }
});