// script.js

document.addEventListener('DOMContentLoaded', function() {
    const SUPABASE_URL = 'https://qomxmsehcaumeimyzrrw.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvbXhtc2VoY2F1bWVpbXl6cnJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1NTk4MTMsImV4cCI6MjA2NDEzNTgxM30.Z3U7qLSbYIMKddsRM4UD-EmtKV01WNK2sBgf_gnYXUI';

    // Garante que Supabase está definido antes de tentar usá-lo
    if (typeof supabase === 'undefined') {
        console.error('ERRO CRÍTICO: Objeto Supabase não encontrado. Verifique se o SDK foi carregado corretamente.');
        return; // Impede a execução do restante do script
    }

    const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const registerPanel = document.getElementById('registerPanel');
    const loginPanel = document.getElementById('loginPanel');
    const dashboardPanel = document.getElementById('dashboardPanel');
    const registerForm = document.getElementById('registerForm');
    const loginForm = document.getElementById('loginForm');
    const registerEmailInput = document.getElementById('registerEmail');
    const registerPasswordInput = document.getElementById('registerPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const registerMessageDisplay = document.getElementById('registerMessage');
    const loginEmailInput = document.getElementById('loginEmail');
    const loginPasswordInput = document.getElementById('loginPassword');
    const loginMessageDisplay = document.getElementById('loginMessage');
    const showLoginLink = document.getElementById('showLogin');
    const showRegisterLink = document.getElementById('showRegister');
    const logoutButton = document.getElementById('logoutButton');

    function showRegisterPanel() {
        registerPanel.classList.remove('hidden');
        loginPanel.classList.add('hidden');
        dashboardPanel.classList.add('hidden');
        registerMessageDisplay.textContent = '';
        loginMessageDisplay.textContent = '';
    }

    function showLoginPanel() {
        loginPanel.classList.remove('hidden');
        registerPanel.classList.add('hidden');
        dashboardPanel.classList.add('hidden');
        registerMessageDisplay.textContent = '';
        loginMessageDisplay.textContent = '';
    }

    function showDashboardPanel() {
        dashboardPanel.classList.remove('hidden');
        loginPanel.classList.add('hidden');
        registerPanel.classList.add('hidden');
    }

    if (showLoginLink) {
        showLoginLink.addEventListener('click', function(e) {
            e.preventDefault();
            showLoginPanel();
        });
    }

    if (showRegisterLink) {
        showRegisterLink.addEventListener('click', function(e) {
            e.preventDefault();
            showRegisterPanel();
        });
    }

    registerForm.addEventListener('submit', async function(event) {
        event.preventDefault();

        registerMessageDisplay.textContent = '';
        registerMessageDisplay.className = 'message';

        const email = registerEmailInput.value;
        const password = registerPasswordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        if (password !== confirmPassword) {
            registerMessageDisplay.textContent = 'As senhas não coincidem!';
            registerMessageDisplay.className = 'message error';
            return;
        }

        if (password.length < 6) {
            registerMessageDisplay.textContent = 'A senha deve ter no mínimo 6 caracteres.';
            registerMessageDisplay.className = 'message error';
            return;
        }

        try {
            const { data, error } = await supabase.auth.signUp({
                email: email,
                password: password,
            });

            if (error) {
                registerMessageDisplay.textContent = `Erro no registro: ${error.message}`;
                registerMessageDisplay.className = 'message error';
            } else {
                if (data.user && data.session) {
                    registerMessageDisplay.textContent = 'Registro bem-sucedido! Você será redirecionado.';
                    registerMessageDisplay.className = 'message success';
                    setTimeout(showDashboardPanel, 1500);
                } else if (data.session === null && data.user === null) {
                    registerMessageDisplay.textContent = 'Registro efetuado! Um e-mail de confirmação foi enviado para você. Por favor, verifique sua caixa de entrada (e spam).';
                    registerMessageDisplay.className = 'message success';
                } else {
                    registerMessageDisplay.textContent = 'Registro efetuado, mas algo inesperado aconteceu. Por favor, verifique sua caixa de entrada.';
                    registerMessageDisplay.className = 'message success';
                }

                registerEmailInput.value = '';
                registerPasswordInput.value = '';
                confirmPasswordInput.value = '';
            }
        } catch (error) {
            registerMessageDisplay.textContent = `Ocorreu um erro inesperado: ${error.message}`;
            registerMessageDisplay.className = 'message error';
        }
    });

    loginForm.addEventListener('submit', async function(event) {
        event.preventDefault();

        loginMessageDisplay.textContent = '';
        loginMessageDisplay.className = 'message';

        const email = loginEmailInput.value;
        const password = loginPasswordInput.value;

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password,
            });

            if (error) {
                loginMessageDisplay.textContent = `Erro no login: ${error.message}`;
                loginMessageDisplay.className = 'message error';
            } else {
                loginMessageDisplay.textContent = 'Login bem-sucedido! Bem-vindo!';
                loginMessageDisplay.className = 'message success';
                loginEmailInput.value = '';
                loginPasswordInput.value = '';
                setTimeout(showDashboardPanel, 1500);
            }
        } catch (error) {
            loginMessageDisplay.textContent = `Ocorreu um erro inesperado: ${error.message}`;
            loginMessageDisplay.className = 'message error';
        }
    });

    if (logoutButton) {
        logoutButton.addEventListener('click', async function() {
            try {
                const { error } = await supabase.auth.signOut();
                if (error) {
                    console.error('Erro ao fazer logout:', error.message);
                    alert('Erro ao fazer logout: ' + error.message);
                } else {
                    console.log('Logout bem-sucedido.');
                    showLoginPanel();
                }
            } catch (error) {
                console.error('Erro inesperado durante o logout:', error.message);
                alert('Erro inesperado durante o logout: ' + error.message);
            }
        });
    }

    async function checkUserSession() {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
            console.error('Erro ao obter sessão:', error.message);
        }
        if (session) {
            showDashboardPanel();
        } else {
            showLoginPanel();
        }
    }

    checkUserSession();
});