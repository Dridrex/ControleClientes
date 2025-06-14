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

    // Novos seletores adicionados
    const registerClientButton = document.getElementById('register-client-button');
    const valuesClientModal = document.getElementById('values-client-modal'); // Already defined, good.
    const closeValuesModalButton = document.getElementById('close-values-modal-button'); // Already defined, good.
    const valuesClientMessage = document.getElementById('values-client-message'); // Already defined, good.
    // Spans for values will be fetched inside openValuesModal


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
                <button class="values-client-button" data-id="${clientProfile.id}">Valores</button>
            `;
            clientList.appendChild(listItem);

            const editButton = listItem.querySelector('.edit-client-button');
            if (editButton) { // Adicionar verificação para segurança
                editButton.addEventListener('click', () => {
                    openEditModal(clientProfile);
                });
            }

            const valuesButton = listItem.querySelector('.values-client-button');
            if (valuesButton) {
                valuesButton.addEventListener('click', () => {
                    openValuesModal(clientProfile.id);
                });
            }
        });
    }

    // Função para buscar valor da conta do cliente (simulado)
    async function fetchClientAccountValue(clientId) {
        console.log(`Fetching account value for client: ${clientId}`);
        await new Promise(resolve => setTimeout(resolve, 500));
        // Simular erro para um ID específico para teste
        if (clientId === 'error_test_account') {
            throw new Error("Simulated error fetching account value.");
        }
        return 1234.50; // Valor dummy
    }

    // Função para buscar total de compras do cliente (simulado)
    async function fetchClientTotalPurchases(clientId) {
        console.log(`Fetching total purchases for client: ${clientId}`);
        await new Promise(resolve => setTimeout(resolve, 700));
        if (clientId === 'error_test') { // Self-correction: specific error case
            throw new Error("Simulated error fetching purchases.");
        }
        return 5678.90; // Valor dummy
    }

    // Função para abrir e popular o modal de valores do cliente
    async function openValuesModal(clientId) {
        if (!valuesClientModal || !valuesClientMessage) {
            console.error('Modal de valores ou área de mensagem não encontrados.');
            return;
        }

        const totalAccountValueSpan = document.getElementById('total-account-value');
        const totalPurchasesValueSpan = document.getElementById('total-purchases-value');

        if (!totalAccountValueSpan || !totalPurchasesValueSpan) {
            console.error('Spans de valor no modal não encontrados.');
            return;
        }

        // Resetar estado do modal
        valuesClientMessage.textContent = '';
        valuesClientMessage.className = 'message-area'; // Reset classes
        totalAccountValueSpan.textContent = 'Carregando...';
        totalPurchasesValueSpan.textContent = 'Carregando...';
        valuesClientModal.classList.remove('hidden');

        try {
            const results = await Promise.allSettled([
                fetchClientAccountValue(clientId),
                fetchClientTotalPurchases(clientId)
            ]);

            const accountResult = results[0];
            const purchasesResult = results[1];
            let errorMessages = [];

            if (accountResult.status === 'fulfilled') {
                totalAccountValueSpan.textContent = `R$ ${accountResult.value.toFixed(2)}`;
            } else {
                totalAccountValueSpan.textContent = 'Erro';
                errorMessages.push(`Conta: ${accountResult.reason.message}`);
                console.error('Erro ao buscar valor da conta:', accountResult.reason);
            }

            if (purchasesResult.status === 'fulfilled') {
                totalPurchasesValueSpan.textContent = `R$ ${purchasesResult.value.toFixed(2)}`;
            } else {
                totalPurchasesValueSpan.textContent = 'Erro';
                errorMessages.push(`Compras: ${purchasesResult.reason.message}`);
                console.error('Erro ao buscar total de compras:', purchasesResult.reason);
            }

            if (errorMessages.length > 0) {
                displayMessage(valuesClientMessage, errorMessages.join('; '), 'error');
            }

        } catch (error) { // Este catch é para erros inesperados no Promise.allSettled ou setup
            console.error('Erro inesperado ao abrir modal de valores:', error);
            displayMessage(valuesClientMessage, 'Ocorreu um erro inesperado. Tente novamente.', 'error');
            totalAccountValueSpan.textContent = 'Erro';
            totalPurchasesValueSpan.textContent = 'Erro';
        }
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
        // Event listener para o botão "Cadastrar Cliente"
        if (registerClientButton) {
            registerClientButton.addEventListener('click', () => {
                console.log('Botão "Cadastrar Cliente" clicado.');
                // Futuramente, abriria um modal de cadastro ou redirecionaria
            });
        }

        // Lógica básica para o modal "Valores"
        if (closeValuesModalButton && valuesClientModal) {
            closeValuesModalButton.addEventListener('click', () => {
                valuesClientModal.classList.add('hidden');
            });
        }

        if (valuesClientModal) {
            valuesClientModal.addEventListener('click', (event) => {
                if (event.target === valuesClientModal) {
                    valuesClientModal.classList.add('hidden');
                }
            });
            // Limpar mensagem ao abrir (ou poderia ser feito na função de abrir o modal)
            // Por enquanto, vamos garantir que esteja limpo se for reaberto antes da implementação completa.
            // Esta linha será mais útil dentro de uma função `openValuesModal`
            // valuesClientMessage.textContent = '';
        }


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