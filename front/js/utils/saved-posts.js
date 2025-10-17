// saved-posts.js - ATUALIZADO PARA FIREBASE SDK v9+
import { getCurrentUser } from '../auth.js';
import { db } from '../firebase-config.js';
import { collection, getDocs, doc, getDoc, setDoc, deleteDoc } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js';


/**
 * Pega todas as publicações salvas pelo usuário logado no Firestore.
 * @returns {Promise<Array>} - Uma promessa que resolve para um array de posts.
 */
export const getSavedPosts = async () => {
    const user = getCurrentUser();
    if (!user) return [];

    try {
        const savedPostsCol = collection(db, 'users', user.uid, 'savedPosts');
        const snapshot = await getDocs(savedPostsCol);
        return snapshot.docs.map(doc => doc.data());
    } catch (error)
        {
        console.error("Erro ao buscar posts salvos:", error);
        return [];
    }
};

/**
 * Adiciona ou remove uma publicação dos salvos do usuário.
 * @param {object} postData - Os dados completos da publicação.
 * @returns {Promise<boolean>} - Retorna true se a publicação agora está salva, false caso contrário.
 */
export const toggleSavedPost = async (postData) => {
    const user = getCurrentUser();
    if (!user) return false;

    const postRef = doc(db, 'users', user.uid, 'savedPosts', postData.id);

    try {
        const docSnap = await getDoc(postRef);

        if (docSnap.exists()) {
            await deleteDoc(postRef);
            return false;
        } else {
            await setDoc(postRef, postData);
            return true;
        }
    } catch (error) {
        console.error("Erro ao salvar/remover post:", error);
        const docSnap = await getDoc(postRef);
        return docSnap.exists();
    }
};

/**
 * Verifica se uma publicação específica está salva pelo usuário.
 * @param {string} postId - O ID da publicação.
 * @returns {Promise<boolean>}
 */
export const isPostSaved = async (postId) => {
    const user = getCurrentUser();
    if (!user) return false;

    try {
        const postRef = doc(db, 'users', user.uid, 'savedPosts', postId);
        const docSnap = await getDoc(postRef);
        return docSnap.exists();
    } catch (error) {
        console.error("Erro ao verificar post salvo:", error);
        return false;
    }
};