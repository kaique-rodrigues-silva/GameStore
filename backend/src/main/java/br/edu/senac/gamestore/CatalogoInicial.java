package br.edu.senac.gamestore;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import java.math.BigDecimal;

/* Dados iniciais de DEMONSTRAÇÃO. Executa somente no banco vazio. */
@Configuration
class CatalogoInicial {
    @Bean CommandLineRunner inicializar(ContaRepo contas,ProdutoRepo produtos){
        return args->{
            if(contas.count()==0){
                Conta admin=new Conta();admin.nome="Administrador GameStore";admin.email="admin@gamestore.local";
                admin.senhaHash=new BCryptPasswordEncoder().encode("GameStore@2026");admin.perfil="ADMIN";
                admin.tipo="PF";contas.save(admin);
                Conta cliente=new Conta();cliente.nome="Cliente Demonstração";cliente.email="cliente@gamestore.local";
                cliente.senhaHash=new BCryptPasswordEncoder().encode("Cliente@2026");
                cliente.perfil="CLIENTE";cliente.tipo="PF";cliente.cpf="00000000191";contas.save(cliente);
            }
            if(produtos.count()==0){
                inserir(produtos,"Elden Ring","JOGO","PS5","NOVO","249.90",8,"/assets/produtos/elden-ring.png");
                inserir(produtos,"Mario Kart 8 Deluxe","JOGO","Nintendo Switch","NOVO","279.90",9,"/assets/produtos/mario-kart-8.png");
                inserir(produtos,"Nintendo Switch OLED Branco","CONSOLE","Nintendo Switch","NOVO","2199.00",4,"/assets/produtos/switch-oled.png");
                inserir(produtos,"Red Dead Redemption 2","JOGO","PS4","NOVO","189.90",6,"https://cdn.jiostore.online/v2/jmd-asp/jdprod/wrkr/products/pictures/item/free/resize-w%3A460/e-xpress/491431068/0/apzfYZzfUq-E9ldRXhNROb-Rockstar-Games-PS4-PC-Gaming-Titles-491431068-i-1-1200Wx1200H.jpeg");
                inserir(produtos,"God of War Ragnarök","JOGO","PS5","NOVO","259.90",7,"https://images.tcdn.com.br/img/img_prod/1105451/jogo_god_of_war_ragnarok_ps5_midia_fisica_santa_monica_397_1_8c4983b0323f661a6e731ef058fd6f22.jpg");
            }
        };
    }
    private void inserir(ProdutoRepo repo,String nome,String categoria,String plataforma,String condicao,String preco,int estoque,String imagem){
        Produto p=new Produto();p.nome=nome;p.categoria=categoria;p.plataforma=plataforma;p.condicao=condicao;
        p.preco=new BigDecimal(preco);p.estoque=estoque;p.imagem=imagem;
        p.descricao="Produto de demonstração para o Projeto Integrador";repo.save(p);
    }
}
