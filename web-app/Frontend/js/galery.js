document.addEventListener('DOMContentLoaded', () => {

    // --- FUNCIÓN DE FORMATEO (La magia visual) ---
    function formatearAnalisis(analysisData) {
        let data = analysisData;
        
        // Si viene como texto, intentamos convertirlo a objeto
        if (typeof analysisData === 'string') {
            try {
                // Limpieza extra por si acaso
                if (analysisData === "null" || !analysisData) return null;
                data = JSON.parse(analysisData);
            } catch (e) {
                console.error("Error parseando JSON:", e);
                return `<p class="error-msg">Error al leer los datos del análisis.</p>`;
            }
        }

        if (!data || !data.details) return `<p>Análisis en proceso o no disponible.</p>`;

        // Extraer datos
        const summary = data.details.summary || "Análisis completado.";
        const feedbackList = data.details.feedback_list || [];
        const totalErrors = (data.details.total_errors?.depth || 0) + (data.details.total_errors?.form || 0);
        // Capitalizar primera letra del ejercicio
        const exerciseName = data.exercise ? data.exercise.charAt(0).toUpperCase() + data.exercise.slice(1) : "Ejercicio";

        // Construir HTML
        let html = `
            <div class="analysis-result" style="text-align: left; font-family: sans-serif;">
                <p class="analysis-summary" style="font-size: 1.1em; margin-bottom: 15px;">
                    <strong>${summary}</strong>
                </p>
                <hr style="opacity: 0.3;">
                
                <div class="reps-container">
        `;

        feedbackList.forEach(item => {
            const colorStyle = item.type === 'success' ? 'color: #4CAF50;' : 'color: #FF5252;';
            html += `
                <div class="rep-item" style="margin-bottom: 12px; padding: 8px; background: rgba(255,255,255,0.05); border-radius: 5px;">
                    <div style="font-weight: bold;">Repetición ${item.rep}:</div>
                    <div style="font-size: 0.9em; color: #888;">Tiempo: ${item.time}</div>
                    <div style="${colorStyle} margin-top: 2px;">${item.message}</div>
                </div>
            `;
        });

        html += `
                </div>
                <hr style="opacity: 0.3;">
                <div class="analysis-footer" style="margin-top: 10px;">
                    <p><strong>Errores totales:</strong> ${totalErrors}</p>
                    <p><strong>Ejercicio:</strong> ${exerciseName}</p>
                    <p><strong>Puntaje:</strong> ${data.score}/10</p>
                </div>
            </div>
        `;

        return html;
    }

    // --- LÓGICA DE LA GALERÍA ---

    const gallery = document.getElementById('video-gallery');
    
    // Si estamos en la página de Detalle de Análisis (analysis.hbs), ejecutamos el formateo allí
    const analysisPageContainer = document.getElementById('analysis-text-container');
    if (analysisPageContainer) {
        const rawJson = analysisPageContainer.getAttribute('data-raw');
        if (rawJson) {
            analysisPageContainer.innerHTML = formatearAnalisis(rawJson);
        }
    }

    // Si no hay galería, terminamos aquí (pero después de chequear la página de análisis)
    if (!gallery) {
        return; 
    }

    const titleFilter = document.getElementById('filter-title');
    const typeFilter = document.getElementById('filter-type');
    const sortFilter = document.getElementById('filter-sort');
    const noResultsMessage = document.getElementById('no-results-message');
    
    const allVideos = Array.from(gallery.querySelectorAll('.video-item'));
    
    function populateTypeFilter() {
        const types = new Set();
        allVideos.forEach(video => {
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

    function filterAndSortVideos() {
        const titleSearch = titleFilter.value.toLowerCase();
        const typeSearch = typeFilter.value;
        const sortValue = sortFilter.value;

        let visibleVideos = 0;

        const filteredVideos = allVideos.filter(video => {
            const title = video.dataset.title.toLowerCase();
            const type = video.dataset.type;

            const matchesTitle = title.includes(titleSearch);
            const matchesType = (typeSearch === "") || (type === typeSearch); 

            const shouldShow = matchesTitle && matchesType;
            video.style.display = shouldShow ? 'block' : 'none'; 
            
            if(shouldShow) visibleVideos++;
            
            return shouldShow;
        });

        filteredVideos.sort((a, b) => {
            const dateA = new Date(a.dataset.created);
            const dateB = new Date(b.dataset.created);

            if (sortValue === 'newest') {
                return dateB - dateA; 
            } else {
                return dateA - dateB; 
            }
        });

        filteredVideos.forEach(video => {
            gallery.appendChild(video);
        });

        if (visibleVideos === 0) {
            noResultsMessage.style.display = 'block';
        } else {
            noResultsMessage.style.display = 'none';
        }
    }

    // --- POPUP SWEETALERT ---
    window.showAnalysis = (btn) => {
        const videoItem = btn.closest('.video-item');
        const analysisRaw = videoItem.dataset.analysis; 

        if (!analysisRaw || analysisRaw === "null" || analysisRaw === "") {
            Swal.fire('Procesando...', 'La IA aún está analizando este video. Recarga en unos momentos.', 'info');
            return;
        }

        // Usamos la función formateadora aquí
        const formattedHtml = formatearAnalisis(analysisRaw);

        Swal.fire({
            title: '🏋️‍♂️ Análisis de IA',
            html: formattedHtml, // Aquí inyectamos el HTML bonito
            icon: 'info',
            width: '600px', // Hacemos el popup un poco más ancho
            confirmButtonText: 'Cerrar'
        });
    };

    gallery.addEventListener('click', (e) => {
        const analysisBtn = e.target.closest('.btn-analysis');
        if (analysisBtn) {
            e.preventDefault();
            window.showAnalysis(analysisBtn);
        }
    }); 

    async function deleteVideo(button) {
        const videoId = button.dataset.videoId;
        const videoItem = button.closest('.video-item');

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
                    videoItem.style.transition = 'opacity 0.5s';
                    videoItem.style.opacity = '0';
                    setTimeout(() => {
                        videoItem.remove();
                        allVideos.splice(allVideos.indexOf(videoItem), 1);
                        filterAndSortVideos();
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

    titleFilter.addEventListener('input', filterAndSortVideos);
    typeFilter.addEventListener('change', filterAndSortVideos);
    sortFilter.addEventListener('change', filterAndSortVideos);

    gallery.addEventListener('click', (e) => {
        const deleteButton = e.target.closest('.btn-delete');
        if (deleteButton) {
            e.preventDefault();
            deleteVideo(deleteButton);
        }
    });

    populateTypeFilter();
    filterAndSortVideos();
});