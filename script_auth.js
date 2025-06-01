document.addEventListener('DOMContentLoaded', () => {
    console.log('Auth Script Loaded.');

    if (typeof supabase === 'undefined') {
        alert('Erro crítico: SDK do Supabase não foi carregado.');
        return;
    }

    const SUPABASE_URL = 'https://qomxmsehcaumeimyzrrw.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvbXhtc2VoY2F1bWVpbXl6cnJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1NTk4MTMsImV4cCI6MjA2NDEzNTgxM30.Z3U7qLSbYIMKddsRM4UD-EmtKV01WNK2sBgf_gnYXUI';
    const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('Supabase client inicializado para auth.');

    const loginSection = document.getElementById('login-section');
    const registerSection = document.getElementById('register-section');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const loginMessage = document.getElementById('login-message');
    const registerMessage = document.getElementById('register-message');
    const showRegisterLink = document.getElementById('show-register-link');
    const showLoginLink = document.getElementById('show-login-link');

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
            button.innerHTML = button.dataset.originalText;
            button.disabled = false;
        }
    }

    // VERIFICA SE JÁ EXISTE SESSÃO AO CARREGAR A PÁGINA DE AUTH
    async function checkInitialSession() {
        const { data: { session } } = await _supabase.auth.getSession();
        if (session) {
            console.log('Sessão ativa encontrada, redirecionando para gestao.html');
            window.location.href = 'gestao.html'; // Redireciona se já estiver logado
        } else {
            console.log('Nenhuma sessão ativa, mostrando formulário de login.');
        }
    }
    checkInitialSession(); // Executa ao carregar o script

    // Listener para o formulário de Login
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            const button = loginForm.querySelector('button[type="submit"]');
            
            toggleLoading(button, true);
            displayMessage(loginMessage, '', 'success');

            try {
                const { data, error } = await _supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                
                // SUCESSO NO LOGIN
                console.log('Login bem-sucedido, redirecionando para gestao.html');
                window.location.href = 'gestao.html'; // Redireciona para a página de gestão

            } catch (error) {
                console.error('Erro no login:', error.message);
                displayMessage(loginMessage, error.message, 'error');
                toggleLoading(button, false);
            }
            // Não precisa de finally para resetar o botão aqui, pois ou redireciona ou dá erro.
        });
    }

    // Listener para o formulário de Registro
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            const button = registerForm.querySelector('button[type="submit"]');

            if (password !== confirmPassword) {
                displayMessage(registerMessage, 'As senhas não coincidem.', 'error'); return;
            }
            if (password.length < 6) {
                displayMessage(registerMessage, 'A senha deve ter no mínimo 6 caracteres.', 'error'); return;
            }
            toggleLoading(button, true);
            displayMessage(registerMessage, '', 'success');
            try {
                const { data, error } = await _supabase.auth.signUp({ email, password });
                if (error) throw error;
                displayMessage(registerMessage, 'Registro realizado! Por favor, faça o login.', 'success');
                registerForm.reset();
                // Opcional: redirecionar para a tela de login automaticamente
                if (loginSection && registerSection) {
                    registerSection.classList.add('hidden');
                    loginSection.classList.remove('hidden');
                }
            } catch (error) {
                console.error('Erro no registro:', error.message);
                displayMessage(registerMessage, error.message, 'error');
            } finally {
                toggleLoading(button, false);
            }
        });
    }

    // Links para trocar entre formulários
    if (showRegisterLink) {
        showRegisterLink.addEventListener('click', (e) => {
            e.preventDefault();
            if(loginSection) loginSection.classList.add('hidden');
            if(registerSection) registerSection.classList.remove('hidden');
        });
    }

    if (showLoginLink) {
        showLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            if(registerSection) registerSection.classList.add('hidden');
            if(loginSection) loginSection.classList.remove('hidden');
        });
    }
});