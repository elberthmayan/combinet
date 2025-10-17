/**
 * ATUALIZADO: A estrutura da panqueca foi refeita para suportar a animação de virar,
 * com um lado "cru" e um lado "tostado".
 * @param {HTMLElement} container - O elemento que conterá a animação.
 */
export function showLoading(container) {
    container.innerHTML = `
        <div class="loading-spinner-container">
            <div class="frying-pan-container">
                <div class="pan-body">
                    <div class="handle"></div>
                    <div class="pan">
                        <div class="pancake-container">
                            <div class="pancake">
                                <div class="pancake-face front">
                                    <div class="butter"></div>
                                </div>
                                <div class="pancake-face back"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <p class="loading-message">Nosso chef está cozinhando...</p>
        </div>
    `;
}

/**
 * Esconde o indicador de loading.
 * A função continua a mesma.
 */
export function hideLoading() {
    const loadingElement = document.querySelector('.loading-spinner-container');
    if (loadingElement) {
        loadingElement.remove();
    }
}