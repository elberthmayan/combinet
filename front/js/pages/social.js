import { isPostSaved, toggleSavedPost } from '../utils/saved-posts.js';
import { showToast } from '../utils/toast.js';
import { getCurrentUser } from '../auth.js';
import {
    createCommunityPost,
    getCommunityPosts,
    ratePost,
    addCommentToPost,
    getCommentsForPost,
    deleteCommunityPost,
    updateCommunityPost
} from '../utils/community.js';
import { createSkeletonPost } from '../ui/components.js';
import { getAllFavorites } from '../utils/favorites.js';

// Armazena os posts carregados para manipulação no cliente
let loadedPosts = [];
let currentSortCriteria = 'latest';

/**
 * Converte uma data para um formato "tempo atrás" amigável.
 * @param {string | Date} date - A data a ser formatada.
 * @returns {string} - O texto formatado (ex: "há 2 horas").
 */
const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return `há ${Math.floor(interval)} anos`;
    interval = seconds / 2592000;
    if (interval > 1) return `há ${Math.floor(interval)} meses`;
    interval = seconds / 86400;
    if (interval > 1) return `há ${Math.floor(interval)} dias`;
    interval = seconds / 3600;
    if (interval > 1) return `há ${Math.floor(interval)} horas`;
    interval = seconds / 60;
    if (interval > 1) return `há ${Math.floor(interval)} minutos`;
    return "agora mesmo";
};

// ===================================================================================
// RENDERIZAÇÃO DA PÁGINA PRINCIPAL
// ===================================================================================

/**
 * Cria o card de um post para o grid da comunidade com o novo design.
 * @param {object} postData - Os dados do post.
 * @returns {HTMLElement} - O elemento do card do post.
 */
const createPostCard = (postData) => {
    const card = document.createElement('div');
    card.className = 'post-card';
    card.dataset.postId = postData.id;

    const starIcon = `<svg viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>`;
    const commentIcon = `<svg viewBox="0 0 24 24"><path d="M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18z"/></svg>`;

    card.innerHTML = `
        <div class="post-card-image-wrapper">
            <img src="${postData.image}" alt="Foto da publicação de ${postData.author}" class="post-card-image" loading="lazy">
            <div class="post-card-author">
                <img src="${postData.avatar}" alt="Avatar de ${postData.author}" data-author-id="${postData.authorId}">
                <div>
                    <span class="author-name">${postData.author}</span>
                    <span class="post-timestamp">${timeAgo(postData.createdAt)}</span>
                </div>
            </div>
        </div>
        <div class="post-card-content">
            <p class="post-card-body">${postData.body}</p>
        </div>
        <div class="post-card-footer">
            <div class="post-card-stats">
                <span class="stat-item" title="Avaliações">
                    ${starIcon}
                    <span>${postData.averageRating > 0 ? postData.averageRating : 'N/A'}</span>
                </span>
                <span class="stat-item" title="Comentários">
                    ${commentIcon}
                    <span>${postData.comments?.length || 0}</span>
                </span>
            </div>
            <button class="btn-view-more">Ver Detalhes</button>
        </div>
    `;

    card.addEventListener('click', () => {
        const post = loadedPosts.find(p => p.id === postData.id);
        if (post) {
            openPostDetailsModal(post, () => {
                // Callback para atualizar a UI se algo mudar (ex: exclusão)
                renderSocialPage(document.getElementById('main-content'));
            });
        }
    });
    return card;
};


/**
 * Ordena e renderiza os posts no feed da comunidade.
 */
const renderPosts = async () => {
    const feed = document.getElementById('social-feed-grid');
    if (!feed) return;

    const sortedPosts = [...loadedPosts].sort((a, b) => {
        if (currentSortCriteria === 'popular') {
            // Ordena por popularidade (média de avaliação, depois número de comentários)
            const scoreA = (a.averageRating || 0) * 10 + (a.comments?.length || 0);
            const scoreB = (b.averageRating || 0) * 10 + (b.comments?.length || 0);
            return scoreB - scoreA;
        }
        return new Date(b.createdAt) - new Date(a.createdAt); // 'latest' (padrão)
    });

    feed.innerHTML = '';
    if (sortedPosts.length > 0) {
        sortedPosts.forEach(post => {
            feed.appendChild(createPostCard(post));
        });
    } else {
        feed.innerHTML = `
            <div class="feed-empty-state">
                <div class="empty-state-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 4 13V7a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2v6a7 7 0 0 1-7 7z"/><path d="M14 10a2 2 0 1 1-4 0 2 2 0 0 1 4 0z"/></svg>
                </div>
                <h3>A cozinha está silenciosa...</h3>
                <p>Parece que ninguém compartilhou nada ainda. Que tal ser o primeiro a postar uma delícia?</p>
            </div>
        `;
    }
};

