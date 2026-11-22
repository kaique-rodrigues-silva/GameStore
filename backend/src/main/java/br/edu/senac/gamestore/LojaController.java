package br.edu.senac.gamestore;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

/* CONTROLLER: operações que o cliente realiza na loja. */
@RestController
@RequestMapping("/api/loja")
class LojaController {
    private final ProdutoRepo produtos;
    private final Autenticacao auth;
    private final CompraService compras;
    private final FavoritoRepo favoritos;
    LojaController(ProdutoRepo produtos,Autenticacao auth,CompraService compras,FavoritoRepo favoritos){
        this.produtos=produtos;this.auth=auth;this.compras=compras;this.favoritos=favoritos;
    }
    @GetMapping("/produtos")
    public List<Produto> produtos(){return produtos.findByAtivoTrueOrderByIdAsc();}
    @GetMapping("/favoritos")
    public List<Long> favoritos(@RequestHeader(value="Authorization",required=false) String token){
        Long contaId=auth.cliente(token).id;
        return favoritos.findByContaIdOrderByIdDesc(contaId).stream().map(f->f.produtoId)
            .filter(id->produtos.findById(id).map(p->p.ativo).orElse(false)).toList();
    }
    @PostMapping("/favoritos/{produtoId}")
    @Transactional
    public Map<String,String> favoritar(@RequestHeader(value="Authorization",required=false) String token,@PathVariable Long produtoId){
        Long contaId=auth.cliente(token).id;
        Produto produto=produtos.findById(produtoId).orElseThrow(
            ()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Produto não encontrado"));
        if(!produto.ativo)throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Produto indisponível");
        if(favoritos.findByContaIdAndProdutoId(contaId,produtoId).isEmpty()){
            Favorito f=new Favorito();f.contaId=contaId;f.produtoId=produtoId;favoritos.save(f);
        }
        return Map.of("mensagem","Produto favoritado");
    }
    @DeleteMapping("/favoritos/{produtoId}")
    @Transactional
    public Map<String,String> desfavoritar(@RequestHeader(value="Authorization",required=false) String token,@PathVariable Long produtoId){
        Long contaId=auth.cliente(token).id;
        favoritos.findByContaIdAndProdutoId(contaId,produtoId).ifPresent(favoritos::delete);
        return Map.of("mensagem","Favorito removido");
    }
    @PostMapping("/comprar")
    public Map<String,Object> comprar(@RequestHeader(value="Authorization",required=false) String token,
                                     @RequestBody CompraService.NovoPedido pedido) {
        return compras.comprar(auth.cliente(token),pedido);
    }
    @GetMapping("/meus-pedidos")
    public List<Map<String,Object>> pedidos(@RequestHeader(value="Authorization",required=false) String token){
        return compras.pedidos(auth.cliente(token).id);
    }
}

/* SERVICE: regra de compra, validação de estoque e gravação dos itens. */
@Service
class CompraService {
    record Item(Long produtoId,Integer quantidade) { }
    record NovoPedido(List<Item> itens,String pagamento,String endereco) { }
    private final ProdutoRepo produtos;
    private final PedidoRepo pedidos;
    private final ItemPedidoRepo itens;
    CompraService(ProdutoRepo produtos,PedidoRepo pedidos,ItemPedidoRepo itens){this.produtos=produtos;this.pedidos=pedidos;this.itens=itens;}
    private static final Set<String> PAGAMENTOS=Set.of("PIX","DINHEIRO","CREDITO","DEBITO");
    @Transactional
    public Map<String,Object> comprar(Conta cliente,NovoPedido solicitacao){
        if(solicitacao==null || solicitacao.itens()==null || solicitacao.itens().isEmpty())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Carrinho vazio");
        if(solicitacao.pagamento()==null || !PAGAMENTOS.contains(solicitacao.pagamento()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Forma de pagamento inválida");
        if(solicitacao.endereco()==null || solicitacao.endereco().isBlank() || solicitacao.endereco().length()>1500)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Informe o endereço de entrega");
        // Agrupa produtos repetidos antes de conferir o estoque.
        Map<Long,Integer> quantidades=new LinkedHashMap<>();
        for(Item item:solicitacao.itens()){
            if(item==null || item.produtoId()==null || item.quantidade()==null || item.quantidade()<1 || item.quantidade()>100)
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Quantidade inválida");
            quantidades.merge(item.produtoId(),item.quantidade(),Integer::sum);
        }
        Map<Produto,Integer> selecionados=new LinkedHashMap<>();
        BigDecimal total=BigDecimal.ZERO;
        for(var entrada:quantidades.entrySet()){
            Produto p=produtos.findById(entrada.getKey()).orElseThrow(()->new ResponseStatusException(HttpStatus.BAD_REQUEST,"Produto não encontrado"));
            if(!p.ativo || entrada.getValue()>p.estoque)
                throw new ResponseStatusException(HttpStatus.CONFLICT,"Estoque insuficiente para: "+p.nome);
            selecionados.put(p,entrada.getValue());
            total=total.add(p.preco.multiply(BigDecimal.valueOf(entrada.getValue())));
        }
        Pedido pedido=new Pedido();pedido.contaId=cliente.id;pedido.pagamento=solicitacao.pagamento();
        pedido.endereco=solicitacao.endereco().trim();pedido.total=total;pedidos.save(pedido);
        for(var entry:selecionados.entrySet()){
            Produto p=entry.getKey();int qtd=entry.getValue();p.estoque-=qtd;produtos.save(p);
            ItemPedido ip=new ItemPedido();ip.pedidoId=pedido.id;ip.produtoId=p.id;ip.nome=p.nome;
            ip.preco=p.preco;ip.quantidade=qtd;itens.save(ip);
        }
        return Map.of("pedidoId",pedido.id,"total",total,"pagamento",pedido.pagamento,"mensagem","Pedido de demonstração confirmado");
    }
    @Transactional(readOnly=true)
    public List<Map<String,Object>> pedidos(Long contaId){
        return pedidos.findByContaIdOrderByIdDesc(contaId).stream().map(this::resumo).collect(Collectors.toList());
    }
    @Transactional(readOnly=true)
    public List<Map<String,Object>> todos(){return pedidos.findAll().stream().sorted((a,b)->b.id.compareTo(a.id)).map(this::resumo).toList();}
    private Map<String,Object> resumo(Pedido p){
        List<Map<String,Object>> linhas=itens.findByPedidoId(p.id).stream().map(i->Map.<String,Object>of(
            "nome",i.nome,"quantidade",i.quantidade,"preco",i.preco)).toList();
        return Map.of("id",p.id,"clienteId",p.contaId,"data",p.data.toString(),"pagamento",p.pagamento,
            "endereco",p.endereco,"total",p.total,"itens",linhas);
    }
}
