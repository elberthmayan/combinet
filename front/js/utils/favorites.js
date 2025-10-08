import { getCurrentUser } from '../auth.js';
import { db } from '../firebase-config.js';
import { collection, getDocs, doc, getDoc, setDoc, deleteDoc } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js';

/**
 * Pega TODAS as receitas favoritas do usuário como uma lista única.
 * @returns {Promise<Array>} Uma promessa que resolve para um array de objetos de receita.
 */
export const getAllFavorites = async () => {
    const user = getCurrentUser();
    if (!user) return [];

    try {
        const favoritesCol = collection(db, 'users', user.uid, 'favorites');
        const snapshot = await getDocs(favoritesCol);
        return snapshot.docs.map(doc => doc.data());
    } catch (error) {
        console.error("Erro ao buscar favoritos:", error);
        return [];
    }
};

/**
 * Salva uma receita nos favoritos do usuário.
 * @param {object} recipeData - Os dados completos da receita.
 */
export const saveFavoriteRecipe = async (recipeData) => {
    const user = getCurrentUser();
    if (!user) return;

    // Remove o conceito de 'folder' antes de salvar
    const { folder, ...recipeToSave } = recipeData;
    
    const recipeRef = doc(db, 'users', user.uid, 'favorites', String(recipeToSave.id));

    try {
        await setDoc(recipeRef, recipeToSave);
    } catch (error) {
        console.error("Erro ao salvar receita:", error);
    }
};


/**
 * Remove uma receita dos favoritos.
 * @param {string|number} recipeId - O ID da receita a ser removida.
 */
export const removeRecipeFromFavorites = async (recipeId) => {
    const user = getCurrentUser();
    if (!user) return;

    const recipeRef = doc(db, 'users', user.uid, 'favorites', String(recipeId));
    try {
        await deleteDoc(recipeRef);
    } catch (error) {
        console.error("Erro ao remover receita dos favoritos:", error);
    }
};


/**
 * Verifica se UMA receita específica é favorita.
 * @param {number | string} recipeId - O ID da receita.
 * @returns {Promise<boolean>}
 */
export const isFavorite = async (recipeId) => {
    const user = getCurrentUser();
    if (!user) return false;

    try {
        const recipeRef = doc(db, 'users', user.uid, 'favorites', String(recipeId));
        const docSnap = await getDoc(recipeRef);
        return docSnap.exists();
    } catch (error) {
        console.error("Erro ao verificar favorito:", error);
        return false;
    }
};