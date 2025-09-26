/**
 * Lida com o modal de perfil de usuário e o modal de configurações.
 */
export function initUserProfile() {
    const userIcon = document.querySelector('.navbar__user-icon');
    const body = document.body;
    const userName = 'Usuário'; // Placeholder, será substituído por dados reais

    if (!userIcon) return;

    // --- Cria o Dropdown do Perfil ---
    const profileDropdown = document.createElement('div');
    profileDropdown.className = 'user-dropdown';
    profileDropdown.innerHTML = `
        <div class="user-greeting">Olá, ${userName}!</div>
        <button class="user-dropdown-btn" id="settings-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-4.44a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8.88z"></path><path d="M18 2h2v6h-6V2z"></path><path d="M15 9h-2.5a1.5 1.5 0 0 0 0 3h1a1.5 1.5 0 0 1 0 3H12"></path><path d="M12 18v1"></path></svg>
            Configurações
        </button>
        <button class="user-dropdown-btn" id="logout-btn">
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            Sair
        </button>
    `;
    body.appendChild(profileDropdown);

    // --- Cria o Modal de Configurações ---
    const settingsModal = document.createElement('div');
    settingsModal.className = 'settings-modal';
    settingsModal.innerHTML = `
        <div class="modal-overlay"></div>
        <div class="modal-content">
            <button class="modal-close-btn">&times;</button>
            <h2>Configurações do Perfil</h2>
            <form id="settings-form">
                <div class="form-group">
                    <label for="username">Nome de Usuário</label>
                    <input type="text" id="username" value="${userName}" required>
                </div>
                <div class="form-group">
                    <label for="email">Email</label>
                    <input type="email" id="email" value="usuario@email.com" required>
                </div>
                <div class="form-group">
                    <label for="birthdate">Data de Nascimento</label>
                    <input type="date" id="birthdate">
                </div>
                <button type="submit" class="btn">Salvar Alterações</button>
            </form>
        </div>
    `;
    body.appendChild(settingsModal);

    // --- Lógica de Eventos ---

    // Abrir/Fechar Dropdown
    userIcon.addEventListener('click', (e) => {
        e.stopPropagation();
        profileDropdown.classList.toggle('is-active');
    });

    // Fechar dropdown ao clicar fora
    document.addEventListener('click', () => {
        if (profileDropdown.classList.contains('is-active')) {
            profileDropdown.classList.remove('is-active');
        }
    });
    
    // Parar propagação para não fechar ao clicar dentro do dropdown
    profileDropdown.addEventListener('click', (e) => e.stopPropagation());

    // Abrir Modal de Configurações
    document.getElementById('settings-btn').addEventListener('click', () => {
        profileDropdown.classList.remove('is-active');
        settingsModal.classList.add('is-visible');
    });
    
    // Fechar Modal de Configurações
    const closeSettingsModal = () => {
        settingsModal.classList.remove('is-visible');
    };
    settingsModal.querySelector('.modal-overlay').addEventListener('click', closeSettingsModal);
    settingsModal.querySelector('.modal-close-btn').addEventListener('click', closeSettingsModal);
    
    // Lógica do botão Sair
    document.getElementById('logout-btn').addEventListener('click', () => {
        window.location.href = '../index.html'; 
    });

    // Lógica de salvar formulário de configurações
    document.getElementById('settings-form').addEventListener('submit', (e) => {
        e.preventDefault();
        // Aqui viria a lógica para enviar os dados para o backend
        console.log('Dados salvos (simulação):');
        console.log('Nome:', document.getElementById('username').value);
        console.log('Email:', document.getElementById('email').value);
        console.log('Data Nasc:', document.getElementById('birthdate').value);
        closeSettingsModal();
    });
}
