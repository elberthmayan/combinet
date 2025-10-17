import { getSavedPosts } from '../utils/saved-posts.js';
import { openPostDetailsModal } from './social.js';
import { getCurrentUser, updateUserProfile, deleteUserAccount, updateUserPassword } from '../auth.js';
import { getCommunityPosts } from '../utils/community.js';
import { showToast } from '../utils/toast.js';
import { db } from '../firebase-config.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js';

// ===================================================================================
// LÓGICA DE CONQUISTAS (ACHIEVEMENTS)
// ===================================================================================

const allAchievements = [
    { id: 'first_login', title: 'Pé na Cozinha', description: 'Fez seu primeiro login no Combinet.', icon: '👋', requires: () => true },
    { id: 'profile_complete', title: 'Tudo em Ordem', description: 'Preencheu nome e data de nascimento.', icon: '✅', requires: (posts, saved, user) => user.displayName && user.birthDate },
    { id: 'posts_1', title: 'Chef Iniciante', description: 'Publicou sua primeira receita.', icon: '🍳', requires: (posts) => posts.length >= 1 },
    { id: 'saved_1', title: 'Curioso', description: 'Salvou seu primeiro post.', icon: '👀', requires: (posts, saved) => saved.length >= 1 },
    { id: 'posts_5', title: 'Cozinheiro Júnior', description: 'Publicou 5 receitas.', icon: '👨‍🍳', requires: (posts) => posts.length >= 5 },
    { id: 'saved_10', title: 'Explorador Culinário', description: 'Salvou 10 posts da comunidade.', icon: '🗺️', requires: (posts, saved) => saved.length >= 10 },
    { id: 'posts_10', title: 'Chef de Partida', description: 'Publicou 10 receitas.', icon: '🔪', requires: (posts) => posts.length >= 10 },
    { id: 'posts_25', title: 'Sous Chef', description: 'Publicou 25 receitas. Você está no caminho!', icon: '🔥', requires: (posts) => posts.length >= 25 },
    { id: 'posts_50', title: 'Chef Executivo', description: 'Publicou 50 receitas. Uma verdadeira inspiração!', icon: '⭐', requires: (posts) => posts.length >= 50 },
    { id: 'posts_100', title: 'MasterChef Combinet', description: 'Publicou 100 receitas. Lenda da comunidade!', icon: '🏆', requires: (posts) => posts.length >= 100 },
];

const checkUserAchievements = (myPosts, savedPosts, userData) => {
    return allAchievements.filter(ach => ach.requires(myPosts, savedPosts, userData));
};


// ===================================================================================
// LÓGICA DA PÁGINA DE PERFIL (REMAKE)
// ===================================================================================

let myPostsCache = [];
let savedPostsCache = [];
let achievementsCache = [];
let fullUserCache = null;
let cropperInstance = null;


/**
 * Renderiza a nova página de perfil com layout de dashboard.
 * @param {HTMLElement} container - O elemento onde a página será renderizada.
 */
