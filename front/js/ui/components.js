// ATUALIZADO: Funções de favoritos agora são assíncronas
import { saveFavoriteRecipe, removeRecipeFromFavorites, isFavorite } from '../utils/favorites.js';
import { showToast } from '../utils/toast.js';

/**
 * VERSÃO FINAL SURPREENDENTE: Gera um PDF que parece uma "ficha de receita" de app.
 * Utiliza html2canvas para renderizar um layout HTML customizado e jspdf para adicionar elementos interativos.
 * @param {object} recipeData - Os dados da receita.
 */
async function generateRecipePdf(recipeData) {
    showToast('Preparando sua ficha de receita...', { type: 'info', duration: 2000 });

    const recipeCard = document.createElement('div');
    recipeCard.id = 'pdf-render-target';

    Object.assign(recipeCard.style, {
        width: '794px',
        padding: '40px',
        boxSizing: 'border-box',
        backgroundColor: '#f5f5f5',
        backgroundImage: `url('https://www.transparenttextures.com/patterns/wood-pattern.png')`,
        fontFamily: "'Poppins', sans-serif",
        color: '#333',
        display: 'flex',
        flexDirection: 'column',
    });

    const prepTime = "25 min";
    const servings = "4 porções";
    const siteUrl = "https://combinet-8b89c.web.app";

    let qrImgData = '';
    try {
        const qr = qrcode(0, 'L');
        qr.addData(siteUrl);
        qr.make();
        qrImgData = qr.createDataURL(5, 5);
    } catch (e) {
        console.error("Erro ao gerar QR Code:", e);
    }

    // REMOVIDO o footer do HTML, pois será adicionado diretamente no PDF.
    recipeCard.innerHTML = `
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Pacifico&family=Poppins:wght@400;500;700&display=swap');
            #pdf-render-target * { box-sizing: border-box; }
            .pdf-header { background-color: #e67e22; color: white; padding: 25px; border-radius: 12px 12px 0 0; text-align: center; }
            .pdf-header h1 { font-family: 'Pacifico', cursive; font-size: 38px; margin: 0; line-height: 1; }
            .pdf-main { background-color: #ffffff; border-radius: 0 0 12px 12px; padding: 25px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); flex-grow: 1;}
            .pdf-title { text-align: center; margin-bottom: 20px; }
            .pdf-title h2 { font-size: 28px; color: #34495e; margin: 0 0 5px 0; }
            .pdf-title p { font-style: italic; color: #7f8c8d; margin: 0; }
            .pdf-meta { display: flex; justify-content: center; gap: 30px; margin-bottom: 25px; padding-bottom: 20px; border-bottom: 1px solid #eee; }
            .pdf-meta-item { display: flex; align-items: center; gap: 8px; color: #7f8c8d; font-weight: 500; }
            .pdf-content-grid { display: flex; gap: 30px; }
            .pdf-col-ingredients { width: 35%; }
            .pdf-col-steps { width: 65%; border-left: 1px solid #eee; padding-left: 30px;}
            .pdf-col-ingredients h3, .pdf-col-steps h3 { font-size: 18px; color: #e67e22; margin: 0 0 15px 0; border-bottom: 2px solid #e67e22; padding-bottom: 5px;}
            .pdf-col-ingredients ul { list-style: none; padding: 0; margin: 0; }
            .pdf-col-ingredients li { margin-bottom: 8px; line-height: 1.5; }
            .pdf-col-steps ol { list-style: none; padding: 0; margin: 0; counter-reset: steps-counter; }
            .pdf-col-steps li { line-height: 1.6; margin-bottom: 15px; counter-increment: steps-counter; position: relative; padding-left: 35px; }
            .pdf-col-steps li::before { content: counter(steps-counter); position: absolute; left: 0; top: 0; width: 24px; height: 24px; background: #f0f2f5; color: #e67e22; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; }
        </style>
        <header class="pdf-header"><h1>Combinet</h1></header>
        <main class="pdf-main">
            <div class="pdf-title">
                <h2>${recipeData.title}</h2>
                <p>"${recipeData.description}"</p>
            </div>
            <div class="pdf-meta">
                <div class="pdf-meta-item">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#7f8c8d"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/></svg>
                    <span>${prepTime}</span>
                </div>
                 <div class="pdf-meta-item">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#7f8c8d"><path d="M16 8c0-2.21-1.79-4-4-4S8 5.79 8 8s1.79 4 4 4 4-1.79 4-4zm4 10v-1c0-2.66-5.33-4-8-4s-8 1.34-8 4v1h16z"/></svg>
                    <span>${servings}</span>
                </div>
            </div>
            <div class="pdf-content-grid">
                <div class="pdf-col-ingredients">
                    <h3>Ingredientes</h3>
                    <ul>${recipeData.ingredients.map(ing => `<li>• ${ing}</li>`).join('')}</ul>
                </div>
                <div class="pdf-col-steps">
                    <h3>Modo de Preparo</h3>
                    <ol>${recipeData.preparation.split('\n').filter(s => s.trim()).map(step => `<li>${step}</li>`).join('')}</ol>
                </div>
            </div>
        </main>
    `;
    
    recipeCard.style.position = 'absolute';
    recipeCard.style.left = '-9999px';
    document.body.appendChild(recipeCard);
    
    try {
        const canvas = await html2canvas(recipeCard, {
            scale: 2, 
            useCORS: true,
            logging: false,
        });

        const imgData = canvas.toDataURL('image/png');
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({ unit: 'px', format: 'a4' });
        
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const contentHeight = (canvas.height * pdfWidth) / canvas.width;
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, contentHeight);

        // --- CORREÇÃO: ADICIONANDO ELEMENTOS INTERATIVOS DIRETAMENTE NO PDF ---
        const footerStartY = pdfHeight - 60; // Posição vertical do rodapé

        // Adiciona o QR Code como imagem
        if (qrImgData) {
            pdf.addImage(qrImgData, 'PNG', pdfWidth - 80, footerStartY, 50, 50);
        }

        // Adiciona os textos
        pdf.setFontSize(10);
        pdf.setTextColor('#333');
        pdf.text('Para mais receitas como essa, acesse nosso site:', 40, footerStartY + 25);
        
        pdf.setFontSize(9);
        pdf.setTextColor('#e67e22');
        // Adiciona o link clicável
        pdf.textWithLink(siteUrl, 40, footerStartY + 38, { url: siteUrl });
        
        pdf.save(`${recipeData.title.replace(/\s/g, '_')}_Combinet_Ficha.pdf`);
        showToast('Ficha de receita gerada com sucesso!', { type: 'success' });
    } catch (error) {
        console.error("Erro ao gerar PDF com html2canvas:", error);
        showToast('Ocorreu um erro ao criar a ficha de receita.', { type: 'error' });
    } finally {
        document.body.removeChild(recipeCard);
    }
}

