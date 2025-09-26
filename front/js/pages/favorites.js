import { createCard } from '../ui/components.js';
import { getFavorites } from '../utils/favorites.js';

/**
 * Renderiza a página de favoritos, garantindo que todos os itens salvos sejam exibidos.
 * @param {HTMLElement} container - O elemento onde a página será renderizada.
 */
export const renderFavoritesPage = (container) => {
    container.innerHTML = ''; // Limpa o conteúdo anterior

    const favoritesContainer = document.createElement('div');
    favoritesContainer.className = 'container favorites-container';

    const title = document.createElement('h1');
    title.textContent = 'Minhas Receitas Favoritas';
    favoritesContainer.appendChild(title);

    const favorites = getFavorites();
    
    if (favorites.length === 0) {
        const emptyMessage = document.createElement('p');
        emptyMessage.className = 'empty-message';
        emptyMessage.textContent = 'Você ainda não salvou nenhuma receita. Clique no coração de uma receita para adicioná-la aqui!';
        favoritesContainer.appendChild(emptyMessage);
    } else {
        const grid = document.createElement('div');
        grid.id = 'favorites-grid';
        grid.className = 'card-grid';

        favorites.forEach(recipeData => {
            const card = createCard(recipeData);
            grid.appendChild(card);
        });

        // Adiciona um listener para remover o card da tela QUANDO ele for desfavoritado
        grid.addEventListener('recipeUnfavorited', (e) => {
            const { recipeId } = e.detail;
            const cardToRemove = grid.querySelector(`.card[data-id="${recipeId}"]`);
            if (cardToRemove) {
                // Animação de fade out antes de remover
                cardToRemove.style.transition = 'opacity 0.3s ease';
                cardToRemove.style.opacity = '0';
                setTimeout(() => {
                    cardToRemove.remove();
                    // Se a grade ficar vazia, exibe a mensagem
                    if (grid.children.length === 0) {
                        const emptyMessage = document.createElement('p');
                        emptyMessage.className = 'empty-message';
                        emptyMessage.textContent = 'Você ainda não salvou nenhuma receita. Clique no coração de uma receita para adicioná-la aqui!';
                        favoritesContainer.appendChild(emptyMessage);
                        grid.remove();
                    }
                }, 300);
            }
        });
        
        favoritesContainer.appendChild(grid);
    }

    container.appendChild(favoritesContainer);
};

