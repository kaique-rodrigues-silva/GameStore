# Explicação curta do projeto

## O que foi desenvolvido

Uma loja virtual fictícia de videogames. O cliente se cadastra, entra, escolhe produtos, monta carrinho e faz um pedido simulado. O administrador usa outro perfil para gerenciar os produtos, os usuários e consultar os pedidos.

## Arquitetura MVC

- **Model** — `backend/.../Modelo.java`: tabelas representadas por entidades Java (`Conta`, `Produto`, `Pedido`, `ItemPedido`, `Sessao`).
- **View** — `frontend/src/app/`: telas Angular. O `vitrine.component.ts` exibe os produtos; `carrinho.component.ts` realiza compra; `admin.component.ts` gerencia a loja.
- **Controller** — `backend/.../Autenticacao.java`, `LojaController.java`, `AdminController.java`: recebem e respondem requisições HTTP.
- **Service** — `CompraService` em `LojaController.java` e `Autenticacao` em `Autenticacao.java`: executam as regras de negócio (estoque, pedidos, login).
- **Repository** — `Repositorios.java`: integra as entidades ao banco H2 via Spring Data JPA.

## Principais demonstrações

1. **Login:** autenticação distingue admin e cliente; o back-end exige token e valida o perfil.
2. **CRUD:** admin cria, consulta, altera e exclui/arquiva produtos, cadastra e gerencia usuários.
3. **Banco H2:** cadastros permanecem ao reiniciar.
4. **Vendas:** o servidor calcula o preço, verifica estoque, registra itens e retira a quantidade em transação.
5. **Documentos:** CPF e CNPJ com DV, IE segundo UF, RG paulista com DV; demais UFs de RG limitadas a formato.
6. **Orientação a objetos:** classes representam objetos e se relacionam por identificadores.

## Fluxo para explicar em 20 segundos

"O usuário realiza a compra na interface Angular. O Angular envia a requisição REST para o controller no Spring Boot, que verifica a sessão do cliente e chama o serviço de compras. O serviço confere o estoque, calcula o valor e grava o pedido e seus itens usando os repositories no H2. Em seguida, a interface mostra a confirmação e o pedido aparece no histórico."

## Não esqueça

**Pagamento é simulado**, não cobre dinheiro. Senha padrão só para teste local. Para cumprir literalmente a frase sobre contas pré-cadastradas pelo admin, mostre a tela administrativa de criação de usuários e confirme o autocadastro com o professor.
