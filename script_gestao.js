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

    // Selectors for Register Client Modal
    const registerClientModal = document.getElementById('register-client-modal');
    const closeRegisterModalButton = document.getElementById('close-register-modal-button');
    const registerClientForm = document.getElementById('register-client-form');
    const registerNomeUsuario = document.getElementById('register-nome-usuario');
    const registerEmail = document.getElementById('register-email');
    const registerSenha = document.getElementById('register-senha');
    const registerAdm = document.getElementById('register-adm');
    const registerPermissCrediario = document.getElementById('register-permiss-crediario');
    const registerClientMessage = document.getElementById('register-client-message');


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

    async function registerNewUser(nome_usuario, email, password, adm, permiss_crediario) {
        if (!registerClientMessage || !registerClientForm || !registerClientModal) {
            console.error("Elementos do modal de registro não encontrados para registerNewUser.");
            return;
        }
        displayMessage(registerClientMessage, 'Registrando novo cliente...', 'success');

        try {
            // Step 1: Create Auth User (Supabase SignUp)
            const { data: authData, error: authError } = await _supabase.auth.signUp({ email, password });

            if (authError) {
                displayMessage(registerClientMessage, `Erro ao criar autenticação: ${authError.message}`, 'error');
                console.error('Erro Supabase SignUp:', authError);
                return;
            }
            if (!authData.user) {
                displayMessage(registerClientMessage, 'Erro: Usuário não foi criado na autenticação, mas não houve erro explícito.', 'error');
                console.error('Supabase SignUp retornou sem erro, mas sem usuário:', authData);
                return;
            }

            const userId = authData.user.id;

            // Step 2: Add User to 'usuarios' Table
            // Note: Supabase policies should allow this insert.
            // 'client' is set to true by default for new registrations from this form.
            const { error: insertError } = await _supabase
                .from('usuarios')
                .insert([{
                    id: userId,
                    nome_usuario,
                    email,
                    adm,
                    client: true, // New users from this form are clients
                    permiss_crediario
                }]);

            if (insertError) {
                displayMessage(registerClientMessage, `Erro ao salvar dados do usuário: ${insertError.message}`, 'error');
                console.error('Erro ao inserir em usuarios:', insertError);
                // Consider: Attempt to delete the auth user if this fails.
                // For now, this might leave an orphaned auth user if the profile insert fails.
                // e.g., await _supabase.auth.admin.deleteUser(userId) // Requires admin privileges, complex for client-side
                console.error('Falha ao inserir em usuarios após signUp. ID do Auth User:', userId);
                return;
            }

            // Step 3: Success
            displayMessage(registerClientMessage, 'Cliente registrado com sucesso!', 'success');
            await fetchBranchClients(); // Refresh the client list

            setTimeout(() => {
                if (registerClientModal) registerClientModal.classList.add('hidden');
            }, 1500);

            if(registerClientForm) registerClientForm.reset();

        } catch (error) { // Catch any unexpected errors during the process
            console.error('Erro inesperado durante o registro:', error);
            displayMessage(registerClientMessage, `Erro inesperado: ${error.message}`, 'error');
        }
    }

    async function handleRegisterClientSubmit(event) {
        event.preventDefault();
        if (!registerClientForm || !registerNomeUsuario || !registerEmail || !registerSenha || !registerAdm || !registerPermissCrediario || !registerClientMessage) {
            console.error("Elementos do formulário de registro não encontrados.");
            return;
        }

        const submitButton = registerClientForm.querySelector('button[type="submit"]');
        // Ensure original text is set for toggleLoading
        if (submitButton && !submitButton.dataset.originalText) {
            submitButton.dataset.originalText = submitButton.textContent;
        }

        toggleLoading(submitButton, true);
        displayMessage(registerClientMessage, '', 'success'); // Clear previous messages

        const nome_usuario = registerNomeUsuario.value.trim();
        const email = registerEmail.value.trim();
        const password = registerSenha.value; // No trim for password
        const adm = registerAdm.checked;
        const permiss_crediario = registerPermissCrediario.checked;

        // Client-side Validation
        if (!nome_usuario || !email || !password) {
            displayMessage(registerClientMessage, "Nome de usuário, email e senha são obrigatórios.", 'error');
            toggleLoading(submitButton, false);
            return;
        }
        // Basic email validation (can be more complex)
        if (!email.includes('@') || !email.includes('.')) {
            displayMessage(registerClientMessage, "Formato de email inválido.", 'error');
            toggleLoading(submitButton, false);
            return;
        }
        if (password.length < 6) { // Supabase default minimum password length
             displayMessage(registerClientMessage, "A senha deve ter pelo menos 6 caracteres.", 'error');
            toggleLoading(submitButton, false);
            return;
        }


        try {
            await registerNewUser(nome_usuario, email, password, adm, permiss_crediario);
        } catch (error) { // Should be caught by registerNewUser, but as a fallback
            console.error("Erro não capturado por registerNewUser:", error);
            displayMessage(registerClientMessage, `Erro crítico no processo de registro: ${error.message}`, 'error');
        } finally {
            toggleLoading(submitButton, false);
        }
    }

    // --- PROTEÇÃO DA PÁGINA E CARREGAMENTO INICIAL DE DADOS ---
    async function initializePage() {
        // Event listener para o botão "Cadastrar Cliente"
        if (registerClientButton && registerClientModal && registerClientForm && registerClientMessage) {
            registerClientButton.addEventListener('click', () => {
                registerClientModal.classList.remove('hidden');
                registerClientMessage.textContent = '';
                registerClientMessage.className = 'message-area';
                registerClientForm.reset(); // Reseta os campos do formulário
            });
        }

        // Close logic for Register Client Modal
        if (closeRegisterModalButton && registerClientModal) {
            closeRegisterModalButton.addEventListener('click', () => {
                registerClientModal.classList.add('hidden');
            });
        }
        if (registerClientModal) {
            registerClientModal.addEventListener('click', (event) => {
                if (event.target === registerClientModal) {
                    registerClientModal.classList.add('hidden');
                }
            });
        }

        // Event listener for Register Client Form submission
        if (registerClientForm) {
            registerClientForm.addEventListener('submit', handleRegisterClientSubmit);
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