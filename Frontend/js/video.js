document.addEventListener('DOMContentLoaded', () => {
    console.log('🎬 video.js iniciado');

    // Elementos del DOM
    const videoGrid = document.getElementById('video-grid');
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    const adminForm = document.getElementById('adminExerciseForm');
    const adminMessage = document.getElementById('admin-message');
    const errorBox = document.getElementById('error-message');
    
    // Elementos del modal (agregados correctamente)
    const videoModal = document.getElementById('videoModal');
    const modalVideoPlayer = document.getElementById('modalVideoPlayer');
    const modalCloseBtn = document.getElementById('modalCloseBtn');
    const modalOverlay = document.getElementById('modalOverlay');

    console.log('📋 Elementos del modal:', {
        videoModal: !!videoModal,
        modalVideoPlayer: !!modalVideoPlayer,
        modalCloseBtn: !!modalCloseBtn,
        modalOverlay: !!modalOverlay
    });

    // Función para mostrar mensajes de error
    const showErrorMessage = (message) => {
        if (!errorBox) return;
        errorBox.textContent = message;
        errorBox.classList.add('show');
        setTimeout(() => {
            errorBox.classList.remove('show');
        }, 3000);
    };

    // Función para filtrar videos
    const filterVideos = () => {
        if (!searchInput || !videoGrid) return;
        const searchTerm = searchInput.value.toLowerCase();
        const videoCards = videoGrid.querySelectorAll('.video-card');
        
        let visibleCount = 0;
        
        videoCards.forEach(card => {
            const title = card.querySelector('.video-title').textContent.toLowerCase();
            const category = card.querySelector('.video-category').textContent.toLowerCase();
            
            if (title.includes(searchTerm) || category.includes(searchTerm)) {
                card.style.display = 'block';
                visibleCount++;
            } else {
                card.style.display = 'none';
            }
        });

        // Mostrar mensaje si no hay resultados
        const noResults = videoGrid.querySelector('.no-results');
        if (visibleCount === 0 && !noResults) {
            const noResultsMsg = document.createElement('p');
            noResultsMsg.className = 'no-results';
            noResultsMsg.textContent = 'No se encontraron videos que coincidan con tu búsqueda.';
            videoGrid.appendChild(noResultsMsg);
        } else if (noResults && visibleCount > 0) {
            noResults.remove();
        }
    };

    // Eventos de búsqueda
    if (searchButton) {
        searchButton.addEventListener('click', filterVideos);
    }
    if (searchInput) {
        searchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                filterVideos();
            }
        });
    }

    // Función para abrir el modal con el video
    const openVideoModal = (videoSrc) => {
        if (!videoModal || !modalVideoPlayer) {
            console.error('❌ Elementos del modal no encontrados');
            return;
        }

        console.log('🎥 Abriendo modal con video:', videoSrc);
        
        // Establecer la fuente del video
        modalVideoPlayer.src = videoSrc;
        
        // Mostrar el modal
        videoModal.style.display = 'grid';
        
        // NO reproducir automáticamente - el usuario debe hacer clic en el botón de play del reproductor
        modalVideoPlayer.load();
        
        // Enfocar el reproductor para accesibilidad
        modalVideoPlayer.focus();
    };

    // Función para cerrar el modal
    const closeVideoModal = () => {
        if (!videoModal || !modalVideoPlayer) return;
        
        console.log('❌ Cerrando modal de video');
        
        // Pausar el video
        modalVideoPlayer.pause();
        
        // Limpiar la fuente
        modalVideoPlayer.src = '';
        
        // Ocultar el modal
        videoModal.style.display = 'none';
    };

    // Eventos del modal
    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', closeVideoModal);
    }
    if (modalOverlay) {
        modalOverlay.addEventListener('click', closeVideoModal);
    }

    // Cerrar modal con tecla ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && videoModal && videoModal.style.display === 'grid') {
            closeVideoModal();
        }
    });

    // Manejo de clics en la grilla de videos
    if (videoGrid) {
        videoGrid.addEventListener('click', async (e) => {
            console.log('🖱️ Click en video grid:', e.target);
            
            // Manejar favoritos
            const favoriteButton = e.target.closest('.favorite-btn');
            if (favoriteButton) {
                e.preventDefault();
                e.stopPropagation();
                
                console.log('❤️ Botón de favorito clickeado');
                const card = favoriteButton.closest('.video-card');
                const videoIdString = card.dataset.videoId;
                
                if (!videoIdString) {
                    console.error('❌ No se encontró videoId');
                    return;
                }

                const videoId = parseInt(videoIdString, 10);
                
                try {
                    const response = await fetch('/api/users/favorites/toggle', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ videoId: videoId })
                    });
                    
                    const data = await response.json();
                    
                    if (response.ok && data.success) {
                        favoriteButton.classList.toggle('active', data.favorited);
                        console.log('✅ Favorito actualizado:', data.favorited);
                    } else {
                        showErrorMessage(data.error || 'No se pudo guardar el favorito.');
                    }
                } catch (error) {
                    console.error('❌ Error en fetch de favorito:', error);
                    showErrorMessage('Error de conexión. Intenta de nuevo.');
                }
                return;
            }

            // Manejar reproducción de video (solo cuando se hace clic en el botón de play)
            const playButton = e.target.closest('.play-btn');
            if (playButton) {
                e.preventDefault();
                e.stopPropagation();
                
                console.log('▶️ Botón de play clickeado');
                const card = playButton.closest('.video-card');
                const videoSrc = card.dataset.videoSrc;
                
                if (videoSrc) {
                    openVideoModal(videoSrc);
                } else {
                    console.error('❌ No se encontró videoSrc');
                    showErrorMessage('No se pudo cargar el video.');
                }
                return;
            }

            // También permitir hacer clic en la miniatura para abrir el video
            const thumbnail = e.target.closest('.video-thumbnail');
            if (thumbnail) {
                e.preventDefault();
                const card = thumbnail.closest('.video-card');
                const videoSrc = card.dataset.videoSrc;
                
                if (videoSrc) {
                    openVideoModal(videoSrc);
                }
            }
        });
    }

    // Manejo del formulario de administrador
    if (adminForm) {
        adminForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('📤 Enviando formulario de administrador');
            
            const formData = new FormData(adminForm);
            
            if (adminMessage) {
                adminMessage.textContent = 'Subiendo, por favor espera...';
                adminMessage.style.color = '#fff';
            }

            try {
                const response = await fetch('/api/admin/upload-exercise', {
                    method: 'POST',
                    body: formData,
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    if (adminMessage) {
                        adminMessage.textContent = '¡Ejercicio subido con éxito!';
                        adminMessage.style.color = 'lightgreen';
                    }
                    adminForm.reset();
                    setTimeout(() => window.location.reload(), 1500);
                } else {
                    if (adminMessage) {
                        adminMessage.textContent = `Error: ${result.error}`;
                        adminMessage.style.color = '#D90429';
                    }
                }

            } catch (error) {
                console.error('❌ Error en fetch de admin:', error);
                if (adminMessage) {
                    adminMessage.textContent = 'Error de conexión con el servidor.';
                    adminMessage.style.color = '#D90429';
                }
            }
        });
    }

    console.log('🎉 video.js completamente inicializado');
});