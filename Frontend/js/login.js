document.addEventListener('DOMContentLoaded', () => {
    
    const loginForm = document.querySelector('.login-form');
    const passwordInput = document.getElementById('password');

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

    function setupPasswordToggle(toggleEl, inputEl) {
        if (!toggleEl || !inputEl) return;

        if (!toggleEl.hasAttribute('tabindex')) toggleEl.setAttribute('tabindex', '0');
        if (!toggleEl.hasAttribute('role')) toggleEl.setAttribute('role', 'button');

        const eyeClosed = toggleEl.querySelector('#eye-closed');
        const eyeOpen = toggleEl.querySelector('#eye-open');
        
        const isHidden = inputEl.type === 'password';
        if (eyeOpen) eyeOpen.style.display = isHidden ? 'none' : 'block';
        if (eyeClosed) eyeClosed.style.display = isHidden ? 'block' : 'none';
        toggleEl.setAttribute('aria-pressed', (!isHidden).toString());

        toggleEl.addEventListener('click', function() {
            const currentlyHidden = inputEl.type === 'password';
            inputEl.type = currentlyHidden ? 'text' : 'password';

            if (eyeOpen && eyeClosed) {
                if (inputEl.type === 'password') {
                    eyeOpen.style.display = 'none';
                    eyeClosed.style.display = 'block';
                } else {
                    eyeOpen.style.display = 'block';
                    eyeClosed.style.display = 'none';
                }
            }
            toggleEl.setAttribute('aria-pressed', (inputEl.type === 'text').toString());
            inputEl.focus();
        });

        toggleEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.code === 'Space' || e.key === ' ') {
                e.preventDefault();
                toggleEl.click();
            }
        });
    }

    const togglePassword = document.getElementById('togglePassword');
    setupPasswordToggle(togglePassword, passwordInput);
});