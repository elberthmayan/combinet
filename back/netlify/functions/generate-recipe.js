```js
// Função Netlify para gerar receitas com a API Gemini
exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { ingredients } = JSON.parse(event.body);
        if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
            return { statusCode: 400, body: 'Bad Request: ingredients is required and must be an array.' };
        }

        const ingredientsList = ingredients.join(', ');
        const API_KEY = process.env.GEMINI_API_KEY;

        if (!API_KEY) {
            console.error("Erro Crítico: Variável GEMINI_API_KEY não configurada.");
            return { 
                statusCode: 500, 
                body: JSON.stringify({ error: 'Configuração incompleta: chave da API não encontrada.' }) 
            };
        }

        const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${API_KEY}`;

        const prompt = `
            Você é um assistente de culinária chamado "Combinet Chef".
            Crie uma receita criativa usando apenas os seguintes ingredientes: ${ingredientsList}.
            A resposta DEVE ser um único objeto JSON, sem texto extra.
            O objeto JSON deve conter exatamente:
            - "title": nome criativo (string).
            - "description": até 15 palavras (string).
            - "ingredients": lista de ingredientes com quantidades (array de strings).
            - "preparation": modo de preparo passo a passo (string).
        `;

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { responseMimeType: "application/json" }
            })
        });

        const data = await response.json();

        if (
            !response.ok ||
            !data.candidates ||
            !data.candidates[0].content ||
            !data.candidates[0].content.parts ||
            !data.candidates[0].content.parts[0].text
        ) {
            console.error('Resposta inválida da API Gemini:', data);
            const errorMessage = data?.error?.message || "A API não retornou uma receita válida.";
            return { 
                statusCode: response.status || 500, 
                body: JSON.stringify({ error: errorMessage }) 
            };
        }

        const recipeJsonText = data.candidates[0].content.parts[0].text;

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: recipeJsonText
        };

    } catch (error) {
        console.error("Erro inesperado na função Netlify:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Falha interna no servidor ao tentar gerar a receita.' })
        };
    }
};
```
