document.addEventListener('DOMContentLoaded', () => {
    console.log('register.js cargado');

    const registroForm = document.getElementById('registroForm');
    const contrasenaInput = document.getElementById('password');
    const confirmarpasswordInput = document.getElementById('confirmarpassword');
    const passwordMatch = document.getElementById('passwordMatch');

    if (!contrasenaInput) console.warn('No se encontró #password en la página');
    if (!confirmarpasswordInput) console.warn('No se encontró #confirmarpassword en la página');

    const requirements = {
        length: { validator: (password) => password.length >= 8, el: document.getElementById('req-length') },
        upper: { validator: (password) => /[A-Z]/.test(password), el: document.getElementById('req-upper') },
        lower: { validator: (password) => /[a-z]/.test(password), el: document.getElementById('req-lower') },
        number: { validator: (password) => /[0-9]/.test(password), el: document.getElementById('req-number') },
        symbol: { validator: (password) => /[!@#$%^&*-_]/.test(password), el: document.getElementById('req-symbol') }
    };

    function setupPasswordToggle(toggleEl, inputEl) {
        if (!toggleEl || !inputEl) return;

        if (!toggleEl.hasAttribute('tabindex')) toggleEl.setAttribute('tabindex', '0');
        if (!toggleEl.hasAttribute('role')) toggleEl.setAttribute('role', 'button');

        const svgs = toggleEl.querySelectorAll('svg');
        let eyeOpen = svgs[0] || toggleEl.querySelector('.eye-open') || toggleEl.querySelector('#eye-open') || null;
        let eyeClosed = svgs[1] || toggleEl.querySelector('.eye-closed') || toggleEl.querySelector('#eye-closed') || null;
        
        const isHidden = inputEl.type === 'password';
        if (eyeOpen) eyeOpen.style.display = isHidden ? 'block' : 'none';
        if (eyeClosed) eyeClosed.style.display = isHidden ? 'none' : 'block';
        toggleEl.setAttribute('aria-pressed', (!isHidden).toString());

        toggleEl.addEventListener('click', function() {
            const currentlyHidden = inputEl.type === 'password';
            inputEl.type = currentlyHidden ? 'text' : 'password';

            if (eyeOpen && eyeClosed) {
                if (inputEl.type === 'password') {
                    eyeOpen.style.display = 'block';
                    eyeClosed.style.display = 'none';
                } else {
                    eyeOpen.style.display = 'none';
                    eyeClosed.style.display = 'block';
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
    const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');

    setupPasswordToggle(togglePassword, contrasenaInput);
    setupPasswordToggle(toggleConfirmPassword, confirmarpasswordInput);

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

    initializeState();

    if (registroForm) {
        registroForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const password = contrasenaInput.value;
            const allReqsMet = Object.values(requirements).every(req => req.validator(password));
            const passwordsMatch = contrasenaInput.value === confirmarpasswordInput.value;

            if (!allReqsMet) {
                if (window.Swal) {
                    Swal.fire({ icon: 'error', title: 'Error', text: 'La contraseña no cumple con los requisitos de seguridad ' });
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
