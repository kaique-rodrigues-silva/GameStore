package br.edu.senac.gamestore;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;

@SpringBootApplication
public class App {
    public static void main(String[] args) { SpringApplication.run(App.class, args); }

    @Bean
    @Order(Ordered.HIGHEST_PRECEDENCE)
    CommandLineRunner ajustarColunaDeImagem(JdbcTemplate jdbc) {
        return args -> {
            String tipo = jdbc.queryForObject(
                "SELECT DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS " +
                "WHERE TABLE_NAME = 'PRODUTOS' AND COLUMN_NAME = 'IMAGEM'", String.class);
            if ("CHARACTER VARYING".equalsIgnoreCase(tipo)) {
                jdbc.execute("ALTER TABLE PRODUTOS ALTER COLUMN IMAGEM CLOB");
            }
        };
    }
}
