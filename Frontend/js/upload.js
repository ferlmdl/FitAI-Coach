document.addEventListener('DOMContentLoaded', () => {
    let selectedFiles = []; // Almacenará los { file, previewUrl }
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

    // --- (Toda tu lógica de drag-and-drop está perfecta, se queda igual) ---
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

    // --- MODIFICADO: Usaremos SweetAlert (asegúrate de tenerlo importado) ---
    function showAlert(title, text, icon) {
        if (typeof Swal !== 'undefined') {
            Swal.fire(title, text, icon);
        } else {
            alert(text);
        }
    }

    function handleFiles(files) {
        [...files].forEach(addFile);
        updateFileList();
        updateUploadButton();
    }

    function addFile(file) {
        // Validaciones
        if (selectedFiles.length >= maxFiles) return showAlert('Límite alcanzado', `Solo puedes subir máximo ${maxFiles} videos`, 'warning');
        if (file.size > maxFileSize) return showAlert('Archivo muy grande', `El video ${file.name} excede el tamaño máximo de 100MB`, 'warning');
        if (!allowedTypes.includes(file.type)) return showAlert('Formato no válido', `El formato del video ${file.name} no está permitido`, 'warning');
        if (selectedFiles.find(f => f.file.name === file.name && f.file.size === file.size)) return;
        
        // --- NUEVO: Creamos un Object URL para la previsualización ---
        const previewUrl = URL.createObjectURL(file);
        selectedFiles.push({ file: file, previewUrl: previewUrl });
    }

    // --- MODIFICADO: Añadimos la previsualización de video ---
    function updateFileList() {
        fileList.innerHTML = '';
        selectedFiles.forEach((fileWrapper, index) => {
            const file = fileWrapper.file;
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item'; 
            
            // --- NUEVO: HTML con la etiqueta <video> ---
            fileItem.innerHTML = `
                <video class="file-preview" src="${fileWrapper.previewUrl}" controls muted></video>
                <div class="file-info">
                    <span class="file-name">${file.name}</span>
                    <span class="file-size">${formatFileSize(file.size)}</span>
                </div>
                <button type="button" class="file-remove" data-index="${index}">×</button>
            `;
            fileList.appendChild(fileItem);
        });

        fileList.querySelectorAll('.file-remove').forEach(button => {
            button.addEventListener('click', (e) => {
                const index = parseInt(e.currentTarget.getAttribute('data-index'));
                removeFile(index);
            });
        });
    }
    
    // --- MODIFICADO: Revocamos el Object URL para liberar memoria ---
    function removeFile(index) {
        const fileWrapper = selectedFiles[index];
        URL.revokeObjectURL(fileWrapper.previewUrl); // --- NUEVO ---
        
        selectedFiles.splice(index, 1);
        updateFileList();
        updateUploadButton();
    }

    function updateUploadButton() {
        uploadBtn.disabled = selectedFiles.length === 0;
    }

    function formatFileSize(bytes) {
        // ... (tu función está perfecta, se queda igual)
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    uploadBtn.addEventListener('click', uploadFiles);

    // --- MODIFICADO: Reemplazamos 'fetch' con 'XMLHttpRequest' para la barra de progreso ---
    function uploadFiles() {
        if (selectedFiles.length === 0) return;
        
        const title = document.getElementById('videoTitle').value;
        const exerciseType = document.getElementById('exerciseType').value;

        if (!title || !exerciseType) {
            return showAlert('Campos incompletos', 'Por favor, completa el título y el tipo de ejercicio.', 'warning');
        }

        progressBar.style.display = 'block';
        progressFill.style.width = '0%';
        progressFill.textContent = '0%'; // --- NUEVO: Texto de porcentaje ---
        uploadBtn.disabled = true;
        uploadBtn.textContent = 'Subiendo...';

        const formData = new FormData();
        selectedFiles.forEach(fileWrapper => {
            formData.append('videos', fileWrapper.file); 
        });
        
        formData.append('title', title);
        formData.append('exerciseType', exerciseType);

        const xhr = new XMLHttpRequest();

        // --- NUEVO: Evento de progreso ---
        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
                const percentComplete = (event.loaded / event.total) * 100;
                progressFill.style.width = percentComplete + '%';
                progressFill.textContent = Math.round(percentComplete) + '%';
            }
        };

        // --- NUEVO: Evento de subida completada ---
        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                // Éxito
                progressFill.textContent = '¡Completado!';
                setTimeout(() => {
                    showAlert('¡Éxito!', '¡Videos subidos exitosamente!', 'success');
                    resetForm();
                    window.location.href = '/galery';
                }, 500);
            } else {
                // Error del servidor
                const result = JSON.parse(xhr.responseText);
                console.error('Error al subir los videos:', result.error);
                showAlert('Error', `Error: ${result.error || 'Ocurrió un error en el servidor.'}`, 'error');
                resetForm(); // Resetear en caso de error
            }
        };

        // --- NUEVO: Evento de error de red ---
        xhr.onerror = () => {
            console.error('Error de red al subir los videos.');
            showAlert('Error de Red', 'No se pudo conectar con el servidor. Intenta de nuevo.', 'error');
            resetForm(); // Resetear en caso de error
        };

        xhr.open('POST', '/api/videos/upload', true);
        xhr.send(formData);
    }
    
    // --- MODIFICADO: Revocamos todos los URLs al resetear ---
    function resetForm() {
        // --- NUEVO: Limpiar URLs de previsualización ---
        selectedFiles.forEach(fileWrapper => {
            URL.revokeObjectURL(fileWrapper.previewUrl);
        });
        // ---
        selectedFiles = [];
        updateFileList();
        updateUploadButton();
        progressBar.style.display = 'none';
        progressFill.style.width = '0%';
        progressFill.textContent = ''; // --- NUEVO ---
        uploadBtn.textContent = 'Subir Videos';
        fileInput.value = '';
        document.getElementById('videoTitle').value = '';
        document.getElementById('exerciseType').value = '';
    }
});