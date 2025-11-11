document.addEventListener('DOMContentLoaded', () => {
    
    console.log('🎬 galery.js iniciado');

    // --- Elementos del DOM ---
    const gallery = document.getElementById('video-gallery');
    if (!gallery) {
        console.log('No hay galería en esta página.');
        return; // Salir si no hay galería (ej. si no hay videos)
    }

    const titleFilter = document.getElementById('filter-title');
    const typeFilter = document.getElementById('filter-type');
    const sortFilter = document.getElementById('filter-sort');
    const noResultsMessage = document.getElementById('no-results-message');
    
    // Almacenamos todos los videos en un array para un mejor rendimiento
    const allVideos = Array.from(gallery.querySelectorAll('.video-item'));
    
    // --- Funciones ---

    /**
     * 1. Poblar el filtro de "Tipo de Ejercicio" dinámicamente
     */
    function populateTypeFilter() {
        const types = new Set();
        allVideos.forEach(video => {
            // Leemos el data-attribute que pusimos en el HBS
            types.add(video.dataset.type);
        });

        types.forEach(type => {
            if (type && type.trim() !== '') {
                const option = document.createElement('option');
                option.value = type;
                option.textContent = type;
                typeFilter.appendChild(option);
            }
        });
    }

    /**
     * 2. Función principal para filtrar y ordenar los videos
     */
    function filterAndSortVideos() {
        const titleSearch = titleFilter.value.toLowerCase();
        const typeSearch = typeFilter.value;
        const sortValue = sortFilter.value;

        let visibleVideos = 0;

        // Primero, filtramos los videos
        const filteredVideos = allVideos.filter(video => {
            const title = video.dataset.title.toLowerCase();
            const type = video.dataset.type;

            const matchesTitle = title.includes(titleSearch);
            const matchesType = (typeSearch === "") || (type === typeSearch); // Muestra todos si la opción es ""

            const shouldShow = matchesTitle && matchesType;
            
            // Ocultamos el video si no coincide
            video.style.display = shouldShow ? 'block' : 'none'; 
            
            if(shouldShow) visibleVideos++;
            
            return shouldShow;
        });

        // Segundo, ordenamos los videos que SÍ son visibles
        filteredVideos.sort((a, b) => {
            // Leemos las fechas de los data-attributes
            const dateA = new Date(a.dataset.created);
            const dateB = new Date(b.dataset.created);

            if (sortValue === 'newest') {
                return dateB - dateA; // Más nuevo (fecha más grande) primero
            } else {
                return dateA - dateB; // Más antiguo (fecha más chica) primero
            }
        });

        // Tercero, los re-insertamos en el DOM en el orden correcto
        // 'appendChild' mueve un elemento si ya existe, poniéndolo al final.
        filteredVideos.forEach(video => {
            gallery.appendChild(video);
        });

        // Mostrar/Ocultar mensaje de "No hay resultados"
        if (visibleVideos === 0) {
            noResultsMessage.style.display = 'block';
        } else {
            noResultsMessage.style.display = 'none';
        }
    }

    /**
     * 3. Lógica para borrar un video
     */
    async function deleteVideo(button) {
        const videoId = button.dataset.videoId;
        const videoItem = button.closest('.video-item');

        // Usamos SweetAlert para confirmar
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: "No podrás revertir esto. El video y su análisis se borrarán.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, ¡bórralo!',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            // Asumo que tu endpoint de borrado es 'DELETE /api/videos/{id}'
            // Ajusta esto si tu ruta es diferente
            try {
                const response = await fetch(`/api/videos/delete/${videoId}`, {
                    method: 'DELETE',
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    Swal.fire(
                        '¡Borrado!',
                        'Tu video ha sido eliminado.',
                        'success'
                    );
                    // Eliminar el video del DOM
                    videoItem.style.transition = 'opacity 0.5s';
                    videoItem.style.opacity = '0';
                    setTimeout(() => {
                        videoItem.remove();
                        // Actualizamos el array 'allVideos' para futuros filtros
                        allVideos.splice(allVideos.indexOf(videoItem), 1);
                        filterAndSortVideos(); // Re-filtramos por si acaso
                    }, 500);

                } else {
                    Swal.fire('Error', data.error || 'No se pudo borrar el video.', 'error');
                }
            } catch (error) {
                console.error('Error en el fetch de borrado:', error);
                Swal.fire('Error', 'Error de conexión al intentar borrar.', 'error');
            }
        }
    }


    // --- Event Listeners ---

    // Añadimos los listeners a los filtros
    titleFilter.addEventListener('input', filterAndSortVideos);
    typeFilter.addEventListener('change', filterAndSortVideos);
    sortFilter.addEventListener('change', filterAndSortVideos);

    // Listener para los botones de borrado (delegación de eventos)
    gallery.addEventListener('click', (e) => {
        const deleteButton = e.target.closest('.btn-delete');
        if (deleteButton) {
            e.preventDefault();
            deleteVideo(deleteButton);
        }
    });

    // --- Inicialización ---
    // Llenamos el filtro de "tipos" y ejecutamos el filtro
    // una vez al cargar la página.
    populateTypeFilter();
    filterAndSortVideos();

});
