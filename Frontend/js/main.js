document.addEventListener("DOMContentLoaded", function() {
    // Función para cargar un componente HTML
    const loadComponent = (selector, url) => {
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error("Network response was not ok");
                }
                return response.text();
            })
            .then(data => {
                document.querySelector(selector).innerHTML = data;
            })
            .catch(error => {
                console.error(`Error loading component from ${url}:`, error);
            });
    };

    // Cargar el header y el footer
    loadComponent("#header-placeholder", "/partials/header.html");
    loadComponent("#footer-placeholder", "/partials/footer.html");
});
