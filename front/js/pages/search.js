import { createCard } from '../ui/components.js';
import { showLoading } from '../ui/loading.js';
import { generateRecipes } from '../gemini-api.js';
import { getPantryIngredients } from '../utils/pantry.js';
import { showToast } from '../utils/toast.js';

// --- Estado da Página ---
let userIngredients = [];
let refinementOptions = {
    type: 'any', // 'any', 'salty', 'sweet'
    difficulty: 'any', // 'any', 'quick', 'elaborate'
    style: '' // Estilo livre, ex: 'saudável', 'vegano'
};


// --- Lógica de Autocomplete ---
const commonIngredients = [
    'ovo', 'farinha de trigo', 'açúcar', 'leite', 'manteiga', 'chocolate em pó', 'fermento',
    'sal', 'pimenta do reino', 'cebola', 'alho', 'tomate', 'batata', 'cenoura', 'arroz',
    'feijão', 'frango', 'carne moída', 'queijo mussarela', 'presunto', 'macarrão',
    'azeite de oliva', 'limão', 'laranja', 'banana', 'maçã', 'abacate'
];

function showSuggestions(query) {
    const suggestionsContainer = document.getElementById('suggestions');
    if (!suggestionsContainer) return;

    suggestionsContainer.innerHTML = '';
    if (!query) {
        suggestionsContainer.style.display = 'none';
        return;
    }

    const filtered = commonIngredients.filter(ing => 
        ing.startsWith(query) && !userIngredients.includes(ing)
    );

    if (filtered.length > 0) {
        filtered.slice(0, 5).forEach(suggestion => {
            const div = document.createElement('div');
            div.className = 'suggestion-item';
            div.textContent = suggestion;
            div.addEventListener('click', () => {
                document.getElementById('ingredient-input').value = suggestion;
                addIngredient();
                suggestionsContainer.style.display = 'none';
            });
            suggestionsContainer.appendChild(div);
        });
        suggestionsContainer.style.display = 'block';
    } else {
        suggestionsContainer.style.display = 'none';
    }
}

function updateCreateButtonState() {
    const findBtn = document.getElementById('find-recipes-btn');
    if (!findBtn) return;
    
    const isDisabled = userIngredients.length === 0;
    findBtn.disabled = isDisabled;
    
    const btnText = findBtn.querySelector('span');
    if(btnText) {
        btnText.textContent = isDisabled ? 'Adicione um ingrediente' : `Criar com ${userIngredients.length} ${userIngredients.length > 1 ? 'itens' : 'item'}`;
    }
}

function renderIngredientTags() {
    const list = document.getElementById('ingredient-list');
    const placeholder = document.querySelector('.bowl-placeholder');
    if (!list || !placeholder) return;

    list.innerHTML = '';
    if (userIngredients.length > 0) {
        placeholder.style.display = 'none';
        userIngredients.forEach(ingredient => {
            const tag = document.createElement('div');
            tag.className = 'ingredient-token';
            tag.innerHTML = `
                <span>${ingredient}</span>
                <button class="remove-token" data-ingredient="${ingredient}" title="Remover ${ingredient}">&times;</button>
            `;
            list.appendChild(tag);
        });
    } else {
        placeholder.style.display = 'block';
    }

    list.querySelectorAll('.remove-token').forEach(button => {
        button.addEventListener('click', (e) => {
            const ingredientToRemove = e.target.dataset.ingredient;
            userIngredients = userIngredients.filter(ing => ing !== ingredientToRemove);
            renderIngredientTags();
        });
    });
    updateCreateButtonState();
}

function addIngredient() {
    const input = document.getElementById('ingredient-input');
    if (!input) return;

    const ingredient = input.value.trim().toLowerCase();
    if (ingredient && !userIngredients.includes(ingredient)) {
        userIngredients.push(ingredient);
        renderIngredientTags();
    }
    input.value = '';
    showSuggestions('');
    input.focus();
}

