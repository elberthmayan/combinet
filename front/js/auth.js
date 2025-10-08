// auth.js - ATUALIZADO PARA FIREBASE SDK v9+
import { 
    auth, 
    db, 
    storage 
} from './firebase-config.js';
import { 
    GoogleAuthProvider, 
    signInWithPopup, 
    signOut as firebaseSignOut,
    onAuthStateChanged as firebaseOnAuthStateChanged,
    updateProfile,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendPasswordResetEmail as firebaseSendPasswordResetEmail,
    deleteUser,
    EmailAuthProvider,
    reauthenticateWithCredential,
    updatePassword,
    signInAnonymously as firebaseSignInAnonymously // Adicionado
} from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js';
import { 
    doc, 
    getDoc, 
    setDoc, 
    updateDoc, 
    deleteDoc,
    collection,
    query,
    where,
    getDocs,
    writeBatch,
    serverTimestamp
} from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js';
import { 
    ref, 
    uploadBytes, 
    getDownloadURL, 
    deleteObject 
} from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-storage.js';

/**
 * Lida com o primeiro login de um usuário via provedor social (Google).
 * Cria um perfil no Firestore se não existir.
 * @param {import("firebase/auth").User} user - O objeto do usuário do Firebase Auth.
 */
const handleSocialLogin = async (user) => {
    const userRef = doc(db, 'users', user.uid);
    const docSnap = await getDoc(userRef);

    if (!docSnap.exists()) {
        console.log("Primeiro login com provedor social. Criando perfil no Firestore...");
        const { displayName, email, photoURL, uid } = user;
        try {
            await setDoc(userRef, {
                uid,
                displayName,
                email,
                photoURL,
                createdAt: serverTimestamp()
            });
        } catch (error) {
            console.error("Erro ao criar o perfil do usuário no Firestore:", error);
        }
    } else {
        const firestoreData = docSnap.data();
        if (!firestoreData.photoURL && user.photoURL) {
            console.log("Atualizando perfil do Firestore com a foto do provedor social.");
            try {
                await updateDoc(userRef, {
                    photoURL: user.photoURL
                });
            } catch (error) {
                 console.error("Erro ao atualizar a foto do usuário no Firestore:", error);
            }
        }
    }
};

/**
 * Inicia o processo de login com a conta do Google.
 */
export async function signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    if (result.user) {
        await handleSocialLogin(result.user);
    }
    return result;
}

/**
 * Inicia o processo de login anônimo como visitante.
 */
export function signInAnonymously() {
    return firebaseSignInAnonymously(auth);
}

/**
 * Desloga o usuário atual e redireciona para a página de login.
 */
export function signOut() {
    const user = getCurrentUser();
    if (user && user.displayName) {
        sessionStorage.setItem('welcomeBackName', user.displayName);
    }

    firebaseSignOut(auth)
        .then(() => {
            console.log('Logout bem-sucedido.');
            const path = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/'));
            window.location.href = `${path}/index.html`;
        })
        .catch((error) => {
            console.error('Erro no logout:', error);
        });
}

/**
 * "Vigia" se o usuário está logado ou não.
 * @param {function} callback - A função que será executada quando o estado de login mudar.
 */
export function onAuthStateChanged(callback) {
    return firebaseOnAuthStateChanged(auth, callback);
}

/**
 * Pega o objeto do usuário atualmente logado.
 * @returns {import("firebase/auth").User | null} - O objeto do usuário ou null.
 */
export function getCurrentUser() {
    return auth.currentUser;
}

/**
 * Atualiza o perfil do usuário (Auth e Firestore) e a sua foto (Storage).
 * @param {object} profileData - Objeto com os dados a serem atualizados (displayName, birthDate e/ou photoFile).
 * @returns {Promise<{permanentPhotoURL: string|null}>} - Retorna o URL permanente da nova foto.
 */
export async function updateUserProfile(profileData) {
    const user = getCurrentUser();
    if (!user) throw new Error("Nenhum usuário logado para atualizar.");

    const dataToUpdateFirestore = {};
    const dataToUpdateAuth = {};
    let permanentPhotoURL = null;

    if (profileData.displayName) {
        dataToUpdateFirestore.displayName = profileData.displayName;
        dataToUpdateAuth.displayName = profileData.displayName;
    }
    
    if (profileData.birthDate) {
        dataToUpdateFirestore.birthDate = profileData.birthDate;
    }

    if (profileData.photoFile) {
        const photoRef = ref(storage, `profile_pictures/${user.uid}`);
        const snapshot = await uploadBytes(photoRef, profileData.photoFile);
        const downloadURL = await getDownloadURL(snapshot.ref);
        
        dataToUpdateFirestore.photoURL = downloadURL;
        dataToUpdateAuth.photoURL = downloadURL;
        permanentPhotoURL = downloadURL;
    }
    
    if (Object.keys(dataToUpdateAuth).length > 0) {
        await updateProfile(user, dataToUpdateAuth);
    }
    
    if (Object.keys(dataToUpdateFirestore).length > 0) {
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, dataToUpdateFirestore, { merge: true });
    }

    return { permanentPhotoURL };
}

