package br.edu.senac.gamestore;

import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

/* CONTROLLER: rotas administrativas, cada uma exige perfil ADMIN. */
@RestController
@RequestMapping("/api/admin")
class AdminController {
    private final Autenticacao auth;
    private final ContaRepo contas;
    private final ProdutoRepo produtos;
    private final CompraService compras;
    private final PedidoRepo pedidos;
    private final ItemPedidoRepo itens;
    private final FavoritoRepo favoritos;
    AdminController(Autenticacao auth,ContaRepo contas,ProdutoRepo produtos,CompraService compras,
                    PedidoRepo pedidos,ItemPedidoRepo itens,FavoritoRepo favoritos){
        this.auth=auth;this.contas=contas;this.produtos=produtos;this.compras=compras;this.pedidos=pedidos;this.itens=itens;this.favoritos=favoritos;
    }
    private void admin(String header){auth.admin(header);}
    @GetMapping("/resumo")
    public Map<String,Object> resumo(@RequestHeader(value="Authorization",required=false) String token){
        admin(token);
        BigDecimal faturamento=pedidos.findAll().stream().map(p->p.total).reduce(BigDecimal.ZERO,BigDecimal::add);
        return Map.of("produtos",produtos.findByAtivoTrueAndExcluidoFalseOrderByIdAsc().size(),"clientes",contas.findAll().stream().filter(c->"CLIENTE".equals(c.perfil)&&c.ativo).count(),
            "pedidos",pedidos.count(),"faturamento",faturamento);
    }
    @GetMapping("/produtos")
    public List<Produto> listarProdutos(@RequestHeader(value="Authorization",required=false) String token){admin(token);return produtos.findByExcluidoFalseOrderByIdAsc();}
    record DadosProduto(String nome,String categoria,String plataforma,String condicao,String descricao,String imagem,BigDecimal preco,Integer estoque) { }
    private void atualizarProduto(Produto p,DadosProduto d){
        if(d==null||d.nome()==null||d.nome().isBlank()||d.preco()==null||d.preco().signum()<0||d.estoque()==null||d.estoque()<0)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Informe nome, preço e estoque válidos");
        p.nome=d.nome().trim();p.categoria=d.categoria()==null?"JOGO":d.categoria();
        p.plataforma=d.plataforma()==null?"":d.plataforma();p.condicao=d.condicao()==null?"NOVO":d.condicao();
        p.descricao=d.descricao();p.imagem=d.imagem();p.preco=d.preco();p.estoque=d.estoque();
    }
    @PostMapping("/produtos")
    public Produto criarProduto(@RequestHeader(value="Authorization",required=false) String token,@RequestBody DadosProduto d){
        admin(token);Produto p=new Produto();atualizarProduto(p,d);return produtos.save(p);
    }
    @PutMapping("/produtos/{id}")
    public Produto alterarProduto(@RequestHeader(value="Authorization",required=false) String token,@PathVariable Long id,@RequestBody DadosProduto d){
        admin(token);Produto p=produtos.findById(id).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Produto não encontrado"));
        if(p.excluido)throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Produto não encontrado");
        atualizarProduto(p,d);return produtos.save(p);
    }
    @PutMapping("/produtos/{id}/situacao")
    @Transactional
    public Map<String,String> situacaoProduto(@RequestHeader(value="Authorization",required=false) String token,
                                                @PathVariable Long id,@RequestBody SituacaoProduto dados){
        admin(token);
        Produto produto=produtos.findById(id).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Produto não encontrado"));
        if(produto.excluido)throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Produto não encontrado");
        if(dados==null || dados.ativo()==null)throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Informe a situação do produto");
        produto.ativo=dados.ativo();produtos.save(produto);
        return Map.of("mensagem",produto.ativo?"Produto reativado":"Produto arquivado");
    }
    record SituacaoProduto(Boolean ativo) { }

