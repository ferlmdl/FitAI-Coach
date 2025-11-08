document.addEventListener('DOMContentLoaded', () => {
    const registroForm = document.getElementById('registroForm');
    const contrasenaInput = document.getElementById('password');
    const confirmarpasswordInput = document.getElementById('confirmarpassword');
    
    const passwordMatch = document.getElementById('passwordMatch');
    const passwordReqsBox = document.getElementById('passwordReqs');

    const requirements = {
        length: { validator: (password) => password.length >= 8, el: document.getElementById('req-length') },
        upper: { validator: (password) => /[A-Z]/.test(password), el: document.getElementById('req-upper') },
        lower: { validator: (password) => /[a-z]/.test(password), el: document.getElementById('req-lower') },
        number: { validator: (password) => /[0-9]/.test(password), el: document.getElementById('req-number') },
        symbol: { validator: (password) => /[!@#$%^&*-_]/.test(password), el: document.getElementById('req-symbol') }
    };

    const togglePassword = document.getElementById('togglePassword');
    const eyeOpen = document.getElementById('eye-open');
    const eyeClosed = document.getElementById('eye-closed');

    if (togglePassword && contrasenaInput && eyeOpen && eyeClosed) {
        togglePassword.addEventListener('click', function() {
            const type = contrasenaInput.getAttribute('type') === 'password' ? 'text' : 'password';
            contrasenaInput.setAttribute('type', type);
            
            if (type === 'password') {
                eyeOpen.style.display = 'block';
                eyeClosed.style.display = 'none';
            } else {
                eyeOpen.style.display = 'none';
                eyeClosed.style.display = 'block';
            }
        });
    }

    const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
    const eyeOpenConfirm = document.getElementById('eye-open-confirm');
    const eyeClosedConfirm = document.getElementById('eye-closed-confirm');

    if (toggleConfirmPassword && confirmarpasswordInput && eyeOpenConfirm && eyeClosedConfirm) {
        toggleConfirmPassword.addEventListener('click', function() {
            const type = confirmarpasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            confirmarpasswordInput.setAttribute('type', type);

            if (type === 'password') {
                eyeOpenConfirm.style.display = 'block';
                eyeClosedConfirm.style.display = 'none';
            } else {
                eyeOpenConfirm.style.display = 'none';
                eyeClosedConfirm.style.display = 'block';
            }
        });
    }

    if (contrasenaInput) {
        contrasenaInput.addEventListener('focus', () => {
            if (passwordReqsBox) passwordReqsBox.style.display = 'block';
        });

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

            const password = contrasenaInput.value;
            const allReqsMet = Object.values(requirements).every(req => req.validator(password));
            const passwordsMatch = contrasenaInput.value === confirmarpasswordInput.value;

            if (!allReqsMet) {
                alert('La contraseña no cumple con todos los requisitos de seguridad.');
                return;
            }

            if (!passwordsMatch) {
                alert('Las contraseñas no coinciden.');
                return;
            }

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
                    if (window.Swal) {
                        Swal.fire({ icon: 'success', title: 'Registro exitoso', text: 'Serás redirigido para iniciar sesión.' })
                            .then(() => window.location.href = '/login');
                    } else {
                        alert('¡Registro exitoso! Serás redirigido para iniciar sesión.');
                        window.location.href = '/login';
                    }
                } else {
                    if (window.Swal) Swal.fire({ icon: 'error', title: 'Error', text: result.error });
                    else alert(`Error: ${result.error}`);
                }
            } catch (error) {
                console.error('Error de conexión:', error);
                if (window.Swal) Swal.fire({ icon: 'error', title: 'Error de conexión', text: 'No se pudo conectar con el servidor.' });
                else alert('No se pudo conectar con el servidor.');
            }
        });
    }
});
