package br.edu.senac.gamestore;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.*;
import org.springframework.test.context.TestPropertySource;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;

/* Teste real via HTTP. Não utiliza Mockito. */
@SpringBootTest(webEnvironment=SpringBootTest.WebEnvironment.RANDOM_PORT)
@TestPropertySource(properties={
    "spring.datasource.url=jdbc:h2:mem:teste_gamestore;DB_CLOSE_DELAY=-1",
    "spring.jpa.hibernate.ddl-auto=create-drop"
})
class FluxoDaLojaTest {
    @Autowired TestRestTemplate http;
    @Test void criarContaLoginFinalizarPedidoEVerHistorico(){
        String email="teste-"+UUID.randomUUID()+"@example.com";
        ResponseEntity<Map> cadastro=http.postForEntity("/api/auth/registro",Map.of(
            "nome","Cliente Teste","email",email,"senha","SenhaForte@123","cpf","52998224725"),Map.class);
        assertEquals(200,cadastro.getStatusCode().value(),"Cadastro falhou: "+cadastro.getBody());
        ResponseEntity<Map> login=http.postForEntity("/api/auth/login",Map.of("email",email,"senha","SenhaForte@123"),Map.class);
        assertEquals(200,login.getStatusCode().value(),"Login falhou: "+login.getBody());
        assertNotNull(login.getBody());
        String token=(String)login.getBody().get("token");
        HttpHeaders headers=new HttpHeaders();headers.setBearerAuth(token);
        ResponseEntity<Map> me=http.exchange("/api/auth/me",HttpMethod.GET,new HttpEntity<>(headers),Map.class);
        assertEquals(200,me.getStatusCode().value(),"Autenticação falhou: "+me.getBody());
        ResponseEntity<List> produtos=http.getForEntity("/api/loja/produtos",List.class);
        assertEquals(200,produtos.getStatusCode().value());
        assertNotNull(produtos.getBody()); assertFalse(produtos.getBody().isEmpty());
        Map<?,?> produto=(Map<?,?>)produtos.getBody().get(0);
        ResponseEntity<Map> compra=http.exchange("/api/loja/comprar",HttpMethod.POST,new HttpEntity<>(Map.of(
            "pagamento","PIX","endereco","Rua Teste, 123, São Paulo/SP, CEP 01001000",
            "itens",List.of(Map.of("produtoId",produto.get("id"),"quantidade",1))),headers),Map.class);
        assertEquals(200,compra.getStatusCode().value(),"Pedido falhou: "+compra.getBody());
        ResponseEntity<List> pedidos=http.exchange("/api/loja/meus-pedidos",HttpMethod.GET,new HttpEntity<>(headers),List.class);
        assertEquals(200,pedidos.getStatusCode().value());
        assertNotNull(pedidos.getBody());assertEquals(1,pedidos.getBody().size());
        // O estoque diminui após o pedido.
        ResponseEntity<List> produtosDepois=http.getForEntity("/api/loja/produtos",List.class);
        assertNotNull(produtosDepois.getBody());
        Map<?,?> depois=(Map<?,?>)produtosDepois.getBody().get(0);
        assertEquals(((Number)produto.get("estoque")).intValue()-1,((Number)depois.get("estoque")).intValue());
        // Uma conta CLIENTE não pode acessar o painel administrativo.
        ResponseEntity<Map> negado=http.exchange("/api/admin/resumo",HttpMethod.GET,new HttpEntity<>(headers),Map.class);
        assertEquals(403,negado.getStatusCode().value());
    }
}
