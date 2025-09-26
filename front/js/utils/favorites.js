const FAVORITES_KEY = 'combinet_favorites';

/**
 * Pega as receitas favoritas do localStorage de forma segura.
 * @returns {Array} - Um array de receitas, garantido.
 */
export const getFavorites = () => {
    try {
        const favoritesJSON = localStorage.getItem(FAVORITES_KEY);
        if (!favoritesJSON) return [];
        const favorites = JSON.parse(favoritesJSON);
        return Array.isArray(favorites) ? favorites : [];
    } catch (e) {
        console.error("Erro ao ler favoritos, limpando dados corrompidos.", e);
        localStorage.removeItem(FAVORITES_KEY);
        return [];
    }
};

/**
 * Salva a lista de favoritos no localStorage.
 * @param {Array} favorites - O array de receitas favoritas.
 */
const saveFavorites = (favorites) => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
};

/**
 * Adiciona ou remove uma receita dos favoritos.
 * @param {object} recipeData - Os dados completos da receita.
 * @returns {boolean} - Retorna true se a receita agora é favorita, false caso contrário.
 */
export const toggleFavorite = (recipeData) => {
    const favorites = getFavorites();
    const existingIndex = favorites.findIndex(fav => fav.id === recipeData.id);

    if (existingIndex > -1) {
        // Remove dos favoritos
        favorites.splice(existingIndex, 1);
        saveFavorites(favorites);
        return false;
    } else {
        // Adiciona aos favoritos
        favorites.push(recipeData);
        saveFavorites(favorites);
        return true;
    }
};

/**
 * Verifica se uma receita é favorita.
 * @param {number} recipeId - O ID da receita.
 * @returns {boolean}
 */
export const isFavorite = (recipeId) => {
    const favorites = getFavorites();
    return favorites.some(fav => fav.id === recipeId);
};