    @DeleteMapping("/produtos/{id}")
    @Transactional
    public Map<String,String> excluirProduto(@RequestHeader(value="Authorization",required=false) String token,@PathVariable Long id){
        admin(token);
        Produto p=produtos.findById(id).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Produto não encontrado"));
        if(p.excluido)throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Produto não encontrado");
        // Se houve vendas, preserva o registro internamente para que pedidos anteriores continuem íntegros.
        // Produtos nunca vendidos podem ser eliminados fisicamente do banco.
        favoritos.deleteByProdutoId(id);
        if(itens.existsByProdutoId(id)){
            p.ativo=false;
            p.excluido=true;
            produtos.save(p);
            return Map.of("mensagem","Produto excluído da administração e loja; histórico de pedidos preservado");
        }
        produtos.delete(p);
        return Map.of("mensagem","Produto excluído definitivamente");
    }
    @GetMapping("/usuarios")
    public List<Map<String,Object>> usuarios(@RequestHeader(value="Authorization",required=false) String token){
        admin(token);return contas.findAll().stream().map(this::usuario).toList();
    }
    private Map<String,Object> usuario(Conta c){
        Map<String,Object> m=new LinkedHashMap<>();m.put("id",c.id);m.put("nome",c.nome);m.put("email",c.email);
        m.put("perfil",c.perfil);m.put("tipo",c.tipo);m.put("ativo",c.ativo);m.put("cpf",c.cpf);m.put("cnpj",c.cnpj);
        m.put("rg",c.rg);m.put("ie",c.ie);m.put("rgUf",c.rgUf);m.put("ieUf",c.ieUf);return m;
    }
    record DadosUsuario(String nome,String email,String senha,String perfil,String tipo,String cpf,String cnpj,String rg,String rgUf,String ie,String ieUf) { }
    @PostMapping("/usuarios")
    public Map<String,Object> criarUsuario(@RequestHeader(value="Authorization",required=false) String token,@RequestBody DadosUsuario d){
        admin(token);
        if(d==null||d.nome()==null||d.nome().isBlank()||d.email()==null||!d.email().matches("(?i)^[^@ ]+@[^@ ]+\\.[^@ ]+$"))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Nome ou e-mail inválidos");
        String email=d.email().trim().toLowerCase(Locale.ROOT);
        if(contas.findByEmailIgnoreCase(email).isPresent())throw new ResponseStatusException(HttpStatus.CONFLICT,"E-mail já cadastrado");
        Conta c=new Conta();c.nome=d.nome().trim();c.email=email;c.senhaHash=auth.hash(d.senha());
        c.perfil="ADMIN".equals(d.perfil())?"ADMIN":"CLIENTE";
        c.tipo="PJ".equals(d.tipo())?"PJ":"PF";
        if("PJ".equals(c.tipo)) {
            if(!Documentos.cnpj(d.cnpj()))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"CNPJ inválido");
            c.cnpj=Documentos.alfanumerico(d.cnpj());
            if(contas.existsByCnpj(c.cnpj))throw new ResponseStatusException(HttpStatus.CONFLICT,"CNPJ já cadastrado");
            if(d.ie()!=null&&!d.ie().isBlank()){
                if(!Documentos.ie(d.ie(),d.ieUf()))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"IE inválida para UF");
                c.ie=Documentos.alfanumerico(d.ie());c.ieUf=d.ieUf().toUpperCase(Locale.ROOT);
            }
        } else {
            if(!Documentos.cpf(d.cpf()))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"CPF inválido");
            c.cpf=Documentos.numeros(d.cpf());
            if(contas.existsByCpf(c.cpf))throw new ResponseStatusException(HttpStatus.CONFLICT,"CPF já cadastrado");
            if(d.rg()!=null&&!d.rg().isBlank()){
                if(!Documentos.rg(d.rg(),d.rgUf()))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"RG inválido para UF");
                c.rg=Documentos.alfanumerico(d.rg());c.rgUf=d.rgUf().toUpperCase(Locale.ROOT);
            }
        }
        return usuario(contas.save(c));
    }
    record AlterarUsuario(String nome,Boolean ativo) { }
    @PutMapping("/usuarios/{id}")
    public Map<String,Object> atualizarUsuario(@RequestHeader(value="Authorization",required=false) String token,@PathVariable Long id,@RequestBody AlterarUsuario d){
        Conta administrador=auth.admin(token);
        Conta c=contas.findById(id).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Conta não encontrada"));
        if(d.nome()!=null&&!d.nome().isBlank())c.nome=d.nome().trim();
        if(d.ativo()!=null){
            if(administrador.id.equals(id)&&!d.ativo())throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Você não pode bloquear sua própria conta");
            c.ativo=d.ativo();
        }
        return usuario(contas.save(c));
    }
    @DeleteMapping("/usuarios/{id}") @Transactional
    public Map<String,String> excluirUsuario(@RequestHeader(value="Authorization",required=false) String token,@PathVariable Long id){
        Conta adm=auth.admin(token);
        if(adm.id.equals(id))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Não exclua sua própria conta");
        Conta c=contas.findById(id).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Conta não encontrada"));
        c.ativo=false;contas.save(c); // Conta é arquivada para preservar vínculo com pedidos e evitar reutilização de documento
        return Map.of("mensagem","Conta desativada para preservar o histórico");
    }
    @GetMapping("/pedidos")
    public List<Map<String,Object>> listarPedidos(@RequestHeader(value="Authorization",required=false) String token){
        admin(token);return compras.todos();
    }
    /* Operação excepcional do ambiente de demonstração: somente pedido #2. */
    @DeleteMapping("/pedidos/2")
    @Transactional
    public Map<String,String> excluirPedidoDois(@RequestHeader(value="Authorization",required=false) String token) {
        admin(token);
        Pedido pedido=pedidos.findById(2L).orElseThrow(
            ()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Pedido #2 não encontrado")
        );
        List<ItemPedido> linhas=itens.findByPedidoId(pedido.id);
        // Verifique todos os produtos antes de modificar qualquer registro.
        Map<Produto,Integer> reposicao=new LinkedHashMap<>();
        for(ItemPedido item:linhas){
            Produto produto=produtos.findById(item.produtoId).orElseThrow(
                ()->new ResponseStatusException(HttpStatus.CONFLICT,
                    "Produto do pedido não existe mais; nenhuma alteração realizada")
            );
            reposicao.merge(produto,item.quantidade,Integer::sum);
        }
        for(var entrada:reposicao.entrySet()){
            Produto produto=entrada.getKey();
            produto.estoque=Math.addExact(produto.estoque,entrada.getValue());
            produtos.save(produto);
        }
        itens.deleteAll(linhas);
        pedidos.delete(pedido);
        return Map.of("mensagem","Pedido #2 excluído e produtos devolvidos ao estoque");
    }
}
