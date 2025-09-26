import { toggleFavorite, isFavorite } from '../utils/favorites.js';

/**
 * Cria e exibe um modal com os detalhes da receita.
 * @param {object} recipeData - Os dados da receita para exibir.
 */
const showRecipeModal = (recipeData) => {
    // Remove qualquer modal existente para evitar duplicatas
    const existingModal = document.querySelector('.recipe-modal');
    if (existingModal) {
        existingModal.remove();
    }

    const modal = document.createElement('div');
    modal.className = 'recipe-modal';
    modal.innerHTML = `
        <div class="modal-overlay"></div>
        <div class="modal-content">
            <button class="modal-close-btn">&times;</button>
            <img src="${recipeData.imageUrl}" alt="${recipeData.title}" class="modal-image">
            <div class="modal-text">
                <h2>${recipeData.title}</h2>
                <h3>Ingredientes:</h3>
                <ul>
                    ${recipeData.ingredients.map(ing => `<li>${ing}</li>`).join('')}
                </ul>
                <h3>Modo de Preparo:</h3>
                <p>${recipeData.preparation}</p>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden'; // Impede o scroll da página

    const closeModal = () => {
        modal.remove();
        document.body.style.overflow = 'auto';
    };

    modal.querySelector('.modal-overlay').addEventListener('click', closeModal);
    modal.querySelector('.modal-close-btn').addEventListener('click', closeModal);
};


/**
 * Cria um card de receita interativo.
 * @param {object} recipeData - Os dados da receita.
 * @returns {HTMLElement} - O elemento do card.
 */
export const createCard = (recipeData) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.id = recipeData.id;

    // Lógica do botão de favorito
    const favoriteBtn = document.createElement('button');
    const updateFavoriteButton = (isFav) => {
        favoriteBtn.className = isFav ? 'favorite-btn favorited' : 'favorite-btn';
        favoriteBtn.title = isFav ? 'Desfavoritar' : 'Favoritar';
        favoriteBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`;
    };
    
    updateFavoriteButton(isFavorite(recipeData.id));

    favoriteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isNowFavorite = toggleFavorite(recipeData);
        updateFavoriteButton(isNowFavorite);
    });

    card.innerHTML = `
        <img src="${recipeData.imageUrl}" alt="Foto de ${recipeData.title}" class="card__image">
        <div class="card__overlay"></div>
        <div class="card__content">
            <h4 class="card__title">${recipeData.title}</h4>
            <p class="card__description">${recipeData.description}</p>
        </div>
        <div class="card__actions"></div>
    `;
    card.querySelector('.card__actions').appendChild(favoriteBtn);

    // Abre o modal ao clicar no card (mas não no botão)
    card.addEventListener('click', () => {
        showRecipeModal(recipeData);
    });

    return card;
};

