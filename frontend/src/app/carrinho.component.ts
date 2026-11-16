import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, Linha } from './api.service';

@Component({selector:'app-carrinho',standalone:true,imports:[CommonModule,FormsModule],template:`
<section class="section narrow"><div class="eyebrow purple">SUA COMPRA</div><h2>Carrinho e pagamento</h2>
  <div class="alert" *ngIf="sucesso">Pedido #{{sucesso}} confirmado. Pagamento apenas demonstrativo.</div>
  <div class="alert error" *ngIf="erro">{{erro}}</div>
  <div *ngIf="!itens.length && !sucesso" class="empty">Seu carrinho está vazio. Escolha um jogo para começar.</div>
  <div *ngIf="itens.length" class="checkout-layout">
    <div><article class="cart-line" *ngFor="let item of itens">
      <div><strong>{{item.produto.nome}}</strong><div class="meta">{{item.produto.plataforma}}</div></div>
      <div class="qty"><button type="button" (click)="mudar(item,-1)">−</button><span>{{item.quantidade}}</span><button type="button" (click)="mudar(item,1)">+</button></div>
      <strong>{{item.produto.preco * item.quantidade | currency:'BRL'}}</strong>
      <button class="link" (click)="remover.emit(item.produto.id)">Remover</button>
    </article></div>
    <div class="panel"><h3>Resumo do pedido</h3><div class="between">Total <strong>{{total | currency:'BRL'}}</strong></div>
      <p class="muted">Esta é uma compra de demonstração. Não há cobrança real.</p>
      <div *ngIf="!api.usuario()" class="alert">Entre na sua conta para continuar.</div>
      <button *ngIf="!api.usuario()" class="button full" (click)="navegar.emit('login')">Entrar para comprar</button>
      <form *ngIf="api.usuario()?.perfil==='CLIENTE'" (ngSubmit)="confirmar()">
        <label>Endereço de entrega <textarea name="endereco" [(ngModel)]="endereco" required rows="3" placeholder="Rua, número, bairro, cidade, UF, CEP"></textarea></label>
        <label>Forma de pagamento <select name="pagamento" [(ngModel)]="pagamento"><option value="PIX">Pix</option><option value="CREDITO">Cartão de crédito</option><option value="DEBITO">Cartão de débito</option><option value="DINHEIRO">Dinheiro</option></select></label>
        <button class="button full" type="submit" [disabled]="enviando">{{enviando?'Confirmando...':'Confirmar pedido demonstrativo'}}</button>
      </form>
      <div *ngIf="api.usuario()?.perfil==='ADMIN'" class="alert">Para comprar, entre com uma conta de cliente.</div>
    </div>
  </div>
</section>
`})
export class CarrinhoComponent {
  @Input() itens:Linha[]=[];
  @Output() atualizar=new EventEmitter<{id:number;delta:number}>();
  @Output() remover=new EventEmitter<number>();
  @Output() concluir=new EventEmitter<void>();
  @Output() navegar=new EventEmitter<string>();
  endereco='';pagamento='PIX';enviando=false;erro='';sucesso:number|null=null;
  constructor(public api:ApiService) { }
  get total(){return this.itens.reduce((s,i)=>s+i.produto.preco*i.quantidade,0);}
  mudar(item:Linha,delta:number){this.atualizar.emit({id:item.produto.id,delta});}
  async confirmar(){
    this.erro='';if(!this.endereco.trim()){this.erro='Informe o endereço completo.';return;}
    this.enviando=true;
    try {
      const r=await this.api.post<{pedidoId:number}>('/loja/comprar',{pagamento:this.pagamento,endereco:this.endereco,
        itens:this.itens.map(i=>({produtoId:i.produto.id,quantidade:i.quantidade}))});
      this.sucesso=r.pedidoId;this.concluir.emit();
    } catch(e){this.erro=(e as Error).message;}finally{this.enviando=false;}
  }
}
