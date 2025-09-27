console.log("✅ API Connector v5 LOADED - Secure Netlify Bridge");

/**
 * **VERSÃO SEGURA**
 * Chama a nossa função de back-end (nosso "porteiro") para gerar uma receita.
 * A chave da API fica protegida no servidor, nunca no front-end.
 * @param {string[]} ingredientsArray - Um array de ingredientes.
 * @returns {Promise<object>} - Uma promessa que resolve para o objeto da receita.
 * @throws {Error} - Lança um erro detalhado em caso de falha.
 */
export const generateRecipeWithGemini = async (ingredientsArray) => {
    // 1. O endereço que chamamos agora é o nosso próprio site, na rota /api/
    // Graças à regra no netlify.toml, isso será redirecionado para a nossa função.
    const API_URL = '/api/generate-recipe';

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            // 2. Enviamos os ingredientes no corpo da requisição.
            body: JSON.stringify({
                ingredients: ingredientsArray
            })
        });

        const data = await response.json();

        // 3. Se a resposta do nosso back-end não for OK, mostramos o erro.
        if (!response.ok) {
            const errorMessage = data?.error?.message || data.error || `Erro do servidor: ${response.statusText}`;
            console.error('Erro retornado pelo back-end:', data);
            throw new Error(errorMessage);
        }
        
        // 4. Se tudo deu certo, retornamos os dados da receita.
        return data;

    } catch (error) {
        console.error("Falha na chamada para o back-end:", error);
        // Re-lançamos o erro para que a página de busca possa exibi-lo.
        throw error;
    }
};
