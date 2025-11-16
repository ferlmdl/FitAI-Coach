// Frontend/js/galery.js
document.addEventListener('DOMContentLoaded', () => {
    
    console.log('🎬 galery.js iniciado');

    // --- Elementos del DOM ---
    const galleryGrid = document.getElementById('galleryGrid');
    if (!galleryGrid) {
        console.log('No hay galería en esta página.');
        return;
    }

    const searchInput = document.getElementById('searchInput');
    const typeFilter = document.getElementById('exerciseTypeFilter');
    const sortFilter = document.getElementById('sortFilter');
    const totalVideosEl = document.getElementById('totalVideos');
    
    // Almacenamos todos los videos en un array
    let allVideoCards = Array.from(galleryGrid.querySelectorAll('.gallery-card'));
    
    // --- Elementos del Modal de Video ---
    const videoModal = document.getElementById('videoModal');
    const videoPlayer = document.getElementById('modalVideoPlayer');
    const videoSource = document.getElementById('modalVideoSource');
    const modalVideoTitle = document.getElementById('modalVideoTitle');
    const closeModalBtn = videoModal.querySelector('.modal-close-video');

    // --- Elementos del Modal de Borrado ---
    const deleteModal = document.getElementById('deleteModal');
    const closeDeleteModalBtn = deleteModal.querySelector('.modal-close');
    const cancelDeleteBtn = deleteModal.querySelector('.btn-secondary.cancel-delete');
    const confirmDeleteBtn = deleteModal.querySelector('.btn-danger.confirm-delete');
    let videoToDelete = null; // Guardar temporalmente el ID y ruta

    // --- Funciones ---

    /**
     * 1. Poblar el filtro de "Tipo de Ejercicio" y stats
     */
    function setupFiltersAndStats() {
        const types = new Set();
        allVideoCards.forEach(card => {
            const type = card.dataset.type || 'undefined'; // Manejar tipos no definidos
            types.add(type);
        });

        // Limpiar opciones existentes (excepto la primera)
        typeFilter.innerHTML = '<option value="all">Todos los tipos</option>';
        
        types.forEach(type => {
            if (type && type.trim() !== '') {
                const option = document.createElement('option');
                option.value = type;
                option.textContent = type.charAt(0).toUpperCase() + type.slice(1); // Pone la primera letra en mayúscula
                typeFilter.appendChild(option);
            }
        });

        updateVideoCount();
    }

    /**
     * 2. Actualizar el contador de videos visibles
     */
    function updateVideoCount() {
        const visibleVideos = allVideoCards.filter(card => card.style.display !== 'none').length;
        totalVideosEl.textContent = visibleVideos;
    }

    /**
     * 3. Formatear duración (para las miniaturas)
     */
    function formatDuration(seconds) {
        const min = Math.floor(seconds / 60);
        const sec = Math.floor(seconds % 60);
        return `${min}:${sec < 10 ? '0' : ''}${sec}`;
    }

    /**
     * 4. Cargar duraciones de los videos
     */
    allVideoCards.forEach(card => {
        const videoEl = card.querySelector('.video-thumbnail');
        const durationEl = card.querySelector('.video-duration');
        
        videoEl.onloadedmetadata = () => {
            durationEl.textContent = formatDuration(videoEl.duration);
        };
        // Si el video ya está cargado ( caché)
        if (videoEl.readyState >= 1) {
             durationEl.textContent = formatDuration(videoEl.duration);
        }
    });


    /**
     * 5. Función principal para filtrar y ordenar
     */
    function filterAndSortVideos() {
        const titleSearch = searchInput.value.toLowerCase();
        const typeSearch = typeFilter.value;
        const sortValue = sortFilter.value;

        // 1. Filtrar
        allVideoCards.forEach(card => {
            const title = card.dataset.title.toLowerCase();
            const type = card.dataset.type || 'undefined';

            const matchesTitle = title.includes(titleSearch);
            const matchesType = (typeSearch === "all") || (type === typeSearch);
            
            const shouldShow = matchesTitle && matchesType;
            card.style.display = shouldShow ? 'flex' : 'none'; // 'flex' porque la tarjeta es un flex container
        });

        // 2. Obtener los videos visibles para ordenar
        let visibleCards = allVideoCards.filter(card => card.style.display !== 'none');

        // 3. Ordenar
        visibleCards.sort((a, b) => {
            const dateA = new Date(a.dataset.date);
            const dateB = new Date(b.dataset.date);
            const titleA = a.dataset.title.toLowerCase();
            const titleB = b.dataset.title.toLowerCase();

            switch (sortValue) {
                case 'newest':
                    return dateB - dateA;
                case 'oldest':
                    return dateA - dateB;
                case 'title':
                    return titleA.localeCompare(titleB);
                default:
                    return dateB - dateA;
            }
        });

        // 4. Re-insertar en el DOM en el orden correcto
        visibleCards.forEach(card => {
            galleryGrid.appendChild(card);
        });

        // 5. Actualizar contador
        updateVideoCount();
    }


    /**
     * 6. Lógica para el Modal de Video
     */
    function openVideoModal(card) {
        const title = card.dataset.title;
        const videoRoute = card.querySelector('.video-thumbnail source').src;

        modalVideoTitle.textContent = title;
        videoSource.src = videoRoute;

        videoModal.classList.add('is-active'); // Usamos la clase para mostrarlo
        videoPlayer.load();
        videoPlayer.play();
    }

    function closeVideoModal() {
        videoModal.classList.remove('is-active');
        videoPlayer.pause();
        videoSource.src = "";
    }


    /**
     * 7. Lógica para el Modal de Borrado
     */
    function openDeleteModal(button) {
        videoToDelete = {
            id: button.dataset.videoId,
            route: button.dataset.videoRoute,
            card: button.closest('.gallery-card')
        };
        deleteModal.classList.add('is-active');
    }

    function closeDeleteModal() {
        deleteModal.classList.remove('is-active');
        videoToDelete = null;
    }

    async function confirmDelete() {
        if (!videoToDelete) return;

        const { id, route, card } = videoToDelete;

        try {
            // Mostrar spinner en el botón
            confirmDeleteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Eliminando...';
            confirmDeleteBtn.disabled = true;

            const response = await fetch(`/api/videos/delete/${id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ video_route: route }) // Enviar la ruta para borrar de Supabase Storage
            });

            const data = await response.json();

            if (response.ok && data.success) {
                Swal.fire('¡Borrado!', 'Tu video ha sido eliminado.', 'success');
                
                // Eliminar del DOM con animación
                card.style.transition = 'opacity 0.5s, transform 0.5s';
                card.style.opacity = '0';
                card.style.transform = 'scale(0.8)';
                
                setTimeout(() => {
                    card.remove();
                    // Actualizar el array de videos
                    allVideoCards = allVideoCards.filter(c => c !== card);
                    filterAndSortVideos(); // Re-filtrar y actualizar contador
                }, 500);

                closeDeleteModal();

            } else {
                Swal.fire('Error', data.error || 'No se pudo borrar el video.', 'error');
            }

        } catch (error) {
            console.error('Error en el fetch de borrado:', error);
            Swal.fire('Error', 'Error de conexión al intentar borrar.', 'error');
        } finally {
            // Restaurar botón
            confirmDeleteBtn.innerHTML = 'Eliminar Video';
            confirmDeleteBtn.disabled = false;
            videoToDelete = null; // Limpiar
        }
    }


    // --- Event Listeners ---

    // Filtros
    searchInput.addEventListener('input', filterAndSortVideos);
    typeFilter.addEventListener('change', filterAndSortVideos);
    sortFilter.addEventListener('change', filterAndSortVideos);

    // Delegación de eventos en el Grid
    galleryGrid.addEventListener('click', (e) => {
        // Clic en el botón de borrar
        const deleteButton = e.target.closest('.delete-video');
        if (deleteButton) {
            e.preventDefault();
            openDeleteModal(deleteButton);
            return;
        }

        // Clic en el botón de "Ver Análisis"
        const analysisButton = e.target.closest('.view-analysis');
        if (analysisButton) {
            e.preventDefault();
            const videoId = analysisButton.dataset.videoId;
            window.location.href = `/analysis/${videoId}`; // Redirigir a la página de análisis
            return;
        }

        // Clic en el overlay de reproducir
        const playButton = e.target.closest('.play-overlay, .video-thumbnail-container');
        if (playButton) {
            e.preventDefault();
            const card = playButton.closest('.gallery-card');
            openVideoModal(card);
        }
    });

    // Listeners para cerrar Modales
    closeModalBtn.addEventListener('click', closeVideoModal);
    videoModal.addEventListener('click', (e) => {
        if (e.target === videoModal) closeVideoModal();
    });

    closeDeleteModalBtn.addEventListener('click', closeDeleteModal);
    cancelDeleteBtn.addEventListener('click', closeDeleteModal);
    deleteModal.addEventListener('click', (e) => {
        if (e.target === deleteModal) closeDeleteModal();
    });

    // Listener para confirmar borrado
    confirmDeleteBtn.addEventListener('click', confirmDelete);

    // --- Inicialización ---
    setupFiltersAndStats();
    filterAndSortVideos();
});