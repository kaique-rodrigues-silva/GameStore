package br.edu.senac.gamestore;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class DocumentosTest {
    @Test void cpfValidoEInvalido() {
        assertTrue(Documentos.cpf("529.982.247-25"));
        assertTrue(Documentos.cpf("52998224725"));
        assertFalse(Documentos.cpf("111.111.111-11"));
        assertFalse(Documentos.cpf("529.982.247-26"));
        assertFalse(Documentos.cpf("123"));
        assertFalse(Documentos.cpf(null));
    }
}
