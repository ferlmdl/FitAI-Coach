document.addEventListener('DOMContentLoaded', () => {

    const videoGrid = document.getElementById('video-grid');
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    
    const filterVideos = () => {
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
            
            if (!favoriteButton) return;

            const card = favoriteButton.closest('.video-card');
            const videoIdString = card.dataset.videoId;
            
            if (!videoIdString) return;

            const videoId = parseInt(videoIdString, 10);
            
            try {
                const response = await fetch('/api/users/favorites/toggle', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ videoId: videoId })
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    if (data.favorited) {
                        favoriteButton.classList.add('active');
                    } else {
                        favoriteButton.classList.remove('active');
                    }
                } else {
                    showErrorMessage(data.error || 'No se pudo guardar el favorito.');
                }

            } catch (error) {
                console.error('Error en fetch de favorito:', error);
                showErrorMessage('Error de conexión. Intenta de nuevo.');
            }
        });
    }

    const showErrorMessage = (message) => {
        const errorBox = document.getElementById('error-message');
        if (!errorBox) return;
        
        errorBox.textContent = message;
        errorBox.classList.add('show');
        setTimeout(() => {
            errorBox.classList.remove('show');
        }, 3000);
    };

});
