document.addEventListener('DOMContentLoaded', () => {
    console.log('register.js cargado');

    const registroForm = document.getElementById('registroForm');
    const contrasenaInput = document.getElementById('password');
    const confirmarpasswordInput = document.getElementById('confirmarpassword');
    const passwordMatch = document.getElementById('passwordMatch');

    // URLs de las imágenes
    const eyeOpenUrl = 'https://cdn-icons-png.flaticon.com/512/565/565654.png';
    const eyeClosedUrl = 'https://cdn-icons-png.flaticon.com/512/565/565655.png';

    // Configuración del toggle de contraseña
    function setupPasswordToggle(toggleEl, inputEl) {
        if (!toggleEl || !inputEl) return;

        // Hacer que la imagen sea clickeable
        toggleEl.style.cursor = 'pointer';
        toggleEl.setAttribute('tabindex', '0');
        toggleEl.setAttribute('role', 'button');

        toggleEl.addEventListener('click', function() {
            const type = inputEl.getAttribute('type') === 'password' ? 'text' : 'password';
            inputEl.setAttribute('type', type);

            // Cambiar la imagen
            if (toggleEl.src.includes('565654.png') || toggleEl.src.includes('eye-open')) {
                toggleEl.src = eyeClosedUrl;
                toggleEl.setAttribute('alt', 'Mostrar contraseña');
            } else {
                toggleEl.src = eyeOpenUrl;
                toggleEl.setAttribute('alt', 'Ocultar contraseña');
            }
            
            inputEl.focus();
        });

        // Soporte para teclado
        toggleEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleEl.click();
            }
        });
    }

    // Inicializar los toggles
    const togglePassword = document.getElementById('togglePassword');
    const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');

    console.log('togglePassword:', togglePassword);
    console.log('toggleConfirmPassword:', toggleConfirmPassword);

    if (togglePassword) {
        setupPasswordToggle(togglePassword, contrasenaInput);
    } else {
        console.error('❌ NO se encontró togglePassword');
    }

    if (toggleConfirmPassword) {
        setupPasswordToggle(toggleConfirmPassword, confirmarpasswordInput);
    } else {
        console.error('❌ NO se encontró toggleConfirmPassword');
    }

    // Validación de requisitos de contraseña
    const requirements = {
        length: { validator: (password) => password.length >= 8, el: document.getElementById('req-length') },
        upper: { validator: (password) => /[A-Z]/.test(password), el: document.getElementById('req-upper') },
        lower: { validator: (password) => /[a-z]/.test(password), el: document.getElementById('req-lower') },
        number: { validator: (password) => /[0-9]/.test(password), el: document.getElementById('req-number') },
        symbol: { validator: (password) => /[!@#$%^&*-_]/.test(password), el: document.getElementById('req-symbol') }
    };

    function initializeState() {
        if (contrasenaInput) {
            const event = new Event('input', { bubbles: true });
            contrasenaInput.dispatchEvent(event);
        }
        if (confirmarpasswordInput) {
            const ev2 = new Event('input', { bubbles: true });
            confirmarpasswordInput.dispatchEvent(ev2);
        }
    }

    // Validación en tiempo real de contraseña
    if (contrasenaInput) {
        contrasenaInput.addEventListener('input', () => {
            const password = contrasenaInput.value;
            Object.values(requirements).forEach(req => {
                if (req.el) req.el.classList.toggle('met', req.validator(password));
            });
            checkPasswordMatch();
        });
    }

    // Validación de coincidencia de contraseñas
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

    initializeState();

    // Manejo del envío del formulario
    if (registroForm) {
        registroForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const password = contrasenaInput.value;
            const allReqsMet = Object.values(requirements).every(req => req.validator(password));
            const passwordsMatch = contrasenaInput.value === confirmarpasswordInput.value;

            if (!allReqsMet) {
                if (window.Swal) {
                    Swal.fire({ icon: 'error', title: 'Error', text: 'La contraseña no cumple con los requisitos de seguridad' });
                } else {
                    alert('La contraseña no cumple con todos los requisitos de seguridad.');
                }
                return;
            }
            if (!passwordsMatch) {
                if (window.Swal) {
                    Swal.fire({ icon: 'error', title: 'Error', text: 'Las contraseñas no coinciden.' });
                } else {
                    alert('Las contraseñas no coinciden.');
                }
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
                    if (window.Swal) {
                        Swal.fire({ icon: 'error', title: 'Error', text: result.error || 'Error en el registro' });
                    } else {
                        alert(`Error: ${result.error}`);
                    }
                }
            } catch (error) {
                console.error('Error de conexión:', error);
                if (window.Swal) {
                    Swal.fire({ icon: 'error', title: 'Error de conexión', text: 'No se pudo conectar con el servidor.' });
                } else {
                    alert('No se pudo conectar con el servidor.');
                }
            }
        });
    }
});