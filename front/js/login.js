import { 
    signInWithGoogle, 
    signUpWithEmail, 
    signInWithEmail, 
    sendPasswordResetEmail,
    updateUserProfile,
    onAuthStateChanged,
    signInAnonymously // Adicionada importação
} from './auth.js';
import { showToast } from './utils/toast.js';

// Função para redirecionar para a página principal
const redirectToApp = () => {
    // CORREÇÃO: Alterado para ser compatível com a opção "cleanUrls" do Firebase.
    window.location.href = '/app.html';
};


/**
 * Lida com toda a interatividade da tela de login.
 */
document.addEventListener('DOMContentLoaded', () => {
    // --- CORREÇÃO: VERIFICADOR DE SESSÃO ATIVA ---
    // Se o usuário já estiver logado (por exemplo, após ser redirecionado de volta),
    // o código abaixo o enviará diretamente para a página do app, resolvendo o problema.
    onAuthStateChanged(user => {
        if (user) {
            redirectToApp();
            return; // Impede que o restante do código da página de login seja executado
        }
    });

    // Verifica se há uma mensagem de toast vinda de outra página (como a de exclusão de conta)
    const toastDataJSON = sessionStorage.getItem('toastMessage');
    if (toastDataJSON) {
        try {
            const toastData = JSON.parse(toastDataJSON);
            showToast(toastData.message, { type: toastData.type, duration: 5000 });
            sessionStorage.removeItem('toastMessage'); // Limpa a mensagem para não mostrar de novo
        } catch (e) {
            console.error("Erro ao processar a mensagem de toast:", e);
            sessionStorage.removeItem('toastMessage');
        }
    }

    // --- LÓGICA DO CALENDÁRIO E RELÓGIO ---
    function updateDateTime() {
        const now = new Date();
        const timeZone = 'America/Sao_Paulo';
        
        const calendarMonthEl = document.getElementById('calendar-month-year');
        const calendarDayEl = document.getElementById('calendar-day');
        const clockHoursEl = document.getElementById('clock-hours');
        const clockMinutesEl = document.getElementById('clock-minutes');

        if (calendarDayEl && calendarMonthEl) {
            const day = now.toLocaleDateString('pt-BR', { day: 'numeric', timeZone });
            const month = now.toLocaleDateString('pt-BR', { month: 'short', timeZone });
            calendarDayEl.textContent = day;
            calendarMonthEl.textContent = month.replace('.', '').toUpperCase();
        }

        if(clockHoursEl && clockMinutesEl) {
            const hours = now.toLocaleTimeString('pt-BR', { hour: '2-digit', hour12: false, timeZone }).padStart(2, '0');
            const minutes = now.toLocaleTimeString('pt-BR', { minute: '2-digit', timeZone }).padStart(2, '0');
            clockHoursEl.textContent = hours;
            clockMinutesEl.textContent = minutes;
        }
    }
    
    if (document.querySelector('.digital-clock')) {
        setInterval(updateDateTime, 1000 * 60); // Atualiza a cada minuto
        updateDateTime(); // Chama uma vez para não esperar o primeiro minuto
    }


    // --- LÓGICA DA ANIMAÇÃO DA GELADEIRA ---
    const fridgeContainer = document.querySelector('.fridge-container');
    const doorLeft = document.querySelector('.fridge__door--left');
    const doorRight = document.querySelector('.fridge__door--right');
    const drawer = document.querySelector('.fridge__drawer');
    const formContainers = document.querySelectorAll('.form-container');

    const closeAll = () => {
        if(fridgeContainer) fridgeContainer.classList.remove('light-on');
        if (doorLeft) doorLeft.classList.remove('is-open');
        if (doorRight) doorRight.classList.remove('is-open');
        if (drawer) drawer.classList.remove('is-open');
    };

    const handleDoorClick = (door) => {
        if (!door) return;
        const isOpen = door.classList.contains('is-open');
        const wasSomethingOpen = doorLeft.classList.contains('is-open') || doorRight.classList.contains('is-open') || drawer.classList.contains('is-open');
        
        closeAll();

        if (!isOpen) {
            door.classList.add('is-open');
            if(fridgeContainer) fridgeContainer.classList.add('light-on');
        } else if (wasSomethingOpen && !door.classList.contains('is-open')) {
             if(fridgeContainer) fridgeContainer.classList.remove('light-on');
        }
    };
    
    if (doorLeft) doorLeft.addEventListener('click', () => handleDoorClick(doorLeft));
    if (doorRight) doorRight.addEventListener('click', () => handleDoorClick(doorRight));
    if (drawer) drawer.addEventListener('click', () => handleDoorClick(drawer));


    const stopPropagation = (e) => e.stopPropagation();
    formContainers.forEach(form => form.addEventListener('click', stopPropagation));

    // --- LÓGICA DE LOGIN COM FIREBASE (CORRIGIDA) ---

    // Função para tratar erros de autenticação de forma amigável
    const handleAuthError = (error) => {
        console.error("Erro de autenticação:", error.code, error.message);
        let message = 'Ocorreu um erro. Tente novamente.';
        switch (error.code) {
            case 'auth/user-not-found':
            case 'auth/invalid-credential':
            case 'auth/wrong-password':
                message = 'Email ou senha incorretos.';
                break;
            case 'auth/invalid-email':
                message = 'O formato do email é inválido.';
                break;
            case 'auth/email-already-in-use':
                message = 'Este email já foi cadastrado. Tente fazer login.';
                break;
            case 'auth/weak-password':
                message = 'Sua senha é fraca. Use pelo menos 6 caracteres.';
                break;
            case 'auth/popup-closed-by-user':
                message = 'A janela de login do Google foi fechada.';
                break;
            default:
                message = 'Falha na autenticação. Verifique sua conexão.';
        }
        showToast(message, { type: 'error' });
    };

    // Função para controlar o estado de "carregando" dos botões
    const setLoadingState = (form, isLoading) => {
        const button = form.querySelector('button[type="submit"]');
        if (!button) return;

        const originalText = form.id.includes('login') ? 'Entrar' : 'Criar Conta';
        button.disabled = isLoading;
        button.textContent = isLoading ? 'Aguarde...' : originalText;
    };

    // Botão de Login com Google
    const googleLoginButtons = document.querySelectorAll('.google-login-btn');
    googleLoginButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            signInWithGoogle()
                .then(result => {
                    if (result && result.user) {
                        const firstName = result.user.displayName ? result.user.displayName.split(' ')[0] : 'Usuário';
                        showToast(`Bem-vindo(a), ${firstName}!`, { type: 'success' });
                        setTimeout(redirectToApp, 1000); 
                    } else {
                        handleAuthError({ code: 'auth/popup-closed-by-user' });
                    }
                })
                .catch(handleAuthError);
        });
    });

    // Formulários de Login com Email/Senha
    const loginForms = [
        document.querySelector('#desktop-login-form'),
        document.querySelector('#mobile-login-form')
    ];
    loginForms.forEach(form => {
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                setLoadingState(form, true);
                const email = form.querySelector('input[type="email"]').value;
                const password = form.querySelector('input[type="password"]').value;
                
                signInWithEmail(email, password)
                    .then(() => {
                        showToast(`Bem-vindo(a) de volta!`, { type: 'success' });
                        setTimeout(redirectToApp, 1000);
                    })
                    .catch(handleAuthError)
                    .finally(() => setLoadingState(form, false));
            });
        }
    });

    // Formulários de Registro com Email/Senha
    const registerForms = [
        document.querySelector('#desktop-register-form'),
        document.querySelector('#mobile-register-form')
    ];
    registerForms.forEach(form => {
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                setLoadingState(form, true);
                const name = form.querySelector('input[type="text"]').value.trim();
                const email = form.querySelector('input[type="email"]').value;
                const password = form.querySelector('input[type="password"]').value;
                
                if (!name) {
                    showToast('Por favor, digite seu nome.', { type: 'error' });
                    setLoadingState(form, false);
                    return;
                }

                signUpWithEmail(email, password)
                    .then(userCredential => {
                        return updateUserProfile({ displayName: name });
                    })
                    .then(() => {
                        const firstName = name.split(' ')[0];
                        showToast(`Conta criada com sucesso, ${firstName}!`, { type: 'success' });
                        setTimeout(redirectToApp, 1000);
                    })
                    .catch(handleAuthError)
                    .finally(() => setLoadingState(form, false));
            });
        }
    });

    // Lógica para "Esqueci minha senha"
    const forgotPasswordLinks = document.querySelectorAll('.forgot-password-link');
    const modal = document.getElementById('forgot-password-modal');
    const closeModalBtn = modal.querySelector('.modal-close-btn');
    const modalOverlay = modal.querySelector('.modal-overlay');
    const forgotForm = document.getElementById('forgot-password-form');
    const recoveryEmailInput = document.getElementById('recovery-email-input');

    const openModal = () => {
        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('is-open'), 10);
    };

    const closeModal = () => {
        modal.classList.remove('is-open');
        modal.addEventListener('transitionend', () => {
            modal.style.display = 'none';
        }, { once: true });
    };

    forgotPasswordLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            openModal();
        });
    });

    closeModalBtn.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', closeModal);

    forgotForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = recoveryEmailInput.value;
        const button = forgotForm.querySelector('button[type="submit"]');
        const originalButtonText = button.textContent;
        
        button.disabled = true;
        button.textContent = 'Enviando...';
        
        sendPasswordResetEmail(email)
            .then(() => {
                closeModal();
                recoveryEmailInput.value = '';
                showToast("Link enviado! Verifique sua caixa de entrada.", { type: 'success', duration: 5000 });
            })
            .catch((error) => {
                if (error.code === 'auth/user-not-found') {
                    showToast('Nenhuma conta encontrada com este email.', { type: 'error' });
                } else {
                    showToast(`Erro: Verifique o email digitado.`, { type: 'error' });
                }
            })
            .finally(() => {
                button.disabled = false;
                button.textContent = originalButtonText;
            });
    });

    // --- LÓGICA PARA ALTERNAR ENTRE LOGIN/REGISTRO NO MOBILE ---
    const loginCard = document.getElementById('mobile-login-card');
    const registerCard = document.getElementById('mobile-register-card');
    const showRegisterLink = document.getElementById('show-register-link');
    const showLoginLink = document.getElementById('show-login-link');

    if (showRegisterLink) {
        showRegisterLink.addEventListener('click', (e) => {
            e.preventDefault();
            loginCard.style.display = 'none';
            registerCard.style.display = 'block';
        });
    }

    if (showLoginLink) {
        showLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            registerCard.style.display = 'none';
            loginCard.style.display = 'block';
        });
    }

    // --- LÓGICA PARA LOGIN COMO VISITANTE ---
    const desktopGuestLink = document.getElementById('desktop-guest-link');
    const mobileGuestLink = document.getElementById('mobile-guest-link');

    const handleGuestLogin = (e) => {
        e.preventDefault();
        e.stopPropagation();
        signInAnonymously()
            .then(() => {
                showToast('Bem-vindo(a) à cozinha!', { type: 'success' });
                setTimeout(redirectToApp, 1000);
            })
            .catch(handleAuthError);
    };

    if (desktopGuestLink) desktopGuestLink.addEventListener('click', handleGuestLogin);
    if (mobileGuestLink) mobileGuestLink.addEventListener('click', handleGuestLogin);
});