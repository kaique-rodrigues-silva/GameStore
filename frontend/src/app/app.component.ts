import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, Linha, Produto, Pedido } from './api.service';
import { VitrineComponent } from './vitrine.component';
import { CarrinhoComponent } from './carrinho.component';
import { AdminComponent } from './admin.component';
import { ProdutoDetalheComponent } from './produto-detalhe.component';

@Component({selector:'app-root',standalone:true,imports:[CommonModule,FormsModule,VitrineComponent,CarrinhoComponent,AdminComponent,ProdutoDetalheComponent],template:`
<header class="top"><div class="container header-row">
  <button type="button" class="logo" (click)="ir('loja')"><span class="logo-box">G</span> GAME<span>STORE</span></button>
  <div class="header-actions"><button (click)="ir('loja')">Loja</button>
    <button *ngIf="api.usuario()?.perfil==='CLIENTE'" (click)="ir('pedidos')">Meus pedidos</button>
    <button *ngIf="api.usuario()?.perfil==='CLIENTE'" (click)="ir('favoritos')">♥ Meus favoritos</button>
    <button *ngIf="api.usuario()?.perfil==='ADMIN'" (click)="ir('admin')">Administração</button>

    <button *ngIf="!api.usuario()" (click)="ir('login')">Entrar</button>
    <span class="user-info" *ngIf="api.usuario()">Olá, {{api.usuario()?.nome}}</span>
    <button *ngIf="api.usuario()?.perfil==='CLIENTE'" (click)="ir('excluir')">Excluir minha conta</button>
    <button *ngIf="api.usuario()" (click)="sair()">Sair</button>
  </div>
</div></header>
<main class="container">
  <app-vitrine *ngIf="pagina==='loja'" [produtos]="produtos" [carregando]="carregando" [erro]="erroProdutos" (adicionar)="adicionar($event)" (verDetalhes)="abrirProduto($event)" [favoritos]="favoritos" (favoritar)="alternarFavorito($event)"/>
  <app-produto-detalhe *ngIf="pagina==='produto' && produtoSelecionado" [produto]="produtoSelecionado" [catalogo]="produtos" [favorito]="favoritos.includes(produtoSelecionado.id)" (favoritar)="alternarFavorito($event)" (verProduto)="abrirProduto($event)" (voltar)="ir('loja')" (adicionar)="adicionarVarios($event)"/>
  <section class="section narrow" *ngIf="pagina==='produto' && !produtoSelecionado">
    <div class="empty">Este produto não está mais disponível. <button type="button" class="link" (click)="ir('loja')">Voltar à loja</button></div>
  </section>
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
    <form (ngSubmit)="registrar()">
      <label>Tipo de cadastro
        <select name="tipoCadastro" [(ngModel)]="novoTipo">
          <option value="PF">Pessoa física (CPF)</option>
          <option value="PJ">Pessoa jurídica (CNPJ)</option>
        </select>
      </label>
      <label>{{novoTipo==='PJ'?'Razão social':'Nome completo'}}
        <input name="nome" required [(ngModel)]="novoNome" [placeholder]="novoTipo==='PJ'?'Nome da empresa':'Nome completo'"/>
      </label>
      <label>E-mail<input name="email" type="email" required [(ngModel)]="novoEmail"/></label>
      <label *ngIf="novoTipo==='PF'">CPF
        <input name="cpf" required [(ngModel)]="novoCpf" placeholder="000.000.000-00" inputmode="numeric"/>
      </label>
      <ng-container *ngIf="novoTipo==='PJ'">
        <label>CNPJ
          <input name="cnpj" required [(ngModel)]="novoCnpj" placeholder="00.000.000/0000-00" maxlength="18"/>
        </label>
        <label>Inscrição estadual (opcional)
          <input name="ie" [(ngModel)]="novaIe" placeholder="Informe apenas se possuir IE"/>
        </label>
        <label *ngIf="novaIe.trim()">UF da inscrição estadual
          <select name="ieUf" required [(ngModel)]="novaIeUf">
            <option value="">Selecione o estado</option>
            <option *ngFor="let uf of ufs" [value]="uf">{{uf}}</option>
          </select>
        </label>
      </ng-container>
      <label>Senha (mínimo 8 caracteres)<input name="senha" type="password" required minlength="8" [(ngModel)]="novaSenha"/></label>
      <button type="submit" class="button full" [disabled]="enviando">{{enviando?'Cadastrando...':'Criar conta'}}</button>
    </form><p class="muted">Já tem uma conta? <button class="link" (click)="ir('login')">Entrar</button></p>
  </div></div>
  <app-carrinho *ngIf="pagina==='carrinho'" [itens]="carrinho" (atualizar)="atualizarQuantidade($event)" (remover)="remover($event)" (concluir)="compraConcluida()" (navegar)="ir($event)"/>
  <section class="section narrow" *ngIf="pagina==='favoritos'">
    <div class="eyebrow purple">SUA CONTA</div><h2>Meus favoritos</h2>
    <p class="muted" *ngIf="erroFavoritos">{{erroFavoritos}}</p>
    <div *ngIf="!produtosFavoritos.length" class="empty">Você ainda não salvou nenhum produto. Clique no coração para adicionar aos favoritos.</div>
    <div class="products" *ngIf="produtosFavoritos.length">
      <article class="product" *ngFor="let p of produtosFavoritos">
        <button type="button" class="favorite-heart is-favorite" (click)="alternarFavorito(p)" [attr.aria-label]="'Remover '+p.nome+' dos favoritos'">♥</button>
        <a class="product-image-link favorite-image" [href]="'#/produto/'+p.id" (click)="abrirProduto(p)">
          <img [src]="p.imagem || imagemPadrao(p)" [alt]="p.nome" (error)="imagemQuebrou($event,p)"/>
        </a>
        <div class="product-body">
          <div class="meta">{{p.plataforma}} · {{p.categoria==='JOGO'?'Jogo':p.categoria==='CONSOLE'?'Console':'Acessório'}}</div>
          <h3><a [href]="'#/produto/'+p.id" (click)="abrirProduto(p)">{{p.nome}}</a></h3>
          <span class="stock">{{p.estoque>0?'Disponível':'Sem estoque'}}</span>
          <div class="price">{{p.preco | currency:'BRL'}}</div>
          <button class="button full" type="button" [disabled]="p.estoque<1" (click)="adicionar(p)">Adicionar ao carrinho</button>
        </div>
      </article>
    </div>
  </section>
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
<div class="cart-widget" *ngIf="pagina!=='carrinho'">
  <div class="cart-backdrop" *ngIf="resumoCarrinhoAberto" (click)="resumoCarrinhoAberto=false"></div>
  <aside class="cart-popover" *ngIf="resumoCarrinhoAberto" aria-label="Resumo do carrinho" role="dialog" aria-modal="false">
    <div class="cart-popover-head">
      <div><strong>Meu carrinho</strong><span>{{quantidade}} {{quantidade===1?'item':'itens'}}</span></div>
      <button type="button" class="cart-icon-button" (click)="resumoCarrinhoAberto=false" aria-label="Fechar carrinho">×</button>
    </div>
    <div class="cart-popover-body">
      <div *ngIf="!carrinho.length" class="cart-empty">Seu carrinho está vazio. Que tal escolher um jogo?</div>
      <div class="cart-mini-item" *ngFor="let item of carrinho">
        <div class="cart-mini-thumb">
          <img [src]="item.produto.imagem || imagemPadrao(item.produto)" [alt]="item.produto.nome" (error)="imagemQuebrou($event,item.produto)"/>
        </div>
        <div class="cart-mini-info">
          <strong>{{item.produto.nome}}</strong>
          <span>{{item.produto.preco | currency:'BRL'}}</span>
          <div class="cart-mini-actions">
            <button type="button" (click)="atualizarQuantidade({id:item.produto.id,delta:-1})" [disabled]="item.quantidade<=1" [attr.aria-label]="'Diminuir '+item.produto.nome">−</button>
            <span>{{item.quantidade}}</span>
            <button type="button" (click)="atualizarQuantidade({id:item.produto.id,delta:1})" [disabled]="item.quantidade>=item.produto.estoque" [attr.aria-label]="'Aumentar '+item.produto.nome">+</button>
            <button type="button" class="cart-mini-remove" (click)="remover(item.produto.id)">Remover</button>
          </div>
        </div>
      </div>
    </div>
    <div class="cart-popover-foot" *ngIf="carrinho.length">
      <div class="cart-mini-total"><span>Subtotal</span><strong>{{subtotal | currency:'BRL'}}</strong></div>
      <button type="button" class="button full" (click)="abrirPagamento()">Continuar para o pagamento</button>
      <small>Compra demonstrativa, sem cobrança real.</small>
    </div>
  </aside>
  <button type="button" class="cart-fab" (click)="resumoCarrinhoAberto=!resumoCarrinhoAberto" [attr.aria-expanded]="resumoCarrinhoAberto" aria-label="Abrir resumo do carrinho" title="Meu carrinho">
    <svg viewBox="0 0 24 24" width="27" height="27" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/>
    </svg>
    <span class="cart-fab-count" *ngIf="quantidade">{{quantidade}}</span>
  </button>
</div>
<footer class="footer"><div class="container foot-row"><div><strong>GAMESTORE</strong><p>Seu lugar para jogos, consoles e acessórios.</p></div>
  <div><strong>Sua próxima aventura começa aqui.</strong><p>Projeto acadêmico · Compras e pagamentos demonstrativos, sem cobrança real.</p></div>
</div></footer>
`})
export class AppComponent implements OnInit {
  pagina='loja';produtos:Produto[]=[];carrinho:Linha[]=[];pedidos:Pedido[]=[];
  resumoCarrinhoAberto=false;
  favoritos:number[]=[];erroFavoritos='';
  carregando=true;erroProdutos='';erroAuth='';erroPedidos='';enviando=false;
  loginEmail='';loginSenha='';novoNome='';novoEmail='';novoCpf='';novaSenha='';
  novoTipo:'PF'|'PJ'='PF';novoCnpj='';novaIe='';novaIeUf='';
  ufs=['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];
  senhaExclusao='';confirmacaoExclusao='';erroExclusao='';excluindo=false;
  constructor(public api:ApiService) { }
  async ngOnInit(){await this.api.restaurar();await this.carregarProdutos();await this.carregarFavoritos();this.sincronizarProdutoPelaUrl();}
  @HostListener('window:hashchange')
  aoMudarEndereco(){
    this.sincronizarProdutoPelaUrl();
  }
  get produtoSelecionado():Produto|null{
    return this.produtos.find(p=>p.id===this.produtoIdSelecionado) || null;
  }
  produtoIdSelecionado:number|null=null;
  sincronizarProdutoPelaUrl(){
    const rota=window.location.hash.match(/^#\/produto\/(\d+)$/);
    if(rota){
      this.produtoIdSelecionado=Number(rota[1]);
      this.resumoCarrinhoAberto=false;
      this.pagina='produto';
    }else if(this.pagina==='produto'){
      this.produtoIdSelecionado=null;
      this.pagina='loja';
    }
  }
  abrirProduto(produto:Produto){
    this.produtoIdSelecionado=produto.id;
    this.pagina='produto';this.resumoCarrinhoAberto=false;
    window.location.hash='/produto/'+produto.id;
    window.scrollTo(0,0);
  }
  adicionarVarios(dados:{produto:Produto;quantidade:number}){
    for(let i=0;i<dados.quantidade;i++)this.adicionar(dados.produto);
  }
  async carregarProdutos(){this.carregando=true;try{this.produtos=await this.api.get<Produto[]>('/loja/produtos');this.erroProdutos='';}
    catch(e){this.erroProdutos=(e as Error).message;}finally{this.carregando=false;}}
  get produtosFavoritos(){return this.produtos.filter(p=>this.favoritos.includes(p.id));}
  async carregarFavoritos(){
    this.favoritos=[];this.erroFavoritos='';
    if(this.api.usuario()?.perfil!=='CLIENTE')return;
    try{this.favoritos=await this.api.get<number[]>('/loja/favoritos');}
    catch(e){this.erroFavoritos=(e as Error).message;}
  }
  async alternarFavorito(p:Produto){
    if(this.api.usuario()?.perfil!=='CLIENTE'){
      alert('Entre com uma conta de cliente para salvar favoritos.');
      await this.ir('login');
      return;
    }
    const antes=[...this.favoritos],jaFavorito=antes.includes(p.id);
    this.favoritos=jaFavorito?antes.filter(id=>id!==p.id):[...antes,p.id];
    try{
      if(jaFavorito)await this.api.del('/loja/favoritos/'+p.id);
      else await this.api.post('/loja/favoritos/'+p.id,{});
    }catch(e){this.favoritos=antes;alert((e as Error).message);}
  }
  get quantidade(){return this.carrinho.reduce((s,i)=>s+i.quantidade,0);}
  get subtotal(){return this.carrinho.reduce((total,item)=>total+item.produto.preco*item.quantidade,0);}
  imagemPadrao(p:Produto){return '/assets/placeholder-'+(p.categoria==='CONSOLE'?'console':p.categoria==='ACESSORIO'?'acessorio':'jogo')+'.svg';}
  imagemQuebrou(event:Event,p:Produto){
    const img=event.target as HTMLImageElement;
    const fallback=this.imagemPadrao(p);
    if(!img.src.endsWith(fallback))img.src=fallback;
  }
  abrirPagamento(){this.resumoCarrinhoAberto=false;void this.ir('carrinho');}
  async ir(pagina:string){
    this.resumoCarrinhoAberto=false;
    if(window.location.hash.startsWith('#/produto/')){
      history.pushState(null,'',window.location.pathname+window.location.search);
    }
    this.produtoIdSelecionado=null;
    this.pagina=pagina;this.erroAuth='';window.scrollTo(0,0);
    if(pagina==='loja')await this.carregarProdutos();
    if(pagina==='favoritos'){
      if(this.api.usuario()?.perfil!=='CLIENTE'){this.pagina='login';return;}
      await this.carregarProdutos();await this.carregarFavoritos();
    }
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
      await this.api.post('/auth/registro',{
        nome:this.novoNome,email:this.novoEmail,senha:this.novaSenha,tipo:this.novoTipo,
        cpf:this.novoTipo==='PF'?this.novoCpf:null,
        cnpj:this.novoTipo==='PJ'?this.novoCnpj:null,
        ie:this.novoTipo==='PJ'?this.novaIe:null,
        ieUf:this.novoTipo==='PJ'?this.novaIeUf:null
      });
      this.loginEmail=this.novoEmail;this.loginSenha=this.novaSenha;await this.api.entrar(this.loginEmail,this.loginSenha);
      await this.carregarFavoritos();await this.ir(this.carrinho.length?'carrinho':'loja');
    }catch(e){this.erroAuth=(e as Error).message;}finally{this.enviando=false;}}
  async entrar(){this.enviando=true;this.erroAuth='';try{
      const usuario=await this.api.entrar(this.loginEmail,this.loginSenha);
      await this.carregarFavoritos();await this.ir(usuario.perfil==='ADMIN'?'admin':this.carrinho.length?'carrinho':'loja');
    }catch(e){this.erroAuth=(e as Error).message;}finally{this.enviando=false;}}
  async excluirMinhaConta(){
    if(this.excluindo || this.confirmacaoExclusao!=='EXCLUIR MINHA CONTA')return;
    this.erroExclusao='';this.excluindo=true;
    try {
      await this.api.delComCorpo<void>('/auth/minha-conta',{senha:this.senhaExclusao,confirmacao:this.confirmacaoExclusao});
      await this.api.sair();
      this.senhaExclusao='';this.confirmacaoExclusao='';this.loginSenha='';this.carrinho=[];this.pedidos=[];this.favoritos=[];
      await this.ir('loja');
      alert('Sua conta e os dados associados foram excluídos do banco ativo.');
    }catch(e){this.erroExclusao=(e as Error).message;}
    finally{this.excluindo=false;}
  }
  async sair(){await this.api.sair();this.favoritos=[];await this.ir('loja');}
}
