/**
 * Exibe uma animação de loading de faca realista usando SVG e CSS.
 * @param {HTMLElement} container - O elemento que conterá a animação.
 */
export function showLoading(container) {
    container.innerHTML = `
        <div class="loading-container">
            <div class="chopping-animation">
                <svg viewBox="0 0 300 200" preserveAspectRatio="xMidYMid meet">
                    <!-- Tábua de Corte -->
                    <defs>
                        <linearGradient id="woodGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" style="stop-color:#cdaa7d;stop-opacity:1" />
                            <stop offset="100%" style="stop-color:#a17a48;stop-opacity:1" />
                        </linearGradient>
                        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur"/>
                            <feOffset in="blur" dx="2" dy="4" result="offsetBlur"/>
                            <feMerge>
                                <feMergeNode in="offsetBlur"/>
                                <feMergeNode in="SourceGraphic"/>
                            </feMerge>
                        </filter>
                    </defs>
                    <rect x="25" y="120" width="250" height="70" rx="15" fill="url(#woodGradient)" stroke="#6f4e24" stroke-width="4" />

                    <!-- Cenoura e Fatias -->
                    <g class="carrot-group">
                        <path d="M80,145 Q180,135 200,155 L190,165 Q170,155 70,160 Z" fill="#f39c12" stroke="#d35400" stroke-width="2"/>
                        <circle class="slice" cx="0" cy="0" r="10" fill="#f5b041" stroke="#d35400" stroke-width="2"/>
                        <circle class="slice" cx="0" cy="0" r="10" fill="#f5b041" stroke="#d35400" stroke-width="2"/>
                        <circle class="slice" cx="0" cy="0" r="10" fill="#f5b041" stroke="#d35400" stroke-width="2"/>
                    </g>
                    
                    <!-- Faca -->
                    <g class="knife" filter="url(#shadow)">
                        <!-- Lâmina com gradiente para efeito metálico -->
                        <linearGradient id="bladeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                           <stop offset="0%" style="stop-color:#f0f0f0;" />
                           <stop offset="50%" style="stop-color:#c0c0c0;" />
                           <stop offset="100%" style="stop-color:#e0e0e0;" />
                        </linearGradient>
                        <path d="M 50,80 L 200,70 L 210,120 L 60,130 Z" fill="url(#bladeGradient)" stroke="#a0a0a0" stroke-width="1" />
                        
                        <!-- Cabo de Madeira -->
                        <path d="M 210,120 L 220,115 L 280,135 L 270,145 Z" fill="#8b6c4b" stroke="#5a3a1a" stroke-width="1.5" />
                        
                        <!-- Rebites no cabo -->
                        <circle cx="225" cy="122" r="3" fill="#d0d0d0" />
                        <circle cx="255" cy="132" r="3" fill="#d0d0d0" />
                    </g>
                </svg>
            </div>
            <p class="loading-text">Combinando ingredientes...</p>
        </div>
    `;
}

