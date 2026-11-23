import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, Produto, Pedido } from './api.service';

@Component({selector:'app-admin',standalone:true,imports:[CommonModule,FormsModule],template:`
<section class="section admin-area"><div class="eyebrow purple">PAINEL ADMINISTRATIVO</div><h2>Gestão da GameStore</h2>
  <nav class="filters"><button [class.active]="aba==='resumo'" (click)="aba='resumo'">Visão geral</button>
    <button [class.active]="aba==='produtos'" (click)="aba='produtos'">Produtos</button>
    <button [class.active]="aba==='usuarios'" (click)="aba='usuarios'">Usuários e clientes</button>
    <button [class.active]="aba==='pedidos'" (click)="aba='pedidos'">Pedidos</button>
  </nav>
  <div class="alert error" *ngIf="erro">{{erro}}</div><div class="alert" *ngIf="aviso">{{aviso}}</div>
  <div *ngIf="aba==='resumo' || aba==='produtos'" class="low-stock-panel" [class.no-alerts]="produtosEstoqueBaixo.length===0">
    <div class="low-stock-title">
      <strong>Estoque baixo · Produtos novos</strong>
      <span>{{produtosEstoqueBaixo.length}} {{produtosEstoqueBaixo.length===1?'produto':'produtos'}}</span>
    </div>
    <p class="muted" *ngIf="!produtosEstoqueBaixo.length">Nenhum produto novo com estoque baixo.</p>
    <div *ngIf="produtosEstoqueBaixo.length" class="low-stock-list">
      <div *ngFor="let p of produtosEstoqueBaixo" class="low-stock-item">
        <span>{{p.nome}}</span>
        <strong>{{p.estoque}} {{p.estoque===1?'unidade':'unidades'}}</strong>
        <button type="button" class="link" (click)="irParaProduto(p)">Editar</button>
      </div>
    </div>
    <p class="muted">Alerta para produtos novos com até 5 unidades. Seminovos não entram neste controle.</p>
  </div>
  <div *ngIf="aba==='resumo'" class="stat-grid">
    <div class="stat"><span>Produtos ativos</span><strong>{{resumo.produtos || 0}}</strong></div>
    <div class="stat"><span>Clientes</span><strong>{{resumo.clientes || 0}}</strong></div>
    <div class="stat"><span>Pedidos</span><strong>{{resumo.pedidos || 0}}</strong></div>
    <div class="stat"><span>Faturamento demonstrativo</span><strong>{{(resumo.faturamento || 0) | currency:'BRL'}}</strong></div>
  </div>
  <div *ngIf="aba==='produtos'" class="admin-grid">
    <div class="panel"><h3>{{produtoId?'Editar produto':'Cadastrar produto'}}</h3>
      <form (ngSubmit)="salvarProduto()">
        <label>Nome <input required name="nome" [(ngModel)]="produtoForm.nome"/></label>
        <label>Categoria <select name="categoria" [(ngModel)]="produtoForm.categoria" (ngModelChange)="trocarCategoria($event)"><option value="JOGO">Jogo</option><option value="CONSOLE">Console</option><option value="ACESSORIO">Acessório</option></select></label>
        <label *ngIf="produtoForm.categoria==='JOGO'">Plataforma
          <input name="plataformaJogo" [(ngModel)]="produtoForm.plataforma" list="opcoes-plataformas" maxlength="120" placeholder="Ex.: PS5, Xbox, PC"/>
          <datalist id="opcoes-plataformas"><option *ngFor="let plataforma of plataformasJogo" [value]="plataforma"></option></datalist>
        </label>
        <label *ngIf="produtoForm.categoria==='CONSOLE'">Marca / Empresa
          <input name="marcaConsole" [(ngModel)]="produtoForm.plataforma" list="opcoes-marcas" maxlength="120" placeholder="Ex.: Nintendo, Sony, Microsoft"/>
          <datalist id="opcoes-marcas"><option *ngFor="let marca of marcasConsole" [value]="marca"></option></datalist>
        </label>
        <label *ngIf="produtoForm.categoria==='ACESSORIO'">Marca
          <input name="marcaAcessorio" [(ngModel)]="produtoForm.plataforma" placeholder="Ex.: Sony, Logitech, HyperX" maxlength="120"/>
        </label>
        <label>Condição <select name="condicao" [(ngModel)]="produtoForm.condicao"><option value="NOVO">Novo</option><option value="USADO">Seminovo</option></select></label>
        <label>Preço normal (R$) <input required name="preco" type="number" min="0" step="0.01" [(ngModel)]="produtoForm.preco"/></label>
        <label class="offer-input-label">Preço promocional (R$) · opcional
          <input name="precoPromocional" type="number" min="0" step="0.01" [ngModel]="produtoForm.precoPromocional" (ngModelChange)="produtoForm.precoPromocional=$event===''?null:$event" placeholder="Deixe em branco se não estiver em promoção"/>
        </label>
        <p class="muted">Para criar uma oferta, informe um valor menor que o preço normal. Apague o valor para encerrar a promoção.</p>
        <label>Estoque <input required name="estoque" type="number" min="0" step="1" [(ngModel)]="produtoForm.estoque"/></label>
        <label>URL da imagem (opcional)
          <textarea class="admin-image-url" name="imagem" [(ngModel)]="produtoForm.imagem" rows="3" placeholder="Cole a URL da imagem"></textarea>
        </label>
        <label>Descrição
          <textarea class="admin-description" name="descricao" [(ngModel)]="produtoForm.descricao" rows="4" maxlength="2000" placeholder="Descreva o produto"></textarea>
        </label>
        <button class="button full" type="submit">{{produtoId?'Salvar alterações':'Cadastrar produto'}}</button>
        <button type="button" class="link" (click)="limparProduto()" *ngIf="produtoId">Cancelar edição</button>
      </form>
    </div>
    <div class="panel"><h3>Produtos cadastrados</h3><div class="admin-row product-admin-row" *ngFor="let p of produtos">
      <div class="admin-product-info">
        <strong>{{p.nome}}</strong>
        <div class="meta">{{p.plataforma}} · {{p.precoEfetivo??p.preco | currency:'BRL'}} <span *ngIf="p.precoPromocional!=null && p.precoPromocional<p.preco" class="admin-offer-status">Em oferta</span> · Estoque: {{p.estoque}} · {{p.ativo?'Ativo':'Arquivado'}}</div>
      </div>
      <div class="admin-product-actions">
        <button type="button" class="admin-action edit" (click)="editarProduto(p)" [disabled]="processandoProduto===p.id">Editar</button>
        <button type="button" class="admin-action archive" (click)="alterarArquivo(p)" [disabled]="processandoProduto===p.id">{{p.ativo?'Arquivar':'Reativar'}}</button>
        <button type="button" class="admin-action delete" (click)="excluirProduto(p)" [disabled]="processandoProduto===p.id">Excluir</button>
      </div>
    </div>
    <p class="muted" *ngIf="!produtos.length">Nenhum produto cadastrado.</p></div>
  </div>
  <div *ngIf="aba==='usuarios'" class="admin-grid">
    <div class="panel"><h3>Cadastrar usuário pelo administrador</h3>
      <form (ngSubmit)="salvarUsuario()">
        <label>Nome / Razão social <input name="uNome" required [(ngModel)]="usuarioForm.nome"/></label>
        <label>E-mail <input name="uEmail" required type="email" [(ngModel)]="usuarioForm.email"/></label>
        <label>Senha (mínimo 8 caracteres) <input name="uSenha" required type="password" [(ngModel)]="usuarioForm.senha"/></label>
        <label>Perfil <select name="uPerfil" [(ngModel)]="usuarioForm.perfil"><option value="CLIENTE">Cliente</option><option value="ADMIN">Administrador</option></select></label>
        <label>Tipo <select name="uTipo" [(ngModel)]="usuarioForm.tipo"><option value="PF">Pessoa física</option><option value="PJ">Pessoa jurídica</option></select></label>
        <ng-container *ngIf="usuarioForm.tipo==='PF'">
          <label>CPF <input name="uCpf" required [(ngModel)]="usuarioForm.cpf"/></label>
          <label>RG (opcional) <input name="uRg" [(ngModel)]="usuarioForm.rg"/></label>
          <label>UF do RG <select name="uRgUf" [(ngModel)]="usuarioForm.rgUf"><option *ngFor="let uf of ufs" [value]="uf">{{uf}}</option></select></label>
        </ng-container>
        <ng-container *ngIf="usuarioForm.tipo==='PJ'">
          <label>CNPJ <input name="uCnpj" required [(ngModel)]="usuarioForm.cnpj"/></label>
          <label>IE (opcional) <input name="uIe" [(ngModel)]="usuarioForm.ie"/></label>
          <label>UF da IE <select name="uIeUf" [(ngModel)]="usuarioForm.ieUf"><option *ngFor="let uf of ufs" [value]="uf">{{uf}}</option></select></label>
        </ng-container>
        <button class="button full" type="submit">Cadastrar usuário</button>
      </form>
    </div>
    <div class="panel"><h3>Usuários existentes</h3>
      <div class="admin-row" *ngFor="let u of usuarios"><div><strong>{{u.nome}}</strong><div class="meta">{{u.email}} · {{u.perfil}} · {{u.tipo}} · {{u.ativo?'Ativo':'Desativado'}}</div></div>
        <button class="link" (click)="alternarConta(u)">{{u.ativo?'Desativar':'Ativar'}}</button>
      </div>
      <p class="muted">A desativação preserva o histórico dos pedidos.</p>
    </div>
  </div>
  <div *ngIf="aba==='pedidos'" class="panel"><h3>Pedidos registrados</h3>
    <div class="admin-row" *ngFor="let p of pedidos"><div><strong>Pedido #{{p.id}}</strong>
      <div class="meta">Cliente ID: {{p.clienteId}} · {{p.pagamento}} · {{p.data}}</div>
      <div class="meta" *ngFor="let item of p.itens">{{item.quantidade}}× {{item.nome}}</div></div>
      <div class="admin-order-actions">
        <strong>{{p.total | currency:'BRL'}}</strong>
        <button type="button" class="link danger" *ngIf="p.id===2" (click)="excluirPedidoDois()" [disabled]="excluindoPedido">
          {{excluindoPedido?'Excluindo...':'Excluir pedido #2'}}
        </button>
      </div>
    </div><div *ngIf="pedidos.length===0" class="empty">Nenhum pedido por enquanto.</div>
  </div>
</section>
`})
export class AdminComponent implements OnInit {
  aba='resumo';erro='';aviso='';
  excluindoPedido=false;
  processandoProduto:number|null=null;
  resumo:{produtos?:number;clientes?:number;pedidos?:number;faturamento?:number}={};
  produtos:Produto[]=[];pedidos:(Pedido&{clienteId:number})[]=[];
  usuarios:{id:number;nome:string;email:string;perfil:string;tipo:string;ativo:boolean}[]=[];
  plataformasJogo=['PS5','PS4','PS3','Xbox Series X|S','Xbox One','Xbox 360','Nintendo Switch','Nintendo Switch 2','PC','Nintendo 3DS','Nintendo Wii','Multiplataforma'];
  marcasConsole=['Sony / PlayStation','Microsoft / Xbox','Nintendo','Sega','Atari','Valve / Steam Deck','Outra'];
  get produtosEstoqueBaixo():Produto[]{
    return this.produtos.filter(p=>p.ativo && p.condicao==='NOVO' && p.estoque<=5)
      .sort((a,b)=>a.estoque-b.estoque || a.nome.localeCompare(b.nome,'pt-BR'));
  }
  irParaProduto(p:Produto){this.aba='produtos';this.editarProduto(p);window.scrollTo(0,0);}
  produtoId:number|null=null;
  produtoForm=this.novoProduto();usuarioForm=this.novoUsuario();
  ufs=['SP','RJ','MG','ES','PR','SC','RS','BA','PE','CE','DF','GO','PA','AM','AC','AL','AP','MA','MT','MS','PB','PI','RN','RO','RR','SE','TO'];
  constructor(public api:ApiService) { }
  novoProduto(){return {nome:'',categoria:'JOGO',plataforma:'',condicao:'NOVO',preco:0,precoPromocional:null as number|null,estoque:1,imagem:'',descricao:''};}
  trocarCategoria(categoria:string){
    this.produtoForm.plataforma='';
    this.produtoForm.categoria=categoria;
  }
  novoUsuario(){return {nome:'',email:'',senha:'',perfil:'CLIENTE',tipo:'PF',cpf:'',cnpj:'',rg:'',rgUf:'SP',ie:'',ieUf:'SP'};}
  ngOnInit(){void this.carregar();}
  async carregar(){
    this.erro='';try{
      const [resumo,produtos,usuarios,pedidos]=await Promise.all([
        this.api.get<typeof this.resumo>('/admin/resumo'),this.api.get<Produto[]>('/admin/produtos'),
        this.api.get<typeof this.usuarios>('/admin/usuarios'),this.api.get<typeof this.pedidos>('/admin/pedidos')]);
      this.resumo=resumo;this.produtos=produtos;this.usuarios=usuarios;this.pedidos=pedidos;
    }catch(e){this.erro=(e as Error).message;}
  }
  limparProduto(){this.produtoId=null;this.produtoForm=this.novoProduto();}
  editarProduto(p:Produto){this.produtoId=p.id;this.produtoForm={nome:p.nome,categoria:p.categoria,plataforma:p.plataforma,condicao:p.condicao,
    preco:p.preco,precoPromocional:p.precoPromocional??null,estoque:p.estoque,imagem:p.imagem||'',descricao:p.descricao||''};}
  async salvarProduto(){
    this.aviso='';this.erro='';
    try {
      if(this.produtoId)await this.api.put(`/admin/produtos/${this.produtoId}`,this.produtoForm);
      else await this.api.post('/admin/produtos',this.produtoForm);
      this.aviso='Produto salvo.';this.limparProduto();await this.carregar();
    }catch(e){this.aviso='';this.erro=(e as Error).message;}
  }
  async alterarArquivo(p:Produto){
    if(this.processandoProduto!==null)return;
    const estavaAtivo=p.ativo;
    const acao=estavaAtivo?'arquivar':'reativar';
    if(!confirm(`Deseja ${acao} "${p.nome}"? ${p.ativo?'Ele deixará de aparecer na loja, mas continuará disponível no painel administrativo.':'Ele voltará a aparecer na loja.'}`))return;
    this.processandoProduto=p.id;this.erro='';this.aviso='';
    try{
      await this.api.put(`/admin/produtos/${p.id}/situacao`,{ativo:!p.ativo});
      await this.carregar();
      this.aviso=estavaAtivo?'Produto arquivado.':'Produto reativado.';
    }catch(e){this.erro=(e as Error).message;}
    finally{this.processandoProduto=null;}
  }
  async excluirProduto(p:Produto){
    if(this.processandoProduto!==null)return;
    if(!confirm(`EXCLUIR "${p.nome}"?\\n\\nO produto desaparecerá da loja e da lista administrativa. A ação não poderá ser desfeita. O histórico das compras anteriores será preservado.`))return;
    this.processandoProduto=p.id;this.erro='';this.aviso='';
    try{
      await this.api.del(`/admin/produtos/${p.id}`);
      if(this.produtoId===p.id)this.limparProduto();
      await this.carregar();
      this.aviso='Produto excluído. Ele não aparecerá mais na lista.';
    }catch(e){this.erro=(e as Error).message;}
    finally{this.processandoProduto=null;}
  }
  async salvarUsuario(){try{
      await this.api.post('/admin/usuarios',this.usuarioForm);this.aviso='Usuário cadastrado.';this.erro='';
      this.usuarioForm=this.novoUsuario();await this.carregar();
    }catch(e){this.erro=(e as Error).message;}}
  async excluirPedidoDois(){
    if(this.excluindoPedido)return;
    const pedido=this.pedidos.find(p=>p.id===2);
    if(!pedido)return;
    const itens=pedido.itens.map(i=>i.quantidade+'× '+i.nome).join(', ');
    if(!confirm('Excluir DEFINITIVAMENTE somente o pedido #2?\\n\\nItens: '+itens+'\\n\\nAs quantidades serão devolvidas ao estoque. Esta ação não pode ser desfeita.'))return;
    this.excluindoPedido=true;this.erro='';this.aviso='';
    try{
      await this.api.del('/admin/pedidos/2');
      await this.carregar();
      this.aviso='Pedido #2 excluído e unidades devolvidas ao estoque.';
    }catch(e){this.erro=(e as Error).message;}
    finally{this.excluindoPedido=false;}
  }
  async alternarConta(u:{id:number;nome:string;ativo:boolean}){
    try{await this.api.put(`/admin/usuarios/${u.id}`,{ativo:!u.ativo});this.aviso='Conta atualizada.';await this.carregar();}
    catch(e){this.erro=(e as Error).message;}
  }
}