/**
 * Renderiza a estrutura principal da página da comunidade e inicializa os eventos.
 * @param {HTMLElement} container - O elemento principal onde a página será renderizada.
 */
export const renderSocialPage = async (container) => {
    container.innerHTML = `
        <div class="social-page-container">
            <header class="social-header">
                <div>
                    <h1>Comunidade</h1>
                    <p>Inspire-se com as criações da comunidade e compartilhe seus pratos favoritos.</p>
                </div>
                <button id="open-create-post-modal-btn" class="btn btn-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    <span>Compartilhar Prato</span>
                </button>
            </header>

            <div class="feed-controls">
                <div class="sort-buttons">
                    <button class="sort-btn active" data-sort="latest">
                        <svg viewBox="0 0 24 24"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
                        Recentes
                    </button>
                    <button class="sort-btn" data-sort="popular">
                         <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                        Populares
                    </button>
                </div>
            </div>

            <main class="social-feed-grid" id="social-feed-grid"></main>
        </div>
    `;

    const feedGrid = document.getElementById('social-feed-grid');
    // Mostra skeletons enquanto os dados são carregados
    feedGrid.innerHTML = Array(9).fill(0).map(() => createSkeletonPost().outerHTML).join('');

    // Carrega os dados reais e renderiza
    loadedPosts = await getCommunityPosts();
    renderPosts();

    // Adiciona evento ao botão de criar post
    document.getElementById('open-create-post-modal-btn').addEventListener('click', async () => {
        const favoriteRecipes = await getAllFavorites();
        openCreatePostModal(favoriteRecipes, async (postData) => {
            try {
                // Adiciona o ID da receita ao post para referência
                if(postData.recipe) {
                    postData.recipeId = postData.recipe.id;
                }
                
                // Cria o post no backend/sessionStorage
                const newPost = await createCommunityPost(postData);

                // Adiciona campos calculados para renderização imediata
                const newPostWithCalculatedFields = {
                    ...newPost,
                    totalRatings: 0,
                    averageRating: 0,
                    comments: []
                };

                showToast('Sua obra-prima foi publicada!', { type: 'success' });
                // Adiciona o novo post no início da lista local e re-renderiza
                loadedPosts.unshift(newPostWithCalculatedFields);
                renderPosts();
            } catch (error) {
                console.error("Erro ao criar post:", error);
                showToast('Erro ao publicar. Tente novamente.', { type: 'error' });
            }
        });
    });

    // Adiciona eventos aos botões de ordenação
    document.querySelectorAll('.sort-btn').forEach(button => {
        button.addEventListener('click', () => {
            document.querySelector('.sort-btn.active').classList.remove('active');
            button.classList.add('active');
            currentSortCriteria = button.dataset.sort;
            renderPosts();
        });
    });

    // --- OUVINTE DE ATUALIZAÇÃO DE PERFIL ---
    const profileUpdateHandler = (e) => {
        const { photoURL, displayName } = e.detail;
        const currentUser = getCurrentUser();
        if (!currentUser) return;

        // Atualiza os dados locais para consistência
        loadedPosts.forEach(post => {
            if (post.authorId === currentUser.uid) {
                if(photoURL) post.avatar = photoURL;
                if(displayName) post.author = displayName;
            }
            if(post.comments){
                post.comments.forEach(comment => {
                    if(comment.authorId === currentUser.uid){
                        if(photoURL) comment.avatar = photoURL;
                        if(displayName) comment.author = displayName;
                    }
                })
            }
        });
        
        // Re-renderiza a tela com os dados atualizados
        renderPosts();

        // Atualiza avatares em modais abertos
        document.querySelectorAll(`.author-info img[data-author-id="${currentUser.uid}"]`).forEach(img => {
            if(photoURL) img.src = photoURL;
        });
        document.querySelectorAll(`.comment-avatar[data-author-id="${currentUser.uid}"]`).forEach(img => {
            if(photoURL) img.src = photoURL;
        });
        const newCommentAvatar = document.getElementById('new-comment-avatar');
        if(newCommentAvatar && photoURL) {
            newCommentAvatar.src = photoURL;
        }
    };

    // Garante que o listener seja adicionado apenas uma vez
    document.removeEventListener('profileUpdated', profileUpdateHandler);
    document.addEventListener('profileUpdated', profileUpdateHandler);
};

