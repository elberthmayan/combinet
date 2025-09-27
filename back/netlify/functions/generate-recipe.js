// A função 'handler' é como o nosso porteiro. A Netlify vai chamar esta função.
exports.handler = async function(event, context) {
    // 1. Verificamos se o método da requisição é POST. Só aceitamos POST.
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        // 2. Pegamos nos ingredientes que o front-end enviou.
        const { ingredients } = JSON.parse(event.body);
        if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
            return { statusCode: 400, body: 'Bad Request: ingredients is required and must be an array.' };
        }

        const ingredientsList = ingredients.join(', ');

        // 3. Pegamos na chave secreta da API. Ela NÃO está no código.
        const API_KEY = process.env.GEMINI_API_KEY;

        if (!API_KEY) {
            console.error("Erro Crítico: A variável de ambiente GEMINI_API_KEY não está configurada na Netlify.");
            return { statusCode: 500, body: JSON.stringify({ error: 'A configuração do servidor está incompleta. A chave da API não foi encontrada.' }) };
        }
        
        const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${API_KEY}`;
        
        // 4. Montamos o prompt para a IA.
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

        // 5. Fazemos a chamada para a API do Gemini.
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { responseMimeType: "application/json" }
            })
        });

        const data = await response.json();

        // 6. Tratamento de erro robusto.
        if (!response.ok || !data.candidates || !data.candidates[0].content) {
            console.error('Resposta inválida da API Gemini:', data);
            const errorMessage = data?.error?.message || "A API não retornou uma receita válida. Verifique a sua chave da API e as permissões no Google Cloud.";
            return { statusCode: response.status || 500, body: JSON.stringify({ error: errorMessage }) };
        }
        
        const recipeJsonText = data.candidates[0].content.parts[0].text;
        
        // 7. Retornamos a receita para o front-end.
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: recipeJsonText
        };

    } catch (error) {
        console.error("Erro inesperado na função Netlify:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Ocorreu uma falha interna no servidor ao tentar gerar a receita.' })
        };
    }
};



