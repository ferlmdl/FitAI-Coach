document.addEventListener("DOMContentLoaded", function() {
    
    const isAuthenticated = () => {
        return localStorage.getItem('authToken') !== null;
    };
    const videoGallery = document.querySelector('.video-gallery');

    if (videoGallery) {
        videoGallery.addEventListener('click', async (e) => {
            if (e.target.classList.contains('btn-delete')) {
                const button = e.target;
                const videoId = button.dataset.videoId;
                const videoRoute = button.dataset.videoRoute;

                let confirmed = false;
                if (window.Swal) {
                    const r = await Swal.fire({
                        title: '¿Seguro?',
                        text: 'Esta acción no se puede deshacer.',
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonText: 'Sí, borrar',
                        cancelButtonText: 'Cancelar'
                    });
                    confirmed = r.isConfirmed;
                } else {
                    confirmed = confirm('¿Estás seguro de que quieres borrar este video? Esta acción no se puede deshacer.');
                }

                if (!confirmed){
                    return;
                };

                try {
                    const response = await fetch(`/api/videos/${videoId}`, {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ videoRoute: videoRoute })
                    });

                    const result = await response.json();

                    if (response.ok) {
                        button.closest('.video-item').remove();
                        Swal.fire({
                            icon: 'success',
                            title: '¡Borrado!',
                            text: 'El video ha sido eliminado exitosamente.',
                            confirmButtonColor: '#af4717', // Usamos tu color naranja corporativo
                            confirmButtonText: 'Aceptar',
                            background: '#ffffffff',         // Fondo oscuro para combinar con tu tema
                            color: '#000000ff'               // Texto blanco
                        });
                    } else {
                        throw new Error(result.error || 'No se pudo borrar el video.');
                    }

                } catch (error) {
                    console.error('Error al borrar video:', error);
                    if (window.Swal) {
                        Swal.fire({ icon: 'error', title: 'Error', text: error.message });
                    } else {
                        alert(`Error: ${error.message}`);
                    }
                }
            }
        });
    }
    const loadComponent = (selector, url) => {
        const authToken = localStorage.getItem('authToken');
        fetch(url, {
            headers: {
                'Authorization': authToken ? `Bearer ${authToken}` : ''
            }
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error("Network response was not ok");
                }
                return response.text();
            })
            .then(data => {
                document.querySelector(selector).innerHTML = data;
                
                // Agregar manejador para el botón de cerrar sesión si existe
                const logoutBtn = document.getElementById('logoutBtn');
                if (logoutBtn) {
                    logoutBtn.addEventListener('click', handleLogout);
                }
            })
            .catch(error => {
                console.error(`Error loading component from ${url}:`, error);
            });
    };

    // Función para manejar el cierre de sesión
    const handleLogout = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('/api/auth/logout', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });

            if (response.ok) {
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                window.location.href = '/login';
            }
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
        }
    };
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    const body = document.body; // IMPORTANTE: Apuntamos al body, no al html

    // Función para aplicar el tema
    const applyTheme = (theme) => {
        // Guardamos en memoria
        localStorage.setItem('theme', theme);

        // Lógica de Clases CSS (Esto conecta con tu style.css)
        if (theme === 'light') {
            body.classList.add('light-mode'); // Activa las variables claras
        } else {
            body.classList.remove('light-mode'); // Vuelve al oscuro por defecto
        }

        // Lógica de Íconos (Sol / Luna)
        if (themeIcon) {
            if (theme === 'dark') {
                themeIcon.classList.remove('fa-sun');
                themeIcon.classList.add('fa-moon');
            } else {
                themeIcon.classList.remove('fa-moon');
                themeIcon.classList.add('fa-sun');
            }
        }
    };

    // 1. Verificar preferencia al cargar
    const savedTheme = localStorage.getItem('theme');

    if (savedTheme) {
        applyTheme(savedTheme);
    } else {
        // Por defecto arrancamos en dark si no hay nada guardado
        applyTheme('dark'); 
    }

    // 2. Evento del botón
    if (themeToggle) {
        themeToggle.addEventListener('click', (e) => {
            e.preventDefault(); // Evita saltos si es un enlace
            
            // Verificamos si ya tiene la clase para saber el estado actual
            const isLight = body.classList.contains('light-mode');
            
            // Si es light, pasamos a dark. Si no, a light.
            const newTheme = isLight ? 'dark' : 'light';
            
            applyTheme(newTheme);
        });
    }
});
