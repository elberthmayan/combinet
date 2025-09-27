// CORREÇÃO FINAL: Removemos a dependência 'node-fetch'.
// A Netlify usa uma versão moderna do Node.js que já inclui o 'fetch' globalmente,
// tornando o pacote externo desnecessário.

// A função 'handler' é como o nosso porteiro. A Netlify vai chamar esta função.
exports.handler = async function(event, context) {
    // 1. Verificamos se o método da requisição é POST. Só aceitamos POST.
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        // 2. Pegamos os ingredientes que o front-end enviou.
        const { ingredients } = JSON.parse(event.body);
        if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
            return { statusCode: 400, body: 'Bad Request: ingredients is required and must be an array.' };
        }

        const ingredientsList = ingredients.join(', ');

        // 3. Pegamos a chave secreta da API. Ela NÃO está no código.
        const API_KEY = process.env.GEMINI_API_KEY;
        if (!API_KEY) {
            return { statusCode: 500, body: 'Server error: API key not configured.'};
        }
        
        const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`;
        
        // 4. Montamos o prompt para a IA.
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

        // 5. Fazemos a chamada para a API do Gemini (usando o fetch nativo).
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { responseMimeType: "application/json" }
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Erro da API Gemini:', data);
            return { statusCode: response.status, body: JSON.stringify(data) };
        }

        const recipeJsonText = data.candidates[0].content.parts[0].text;
        
        // 6. Retornamos a receita para o front-end.
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: recipeJsonText
        };

    } catch (error) {
        console.error("Erro na função Netlify:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to generate recipe.' })
        };
    }
};
