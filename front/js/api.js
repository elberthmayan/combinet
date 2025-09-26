console.log("✅ API Connector v4 LOADED - Modelo: gemini-1.5-flash-latest"); // Nossa "arma secreta" para depuração

// ATENÇÃO: A CHAVE DE API NUNCA DEVE FICAR NO FRONT-END NUM PROJETO REAL.
// Estamos a fazer isto apenas para a Fase 1 do nosso plano.
// Na Fase 2, moveremos esta lógica para um back-end seguro.
const API_KEY = 'AIzaSyB02q6Icx5cxHlFChoGGD7J1gJsEqeO2S4'; // <-- A sua chave está aqui
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`;

/**
 * Gera uma receita usando a API do Gemini com base nos ingredientes fornecidos.
 * @param {string[]} ingredientsArray - Um array de ingredientes.
 * @returns {Promise<object>} - Uma promessa que resolve para o objeto da receita.
 * @throws {Error} - Lança um erro detalhado em caso de falha.
 */
export const generateRecipeWithGemini = async (ingredientsArray) => {
    const ingredientsList = ingredientsArray.join(', ');

    const prompt = `
        Você é um assistente de culinária chamado "Combinet Chef".
        A sua tarefa é criar uma receita criativa e deliciosa usando apenas os seguintes ingredientes: ${ingredientsList}.
        A sua resposta DEVE ser um único objeto JSON, sem nenhum texto ou formatação extra antes ou depois.
        O objeto JSON precisa de ter EXATAMENTE as seguintes chaves:
        - "title": um nome criativo para a receita (string).
        - "description": uma descrição curta e atrativa, com no máximo 15 palavras (string).
        - "ingredients": uma lista dos ingredientes usados com as suas quantidades (array de strings).
        - "preparation": o modo de preparo passo a passo (string).
    `;

    try {
        const response = await fetch(API_URL, {
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

        const data = await response.json();

        if (!response.ok) {
            const errorMessage = data?.error?.message || `Erro na API: ${response.statusText}`;
            console.error('Erro da API Gemini:', data);
            throw new Error(errorMessage);
        }

        if (!data.candidates || !data.candidates[0]?.content?.parts[0]?.text) {
             console.error('Resposta inesperada da API:', data);
             throw new Error("A API retornou uma resposta num formato inesperado.");
        }
        
        let recipeJsonText = data.candidates[0].content.parts[0].text;
        
        if (recipeJsonText.startsWith("```json")) {
            recipeJsonText = recipeJsonText.slice(7, -3).trim();
        }
        
        return JSON.parse(recipeJsonText);

    } catch (error) {
        console.error("Falha na chamada para a API do Gemini:", error);
        throw error;
    }
};