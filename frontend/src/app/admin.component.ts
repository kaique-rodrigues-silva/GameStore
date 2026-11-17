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
        <label>Preço (R$) <input required name="preco" type="number" min="0" step="0.01" [(ngModel)]="produtoForm.preco"/></label>
        <label>Estoque <input required name="estoque" type="number" min="0" step="1" [(ngModel)]="produtoForm.estoque"/></label>
        <label>URL da imagem (opcional) <input name="imagem" [(ngModel)]="produtoForm.imagem" placeholder="Deixe em branco para usar a ilustração padrão"/></label>
        <p class="muted">Sem imagem? A vitrine usa automaticamente uma ilustração de jogo, console ou acessório, conforme a categoria.</p>
        <label>Descrição <textarea name="descricao" [(ngModel)]="produtoForm.descricao" rows="2"></textarea></label>
        <button class="button full" type="submit">{{produtoId?'Salvar alterações':'Cadastrar produto'}}</button>
        <button type="button" class="link" (click)="limparProduto()" *ngIf="produtoId">Cancelar edição</button>
      </form>
    </div>
    <div class="panel"><h3>Produtos cadastrados</h3><div class="admin-row" *ngFor="let p of produtos">
      <div><strong>{{p.nome}}</strong><div class="meta">{{p.plataforma}} · {{p.preco | currency:'BRL'}} · Estoque: {{p.estoque}} · {{p.ativo?'Ativo':'Arquivado'}}</div></div>
      <div><button class="link" (click)="editarProduto(p)">Editar</button> <button class="link danger" (click)="excluirProduto(p)">Excluir</button></div>
    </div></div>
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
      <strong>{{p.total | currency:'BRL'}}</strong>
    </div><div *ngIf="pedidos.length===0" class="empty">Nenhum pedido por enquanto.</div>
  </div>
</section>
`})
export class AdminComponent implements OnInit {
  aba='resumo';erro='';aviso='';
  resumo:{produtos?:number;clientes?:number;pedidos?:number;faturamento?:number}={};
  produtos:Produto[]=[];pedidos:(Pedido&{clienteId:number})[]=[];
  usuarios:{id:number;nome:string;email:string;perfil:string;tipo:string;ativo:boolean}[]=[];
  plataformasJogo=['PS5','PS4','PS3','Xbox Series X|S','Xbox One','Xbox 360','Nintendo Switch','Nintendo Switch 2','PC','Nintendo 3DS','Nintendo Wii','Multiplataforma'];
  marcasConsole=['Sony / PlayStation','Microsoft / Xbox','Nintendo','Sega','Atari','Valve / Steam Deck','Outra'];
  produtoId:number|null=null;
  produtoForm=this.novoProduto();usuarioForm=this.novoUsuario();
  ufs=['SP','RJ','MG','ES','PR','SC','RS','BA','PE','CE','DF','GO','PA','AM','AC','AL','AP','MA','MT','MS','PB','PI','RN','RO','RR','SE','TO'];
  constructor(public api:ApiService) { }
  novoProduto(){return {nome:'',categoria:'JOGO',plataforma:'',condicao:'NOVO',preco:0,estoque:1,imagem:'',descricao:''};}
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
    preco:p.preco,estoque:p.estoque,imagem:p.imagem||'',descricao:p.descricao||''};}
  async salvarProduto(){
    this.aviso='';this.erro='';
    try {
      if(this.produtoId)await this.api.put(`/admin/produtos/${this.produtoId}`,this.produtoForm);
      else await this.api.post('/admin/produtos',this.produtoForm);
      this.aviso='Produto salvo.';this.limparProduto();await this.carregar();
    }catch(e){this.aviso='';this.erro=(e as Error).message;}
  }
  async excluirProduto(p:Produto){
    if(!confirm(`Excluir ou arquivar ${p.nome}?`))return;
    try{await this.api.del(`/admin/produtos/${p.id}`);this.aviso='Produto atualizado.';await this.carregar();}
    catch(e){this.erro=(e as Error).message;}
  }
  async salvarUsuario(){try{
      await this.api.post('/admin/usuarios',this.usuarioForm);this.aviso='Usuário cadastrado.';this.erro='';
      this.usuarioForm=this.novoUsuario();await this.carregar();
    }catch(e){this.erro=(e as Error).message;}}
  async alternarConta(u:{id:number;nome:string;ativo:boolean}){
    try{await this.api.put(`/admin/usuarios/${u.id}`,{ativo:!u.ativo});this.aviso='Conta atualizada.';await this.carregar();}
    catch(e){this.erro=(e as Error).message;}
  }
}