// ===================================================================================
// MODAL DE DETALHES DO POST (REMAKE)
// ===================================================================================

export const openPostDetailsModal = async (postData, onUpdateCallback = () => {}) => {
    const existingModal = document.querySelector('.details-modal');
    if (existingModal) existingModal.remove();

    const currentUser = getCurrentUser();
    const isOwner = currentUser && currentUser.uid === postData.authorId;
    const isBookmarked = await isPostSaved(postData.id);
    const userRating = (postData.ratings && currentUser) ? postData.ratings[currentUser.uid] || 0 : 0;

    const hasRecipe = postData.ingredients && postData.ingredients.length > 0 && postData.preparation;

    const modal = document.createElement('div');
    modal.className = 'details-modal';
    modal.innerHTML = `
        <div class="modal-backdrop"></div>
        <div class="modal-content">
            <div class="modal-header-image" style="background-image: url('${postData.image}')">
                <button class="action-btn close-btn" title="Fechar">&times;</button>
            </div>
            
            <div class="modal-body-grid">
                <div class="main-content-panel">
                    <header class="post-header-info">
                        <h1>${(postData.recipe && postData.recipe.title) || `Prato de ${postData.author}`}</h1>
                        <div class="author-info">
                            <img src="${postData.avatar}" alt="Avatar de ${postData.author}" data-author-id="${postData.authorId}">
                            <div>
                                <span class="author-name">${postData.author}</span>
                                <span class="timestamp">${new Date(postData.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                            </div>
                        </div>
                        <p class="post-body">${postData.body}</p>
                    </header>
                    
                    ${hasRecipe ? `
                    <section class="info-section recipe-section">
                        <h4>Ingredientes</h4>
                        <ul class="recipe-list ingredients-list">
                            ${postData.ingredients.map(ing => `<li><span class="bullet"></span>${ing}</li>`).join('')}
                        </ul>
                        <h4>Modo de Preparo</h4>
                        <ol class="recipe-list steps-list">
                            ${postData.preparation.split('\n').filter(s => s.trim()).map(step => `<li>${step}</li>`).join('')}
                        </ol>
                    </section>
                    ` : ''}
                </div>

                <aside class="sidebar-panel">
                    <section class="info-section actions-section">
                        <h4>Ações</h4>
                        <button class="sidebar-action-btn bookmark-btn ${isBookmarked ? 'active' : ''}">
                            <svg viewBox="0 0 24 24"><path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z"></path></svg>
                            <span>${isBookmarked ? 'Salvo' : 'Salvar Post'}</span>
                        </button>
                        ${isOwner ? `
                        <button class="sidebar-action-btn edit-btn">
                            <svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"></path></svg>
                            <span>Editar Post</span>
                        </button>
                        <button class="sidebar-action-btn delete-btn">
                            <svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"></path></svg>
                            <span>Excluir Post</span>
                        </button>` : ''}
                    </section>
                    
                    <section class="info-section rating-section">
                        <h4>Avalie esta receita (${postData.totalRatings || 0})</h4>
                        <div class="star-rating-input">
                           ${[5, 4, 3, 2, 1].map(v => `<span class="star" data-value="${v}"><svg viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg></span>`).join('')}
                        </div>
                        <p id="rating-feedback">Sua opinião é importante!</p>
                    </section>
                    
                    <section class="info-section comments-section">
                        <h4>Comentários</h4>
                        <div class="comments-list"></div>
                        <form class="comment-form">
                            <img id="new-comment-avatar" src="${currentUser?.photoURL || 'https://ui-avatars.com/api/?name=?'}" class="comment-input-avatar">
                            <div class="comment-input-wrapper">
                                <input type="text" placeholder="Adicione um comentário..." required>
                                <button type="submit" title="Enviar">
                                    <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path></svg>
                                </button>
                            </div>
                        </form>
                    </section>
                </aside>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    document.body.classList.add('modal-open');
    setTimeout(() => modal.classList.add('is-open'), 10);

    const closeModal = () => {
        modal.classList.remove('is-open');
        modal.addEventListener('transitionend', () => {
            modal.remove();
            document.body.classList.remove('modal-open');
        }, { once: true });
    };

    modal.querySelector('.modal-backdrop').addEventListener('click', closeModal);
    modal.querySelector('.close-btn').addEventListener('click', closeModal);

    const bookmarkBtn = modal.querySelector('.bookmark-btn');
    bookmarkBtn.addEventListener('click', async () => {
        const isNowBookmarked = await toggleSavedPost(postData);
        bookmarkBtn.classList.toggle('active', isNowBookmarked);
        bookmarkBtn.querySelector('span').textContent = isNowBookmarked ? 'Salvo' : 'Salvar Post';
        showToast(isNowBookmarked ? 'Publicação salva!' : 'Publicação removida.', { type: 'info' });
    });
    
    if (isOwner) {
        modal.querySelector('.delete-btn').addEventListener('click', () => {
             renderConfirmationModal({
                title: 'Excluir Publicação',
                message: 'Tem certeza que deseja excluir esta publicação? Esta ação não pode ser desfeita.',
                confirmText: 'Sim, Excluir',
                onConfirm: async () => {
                    await deleteCommunityPost(postData.id);
                    showToast('Publicação excluída.', {type: 'success'});
                    closeModal();
                    onUpdateCallback(true); // Informa que houve atualização
                }
            });
        });
        
        modal.querySelector('.edit-btn').addEventListener('click', () => {
            // Abre o modal de edição
            openEditPostModal(postData, (updatedPost) => {
                showToast('Publicação atualizada com sucesso!', { type: 'success' });

                // Atualiza o post na lista local para refletir a mudança imediatamente
                const postIndex = loadedPosts.findIndex(p => p.id === updatedPost.id);
                if (postIndex > -1) {
                    loadedPosts[postIndex] = { ...loadedPosts[postIndex], ...updatedPost};
                }
                
                // Fecha o modal de detalhes e re-renderiza a página principal
                closeModal();
                renderPosts(); 
            });
        });
    }

    // --- Lógica de Comentários ---
    const commentsList = modal.querySelector('.comments-list');
    const commentForm = modal.querySelector('.comment-form');
    const commentInput = commentForm.querySelector('input');

    const renderCommentsList = async () => {
        commentsList.innerHTML = `<div class="spinner-loader"></div>`;
        const comments = await getCommentsForPost(postData.id);
        commentsList.innerHTML = '';
        if (comments.length > 0) {
            comments.forEach(c => {
                const commentEl = document.createElement('div');
                commentEl.className = 'comment';
                commentEl.innerHTML = `
                    <img src="${c.avatar || `https://ui-avatars.com/api/?name=${c.author || 'A'}`}" class="comment-avatar" data-author-id="${c.authorId}">
                    <div class="comment-body">
                        <div>
                            <span class="comment-author">${c.author}</span>
                            <span class="comment-time">${timeAgo(c.createdAt)}</span>
                        </div>
                        <p class="comment-text">${c.text}</p>
                    </div>
                `;
                commentsList.appendChild(commentEl);
            });
        } else {
            commentsList.innerHTML = `<p class="no-comments">Nenhum comentário ainda. Que tal ser o primeiro?</p>`;
        }
    };
    
    commentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = commentInput.value.trim();
        if (!text || !currentUser) {
            showToast('Você precisa estar logado para comentar.', { type: 'error' });
            return;
        }
        
        const success = await addCommentToPost(postData.id, { text });
        if (success) {
            commentInput.value = '';
            renderCommentsList();
        } else {
            showToast('Erro ao enviar comentário.', { type: 'error' });
        }
    });

    renderCommentsList();

    // --- Lógica de Avaliação (Stars) ---
    const stars = modal.querySelectorAll('.star-rating-input .star');
    const ratingFeedback = modal.querySelector('#rating-feedback');
    const feedbackMessages = ["Terrível", "Ruim", "Ok", "Bom", "Excelente!"];
    
    const updateStarsUI = (rating) => {
        stars.forEach(star => {
            star.classList.toggle('selected', star.dataset.value <= rating);
        });
        ratingFeedback.textContent = rating > 0 ? feedbackMessages[rating - 1] : "Deixe sua avaliação!";
    };
    
    stars.forEach(star => {
        star.addEventListener('click', async () => {
            if (!currentUser) {
                showToast('Você precisa estar logado para avaliar.', { type: 'error' });
                return;
            }
            const ratingValue = parseInt(star.dataset.value, 10);
            const result = await ratePost(postData.id, currentUser.uid, ratingValue);

            if (result && result.post) {
                const postIndex = loadedPosts.findIndex(p => p.id === postData.id);
                if (postIndex > -1) loadedPosts[postIndex] = result.post;
                
                updateStarsUI(ratingValue);
                showToast(`Você avaliou com ${ratingValue} estrelas!`, { type: 'success' });
                const ratingHeader = modal.querySelector('.rating-section h4');
                if (ratingHeader) {
                    ratingHeader.textContent = `Avalie esta receita (${result.post.totalRatings || 0})`;
                }
            } else {
                showToast('Não foi possível registrar sua avaliação.', { type: 'error' });
            }
        });
    });
    
    updateStarsUI(userRating);
};

/**
 * Renderiza um modal de confirmação genérico e moderno.
 * @param {object} config - Configurações: { title, message, confirmText, onConfirm }
 */
const renderConfirmationModal = (config) => {
    const existingModal = document.querySelector('.confirmation-modal-social');
    if (existingModal) existingModal.remove();

    const modal = document.createElement('div');
    modal.className = 'confirmation-modal-social';
    modal.innerHTML = `
        <div class="modal-backdrop"></div>
        <div class="modal-content">
            <div class="modal-icon">${config.icon || '<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"></path></svg>'}</div>
            <h2>${config.title}</h2>
            <p>${config.message}</p>
            <div class="confirmation-actions">
                <button class="btn btn-secondary" id="cancel-btn">Cancelar</button>
                <button class="btn btn-danger" id="confirm-btn">${config.confirmText}</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    document.body.classList.add('modal-open-child');
    setTimeout(() => modal.classList.add('is-open'), 10);

    const closeModal = () => {
        modal.classList.remove('is-open');
        modal.addEventListener('transitionend', () => {
            modal.remove();
            document.body.classList.remove('modal-open-child');
        }, { once: true });
    };

    modal.querySelector('.modal-backdrop').addEventListener('click', closeModal);
    modal.querySelector('#cancel-btn').addEventListener('click', closeModal);
    modal.querySelector('#confirm-btn').addEventListener('click', () => {
        config.onConfirm();
        closeModal();
    });
};


