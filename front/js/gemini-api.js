/**
 * Este módulo lida com a comunicação com a API do Google Gemini
 * para gerar receitas e categorizar ingredientes.
 */

// Chave de API - Lembre-se de manter isso seguro em produção.
const GEMINI_API_KEY = "AIzaSyB-WXuVOSlm7cPEtxodNRdBrElLs3xEf20"; // <-- CHAVE INSERIDA

const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${GEMINI_API_KEY}`;

/**
 * ATUALIZADO: Gera receitas com base em ingredientes e opções de refinamento.
 * @param {string[]} ingredients - Array de ingredientes.
 * @param {object} options - Opções de refinamento { type, difficulty, style }.
 * @returns {Promise<Array>} - Uma promessa que resolve para um array de objetos de receita.
 */
export async function generateRecipes(ingredients, options = {}) {
    if (!GEMINI_API_KEY || GEMINI_API_KEY === "COLE_A_SUA_CHAVE_DA_API_AQUI") {
        console.error("A chave da API do Gemini não foi definida.");
        return Promise.resolve([
            {
                id: "exemplo_sem_chave",
                title: "Receita de Exemplo (Sem Chave)",
                description: "Adicione sua chave de API no arquivo 'front/js/gemini-api.js' para gerar receitas.",
                category: "Exemplos",
                ingredients: ingredients.map(ing => `Item: ${ing}`),
                preparation: "1. Abra 'front/js/gemini-api.js'.\n2. Insira sua chave de API na constante 'GEMINI_API_KEY'."
            }
        ]);
    }

    const ingredientsString = ingredients.join(', ');
    
    // Constrói o prompt de refinamento
    let refinementPrompt = '';
    if (options.type === 'salty') refinementPrompt += " A receita deve ser salgada.";
    if (options.type === 'sweet') refinementPrompt += " A receita deve ser doce.";
    if (options.difficulty === 'quick') refinementPrompt += " A receita deve ser rápida e fácil (menos de 30 minutos).";
    if (options.difficulty === 'elaborate') refinementPrompt += " A receita pode ser mais elaborada e gourmet.";
    if (options.style) refinementPrompt += ` A receita deve ter um estilo ${options.style}.`;


    const prompt = `
        Você é um chef de cozinha criativo. Sua tarefa é criar entre 1 e 3 receitas deliciosas 
        usando os seguintes ingredientes: ${ingredientsString}.
        ${refinementPrompt}

        Responda APENAS com um array JSON válido, seguindo esta estrutura:
        [
          {
            "id": "receita_gerada_[timestamp_aleatorio_1]",
            "title": "Nome da Receita",
            "description": "Uma descrição curta, apetitosa e que chame a atenção.",
            "category": "Uma categoria apropriada para a receita, como 'Prato Principal', 'Sobremesa', 'Lanche', 'Café da Manhã', 'Bebida' ou 'Acompanhamento'",
            "ingredients": [
              "Ingrediente 1 (com quantidade)",
              "Ingrediente 2 (com quantidade)"
            ],
            "preparation": "Passo a passo detalhado do modo de preparo, com cada passo em uma nova linha (separado por '\\n')."
          }
        ]

        Se não for possível criar uma receita com os ingredientes, retorne um array vazio [].
        Não inclua nenhuma formatação ou texto adicional fora do array JSON.
    `;

    try {
        const response = await fetch(GEMINI_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }],
                 generationConfig: {
                    responseMimeType: "application/json",
                 }
            })
        });

        if (!response.ok) {
            const errorBody = await response.json();
            throw new Error(`Erro na API do Gemini: ${errorBody.error?.message || response.statusText}`);
        }

        const data = await response.json();
        const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!generatedText) {
            throw new Error("A API do Gemini não retornou um texto válido.");
        }
        
        const recipes = JSON.parse(generatedText);
        return Array.isArray(recipes) ? recipes : [];

    } catch (error) {
        console.error("Falha ao gerar receitas com o Gemini:", error);
        return [];
    }
}

/**
 * Categoriza um único ingrediente usando a API do Gemini.
 * @param {string} ingredientName - O nome do ingrediente a ser categorizado.
 * @returns {Promise<string>} - Uma promessa que resolve para o nome da categoria.
 */
export async function categorizeIngredient(ingredientName) {
    if (!GEMINI_API_KEY) {
        return "Outros"; 
    }

    const categories = [
        "Laticínios e Ovos", "Carnes, Aves e Peixes", "Legumes e Verduras", "Frutas",
        "Grãos e Cereais", "Massas e Pães", "Feijões e Leguminosas", "Óleos e Gorduras",
        "Ervas e Especiarias", "Molhos e Condimentos", "Doces e Sobremesas", "Bebidas", "Outros"
    ].join(', ');

    const prompt = `
        Categorize o ingrediente a seguir em UMA das seguintes categorias: ${categories}.
        Ingrediente: "${ingredientName}".
        Responda APENAS com o nome exato da categoria.
    `;

    try {
        const response = await fetch(GEMINI_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const category = data.candidates?.[0]?.content?.parts?.[0]?.text.trim();
        
        if (category && categories.includes(category)) {
            return category;
        }
        return "Outros";

    } catch (error) {
        console.error("Erro ao categorizar ingrediente:", error);
        return "Outros";
    }
}