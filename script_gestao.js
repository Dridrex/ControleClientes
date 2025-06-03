document.addEventListener('DOMContentLoaded', () => {
    console.log('Gestao Script Loaded.');

    if (typeof supabase === 'undefined') {
        alert('Erro crítico: SDK do Supabase não foi carregado.');
        window.location.href = 'index.html'; // Volta para o login se Supabase não carregar
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
    const editClientModal = document.getElementById('edit-client-modal');
    const editClientForm = document.getElementById('edit-client-form');
    const closeModalButton = document.getElementById('close-modal-button');
    const editClientId = document.getElementById('edit-client-id');
    const editNomeUsuario = document.getElementById('edit-nome-usuario');
    const editEmail = document.getElementById('edit-email');
    const editAdm = document.getElementById('edit-adm');
    const editClient = document.getElementById('edit-client'); // Checkbox
    const editPermissCrediario = document.getElementById('edit-permiss-crediario');
    const editClientMessage = document.getElementById('edit-client-message');
    // Adicionar seletores para o modal de edição se for implementar a edição aqui

    function displayMessage(element, text, type = 'error') { // Pode ser movida para um utils.js
        if (!element) return;
        element.textContent = text;
        element.className = `message-area ${type}`;
    }
    
    function toggleLoading(button, isLoading) { // Pode ser movida para um utils.js
        if (!button) return;
        const originalText = button.dataset.originalText || button.textContent;
        if (isLoading) {
            if (!button.dataset.originalText) button.dataset.originalText = button.innerHTML;
            button.innerHTML = '<span class="loader"></span> Carregando...';
            button.disabled = true;
        } else {
            button.innerHTML = button.dataset.originalText;
            button.disabled = false;
        }
    }

    async function loadUserProfile(user) {
        if (!user || !userGreeting) {
            if(userGreeting && user && user.email) userGreeting.textContent = `Olá, ${user.email.split('@')[0]}`;
            else if(userGreeting) userGreeting.textContent = 'Olá!';
            return;
        }
        try {
            const { data: profile, error, status } = await _supabase
                .from('usuarios')
                .select('nome_usuario')
                .eq('id', user.id)
                .single();
            if (error && status !== 406) throw error;
            userGreeting.textContent = (profile && profile.nome_usuario) ? `Olá, ${profile.nome_usuario}` : `Olá, ${user.email.split('@')[0]}`;
        } catch (error) {
            console.error('Erro ao buscar perfil do usuário:', error.message);
            userGreeting.textContent = `Olá, ${user.email.split('@')[0]}`;
        }
    }

    async function fetchBranchClients() {
        if (!clientListMessage || !clientList) return;
        displayMessage(clientListMessage, 'Carregando clientes...', 'success');
        try {
            const { data: clients, error } = await _supabase
                .from('usuarios')
                .select('id, nome_usuario, email, adm, client, permiss_crediario')
                .order('nome_usuario', { ascending: true });
            if (error) throw error;
            displayMessage(clientListMessage, clients.length === 0 ? 'Nenhum cliente nesta filial.' : '', 'success');
            renderClientList(clients);
        } catch (error) {
            console.error('Erro ao buscar clientes:', error.message);
            displayMessage(clientListMessage, `Erro ao buscar clientes: ${error.message}`, 'error');
        }
    }

    function renderClientList(clientsData) {
        if (!clientList) return;
        clientList.innerHTML = '';
        if (!clientsData || clientsData.length === 0) return;
        clientsData.forEach(clientProfile => {
            const listItem = document.createElement('li');
            listItem.innerHTML = `
                <div class="client-info">
                    <strong>${clientProfile.nome_usuario || 'Nome não informado'}</strong>
                    <span>${clientProfile.email}</span>
                </div>
                <button class="edit-client-button" data-id="${clientProfile.id}">Editar</button>
            `;
            clientList.appendChild(listItem);

            const editButton = listItem.querySelector('.edit-client-button');
            if (editButton) { // Adicionar verificação para segurança
                editButton.addEventListener('click', () => {
                    openEditModal(clientProfile);
                });
            }
        });
    }

    function openEditModal(clientProfileData) {
        if (!editClientModal || !editClientId || !editNomeUsuario || !editEmail || !editAdm || !editClient || !editPermissCrediario || !editClientMessage) {
            console.error('Um ou mais elementos do modal de edição não foram encontrados.');
            return;
        }

        editClientId.value = clientProfileData.id;
        editNomeUsuario.value = clientProfileData.nome_usuario || '';
        editEmail.value = clientProfileData.email || '';
        editAdm.checked = clientProfileData.adm;
        editClient.checked = clientProfileData.client;
        editPermissCrediario.checked = clientProfileData.permiss_crediario;

        if (editClientMessage) editClientMessage.textContent = '';
        if (editClientModal) editClientModal.classList.remove('hidden');
    }

    if (logoutButton) {
        logoutButton.addEventListener('click', async () => {
            toggleLoading(logoutButton, true);
            await _supabase.auth.signOut();
            // O onAuthStateChange ou a verificação de sessão no carregamento da página de login
            // cuidará do redirecionamento. Mas podemos forçar aqui também.
            window.location.href = 'index.html';
        });
    }

    // --- PROTEÇÃO DA PÁGINA E CARREGAMENTO INICIAL DE DADOS ---
    async function initializePage() {
        const { data: { session }, error: sessionError } = await _supabase.auth.getSession();

        if (sessionError || !session) {
            console.log('Nenhuma sessão ativa ou erro ao buscar sessão. Redirecionando para login.');
            window.location.href = 'index.html';
            return;
        }

        console.log('Sessão ativa. Carregando dados do dashboard.');
        await loadUserProfile(session.user);
        await fetchBranchClients();
        // Adicionar aqui a lógica para os botões de editar cliente

        // Event listener para o botão de fechar o modal
        if (closeModalButton && editClientModal) {
            closeModalButton.addEventListener('click', () => {
                editClientModal.classList.add('hidden');
            });
        }

        // Event listener para fechar o modal clicando no fundo
        if (editClientModal) {
            editClientModal.addEventListener('click', (event) => {
                if (event.target === editClientModal) {
                    editClientModal.classList.add('hidden');
                }
            });
        }

        // Event listener para o submit do formulário de edição
        if (editClientForm) {
            editClientForm.addEventListener('submit', async (event) => {
                event.preventDefault();

                const clientId = editClientId.value;
                const novoNome = editNomeUsuario.value;
                const novoAdm = editAdm.checked;
                const novoClient = editClient.checked;
                const novoPermissCrediario = editPermissCrediario.checked;

                const submitButton = editClientForm.querySelector('button[type="submit"]');
                // Garantir que toggleLoading tenha o texto original ao carregar
                const originalButtonText = submitButton.dataset.originalText || submitButton.textContent;
                if (!submitButton.dataset.originalText) {
                    submitButton.dataset.originalText = originalButtonText;
                }

                toggleLoading(submitButton, true);
                displayMessage(editClientMessage, '', 'success'); // Limpa mensagens anteriores

                try {
                    const { error } = await _supabase
                        .from('usuarios')
                        .update({
                            nome_usuario: novoNome,
                            adm: novoAdm,
                            client: novoClient,
                            permiss_crediario: novoPermissCrediario
                        })
                        .eq('id', clientId);

                    if (error) throw error;

                    displayMessage(editClientMessage, 'Dados do cliente atualizados com sucesso!', 'success');
                    await fetchBranchClients(); // Atualiza a lista na página

                    setTimeout(() => {
                        if (editClientModal) editClientModal.classList.add('hidden');
                    }, 1500);

                } catch (error) {
                    console.error('Erro ao atualizar cliente:', error.message);
                    displayMessage(editClientMessage, `Erro ao atualizar cliente: ${error.message}`, 'error');
                } finally {
                    toggleLoading(submitButton, false);
                }
            });
        }
    }

    initializePage();
});