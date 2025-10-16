const registroForm = document.getElementById('registroForm');
    const passwordInput = document.getElementById('password');
    const confirmarpasswordInput = document.getElementById('confirmarpassword');
    const passwordMatch = document.getElementById('passwordMatch');

    const requirements = {
        length: { validator: (password) => password.length >= 8, el: document.getElementById('req-length') },
        upper: { validator: (password) => /[A-Z]/.test(password), el: document.getElementById('req-upper') },
        lower: { validator: (password) => /[a-z]/.test(password), el: document.getElementById('req-lower') },
        number: { validator: (password) => /[0-9]/.test(password), el: document.getElementById('req-number') },
        symbol: { validator: (password) => /[!@#$%^&*\-_]/.test(password), el: document.getElementById('req-symbol') }
    };

    passwordInput.addEventListener('input', () => {
        const password = passwordInput.value;
        Object.values(requirements).forEach(req => {
            req.el.classList.toggle('met', req.validator(password));
        });
        checkPasswordMatch();
    });

    confirmarpasswordInput.addEventListener('input', checkPasswordMatch);

    function checkPasswordMatch() {
        if (confirmarpasswordInput.value === '') {
            passwordMatch.textContent = '';
            passwordMatch.className = 'password-match';
            return;
        }
        if (passwordInput.value === confirmarpasswordInput.value) {
            passwordMatch.textContent = '✓ Las contraseñas coinciden';
            passwordMatch.className = 'password-match match';
        } else {
            passwordMatch.textContent = '✗ Las contraseñas no coinciden';
            passwordMatch.className = 'password-match no-match';
        }
    }

    registroForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const password = passwordInput.value;
        const allRequirementsMet = Object.values(requirements).every(req => req.validator(password));

        if (!allRequirementsMet) {
            alert('La contraseña no cumple todos los requisitos.');
            return;
        }
        if (password !== confirmarpasswordInput.value) {
            alert('Las contraseñas no coinciden.');
            return;
        }

        const formData = new FormData(registroForm);
        const data = {
            name: formData.get('name'),
            userName: formData.get('userName'),
            email: formData.get('email'),
            password: formData.get('password')
        };

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok) {
                alert('¡Registro exitoso! Serás redirigido para iniciar sesión.');
                window.location.href = '/login.html';
            } else {
                alert(`Error: ${result.error}`);
            }
        } catch (error) {
            console.error('Error de conexión:', error);
            alert('No se pudo conectar con el servidor.');
        }
    });