/**
 * ATUALIZADO: Função agora é assíncrona e não usa mais o modal de pastas.
 * Cria e exibe um modo de preparo imersivo e elegante.
 * @param {object} recipeData - Os dados da receita para exibir.
 */
export const showRecipeModal = async (recipeData) => {
    const existingModal = document.querySelector('.preparation-modal');
    if (existingModal) existingModal.remove();

    const prepTime = "25 min";
    const servings = "4 porções";

    const modal = document.createElement('div');
    modal.className = 'preparation-modal';
    modal.innerHTML = `
        <div class="modal-backdrop"></div>
        <div class="modal-container">
            <button class="modal-close-btn">&times;</button>
            
            <div class="modal-header-content">
                <h1>${recipeData.title}</h1>
                <p>${recipeData.description}</p>
                <div class="recipe-meta">
                    <div>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                        <span>${prepTime}</span>
                    </div>
                    <div>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                        <span>${servings}</span>
                    </div>
                </div>
            </div>

            <div class="modal-body-content">
                <div class="prep-tabs">
                    <button class="tab-btn active" data-tab="ingredients">Ingredientes</button>
                    <button class="tab-btn" data-tab="steps">Modo de Preparo</button>
                </div>
                <div class="prep-content">
                    <div id="ingredients" class="prep-panel active">
                        <ul class="ingredients-list">
                            ${recipeData.ingredients.map(ing => `
                                <li>
                                    <span class="checkbox"></span>
                                    <label>${ing}</label>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                    <div id="steps" class="prep-panel">
                        <ol class="steps-list">
                            ${recipeData.preparation.split('\n').filter(step => step.trim() !== '').map(step => `
                                <li>${step.replace(/^\d+\.\s*/, '')}</li>
                            `).join('')}
                        </ol>
                    </div>
                </div>
            </div>

            <div class="modal-footer-content">
                <button class="btn btn-secondary" id="download-recipe-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                    <span>Baixar Receita</span>
                </button>
                <button class="btn" id="save-favorite-modal-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                    <span>Salvar</span>
                </button>
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
    modal.querySelector('.modal-close-btn').addEventListener('click', closeModal);
    
    modal.querySelector('#download-recipe-btn').addEventListener('click', () => {
        generateRecipePdf(recipeData);
    });

    const tabButtons = modal.querySelectorAll('.tab-btn');
    const tabPanels = modal.querySelectorAll('.prep-panel');
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            tabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const tabId = btn.dataset.tab;
            tabPanels.forEach(panel => {
                panel.classList.toggle('active', panel.id === tabId);
            });
        });
    });

    const favoriteBtn = modal.querySelector('#save-favorite-modal-btn');
    const favoriteBtnText = favoriteBtn.querySelector('span');
    const favoriteBtnSvg = favoriteBtn.querySelector('svg');

    const updateFavoriteStatus = async () => {
        const isFav = await isFavorite(recipeData.id);
        if (isFav) {
            favoriteBtn.classList.add('favorited');
            favoriteBtnText.textContent = 'Salvo!';
            favoriteBtnSvg.style.fill = 'currentColor';
        } else {
            favoriteBtn.classList.remove('favorited');
            favoriteBtnText.textContent = 'Salvar';
            favoriteBtnSvg.style.fill = 'none';
        }
    };
    
    // ATUALIZADO: Lógica de salvar simplificada
    favoriteBtn.addEventListener('click', async () => {
        const isFav = await isFavorite(recipeData.id);
        if (isFav) {
            await removeRecipeFromFavorites(recipeData.id);
            showToast('Receita removida dos favoritos.', { type: 'info' });
        } else {
            await saveFavoriteRecipe(recipeData);
            showToast('Receita salva nos favoritos!', { type: 'success' });
        }
        updateFavoriteStatus();
        document.dispatchEvent(new CustomEvent('favoritesUpdated'));
    });
    
    updateFavoriteStatus();
};


