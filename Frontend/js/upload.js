// upload.js - Versión corregida
document.addEventListener('DOMContentLoaded', () => {
    console.log('upload.js iniciado');
    
    let selectedFiles = [];
    const maxFileSize = 100 * 1024 * 1024; // 100MB
    const maxFiles = 3;
    const allowedTypes = [
        'video/mp4', 
        'video/avi', 
        'video/quicktime', 
        'video/x-msvideo',
        'video/x-flv', 
        'video/x-matroska', 
        'video/x-ms-wmv', 
        'video/webm'
    ];

    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const fileList = document.getElementById('fileList');
    const uploadBtn = document.getElementById('uploadBtn');
    const progressBar = document.getElementById('progressBar');
    const progressFill = document.getElementById('progressFill');
    const uploadForm = document.getElementById('uploadForm');

    // Verificar que todos los elementos existan
    if (!uploadArea || !fileInput || !uploadBtn) {
        console.error('Elementos esenciales no encontrados');
        return;
    }

    console.log('Elementos cargados correctamente');

    // Configurar eventos de drag and drop
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, preventDefaults, false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, () => {
            uploadArea.classList.add('dragover');
            console.log('Drag over');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, () => {
            uploadArea.classList.remove('dragover');
            console.log('Drag leave/drop');
        }, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    // Evento drop
    uploadArea.addEventListener('drop', (e) => {
        console.log('Archivos soltados:', e.dataTransfer.files.length);
        handleFiles(e.dataTransfer.files);
    }, false);

    // Evento click en el área de upload
    uploadArea.addEventListener('click', () => {
        console.log('Clic en área de upload');
        fileInput.click();
    });

    // Evento change del input file
    fileInput.addEventListener('change', (e) => {
        console.log('Archivos seleccionados:', e.target.files.length);
        handleFiles(e.target.files);
    });

    // Función para mostrar alertas
    function showAlert(title, text, icon) {
        console.log(`Alert: ${title} - ${text}`);
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                title: title,
                text: text,
                icon: icon,
                confirmButtonText: 'OK'
            });
        } else {
            alert(`${title}: ${text}`);
        }
    }

    // Manejar archivos
    function handleFiles(files) {
        if (!files || files.length === 0) {
            console.log('No hay archivos para procesar');
            return;
        }

        console.log('Procesando', files.length, 'archivos');
        
        for (let i = 0; i < files.length; i++) {
            if (selectedFiles.length >= maxFiles) {
                showAlert('Límite alcanzado', `Solo puedes subir máximo ${maxFiles} videos`, 'warning');
                break;
            }
            addFile(files[i]);
        }
        
        updateFileList();
        updateUploadButton();
    }

    // Añadir archivo individual
    function addFile(file) {
        console.log('Añadiendo archivo:', file.name, file.size, file.type);

        // Validar tipo de archivo
        if (!allowedTypes.includes(file.type)) {
            showAlert('Formato no válido', `El formato del video ${file.name} no está permitido`, 'warning');
            return;
        }

        // Validar tamaño
        if (file.size > maxFileSize) {
            showAlert('Archivo muy grande', `El video ${file.name} excede el tamaño máximo de 100MB`, 'warning');
            return;
        }

        // Verificar duplicados
        if (selectedFiles.find(f => f.file.name === file.name && f.file.size === file.size)) {
            showAlert('Archivo duplicado', `El video ${file.name} ya fue seleccionado`, 'warning');
            return;
        }

        // Crear preview URL
        const previewUrl = URL.createObjectURL(file);
        selectedFiles.push({ 
            file: file, 
            previewUrl: previewUrl 
        });
        
        console.log('Archivo añadido correctamente');
    }

    // Actualizar lista de archivos
    function updateFileList() {
        fileList.innerHTML = '';
        
        if (selectedFiles.length === 0) {
            fileList.style.display = 'none';
            return;
        }

        fileList.style.display = 'block';
        
        selectedFiles.forEach((fileWrapper, index) => {
            const file = fileWrapper.file;
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            
            fileItem.innerHTML = `
                <div class="file-preview-container">
                    <video class="file-preview" src="${fileWrapper.previewUrl}" controls muted></video>
                </div>
                <div class="file-info">
                    <span class="file-name">${file.name}</span>
                    <span class="file-size">${formatFileSize(file.size)}</span>
                </div>
                <button type="button" class="file-remove" data-index="${index}">
                    <i class="fas fa-times"></i>
                </button>
            `;
            
            fileList.appendChild(fileItem);
        });

        // Agregar event listeners a los botones de eliminar
        fileList.querySelectorAll('.file-remove').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = parseInt(e.currentTarget.getAttribute('data-index'));
                removeFile(index);
            });
        });
    }

    // Eliminar archivo
    function removeFile(index) {
        console.log('Eliminando archivo en índice:', index);
        
        if (index >= 0 && index < selectedFiles.length) {
            const fileWrapper = selectedFiles[index];
            URL.revokeObjectURL(fileWrapper.previewUrl);
            selectedFiles.splice(index, 1);
            updateFileList();
            updateUploadButton();
        }
    }

    // Formatear tamaño de archivo
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Actualizar botón de upload
    function updateUploadButton() {
        uploadBtn.disabled = selectedFiles.length === 0;
        console.log('Upload button disabled:', uploadBtn.disabled);
    }

    // Evento del botón de upload
    uploadBtn.addEventListener('click', uploadFiles);

    // Función principal de upload
    async function uploadFiles() {
        console.log('Iniciando upload...');
        
        if (selectedFiles.length === 0) {
            showAlert('Sin archivos', 'No hay archivos para subir', 'warning');
            return;
        }

        const title = document.getElementById('videoTitle').value.trim();
        const exerciseType = document.getElementById('exerciseType').value;

        console.log('Datos del formulario:', { title, exerciseType });

        // Validar campos requeridos
        if (!title || !exerciseType) {
            showAlert('Campos incompletos', 'Por favor, completa el título y el tipo de ejercicio.', 'warning');
            return;
        }

        // Configurar UI de progreso
        progressBar.style.display = 'block';
        progressFill.style.width = '0%';
        progressFill.textContent = '0%';
        uploadBtn.disabled = true;
        uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Subiendo...';

        try {
            const formData = new FormData();
            
            // Agregar archivos
            selectedFiles.forEach(fileWrapper => {
                formData.append('videos', fileWrapper.file);
            });
            
            // Agregar otros datos
            formData.append('title', title);
            formData.append('exerciseType', exerciseType);

            console.log('Enviando request...');

            const response = await fetch('/api/videos/upload', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            console.log('Respuesta del servidor:', result);

            if (response.ok && result.success) {
                progressFill.style.width = '100%';
                progressFill.textContent = '¡Completado!';
                
                showAlert('¡Éxito!', 'Videos subidos correctamente', 'success');
                
                // Limpiar y redirigir después de 2 segundos
                setTimeout(() => {
                    resetForm();
                    window.location.href = '/galery';
                }, 2000);
                
            } else {
                throw new Error(result.error || 'Error desconocido del servidor');
            }

        } catch (error) {
            console.error('Error en upload:', error);
            
            let errorMessage = 'Error al subir los videos. ';
            if (error.message.includes('Failed to fetch')) {
                errorMessage += 'Error de conexión con el servidor.';
            } else {
                errorMessage += error.message;
            }
            
            showAlert('Error', errorMessage, 'error');
            resetUploadButton();
        }
    }

    // Resetear formulario
    function resetForm() {
        console.log('Reseteando formulario...');
        
        // Liberar URLs de preview
        selectedFiles.forEach(fileWrapper => {
            URL.revokeObjectURL(fileWrapper.previewUrl);
        });
        
        selectedFiles = [];
        updateFileList();
        resetUploadButton();
        progressBar.style.display = 'none';
        
        if (uploadForm) {
            uploadForm.reset();
        }
        
        fileInput.value = '';
    }

    // Resetear botón de upload
    function resetUploadButton() {
        uploadBtn.disabled = false;
        uploadBtn.innerHTML = '<i class="fas fa-upload"></i> Subir Videos';
    }

    // Inicializar
    updateFileList();
    updateUploadButton();
    
    console.log('Upload.js configurado correctamente');
});