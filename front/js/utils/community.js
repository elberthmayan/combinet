/**
 * community.js (VERSÃO SIMULADA COM SESSIONSTORAGE)
 * Este módulo gerencia os posts da comunidade usando o armazenamento da sessão do navegador.
 * Os dados são perdidos quando a aba é fechada.
 */
import { getCurrentUser } from '../auth.js';

const SESSION_STORAGE_KEY = 'combinetCommunityPosts';

// DADOS FAKES (ATUALIZADOS COM RECEITAS) para popular a comunidade
const fakePostsData = [
    {
        id: 'fake_post_1',
        author: "Ana Clara Souza",
        authorId: 'fake_user_1',
        avatar: "https://ui-avatars.com/api/?name=Ana+Souza&background=e74c3c&color=fff",
        body: "Meu bolo de cenoura com cobertura de chocolate ficou divino! A massa super fofinha, receita de família que nunca falha. Quem vai querer um pedaço? 🥕🍫 #bolodecenoura #receitadevo",
        image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1089&q=80",
        ingredients: ["3 cenouras médias", "4 ovos", "1/2 xícara de óleo", "2 xícaras de açúcar", "2 1/2 xícaras de farinha de trigo", "1 colher de sopa de fermento em pó", "1 lata de leite condensado", "1 colher de sopa de manteiga", "4 colheres de sopa de chocolate em pó"],
        preparation: "Bata no liquidificador as cenouras, os ovos e o óleo.\nDespeje a mistura em uma tigela e misture o açúcar e a farinha.\nAdicione o fermento e misture lentamente.\nAsse em forno pré-aquecido a 180°C por 40 minutos.\nPara a cobertura, misture o leite condensado, a manteiga e o chocolate em fogo baixo até engrossar.",
        ratings: { 'fake_user_2': 5, 'fake_user_3': 4, 'fake_user_4': 5 },
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        comments: [
            { id: 'fake_comment_1', author: "Lucas Martins", avatar: "https://ui-avatars.com/api/?name=Lucas+Martins&background=2980b9&color=fff", text: "Que delícia! Parece perfeito!", createdAt: new Date(Date.now() - 55 * 60 * 1000).toISOString() },
            { id: 'fake_comment_2', author: "Beatriz Almeida", avatar: "https://ui-avatars.com/api/?name=Beatriz+Almeida&background=e84393&color=fff", text: "Passa a receita dessa cobertura! 😍", createdAt: new Date(Date.now() - 50 * 60 * 1000).toISOString() },
        ]
    },
    {
        id: 'fake_post_3',
        author: "Juliana Lima",
        authorId: 'fake_user_3',
        avatar: "https://ui-avatars.com/api/?name=Juliana+Lima&background=27ae60&color=fff",
        body: "Noite de pizza caseira com a família! Essa de calabresa com borda recheada ficou simplesmente perfeita. 🍕❤️",
        image: "https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=735&q=80",
        ingredients: ["1kg de farinha de trigo", "2 copos de água morna", "10g de fermento biológico seco", "1/2 xícara de óleo", "1 colher de sopa de açúcar", "1 colher de chá de sal", "Molho de tomate", "400g de queijo mussarela", "2 linguiças calabresas fatiadas", "Cebola e orégano a gosto"],
        preparation: "Misture o fermento, açúcar e água morna e deixe descansar por 5 minutos.\nAdicione o óleo, sal e farinha aos poucos, sovando até a massa ficar lisa.\nDeixe a massa descansar por 40 minutos.\nAbra a massa, adicione o molho, queijo, calabresa e cebola.\nLeve ao forno a 220°C por cerca de 20-25 minutos.",
        ratings: { 'fake_user_1': 4 },
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        comments: [
             { id: 'fake_comment_3', author: "Ana Clara Souza", avatar: "https://ui-avatars.com/api/?name=Ana+Souza&background=e74c3c&color=fff", text: "Uau, que linda!", createdAt: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString() },
        ]
    },
    {
        id: 'fake_post_4',
        author: "Rafael Santos",
        authorId: 'fake_user_4',
        avatar: "https://ui-avatars.com/api/?name=Rafael+Santos&background=f39c12&color=fff",
        body: "Hambúrguer artesanal para fechar a semana. Pão brioche, blend de carnes e queijo cheddar. Não tem erro!",
        image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=999&q=80",
        ingredients: ["500g de carne moída (patinho e acém)", "100g de bacon moído", "Pão de hambúrguer brioche", "Queijo cheddar fatiado", "Alface, tomate, cebola roxa", "Sal e pimenta a gosto"],
        preparation: "Misture as carnes e o bacon sem amassar demais, apenas para incorporar.\nMolde os hambúrgueres e tempere com sal e pimenta na hora de ir para a chapa.\nSele os pães na manteiga.\nGrelhe os hambúrgueres no ponto desejado, colocando o queijo por cima para derreter no final.\nMonte o lanche e sirva imediatamente.",
        ratings: { 'fake_user_1': 5, 'fake_user_2': 5, 'fake_user_3': 4, 'fake_user_5': 5, 'fake_user_6': 4 },
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        comments: []
    }
];