async function findAndRenderRecipes() {
    const mainCard = document.querySelector('.mestre-cuca-card');
    const resultsContainer = document.getElementById('results-container');
    if (!mainCard || !resultsContainer) return;

    if (userIngredients.length === 0) {
        showToast("Adicione pelo menos um ingrediente!", {type: 'error'});
        return;
    }

    // Esconde o card principal e mostra o loading
    mainCard.classList.add('is-hidden');
    resultsContainer.style.display = 'block';
    showLoading(resultsContainer);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
        // Passa os ingredientes e as opções de refinamento
        const foundRecipes = await generateRecipes(userIngredients, refinementOptions);

        resultsContainer.innerHTML = `
            <div class="results-header">
                <h2>Aqui estão algumas ideias para você:</h2>
                <button id="back-to-mestre-cuca-btn" class="btn btn-secondary">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                    Voltar
                </button>
            </div>
        `;
        const grid = document.createElement('div');
        grid.className = 'card-grid';
        
        if (foundRecipes.length > 0) {
            const cardPromises = foundRecipes.map(recipeData => {
                if (!recipeData.id) {
                    recipeData.id = `gemini_${Date.now()}_${Math.random()}`;
                }
                return createCard(recipeData);
            });
            const cards = await Promise.all(cardPromises);
            cards.forEach(card => grid.appendChild(card));
        } else {
            grid.innerHTML = '<p class="empty-message" style="max-width: initial;">Nosso Mestre Cuca não conseguiu criar uma receita com essa combinação. Tente adicionar ou alterar os ingredientes!</p>';
        }
        resultsContainer.appendChild(grid);

    } catch (error) {
        resultsContainer.innerHTML = `
            <div class="results-header">
                <h2>Oops! Algo deu errado.</h2>
                <button id="back-to-mestre-cuca-btn" class="btn btn-secondary">Voltar</button>
            </div>
            <p class="empty-message">Não foi possível comunicar com o Mestre Cuca. Por favor, tente novamente mais tarde.</p>
            <p style="text-align: center; font-size: 0.8em; color: var(--text-secondary);">Erro: ${error.message}</p>
        `;
    } finally {
        // Adiciona evento ao botão de voltar
        const backBtn = document.getElementById('back-to-mestre-cuca-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                resultsContainer.style.display = 'none';
                resultsContainer.innerHTML = '';
                mainCard.classList.remove('is-hidden');
            });
        }
    }
}

/**
 * ATUALIZADO: Abre um modal redesenhado e mais funcional para selecionar
 * ingredientes da despensa.
 */
