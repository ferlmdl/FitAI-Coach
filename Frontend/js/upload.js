let selectedFiles = [];
    const maxFileSize = 100 * 1024 * 1024; 
    const maxFiles = 3;
    const allowedTypes = [
        'video/mp4', 'video/avi', 'video/quicktime', 'video/x-msvideo',
        'video/x-flv', 'video/x-matroska', 'video/x-ms-wmv'
    ];

    const uploadArea = document.querySelector('.upload-area');
    const fileInput = document.getElementById('fileInput');
    const fileList = document.getElementById('fileList');
    const uploadBtn = document.getElementById('uploadBtn');
    const progressBar = document.getElementById('progressBar');
    const progressFill = document.getElementById('progressFill');

    (function checkAuth() {
        const token = localStorage.getItem('authToken');
        if (!token) {
            alert('Debes iniciar sesión para subir videos.');
            window.location.href = '/login.html'; 
        }
    })();

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
        if (selectedFiles.find(f => f.name === file.name && f.size === file.size)) return alert(`El video ${file.name} ya está seleccionado`);
        
        selectedFiles.push(file);
    }

    function updateFileList() {
        fileList.innerHTML = '';
        selectedFiles.forEach((file, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.innerHTML = `
                <div class="file-info">
                    <div class="file-name">${file.name}</div>
                    <div class="file-size">${formatFileSize(file.size)}</div>
                </div>
                <button class="file-remove" onclick="removeFile(${index})">×</button>
            `;
            fileList.appendChild(fileItem);
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
    
    async function uploadFiles() {
        if (selectedFiles.length === 0) return;

        const token = localStorage.getItem('authToken');
        if (!token) {
            return alert('Sesión expirada. Por favor, inicia sesión de nuevo.');
        }

        progressBar.style.display = 'block';
        uploadBtn.disabled = true;
        uploadBtn.textContent = 'Subiendo...';

        const formData = new FormData();
        selectedFiles.forEach(file => {
            formData.append('videos', file); 
        });

        try {
            const response = await fetch('/api/videos/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}` 
                },
                body: formData
            });

            const result = await response.json();

            if (response.ok) {
                progressFill.style.width = '100%';r
                setTimeout(() => {
                    alert('¡Videos subidos y procesados exitosamente!');
                    resetForm();
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
    }