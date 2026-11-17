package br.edu.senac.gamestore;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import java.util.UUID;
import java.util.Locale;

/* SERVICE: sessões persistidas no H2, sem filtro especial ou token JWT. */
@Service
class Autenticacao {
    private final ContaRepo contas;
    private final SessaoRepo sessoes;
    private final PedidoRepo pedidos;
    private final ItemPedidoRepo itens;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
    Autenticacao(ContaRepo contas,SessaoRepo sessoes,PedidoRepo pedidos,ItemPedidoRepo itens) {
        this.contas=contas;this.sessoes=sessoes;this.pedidos=pedidos;this.itens=itens;
    }

    public String hash(String senha) {
        if(senha==null || senha.length()<8)throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Senha deve ter pelo menos oito caracteres");
        return encoder.encode(senha);
    }
    public Conta atual(String authorization) {
        if(authorization==null || !authorization.startsWith("Bearer "))
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,"Entre na conta para continuar");
        String token=authorization.substring(7).trim();
        Sessao sessao=sessoes.findById(token).orElseThrow(()->new ResponseStatusException(HttpStatus.UNAUTHORIZED,"Sessão inválida"));
        if(sessao.expiraEm.isBefore(Instant.now())) {
            sessoes.deleteById(token);
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,"Sessão expirada");
        }
        Conta c=contas.findById(sessao.contaId).orElseThrow(()->new ResponseStatusException(HttpStatus.UNAUTHORIZED,"Conta não encontrada"));
        if(!c.ativo)throw new ResponseStatusException(HttpStatus.FORBIDDEN,"Conta desativada");
        return c;
    }
    public Conta admin(String authorization) {
        Conta c=atual(authorization);
        if(!"ADMIN".equals(c.perfil))throw new ResponseStatusException(HttpStatus.FORBIDDEN,"Apenas administradores");
        return c;
    }
    public Conta cliente(String authorization) {
        Conta c=atual(authorization);
        if(!"CLIENTE".equals(c.perfil))throw new ResponseStatusException(HttpStatus.FORBIDDEN,"Entre como cliente para comprar");
        return c;
    }
    public Map<String,Object> perfil(Conta c) {
        return Map.of("id",c.id,"nome",c.nome,"email",c.email,"perfil",c.perfil,"tipo",c.tipo);
    }
    @Transactional
    public Map<String,Object> login(String email,String senha) {
        Conta c=contas.findByEmailIgnoreCase(email==null?"":email.trim())
            .orElseThrow(()->new ResponseStatusException(HttpStatus.UNAUTHORIZED,"E-mail ou senha incorretos"));
        if(!c.ativo || senha==null || !encoder.matches(senha,c.senhaHash))
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,"E-mail ou senha incorretos");
        Sessao s=new Sessao();s.token=UUID.randomUUID().toString()+"-"+UUID.randomUUID();s.contaId=c.id;
        s.expiraEm=Instant.now().plus(24,ChronoUnit.HOURS);sessoes.save(s);
        return Map.of("token",s.token,"conta",perfil(c));
    }
    @Transactional
    public Conta registrar(String nome,String email,String senha,String tipo,String cpf,String cnpj,String ie,String ieUf) {
        if(nome==null || nome.isBlank() || email==null || !email.matches("(?i)^[^@ ]+@[^@ ]+\\.[^@ ]+$"))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Nome ou e-mail inválidos");
        String perfilTipo=tipo==null || tipo.isBlank()?"PF":tipo.trim().toUpperCase(Locale.ROOT);
        if(!"PF".equals(perfilTipo) && !"PJ".equals(perfilTipo))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Tipo de cadastro inválido");
        String e=email.trim().toLowerCase(Locale.ROOT);
        if(contas.findByEmailIgnoreCase(e).isPresent())
            throw new ResponseStatusException(HttpStatus.CONFLICT,"E-mail já cadastrado");
        Conta conta=new Conta();conta.nome=nome.trim();conta.email=e;conta.senhaHash=hash(senha);
        conta.tipo=perfilTipo;conta.perfil="CLIENTE";
        if("PJ".equals(perfilTipo)){
            if(!Documentos.cnpj(cnpj))
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"CNPJ inválido");
            String documento=Documentos.alfanumerico(cnpj);
            if(contas.existsByCnpj(documento))
                throw new ResponseStatusException(HttpStatus.CONFLICT,"CNPJ já cadastrado");
            conta.cnpj=documento;
            if(ie!=null && !ie.isBlank()){
                if(!Documentos.ie(ie,ieUf))
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Inscrição estadual inválida para a UF");
                conta.ie=Documentos.alfanumerico(ie);
                conta.ieUf=ieUf.toUpperCase(Locale.ROOT);
            }
        }else{
            if(!Documentos.cpf(cpf))
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"CPF inválido");
            String documento=Documentos.numeros(cpf);
            if(contas.existsByCpf(documento))
                throw new ResponseStatusException(HttpStatus.CONFLICT,"CPF já cadastrado");
            conta.cpf=documento;
        }
        return contas.save(conta);
    }
    /* Exclusão irreversível da conta autenticada, incluindo pedidos e sessões. */
    @Transactional
    public void excluirMinhaConta(String header,String senha,String confirmacao) {
        Conta conta=cliente(header);
        if(!"EXCLUIR MINHA CONTA".equals(confirmacao))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Confirmação incorreta");
        if(senha==null || !encoder.matches(senha,conta.senhaHash))
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,"Senha incorreta");
        for(Pedido pedido:pedidos.findByContaIdOrderByIdDesc(conta.id)) {
            itens.deleteAll(itens.findByPedidoId(pedido.id));
            pedidos.delete(pedido);
        }
        for(Sessao sessao:sessoes.findAll()) {
            if(conta.id.equals(sessao.contaId))sessoes.delete(sessao);
        }
        contas.delete(conta);
    }

    @Transactional
    public void sair(String header) {
        if(header!=null && header.startsWith("Bearer ")) sessoes.deleteById(header.substring(7).trim());
    }
}

