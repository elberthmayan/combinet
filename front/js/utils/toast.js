/**
 * Cria e exibe uma notificação toast.
 * O toast é adicionado a um container e se remove automaticamente.
 * @param {string} message - A mensagem para exibir.
 * @param {object} options - Opções para o toast.
 * @param {string} [options.type='success'] - Tipo do toast ('success', 'error', 'info').
 * @param {number} [options.duration=3000] - Duração em milissegundos.
 */
export function showToast(message, options = {}) {
    // Define os valores padrão para as opções
    const { type = 'success', duration = 3000 } = options;

    const container = document.getElementById('toast-container');
    if (!container) {
        console.error('O elemento #toast-container não foi encontrado na página!');
        return;
    }

    // Cria o elemento do toast
    const toast = document.createElement('div');
    // Adiciona classes para estilização: uma base e uma para o tipo específico
    toast.className = `toast toast--${type}`;
    toast.textContent = message;

    // Adiciona o toast ao container na página
    container.appendChild(toast);

    // Força um reflow para garantir que a animação de entrada funcione
    // Adicionando a classe 'show' logo após a criação
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);

    // Agenda a remoção do toast
    setTimeout(() => {
        toast.classList.remove('show');
        // Adiciona um listener para remover o elemento da DOM DEPOIS que a animação de saída terminar
        toast.addEventListener('transitionend', () => {
            toast.remove();
        });
    }, duration);
}