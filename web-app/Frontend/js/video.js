document.addEventListener('DOMContentLoaded', () => {

    console.log('🎬 video.js iniciado');

    // Elementos del DOM
    const videoGrid = document.getElementById('video-grid');
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    const adminForm = document.getElementById('adminExerciseForm');
    const favoritesFilterCheckbox = document.getElementById('favorites-filter');
    
    // --- NOTA: 'adminMessage' y 'errorBox' han sido eliminados ---

    // Elementos del modal
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


    // --- FUNCIÓN DE MENSAJE REEMPLAZADA POR SWEETALERT ---
    const showErrorMessage = (message) => {
        if (typeof Swal === 'undefined') {
            console.error('SweetAlert2 (Swal) no está cargado.');
            alert(message); // Fallback si SweetAlert no carga
            return;
        }

        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'error',
            title: message,
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true
        });
    };


    // Función para filtrar videos
    const filterVideos = () => {
        if (!searchInput || !videoGrid || !favoritesFilterCheckbox) return;

        const searchTerm = searchInput.value.toLowerCase();
        const showOnlyFavorites = favoritesFilterCheckbox.checked; 
        
        const videoCards = videoGrid.querySelectorAll('.video-card');
        let visibleCount = 0;

        videoCards.forEach(card => {
            const title = card.querySelector('.video-title').textContent.toLowerCase();
            const category = card.querySelector('.video-category').textContent.toLowerCase();

            const matchesSearch = title.includes(searchTerm) || category.includes(searchTerm);
            const isFavorited = card.querySelector('.favorite-btn.active') !== null;

            let shouldShow = false;

            if (showOnlyFavorites) {
                shouldShow = matchesSearch && isFavorited;
            } else {
                shouldShow = matchesSearch;
            }

            if (shouldShow) {
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

    // Evento para el nuevo checkbox de favoritos
    if (favoritesFilterCheckbox) {
        favoritesFilterCheckbox.addEventListener('change', filterVideos);
    }


    // Función para abrir el modal con el video
    const openVideoModal = (videoSrc) => {
        if (!videoModal || !modalVideoPlayer) {
            console.error('❌ Elementos del modal no encontrados');
            return;
        }
        console.log('🎥 Abriendo modal con video:', videoSrc);
        modalVideoPlayer.src = videoSrc;
        videoModal.style.display = 'grid';
        modalVideoPlayer.load();
        modalVideoPlayer.focus();
    };


    // Función para cerrar el modal
    const closeVideoModal = () => {
        if (!videoModal || !modalVideoPlayer) return;
        console.log('❌ Cerrando modal de video');
        modalVideoPlayer.pause();
        modalVideoPlayer.src = '';
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
                        filterVideos(); 
                    } else {
                        // --- LLAMADA A SWEETALERT ---
                        showErrorMessage(data.error || 'No se pudo guardar el favorito.');
                    }
                } catch (error) {
                    console.error('❌ Error en fetch de favorito:', error);
                    // --- LLAMADA A SWEETALERT ---
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
                    // --- LLAMADA A SWEETALERT ---
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


    // --- MANEJO DEL FORMULARIO DE ADMIN MODIFICADO CON SWEETALERT ---
    if (adminForm) {
        adminForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('📤 Enviando formulario de administrador');
            const formData = new FormData(adminForm);

            // 1. Mostrar modal de "Cargando"
            Swal.fire({
                title: 'Subiendo ejercicio',
                text: 'Por favor espera...',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            try {
                const response = await fetch('/api/admin/upload-exercise', {
                    method: 'POST',
                    body: formData,
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    // 2. Mostrar modal de "Éxito"
                    Swal.fire({
                        icon: 'success',
                        title: '¡Éxito!',
                        text: 'Ejercicio subido correctamente.'
                    });
                    adminForm.reset();
                    setTimeout(() => window.location.reload(), 1500);

                } else {
                    // 3. Mostrar modal de "Error" (del servidor)
                    Swal.fire({
                        icon: 'error',
                        title: 'Error al subir',
                        text: result.error || 'Ocurrió un error desconocido.'
                    });
                }

            } catch (error) {
                console.error('❌ Error en fetch de admin:', error);
                // 4. Mostrar modal de "Error" (de conexión)
                Swal.fire({
                    icon: 'error',
                    title: 'Error de Conexión',
                    text: 'No se pudo conectar con el servidor. Intenta de nuevo.'
                });
            }
        });
    }

    console.log('🎉 video.js completamente inicializado');
});
