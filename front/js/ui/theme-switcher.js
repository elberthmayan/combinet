/**
 * Inicializa o seletor de tema (egg switch).
 * Lida com a alternância da classe 'dark-theme' no body e salva a preferência do usuário.
 */
export function initThemeSwitcher() {
    const themeToggle = document.getElementById('theme-toggle');
    if (!themeToggle) return;

    const body = document.body;

    /**
     * Aplica o tema com base em um booleano.
     * @param {boolean} isDark - True para tema escuro, false para claro.
     */
    const applyTheme = (isDark) => {
        body.classList.toggle('dark-theme', isDark);
        themeToggle.checked = !isDark; // 'checked' é o estado do ovo inteiro (claro)
    };

    // 1. Tenta carregar o tema salvo no armazenamento local
    const savedTheme = localStorage.getItem('theme');

    if (savedTheme) {
        applyTheme(savedTheme === 'dark');
    } else {
        // 2. Se não houver tema salvo, usa a preferência do sistema operacional
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        applyTheme(prefersDark);
    }

    // 3. Adiciona o listener para salvar a escolha do usuário
    themeToggle.addEventListener('change', () => {
        const isDark = !themeToggle.checked;
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        body.classList.toggle('dark-theme', isDark);
    });
}