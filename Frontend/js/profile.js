document.addEventListener('DOMContentLoaded', () => {

    // --- Referencias a elementos ---
    const profileForm = document.getElementById('profileForm');
    const editBtn = document.getElementById('editBtn');
    const saveBtn = document.getElementById('saveBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const deleteBtn = document.getElementById('deleteBtn');
    
    // --- ★ CORRECCIÓN: Apuntar al DIV principal ---
    const personalInfoSection = document.getElementById('personalInfo');

    // Inputs del formulario
    const allNameInput = document.getElementById('allName');
    const userNameInput = document.getElementById('userName');
    const ageInput = document.getElementById('age');
    const emailInput = document.getElementById('email');

    // --- Avatar ---
    const avatarContainer = document.getElementById('avatarContainer');
    const avatarUpload = document.getElementById('avatarUpload');
    const avatarPreviewImg = document.getElementById('avatarPreviewImg');
    const avatarPreviewSpan = document.getElementById('avatarPreviewSpan');
    let selectedAvatarFile = null;

    // --- Estado original (para cancelar) ---
    const originalValues = {
        allName: allNameInput.value,
        userName: userNameInput.value,
        age: ageInput.value,
        avatarSrc: avatarPreviewImg ? avatarPreviewImg.src : null
    };

    // --- 1. Botón "Editar Perfil" ---
    if (editBtn) {
        editBtn.addEventListener('click', () => {
            // Habilitar inputs
            allNameInput.readOnly = false;
            userNameInput.readOnly = false;
            ageInput.readOnly = false;
            
            // --- ★ CORRECCIÓN: Cambiar clases en el DIV ---
            personalInfoSection.classList.remove('view-mode');
            personalInfoSection.classList.add('edit-mode');
            
            avatarContainer.style.cursor = 'pointer';

            // Ocultar "Editar", mostrar "Guardar" y "Cancelar"
            editBtn.style.display = 'none';
            saveBtn.style.display = 'inline-block';
            cancelBtn.style.display = 'inline-block';
        });
    }

    // --- 2. Botón "Cancelar" ---
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            // Deshabilitar inputs
            allNameInput.readOnly = true;
            userNameInput.readOnly = true;
            ageInput.readOnly = true;
            
            // Revertir valores
            allNameInput.value = originalValues.allName;
            userNameInput.value = originalValues.userName;
            ageInput.value = originalValues.age;
            
            // Revertir avatar
            if (originalValues.avatarSrc) {
                if (avatarPreviewImg) avatarPreviewImg.src = originalValues.avatarSrc;
                if (avatarPreviewSpan) avatarPreviewSpan.style.display = 'none';
                if (avatarPreviewImg) avatarPreviewImg.style.display = 'block';
            } else {
                if (avatarPreviewSpan) avatarPreviewSpan.style.display = 'inline';
                if (avatarPreviewImg) avatarPreviewImg.style.display = 'none';
            }
            selectedAvatarFile = null;

            // --- ★ CORRECCIÓN: Cambiar clases en el DIV ---
            personalInfoSection.classList.add('view-mode');
            personalInfoSection.classList.remove('edit-mode');
            avatarContainer.style.cursor = 'default';

            // Ocultar "Guardar" y "Cancelar", mostrar "Editar"
            editBtn.style.display = 'inline-block';
            saveBtn.style.display = 'none';
            cancelBtn.style.display = 'none';
        });
    }

    // --- 3. Lógica de Avatar ---
    if (avatarContainer) {
        avatarContainer.addEventListener('click', () => {
            // --- ★ CORRECCIÓN: Revisar la clase del DIV ---
            if (personalInfoSection.classList.contains('edit-mode')) {
                avatarUpload.click(); 
            }
        });
    }

    if (avatarUpload) {
        avatarUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                selectedAvatarFile = file;
                
                const reader = new FileReader();
                reader.onload = (event) => {
                    if (avatarPreviewImg) {
                        avatarPreviewImg.src = event.target.result;
                        avatarPreviewImg.style.display = 'block';
                    }
                    if (avatarPreviewSpan) {
                        avatarPreviewSpan.style.display = 'none';
                    }
                }
                reader.readAsDataURL(file);
            }
        });
    }

    // --- 4. Botón "Guardar Cambios" (Fetch a la API) ---
    if (saveBtn) {
        saveBtn.addEventListener('click', async () => {
            const formData = new FormData();
            
            formData.append('allName', allNameInput.value);
            formData.append('userName', userNameInput.value);
            formData.append('age', ageInput.value);
            
            if (selectedAvatarFile) {
                formData.append('avatarFile', selectedAvatarFile);
            }

            try {
                const response = await fetch('/api/users/profile', {
                    method: 'PUT',
                    body: formData 
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    if (window.Swal) {
                        Swal.fire({ icon: 'success', title: '¡Perfecto!', text: 'Perfil actualizado exitosamente.' })
                            .then(() => window.location.reload());
                    } else {
                        alert('Perfil actualizado exitosamente.');
                        window.location.reload();
                    }
                } else {
                    if (window.Swal) Swal.fire({ icon: 'error', title: 'Error', text: result.error });
                    else alert(`Error: ${result.error}`);
                }

            } catch (error) {
                console.error('Error al guardar perfil:', error);
                if (window.Swal) Swal.fire({ icon: 'error', title: 'Error de Red', text: 'No se pudo conectar al servidor.' });
                else alert('Error de Red: No se pudo conectar al servidor.');
            }
        });
    }

    // --- 5. Botón "Eliminar Cuenta" ---
    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
            const action = () => {
                fetch('/api/users/profile', { method: 'DELETE' })
                    .then(response => {
                        if (response.ok) {
                            window.location.href = '/login'; 
                        } else {
                            return response.json().then(err => { throw new Error(err.error) });
                        }
                    })
                    .catch(error => {
                        if (window.Swal) Swal.fire({ icon: 'error', title: 'Error', text: error.message || 'No se pudo eliminar la cuenta.' });
                        else alert(`Error: ${error.message || 'No se pudo eliminar la cuenta.'}`);
                    });
            };

            if (window.Swal) {
                Swal.fire({
                    title: '¿Estás seguro?',
                    text: "Esta acción no se puede deshacer. Todos tus datos serán eliminados.",
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#D90429', 
                    cancelButtonColor: '#666',
                    confirmButtonText: 'Sí, eliminar mi cuenta',
                    cancelButtonText: 'Cancelar'
                }).then((result) => {
                    if (result.isConfirmed) {
                        action();
                    }
                });
            } else {
                if (confirm('¿Estás seguro? Esta acción no se puede deshacer.')) {
                    action();
                }
            }
        });
    }
});
