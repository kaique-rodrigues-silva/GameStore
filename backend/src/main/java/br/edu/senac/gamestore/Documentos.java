package br.edu.senac.gamestore;

import br.com.caelum.stella.SimpleMessageProducer;
import br.com.caelum.stella.type.Estado;
import java.util.Locale;
import java.util.Set;

/* Algoritmos de DV; RG antigo varia por UF e só SP é conferido matematicamente. */
public final class Documentos {
    private Documentos() { }
    public static final Set<String> UFS=Set.of("AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO");
    public static String numeros(String s) { return s==null?"":s.replaceAll("\\D",""); }
    public static String alfanumerico(String s) { return s==null?"":s.toUpperCase(Locale.ROOT).replaceAll("[^A-Z0-9]",""); }
    public static boolean uf(String s) { return s!=null && UFS.contains(s.toUpperCase(Locale.ROOT)); }
    private static int dv(int s) { int r=s%11; return r<2?0:11-r; }
    public static boolean cpf(String texto) {
        String v=numeros(texto);
        if(v.length()!=11 || v.chars().distinct().count()==1) return false;
        int s=0; for(int i=0;i<9;i++)s+=(v.charAt(i)-'0')*(10-i);
        if(dv(s)!=v.charAt(9)-'0')return false;
        s=0;for(int i=0;i<10;i++)s+=(v.charAt(i)-'0')*(11-i);
        return dv(s)==v.charAt(10)-'0';
    }
    public static boolean cnpj(String texto) {
        String v=alfanumerico(texto);
        if(!v.matches("[A-Z0-9]{12}[0-9]{2}") || v.substring(0,12).chars().distinct().count()==1)return false;
        int[] w1={5,4,3,2,9,8,7,6,5,4,3,2},w2={6,5,4,3,2,9,8,7,6,5,4,3,2};
        int s=0; for(int i=0;i<12;i++)s+=(v.charAt(i)-48)*w1[i];
        if(dv(s)!=v.charAt(12)-'0')return false;
        s=0;for(int i=0;i<13;i++)s+=(v.charAt(i)-48)*w2[i];
        return dv(s)==v.charAt(13)-'0';
    }
    public static boolean rg(String texto,String uf) {
        if(!uf(uf)) return false;
        String v=alfanumerico(texto);
        if("SP".equals(uf.toUpperCase(Locale.ROOT))) {
            if(!v.matches("[0-9]{8}[0-9X]")) return false;
            int s=0;for(int i=0;i<8;i++)s+=(v.charAt(i)-48)*(i+2);
            int d=11-s%11;char dig=d==11?'0':d==10?'X':(char)('0'+d);
            return v.charAt(8)==dig;
        }
        // Outros RGs estaduais antigos: somente validação de formato, não de DV.
        return v.matches("[A-Z0-9]{6,13}");
    }
    public static boolean ie(String texto,String uf) {
        if(texto==null || texto.isBlank() || !uf(uf))return false;
        try {
            return Estado.valueOf(uf.toUpperCase(Locale.ROOT))
                    .getIEValidator(new SimpleMessageProducer(),false)
                    .invalidMessagesFor(alfanumerico(texto)).isEmpty();
        } catch(Exception e) { return false; }
    }
}
