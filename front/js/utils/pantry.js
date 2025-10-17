// pantry.js - ATUALIZADO PARA FIREBASE SDK v9+
import { getCurrentUser } from '../auth.js';
import { db } from '../firebase-config.js';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js';
import { categorizeIngredient } from '../gemini-api.js';

/**
 * Pega os ingredientes da despensa do usuário e os agrupa por categoria.
 * @returns {Promise<Object>} Uma promessa que resolve para um objeto com categorias como chaves e arrays de ingredientes como valores.
 */
export const getPantryIngredients = async () => {
    const user = getCurrentUser();
    if (!user) return {};

    try {
        const pantryCol = collection(db, 'users', user.uid, 'pantry');
        const snapshot = await getDocs(pantryCol);
        
        const ingredients = snapshot.docs.map(doc => doc.data());

        // Agrupa os ingredientes por categoria
        const grouped = ingredients.reduce((acc, ingredient) => {
            const category = ingredient.category || 'Outros';
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(ingredient);
            // Ordena os ingredientes dentro da categoria
            acc[category].sort((a, b) => a.name.localeCompare(b.name));
            return acc;
        }, {});

        // Ordena as categorias alfabeticamente
        return Object.keys(grouped).sort().reduce(
            (obj, key) => { 
                obj[key] = grouped[key]; 
                return obj;
            }, 
            {}
        );

    } catch (error) {
        console.error("Erro ao buscar ingredientes da despensa:", error);
        return {};
    }
};

/**
 * Adiciona um novo ingrediente à despensa, categorizando-o primeiro.
 * @param {string} ingredient - O ingrediente a ser adicionado.
 * @returns {Promise<boolean>} - Retorna `true` se foi adicionado, `false` caso contrário.
 */
export const addPantryIngredient = async (ingredient) => {
    const user = getCurrentUser();
    if (!user || !ingredient || typeof ingredient !== 'string' || ingredient.trim() === '') {
        return false;
    }

    const formattedIngredient = ingredient.trim().toLowerCase();
    
    try {
        const category = await categorizeIngredient(formattedIngredient);
        
        const ingredientRef = doc(db, 'users', user.uid, 'pantry', formattedIngredient);
        await setDoc(ingredientRef, { 
            name: formattedIngredient,
            category: category 
        });
        return true;
    } catch (error) {
        console.error("Erro ao adicionar ingrediente:", error);
        return false;
    }
};

/**
 * Remove um ingrediente da despensa do usuário no Firestore.
 * @param {string} ingredientToRemove - O ingrediente a ser removido.
 */
export const removePantryIngredient = async (ingredientToRemove) => {
    const user = getCurrentUser();
    if (!user) return;

    try {
        const ingredientRef = doc(db, 'users', user.uid, 'pantry', ingredientToRemove.toLowerCase());
        await deleteDoc(ingredientRef);
    } catch (error) {
        console.error("Erro ao remover ingrediente:", error);
    }
};

/**
 * NOVO: Atualiza um ingrediente na despensa. Pode alterar nome e/ou categoria.
 * @param {object} oldIngredient - O objeto do ingrediente original { name, category }.
 * @param {object} newIngredientData - Os novos dados { name, category }.
 * @returns {Promise<boolean>} - Retorna true se a operação foi bem-sucedida.
 */
export const updatePantryIngredient = async (oldIngredient, newIngredientData) => {
    const user = getCurrentUser();
    if (!user || !oldIngredient || !newIngredientData) return false;

    const oldName = oldIngredient.name.trim().toLowerCase();
    const newName = newIngredientData.name.trim().toLowerCase();
    const newCategory = newIngredientData.category;

    if (!newName) return false; // Novo nome não pode ser vazio

    try {
        // Se o nome não mudou, apenas atualize o documento (mais eficiente)
        if (oldName === newName) {
            const ingredientRef = doc(db, 'users', user.uid, 'pantry', oldName);
            await setDoc(ingredientRef, { name: newName, category: newCategory }, { merge: true });
            return true;
        } else {
            // Se o nome mudou, temos que apagar o antigo e criar um novo
            await removePantryIngredient(oldName);
            
            const newIngredientRef = doc(db, 'users', user.uid, 'pantry', newName);
            await setDoc(newIngredientRef, { name: newName, category: newCategory });
            return true;
        }
    } catch (error) {
        console.error("Erro ao atualizar ingrediente:", error);
        return false;
    }
};