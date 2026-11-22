import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Produto } from './api.service';

@Component({
  selector:'app-produto-detalhe',
  standalone:true,
  imports:[CommonModule],
  template:`
<section class="product-detail-section" *ngIf="produto as p">
  <button type="button" class="detail-back" (click)="voltar.emit()">← Voltar ao catálogo</button>
  <div class="detail-layout">
    <div class="detail-gallery">
      <div class="detail-main-image">
        <img [src]="p.imagem && !imagemFalhou ? p.imagem : imagemPadrao(p)" (error)="imagemFalhou=true" [alt]="p.nome"/>
      </div>
    </div>
    <div class="detail-information">
      <div class="detail-category">{{categoria(p)}} <span *ngIf="p.condicao==='USADO'">· Seminovo</span></div>
      <h1>{{p.nome}}</h1>
      <button type="button" class="detail-favorite" [class.is-favorite]="favorito" (click)="favoritar.emit(p)">
        {{favorito?'♥ Remover dos favoritos':'♡ Adicionar aos favoritos'}}
      </button>
      <p class="detail-attribute" *ngIf="p.plataforma"><strong>{{p.categoria==='JOGO'?'Plataforma':'Marca / Empresa'}}:</strong> {{p.plataforma}}</p>
      <div class="detail-description" *ngIf="p.descricao && p.descricao.trim()">
        <h2>Sobre este produto</h2>
        <p>{{p.descricao}}</p>
      </div>
      <div class="detail-description" *ngIf="!p.descricao || !p.descricao.trim()">
        <h2>Sobre este produto</h2>
        <p class="muted">Ainda não há descrição cadastrada para este produto.</p>
      </div>
    </div>
    <aside class="detail-buy">
      <div class="detail-price">{{p.preco | currency:'BRL'}}</div>
      <div class="detail-stock" [class.unavailable]="p.estoque<1">{{p.estoque>0?'Em estoque':'Indisponível'}}</div>
      <p class="detail-stock-note" *ngIf="p.estoque>0">{{p.estoque}} {{p.estoque===1?'unidade disponível':'unidades disponíveis'}}</p>
      <div class="detail-quantity" *ngIf="p.estoque>0">
        <span>Quantidade</span>
        <div>
          <button type="button" (click)="diminuir()" [disabled]="quantidade<=1" aria-label="Diminuir quantidade">−</button>
          <strong>{{quantidade}}</strong>
          <button type="button" (click)="aumentar()" [disabled]="quantidade>=p.estoque" aria-label="Aumentar quantidade">+</button>
        </div>
      </div>
      <button type="button" class="button full detail-add" [disabled]="p.estoque<1" (click)="adicionar.emit({produto:p,quantidade:quantidade});adicionado=true">
        {{p.estoque>0?'Adicionar ao carrinho':'Sem estoque'}}
      </button>
      <p class="detail-added" *ngIf="adicionado">Produto adicionado! Abra o carrinho no canto inferior direito para continuar.</p>
      <p class="detail-disclaimer">Compra e pagamento demonstrativos, sem cobrança real.</p>
    </aside>
  </div>
  <section class="related-section" *ngIf="relacionados.length">
    <h2>Você também pode gostar</h2>
    <div class="related-products">
      <article class="related-card" *ngFor="let item of relacionados">
        <a [href]="'#/produto/'+item.id" (click)="verProduto.emit(item)">
          <div class="related-image"><img [src]="item.imagem || imagemPadrao(item)" [alt]="item.nome" (error)="falhaRelacionado($event,item)"/></div>
          <h3>{{item.nome}}</h3>
          <p>{{item.preco | currency:'BRL'}}</p>
        </a>
      </article>
    </div>
  </section>
</section>
`
})
export class ProdutoDetalheComponent {
  private atual:Produto|null=null;
  @Input() set produto(valor:Produto|null){
    if(this.atual?.id!==valor?.id){this.quantidade=1;this.imagemFalhou=false;this.adicionado=false;}
    this.atual=valor;
  }
  get produto(){return this.atual;}
  @Input() favorito=false;
  @Input() catalogo:Produto[]=[];
  @Output() favoritar=new EventEmitter<Produto>();
  @Output() verProduto=new EventEmitter<Produto>();
  @Output() voltar=new EventEmitter<void>();
  @Output() adicionar=new EventEmitter<{produto:Produto;quantidade:number}>();
  quantidade=1;imagemFalhou=false;adicionado=false;
  get relacionados():Produto[]{
    const p=this.produto;
    if(!p)return [];
    const mesmaPlataforma=(a:Produto,b:Produto)=>a.plataforma?.trim().toLocaleLowerCase('pt-BR')===b.plataforma?.trim().toLocaleLowerCase('pt-BR');
    return this.catalogo.filter(x=>x.id!==p.id && x.ativo && x.categoria===p.categoria)
      .sort((a,b)=>Number(mesmaPlataforma(b,p))-Number(mesmaPlataforma(a,p)) || a.id-b.id).slice(0,4);
  }
  falhaRelacionado(event:Event,produto:Produto){
    const imagem=event.target as HTMLImageElement;
    const padrao=this.imagemPadrao(produto);
    if(!imagem.src.endsWith(padrao))imagem.src=padrao;
  }
  categoria(p:Produto){return p.categoria==='CONSOLE'?'Console':p.categoria==='ACESSORIO'?'Acessório':'Jogo';}
  imagemPadrao(p:Produto){return '/assets/placeholder-'+(p.categoria==='CONSOLE'?'console':p.categoria==='ACESSORIO'?'acessorio':'jogo')+'.svg';}
  aumentar(){if(this.atual && this.quantidade<this.atual.estoque)this.quantidade++;}
  diminuir(){if(this.quantidade>1)this.quantidade--;}
}
