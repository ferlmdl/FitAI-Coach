document.addEventListener('DOMContentLoaded', () => {
    const originalData = {};
    const section = document.getElementById('personalInfo');
    const form = document.getElementById('profileForm');
    const inputs = form.querySelectorAll('input[id="allName"], input[id="userName"], input[id="age"]'); 
    const editBtn = document.getElementById('editBtn');
    const saveBtn = document.getElementById('saveBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const deleteBtn = document.getElementById('deleteBtn');

    const avatarContainer = document.getElementById('avatarContainer');
    const avatarUploadInput = document.getElementById('avatarUpload');
    const originalAvatarHTML = avatarContainer.innerHTML;
    let newAvatarFile = null;

    editBtn.addEventListener('click', () => {
        inputs.forEach(input => {
            originalData[input.id] = input.value;
            input.removeAttribute('readonly');
        });

        section.classList.remove('view-mode');
        section.classList.add('edit-mode');

        editBtn.style.display = 'none';
        saveBtn.style.display = 'inline-block';
        cancelBtn.style.display = 'inline-block';

        avatarContainer.addEventListener('click', openFilePicker);
        avatarContainer.style.cursor = 'pointer';
    });

    cancelBtn.addEventListener('click', () => {
        inputs.forEach(input => {
            if (originalData[input.id] !== undefined) {
                input.value = originalData[input.id];
            }
            input.setAttribute('readonly', 'readonly');
        });

        section.classList.remove('edit-mode');
        section.classList.add('view-mode');

        editBtn.style.display = 'inline-block';
        saveBtn.style.display = 'none';
        cancelBtn.style.display = 'none';

        avatarContainer.removeEventListener('click', openFilePicker);
        avatarContainer.style.cursor = 'default';
        newAvatarFile = null;
        avatarContainer.innerHTML = originalAvatarHTML; 
    });

    function openFilePicker() {
        avatarUploadInput.click();
    }

    avatarUploadInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        newAvatarFile = file; 

        const reader = new FileReader();
        reader.onload = (event) => {
            let img = avatarContainer.querySelector('img'); 
            
            if (!img) {
                avatarContainer.innerHTML = ''; 
                img = document.createElement('img');
                img.id = 'avatarPreviewImg';
                img.alt = 'Vista previa de perfil';
                avatarContainer.appendChild(img);
            }
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    });


    saveBtn.addEventListener('click', async () => {
        
        const formData = new FormData();

        formData.append('allName', document.getElementById('allName').value);
        formData.append('userName', document.getElementById('userName').value);
        formData.append('age', document.getElementById('age').value);

        if (newAvatarFile) {
            formData.append('avatarFile', newAvatarFile, newAvatarFile.name);
        }

        try {
            const response = await fetch('/api/users/profile', {
                method: 'PUT',
                body: formData
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'No se pudo actualizar el perfil.');
            }

            if (newAvatarFile) {
                alert('Perfil actualizado exitosamente. La página se recargará.');
                location.reload();
            } else {
                document.getElementById('displayName').textContent = `Bienvenido, ${document.getElementById('allName').value}`;
                document.getElementById('displayUsername').textContent = '@' + document.getElementById('userName').value;
    
                inputs.forEach(input => input.setAttribute('readonly', 'readonly'));
                section.classList.remove('edit-mode');
                section.classList.add('view-mode');
    
                editBtn.style.display = 'inline-block';
                saveBtn.style.display = 'none';
                cancelBtn.style.display = 'none';
                avatarContainer.removeEventListener('click', openFilePicker);
                avatarContainer.style.cursor = 'default';
    
                alert('Perfil actualizado exitosamente');
            }

        } catch (error) {
            console.error('Error al guardar el perfil:', error);
            alert(`Error: ${error.message}`);
        }
    });

    deleteBtn.addEventListener('click', async () => {
        const confirmation = prompt('Esta acción es irreversible. Para confirmar la eliminación de tu cuenta, escribe "ELIMINAR" en mayúsculas:');
        
        if (confirmation !== 'ELIMINAR') {
            alert('Acción cancelada.');
            return;
        }

        try {
            const response = await fetch('/api/users/profile', {
                method: 'DELETE'
            });

            if (!response.ok) {
                const result = await response.json().catch(() => ({})); 
                throw new Error(result.error || 'No se pudo eliminar el perfil.');
            }
            alert('Tu perfil ha sido eliminado exitosamente. Serás redirigido a la página principal.');
            
            window.location.href = '/'; 

        } catch (error) {
            console.error('Error al eliminar el perfil:', error);
            alert(`Error: ${error.message}`);
        }
    });
});