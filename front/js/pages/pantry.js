import { getPantryIngredients, addPantryIngredient, removePantryIngredient, updatePantryIngredient } from '../utils/pantry.js';
import { showToast } from '../utils/toast.js';

// --- Estado da Página ---
const state = {
    allIngredients: [],
    ingredientsByCategory: {},
    selectedIngredients: new Set(),
    activeCategory: 'Todos',
    searchTerm: '',
    editingIngredientName: null, // NOVO: Rastreia qual ingrediente está sendo editado
};

// --- Funções de Renderização ---

/**
 * Renderiza o layout principal da página da despensa.
 * @param {HTMLElement} container O elemento principal para renderizar a página.
 */
const renderPageLayout = (container) => {
    container.innerHTML = `
        <div class="container pantry-page-container">
            <header class="pantry-header">
                <h1>Minha Despensa</h1>
                <p>Gerencie seus ingredientes, arraste-os para a bancada e edite-os rapidamente.</p>
            </header>
            <div class="pantry-layout">
                <aside class="pantry-sidebar" id="pantry-sidebar"></aside>
                <main class="pantry-main-content" id="pantry-main-content"></main>
            </div>
            <div class="chef-counter" id="chef-counter">
                 <div class="counter-items-wrapper" id="counter-items-wrapper"></div>
                <div class="counter-actions">
                    <button class="btn btn-primary" id="take-to-kitchen-btn">
                        <span>Levar para a Cozinha</span>
                    </button>
                </div>
            </div>
        </div>
    `;
};

/**
 * Renderiza a barra lateral com busca, formulário de adição e filtros de categoria.
 */
const renderSidebar = () => {
    const sidebarContainer = document.getElementById('pantry-sidebar');
    if (!sidebarContainer) return;

    const categories = ['Todos', ...Object.keys(state.ingredientsByCategory).sort()];

    sidebarContainer.innerHTML = `
        <div class="sidebar-section">
            <div class="pantry-search-wrapper">
                <input type="text" id="pantry-search-input" placeholder="Buscar ingrediente..." value="${state.searchTerm}">
            </div>
        </div>
        <div class="sidebar-section">
            <h3>Adicionar à Despensa</h3>
            <form id="pantry-add-form">
                <input type="text" id="pantry-ingredient-input" placeholder="Ex: Queijo Minas" autocomplete="off">
                <button type="submit" class="btn">Adicionar</button>
            </form>
        </div>
        <div class="sidebar-section">
            <h3>Categorias</h3>
            <ul class="pantry-category-filters" id="pantry-category-filters">
                ${categories.map(cat => {
                    const count = cat === 'Todos' ? state.allIngredients.length : state.ingredientsByCategory[cat]?.length || 0;
                    if (count === 0 && cat !== 'Todos') return '';
                    return `
                        <li>
                            <button class="${cat === state.activeCategory ? 'active' : ''}" data-category="${cat}">
                                <span class="category-name">${cat}</span>
                                <span class="category-count">${count}</span>
                            </button>
                        </li>
                    `;
                }).join('')}
            </ul>
        </div>
    `;
};

/**
 * Renderiza a grade de ingredientes com base nos filtros e na busca.
 */
const renderItemsGrid = () => {
    const gridContainer = document.getElementById('pantry-main-content');
    if (!gridContainer) return;

    let itemsToDisplay = state.activeCategory === 'Todos'
        ? [...state.allIngredients]
        : state.ingredientsByCategory[state.activeCategory] || [];

    if (state.searchTerm) {
        itemsToDisplay = itemsToDisplay.filter(item => 
            item.name.toLowerCase().includes(state.searchTerm.toLowerCase())
        );
    }

    if (itemsToDisplay.length === 0) {
        gridContainer.innerHTML = `<div class="pantry-empty-state">
            <h3>Nenhum item encontrado</h3>
            <p>Tente limpar a busca ou selecionar outra categoria.</p>
        </div>`;
        return;
    }

    gridContainer.innerHTML = `
        <div class="pantry-items-grid" id="pantry-items-grid">
            ${itemsToDisplay.map(createItemCard).join('')}
        </div>
    `;
    
    // NOVO: Anexa os listeners de arrastar e soltar após a renderização
    attachDragAndDropListeners();
};


/**
 * Cria o HTML para um único card de ingrediente.
 * @param {object} ingredient O objeto do ingrediente.
 * @returns {string} O HTML do card.
 */
