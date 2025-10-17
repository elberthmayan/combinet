import { createCard, createSkeletonCard, showRecipeModal } from '../ui/components.js';
import { getAllFavorites } from '../utils/favorites.js';
import { showToast } from '../utils/toast.js';

// --- Estado da Página ---
let allFavoriteRecipes = [];
let currentContainer = null;
let currentSearchTerm = '';
let currentCategoryFilter = 'all';
let currentSort = 'title-asc'; // 'title-asc', 'title-desc', 'date-added'
let currentView = 'grid'; // 'grid' ou 'list'

/**
 * Filtra, ordena e renderiza as receitas com base no estado atual da página.
 */
const applyFiltersAndRender = () => {
    if (!currentContainer) return;

    // 1. Filtrar por categoria e busca
    const filtered = allFavoriteRecipes.filter(recipe => {
        const matchesCategory = currentCategoryFilter === 'all' || (recipe.category && recipe.category.toLowerCase() === currentCategoryFilter.toLowerCase());
        const matchesSearch = recipe.title.toLowerCase().includes(currentSearchTerm) || recipe.description.toLowerCase().includes(currentSearchTerm);
        return matchesCategory && matchesSearch;
    });

    // 2. Ordenar
    const sorted = filtered.sort((a, b) => {
        switch (currentSort) {
            case 'title-asc': return a.title.localeCompare(b.title);
            case 'title-desc': return b.title.localeCompare(a.title);
            // Adicionar lógica de 'date-added' se o dado estiver disponível no futuro
            default: return a.title.localeCompare(b.title);
        }
    });

    // 3. Renderizar com base na view
    renderContent(sorted);
};

/**
 * Renderiza o conteúdo (cards ou lista) ou o estado de vazio.
 * @param {Array} recipes - As receitas prontas para serem exibidas.
 */
const renderContent = (recipes) => {
    const contentArea = currentContainer.querySelector('#favorites-content-area');
    const emptyState = currentContainer.querySelector('#favorites-empty-state');
    if (!contentArea || !emptyState) return;

    if (recipes.length === 0) {
        contentArea.style.display = 'none';
        emptyState.style.display = 'flex';
    } else {
        emptyState.style.display = 'none';
        contentArea.style.display = currentView === 'grid' ? 'grid' : 'block';
        
        contentArea.innerHTML = ''; // Limpa antes de renderizar
        if (currentView === 'grid') {
            renderGridView(recipes, contentArea);
        } else {
            renderListView(recipes, contentArea);
        }
    }
};

/**
 * Renderiza as receitas no formato de grid.
 * @param {Array} recipes - Lista de receitas.
 * @param {HTMLElement} container - O elemento que conterá os cards.
 */
const renderGridView = async (recipes, container) => {
    const cardPromises = recipes.map(recipe => createCard(recipe));
    const cards = await Promise.all(cardPromises);
    cards.forEach(card => container.appendChild(card));
};

/**
 * Renderiza as receitas no formato de lista.
 * @param {Array} recipes - Lista de receitas.
 * @param {HTMLElement} container - O elemento que conterá os itens da lista.
 */
const renderListView = (recipes, container) => {
    recipes.forEach(recipe => {
        const listItem = document.createElement('div');
        listItem.className = 'favorite-list-item';
        listItem.innerHTML = `
            <div class="list-item-info">
                <h3>${recipe.title}</h3>
                <p>${recipe.description}</p>
                <span class="list-item-category">${recipe.category || 'Sem Categoria'}</span>
            </div>
            <div class="list-item-actions">
                <button class="btn btn-view-details">Ver Preparo</button>
            </div>
        `;
        listItem.querySelector('.btn-view-details').addEventListener('click', () => showRecipeModal(recipe));
        container.appendChild(listItem);
    });
};

/**
 * ATUALIZADO: Renderiza as "pílulas" de filtro de categoria somente se houver receitas.
 */
const renderFilterTags = () => {
    const filterContainer = currentContainer.querySelector('.favorites-filter-tags');
    if (!filterContainer) return;

    if (allFavoriteRecipes.length === 0) {
        filterContainer.style.display = 'none';
        return;
    }
    
    filterContainer.style.display = 'flex';
    const categories = [...new Set(allFavoriteRecipes.map(r => r.category).filter(Boolean))].sort();

    filterContainer.innerHTML = `
        <button class="filter-tag active" data-filter="all">Todas</button>
        ${categories.map(cat => `<button class="filter-tag" data-filter="${cat}">${cat}</button>`).join('')}
    `;

    filterContainer.querySelectorAll('.filter-tag').forEach(btn => {
        btn.addEventListener('click', () => {
            filterContainer.querySelector('.filter-tag.active').classList.remove('active');
            btn.classList.add('active');
            currentCategoryFilter = btn.dataset.filter;
            applyFiltersAndRender();
        });
    });
};