export const renderProfilePage = async (container) => {
    const authUser = getCurrentUser();
    if (!authUser) {
        container.innerHTML = `<p class="empty-message">Erro: Usuário não encontrado. Faça login novamente.</p>`;
        return;
    }

    container.innerHTML = `<div class="loading-spinner-container"></div>`;

    // Busca todos os dados necessários em paralelo
    const [userDoc, allPosts, savedPostsResult] = await Promise.all([
        getDoc(doc(db, 'users', authUser.uid)),
        getCommunityPosts(),
        getSavedPosts()
    ]);
    
    // Processa e armazena os dados em cache
    fullUserCache = { ...authUser, ...(userDoc.exists() ? userDoc.data() : {}) };
    myPostsCache = allPosts.filter(post => post.authorId === authUser.uid);
    savedPostsCache = savedPostsResult;
    achievementsCache = checkUserAchievements(myPostsCache, savedPostsCache, fullUserCache);
    
    const latestAchievement = achievementsCache.slice(-1)[0]?.title || 'Amante da Culinária';

    // Renderiza a estrutura principal da página
    container.innerHTML = `
        <div class="profile-page-container">
            <aside class="profile-sidebar">
                <div class="sidebar-header">
                     <img src="${fullUserCache.photoURL || `https://ui-avatars.com/api/?name=${fullUserCache.displayName || 'A'}&background=e67e22&color=fff`}" alt="Avatar" class="sidebar-avatar" id="sidebar-avatar-img">
                     <h3 id="sidebar-username">${fullUserCache.displayName || 'Chef Anônimo'}</h3>
                     <p class="sidebar-title">${latestAchievement}</p>
                </div>
                <nav class="sidebar-nav">
                    <a href="#" class="nav-item active" data-section="details"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg><span>Meu Perfil</span></a>
                    <a href="#" class="nav-item" data-section="my-posts"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg><span>Minhas Publicações</span></a>
                    <a href="#" class="nav-item" data-section="saved"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z"/></svg><span>Posts Salvos</span></a>
                    <a href="#" class="nav-item" data-section="achievements"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-6 6c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm6 12H6v-1.4c0-2 4-3.1 6-3.1s6 1.1 6 3.1V20z"/></svg><span>Conquistas</span></a>
                    <a href="#" class="nav-item" data-section="security"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/></svg><span>Segurança</span></a>
                </nav>
            </aside>
            <main class="profile-content-area" id="profile-content-area"></main>
        </div>
    `;

    // Carrega a primeira seção e anexa todos os eventos
    switchSection('details');
    attachNavigationEvents();
};


/**
 * Renderiza dinamicamente o conteúdo da seção solicitada.
 * @param {string} sectionId - O ID da seção a ser renderizada.
 */
const switchSection = (sectionId) => {
    const contentArea = document.getElementById('profile-content-area');
    if (!contentArea) return;

    // Remove a classe 'active' de todos os links e a adiciona ao link clicado
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    const activeLink = document.querySelector(`.nav-item[data-section="${sectionId}"]`) || document.querySelector(`.nav-item[data-section="achievements"]`);
    if(activeLink) activeLink.classList.add('active');

    let contentHtml = '';
    switch(sectionId) {
        case 'details': contentHtml = getDetailsSectionHtml(); break;
        case 'my-posts': contentHtml = getPostsSectionHtml('Minhas Publicações', myPostsCache, "Você ainda não compartilhou nenhuma criação."); break;
        case 'saved': contentHtml = getPostsSectionHtml('Publicações Salvas', savedPostsCache, "Você ainda não salvou nenhuma publicação."); break;
        case 'achievements': contentHtml = getAchievementsSectionHtml(true); break;
        case 'all-achievements': contentHtml = getAchievementsSectionHtml(false); break;
        case 'security': contentHtml = getSecuritySectionHtml(); break;
        default: contentHtml = `<h2>Seção não encontrada</h2>`;
    }

    contentArea.innerHTML = contentHtml;
    attachSectionEventListeners(sectionId);
};

/**
 * Anexa os eventos de navegação da sidebar.
 */
const attachNavigationEvents = () => {
    const sidebar = document.querySelector('.profile-sidebar');
    if (!sidebar) return;

    sidebar.addEventListener('click', e => {
        const targetLink = e.target.closest('.nav-item[data-section]');
        if (targetLink && !targetLink.classList.contains('active')) {
            e.preventDefault();
            switchSection(targetLink.dataset.section);
        }
    });
};

/**
 * Anexa os event listeners específicos para a seção que foi renderizada.
 * @param {string} sectionId - O ID da seção atual.
 */
const attachSectionEventListeners = (sectionId) => {
    const contentArea = document.getElementById('profile-content-area');
    if (!contentArea) return;
    
    if (sectionId === 'details') {
        const form = document.getElementById('profile-details-form');
        const avatarUploader = document.getElementById('avatar-uploader');
        const avatarInput = document.getElementById('avatar-upload');

        avatarUploader.addEventListener('click', () => avatarInput.click());
        avatarInput.addEventListener('change', handleAvatarChange);
        form.addEventListener('submit', handleProfileUpdate);
    }
    
    if (sectionId === 'my-posts' || sectionId === 'saved') {
         contentArea.querySelectorAll('.post-grid-item').forEach(card => {
            card.addEventListener('click', () => {
                const post = [...myPostsCache, ...savedPostsCache].find(p => p.id === card.dataset.postId);
                if (post) openPostDetailsModal(post, () => renderProfilePage(document.getElementById('main-content')));
            });
        });
    }

    if (sectionId === 'achievements') {
        const seeAllBtn = contentArea.querySelector('[data-section="all-achievements"]');
        if (seeAllBtn) {
            seeAllBtn.addEventListener('click', (e) => {
                e.preventDefault();
                switchSection('all-achievements');
            });
        }
    }

    if (sectionId === 'security') {
        const securityForm = document.getElementById('security-form');
        if(securityForm) securityForm.addEventListener('submit', handlePasswordUpdate);

        const deleteBtn = document.getElementById('delete-account-btn');
        if (deleteBtn) deleteBtn.addEventListener('click', handleDeleteAccount);
    }
};

// ===================================================================================
// GERADORES DE HTML PARA CADA SEÇÃO
// ===================================================================================

const getDetailsSectionHtml = () => `
    <div class="settings-card fade-in">
        <div class="card-header">
            <h2>Meu Perfil</h2>
            <p>Atualize sua foto e detalhes pessoais aqui.</p>
        </div>
        <form id="profile-details-form">
            <div class="card-body">
                <div class="profile-form-grid">
                    <div class="form-group avatar-uploader-container">
                        <label>Sua Foto</label>
                        <div class="avatar-uploader" id="avatar-uploader" title="Clique para alterar a foto">
                            <img src="${fullUserCache.photoURL || `https://ui-avatars.com/api/?name=${fullUserCache.displayName || 'A'}&background=e67e22&color=fff&size=150`}" alt="Avatar" id="avatar-preview">
                            <div class="uploader-overlay">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
                                <span>Alterar</span>
                            </div>
                            <input type="file" id="avatar-upload" accept="image/*" class="visually-hidden">
                        </div>
                    </div>
                    <div class="form-fields">
                        <div class="form-group">
                            <label for="displayName">Nome Completo</label>
                            <input type="text" id="displayName" value="${fullUserCache.displayName || ''}" required>
                        </div>
                        <div class="form-group">
                            <label for="email">Email</label>
                            <input type="email" id="email" value="${fullUserCache.email}" disabled>
                        </div>
                        <div class="form-group">
                            <label for="birthDate">Data de Nascimento</label>
                            <input type="date" id="birthDate" value="${fullUserCache.birthDate || ''}">
                        </div>
                    </div>
                </div>
            </div>
            <div class="card-footer">
                <button type="submit" class="btn">Salvar Alterações</button>
            </div>
        </form>
    </div>
`;

const getPostsSectionHtml = (title, posts, emptyMessage) => {
    const content = posts.length === 0
        ? `<p class="empty-message">${emptyMessage}</p>`
        : `<div class="posts-grid">
            ${posts.map(post => `
                <div class="post-grid-item" data-post-id="${post.id}" title="${post.body.substring(0, 100)}...">
                    <img src="${post.image}" alt="Foto da publicação" class="post-grid-image" loading="lazy">
                    <div class="post-grid-overlay"><span>Por ${post.author}</span></div>
                </div>`).join('')}
        </div>`;

    return `
        <div class="settings-card fade-in">
            <div class="card-header">
                <h2>${title} (${posts.length})</h2>
            </div>
            <div class="card-body">${content}</div>
        </div>
    `;
};

const getAchievementsSectionHtml = (isSummary) => {
    if (isSummary) {
        const unlockedCount = achievementsCache.length;
        const totalCount = allAchievements.length;
        return `
            <div class="settings-card fade-in">
                <div class="card-header">
                    <h2>Minhas Conquistas (${unlockedCount}/${totalCount})</h2>
                    <p>Seu progresso como um mestre da culinária na nossa comunidade.</p>
                </div>
                <div class="card-body">
                    <div class="achievements-showcase">
                        ${achievementsCache.length > 0 ? achievementsCache.slice(0, 5).map(ach => `
                            <div class="achievement-item unlocked" title="${ach.title}: ${ach.description}">
                                <div class="achievement-icon">${ach.icon}</div>
                            </div>
                        `).join('') : '<p class="empty-message small">Nenhuma conquista desbloqueada ainda.</p>'}
                        ${achievementsCache.length > 5 ? `<a href="#" class="achievement-item more" data-section="all-achievements"><span>+${achievementsCache.length - 5}</span></a>` : ''}
                    </div>
                </div>
                <div class="card-footer">
                    <a href="#" class="btn btn-secondary" data-section="all-achievements">Ver Todas as Conquistas</a>
                </div>
            </div>
        `;
    } else {
        return `
            <div class="settings-card fade-in">
                <div class="card-header"><h2>Todas as Conquistas</h2><p>Desbloqueie todas para se tornar uma lenda do Combinet!</p></div>
                <div class="card-body">
                    <div class="achievements-grid">
                    ${allAchievements.map(ach => {
                        const isUnlocked = achievementsCache.some(unlocked => unlocked.id === ach.id);
                        return `
                        <div class="achievement-card ${isUnlocked ? 'unlocked' : 'locked'}">
                            <div class="achievement-card-icon">${ach.icon}</div>
                            <div class="achievement-card-info">
                                <h4>${ach.title}</h4>
                                <p>${ach.description}</p>
                            </div>
                            ${isUnlocked ? '<div class="achievement-unlocked-badge"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/></svg></div>' : ''}
                        </div>`;
                    }).join('')}
                    </div>
                </div>
            </div>`;
    }
};

const getSecuritySectionHtml = () => {
    const isEmailProvider = fullUserCache.providerData.some(p => p.providerId === 'password');
    return `
        <div class="settings-card fade-in">
            <div class="card-header"><h2>Segurança e Senha</h2><p>Gerencie sua senha e mantenha sua conta segura.</p></div>
            <form id="security-form" ${!isEmailProvider ? 'style="display:none;"' : ''}>
                <div class="card-body">
                    <div class="form-group"><label for="current-password">Senha Atual</label><input type="password" id="current-password" required autocomplete="current-password"></div>
                    <div class="form-group"><label for="new-password">Nova Senha</label><input type="password" id="new-password" required autocomplete="new-password"></div>
                    <div class="form-group"><label for="confirm-password">Confirmar Nova Senha</label><input type="password" id="confirm-password" required autocomplete="new-password"></div>
                </div>
                <div class="card-footer"><button type="submit" class="btn">Alterar Senha</button></div>
            </form>
            ${!isEmailProvider ? `<div class="card-body"><p class="empty-message">Você fez login com um provedor social. A gestão de senha é feita através da sua conta Google.</p></div>` : ''}
        </div>
        <div class="settings-card danger-zone fade-in">
             <div class="card-header"><h2>Zona de Perigo</h2></div>
             <div class="card-body danger-content">
                 <div><h4>Excluir minha conta</h4><p>Esta ação é irreversível. Todos os seus dados, posts e conquistas serão permanentemente removidos.</p></div>
                 <button class="btn btn-danger" id="delete-account-btn">Excluir Conta</button>
             </div>
        </div>
    `;
};


// ===================================================================================
// MANIPULADORES DE EVENTOS (HANDLERS)
// ===================================================================================

const setButtonLoading = (button, isLoading, defaultText = 'Salvar Alterações') => {
    if (isLoading) {
        button.disabled = true;
        button.innerHTML = `<span class="btn-spinner"></span> <span>Salvando...</span>`;
    } else {
        button.disabled = false;
        button.innerHTML = `<span>${defaultText}</span>`;
    }
};

const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        openCropperModal(event.target.result, (croppedBlob) => {
            const form = document.getElementById('profile-details-form');
            const button = form.querySelector('button[type="submit"]');
            
            const localImageUrl = URL.createObjectURL(croppedBlob);

            updateUIAvatar(localImageUrl);
            showToast('Prévia da foto atualizada!', { type: 'info', duration: 2000 });
            
            setButtonLoading(button, true);

            updateUserProfile({ photoFile: croppedBlob })
                .then(({ permanentPhotoURL }) => {
                    if (permanentPhotoURL) {
                        updateUIAvatar(permanentPhotoURL); 
                        showToast('Foto de perfil salva com sucesso!', { type: 'success' });
                        document.dispatchEvent(new CustomEvent('profileUpdated', { detail: { photoURL: permanentPhotoURL } }));
                        URL.revokeObjectURL(localImageUrl);
                    }
                })
                .catch(error => {
                    showToast('Erro ao enviar a foto.', { type: 'error' });
                    console.error("Erro no upload do avatar:", error);
                })
                .finally(() => {
                    setButtonLoading(button, false);
                });
        });
    };
    reader.readAsDataURL(file);
};

const handleProfileUpdate = async (e) => {
    e.preventDefault();
    const form = e.target;
    const button = form.querySelector('button[type="submit"]');
    setButtonLoading(button, true);

    const displayName = document.getElementById('displayName').value;
    const birthDate = document.getElementById('birthDate').value;
    
    try {
        await updateUserProfile({ displayName, birthDate });
        fullUserCache.displayName = displayName;
        fullUserCache.birthDate = birthDate;
        
        document.getElementById('sidebar-username').textContent = displayName;
        document.dispatchEvent(new CustomEvent('profileUpdated', { detail: { displayName } }));
        
        showToast('Perfil atualizado com sucesso!', { type: 'success' });
    } catch (error) {
        showToast('Não foi possível atualizar o perfil.', { type: 'error' });
        console.error("Erro ao atualizar perfil:", error);
    } finally {
        setButtonLoading(button, false);
    }
};

const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    const form = e.target;
    const button = form.querySelector('button[type="submit"]');
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    if (newPassword !== confirmPassword) {
        showToast('As novas senhas não coincidem.', { type: 'error' });
        return;
    }
    if (newPassword.length < 6) {
        showToast('A nova senha deve ter pelo menos 6 caracteres.', { type: 'error' });
        return;
    }

    setButtonLoading(button, true, 'Alterar Senha');
    const { success, message } = await updateUserPassword(currentPassword, newPassword);
    
    if (success) {
        showToast(message, { type: 'success' });
        form.reset();
    } else {
        showToast(message, { type: 'error' });
    }
    setButtonLoading(button, false, 'Alterar Senha');
};

const handleDeleteAccount = () => {
    const confirmText = 'EXCLUIR';
    showConfirmationModal({
        title: 'Atenção: Ação Irreversível!',
        content: `
            <p>Todos os seus dados serão permanentemente apagados. Para confirmar, digite <strong>${confirmText}</strong> no campo abaixo.</p>
            <input type="text" id="delete-confirm-input" autocomplete="off">
        `,
        confirmText: 'Excluir minha conta permanentemente',
        isDanger: true,
        requireInputText: confirmText,
        onConfirm: () => {
            // A lógica de exclusão real está em auth.js
            // Por enquanto, apenas mostramos um toast para a demonstração
            showToast('Funcionalidade de exclusão em desenvolvimento.', { type: 'info', duration: 5000 });
            return true; 
        }
    });
};

const updateUIAvatar = (newUrl) => {
    const sidebarAvatar = document.getElementById('sidebar-avatar-img');
    const detailsAvatar = document.getElementById('avatar-preview');
    if (sidebarAvatar) sidebarAvatar.src = newUrl;
    if (detailsAvatar) detailsAvatar.src = newUrl;
    fullUserCache.photoURL = newUrl;
};

// ===================================================================================
// MODAIS (CROPPER E CONFIRMAÇÃO)
// ===================================================================================

const openCropperModal = (imageSrc, onConfirm) => {
    const modalHtml = `
        <div class="cropper-modal active">
            <div class="modal-backdrop"></div>
            <div class="modal-content">
                <h2>Ajuste sua Foto</h2>
                <div class="cropper-container">
                    <img id="cropper-image" src="${imageSrc}">
                </div>
                <div class="modal-actions">
                    <button class="btn btn-secondary" id="cropper-cancel">Cancelar</button>
                    <button class="btn" id="cropper-confirm">Confirmar e Salvar</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    const modal = document.body.querySelector('.cropper-modal');
    const imageElement = document.getElementById('cropper-image');
    
    cropperInstance = new Cropper(imageElement, {
        aspectRatio: 1,
        viewMode: 1,
        background: false,
        autoCropArea: 1
    });

    const closeModal = () => {
        cropperInstance.destroy();
        cropperInstance = null;
        modal.remove();
    };

    modal.querySelector('#cropper-cancel').addEventListener('click', closeModal);
    modal.querySelector('.modal-backdrop').addEventListener('click', closeModal);
    modal.querySelector('#cropper-confirm').addEventListener('click', () => {
        cropperInstance.getCroppedCanvas({
            width: 256,
            height: 256,
            imageSmoothingQuality: 'high'
        }).toBlob((blob) => {
            onConfirm(blob);
            closeModal();
        }, 'image/jpeg');
    });
};

