import { renderNavigation } from './ui/navigation.js';
import { initThemeSwitcher } from './ui/theme-switcher.js';
import { renderFavoritesPage } from './pages/favorites.js';
import { renderSearchPage } from './pages/search.js';
import { renderSocialPage } from './pages/social.js';
import { renderProfilePage } from './pages/profile.js';
import { renderPantryPage } from './pages/pantry.js';
import { onAuthStateChanged } from './auth.js'; 
import { db } from './firebase-config.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js';

const mainContent = document.getElementById('main-content');

/**
 * Roteador principal da aplicação.
 * @param {string} pageName - O nome da página a ser renderizada.
 */
function MapsTo(pageName) {
    if (!mainContent) {
        console.error("Elemento 'main-content' não encontrado.");
        return;
    }
    mainContent.innerHTML = ''; 
    
    document.querySelectorAll('.navbar__links a, .dropdown-item').forEach(link => {
        if (link.dataset.page) {
            link.classList.toggle('active', link.dataset.page === pageName);
        }
    });

    switch (pageName) {
        case 'criar':
            renderSearchPage(mainContent);
            break;
        case 'despensa':
            renderPantryPage(mainContent);
            break;
        case 'favoritos':
            renderFavoritesPage(mainContent);
            break;
        case 'social':
            renderSocialPage(mainContent);
            break;
        case 'profile':
            renderProfilePage(mainContent);
            break;
        default:
            renderSearchPage(mainContent); 
    }
}

/**
 * Inicializa a aplicação quando o DOM está totalmente carregado.
 */
function init() {
    onAuthStateChanged(async (authUser) => {
        if (authUser) {
            const userDocRef = doc(db, 'users', authUser.uid);
            const userDoc = await getDoc(userDocRef);

            let finalUser = { ...authUser }; 
            if (userDoc.exists()) {
                const firestoreData = userDoc.data();
                finalUser.displayName = firestoreData.displayName || authUser.displayName;
                finalUser.photoURL = firestoreData.photoURL || authUser.photoURL;
            } else {
                 console.warn("Usuário autenticado mas sem documento no Firestore. Isso pode acontecer no primeiro login.");
            }
            
            const splashScreen = document.getElementById('welcome-splash');
            const welcomeMessage = document.getElementById('welcome-message');

            if (splashScreen && welcomeMessage) {
                const firstName = finalUser.displayName ? finalUser.displayName.split(' ')[0] : 'Chef';
                welcomeMessage.textContent = `Bem-vindo(a), ${firstName}!`;
                setTimeout(() => splashScreen.classList.add('hidden'), 2000);
            }

            const header = document.getElementById('header-placeholder');
            if (header) {
                renderNavigation(header, MapsTo, finalUser); 
                initThemeSwitcher();
                MapsTo('criar'); 
            } else {
                console.error("Elemento 'header-placeholder' não encontrado.");
            }

        } else {
            // Se não há usuário, redireciona para a página de login.
            console.log("Nenhum usuário logado. Redirecionando para a página de login...");
            window.location.href = 'index.html';
        }
    });
}

// Ouve o evento de carregamento da página e chama a função de inicialização.
document.addEventListener('DOMContentLoaded', init);