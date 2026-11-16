# GameStore — Projeto Integrador 

## O que está incluso

- **Angular 19**: loja, catálogo, carrinho, formulário de cadastro e login, histórico de pedidos, painel administrativo.
- **Spring Boot 3.4.3 + Java 21 (compatível com o Java 25 instalado no PC)**: API REST com controllers, regras de negócio e repositórios JPA.
- **H2 em arquivo**: `backend/dados/gamestore.mv.db` (criado na primeira execução).
- **Autenticação**: tokens aleatórios salvos no H2 por 24 horas; senhas protegidas com BCrypt. Não há filtro personalizado nem JWT.
- **Perfis**: CLIENTE e ADMIN.
- **CRUD**: produtos podem ser criados, consultados, alterados e excluídos se não tiverem pedidos; com histórico, são arquivados. Contas são cadastradas, listadas, editadas e desativadas.
- **Documentos**: CPF e CNPJ com verificação matemática (inclusive CNPJ alfanumérico); IE por UF pela biblioteca Stella; RG de SP com DV e outros RGs por formato somente (limitação descrita).
- **Checkout demonstrativo**: Pix, cartão de crédito/débito ou dinheiro, sem transação financeira real. Reduz estoque e preserva histórico.

### 1. Abra a pasta no VS Code

Extraia o ZIP em **pasta nova** e abra `GameStore_Limpa` no VS Code. Não misture com GameStore_2_1.

### 2. Abra dois terminais CMD

**Terminal A:**

```cmd
cd backend
mvn clean test
mvn spring-boot:run
```

**Terminal B:**

```cmd
cd frontend
npm install
npm start
```

No navegador: http://localhost:4200

Os arquivos `.bat` na raiz também podem iniciar cada servidor.

### 3. Entre como administrador

- E-mail: `admin@gamestore.local`
- Senha: `GameStore@2026`

Para **testar compras imediatamente, sem precisar preencher CPF**, use a conta de cliente de demonstração:

- E-mail: `cliente@gamestore.local`
- Senha: `Cliente@2026`

As duas contas são geradas no primeiro início de um banco vazio. Os documentos de demonstração são apenas exemplos acadêmicos e não comprovam identidade.

Esses dados são exclusivamente de demonstração **local**. Não publique a aplicação com essas senhas.

### 4. Demonstração curta

1. Veja a vitrine e adicione um produto ao carrinho.
2. Crie uma conta de cliente com um CPF **de teste com dígito matematicamente válido** (não é prova de identidade); o sistema entra automaticamente depois do cadastro.
3. Abra o carrinho e preencha um endereço de entrega fictício. Escolha Pix e confirme o pedido demonstrativo.
4. Abra **Meus pedidos**.
5. Saia, entre como admin, abra o painel, confira o pedido e o estoque.
6. Demonstre cadastrar e editar um produto. Demonstre CPF/CNPJ inválidos sendo rejeitados.

**Atenção**: esta nova versão é independente e começa com banco novo. Seu banco antigo permanece intacto se você não apagar a pasta da versão 2.1. Não há migração automática.

## Requisitos e limites

O professor escreveu que os usuários devem ser cadastrados previamente pelo administrador. Aqui há a **tela administrativa de cadastro**, porém também há autocadastro do cliente (escolha feita para o e-commerce). Antes de apresentar como conformidade total, confirme essa interpretação com o professor ou use o cadastro administrativo na demonstração.

O RG antigo não possui validação nacional única: apenas SP tem dígito conferido matematicamente nesta versão; nas demais UFs o formato é verificado. A IE usa validação por UF.

O pagamento é apenas demonstrativo. A aplicação destina-se a uso acadêmico local e não está preparada para transações financeiras reais em produção.

## O que testar no seu computador

O projeto foi conferido por análise de sintaxe, mas **não foi compilado nem executado integralmente neste ambiente** porque Maven e dependências Angular não estão instalados aqui. O teste automatizado `FluxoDaLojaTest` foi escrito para validar o fluxo via HTTP quando você rodar `mvn clean test`.

Se aparecer falha, envie **o primeiro erro** do terminal. Não execute `npm audit fix --force` sem revisar.

Veja `docs/GUIA-PARA-APRESENTAR.md`.
