import { renderNavigation } from './ui/navigation.js';
import { initThemeSwitcher } from './ui/theme-switcher.js';
import { initUserProfile } from './ui/user-profile.js'; // Importa o novo módulo
import { renderFavoritesPage } from './pages/favorites.js';
import { renderSearchPage } from './pages/search.js';
import { renderSocialPage } from './pages/social.js'; // Importa a página social

const mainContent = document.getElementById('main-content');

/**
 * Roteador principal da aplicação.
 * @param {string} pageName - O nome da página a ser renderizada.
 */
function MapsTo(pageName) {
    mainContent.innerHTML = '';
    
    // Atualiza o link ativo na navegação (agora funciona para desktop e mobile)
    document.querySelectorAll('.navbar__links--desktop a, .navbar__links--mobile a').forEach(link => {
        link.classList.toggle('active', link.dataset.page === pageName);
    });

    switch (pageName) {
        case 'combinar':
            renderSearchPage(mainContent);
            break;
        case 'favoritos':
            renderFavoritesPage(mainContent);
            break;
        case 'social': // Adiciona a rota para a página social
            renderSocialPage(mainContent);
            break;
        default:
            renderSearchPage(mainContent); // Página padrão
    }
}

/**
 * Inicializa a aplicação.
 */
function init() {
    const header = document.getElementById('header-placeholder');
    renderNavigation(header, MapsTo);
    initThemeSwitcher();
    initUserProfile(); // Inicia a funcionalidade do perfil de usuário
    MapsTo('combinar'); // Define a página inicial
}

document.addEventListener('DOMContentLoaded', init);