/**
 * Converte um arquivo de imagem para uma string base64.
 * @param {File} file - O arquivo de imagem.
 * @returns {Promise<string>} - A URL de dados base64 da imagem.
 */
const toBase64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
});

/**
 * "Semeia" o sessionStorage com posts fakes se estiver vazio.
 */
const seedCommunityPostsIfEmpty = () => {
    const existingPosts = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!existingPosts) {
        console.log("Comunidade da sessão vazia. Semeando posts fakes...");
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(fakePostsData));
    }
};

/**
 * Cria um novo post, convertendo a imagem para base64 e salvando no sessionStorage.
 * @param {object} postContent - O conteúdo do post ({ text, imageFile }).
 * @returns {Promise<object>} - Retorna o objeto do post final criado.
 */
export const createCommunityPost = async (postContent) => {
    const user = getCurrentUser();
    if (!user || !postContent.imageFile) {
        throw new Error("Usuário não logado ou imagem não fornecida.");
    }

    const imageUrl = await toBase64(postContent.imageFile);

    const newPost = {
        id: `post_${Date.now()}`,
        authorId: user.uid,
        author: user.displayName || 'Usuário',
        avatar: user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || 'A'}`,
        body: postContent.text,
        image: imageUrl,
        // Adiciona dados de receita vazios para novos posts
        ingredients: postContent.ingredients || [],
        preparation: postContent.preparation || "",
        ratings: {},
        createdAt: new Date().toISOString(),
        comments: []
    };

    const allPosts = await getCommunityPosts();
    allPosts.unshift(newPost);
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(allPosts));
    
    return newPost;
};

/**
 * Busca todas as publicações da comunidade no sessionStorage.
 * @returns {Promise<Array>} - Uma promessa que resolve para um array de posts.
 */
export const getCommunityPosts = async () => {
    seedCommunityPostsIfEmpty();
    const postsJSON = sessionStorage.getItem(SESSION_STORAGE_KEY);
    const posts = postsJSON ? JSON.parse(postsJSON) : [];
    
    posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Calcula a média de avaliação para cada post
    return posts.map(post => {
        const ratings = post.ratings || {};
        const ratingValues = Object.values(ratings);
        const totalRatings = ratingValues.length;
        const averageRating = totalRatings > 0 
            ? (ratingValues.reduce((sum, rating) => sum + rating, 0) / totalRatings).toFixed(1)
            : 0;

        return {
            ...post,
            timestamp: new Date(post.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' }),
            totalRatings,
            averageRating
        };
    });
};

/**
 * Deleta uma publicação do sessionStorage.
 * @param {string} postId - O ID do post a ser deletado.
 * @returns {Promise<boolean>} - Retorna true se o post foi deletado.
 */
export const deleteCommunityPost = async (postId) => {
    let allPosts = await getCommunityPosts();
    allPosts = allPosts.filter(p => p.id !== postId);
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(allPosts));
    return true;
};

/**
 * Atualiza uma publicação no sessionStorage.
 * @param {string} postId - O ID do post a ser atualizado.
 * @param {object} updatedData - Um objeto com os campos a serem atualizados (pode incluir body e imageFile).
 * @returns {Promise<object|null>} - Retorna o post atualizado ou null se não for encontrado.
 */
export const updateCommunityPost = async (postId, updatedData) => {
    const rawPostsJSON = sessionStorage.getItem(SESSION_STORAGE_KEY);
    const allPosts = rawPostsJSON ? JSON.parse(rawPostsJSON) : [];
    const postIndex = allPosts.findIndex(p => p.id === postId);

    if (postIndex > -1) {
        // Se uma nova imagem foi enviada, converte para base64
        if (updatedData.imageFile) {
            updatedData.image = await toBase64(updatedData.imageFile);
            delete updatedData.imageFile; // Remove o arquivo para não salvar no sessionStorage
        }

        // Mescla os dados antigos com os novos
        const updatedPost = { ...allPosts[postIndex], ...updatedData };
        allPosts[postIndex] = updatedPost;
        
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(allPosts));
        return updatedPost; // Retorna o post atualizado
    }
    return null; // Retorna null se não encontrar
};


/**
 * Adiciona ou atualiza a avaliação de um usuário para um post.
 * @param {string} postId - O ID do post.
 * @param {string} userId - O ID do usuário que está avaliando.
 * @param {number} rating - A avaliação (de 1 a 5).
 * @returns {Promise<{post: object}|null>} - Retorna o post atualizado com a nova média.
 */
export const ratePost = async (postId, userId, rating) => {
    const rawPostsJSON = sessionStorage.getItem(SESSION_STORAGE_KEY);
    const rawPosts = rawPostsJSON ? JSON.parse(rawPostsJSON) : [];
    
    const post = rawPosts.find(p => p.id === postId);

    if (!post) return null;

    if (!post.ratings) {
        post.ratings = {};
    }
    post.ratings[userId] = rating;

    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(rawPosts));

    // Recalcula a média para retornar o valor atualizado
    const ratingValues = Object.values(post.ratings);
    const totalRatings = ratingValues.length;
    const averageRating = totalRatings > 0
        ? (ratingValues.reduce((sum, r) => sum + r, 0) / totalRatings).toFixed(1)
        : 0;
    
    const updatedPostData = {
        ...post,
        totalRatings,
        averageRating
    };
    
    return { post: updatedPostData };
};


/**
 * Adiciona um comentário a um post no sessionStorage.
 * @param {string} postId - O ID do post.
 * @param {object} commentData - Dados do comentário (ex: { text: "..." }).
 * @returns {Promise<boolean>}
 */
export const addCommentToPost = async (postId, commentData) => {
    const user = getCurrentUser();
    if (!user) return false;

    const rawPostsJSON = sessionStorage.getItem(SESSION_STORAGE_KEY);
    const allPosts = rawPostsJSON ? JSON.parse(rawPostsJSON) : [];
    const post = allPosts.find(p => p.id === postId);
    if (!post) return false;

    const newComment = {
        id: `comment_${Date.now()}`,
        authorId: user.uid,
        author: user.displayName,
        avatar: user.photoURL,
        text: commentData.text,
        createdAt: new Date().toISOString()
    };
    
    post.comments = post.comments || [];
    post.comments.push(newComment);

    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(allPosts));
    return true;
};

/**
 * Busca os comentários de um post no sessionStorage.
 * @param {string} postId - O ID do post.
 * @returns {Promise<Array>}
 */
export const getCommentsForPost = async (postId) => {
    const rawPostsJSON = sessionStorage.getItem(SESSION_STORAGE_KEY);
    const allPosts = rawPostsJSON ? JSON.parse(rawPostsJSON) : [];
    const post = allPosts.find(p => p.id === postId);
    if (post && post.comments) {
        return post.comments.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    }
    return [];
};