/**
 * ATUALIZADO: Função agora é assíncrona para verificar o status de favorito e não usa mais o modal de pastas
 * Cria um card de receita interativo.
 * @param {object} recipeData - Os dados da receita.
 * @returns {Promise<HTMLElement>} - O elemento do card.
 */
export const createCard = async (recipeData) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.id = recipeData.id;

    const favoriteBtn = document.createElement('button');
    let isFav = await isFavorite(recipeData.id);

    const updateFavoriteButton = (isCurrentlyFavorite) => {
        favoriteBtn.className = isCurrentlyFavorite ? 'favorite-btn favorited' : 'favorite-btn';
        favoriteBtn.title = isCurrentlyFavorite ? 'Remover dos favoritos' : 'Salvar nos favoritos';
        favoriteBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`;
    };
    updateFavoriteButton(isFav);
    
    // ATUALIZADO: Lógica de salvar simplificada
    favoriteBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (isFav) {
            await removeRecipeFromFavorites(recipeData.id);
            showToast('Receita removida dos favoritos.', { type: 'info' });
            isFav = false;
        } else {
            await saveFavoriteRecipe(recipeData);
            showToast('Receita salva nos favoritos!', { type: 'success' });
            isFav = true;
        }
        updateFavoriteButton(isFav);
        document.dispatchEvent(new CustomEvent('favoritesUpdated'));
    });
    
    const viewButton = document.createElement('button');
    viewButton.className = 'btn btn-prepare';
    viewButton.textContent = 'Ver Preparo';
    viewButton.addEventListener('click', (e) => {
        e.stopPropagation();
        showRecipeModal(recipeData);
    });

    card.innerHTML = `
        <div class="card__image-container">
            <span class="card__image-placeholder-text">${recipeData.title.split(' ')[0]}</span>
        </div>
        <div class="card__content">
            <h4 class="card__title">${recipeData.title}</h4>
            <p class="card__description">${recipeData.description}</p>
            <div class="card__actions"></div>
        </div>
    `;

    const cardActions = card.querySelector('.card__actions');
    cardActions.appendChild(viewButton);
    card.querySelector('.card__image-container').appendChild(favoriteBtn);

    card.addEventListener('click', () => {
        showRecipeModal(recipeData);
    });

    return card;
};

/**
 * MOVIDO PARA CÁ: Cria um card "esqueleto" para ser usado durante o carregamento.
 * @returns {HTMLElement} - O elemento do card esqueleto.
 */
export const createSkeletonCard = () => {
    const card = document.createElement('div');
    card.className = 'skeleton-card';
    card.innerHTML = `
        <div class="skeleton-image"></div>
        <div class="skeleton-content">
            <div class="skeleton-line"></div>
            <div class="skeleton-line skeleton-line-short"></div>
        </div>
    `;
    return card;
};

/**
 * Cria um item "esqueleto" para o grid da página social.
 * @returns {HTMLElement} - O elemento do item esqueleto.
 */
export const createSkeletonPost = () => {
    const card = document.createElement('div');
    card.className = 'skeleton-post-grid-item';
    return card;
};