const createItemCard = (ingredient) => {
    const isSelected = state.selectedIngredients.has(ingredient.name);
    const isEditing = state.editingIngredientName === ingredient.name;
    const allCategories = ['Todos', ...Object.keys(state.ingredientsByCategory).sort()];

    return `
        <div 
            class="pantry-item-card ${isSelected ? 'selected' : ''} ${isEditing ? 'editing' : ''}" 
            data-ingredient-name="${ingredient.name}"
            draggable="${!isEditing}"
        >
            <!-- Ações visíveis ao passar o mouse (Editar, Remover) -->
            <div class="quick-edit-controls">
                <button class="quick-edit-btn" data-action="edit" title="Editar item">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z"></path><path fill-rule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clip-rule="evenodd"></path></svg>
                </button>
            </div>
            <button class="remove-pantry-item" data-action="remove" title="Remover">&times;</button>
            
            <!-- Visão de Exibição Padrão -->
            <div class="display-view">
                <span class="item-name">${ingredient.name}</span>
                <span class="item-category">${ingredient.category}</span>
            </div>

            <!-- Formulário de Edição Rápida -->
            <form class="edit-form" data-action="none">
                <input type="text" class="edit-name-input" value="${ingredient.name}" required>
                <select class="edit-category-select">
                    ${allCategories.filter(c => c !== 'Todos').map(cat => `
                        <option value="${cat}" ${ingredient.category === cat ? 'selected' : ''}>${cat}</option>
                    `).join('')}
                </select>
                <div class="edit-form-actions">
                    <button type="button" class="btn btn-secondary" data-action="cancel-edit">Cancelar</button>
                    <button type="submit" class="btn" data-action="save-edit">Salvar</button>
                </div>
            </form>
        </div>
    `;
};

/**
 * Renderiza o balcão flutuante do chef com os itens selecionados.
 */
const renderChefCounter = () => {
    const bar = document.getElementById('chef-counter');
    const itemsWrapper = document.getElementById('counter-items-wrapper');
    const count = state.selectedIngredients.size;

    if (count > 0) {
        bar.classList.add('visible');
        itemsWrapper.innerHTML = [...state.selectedIngredients].map(name => `<div class="counter-item">${name}</div>`).join('');
    } else {
        bar.classList.remove('visible');
    }
};


// --- Manipuladores de Eventos ---

const handleAddIngredient = async (form) => {
    const input = form.querySelector('#pantry-ingredient-input');
    const ingredientName = input.value.trim();
    if (!ingredientName) return;

    if (state.allIngredients.some(item => item.name.toLowerCase() === ingredientName.toLowerCase())) {
        showToast('Este ingrediente já está na sua despensa.', { type: 'info' });
        input.value = '';
        return;
    }

    const button = form.querySelector('button');
    button.disabled = true;
    button.innerHTML = `<div class="btn-spinner"></div>`;

    const success = await addPantryIngredient(ingredientName);
    if (success) {
        showToast(`"${ingredientName}" foi adicionado!`, { type: 'success' });
        input.value = '';
        await loadAndRenderAll(false); // Recarrega sem limpar a seleção
    } else {
        showToast('Não foi possível adicionar o ingrediente.', { type: 'error' });
    }
    button.disabled = false;
    button.innerHTML = `Adicionar`;
    input.focus();
};

const handleRemoveIngredient = async (ingredientName) => {
    await removePantryIngredient(ingredientName);
    showToast(`"${ingredientName}" removido.`, { type: 'info' });
    
    state.selectedIngredients.delete(ingredientName);
    if (state.editingIngredientName === ingredientName) {
        state.editingIngredientName = null;
    }
    await loadAndRenderAll(false);
};

const handleItemClick = (ingredientName) => {
    if (state.editingIngredientName) return; // Impede a seleção durante a edição

    if (state.selectedIngredients.has(ingredientName)) {
        state.selectedIngredients.delete(ingredientName);
    } else {
        state.selectedIngredients.add(ingredientName);
    }
    renderItemsGrid();
    renderChefCounter();
};

const handleTakeToKitchen = () => {
    if (state.selectedIngredients.size === 0) {
        showToast('Selecione pelo menos um ingrediente.', {type: 'info'});
        return;
    };
    const ingredients = Array.from(state.selectedIngredients);
    sessionStorage.setItem('ingredientsFromPantry', JSON.stringify(ingredients));
    document.querySelector('.navbar__links a[data-page="criar"]')?.click();
};

// NOVO: Manipuladores para Edição Rápida
const handleStartEdit = (ingredientName) => {
    state.editingIngredientName = ingredientName;
    renderItemsGrid(); // Re-renderiza para mostrar o formulário
};

const handleCancelEdit = () => {
    state.editingIngredientName = null;
    renderItemsGrid(); // Re-renderiza para esconder o formulário
};

