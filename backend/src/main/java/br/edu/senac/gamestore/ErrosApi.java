package br.edu.senac.gamestore;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;
import java.util.Map;

@RestControllerAdvice
class ErrosApi {
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String,String>> regra(ResponseStatusException e){
        String msg=e.getReason()==null?"Erro na operação":e.getReason();
        return ResponseEntity.status(e.getStatusCode()).body(Map.of("erro",msg));
    }
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String,String>> imprevisto(Exception e){
        // Nunca expõe detalhes de SQL ou dados sensíveis ao navegador.
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("erro","Erro interno. Confira o terminal do servidor."));
    }
}