async function openPantryModal() {
    const pantryData = await getPantryIngredients();
    const existingModal = document.querySelector('.search-pantry-modal');
    if (existingModal) existingModal.remove();

    const modal = document.createElement('div');
    modal.className = 'details-modal search-pantry-modal';

    const renderCategories = (data, filter = '') => {
        const sortedCategories = Object.keys(data).sort();
        let hasItems = false;
        
        const categoriesHtml = sortedCategories.map(category => {
            const filteredItems = data[category].filter(ing => ing.name.toLowerCase().includes(filter.toLowerCase()));
            if (filteredItems.length === 0) return '';
            
            hasItems = true;
            return `
                <div class="pantry-modal-category">
                    <h3>${category}</h3>
                    <div class="pantry-modal-items-grid">
                        ${filteredItems.map(ing => `
                            <label class="custom-checkbox pantry-modal-item">
                                <input type="checkbox" value="${ing.name}" ${userIngredients.includes(ing.name) ? 'checked' : ''}>
                                <span class="checkbox-icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>
                                </span>
                                <span class="item-name">${ing.name}</span>
                            </label>
                        `).join('')}
                    </div>
                </div>
            `;
        }).join('');

        if (!hasItems && filter) {
            return `<p class="empty-message small" style="margin-top: 20px;">Nenhum ingrediente encontrado para "${filter}".</p>`;
        }
        return categoriesHtml;
    };

    modal.innerHTML = `
        <div class="modal-backdrop"></div>
        <div class="modal-content">
            <div class="modal-header">
                <h2>Buscar na Despensa</h2>
                <button class="modal-close-btn" title="Fechar">&times;</button>
            </div>
            <div class="modal-search-bar">
                 <input type="text" id="pantry-modal-search" placeholder="Busque por um ingrediente..." autocomplete="off">
            </div>
            <div class="modal-body">
                ${Object.keys(pantryData).length > 0 ? renderCategories(pantryData) : '<p class="empty-message">Sua despensa está vazia!</p>'}
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" id="pantry-modal-cancel">Cancelar</button>
                <button class="btn btn-primary" id="use-selected-ingredients-btn">Usar Ingredientes</button>
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
    modal.querySelector('.modal-close-btn').addEventListener('click', closeModal);
    modal.querySelector('#pantry-modal-cancel').addEventListener('click', closeModal);
    
    // Funcionalidade de busca
    const searchInput = modal.querySelector('#pantry-modal-search');
    const body = modal.querySelector('.modal-body');
    searchInput.addEventListener('input', () => {
        body.innerHTML = renderCategories(pantryData, searchInput.value);
    });

    modal.querySelector('#use-selected-ingredients-btn').addEventListener('click', () => {
        const selected = new Set();
        modal.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => {
            selected.add(cb.value);
        });
        userIngredients = Array.from(selected);
        renderIngredientTags();
        showToast(`${selected.size} ingredientes da despensa foram adicionados!`, { type: 'success' });
        closeModal();
    });
}


// --- Renderização Principal e Eventos ---
export function renderSearchPage(container) {
    userIngredients = [];
    refinementOptions = { type: 'any', difficulty: 'any', style: '' };

    const ingredientsFromPantry = sessionStorage.getItem('ingredientsFromPantry');
    if (ingredientsFromPantry) {
        try {
            const parsedIngredients = JSON.parse(ingredientsFromPantry);
            if (Array.isArray(parsedIngredients) && parsedIngredients.length > 0) {
                const combined = new Set([...userIngredients, ...parsedIngredients]);
                userIngredients = Array.from(combined);
                
                setTimeout(() => {
                    showToast(`${parsedIngredients.length} ingredientes da despensa foram adicionados!`, { type: 'info' });
                }, 100);
            }
        } catch (e) {
            console.error("Falha ao processar ingredientes da despensa:", e);
        } finally {
            sessionStorage.removeItem('ingredientsFromPantry');
        }
    }

    container.innerHTML = `
        <div class="mestre-cuca-container">
            <div class="mestre-cuca-card">
                <div class="mestre-cuca-banner">
                    <div class="banner-overlay">
                        <div class="chef-icon">
                            <img src="img/chefe.jpg" alt="Ícone do Mestre Cuca">
                        </div>
                        <h1>Mestre Cuca</h1>
                        <p>Seu assistente na cozinha para criar pratos incríveis.</p>
                    </div>
                </div>

                <div class="mestre-cuca-content">
                    <div class="mestre-cuca-step">
                        <label class="step-label">1. O que você tem em mãos?</label>
                        <div class="ingredient-form-container">
                            <form class="ingredient-form" id="ingredient-form">
                                <input type="text" id="ingredient-input" placeholder="Ex: Tomate, queijo, manjericão..." autocomplete="off">
                                <button type="submit" class="btn" title="Adicionar">+</button>
                            </form>
                            <div id="suggestions" class="suggestions-container"></div>
                        </div>
                        <div class="ingredient-mixing-bowl">
                            <div class="bowl-placeholder">Sua panela de ingredientes está vazia</div>
                            <div id="ingredient-list"></div>
                        </div>
                         <button id="use-pantry-btn" class="btn-pantry-link">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="2" width="18" height="20" rx="2" ry="2"></rect><line x1="3" y1="10" x2="21" y2="10"></line><line x1="7" y1="5" x2="7.01" y2="5"></line></svg>
                            Buscar na minha despensa
                        </button>
                    </div>

                    <div class="mestre-cuca-step">
                        <label class="step-label">2. Alguma preferência? (Opcional)</label>
                        <div class="refinement-grid">
                            <div class="refinement-group" data-group="type">
                                <button class="ref-btn active" data-value="any">Qualquer</button>
                                <button class="ref-btn" data-value="salty">Salgado</button>
                                <button class="ref-btn" data-value="sweet">Doce</button>
                            </div>
                            <div class="refinement-group" data-group="difficulty">
                                <button class="ref-btn active" data-value="any">Qualquer</button>
                                <button class="ref-btn" data-value="quick">Rápido</button>
                                <button class="ref-btn" data-value="elaborate">Elaborado</button>
                            </div>
                        </div>
                        <input type="text" id="style-input" placeholder="Adicione um estilo (ex: vegano, light, italiano)...">
                    </div>
                </div>

                <div class="mestre-cuca-footer">
                    <button id="find-recipes-btn" class="btn btn-primary btn-large" disabled>
                        <span>Adicione um ingrediente</span>
                    </button>
                </div>
            </div>
            <div id="results-container" class="results-view-container"></div>
        </div>
    `;

    // --- Anexar Eventos ---
    const ingredientInput = document.getElementById('ingredient-input');
    const suggestionsContainer = document.getElementById('suggestions');
    
    document.getElementById('ingredient-form').addEventListener('submit', (e) => {
        e.preventDefault();
        addIngredient();
    });
    
    document.getElementById('use-pantry-btn').addEventListener('click', openPantryModal);
    document.getElementById('find-recipes-btn').addEventListener('click', findAndRenderRecipes);
    document.getElementById('style-input').addEventListener('change', (e) => {
        refinementOptions.style = e.target.value.trim().toLowerCase();
    });

    document.querySelectorAll('.refinement-group').forEach(group => {
        group.addEventListener('click', (e) => {
            const btn = e.target.closest('.ref-btn');
            if (btn) {
                const groupName = group.dataset.group;
                const value = btn.dataset.value;
                refinementOptions[groupName] = value;
                
                group.querySelector('.active').classList.remove('active');
                btn.classList.add('active');
            }
        });
    });

    ingredientInput.addEventListener('input', () => showSuggestions(ingredientInput.value.trim().toLowerCase()));
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.ingredient-form-container')) {
            if (suggestionsContainer) suggestionsContainer.style.display = 'none';
        }
    });

    renderIngredientTags();
}