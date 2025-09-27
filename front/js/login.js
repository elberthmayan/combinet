/**
 * Lida com toda a interatividade da tela de login da geladeira de 2 portas.
 * - Abrir/fechar as portas e a gaveta, garantindo que apenas um esteja aberto.
 * - Evita que as portas fechem ao interagir com o formulário.
 * - Animação de transição ao submeter o formulário.
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM carregado. A iniciar script de login.");
    // Seleciona os elementos principais da DOM
    const scene = document.querySelector('.scene');
    const doorLeft = document.querySelector('.fridge__door--left');
    const doorRight = document.querySelector('.fridge__door--right');
    const drawer = document.querySelector('.fridge__drawer');

    // Seleciona os containers de interação para parar a propagação de eventos
    const formContainers = document.querySelectorAll('.form-container');
    const googleBtn = document.querySelector('.google-login-btn');

    // Função para fechar todos os elementos abertos
    const closeAll = () => {
        console.log("A fechar todas as portas.");
        doorLeft.classList.remove('is-open');
        doorRight.classList.remove('is-open');
        drawer.classList.remove('is-open');
    };

    if (doorLeft) {
        doorLeft.addEventListener('click', () => {
            const isOpen = doorLeft.classList.contains('is-open');
            console.log(`Porta esquerda clicada. Estava aberta? ${isOpen}`);
            closeAll();
            if (!isOpen) {
                doorLeft.classList.add('is-open');
            }
        });
    }

    if (doorRight) {
        doorRight.addEventListener('click', () => {
            const isOpen = doorRight.classList.contains('is-open');
            console.log(`Porta direita clicada. Estava aberta? ${isOpen}`);
            closeAll();
            if (!isOpen) {
                doorRight.classList.add('is-open');
            }
        });
    }

    if (drawer) {
        drawer.addEventListener('click', () => {
            const isOpen = drawer.classList.contains('is-open');
            console.log(`Gaveta clicada. Estava aberta? ${isOpen}`);
            closeAll();
            if (!isOpen) {
                drawer.classList.add('is-open');
            }
        });
    }

    /**
     * Impede que o clique dentro dos formulários ou no botão do Google
     * feche a porta/gaveta. O evento é "consumido" aqui.
     */
    const stopPropagation = (e) => {
        console.log("Propagação de clique parada dentro do formulário.");
        e.stopPropagation();
    }

    formContainers.forEach(form => form.addEventListener('click', stopPropagation));
    if (googleBtn) {
        googleBtn.addEventListener('click', stopPropagation);
    }
    
    /**
     * Lida com a submissão de qualquer um dos formulários.
     * Fecha as portas, aplica a animação de zoom e redireciona.
     * @param {Event} e - O evento de submissão do formulário.
     */
    const handleFormSubmit = (e) => {
        e.preventDefault(); 
        e.stopPropagation();
        console.log("Formulário submetido. A iniciar animação e redirecionamento.");

        closeAll();

        // Aguarda a animação da porta fechar e então inicia o zoom
        setTimeout(() => {
            console.log("A aplicar classe 'zoom-out'.");
            scene.classList.add('zoom-out');
            
            scene.addEventListener('transitionend', function onTransitionEnd(event) {
                if (event.propertyName === 'transform') {
                   console.log("Animação de transição terminada. A redirecionar para /app.html");
                   // CORREÇÃO: O caminho correto após o deploy é '/app.html'
                   window.location.href = '/app.html';
                   scene.removeEventListener('transitionend', onTransitionEnd);
                }
            });

        }, 1200); // Deve ser igual à duração da transição do .fridge__door
    };
    
    // Adiciona o listener de submissão para ambos os formulários
    document.querySelectorAll('form').forEach(form => {
        form.addEventListener('submit', handleFormSubmit);
    });
});

