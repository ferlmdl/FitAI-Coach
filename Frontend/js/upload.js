document.addEventListener('DOMContentLoaded', () => {
    let selectedFiles = [];
    const maxFileSize = 100 * 1024 * 1024; // 100MB
    const maxFiles = 3;
    const allowedTypes = [
        'video/mp4', 'video/avi', 'video/quicktime', 'video/x-msvideo',
        'video/x-flv', 'video/x-matroska', 'video/x-ms-wmv', 'video/webm'
    ];

    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('fileInput');
    const fileList = document.getElementById('fileList');
    const uploadBtn = document.getElementById('uploadBtn');
    const progressBar = document.getElementById('progressBar');
    const progressFill = document.getElementById('progressFill');

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, preventDefaults, false);
    });
    ['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, () => uploadArea.classList.add('dragover'), false);
    });
    ['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, () => uploadArea.classList.remove('dragover'), false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    uploadArea.addEventListener('drop', (e) => {
        handleFiles(e.dataTransfer.files);
    }, false);

    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });

    function handleFiles(files) {
        [...files].forEach(addFile);
        updateFileList();
        updateUploadButton();
    }

    function addFile(file) {
        if (selectedFiles.length >= maxFiles) return alert(`Solo puedes subir máximo ${maxFiles} videos`);
        if (file.size > maxFileSize) return alert(`El video ${file.name} excede el tamaño máximo de 100MB`);
        if (!allowedTypes.includes(file.type)) return alert(`El formato del video ${file.name} no está permitido`);
        if (selectedFiles.find(f => f.name === file.name && f.size === file.size)) return;
        
        selectedFiles.push(file);
    }

    function updateFileList() {
        fileList.innerHTML = '';
        selectedFiles.forEach((file, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item'; // Asegúrate de estilizar 'file-item'
            fileItem.innerHTML = `
                <div class="file-info">
                    <span class="file-name">${file.name}</span>
                    <span class="file-size">${formatFileSize(file.size)}</span>
                </div>
                <button type="button" class="file-remove" data-index="${index}">×</button>
            `;
            fileList.appendChild(fileItem);
        });

        // Añade el event listener para los botones de borrar
        fileList.querySelectorAll('.file-remove').forEach(button => {
            button.addEventListener('click', (e) => {
                const index = parseInt(e.target.getAttribute('data-index'));
                removeFile(index);
            });
        });
    }
    
    function removeFile(index) {
        selectedFiles.splice(index, 1);
        updateFileList();
        updateUploadButton();
    }

    function updateUploadButton() {
        uploadBtn.disabled = selectedFiles.length === 0;
    }

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    // --- Lógica de Subida ---
    uploadBtn.addEventListener('click', uploadFiles);

    async function uploadFiles() {
        if (selectedFiles.length === 0) return;
        
        const title = document.getElementById('videoTitle').value;
        const exerciseType = document.getElementById('exerciseType').value;

        if (!title || !exerciseType) {
            return alert('Por favor, completa el título y el tipo de ejercicio.');
        }

        progressBar.style.display = 'block';
        uploadBtn.disabled = true;
        uploadBtn.textContent = 'Subiendo...';

        const formData = new FormData();
        selectedFiles.forEach(file => {
            formData.append('videos', file); // 'videos' (plural)
        });
        
        formData.append('title', title);
        formData.append('exerciseType', exerciseType);

        try {
            const response = await fetch('/api/videos/upload', {
                method: 'POST',
                body: formData
                // No 'Authorization' header needed, cookie se envía sola
            });

            const result = await response.json();

            if (response.ok) {
                progressFill.style.width = '100%';
                setTimeout(() => {
                    alert('¡Videos subidos exitosamente!');
                    resetForm();
                    window.location.href = '/galery'; // Redirige a la galería
                }, 500);
            } else {
                throw new Error(result.error || 'Ocurrió un error en el servidor.');
            }
        } catch (error) {
            console.error('Error al subir los videos:', error);
            alert(`Error: ${error.message}`);
            resetForm();
        }
    }
    
    function resetForm() {
        selectedFiles = [];
        updateFileList();
        updateUploadButton();
        progressBar.style.display = 'none';
        progressFill.style.width = '0%';
        uploadBtn.textContent = 'Subir Videos';
        fileInput.value = '';
        document.getElementById('videoTitle').value = '';
        document.getElementById('exerciseType').value = '';
    }
});