(function() {
    'use strict';
    
    console.log('video.js iniciado');
    
    // Esperar a que el DOM esté completamente listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initVideoApp);
    } else {
        initVideoApp();
    }

    function initVideoApp() {
        console.log('Inicializando aplicación de videos');
        
        const videoGrid = document.getElementById('video-grid');
        
        if (!videoGrid) {
            console.log('No se encontró el grid de videos en esta página');
            return;
        }

        const searchInput = document.getElementById('search-input');
        const searchButton = document.getElementById('search-button');
        const adminForm = document.getElementById('adminExerciseForm');
        const favoritesFilterCheckbox = document.getElementById('favorites-filter');
        const groupFilterSelect = document.getElementById('muscle-group-filter'); 
        
        const videoModal = document.getElementById('videoModal');
        const modalVideoPlayer = document.getElementById('modalVideoPlayer');
        const modalCloseBtn = document.getElementById('modalCloseBtn');
        const modalOverlay = document.getElementById('modalOverlay');

        // Verificar elementos esenciales
        if (!videoModal || !modalVideoPlayer) {
            console.warn('Elementos del modal no encontrados');
        }

        const showErrorMessage = (message) => {
            console.error('Error:', message);
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'error',
                    title: message,
                    showConfirmButton: false,
                    timer: 3000,
                    timerProgressBar: true
                });
            } else {
                alert(message);
            }
        };

        const showSuccessMessage = (message) => {
            console.log('Éxito:', message);
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'success',
                    title: message,
                    showConfirmButton: false,
                    timer: 3000,
                    timerProgressBar: true
                });
            } else {
                alert(message);
            }
        };

        // Función para filtrar videos
        const filterVideos = () => {
            if (!videoGrid || !groupFilterSelect) return;

            const searchTerm = searchInput.value.toLowerCase();
            const showOnlyFavorites = favoritesFilterCheckbox.checked;
            const activeGroup = groupFilterSelect.value; 

            const videoCards = videoGrid.querySelectorAll('.video-card');
            let visibleCount = 0;

            videoCards.forEach(card => {
                const title = card.dataset.title.toLowerCase();
                const group = card.dataset.group;
                const isFavorited = card.dataset.favorited === 'true';

                const matchesSearch = title.includes(searchTerm);
                const matchesGroup = (activeGroup === 'all' || activeGroup === group);
                const matchesFavorites = (!showOnlyFavorites || isFavorited);

                if (matchesSearch && matchesGroup && matchesFavorites) {
                    card.style.display = 'block';
                    visibleCount++;
                } else {
                    card.style.display = 'none';
                }
            });

            // Manejar mensaje de no resultados
            const existingNoResults = videoGrid.querySelector('.no-results-message');
            if (visibleCount === 0) {
                if (!existingNoResults) {
                    const noResultsMsg = document.createElement('p');
                    noResultsMsg.className = 'no-results-message';
                    noResultsMsg.textContent = 'No se encontraron videos que coincidan con tu búsqueda.';
                    noResultsMsg.style.gridColumn = '1 / -1';
                    noResultsMsg.style.textAlign = 'center';
                    noResultsMsg.style.padding = '2rem';
                    noResultsMsg.style.color = '#666';
                    videoGrid.appendChild(noResultsMsg);
                }
            } else if (existingNoResults) {
                existingNoResults.remove();
            }
        };

        // Función para abrir el modal del video
        const openVideoModal = (videoSrc, videoTitle) => {
            console.log('Abriendo modal:', { videoSrc, videoTitle });
            
            if (!videoModal || !modalVideoPlayer) {
                showErrorMessage('No se puede cargar el reproductor de video.');
                return;
            }
            
            try {
                // Configurar el video
                modalVideoPlayer.src = videoSrc;
                modalVideoPlayer.setAttribute('title', videoTitle);
                
                // Actualizar el título en el modal si existe
                const modalTitle = document.getElementById('modalVideoTitle');
                if (modalTitle) {
                    modalTitle.textContent = videoTitle;
                }
                
                // Mostrar el modal
                videoModal.style.display = 'flex';
                document.body.style.overflow = 'hidden';
                
                // Cargar el video
                modalVideoPlayer.load();
                
                console.log('Modal abierto correctamente');
                
            } catch (error) {
                console.error('Error al abrir el modal:', error);
                showErrorMessage('Error al cargar el video.');
            }
        };

        // Función para cerrar el modal del video
        const closeVideoModal = () => {
            if (!videoModal || !modalVideoPlayer) return;
            
            console.log('Cerrando modal');
            
            // Pausar el video
            modalVideoPlayer.pause();
            
            // Limpiar la fuente para liberar recursos
            modalVideoPlayer.removeAttribute('src');
            modalVideoPlayer.load();
            
            // Ocultar el modal
            videoModal.style.display = 'none';
            document.body.style.overflow = '';
        };

        // Configurar event listeners del modal
        if (modalCloseBtn) {
            modalCloseBtn.addEventListener('click', closeVideoModal);
        }
        
        if (modalOverlay) {
            modalOverlay.addEventListener('click', closeVideoModal);
        }

        // Cerrar modal con tecla Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && videoModal && videoModal.style.display === 'flex') {
                closeVideoModal();
            }
        });

        // Configurar event listeners de filtros
        if (searchButton) {
            searchButton.addEventListener('click', filterVideos);
        }
        
        if (searchInput) {
            searchInput.addEventListener('input', filterVideos);
        }

        if (favoritesFilterCheckbox) {
            favoritesFilterCheckbox.addEventListener('change', filterVideos);
        }

        if (groupFilterSelect) {
            groupFilterSelect.addEventListener('change', filterVideos);
        }

        // Función para manejar el toggle de favoritos
        const toggleFavorite = async (favoriteButton, card) => {
            const videoIdString = card.dataset.videoId;
            
            if (!videoIdString) {
                showErrorMessage('ID de video no encontrado.');
                return;
            }

            const videoId = parseInt(videoIdString, 10);

            console.log('Toggle favorite:', videoId);

            try {
                const response = await fetch('/api/users/favorites/toggle', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ videoId: videoId })
                });
                
                const data = await response.json();
                
                if (response.ok && data.success) {
                    // Actualizar UI
                    favoriteButton.classList.toggle('active', data.favorited);
                    card.dataset.favorited = data.favorited;
                    
                    // Mostrar mensaje
                    if (data.favorited) {
                        showSuccessMessage('Ejercicio agregado a favoritos');
                    } else {
                        showSuccessMessage('Ejercicio removido de favoritos');
                    }
                    
                    // Re-filtrar si estamos mostrando solo favoritos
                    if (favoritesFilterCheckbox.checked) {
                        filterVideos();
                    }
                } else {
                    showErrorMessage(data.error || 'No se pudo actualizar el favorito.');
                }
            } catch (error) {
                console.error('Error al toggle favorito:', error);
                showErrorMessage('Error de conexión. Intenta de nuevo.');
            }
        };

        // Función para manejar la reproducción de video
        const playVideo = (card) => {
            const videoSrc = card.dataset.videoSrc;
            const videoTitle = card.dataset.title;
            
            console.log('Intentando reproducir:', { videoSrc, videoTitle });
            
            if (videoSrc) {
                openVideoModal(videoSrc, videoTitle);
            } else {
                showErrorMessage('No se encontró la ruta del video.');
            }
        };

        // Configurar event listeners para las tarjetas de video
        const setupVideoCardListeners = () => {
            const favoriteButtons = videoGrid.querySelectorAll('.favorite-btn');
            const playButtons = videoGrid.querySelectorAll('.play-btn');
            const playOverlays = videoGrid.querySelectorAll('.play-overlay');
            const videoThumbnails = videoGrid.querySelectorAll('.video-thumbnail');
            const videoCards = videoGrid.querySelectorAll('.video-card');

            console.log('Configurando listeners:', {
                favoriteButtons: favoriteButtons.length,
                playButtons: playButtons.length,
                playOverlays: playOverlays.length,
                videoThumbnails: videoThumbnails.length,
                videoCards: videoCards.length
            });

            // Botones de favoritos
            favoriteButtons.forEach(button => {
                button.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Clic en favorito');
                    const card = this.closest('.video-card');
                    toggleFavorite(this, card);
                });
            });

            // Botones de play
            playButtons.forEach(button => {
                button.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Clic en botón play');
                    const card = this.closest('.video-card');
                    playVideo(card);
                });
            });

            // Overlays de play
            playOverlays.forEach(overlay => {
                overlay.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Clic en overlay play');
                    const card = this.closest('.video-card');
                    playVideo(card);
                });
            });

            // Miniaturas
            videoThumbnails.forEach(thumbnail => {
                thumbnail.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Clic en miniatura');
                    const card = this.closest('.video-card');
                    playVideo(card);
                });
            });

            // Tarjetas completas (como fallback)
            videoCards.forEach(card => {
                card.addEventListener('click', function(e) {
                    // Solo activar si no se hizo clic en elementos interactivos
                    if (!e.target.closest('.favorite-btn') && 
                        !e.target.closest('.play-btn') && 
                        !e.target.closest('.play-overlay')) {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('Clic en tarjeta de video');
                        playVideo(this);
                    }
                });
            });
        };

        // Inicializar listeners después de un pequeño delay
        setTimeout(setupVideoCardListeners, 100);

        // También configurar el listener del grid como backup
        videoGrid.addEventListener('click', (e) => {
            const favoriteButton = e.target.closest('.favorite-btn');
            if (favoriteButton) {
                e.preventDefault();
                e.stopPropagation();
                const card = favoriteButton.closest('.video-card');
                toggleFavorite(favoriteButton, card);
                return;
            }

            const playButton = e.target.closest('.play-btn');
            if (playButton) {
                e.preventDefault();
                e.stopPropagation();
                const card = playButton.closest('.video-card');
                playVideo(card);
                return;
            }

            const playOverlay = e.target.closest('.play-overlay');
            if (playOverlay) {
                e.preventDefault();
                e.stopPropagation();
                const card = playOverlay.closest('.video-card');
                playVideo(card);
                return;
            }

            const thumbnail = e.target.closest('.video-thumbnail');
            if (thumbnail) {
                e.preventDefault();
                e.stopPropagation();
                const card = thumbnail.closest('.video-card');
                playVideo(card);
                return;
            }
        });

        // Manejo del formulario admin
        if (adminForm) {
            console.log('Formulario admin encontrado');
            
            adminForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(adminForm);

                const grupoMuscularSelect = formData.get('grupo_muscular');
                const grupoMuscularOtro = formData.get('gruculo_muscular_otro');

                if (grupoMuscularSelect === 'Otro' && grupoMuscularOtro) {
                    formData.set('grupo_muscular', grupoMuscularOtro);
                }

                if (typeof Swal !== 'undefined') {
                    Swal.fire({
                        title: 'Subiendo ejercicio',
                        text: 'Por favor espera...',
                        allowOutsideClick: false,
                        didOpen: () => {
                            Swal.showLoading();
                        }
                    });
                }

                try {
                    const response = await fetch('/api/admin/upload-exercise', {
                        method: 'POST',
                        body: formData,
                    });

                    const result = await response.json();

                    if (response.ok && result.success) {
                        if (typeof Swal !== 'undefined') {
                            Swal.fire({
                                icon: 'success',
                                title: '¡Éxito!',
                                text: 'Ejercicio subido correctamente.'
                            });
                        }
                        adminForm.reset();
                        const otroInput = document.getElementById('grupo_muscular_otro_container');
                        if (otroInput) otroInput.style.display = 'none';
                        setTimeout(() => window.location.reload(), 1500);
                    } else {
                        if (typeof Swal !== 'undefined') {
                            Swal.fire({
                                icon: 'error',
                                title: 'Error al subir',
                                text: result.error || 'Ocurrió un error desconocido.'
                            });
                        }
                    }
                } catch (error) {
                    if (typeof Swal !== 'undefined') {
                        Swal.fire({
                            icon: 'error',
                            title: 'Error de Conexión',
                            text: 'No se pudo conectar con el servidor. Intenta de nuevo.'
                        });
                    }
                }
            });

            // Manejar campo "Otro" en grupo muscular
            const grupoMuscularSelect = adminForm.querySelector('select[name="grupo_muscular"]');
            const grupoMuscularOtroContainer = document.getElementById('grupo_muscular_otro_container');
            
            if (grupoMuscularSelect && grupoMuscularOtroContainer) {
                grupoMuscularSelect.addEventListener('change', function() {
                    if (this.value === 'Otro') {
                        grupoMuscularOtroContainer.style.display = 'block';
                        grupoMuscularOtroContainer.querySelector('input').required = true;
                    } else {
                        grupoMuscularOtroContainer.style.display = 'none';
                        grupoMuscularOtroContainer.querySelector('input').required = false;
                        grupoMuscularOtroContainer.querySelector('input').value = '';
                    }
                });
            }
        }

        // Inicializar filtros
        filterVideos();

        console.log('Aplicación de videos inicializada correctamente');
    }
})();