package br.edu.senac.gamestore;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
class DocumentosTest {
    @Test void cpfCnpj(){
        assertTrue(Documentos.cpf("529.982.247-25"));
        assertFalse(Documentos.cpf("111.111.111-11"));
        assertTrue(Documentos.cnpj("11.222.333/0001-81"));
        assertFalse(Documentos.cnpj("11.111.111/1111-11"));
        assertFalse(Documentos.ie("123","SP"));
    }
}
