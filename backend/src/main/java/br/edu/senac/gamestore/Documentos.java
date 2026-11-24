package br.edu.senac.gamestore;

/* Validacao matematica dos digitos verificadores do CPF. */
public final class Documentos {
    private Documentos() { }
    public static String numeros(String s) { return s==null?"":s.replaceAll("\\D",""); }
    private static int dv(int s) { int r=s%11; return r<2?0:11-r; }
    public static boolean cpf(String texto) {
        String v=numeros(texto);
        if(v.length()!=11 || v.chars().distinct().count()==1) return false;
        int s=0; for(int i=0;i<9;i++)s+=(v.charAt(i)-'0')*(10-i);
        if(dv(s)!=v.charAt(9)-'0')return false;
        s=0;for(int i=0;i<10;i++)s+=(v.charAt(i)-'0')*(11-i);
        return dv(s)==v.charAt(10)-'0';
    }
}
