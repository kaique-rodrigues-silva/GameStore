import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Produto } from './api.service';

@Component({selector:'app-vitrine',standalone:true,imports:[CommonModule,FormsModule],template:`
<section class="hero">
  <div class="hero-text"><div class="eyebrow">GAMES, CONSOLES E ACESSÓRIOS</div>
    <h1>Sua próxima aventura começa aqui.</h1>
    <p>Encontre os jogos e equipamentos que fazem parte da sua história.</p>
    <a href="#catalogo" class="button button-light">Ver produtos</a>
  </div><div class="hero-art" aria-hidden="true"><div class="circle-a"></div><div class="circle-b"></div><div class="game-symbol">GS</div></div>
</section>
<section id="catalogo" class="section">
  <div class="section-top"><div><div class="eyebrow purple">ESCOLHA SEU JOGO</div><h2>Nosso catálogo</h2></div>
    <label class="search-label">Pesquisar <input [(ngModel)]="pesquisa" placeholder="Jogo, console ou plataforma..."/></label>
  </div>
  <nav class="filters" aria-label="Filtrar produtos">
    <button *ngFor="let filtro of filtros" type="button" [class.active]="categoria===filtro.v" (click)="categoria=filtro.v">{{filtro.label}}</button>
  </nav>
  <div *ngIf="erro" class="alert error">{{erro}}</div>
  <div *ngIf="!carregando && filtrados.length===0" class="empty">Nenhum produto encontrado.</div>
  <div *ngIf="carregando" class="empty">Carregando catálogo...</div>
  <div class="products">
    <article class="product" *ngFor="let p of filtrados">
      <div class="product-photo">
        <img [src]="(p.imagem && !falhas[p.id]) ? p.imagem : imagemPadrao(p)" [alt]="p.imagem && !falhas[p.id] ? p.nome : 'Ilustração padrão de '+nomeCategoria(p)" (error)="falhas[p.id]=true"/>
        <span *ngIf="p.condicao==='USADO'" class="pill">Seminovo</span>
      </div>
      <div class="product-body"><div class="meta">{{p.plataforma ? p.plataforma+' · ' : ''}}{{nomeCategoria(p)}}</div>
        <h3>{{p.nome}}</h3><span class="stock">{{p.estoque>0?'Disponível':'Sem estoque'}}</span>
        <div class="price">{{p.preco | currency:'BRL'}}</div>
        <button class="button full" [disabled]="p.estoque<1" (click)="adicionar.emit(p)">{{p.estoque>0?'Adicionar ao carrinho':'Indisponível'}}</button>
      </div>
    </article>
  </div>
</section>
`})
export class VitrineComponent {
  @Input() produtos:Produto[]=[];
  @Input() carregando=false;
  @Input() erro='';
  @Output() adicionar=new EventEmitter<Produto>();
  pesquisa='';categoria='TODOS';falhas:Record<number,boolean>={};
  nomeCategoria(p:Produto){return p.categoria==='CONSOLE'?'Console':p.categoria==='ACESSORIO'?'Acessório':'Jogo';}
  imagemPadrao(p:Produto){return '/assets/placeholder-'+(p.categoria==='CONSOLE'?'console':p.categoria==='ACESSORIO'?'acessorio':'jogo')+'.svg';}
  filtros=[{v:'TODOS',label:'Todos'},{v:'JOGO',label:'Jogos'},{v:'CONSOLE',label:'Consoles'},{v:'ACESSORIO',label:'Acessórios'},{v:'USADO',label:'Seminovos'}];
  get filtrados():Produto[]{
    const busca=this.pesquisa.trim().toLowerCase();
    return this.produtos.filter(p=>(this.categoria==='TODOS'||(this.categoria==='USADO'?p.condicao==='USADO':p.categoria===this.categoria))
      && (!busca||[p.nome,p.plataforma,p.categoria].join(' ').toLowerCase().includes(busca)));
  }
}