const handleSaveEdit = async (form, oldIngredientName) => {
    const oldIngredient = state.allIngredients.find(i => i.name === oldIngredientName);
    if (!oldIngredient) return;

    const newName = form.querySelector('.edit-name-input').value.trim();
    const newCategory = form.querySelector('.edit-category-select').value;

    if (!newName) {
        showToast('O nome do ingrediente não pode ser vazio.', { type: 'error' });
        return;
    }

    const success = await updatePantryIngredient(oldIngredient, { name: newName, category: newCategory });

    if (success) {
        showToast('Ingrediente atualizado!', { type: 'success' });
        state.editingIngredientName = null;
        if (state.selectedIngredients.has(oldIngredientName)) {
            state.selectedIngredients.delete(oldIngredientName);
            state.selectedIngredients.add(newName);
        }
        await loadAndRenderAll(false);
    } else {
        showToast('Não foi possível atualizar o ingrediente.', { type: 'error' });
    }
};


// --- LÓGICA DE ARRASTAR E SOLTAR ---
const attachDragAndDropListeners = () => {
    const cards = document.querySelectorAll('.pantry-item-card[draggable="true"]');
    const dropZone = document.getElementById('chef-counter');

    cards.forEach(card => {
        card.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', card.dataset.ingredientName);
            setTimeout(() => card.classList.add('dragging'), 0);
        });

        card.addEventListener('dragend', () => {
            card.classList.remove('dragging');
        });
    });

    if (dropZone) {
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('drag-over');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            const ingredientName = e.dataTransfer.getData('text/plain');
            if (ingredientName && !state.selectedIngredients.has(ingredientName)) {
                state.selectedIngredients.add(ingredientName);
                renderItemsGrid();
                renderChefCounter();
                showToast(`"${ingredientName}" adicionado à bancada!`, { type: 'info' });
            }
        });
    }
};

// --- Funções de Inicialização e Lógica ---

/**
 * Carrega todos os dados da despensa e renderiza a UI.
 * @param {boolean} clearSelection - Se deve limpar a seleção atual.
 */
const loadAndRenderAll = async (clearSelection = true) => {
    if (clearSelection) {
        state.selectedIngredients.clear();
    }
    state.ingredientsByCategory = await getPantryIngredients();
    state.allIngredients = Object.values(state.ingredientsByCategory).flat();
    
    renderSidebar();
    renderItemsGrid();
    renderChefCounter();
    attachSidebarEventListeners();
};

/**
 * Anexa os event listeners para os elementos da barra lateral.
 */
const attachSidebarEventListeners = () => {
    const addForm = document.getElementById('pantry-add-form');
    addForm?.addEventListener('submit', (e) => { e.preventDefault(); handleAddIngredient(addForm); });
    
    const searchInput = document.getElementById('pantry-search-input');
    searchInput?.addEventListener('input', (e) => {
        state.searchTerm = e.target.value;
        renderItemsGrid();
    });

    const categoryFilters = document.getElementById('pantry-category-filters');
    categoryFilters?.addEventListener('click', (e) => {
        const button = e.target.closest('button');
        if (button) {
            state.activeCategory = button.dataset.category;
            document.querySelector('.pantry-category-filters button.active').classList.remove('active');
            button.classList.add('active');
            renderItemsGrid();
        }
    });
};

/**
 * Renderiza a página da despensa e inicializa toda a funcionalidade.
 * @param {HTMLElement} container O container principal.
 */
export const renderPantryPage = async (container) => {
    // Reseta o estado ao entrar na página
    Object.assign(state, {
        allIngredients: [],
        ingredientsByCategory: {},
        selectedIngredients: new Set(),
        activeCategory: 'Todos',
        searchTerm: '',
        editingIngredientName: null,
    });

    renderPageLayout(container);
    
    const mainContent = document.getElementById('pantry-main-content');
    if(mainContent) {
        // Listener principal para ações nos cards
        mainContent.addEventListener('click', (e) => {
            const targetButton = e.target.closest('button');
            const card = e.target.closest('.pantry-item-card');
            
            if (!targetButton || !card) {
                if (card) {
                    handleItemClick(card.dataset.ingredientName);
                }
                return;
            }
            
            const action = targetButton.dataset.action;
            const ingredientName = card.dataset.ingredientName;

            switch (action) {
                case 'remove':
                    e.stopPropagation();
                    handleRemoveIngredient(ingredientName);
                    break;
                case 'edit':
                    e.stopPropagation();
                    handleStartEdit(ingredientName);
                    break;
                case 'cancel-edit':
                    e.stopPropagation();
                    handleCancelEdit();
                    break;
            }
        });
        
        // Listener para submissão do formulário de edição
        mainContent.addEventListener('submit', (e) => {
            e.preventDefault();
            const form = e.target.closest('.edit-form');
            const card = e.target.closest('.pantry-item-card');
            if (form && card) {
                handleSaveEdit(form, card.dataset.ingredientName);
            }
        });
    }

    document.getElementById('take-to-kitchen-btn')?.addEventListener('click', handleTakeToKitchen);

    await loadAndRenderAll();
};
