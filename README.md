# GameStore

**Sistema de e-commerce de jogos, consoles e acessórios**, desenvolvido como Projeto Integrador II do curso de Análise e Desenvolvimento de Sistemas do SENAC.

A GameStore reúne uma loja virtual para clientes e um painel administrativo para gerenciamento do catálogo, dos usuários e dos pedidos. O projeto demonstra o funcionamento de uma aplicação web com interface Angular, API REST em Spring Boot e persistência de dados.

## Funcionalidades

- Catálogo de produtos com jogos, consoles e acessórios
- Cadastro e login de clientes pessoas físicas, com validação matemática de CPF
- Carrinho de compras e finalização de pedidos demonstrativos
- Consulta do histórico de pedidos
- Painel administrativo para gerenciar produtos, usuários e pedidos
- CRUD de produtos: cadastrar, consultar, atualizar e excluir ou arquivar
- Controle de estoque e validação de CPF (e RG opcional em cadastros administrativos)

> **Projeto acadêmico:** os pagamentos são simulados. Não há cobrança real.

## Tecnologias

| Camada | Tecnologia |
| --- | --- |
| Front-end | Angular 19, TypeScript, HTML e CSS |
| Back-end | Java 21, Spring Boot 3.4.3 e API REST |
| Banco de dados | H2 com persistência local |
| Organização | Padrão MVC com camadas de serviço e repositório |

## Como executar localmente

**Pré-requisitos:** Java 21 ou compatível, Maven e Node.js com npm instalados.

1. Clone o repositório ou baixe o código pelo botão **Code > Download ZIP**:

   ```bash
   git clone https://github.com/kaique-rodrigues-silva/GameStore.git
   cd GameStore
   ```

2. Em um terminal, inicie o back-end:

   ```bash
   cd backend
   mvn spring-boot:run
   ```

3. Em outro terminal, a partir da pasta principal do projeto, inicie o front-end:

   ```bash
   cd frontend
   npm install
   npm start
   ```

4. Abra **http://localhost:4200** no navegador.

5. Navegue pelo catálogo. Para realizar pedidos, utilize o cadastro e login de cliente. O acesso administrativo é destinado aos responsáveis pelo projeto; **credenciais administrativas não são divulgadas neste repositório**.

O endereço `localhost` funciona apenas no computador em que o projeto estiver executando. A hospedagem pública é uma etapa separada.

## Publicar no Railway

O `Dockerfile` na raiz compila o Angular e o Spring Boot juntos: basta **um serviço**, com um único link HTTPS.

1. No Railway, escolha **GitHub Repository > GameStore > Add Variables**.
2. Defina as variáveis no serviço, sem colocá-las no GitHub:
   - `GAMESTORE_ADMIN_EMAIL`: e-mail escolhido para o administrador.
   - `GAMESTORE_ADMIN_PASSWORD`: senha nova e exclusiva (mínimo 12 caracteres).
   - `GAMESTORE_DATA_DIR`: `/data`.
3. No canvas do projeto, adicione um **Volume** vinculado ao serviço, com **Mount Path** `/data`.
4. Clique em **Deploy** e acompanhe os logs.
5. Em **Settings > Networking**, use **Generate Domain** para obter o endereço público.

O banco H2 é salvo no volume persistente. **Não reutilize as antigas credenciais demonstrativas**: elas já apareceram no histórico público do repositório. A conta de administrador só é criada se as variáveis privadas estiverem configuradas. No uso local com banco novo, configure as mesmas variáveis no terminal antes de iniciar o back-end.

Esta aplicação é somente uma demonstração acadêmica: não aceita pagamentos reais e não deve coletar documentos de pessoas reais em hospedagem pública.

## Organização do código

- `frontend/` — interface da loja e painel administrativo, desenvolvidos com Angular.
- `backend/` — controllers, modelos, regras de negócio, repositórios e configurações do Spring Boot.
- `backend/src/main/java/br/edu/senac/gamestore/Modelo.java` — entidades do sistema.
- `backend/src/main/java/br/edu/senac/gamestore/LojaController.java` e `AdminController.java` — endpoints e operações da API.
- `backend/src/main/java/br/edu/senac/gamestore/Repositorios.java` — acesso ao banco de dados.

## Observações

O banco H2 salva os dados em arquivos locais que não devem ser publicados no GitHub. A validação matemática do RG nesta implementação se aplica a São Paulo; para outros estados, há verificação de formato. Novos cadastros são exclusivos para pessoas físicas, com CPF. Dados de contas empresariais antigas, se existentes no banco, não são apagados automaticamente pela atualização. O projeto é destinado à demonstração acadêmica, não a operações comerciais reais.
