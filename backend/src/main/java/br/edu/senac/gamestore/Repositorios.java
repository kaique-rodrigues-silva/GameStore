package br.edu.senac.gamestore;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

/* REPOSITORY: acesso ao H2. */
interface ContaRepo extends JpaRepository<Conta,Long> {
    Optional<Conta> findByEmailIgnoreCase(String email);
    boolean existsByCpf(String cpf);
    boolean existsByCnpj(String cnpj);
}
interface ProdutoRepo extends JpaRepository<Produto,Long> {
    List<Produto> findByAtivoTrueOrderByIdAsc();
}
interface PedidoRepo extends JpaRepository<Pedido,Long> {
    List<Pedido> findByContaIdOrderByIdDesc(Long contaId);
    boolean existsByContaId(Long contaId);
}
interface ItemPedidoRepo extends JpaRepository<ItemPedido,Long> {
    List<ItemPedido> findByPedidoId(Long pedidoId);
    boolean existsByProdutoId(Long produtoId);
}
interface SessaoRepo extends JpaRepository<Sessao,String> { }

interface FavoritoRepo extends JpaRepository<Favorito,Long> {
    List<Favorito> findByContaIdOrderByIdDesc(Long contaId);
    Optional<Favorito> findByContaIdAndProdutoId(Long contaId,Long produtoId);
    void deleteByContaId(Long contaId);
    void deleteByProdutoId(Long produtoId);
}
