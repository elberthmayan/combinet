
# Combinet - Sua Geladeira Inteligente 🍳

Combinet é uma aplicação web moderna e interativa, projetada para ser seu assistente de cozinha pessoal. Com ele, você pode descobrir novas receitas com base nos ingredientes que já tem, gerenciar sua despensa, salvar pratos favoritos e compartilhar suas criações culinárias com uma comunidade vibrante.

O projeto foi desenvolvido com foco em uma experiência de usuário fluida e um design elegante, utilizando tecnologias modernas como Firebase para backend e a API do Google Gemini para geração inteligente de receitas.



---

## 🚀 Principais Funcionalidades

- **Mestre Cuca (Gerador de Receitas com IA)**: Cria receitas personalizadas a partir de ingredientes fornecidos pelo usuário. Permite refinar a busca por tipo de prato, dificuldade e estilo culinário (ex: vegano, light).  
- **Despensa Inteligente**: Adicione, edite, remova e categorize os ingredientes que você tem em casa com auxílio da IA.  
- **Comunidade Social**: Compartilhe fotos e detalhes de pratos, com sistema de comentários e avaliações.  
- **Favoritos**: Salve receitas geradas pela IA ou da comunidade em um "livro de receitas" digital.  
- **Perfil de Usuário e Conquistas**: Gerencie dados, foto de perfil, senha e acompanhe seu progresso.  
- **Autenticação Completa**: Login com E-mail/Senha, Google ou como visitante anônimo.  
- **Design Responsivo e Moderno**: Interface adaptada para desktops e dispositivos móveis, com tema claro e escuro.  

---

## 🛠️ Tecnologias Utilizadas

### Frontend
- HTML5, CSS3 e JavaScript (ES6 Modules)  
- Cropper.js: Recorte e ajuste de imagens de perfil  
- html2canvas & jsPDF: Gerar fichas de receita em PDF  

### Backend & Infraestrutura
- **Firebase**:
  - Authentication: Gerenciamento de usuários  
  - Firestore: Banco de dados NoSQL  
  - Cloud Storage: Armazenamento de fotos  
  - Hosting: Hospedagem da aplicação  

### Inteligência Artificial
- **Google Gemini API**: Geração dinâmica de receitas e categorização de ingredientes  

---

## ⚙️ Configuração do Projeto

### Pré-requisitos
- Node.js instalado  
- Conta no Firebase  
- Chave de API do Google AI Studio para o Gemini  

### Passo 1: Clonar o Repositório
```bash
git clone https://github.com/seu-usuario/combinet.git
cd combinet
```

### Passo 2: Configurar o Firebase
1. Crie um projeto no [Firebase Console](https://console.firebase.google.com/).  
2. Adicione um aplicativo web e copie a configuração fornecida.  
3. Abra `front/js/firebase-config.js` e cole sua configuração:
```javascript
const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "SEU_AUTH_DOMAIN",
  projectId: "SEU_PROJECT_ID",
  storageBucket: "SEU_STORAGE_BUCKET",
  messagingSenderId: "SEU_MESSAGING_SENDER_ID",
  appId: "SEU_APP_ID"
};
```
4. No Firebase, habilite:
   - **Authentication**: Provedores E-mail/Senha e Google  
   - **Firestore Database**: Crie em modo de produção  
   - **Storage**: Ative o Cloud Storage  

### Passo 3: Configurar a API do Gemini
1. Acesse o [Google AI Studio](https://ai.google.com/studio) e crie sua chave de API.  
2. Abra `front/js/gemini-api.js` e substitua o placeholder:
```javascript
const GEMINI_API_KEY = "SUA_CHAVE_DA_API_GEMINI";
```

### Passo 4: Rodar Localmente
```bash
cd front
# Com Python 3
python -m http.server
```
Abra o navegador em: [http://localhost:8000](http://localhost:8000)  

---

## 📂 Estrutura de Arquivos
```
combinet/
├── front/
│   ├── css/              # Arquivos de estilo (CSS)
│   ├── img/              # Imagens estáticas da UI
│   ├── js/
│   │   ├── data/         # Dados mock (ex: receitas)
│   │   ├── pages/        # Lógica de cada página (perfil, social, etc.)
│   │   ├── ui/           # Componentes de UI reutilizáveis
│   │   ├── utils/        # Funções utilitárias (API, auth, etc.)
│   │   ├── app.js        # Ponto de entrada principal
│   │   └── login.js      # Lógica da página de login
│   ├── app.html          # HTML da aplicação principal
│   └── index.html        # Página de login
├── .firebaserc           # Configuração de deploy do Firebase
├── .gitignore            # Arquivos ignorados pelo Git
└── firebase.json         # Configurações do Firebase Hosting
```
