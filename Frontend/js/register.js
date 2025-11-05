document.addEventListener('DOMContentLoaded', () => {
    const registroForm = document.getElementById('registroForm');
    const contrasenaInput = document.getElementById('password');
    const confirmarpasswordInput = document.getElementById('confirmarpassword');
    const passwordMatch = document.getElementById('passwordMatch');

    const showPasswordToggle = document.getElementById('showPasswordToggle');
    const showConfirmPasswordToggle = document.getElementById('showConfirmPasswordToggle');

    const requirements = {
        length: { validator: (password) => password.length >= 8, el: document.getElementById('req-length') },
        upper: { validator: (password) => /[A-Z]/.test(password), el: document.getElementById('req-upper') },
        lower: { validator: (password) => /[a-z]/.test(password), el: document.getElementById('req-lower') },
        number: { validator: (password) => /[0-9]/.test(password), el: document.getElementById('req-number') },
        symbol: { validator: (password) => /[!@#$%^&*-_]/.test(password), el: document.getElementById('req-symbol') }
    };

    if (showPasswordToggle && contrasenaInput) {
        showPasswordToggle.addEventListener('change', function() {
            contrasenaInput.type = this.checked ? 'text' : 'password';
        });
    }

    if (showConfirmPasswordToggle && confirmarpasswordInput) {
        showConfirmPasswordToggle.addEventListener('change', function() {
            confirmarpasswordInput.type = this.checked ? 'text' : 'password';
        });
    }

    if (contrasenaInput) {
        contrasenaInput.addEventListener('input', () => {
            const password = contrasenaInput.value;
            Object.values(requirements).forEach(req => {
                if (req.el) req.el.classList.toggle('met', req.validator(password));
            });
            checkPasswordMatch();
        });
    }

    if (confirmarpasswordInput) {
        confirmarpasswordInput.addEventListener('input', checkPasswordMatch);
    }

    function checkPasswordMatch() {
        if (!confirmarpasswordInput || !passwordMatch) return;
        if (confirmarpasswordInput.value === '') {
            passwordMatch.textContent = '';
            passwordMatch.className = 'password-match';
            return;
        }
        if (contrasenaInput.value === confirmarpasswordInput.value) {
            passwordMatch.textContent = 'Las contraseñas coinciden';
            passwordMatch.className = 'password-match match';
        } else {
            passwordMatch.textContent = 'Las contraseñas no coinciden';
            passwordMatch.className = 'password-match no-match';
        }
    }

    if (registroForm) {
        registroForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(registroForm);
            const data = {
                age: formData.get('age'),
                allName: formData.get('allName'),
                email: formData.get('email'),
                password: formData.get('password'),
                userName: formData.get('userName')
            };

            try {
                const response = await fetch(`/api/auth/register`, { 
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                const result = await response.json();

                if (response.ok) {
                    alert('¡Registro exitoso! Serás redirigido para iniciar sesión.');
                    window.location.href = '/login';
                } else {
                    alert(`Error: ${result.error}`);
                }
            } catch (error) {
                console.error('Error de conexión:', error);
                alert('No se pudo conectar con el servidor.');
            }
        });
    }
});
