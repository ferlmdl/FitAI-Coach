document.addEventListener('DOMContentLoaded', () => {
    const originalData = {};
    const section = document.getElementById('personalInfo');
    const form = document.getElementById('profileForm');
    
    const inputs = form.querySelectorAll('input[id="allName"], input[id="userName"], input[id="age"], textarea'); 
    
    const editBtn = document.getElementById('editBtn');
    const saveBtn = document.getElementById('saveBtn');
    const cancelBtn = document.getElementById('cancelBtn');

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
    });

    saveBtn.addEventListener('click', async () => {
        const updatedData = {
            allName: document.getElementById('allName').value,
            userName: document.getElementById('userName').value,
            age: document.getElementById('age').value
        };

        try {
            const response = await fetch('/api/users/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedData)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'No se pudo actualizar el perfil.');
            }

            document.getElementById('displayName').textContent = updatedData.allName;
            document.getElementById('displayUsername').textContent = '@' + updatedData.userName;

            inputs.forEach(input => input.setAttribute('readonly', 'readonly'));
            section.classList.remove('edit-mode');
            section.classList.add('view-mode');

            editBtn.style.display = 'inline-block';
            saveBtn.style.display = 'none';
            cancelBtn.style.display = 'none';

            alert('Perfil actualizado exitosamente');

        } catch (error) {
            console.error('Error al guardar el perfil:', error);
            alert(`Error: ${error.message}`);
        }
    });
});