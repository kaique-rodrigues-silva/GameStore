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
  <div class="store-toolbar">
    <div class="store-filter-control">
      <button type="button" class="store-filter-trigger" [class.selected]="quantidadeFiltros>0 || filtroAberto"
        (click)="filtroAberto=!filtroAberto;ordemAberta=false" [attr.aria-expanded]="filtroAberto">
        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M7 12h10M10 17h4"/></svg>
        Filtrar por <span class="store-filter-count" *ngIf="quantidadeFiltros">{{quantidadeFiltros}}</span>
        <span class="store-chevron">{{filtroAberto?'⌃':'⌄'}}</span>
      </button>
      <div class="store-dropdown store-filter-menu" *ngIf="filtroAberto">
        <div class="store-dropdown-heading">Refinar produtos</div>
        <div class="store-filter-field">
          <label for="store-plataforma">Plataforma</label>
          <select id="store-plataforma" [(ngModel)]="plataformaSelecionada" (ngModelChange)="selecionarPlataforma($event)">
            <option value="">Todas as plataformas</option>
            <option *ngFor="let p of plataformasDisponiveis" [value]="p">{{nomePlataforma(p)}}</option>
          </select>
        </div>
        <div class="store-filter-field">
          <label for="store-marca">Marca</label>
          <select id="store-marca" [(ngModel)]="marcaSelecionada" (ngModelChange)="selecionarMarca($event)">
            <option value="">Todas as marcas</option>
            <option *ngFor="let marca of marcasDisponiveis" [value]="marca">{{marca}}</option>
          </select>
        </div>
        <div class="store-filter-field">
          <label for="store-condicao">Condição</label>
          <select id="store-condicao" [(ngModel)]="condicaoSelecionada">
            <option value="">Novos e seminovos</option>
            <option value="NOVO">Somente novos</option>
            <option value="USADO">Somente seminovos</option>
          </select>
        </div>
        <div class="store-filter-menu-actions">
          <button type="button" class="store-filter-reset" (click)="limparFiltros()">Limpar</button>
          <button type="button" class="store-filter-apply" (click)="filtroAberto=false">Ver {{filtrados.length}} produtos</button>
        </div>
      </div>
    </div>
    <div class="store-sort-control">
      <button type="button" class="store-sort-trigger" (click)="ordemAberta=!ordemAberta;filtroAberto=false" [attr.aria-expanded]="ordemAberta">
        <span>Ordenar por</span> <strong>{{rotuloOrdenacao}}</strong> <span class="store-chevron">{{ordemAberta?'⌃':'⌄'}}</span>
      </button>
      <div class="store-dropdown store-sort-menu" *ngIf="ordemAberta">
        <button type="button" *ngFor="let opcao of opcoesOrdenacao" [class.active]="ordenacao===opcao.valor" (click)="definirOrdenacao(opcao.valor)">{{opcao.rotulo}}</button>
      </div>
    </div>
  </div>
  <div class="catalog-result-count" *ngIf="!carregando && !erro">{{filtrados.length}} {{filtrados.length===1?'produto encontrado':'produtos encontrados'}}</div>
  <div *ngIf="erro" class="alert error">{{erro}}</div>
  <div *ngIf="!carregando && filtrados.length===0" class="empty">Nenhum produto encontrado.</div>
  <div *ngIf="carregando" class="empty">Carregando catálogo...</div>
  <div class="products">
    <article class="product" *ngFor="let p of filtrados">
      <div class="product-photo">
        <a class="product-image-link" [href]="'#/produto/'+p.id" (click)="verDetalhes.emit(p)" [attr.aria-label]="'Ver detalhes de '+p.nome">
          <img [src]="(p.imagem && !falhas[p.id]) ? p.imagem : imagemPadrao(p)" [alt]="p.nome" (error)="falhas[p.id]=true"/>
        </a>
        <span *ngIf="p.condicao==='USADO'" class="pill">Seminovo</span>
      </div>
      <div class="product-body"><div class="meta">{{p.plataforma ? p.plataforma+' · ' : ''}}{{nomeCategoria(p)}}</div>
        <h3><a [href]="'#/produto/'+p.id" (click)="verDetalhes.emit(p)">{{p.nome}}</a></h3><span class="stock">{{p.estoque>0?'Disponível':'Sem estoque'}}</span>
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
  @Output() verDetalhes=new EventEmitter<Produto>();
  pesquisa='';categoria='TODOS';falhas:Record<number,boolean>={};
  plataformaSelecionada='';marcaSelecionada='';condicaoSelecionada='';ordenacao='';
  filtroAberto=false;ordemAberta=false;
  opcoesOrdenacao=[
    {valor:'AZ',rotulo:'Nome: A–Z'},
    {valor:'ZA',rotulo:'Nome: Z–A'},
    {valor:'PRECO_ASC',rotulo:'Menor preço'},
    {valor:'PRECO_DESC',rotulo:'Maior preço'}
  ];
  get rotuloOrdenacao(){return this.opcoesOrdenacao.find(o=>o.valor===this.ordenacao)?.rotulo||'Selecionar';}
  get quantidadeFiltros(){return [this.plataformaSelecionada,this.marcaSelecionada,this.condicaoSelecionada].filter(Boolean).length;}
  definirOrdenacao(valor:string){this.ordenacao=valor;this.ordemAberta=false;}
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
  selecionarPlataforma(valor:string){
    if(valor){this.marcaSelecionada='';if(this.categoria==='CONSOLE'||this.categoria==='ACESSORIO')this.categoria='TODOS';}
  }
  selecionarMarca(valor:string){
    if(valor){this.plataformaSelecionada='';if(this.categoria==='JOGO')this.categoria='TODOS';}
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
