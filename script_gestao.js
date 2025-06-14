document.addEventListener('DOMContentLoaded', () => {
    let currentUserFilialId = null; 
    let currentUserIsAdmin = false;
    console.log('Gestao Script Loaded.');

    if (typeof supabase === 'undefined') {
        alert('Erro crítico: SDK do Supabase não foi carregado.');
        window.location.href = 'index.html';
        return;
    }
    const SUPABASE_URL = 'https://qomxmsehcaumeimyzrrw.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvbXhtc2VoY2F1bWVpbXl6cnJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1NTk4MTMsImV4cCI6MjA2NDEzNTgxM30.Z3U7qLSbYIMKddsRM4UD-EmtKV01WNK2sBgf_gnYXUI';
    const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('Supabase client inicializado para gestao.');

    const userGreeting = document.getElementById('user-greeting');
    const logoutButton = document.getElementById('logout-button');
    const clientList = document.getElementById('client-list');
    const clientListMessage = document.getElementById('client-list-message');
    const registerClientButton = document.getElementById('register-client-button');
    const registerClientModal = document.getElementById('register-client-modal');
    const registerClientForm = document.getElementById('register-client-form');
    const closeRegisterModalButton = document.getElementById('close-register-modal-button');
    const registerClientMessage = document.getElementById('register-client-message');
    const registerAdmCheckbox = document.getElementById('register-adm');
    const editClientModal = document.getElementById('edit-client-modal');
    const editClientForm = document.getElementById('edit-client-form');
    const closeModalButton = document.getElementById('close-modal-button');

    function displayMessage(element, text, type = 'error') {
        if (!element) return;
        element.textContent = text;
        element.className = `message-area ${type}`;
    }

    function toggleLoading(button, isLoading) {
        if (!button) return;
        const originalText = button.dataset.originalText || button.textContent;
        if (isLoading) {
            if (!button.dataset.originalText) button.dataset.originalText = button.innerHTML;
            button.innerHTML = '<span class="loader"></span> Carregando...';
            button.disabled = true;
        } else {
            button.innerHTML = originalText;
            button.disabled = false;
        }
    }

    async function loadUserProfile(user) {
        if (!user || !userGreeting) {
            if (userGreeting) userGreeting.textContent = 'Olá!';
            return { isAdmin: false, filialId: null };
        }
        try {
            const { data: profile, error } = await _supabase.from('usuarios').select('nome_usuario, filial_id, adm').eq('id', user.id).single();
            if (error && error.code !== 'PGRST116') throw error;
            
            userGreeting.textContent = (profile && profile.nome_usuario) ? `Olá, ${profile.nome_usuario}` : `Olá, ${user.email.split('@')[0]}`;
            
            const isAdmin = profile ? profile.adm : false;
            const filialId = profile ? profile.filial_id : null;

            if (!filialId) {
                console.error("Usuário logado não possui filial associada!");
                displayMessage(clientListMessage, 'Seu usuário não está vinculado a uma filial. A gestão de clientes está desabilitada.', 'error');
            }
            
            return { isAdmin, filialId };

        } catch (error) {
            console.error('Erro ao buscar perfil:', error.message);
            userGreeting.textContent = `Olá, ${user.email.split('@')[0]}`;
            return { isAdmin: false, filialId: null };
        }
    }

    async function fetchBranchClients(isAdmin) {
        if (!clientListMessage || !clientList || !currentUserFilialId) return;
        displayMessage(clientListMessage, 'Carregando clientes...', 'success');
        try {
            const { data: clients, error } = await _supabase.from('usuarios').select('*').order('nome_usuario', { ascending: true });
            if (error) throw error;
            displayMessage(clientListMessage, clients.length === 0 ? 'Nenhum cliente cadastrado nesta filial.' : '', 'success');
            renderClientList(clients, isAdmin);
        } catch (error) {
            console.error('Erro ao buscar clientes:', error.message);
            displayMessage(clientListMessage, `Erro: ${error.message}`, 'error');
        }
    }

    function renderClientList(clientsData, isAdmin) {
        if (!clientList) return;
        clientList.innerHTML = '';
        if (!clientsData || clientsData.length === 0) return;

        if (registerClientButton) {
            registerClientButton.style.display = isAdmin ? 'inline-block' : 'none';
        }

        clientsData.forEach(client => {
            const listItem = document.createElement('li');
            const editButtonHtml = isAdmin ? `<button class="edit-client-button" data-id="${client.id}">Editar</button>` : '';
            
            listItem.innerHTML = `
                <div class="client-info">
                    <strong>${client.nome_usuario || 'Nome não informado'}</strong>
                    <span>${client.email || 'Cliente sem login'}</span>
                </div>
                <div class="client-actions">
                    ${editButtonHtml}
                </div>
            `;
            
            if (isAdmin) {
                listItem.querySelector('.edit-client-button').addEventListener('click', () => openEditModal(client));
            }

            clientList.appendChild(listItem);
        });
    }

    function openEditModal(client) {
        if (!editClientModal) return;
        displayMessage(document.getElementById('edit-client-message'), '', 'success');
        document.getElementById('edit-client-id').value = client.id;
        document.getElementById('edit-nome-usuario').value = client.nome_usuario || '';
        document.getElementById('edit-email').value = client.email || '';
        document.getElementById('edit-adm').checked = client.adm;
        document.getElementById('edit-client').checked = client.client;
        document.getElementById('edit-permiss-crediario').checked = client.permiss_crediario;
        editClientModal.classList.remove('hidden');
    }

    function updateAdminFieldsVisibility() {
        const adminFields = document.querySelectorAll('#register-client-form .admin-only-field');
        const emailInput = document.getElementById('register-email');
        const passwordInput = document.getElementById('register-senha');
        
        if (registerAdmCheckbox && registerAdmCheckbox.checked) {
            adminFields.forEach(field => field.style.display = 'block');
            emailInput.required = true;
            passwordInput.required = true;
        } else {
            adminFields.forEach(field => field.style.display = 'none');
            emailInput.required = false;
            passwordInput.required = false;
        }
    }

    if (logoutButton) logoutButton.addEventListener('click', async () => {
        toggleLoading(logoutButton, true);
        await _supabase.auth.signOut();
        window.location.href = 'index.html';
    });

    if (registerClientButton) registerClientButton.addEventListener('click', () => {
        if (!currentUserIsAdmin) {
            alert('Apenas administradores podem cadastrar novos clientes.');
            return;
        }
        registerClientForm.reset();
        updateAdminFieldsVisibility();
        displayMessage(registerClientMessage, '', 'success');
        registerClientModal.classList.remove('hidden');
    });

    if (closeRegisterModalButton) closeRegisterModalButton.addEventListener('click', () => registerClientModal.classList.add('hidden'));
    if (closeModalButton) closeModalButton.addEventListener('click', () => editClientModal.classList.add('hidden'));

    if (registerAdmCheckbox) registerAdmCheckbox.addEventListener('change', updateAdminFieldsVisibility);

    if (registerClientForm) {
        registerClientForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const button = registerClientForm.querySelector('button[type="submit"]');
            toggleLoading(button, true);

            if (!currentUserFilialId) {
                displayMessage(registerClientMessage, 'Erro: Filial do administrador não encontrada. Não é possível criar cliente.', 'error');
                toggleLoading(button, false);
                return;
            }

            try {
                const formData = {
                    nome_usuario: document.getElementById('register-nome-usuario').value,
                    email: document.getElementById('register-email').value,
                    password: document.getElementById('register-senha').value,
                    adm: registerAdmCheckbox.checked,
                    permiss_crediario: document.getElementById('register-permiss-crediario').checked,
                    filial_id: currentUserFilialId,
                    client: !registerAdmCheckbox.checked
                };

                const { data, error } = await _supabase.functions.invoke('criar-novo-usuario', { body: formData });

                if (error) throw new Error(error.message);
                const result = data.error ? new Error(data.error) : data;
                if (result instanceof Error) throw result;

                displayMessage(registerClientMessage, "Usuário/Cliente cadastrado com sucesso!", "success");
                await fetchBranchClients(currentUserIsAdmin);
                setTimeout(() => registerClientModal.classList.add('hidden'), 1500);

            } catch (error) {
                console.error("Erro ao cadastrar cliente:", error);
                displayMessage(registerClientMessage, error.message, 'error');
            } finally {
                toggleLoading(button, false);
            }
        });
    }

    if (editClientForm) {
        editClientForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const button = editClientForm.querySelector('button[type="submit"]');
            toggleLoading(button, true);
            
            const clientId = document.getElementById('edit-client-id').value;
            const updatedData = {
                nome_usuario: document.getElementById('edit-nome-usuario').value,
                adm: document.getElementById('edit-adm').checked,
                client: document.getElementById('edit-client').checked,
                permiss_crediario: document.getElementById('edit-permiss-crediario').checked,
            };

            try {
                const { error } = await _supabase.from('usuarios').update(updatedData).eq('id', clientId);
                if (error) throw error;
                displayMessage(document.getElementById('edit-client-message'), 'Cliente atualizado com sucesso!', 'success');
                await fetchBranchClients(currentUserIsAdmin);
                setTimeout(() => editClientModal.classList.add('hidden'), 1500);
            } catch (error) {
                console.error("Erro ao editar cliente:", error);
                displayMessage(document.getElementById('edit-client-message'), error.message, 'error');
            } finally {
                toggleLoading(button, false);
            }
        });
    }

    async function initializePage() {
        const { data: { session } } = await _supabase.auth.getSession();
        if (!session) {
            window.location.href = 'index.html';
            return;
        }

        const profileData = await loadUserProfile(session.user);
        currentUserIsAdmin = profileData.isAdmin;
        currentUserFilialId = profileData.filialId;
        
        if (currentUserFilialId) {
            await fetchBranchClients(currentUserIsAdmin);
        }
    }

    initializePage();
});
