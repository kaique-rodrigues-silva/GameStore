import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, Linha, Produto, Pedido } from './api.service';
import { VitrineComponent } from './vitrine.component';
import { CarrinhoComponent } from './carrinho.component';
import { AdminComponent } from './admin.component';

@Component({selector:'app-root',standalone:true,imports:[CommonModule,FormsModule,VitrineComponent,CarrinhoComponent,AdminComponent],template:`
<header class="top"><div class="container header-row">
  <button type="button" class="logo" (click)="ir('loja')"><span class="logo-box">G</span> GAME<span>STORE</span></button>
  <div class="header-actions"><button (click)="ir('loja')">Loja</button>
    <button *ngIf="api.usuario()?.perfil==='CLIENTE'" (click)="ir('pedidos')">Meus pedidos</button>
    <button *ngIf="api.usuario()?.perfil==='ADMIN'" (click)="ir('admin')">Administração</button>
    <button (click)="ir('carrinho')">Carrinho ({{quantidade}})</button>
    <button *ngIf="!api.usuario()" (click)="ir('login')">Entrar</button>
    <span class="user-info" *ngIf="api.usuario()">Olá, {{api.usuario()?.nome}}</span>
    <button *ngIf="api.usuario()?.perfil==='CLIENTE'" (click)="ir('excluir')">Excluir minha conta</button>
    <button *ngIf="api.usuario()" (click)="sair()">Sair</button>
  </div>
</div></header>
<main class="container">
  <app-vitrine *ngIf="pagina==='loja'" [produtos]="produtos" [carregando]="carregando" [erro]="erroProdutos" (adicionar)="adicionar($event)"/>
  <div *ngIf="pagina==='login'" class="auth-wrap"><div class="panel auth-panel">
    <div class="eyebrow purple">SUA CONTA</div><h2>Entrar na GameStore</h2>
    <div class="alert error" *ngIf="erroAuth">{{erroAuth}}</div>
    <form (ngSubmit)="entrar()"><label>E-mail<input name="email" type="email" required [(ngModel)]="loginEmail"/></label>
      <label>Senha<input name="senha" type="password" required [(ngModel)]="loginSenha"/></label>
      <button type="submit" class="button full" [disabled]="enviando">{{enviando?'Entrando...':'Entrar'}}</button>
    </form><p class="muted">Não tem conta? <button class="link" (click)="ir('registro')">Criar conta</button></p>
  </div></div>
  <div *ngIf="pagina==='registro'" class="auth-wrap"><div class="panel auth-panel">
    <div class="eyebrow purple">NOVO CLIENTE</div><h2>Crie sua conta</h2>
    <div class="alert error" *ngIf="erroAuth">{{erroAuth}}</div>
    <form (ngSubmit)="registrar()"><label>Nome completo<input name="nome" required [(ngModel)]="novoNome"/></label>
      <label>E-mail<input name="email" type="email" required [(ngModel)]="novoEmail"/></label>
      <label>CPF<input name="cpf" required [(ngModel)]="novoCpf" placeholder="000.000.000-00"/></label>
      <label>Senha (mínimo 8 caracteres)<input name="senha" type="password" required minlength="8" [(ngModel)]="novaSenha"/></label>
      <button type="submit" class="button full" [disabled]="enviando">{{enviando?'Cadastrando...':'Criar conta'}}</button>
    </form><p class="muted">Já tem uma conta? <button class="link" (click)="ir('login')">Entrar</button></p>
  </div></div>
  <app-carrinho *ngIf="pagina==='carrinho'" [itens]="carrinho" (atualizar)="atualizarQuantidade($event)" (remover)="remover($event)" (concluir)="compraConcluida()" (navegar)="ir($event)"/>
  <section class="section narrow" *ngIf="pagina==='pedidos'"><div class="eyebrow purple">SUA CONTA</div><h2>Meus pedidos</h2>
    <div class="alert error" *ngIf="erroPedidos">{{erroPedidos}}</div>
    <div class="panel" *ngFor="let pedido of pedidos"><div class="between"><strong>Pedido #{{pedido.id}}</strong><strong>{{pedido.total | currency:'BRL'}}</strong></div>
      <div class="meta">{{pedido.data}} · {{pedido.pagamento}} · Pagamento demonstrativo</div>
      <div class="order-row" *ngFor="let item of pedido.itens">{{item.quantidade}}× {{item.nome}}</div>
      <div class="muted">Entrega: {{pedido.endereco}}</div>
    </div><div *ngIf="!pedidos.length && !erroPedidos" class="empty">Nenhum pedido realizado.</div>
  </section>
  <section *ngIf="pagina==='excluir' && api.usuario()?.perfil==='CLIENTE'" class="section narrow">
    <div class="panel auth-panel">
      <h2>Excluir minha conta definitivamente</h2>
      <p>Esta ação apaga sua conta, CPF, dados cadastrais, sessões, pedidos e endereços dos pedidos no banco ativo. Não é possível desfazer. Produtos e contas de outras pessoas não são afetados.</p>
      <p class="muted">Registros em eventuais backups da hospedagem podem permanecer até o fim da retenção do provedor.</p>
      <div class="alert error" *ngIf="erroExclusao">{{erroExclusao}}</div>
      <form (ngSubmit)="excluirMinhaConta()">
        <label>Confirme sua senha<input type="password" name="senhaExclusao" required [(ngModel)]="senhaExclusao"/></label>
        <label>Digite EXCLUIR MINHA CONTA<input name="confirmacaoExclusao" required [(ngModel)]="confirmacaoExclusao"/></label>
        <button type="submit" class="button full" [disabled]="excluindo || confirmacaoExclusao!=='EXCLUIR MINHA CONTA'">{{excluindo?'Excluindo...':'Excluir definitivamente'}}</button>
      </form>
      <button class="link" type="button" (click)="ir('loja')">Cancelar</button>
    </div>
  </section>
  <app-admin *ngIf="pagina==='admin' && api.usuario()?.perfil==='ADMIN'"/>
</main>
<footer class="footer"><div class="container foot-row"><div><strong>GAMESTORE</strong><p>Seu lugar para jogos, consoles e acessórios.</p></div>
  <div><strong>Sua próxima aventura começa aqui.</strong><p>Projeto acadêmico · Compras e pagamentos demonstrativos, sem cobrança real.</p></div>
</div></footer>
`})
export class AppComponent implements OnInit {
  pagina='loja';produtos:Produto[]=[];carrinho:Linha[]=[];pedidos:Pedido[]=[];
  carregando=true;erroProdutos='';erroAuth='';erroPedidos='';enviando=false;
  loginEmail='';loginSenha='';novoNome='';novoEmail='';novoCpf='';novaSenha='';
  senhaExclusao='';confirmacaoExclusao='';erroExclusao='';excluindo=false;
  constructor(public api:ApiService) { }
  async ngOnInit(){await this.api.restaurar();await this.carregarProdutos();}
  async carregarProdutos(){this.carregando=true;try{this.produtos=await this.api.get<Produto[]>('/loja/produtos');this.erroProdutos='';}
    catch(e){this.erroProdutos=(e as Error).message;}finally{this.carregando=false;}}
  get quantidade(){return this.carrinho.reduce((s,i)=>s+i.quantidade,0);}
  async ir(pagina:string){
    this.pagina=pagina;this.erroAuth='';window.scrollTo(0,0);
    if(pagina==='loja')await this.carregarProdutos();
    if(pagina==='pedidos'){
      if(!this.api.usuario()){this.pagina='login';return;}
      try{this.pedidos=await this.api.get<Pedido[]>('/loja/meus-pedidos');this.erroPedidos='';}
      catch(e){this.erroPedidos=(e as Error).message;}
    }
  }
  adicionar(p:Produto){const l=this.carrinho.find(x=>x.produto.id===p.id);
    if(l){if(l.quantidade<p.estoque)l.quantidade++;else alert('Quantidade indisponível no estoque.');}
    else this.carrinho.push({produto:p,quantidade:1});
  }
  atualizarQuantidade(e:{id:number;delta:number}){const l=this.carrinho.find(x=>x.produto.id===e.id);if(!l)return;
    l.quantidade=Math.min(l.produto.estoque,Math.max(1,l.quantidade+e.delta));}
  remover(id:number){this.carrinho=this.carrinho.filter(x=>x.produto.id!==id);}
  compraConcluida(){this.carrinho=[];void this.carregarProdutos();}
  async registrar(){this.erroAuth='';this.enviando=true;try{
      await this.api.post('/auth/registro',{nome:this.novoNome,email:this.novoEmail,cpf:this.novoCpf,senha:this.novaSenha});
      this.loginEmail=this.novoEmail;this.loginSenha=this.novaSenha;await this.api.entrar(this.loginEmail,this.loginSenha);
      await this.ir(this.carrinho.length?'carrinho':'loja');
    }catch(e){this.erroAuth=(e as Error).message;}finally{this.enviando=false;}}
  async entrar(){this.enviando=true;this.erroAuth='';try{
      const usuario=await this.api.entrar(this.loginEmail,this.loginSenha);
      await this.ir(usuario.perfil==='ADMIN'?'admin':this.carrinho.length?'carrinho':'loja');
    }catch(e){this.erroAuth=(e as Error).message;}finally{this.enviando=false;}}
  async excluirMinhaConta(){
    if(this.excluindo || this.confirmacaoExclusao!=='EXCLUIR MINHA CONTA')return;
    this.erroExclusao='';this.excluindo=true;
    try {
      await this.api.delComCorpo<void>('/auth/minha-conta',{senha:this.senhaExclusao,confirmacao:this.confirmacaoExclusao});
      await this.api.sair();
      this.senhaExclusao='';this.confirmacaoExclusao='';this.loginSenha='';this.carrinho=[];this.pedidos=[];
      await this.ir('loja');
      alert('Sua conta e os dados associados foram excluídos do banco ativo.');
    }catch(e){this.erroExclusao=(e as Error).message;}
    finally{this.excluindo=false;}
  }
  async sair(){await this.api.sair();await this.ir('loja');}
}
