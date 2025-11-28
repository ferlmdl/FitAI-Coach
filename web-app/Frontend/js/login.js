document.addEventListener('DOMContentLoaded', function() {
    
    const loginForm = document.getElementById('loginForm');
    const passwordInput = document.getElementById('loginPassword');
    const togglePassword = document.getElementById('loginTogglePassword');
    
    console.log('Elementos encontrados:', {
        loginForm: !!loginForm,
        passwordInput: !!passwordInput,
        togglePassword: !!togglePassword
    });

    const eyeOpenUrl = 'https://cdn-icons-png.flaticon.com/512/565/565654.png';
    const eyeClosedUrl = 'https://cdn-icons-png.flaticon.com/512/565/565655.png';

    function togglePasswordVisibility() {
        if (!passwordInput || !togglePassword) {
            return;
        }

        const isPassword = passwordInput.type === 'password';
        passwordInput.type = isPassword ? 'text' : 'password';
        
        togglePassword.src = isPassword ? eyeOpenUrl : eyeClosedUrl;
        togglePassword.alt = isPassword ? 'Ocultar contraseña' : 'Mostrar contraseña';
        
    }

    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', togglePasswordVisibility);
        
        togglePassword.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                togglePasswordVisibility();
            }
        });
        
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('loginEmail').value;
            const password = passwordInput.value;

            if (!email || !password) {
                if (window.Swal) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: 'Por favor completa todos los campos'
                    });
                } else {
                    alert('Por favor completa todos los campos.');
                }
                return;
            }

            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email: email,
                        password: password
                    })
                });

                const result = await response.json();

                if (response.ok) {
                    if (window.SwalToast) {
                        SwalToast.fire({
                            icon: 'success',
                            title: 'Bienvenido de nuevo!'
                        });
                    }
                    setTimeout(() => {
                        window.location.href = '/';
                    }, 1000);
                } else {
                    console.error('❌ Error en login:', result.error);
                    if (window.Swal) {
                        Swal.fire({
                            icon: 'error',
                            title: 'Error',
                            text: result.error || 'Credenciales inválidas'
                        });
                    }
                }
            } catch (error) {
                if (window.Swal) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error de conexión',
                        text: 'No se pudo conectar con el servidor'
                    });
                }
            }
        });
    }
});