// ===================================================================================
// MODAL DE EDIÇÃO DE POST (REMAKE)
// ===================================================================================
const openEditPostModal = (postData, onPostUpdated) => {
    const existingModal = document.querySelector('.edit-post-modal');
    if (existingModal) existingModal.remove();

    let cropper = null;
    let newImageFile = null;

    const modal = document.createElement('div');
    modal.className = 'edit-post-modal';
    modal.innerHTML = `
        <div class="modal-backdrop"></div>
        <div class="edit-post-content">
            <header class="edit-post-header">
                <h2>Editar Publicação</h2>
                <button class="close-btn" title="Fechar">&times;</button>
            </header>
            <form id="edit-post-form">
                <div class="edit-post-body">
                    <div class="form-group">
                        <label for="edit-post-image-upload">Foto do Prato</label>
                        <div class="image-editor">
                            <div class="cropper-wrapper">
                                <img id="edit-image-preview" src="${postData.image}">
                            </div>
                            <label for="edit-post-image-upload" class="btn btn-secondary btn-block">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
                                <span>Alterar Imagem</span>
                            </label>
                            <input type="file" id="edit-post-image-upload" accept="image/*" class="visually-hidden">
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="edit-post-text">Descrição</label>
                        <textarea id="edit-post-text" rows="5" minlength="10" required>${postData.body}</textarea>
                    </div>
                </div>
                <footer class="edit-post-footer">
                    <button type="button" class="btn btn-secondary" id="edit-cancel-btn">Cancelar</button>
                    <button type="submit" class="btn btn-primary" id="edit-submit-btn">Salvar Alterações</button>
                </footer>
            </form>
        </div>
    `;

    document.body.appendChild(modal);
    document.body.classList.add('modal-open-child');
    setTimeout(() => modal.classList.add('is-open'), 10);

    const closeModal = () => {
        if (cropper) cropper.destroy();
        modal.classList.remove('is-open');
        modal.addEventListener('transitionend', () => {
            modal.remove();
            document.body.classList.remove('modal-open-child');
        }, { once: true });
    };

    const imagePreview = modal.querySelector('#edit-image-preview');
    cropper = new Cropper(imagePreview, { aspectRatio: 4 / 3, viewMode: 1, background: false, autoCropArea: 1, responsive: true });

    const fileInput = modal.querySelector('#edit-post-image-upload');
    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                newImageFile = file; // Guarda o arquivo original
                cropper.replace(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    });
    
    modal.querySelector('#edit-post-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = modal.querySelector('#edit-submit-btn');
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<div class="btn-spinner"></div> <span>Salvando...</span>`;

        const updatedData = {
            body: modal.querySelector('#edit-post-text').value
        };

        const saveChanges = async (data) => {
            const updatedPost = await updateCommunityPost(postData.id, data);
            if(updatedPost){
                onPostUpdated(updatedPost);
                closeModal();
            } else {
                showToast('Erro ao salvar as alterações.', { type: 'error' });
                submitBtn.disabled = false;
                submitBtn.textContent = 'Salvar Alterações';
            }
        };

        if (newImageFile) {
            cropper.getCroppedCanvas({ width: 1200, height: 900 }).toBlob(async (blob) => {
                updatedData.imageFile = new File([blob], "post_image.jpg", { type: "image/jpeg" });
                await saveChanges(updatedData);
            }, 'image/jpeg', 0.9);
        } else {
            await saveChanges(updatedData);
        }
    });

    modal.querySelector('.modal-backdrop').addEventListener('click', closeModal);
    modal.querySelector('.close-btn').addEventListener('click', closeModal);
    modal.querySelector('#edit-cancel-btn').addEventListener('click', closeModal);
};


// ===================================================================================
// MODAL DE CRIAÇÃO (WIZARD REFINADO)
// ===================================================================================

const openCreatePostModal = (favoriteRecipes, onPostCreated) => {
    const existingModal = document.querySelector('.create-post-modal');
    if (existingModal) existingModal.remove();

    let cropper = null;
    let currentStep = 1;
    let postData = { text: '', imageFile: null, recipe: null };
    
    const modal = document.createElement('div');
    modal.className = 'details-modal create-post-modal wizard-modal';
    modal.innerHTML = `
        <div class="modal-backdrop"></div>
        <div class="wizard-container">
            <div class="wizard-header">
                <h2>Compartilhar sua Criação</h2>
                <div class="wizard-steps">
                    <div class="step-item active" data-step="1">
                        <div class="step-icon"><svg viewBox="0 0 24 24"><path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"></path></svg></div>
                        <span class="step-label">Receita</span>
                    </div>
                    <div class="step-connector"></div>
                    <div class="step-item" data-step="2">
                        <div class="step-icon"><svg viewBox="0 0 24 24"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"></path></svg></div>
                        <span class="step-label">Foto</span>
                    </div>
                    <div class="step-connector"></div>
                    <div class="step-item" data-step="3">
                        <div class="step-icon"><svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"></path></svg></div>
                        <span class="step-label">Publicar</span>
                    </div>
                </div>
                <button class="action-btn close-btn" title="Fechar">&times;</button>
            </div>
            <div class="wizard-content">
                <!-- Passo 1 -->
                <div class="wizard-step active" data-step="1">
                    <div class="step-content-inner">
                        <h3>Qual receita você preparou? (Opcional)</h3>
                        <p>Selecione uma receita para anexar, ou pule para postar apenas uma foto.</p>
                        <div id="selected-recipe-display" class="wizard-recipe-display">
                            <span>Nenhuma receita selecionada</span>
                        </div>
                        <div class="step1-buttons">
                            <button type="button" id="select-recipe-btn" class="btn btn-secondary">
                               <span>Selecionar dos Favoritos</span>
                            </button>
                             <button type="button" id="skip-recipe-btn" class="btn-skip">Pular esta etapa →</button>
                        </div>
                    </div>
                </div>

                <!-- Passo 2 -->
                <div class="wizard-step" data-step="2">
                     <div class="step-content-inner">
                        <h3>Mostre sua obra-prima!</h3>
                        <p>Envie uma foto caprichada do seu prato para inspirar a todos.</p>
                        <div class="image-upload-wrapper">
                            <div id="image-cropper-container" style="display:none;"><img id="image-preview-cropper"></div>
                            <label for="post-image-upload" id="upload-placeholder">
                                <svg viewBox="0 0 24 24"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"></path></svg>
                                <span>Clique ou arraste a imagem aqui</span>
                            </label>
                            <input type="file" id="post-image-upload" accept="image/*">
                        </div>
                    </div>
                </div>

                <!-- Passo 3 -->
                <div class="wizard-step" data-step="3">
                     <div class="step-content-inner">
                        <h3>Os toques finais...</h3>
                        <p>Descreva seu prato, dê dicas ou conte uma pequena história sobre ele.</p>
                        <textarea id="post-text" placeholder="Ex: Fiz esse bolo para o aniversário da minha avó e foi um sucesso! Usei raspas de laranja na massa para um toque especial..." rows="5" minlength="10"></textarea>
                    </div>
                </div>
            </div>
            <div class="wizard-footer">
                <button type="button" class="btn btn-secondary" id="wizard-prev-btn" style="display: none;">Voltar</button>
                <button type="button" class="btn btn-primary" id="wizard-next-btn" disabled>Avançar</button>
                <button type="button" class="btn btn-primary" id="wizard-submit-btn" style="display: none;" disabled>Publicar</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    document.body.classList.add('modal-open');
    setTimeout(() => modal.classList.add('is-open'), 10);

    const wizardContainer = modal.querySelector('.wizard-container');
    const steps = modal.querySelectorAll('.wizard-step');
    const stepItems = modal.querySelectorAll('.step-item');
    const prevBtn = modal.querySelector('#wizard-prev-btn');
    const nextBtn = modal.querySelector('#wizard-next-btn');
    const submitBtn = modal.querySelector('#wizard-submit-btn');

    const updateWizardState = () => {
        steps.forEach(s => s.classList.toggle('active', parseInt(s.dataset.step) === currentStep));
        stepItems.forEach(si => {
            const stepNum = parseInt(si.dataset.step);
            si.classList.toggle('active', stepNum === currentStep);
            si.classList.toggle('completed', stepNum < currentStep);
        });
        
        prevBtn.style.display = currentStep > 1 ? 'inline-flex' : 'none';
        nextBtn.style.display = currentStep < 3 ? 'inline-flex' : 'none';
        submitBtn.style.display = currentStep === 3 ? 'inline-flex' : 'none';

        // Passo 1: Avançar está sempre liberado (pode pular)
        if (currentStep === 1) nextBtn.disabled = false;
        // Passo 2: Precisa de uma imagem para avançar
        else if (currentStep === 2) nextBtn.disabled = !cropper;
        // Passo 3: Precisa de texto para publicar
        else if (currentStep === 3) submitBtn.disabled = postData.text.trim().length < 10;
    };
    
    nextBtn.addEventListener('click', () => { if (currentStep < 3) currentStep++; updateWizardState(); });
    prevBtn.addEventListener('click', () => { if (currentStep > 1) currentStep--; updateWizardState(); });

    const recipeDisplay = modal.querySelector('#selected-recipe-display');
    modal.querySelector('#select-recipe-btn').addEventListener('click', () => {
        if (favoriteRecipes.length === 0) {
            showToast('Você não tem receitas favoritas para selecionar.', { type: 'info' });
            return;
        }
        openSelectFavoriteModal(favoriteRecipes, (recipe) => {
            postData.recipe = recipe;
            postData.ingredients = recipe.ingredients;
            postData.preparation = recipe.preparation;
            recipeDisplay.innerHTML = `<div class="selected-recipe-card"><h4>${recipe.title}</h4><span>Receita selecionada!</span></div>`;
            updateWizardState();
        });
    });

    // --- NOVO: Lógica do botão de pular ---
    modal.querySelector('#skip-recipe-btn').addEventListener('click', () => {
        postData.recipe = null;
        postData.ingredients = [];
        postData.preparation = "";
        recipeDisplay.innerHTML = `<span>Nenhuma receita selecionada</span>`;
        currentStep++;
        updateWizardState();
    });

    const fileInput = modal.querySelector('#post-image-upload');
    const cropperContainer = modal.querySelector('#image-cropper-container');
    const placeholder = modal.querySelector('#upload-placeholder');
    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const imagePreview = modal.querySelector('#image-preview-cropper');
                imagePreview.src = e.target.result;
                placeholder.style.display = 'none';
                cropperContainer.style.display = 'block';
                if (cropper) cropper.destroy();
                cropper = new Cropper(imagePreview, { aspectRatio: 4 / 3, viewMode: 1, background: false, autoCropArea: 1, responsive: true });
                postData.imageFile = file;
                updateWizardState();
            };
            reader.readAsDataURL(file);
        }
    });

    const textArea = modal.querySelector('#post-text');
    textArea.addEventListener('input', () => {
        postData.text = textArea.value;
        updateWizardState();
    });

    submitBtn.addEventListener('click', () => {
        if (postData.text.trim().length < 10) {
            showToast('Sua mensagem precisa ter pelo menos 10 caracteres.', { type: 'error' });
            return;
        }

        submitBtn.disabled = true;
        submitBtn.innerHTML = `<div class="btn-spinner"></div> Publicando...`;

        cropper.getCroppedCanvas({ width: 1200, height: 900 }).toBlob((blob) => {
            postData.imageFile = new File([blob], "post_image.jpg", { type: "image/jpeg" });
            
            // Se nenhuma receita foi selecionada, garante que os campos estejam vazios
            if (!postData.recipe) {
                postData.ingredients = [];
                postData.preparation = "";
            }

            onPostCreated(postData);
            closeModal();
        }, 'image/jpeg', 0.9);
    });

    const closeModal = () => {
        if(cropper) cropper.destroy();
        modal.classList.remove('is-open');
        modal.addEventListener('transitionend', () => { 
            modal.remove(); 
            document.body.classList.remove('modal-open');
        }, { once: true });
    };
    modal.querySelector('.modal-backdrop').addEventListener('click', closeModal);
    modal.querySelector('.close-btn').addEventListener('click', closeModal);
    
    updateWizardState();
};

