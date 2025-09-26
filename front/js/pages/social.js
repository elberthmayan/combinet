/**
 * Renderiza a página da comunidade com um layout de feed social.
 * @param {HTMLElement} container - O elemento onde a página será renderizada.
 */
export const renderSocialPage = (container) => {
    container.innerHTML = `
        <div class="container social-page">
            <div class="social-header">
                <h1>Comunidade Combinet</h1>
                <p>Compartilhe suas criações e inspire outros chefs!</p>
            </div>

            <div class="social-feed">
                <!-- Post 1 -->
                <div class="post-card">
                    <div class="post-header">
                        <img src="https://i.pravatar.cc/50?u=ana" alt="Avatar de Ana" class="post-avatar">
                        <div>
                            <div class="post-author">Ana Silva</div>
                            <div class="post-timestamp">2 horas atrás</div>
                        </div>
                    </div>
                    <div class="post-body">
                        <p>Fiz o bolo de chocolate do app e ficou simplesmente divino! 🍫🍰 Super fofinho!</p>
                        <img src="https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=1089&auto=format&fit=crop" alt="Foto de um bolo de chocolate" class="post-image">
                    </div>
                    <div class="post-actions">
                        <button class="action-btn">❤️ Curtir</button>
                        <button class="action-btn">💬 Comentar</button>
                    </div>
                </div>

                <!-- Post 2 -->
                <div class="post-card">
                    <div class="post-header">
                        <img src="https://i.pravatar.cc/50?u=bruno" alt="Avatar de Bruno" class="post-avatar">
                        <div>
                            <div class="post-author">Bruno Costa</div>
                            <div class="post-timestamp">5 horas atrás</div>
                        </div>
                    </div>
                    <div class="post-body">
                        <p>Para começar bem o dia: as panquecas americanas do Combinet. Ficaram perfeitas com mel!</p>
                        <img src="https://images.unsplash.com/photo-1528207776546-365bb710ee93?q=80&w=1170&auto=format&fit=crop" alt="Foto de panquecas americanas" class="post-image">
                    </div>
                    <div class="post-actions">
                        <button class="action-btn">❤️ Curtir</button>
                        <button class="action-btn">💬 Comentar</button>
                    </div>
                </div>

                 <!-- Post 3 -->
                 <div class="post-card">
                    <div class="post-header">
                        <img src="https://i.pravatar.cc/50?u=carla" alt="Avatar de Carla" class="post-avatar">
                        <div>
                            <div class="post-author">Carla Dias</div>
                            <div class="post-timestamp">1 dia atrás</div>
                        </div>
                    </div>
                    <div class="post-body">
                        <p>Omelete simples para um jantar leve. Adoro como o app me dá ideias rápidas! 🍳</p>
                        <img src="https://images.unsplash.com/photo-1587339144365-9d3a436a188f?q=80&w=1287&auto=format&fit=crop" alt="Foto de um omelete" class="post-image">
                    </div>
                    <div class="post-actions">
                        <button class="action-btn">❤️ Curtir</button>
                        <button class="action-btn">💬 Comentar</button>
                    </div>
                </div>
            </div>
        </div>
    `;
};