/* CONTROLLER: autenticação e criação de conta pública. */
@RestController
@RequestMapping("/api/auth")
class AuthController {
    private final Autenticacao auth;
    AuthController(Autenticacao auth){this.auth=auth;}
    record Credenciais(String email,String senha) { }
    record Cadastro(String nome,String email,String senha,String tipo,String cpf,String cnpj,String ie,String ieUf) { }
    @PostMapping("/registro")
    public Map<String,Object> registro(@RequestBody Cadastro dados) {
        if(dados==null)throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Informe os dados de cadastro");
        Conta c=auth.registrar(dados.nome(),dados.email(),dados.senha(),dados.tipo(),dados.cpf(),dados.cnpj(),dados.ie(),dados.ieUf());
        return Map.of("id",c.id,"mensagem","Conta criada. Faça login.");
    }
    @PostMapping("/login")
    public Map<String,Object> login(@RequestBody Credenciais cred) { return auth.login(cred.email(),cred.senha()); }
    @GetMapping("/me")
    public Map<String,Object> me(@RequestHeader(value="Authorization",required=false) String token) { return auth.perfil(auth.atual(token)); }
    record PedidoExclusao(String senha,String confirmacao) { }
    @DeleteMapping("/minha-conta")
    public ResponseEntity<Void> excluirConta(
            @RequestHeader(value="Authorization",required=false) String token,
            @RequestBody PedidoExclusao dados) {
        if(dados==null)throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Informe os dados de confirmação");
        auth.excluirMinhaConta(token,dados.senha(),dados.confirmacao());
        return ResponseEntity.noContent().build();
    }
    @PostMapping("/sair")
    public ResponseEntity<Void> logout(@RequestHeader(value="Authorization",required=false) String token) {
        auth.sair(token);return ResponseEntity.noContent().build();
    }
}