/**
 * Cria um novo usuário com email e senha.
 */
export async function signUpWithEmail(email, password) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, {
        uid: user.uid,
        displayName: user.displayName, 
        email: user.email,
        photoURL: null, 
        createdAt: serverTimestamp()
    });
    
    return userCredential;
}

/**
 * Autentica um usuário existente com email e senha.
 */
export function signInWithEmail(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
}

/**
 * Envia um email de redefinição de senha.
 */
export function sendPasswordResetEmail(email) {
    return firebaseSendPasswordResetEmail(auth, email);
}

/**
 * NOVO: Altera a senha do usuário.
 * @param {string} currentPassword - A senha atual para reautenticação.
 * @param {string} newPassword - A nova senha.
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function updateUserPassword(currentPassword, newPassword) {
    const user = getCurrentUser();
    if (!user) return { success: false, message: "Nenhum usuário logado." };

    try {
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);
        
        await updatePassword(user, newPassword);

        return { success: true, message: "Senha alterada com sucesso!" };
    } catch (error) {
        console.error("Erro ao alterar a senha:", error);
        let message = "Ocorreu um erro ao alterar a senha.";
        if (error.code === 'auth/wrong-password') {
            message = "A senha atual está incorreta.";
        } else if (error.code === 'auth/weak-password') {
            message = "A nova senha é muito fraca. Use pelo menos 6 caracteres.";
        }
        return { success: false, message };
    }
}


/**
 * Exclui a conta do usuário e todos os seus dados associados.
 * @param {string} currentPassword - A senha atual do usuário (se aplicável).
 * @param {Function} [onProgress=() => {}] - Callback para relatar o progresso da exclusão.
 */
export async function deleteUserAccount(currentPassword, onProgress = () => {}) {
    const user = getCurrentUser();
    if (!user) return { success: false, message: "Nenhum usuário logado." };

    try {
        const isEmailProvider = user.providerData.some(p => p.providerId === 'password');
        
        if (isEmailProvider) {
            onProgress("Autenticando novamente por segurança...");
            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            await reauthenticateWithCredential(user, credential);
        }

        const userId = user.uid;
        
        onProgress("Excluindo sua foto de perfil...");
        try {
            const photoRef = ref(storage, `profile_pictures/${userId}`);
            await deleteObject(photoRef);
        } catch (error) {
            if (error.code !== 'storage/object-not-found') console.warn("Não foi possível excluir a foto de perfil:", error.message);
        }
        
        onProgress("Excluindo suas publicações...");
        const postsQuery = query(collection(db, 'communityPosts'), where('authorId', '==', userId));
        const postsSnapshot = await getDocs(postsQuery);
        for (const postDoc of postsSnapshot.docs) {
            const postData = postDoc.data();
            if (postData.image && postData.image.startsWith('https://firebasestorage.googleapis.com')) {
                try {
                    const imageRef = ref(storage, postData.image);
                    await deleteObject(imageRef);
                } catch (e) {
                    console.warn(`Não foi possível excluir a imagem do post ${postDoc.id}:`, e.message);
                }
            }
            await deleteDoc(postDoc.ref);
        }
        
        onProgress("Excluindo seus favoritos e dados salvos...");
        const batch = writeBatch(db);
        const subcollections = ['pantry', 'favorites', 'savedPosts'];
        for (const sub of subcollections) {
            const subSnapshot = await getDocs(collection(db, 'users', userId, sub));
            subSnapshot.docs.forEach(d => batch.delete(d.ref));
        }
        await batch.commit();
        
        onProgress("Removendo seu registro de usuário...");
        await deleteDoc(doc(db, 'users', userId));
        
        onProgress("Finalizando a exclusão...");
        await deleteUser(user);

        sessionStorage.setItem('toastMessage', JSON.stringify({ message: 'Sua conta foi excluída com sucesso.', type: 'info' }));
        signOut(); 

        return { success: true };

    } catch (error) {
        console.error("Erro ao excluir a conta:", error);
        let message = "Ocorreu um erro. Tente novamente mais tarde.";
        if (error.code === 'auth/wrong-password') message = "A senha informada está incorreta.";
        if (error.code === 'auth/requires-recent-login') message = "Sua sessão expirou. Por favor, faça login novamente para excluir sua conta.";
        return { success: false, message: message };
    }
}