const openSelectFavoriteModal = (favoriteRecipes, onRecipeSelect) => {
    const existingModal = document.querySelector('.select-recipe-modal');
    if (existingModal) existingModal.remove();

    const modal = document.createElement('div');
    modal.className = 'details-modal select-recipe-modal';

    const renderList = (recipesToRender) => {
        if (recipesToRender.length === 0) {
            return `<p class="feed-empty-message" style="padding: 20px; text-align: center;">Nenhuma receita encontrada.</p>`;
        }
        return recipesToRender.map(recipe => `
            <div class="favorite-recipe-item" data-recipe-id='${JSON.stringify(recipe)}'>
                <div class="recipe-item-info">
                    <h4>${recipe.title}</h4>
                    <p>${recipe.description}</p>
                </div>
                <div class="recipe-item-check">
                    <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"></path></svg>
                </div>
            </div>
        `).join('');
    };

    modal.innerHTML = `
        <div class="modal-backdrop"></div>
        <div class="modal-content">
            <div class="select-recipe-header">
                <h2>Selecione uma Receita</h2>
                <button class="action-btn close-btn" title="Fechar">&times;</button>
            </div>
            <div class="select-recipe-search">
                 <svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"></path></svg>
                <input type="text" id="search-favorites-modal" placeholder="Buscar em seus favoritos...">
            </div>
            <div class="favorites-list-container">
                ${renderList(favoriteRecipes)}
            </div>
            <div class="select-recipe-footer">
                <button id="confirm-recipe-selection" class="btn btn-primary" disabled>Confirmar</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    document.body.classList.add('modal-open-child');
    setTimeout(() => modal.classList.add('is-open'), 10);

    const closeModal = () => {
        modal.classList.remove('is-open');
        modal.addEventListener('transitionend', () => { 
            modal.remove();
            document.body.classList.remove('modal-open-child');
        }, { once: true });
    };

    let selectedRecipe = null;
    const confirmBtn = modal.querySelector('#confirm-recipe-selection');
    const searchInput = modal.querySelector('#search-favorites-modal');
    const listContainer = modal.querySelector('.favorites-list-container');

    modal.querySelector('.modal-backdrop').addEventListener('click', closeModal);
    modal.querySelector('.close-btn').addEventListener('click', closeModal);

    const attachItemListeners = (container) => {
        container.querySelectorAll('.favorite-recipe-item').forEach(item => {
            item.addEventListener('click', () => {
                container.querySelectorAll('.favorite-recipe-item').forEach(i => i.classList.remove('selected'));
                item.classList.add('selected');
                selectedRecipe = JSON.parse(item.dataset.recipeId);
                confirmBtn.disabled = false;
            });
        });
    };
    
    attachItemListeners(listContainer);

    searchInput.addEventListener('input', () => {
        const searchTerm = searchInput.value.toLowerCase();
        const filtered = favoriteRecipes.filter(r => r.title.toLowerCase().includes(searchTerm));
        listContainer.innerHTML = renderList(filtered);
        attachItemListeners(listContainer);
        selectedRecipe = null;
        confirmBtn.disabled = true;
    });

    confirmBtn.addEventListener('click', () => {
        if (selectedRecipe) {
            onRecipeSelect(selectedRecipe);
            closeModal();
        }
    });
};