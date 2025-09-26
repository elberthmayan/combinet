import { generateRecipeWithGemini } from '../api.js'; // NOVO: Importa a função do Gemini
import { createCard } from '../ui/components.js';
import { showLoading } from '../ui/loading.js';

let userIngredients = [];

function updateCombineButtonState() {
    const findBtn = document.getElementById('find-recipes-btn');
    if (!findBtn) return;
    
    findBtn.disabled = userIngredients.length === 0;
    findBtn.textContent = userIngredients.length > 0 ? 'Combinar!' : 'Adicione ingredientes';
}

function renderIngredientTags() {
    const list = document.getElementById('ingredient-list');
    if (!list) return;

    list.innerHTML = '';
    userIngredients.forEach(ingredient => {
        const tag = document.createElement('div');
        tag.className = 'ingredient-tag';
        tag.innerHTML = `
            <span>${ingredient}</span>
            <button class="remove-tag" data-ingredient="${ingredient}">&times;</button>
        `;
        list.appendChild(tag);
    });

    list.querySelectorAll('.remove-tag').forEach(button => {
        button.addEventListener('click', (e) => {
            const ingredientToRemove = e.target.dataset.ingredient;
            userIngredients = userIngredients.filter(ing => ing !== ingredientToRemove);
            renderIngredientTags();
        });
    });
    updateCombineButtonState();
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
    input.focus();
}

// ATUALIZADO: Lógica de tratamento de erro aprimorada
async function findAndRenderRecipes() {
    const resultsContainer = document.getElementById('results-container');
    if (!resultsContainer) return;

    resultsContainer.style.display = 'block';
    showLoading(resultsContainer); // Exibe a animação de loading

    try {
        const generatedRecipe = await generateRecipeWithGemini(userIngredients);

        resultsContainer.innerHTML = '<h2>Sua receita Combinet Chef!</h2>';
        const grid = document.createElement('div');
        grid.className = 'card-grid';
        
        const fullRecipeData = {
            id: Date.now(),
            imageUrl: `https://placehold.co/600x400/e67e22/ffffff?text=${encodeURIComponent(generatedRecipe.title)}`,
            ...generatedRecipe
        };
        grid.appendChild(createCard(fullRecipeData));
        resultsContainer.appendChild(grid);

    } catch (error) {
        // Agora, exibimos a mensagem de erro específica que a API nos deu!
        console.error('Erro no processo de renderização da receita:', error);
        resultsContainer.innerHTML = `
            <h2><font color="red">Falha na Missão!</font></h2>
            <p>Ocorreu um erro ao gerar sua receita. Aqui está o relatório de inteligência:</p>
            <p style="background-color: #ffebe6; border: 1px solid #ffc5b3; padding: 10px; border-radius: 5px; font-family: monospace;">
                ${error.message}
            </p>
            <p><strong>Ação recomendada:</strong> Verifique se a 'Vertex AI API' está ativada no seu projeto Google Cloud.</p>
        `;
    }
}

export function renderSearchPage(container) {
    container.innerHTML = `
        <div class="combiner-container">
            <h1>O que tem na sua geladeira?</h1>
            <p>Adicione seus ingredientes e nós encontraremos a receita perfeita para você.</p>
            <form class="ingredient-form" id="ingredient-form">
                <input type="text" id="ingredient-input" placeholder="Ex: Ovo, farinha, leite..." autocomplete="off">
                <button type="submit" class="btn">Adicionar</button>
            </form>
            <div id="ingredient-list"></div>
            <button id="find-recipes-btn" class="btn" disabled>Adicione ingredientes</button>
        </div>
        <div id="results-container" class="container" style="display: none;"></div>
    `;

    document.getElementById('ingredient-form').addEventListener('submit', (e) => {
        e.preventDefault();
        addIngredient();
    });

    document.getElementById('find-recipes-btn').addEventListener('click', findAndRenderRecipes);
    updateCombineButtonState();
}