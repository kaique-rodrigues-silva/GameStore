package br.edu.senac.gamestore;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.Instant;

/* MODEL: entidades persistidas pelo JPA. Todas têm construtor sem argumentos. */
@Entity @Table(name="contas")
class Conta {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) public Long id;
    @Column(nullable=false) public String nome;
    @Column(nullable=false, unique=true) public String email;
    @Column(nullable=false) public String senhaHash;
    @Column(nullable=false) public String perfil = "CLIENTE";
    @Column(nullable=false) public String tipo = "PF";
    @Column(unique=true) public String cpf;
    public String rg; public String rgUf;
    @Column(unique=true) public String cnpj;
    public String ie; public String ieUf;
    public String telefone; public String cep; public String logradouro; public String numero;
    public String complemento; public String bairro; public String cidade; public String uf;
    @Column(nullable=false) public boolean ativo = true;
}
@Entity @Table(name="produtos")
class Produto {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) public Long id;
    @Column(nullable=false) public String nome;
    public String categoria; public String plataforma; public String condicao;
    @Column(length=2000) public String descricao;
    @Lob @Column(columnDefinition="CLOB") public String imagem;
    @Column(nullable=false, precision=12, scale=2) public BigDecimal preco;
    // Preço promocional opcional; vazio significa que não há oferta.
    @Column(precision=12, scale=2) public BigDecimal precoPromocional;
    @Transient public BigDecimal getPrecoEfetivo(){
        return precoPromocional!=null && precoPromocional.signum()>=0 && precoPromocional.compareTo(preco)<0
            ? precoPromocional:preco;
    }
    @Column(nullable=false) public int estoque;
    @Column(nullable=false) public boolean ativo = true;
    // Excluídos ficam ocultos do catálogo e da administração; pedidos antigos preservam seu histórico.
    @Column(columnDefinition="BOOLEAN DEFAULT FALSE") public boolean excluido = false;
}
@Entity @Table(name="pedidos")
class Pedido {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) public Long id;
    @Column(nullable=false) public Long contaId;
    @Column(nullable=false) public LocalDateTime data = LocalDateTime.now();
    @Column(nullable=false) public String pagamento;
    @Column(nullable=false, length=1500) public String endereco;
    @Column(nullable=false, precision=12, scale=2) public BigDecimal total;
}
@Entity @Table(name="itens_pedido")
class ItemPedido {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) public Long id;
    @Column(nullable=false) public Long pedidoId;
    @Column(nullable=false) public Long produtoId;
    @Column(nullable=false) public String nome;
    @Column(nullable=false) public int quantidade;
    @Column(nullable=false, precision=12, scale=2) public BigDecimal preco;
}
@Entity @Table(name="sessoes")
class Sessao {
    @Id @Column(length=90) public String token;
    @Column(nullable=false) public Long contaId;
    @Column(nullable=false) public Instant expiraEm;
}

/* Favoritos vinculados à conta: persistidos no H2. */
@Entity @Table(name="favoritos", uniqueConstraints=@UniqueConstraint(columnNames={"conta_id","produto_id"}))
class Favorito {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) public Long id;
    @Column(name="conta_id",nullable=false) public Long contaId;
    @Column(name="produto_id",nullable=false) public Long produtoId;
}
