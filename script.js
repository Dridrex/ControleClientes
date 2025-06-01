document.addEventListener('DOMContentLoaded', () => {
    // --- VERIFICAÇÃO INICIAL ---
    if (typeof supabase === 'undefined') {
        alert('Erro crítico: SDK do Supabase não foi carregado. Verifique a conexão com a internet ou o console para erros de bloqueio.');
        return;
    }

    // --- CONFIGURAÇÃO DO SUPABASE ---
    const SUPABASE_URL = 'https://qomxmsehcaumeimyzrrw.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvbXhtc2VoY2F1bWVpbXl6cnJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1NTk4MTMsImV4cCI6MjA2NDEzNTgxM30.Z3U7qLSbYIMKddsRM4UD-EmtKV01WNK2sBgf_gnYXUI';
    const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // --- SELEÇÃO DOS ELEMENTOS DO DOM ---
    const authView = document.getElementById('auth-view');
    const dashboardView = document.getElementById('dashboard-view');
    const loginSection = document.getElementById('login-section');
    const registerSection = document.getElementById('register-section');

    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const logoutButton = document.getElementById('logout-button');
    
    const loginMessage = document.getElementById('login-message');
    const registerMessage = document.getElementById('register-message');
    
    const userGreeting = document.getElementById('user-greeting');

    // --- FUNÇÕES AUXILIARES ---

    /** Exibe uma mensagem na tela.
     * @param {HTMLElement} element Onde exibir a mensagem.
     * @param {string} text O texto da mensagem.
     * @param {'error' | 'success'} type O tipo de mensagem.
     */
    function displayMessage(element, text, type = 'error') {
        element.textContent = text;
        element.className = `message-area ${type}`;
    }

    /** Ativa/desativa o estado de carregamento de um botão.
     * @param {HTMLButtonElement} button O botão a ser modificado.
     * @param {boolean} isLoading True para ativar o carregamento.
     */
    function toggleLoading(button, isLoading) {
        button.disabled = isLoading;
        button.innerHTML = isLoading ? '<span class="loader"></span> Carregando...' : button.dataset.originalText;
    }

    // --- LÓGICA PRINCIPAL DA APLICAÇÃO ---

    /** Busca o perfil do usuário na tabela `public.usuarios` e atualiza a UI. */
    async function loadUserProfile(user) {
        if (!user) return;
        
        try {
            const { data: profile, error } = await _supabase
                .from('usuarios') // O nome da sua tabela de perfis
                .select('nome_usuario') // A coluna com o nome do usuário
                .eq('id', user.id)
                .single();

            if (error) throw error;
            
            if (profile && profile.nome_usuario) {
                userGreeting.textContent = `Olá, ${profile.nome_usuario}`;
            } else {
                userGreeting.textContent = `Olá, ${user.email.split('@')[0]}`;
            }

        } catch (error) {
            console.error('Erro ao buscar perfil do usuário:', error.message);
            // Se falhar, exibe o email como fallback
            userGreeting.textContent = `Olá, ${user.email.split('@')[0]}`;
        }
    }
    
    /** Atualiza a visualização principal (autenticação ou dashboard). */
    function updateView(view) {
        if (view === 'dashboard') {
            authView.classList.add('hidden');
            dashboardView.classList.remove('hidden');
        } else {
            dashboardView.classList.add('hidden');
            authView.classList.remove('hidden');
        }
    }

    // --- MANIPULADORES DE EVENTOS (HANDLERS) ---
    
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const button = loginForm.querySelector('button');
        button.dataset.originalText = button.innerHTML;

        toggleLoading(button, true);
        displayMessage(loginMessage, '', 'success');

        try {
            const { data, error } = await _supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
            // O onAuthStateChange cuidará de atualizar a UI.
        } catch (error) {
            displayMessage(loginMessage, error.message, 'error');
        } finally {
            toggleLoading(button, false);
        }
    });

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        const button = registerForm.querySelector('button');
        button.dataset.originalText = button.innerHTML;

        if (password !== confirmPassword) {
            displayMessage(registerMessage, 'As senhas não coincidem.', 'error');
            return;
        }

        toggleLoading(button, true);
        displayMessage(registerMessage, '', 'success');
        
        try {
            const { data, error } = await _supabase.auth.signUp({ email, password });
            if (error) throw error;
            displayMessage(registerMessage, 'Registro realizado! Verifique seu e-mail para confirmação (se aplicável).', 'success');
            registerForm.reset();
        } catch (error) {
            displayMessage(registerMessage, error.message, 'error');
        } finally {
            toggleLoading(button, false);
        }
    });

    logoutButton.addEventListener('click', async () => {
        const button = logoutButton;
        button.dataset.originalText = button.innerHTML;
        toggleLoading(button, true);

        await _supabase.auth.signOut();
        
        toggleLoading(button, false);
        // O onAuthStateChange cuidará de atualizar a UI.
    });
    
    // Links para trocar entre formulários de login e registro
    document.getElementById('show-register-link').addEventListener('click', (e) => {
        e.preventDefault();
        loginSection.classList.add('hidden');
        registerSection.classList.remove('hidden');
    });

    document.getElementById('show-login-link').addEventListener('click', (e) => {
        e.preventDefault();
        registerSection.classList.add('hidden');
        loginSection.classList.remove('hidden');
    });

    // --- INICIALIZAÇÃO E GERENCIAMENTO DE SESSÃO ---

    /** Ponto de entrada: verifica a sessão e ouve mudanças de estado. */
    function initialize() {
        // Ouve todas as mudanças de estado da autenticação (login, logout)
        _supabase.auth.onAuthStateChange((event, session) => {
            if (session && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
                // Usuário está logado
                loadUserProfile(session.user);
                updateView('dashboard');
            } else if (event === 'SIGNED_OUT') {
                // Usuário deslogou
                updateView('auth');
            }
        });
    }

    // Inicia a aplicação
    initialize();
});