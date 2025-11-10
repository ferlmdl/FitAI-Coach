document.addEventListener('DOMContentLoaded', () => {

    const videoGrid = document.getElementById('video-grid');
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    const adminForm = document.getElementById('adminExerciseForm');
    const adminMessage = document.getElementById('admin-message');
    const errorBox = document.getElementById('error-message');

    const showErrorMessage = (message) => {
        if (!errorBox) return;
        errorBox.textContent = message;
        errorBox.classList.add('show');
        setTimeout(() => {
            errorBox.classList.remove('show');
        }, 3000);
    };

    const filterVideos = () => {
        if (!searchInput || !videoGrid) return;
        const searchTerm = searchInput.value.toLowerCase();
        const videoCards = videoGrid.querySelectorAll('.video-card');
        
        videoCards.forEach(card => {
            const title = card.querySelector('.video-title').textContent.toLowerCase();
            const category = card.querySelector('.video-category').textContent.toLowerCase();
            
            if (title.includes(searchTerm) || category.includes(searchTerm)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    };

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

    if (videoGrid) {
        videoGrid.addEventListener('click', async (e) => {
            
            const favoriteButton = e.target.closest('.favorite-btn');
            if (favoriteButton) {
                e.preventDefault();
                
                const card = favoriteButton.closest('.video-card');
                const videoIdString = card.dataset.videoId;
                if (!videoIdString) return;

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
                    } else {
                        showErrorMessage(data.error || 'No se pudo guardar el favorito.');
                    }
                } catch (error) {
                    console.error('Error en fetch de favorito:', error);
                    showErrorMessage('Error de conexión. Intenta de nuevo.');
                }
                return;
            }

            const videoCard = e.target.closest('.video-card');
            if (videoCard && videoModal) {
                const videoSrc = videoCard.dataset.videoSrc;
                if (videoSrc) {
                    modalVideoPlayer.src = videoSrc;
                    videoModal.style.display = 'grid';
                    modalVideoPlayer.play();
                }
            }
        });
    }
    const closeModal = () => {
        if (videoModal) {
            videoModal.style.display = 'none';
            modalVideoPlayer.pause();
            modalVideoPlayer.src = "";
        }
    };

    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', closeModal);
    }
    if (modalOverlay) {
        modalOverlay.addEventListener('click', closeModal);
    }
    if (adminForm) {
        adminForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
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
                console.error('Error en fetch de admin:', error);
                if (adminMessage) {
                    adminMessage.textContent = 'Error de conexión con el servidor.';
                    adminMessage.style.color = '#D90429';
                }
            }
        });
    }
});
