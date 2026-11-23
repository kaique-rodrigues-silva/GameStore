import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface Produto {
  id:number;nome:string;categoria:string;plataforma:string;condicao:string;
  descricao:string;imagem:string;preco:number;precoPromocional:number|null;precoEfetivo:number;estoque:number;ativo:boolean;
}
export interface Usuario { id:number;nome:string;email:string;perfil:'ADMIN'|'CLIENTE';tipo:string; }
export interface Linha {produto:Produto;quantidade:number;}
export interface Pedido {id:number;data:string;total:number;pagamento:string;endereco:string;itens:{nome:string;quantidade:number;preco:number}[];}

@Injectable({providedIn:'root'})
export class ApiService {
  usuario = signal<Usuario|null>(null);
  private token = sessionStorage.getItem('gamestore_token') ?? '';
  constructor(private http:HttpClient) { }
  private headers() { return new HttpHeaders(this.token?{Authorization:`Bearer ${this.token}`}:{}) }
  private async req<T>(metodo:string,caminho:string,body?:unknown):Promise<T> {
    try {
      return await firstValueFrom(this.http.request<T>(metodo,`/api${caminho}`,{body,headers:this.headers()}));
    } catch(err:unknown) {
      const e = err as {status?:number,error?:{erro?:string;message?:string},message?:string};
      if(e?.status===401) { this.token='';sessionStorage.removeItem('gamestore_token');this.usuario.set(null); }
      throw new Error(e?.error?.erro || e?.error?.message || (e?.status===0?'Servidor indisponível. Confira o Spring Boot.':'Não foi possível concluir a operação.'));
    }
  }
  get<T>(url:string){return this.req<T>('GET',url);}
  post<T>(url:string,body:unknown){return this.req<T>('POST',url,body);}
  put<T>(url:string,body:unknown){return this.req<T>('PUT',url,body);}
  del<T>(url:string){return this.req<T>('DELETE',url);}
  delComCorpo<T>(url:string,body:unknown){return this.req<T>('DELETE',url,body);}
  async restaurar() {
    if(!this.token)return;
    try {this.usuario.set(await this.get<Usuario>('/auth/me'));} catch {this.usuario.set(null);}
  }
  async entrar(email:string,senha:string){
    const r=await this.post<{token:string;conta:Usuario}>('/auth/login',{email,senha});
    this.token=r.token;sessionStorage.setItem('gamestore_token',r.token);this.usuario.set(r.conta);
    return r.conta;
  }
  async sair(){try{await this.post('/auth/sair',{});}catch{}this.token='';sessionStorage.removeItem('gamestore_token');this.usuario.set(null);}
}