const showConfirmationModal = (options) => {
    const { title, content, confirmText, isDanger = false, onConfirm, requireInputText = null } = options;
    const modalHtml = `
        <div class="confirmation-modal active">
            <div class="modal-backdrop"></div>
            <div class="modal-content">
                <div class="confirmation-content">
                    <h3>${title}</h3>
                    ${content}
                </div>
                <div class="modal-actions">
                    <button class="btn btn-secondary" id="confirm-cancel">Cancelar</button>
                    <button class="btn ${isDanger ? 'btn-danger' : ''}" id="confirm-action">${confirmText}</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    const modal = document.body.querySelector('.confirmation-modal');
    const confirmBtn = modal.querySelector('#confirm-action');
    const confirmationInput = modal.querySelector('#delete-confirm-input');

    if (requireInputText) {
        confirmBtn.disabled = true;
        confirmationInput.addEventListener('input', () => {
            confirmBtn.disabled = confirmationInput.value !== requireInputText;
        });
    }

    const closeModal = () => modal.remove();

    modal.querySelector('#confirm-cancel').addEventListener('click', closeModal);
    modal.querySelector('.modal-backdrop').addEventListener('click', closeModal);
    confirmBtn.addEventListener('click', async () => {
        const shouldClose = await onConfirm(modal);
        if (shouldClose !== false) {
            closeModal();
        }
    });
};