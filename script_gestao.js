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
    
    // Referências para o modal de relatórios
    const openReportsModalButton = document.getElementById('open-reports-modal-button');
    const reportsModal = document.getElementById('reports-modal');
    const closeReportsModalButton = document.getElementById('close-reports-modal-button');
    const generateDebitReportButton = document.getElementById('generate-debit-report-button');
    const generateSalesReportButton = document.getElementById('generate-sales-report-button');
    const reportResultsContainer = document.getElementById('report-results-container');
    const reportMessageArea = document.getElementById('report-message-area');
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
        });
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

    // --- CONTROLES DO MODAL DE RELATÓRIOS ---
    if (openReportsModalButton && reportsModal) {
        openReportsModalButton.addEventListener('click', () => {
            reportsModal.classList.remove('hidden');
            if (reportMessageArea) reportMessageArea.textContent = ''; // Limpa mensagens anteriores
            if (reportResultsContainer) reportResultsContainer.innerHTML = ''; // Limpa resultados anteriores
        });
    }

    if (closeReportsModalButton && reportsModal) {
        closeReportsModalButton.addEventListener('click', () => {
            reportsModal.classList.add('hidden');
        });
    }

    // Opcional: Fechar o modal se o usuário clicar fora do conteúdo do modal
    if (reportsModal) {
        reportsModal.addEventListener('click', (event) => {
            if (event.target === reportsModal) { // Verifica se o clique foi no próprio modal (fundo)
                reportsModal.classList.add('hidden');
            }
        });
    }

    // --- FUNCIONALIDADE DE RELATÓRIOS ---
    async function generateDebitReport() {
        if (!reportResultsContainer || !reportMessageArea || !generateDebitReportButton) return;

        toggleLoading(generateDebitReportButton, true);
        displayMessage(reportMessageArea, 'Gerando relatório de débitos...', 'info');
        reportResultsContainer.innerHTML = ''; // Limpa resultados anteriores

        try {
            // Etapa 1: Buscar contas a receber com saldo devedor
            const { data: contas, error: contasError } = await _supabase
                .from('contas_receber')
                .select('id_cliente, saldo_devedor') // Assumindo que 'id_cliente' é a FK para 'usuarios'
                .gt('saldo_devedor', 0);

            if (contasError) throw contasError;

            if (!contas || contas.length === 0) {
                displayMessage(reportMessageArea, 'Nenhum cliente com débito encontrado.', 'success');
                reportResultsContainer.innerHTML = '<p>Nenhum dado a exibir.</p>';
                toggleLoading(generateDebitReportButton, false);
                return;
            }

            // Etapa 2: Buscar nomes dos clientes e montar o relatório
            // Criar um array de IDs de clientes únicos para evitar consultas repetidas se um cliente tiver múltiplas contas
            const clientIds = [...new Set(contas.map(conta => conta.id_cliente))];
            
            const { data: usuarios, error: usuariosError } = await _supabase
                .from('usuarios')
                .select('id, nome_usuario')
                .in('id', clientIds);

            if (usuariosError) throw usuariosError;

            // Mapear IDs de usuário para nomes para fácil consulta
            const userIdToNameMap = usuarios.reduce((acc, user) => {
                acc[user.id] = user.nome_usuario || 'Nome não informado';
                return acc;
            }, {});

            // Montar o HTML do relatório
            let reportHTML = '<ul>';
            contas.forEach(conta => {
                const clientName = userIdToNameMap[conta.id_cliente] || 'Cliente desconhecido';
                reportHTML += `<li>${clientName}: R$ ${conta.saldo_devedor.toFixed(2)}</li>`;
            });
            reportHTML += '</ul>';

            reportResultsContainer.innerHTML = reportHTML;
            displayMessage(reportMessageArea, 'Relatório de débitos gerado com sucesso.', 'success');

        } catch (error) {
            console.error('Erro ao gerar relatório de débitos:', error);
            displayMessage(reportMessageArea, `Erro ao gerar relatório: ${error.message}`, 'error');
            reportResultsContainer.innerHTML = '<p>Falha ao carregar dados.</p>';
        } finally {
            toggleLoading(generateDebitReportButton, false);
        }
    }

    if (generateDebitReportButton) {
        generateDebitReportButton.addEventListener('click', generateDebitReport);
    }

    async function generateSalesReport() {
        if (!reportResultsContainer || !reportMessageArea || !generateSalesReportButton) return;

        toggleLoading(generateSalesReportButton, true);
        displayMessage(reportMessageArea, 'Gerando relatório de vendas por cliente...', 'info');
        reportResultsContainer.innerHTML = ''; // Limpa resultados anteriores

        try {
            // Etapa 1: Buscar todas as transações
            const { data: transacoes, error: transacoesError } = await _supabase
                .from('transacoes')
                .select('id_conta_receber, valor_transacao'); // Assumindo que 'valor_transacao' é o campo do valor

            if (transacoesError) throw transacoesError;

            if (!transacoes || transacoes.length === 0) {
                displayMessage(reportMessageArea, 'Nenhuma transação encontrada.', 'success');
                reportResultsContainer.innerHTML = '<p>Nenhum dado a exibir.</p>';
                toggleLoading(generateSalesReportButton, false);
                return;
            }

            // Etapa 2: Buscar todas as contas a receber para mapear para clientes
            // Pegar apenas os IDs únicos de contas_receber das transações
            const uniqueContaReceberIds = [...new Set(transacoes.map(t => t.id_conta_receber))];
            
            const { data: contas, error: contasError } = await _supabase
                .from('contas_receber')
                .select('id, id_cliente') // 'id' aqui é o PK de contas_receber
                .in('id', uniqueContaReceberIds);

            if (contasError) throw contasError;

            // Mapear id_conta_receber para id_cliente
            const contaToClientMap = contas.reduce((acc, conta) => {
                acc[conta.id] = conta.id_cliente;
                return acc;
            }, {});

            // Etapa 3: Agregar vendas por cliente
            const salesByClient = transacoes.reduce((acc, transacao) => {
                const clientId = contaToClientMap[transacao.id_conta_receber];
                if (clientId) {
                    if (!acc[clientId]) {
                        acc[clientId] = { totalSales: 0, transactionCount: 0 };
                    }
                    acc[clientId].totalSales += transacao.valor_transacao;
                    acc[clientId].transactionCount++;
                }
                return acc;
            }, {});

            const clientIdsForSales = Object.keys(salesByClient);
            if (clientIdsForSales.length === 0) {
                displayMessage(reportMessageArea, 'Não foi possível mapear transações para clientes ou não há vendas.', 'success');
                reportResultsContainer.innerHTML = '<p>Nenhum dado de venda por cliente a exibir.</p>';
                toggleLoading(generateSalesReportButton, false);
                return;
            }

            // Etapa 4: Buscar nomes dos clientes
            const { data: usuarios, error: usuariosError } = await _supabase
                .from('usuarios')
                .select('id, nome_usuario')
                .in('id', clientIdsForSales);

            if (usuariosError) throw usuariosError;
            
            const userIdToNameMap = usuarios.reduce((acc, user) => {
                acc[user.id] = user.nome_usuario || 'Nome não informado';
                return acc;
            }, {});

            // Etapa 5: Montar o HTML do relatório
            let reportHTML = '<ul>';
            for (const clientId of clientIdsForSales) {
                const clientName = userIdToNameMap[clientId] || 'Cliente desconhecido';
                const salesData = salesByClient[clientId];
                reportHTML += `<li>${clientName}: Total R$ ${salesData.totalSales.toFixed(2)} (${salesData.transactionCount} venda(s))</li>`;
            }
            reportHTML += '</ul>';

            reportResultsContainer.innerHTML = reportHTML;
            displayMessage(reportMessageArea, 'Relatório de vendas gerado com sucesso.', 'success');

        } catch (error) {
            console.error('Erro ao gerar relatório de vendas:', error);
            displayMessage(reportMessageArea, `Erro ao gerar relatório: ${error.message}`, 'error');
            reportResultsContainer.innerHTML = '<p>Falha ao carregar dados.</p>';
        } finally {
            toggleLoading(generateSalesReportButton, false);
        }
    }

    if (generateSalesReportButton) {
        generateSalesReportButton.addEventListener('click', generateSalesReport);
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
    }

    initializePage();
});