/**
 * Inicializa os controles da página (busca, ordenação, troca de view).
 */
const setupControls = () => {
    const searchInput = currentContainer.querySelector('#favorites-search-input');
    const sortSelect = currentContainer.querySelector('#favorites-sort-select');
    const gridViewBtn = currentContainer.querySelector('#view-grid-btn');
    const listViewBtn = currentContainer.querySelector('#view-list-btn');
    const contentArea = currentContainer.querySelector('#favorites-content-area');

    searchInput.addEventListener('keyup', (e) => {
        currentSearchTerm = e.target.value.toLowerCase();
        applyFiltersAndRender();
    });

    sortSelect.addEventListener('change', (e) => {
        currentSort = e.target.value;
        applyFiltersAndRender();
    });

    gridViewBtn.addEventListener('click', () => {
        if (currentView === 'grid') return;
        currentView = 'grid';
        listViewBtn.classList.remove('active');
        gridViewBtn.classList.add('active');
        contentArea.className = 'favorites-content-area view-grid';
        applyFiltersAndRender();
    });

    listViewBtn.addEventListener('click', () => {
        if (currentView === 'list') return;
        currentView = 'list';
        gridViewBtn.classList.remove('active');
        listViewBtn.classList.add('active');
        contentArea.className = 'favorites-content-area view-list';
        applyFiltersAndRender();
    });
};

/**
 * Renderiza a estrutura principal da página e inicializa tudo.
 * @param {HTMLElement} container - O elemento onde a página será renderizada.
 */
export const renderFavoritesPage = async (container) => {
    currentContainer = container;
    
    container.innerHTML = `
        <div class="container favorites-page-remake">
            <header class="favorites-header">
                <h1>Receitas Favoritas<h1>
                <p>Sua coleção pessoal de delícias. Encontre, filtre e organize suas receitas salvas.</p>
            </header>

            <div class="favorites-controls-bar">
                <div class="search-wrapper">
                    <svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"></path></svg>
                    <input type="text" id="favorites-search-input" placeholder="Buscar por nome ou descrição...">
                </div>
                <div class="actions-wrapper">
                    <select id="favorites-sort-select" class="custom-select">
                        <option value="title-asc">Ordenar A-Z</option>
                        <option value="title-desc">Ordenar Z-A</option>
                    </select>
                    <div class="layout-toggle">
                        <button id="view-grid-btn" class="layout-btn active" title="Visão em Grade">
                            <svg viewBox="0 0 24 24"><path d="M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z"></path></svg>
                        </button>
                        <button id="view-list-btn" class="layout-btn" title="Visão em Lista">
                           <svg viewBox="0 0 24 24"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"></path></svg>
                        </button>
                    </div>
                </div>
            </div>

            <nav class="favorites-filter-tags">
                <!-- Tags de Categoria -->
            </nav>

            <main id="favorites-content-area" class="favorites-content-area view-grid">
                ${Array(8).fill(0).map(() => createSkeletonCard().outerHTML).join('')}
            </main>

            <div id="favorites-empty-state" class="favorites-empty-state" style="display: none;">
                <div class="empty-state-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"></path></svg>
                </div>
                <h3>Seu livro de receitas está vazio</h3>
                <p>Nenhuma receita encontrada. Explore a comunidade ou use a busca para encontrar e favoritar novas delícias!</p>
            </div>
        </div>
    `;

    // Carrega dados e renderiza
    allFavoriteRecipes = await getAllFavorites();
    renderFilterTags();
    applyFiltersAndRender();
    setupControls();

    // Listener para quando um favorito é adicionado/removido em outra parte do app
    const favoritesUpdateHandler = async () => {
        allFavoriteRecipes = await getAllFavorites();
        renderFilterTags();
        applyFiltersAndRender();
        showToast('Sua lista de favoritos foi atualizada!', { type: 'info' });
    };

    document.removeEventListener('favoritesUpdated', favoritesUpdateHandler); // Evita duplicatas
    document.addEventListener('favoritesUpdated', favoritesUpdateHandler);
};