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
  <div class="catalog-controls">
    <div class="catalog-filter-side">
      <span class="catalog-control-title">Filtrar por</span>
      <label>Plataforma
        <select name="filtroPlataforma" [(ngModel)]="plataformaSelecionada">
          <option value="">Todas as plataformas</option>
          <option *ngFor="let p of plataformasDisponiveis" [value]="p">{{nomePlataforma(p)}}</option>
        </select>
      </label>
      <label>Marca
        <select name="filtroMarca" [(ngModel)]="marcaSelecionada">
          <option value="">Todas as marcas</option>
          <option *ngFor="let marca of marcasDisponiveis" [value]="marca">{{marca}}</option>
        </select>
      </label>
      <label>Condição
        <select name="filtroCondicao" [(ngModel)]="condicaoSelecionada">
          <option value="">Todas</option>
          <option value="NOVO">Novos</option>
          <option value="USADO">Seminovos</option>
        </select>
      </label>
      <button type="button" class="catalog-clear" *ngIf="plataformaSelecionada || marcaSelecionada || condicaoSelecionada" (click)="limparFiltros()">Limpar filtros</button>
    </div>
    <label class="catalog-order">Ordenar por
      <select name="ordenacao" [(ngModel)]="ordenacao">
        <option value="PADRAO">Ordem padrão</option>
        <option value="AZ">Nome: A–Z</option>
        <option value="ZA">Nome: Z–A</option>
        <option value="PRECO_ASC">Preço: menor para maior</option>
        <option value="PRECO_DESC">Preço: maior para menor</option>
      </select>
    </label>
  </div>
  <div class="catalog-result-count" *ngIf="!carregando && !erro">{{filtrados.length}} {{filtrados.length===1?'produto encontrado':'produtos encontrados'}}</div>
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
  plataformaSelecionada='';marcaSelecionada='';condicaoSelecionada='';ordenacao='PADRAO';
  nomeCategoria(p:Produto){return p.categoria==='CONSOLE'?'Console':p.categoria==='ACESSORIO'?'Acessório':'Jogo';}
  imagemPadrao(p:Produto){return '/assets/placeholder-'+(p.categoria==='CONSOLE'?'console':p.categoria==='ACESSORIO'?'acessorio':'jogo')+'.svg';}
  filtros=[{v:'TODOS',label:'Todos'},{v:'JOGO',label:'Jogos'},{v:'CONSOLE',label:'Consoles'},{v:'ACESSORIO',label:'Acessórios'},{v:'USADO',label:'Seminovos'}];

  // O campo "plataforma" guarda a plataforma dos jogos e a marca de consoles/acessórios.
  // Gera os filtros automaticamente a partir dos produtos existentes.
  private valoresSeparados(valor:string):string[]{
    return (valor||'').split(/[,;]/).map(item=>item.trim()).filter(Boolean);
  }
  private unicosOrdenados(valores:string[]):string[]{
    const unicos=new Map<string,string>();
    for(const valor of valores){const chave=valor.toLocaleLowerCase('pt-BR');if(!unicos.has(chave))unicos.set(chave,valor);}
    return [...unicos.values()].sort((a,b)=>a.localeCompare(b,'pt-BR',{sensitivity:'base'}));
  }
  get plataformasDisponiveis():string[]{
    return this.unicosOrdenados(this.produtos.filter(p=>p.categoria==='JOGO').flatMap(p=>this.valoresSeparados(p.plataforma)));
  }
  get marcasDisponiveis():string[]{
    return this.unicosOrdenados(this.produtos.filter(p=>p.categoria==='CONSOLE'||p.categoria==='ACESSORIO')
      .flatMap(p=>this.valoresSeparados(p.plataforma)));
  }
  nomePlataforma(valor:string):string{
    const nomes:Record<string,string>={'PS5':'PlayStation 5','PS4':'PlayStation 4','PS3':'PlayStation 3',
      'PS2':'PlayStation 2','PS1':'PlayStation 1','PSP':'PlayStation Portable'};
    return nomes[valor.toUpperCase()]||valor;
  }
  limparFiltros(){this.plataformaSelecionada='';this.marcaSelecionada='';this.condicaoSelecionada='';}
  private corresponde(valor:string,selecionado:string):boolean{
    return this.valoresSeparados(valor).some(parte=>parte.toLocaleLowerCase('pt-BR')===selecionado.toLocaleLowerCase('pt-BR'));
  }
  get filtrados():Produto[]{
    const busca=this.pesquisa.trim().toLocaleLowerCase('pt-BR');
    const lista=this.produtos.filter(p=>
      (this.categoria==='TODOS'||(this.categoria==='USADO'?p.condicao==='USADO':p.categoria===this.categoria))
      &&(!this.condicaoSelecionada||p.condicao===this.condicaoSelecionada)
      &&(!this.plataformaSelecionada||(p.categoria==='JOGO'&&this.corresponde(p.plataforma,this.plataformaSelecionada)))
      &&(!this.marcaSelecionada||((p.categoria==='CONSOLE'||p.categoria==='ACESSORIO')&&this.corresponde(p.plataforma,this.marcaSelecionada)))
      &&(!busca||[p.nome,p.plataforma,p.categoria].join(' ').toLocaleLowerCase('pt-BR').includes(busca))
    );
    if(this.ordenacao==='AZ')return lista.sort((a,b)=>a.nome.localeCompare(b.nome,'pt-BR',{sensitivity:'base'}));
    if(this.ordenacao==='ZA')return lista.sort((a,b)=>b.nome.localeCompare(a.nome,'pt-BR',{sensitivity:'base'}));
    if(this.ordenacao==='PRECO_ASC')return lista.sort((a,b)=>a.preco-b.preco);
    if(this.ordenacao==='PRECO_DESC')return lista.sort((a,b)=>b.preco-a.preco);
    return lista;
  }
}
