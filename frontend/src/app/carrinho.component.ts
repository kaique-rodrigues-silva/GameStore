import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, Linha, Produto } from './api.service';

interface EnderecoViaCep {
  erro?: boolean;
  cep?: string;
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
}

@Component({selector:'app-carrinho',standalone:true,imports:[CommonModule,FormsModule],template:`
<section class="section narrow"><div class="eyebrow purple">SUA COMPRA</div><h2>Carrinho e pagamento</h2>
  <div class="alert" *ngIf="sucesso">Pedido #{{sucesso}} confirmado. Pagamento apenas demonstrativo.</div>
  <div class="alert error" *ngIf="erro">{{erro}}</div>
  <div *ngIf="!itens.length && !sucesso" class="empty">Seu carrinho está vazio. Escolha um jogo para começar.</div>
  <div *ngIf="itens.length" class="checkout-layout">
    <div><article class="cart-line" *ngFor="let item of itens">
      <div><strong>{{item.produto.nome}}</strong><div class="meta">{{item.produto.plataforma}}</div></div>
      <div class="qty"><button type="button" (click)="mudar(item,-1)">−</button><span>{{item.quantidade}}</span><button type="button" (click)="mudar(item,1)">+</button></div>
      <strong>{{precoAtual(item.produto) * item.quantidade | currency:'BRL'}}</strong>
      <button class="link" (click)="remover.emit(item.produto.id)">Remover</button>
    </article></div>
    <div class="panel"><h3>Resumo do pedido</h3><div class="between">Total <strong>{{total | currency:'BRL'}}</strong></div>
      <p class="muted">Esta é uma compra de demonstração. Não há cobrança real.</p>
      <div *ngIf="!api.usuario()" class="alert">Entre na sua conta para continuar.</div>
      <button *ngIf="!api.usuario()" class="button full" (click)="navegar.emit('login')">Entrar para comprar</button>
      <form *ngIf="api.usuario()?.perfil==='CLIENTE'" (ngSubmit)="confirmar()">
        <h3>Endereço de entrega</h3>
        <label>CEP *
          <input name="cep" type="text" inputmode="numeric" autocomplete="postal-code" placeholder="00000-000" maxlength="9"
            [ngModel]="cep" (ngModelChange)="alterarCep($event)" (blur)="consultarCep()" required/>
        </label>
        <p class="muted" *ngIf="buscandoCep">Buscando endereço pelo CEP...</p>
        <p class="muted" *ngIf="cepValidado && !buscandoCep">Endereço encontrado. Confira os campos abaixo e informe o número.</p>
        <div class="alert error" *ngIf="erroCep">{{erroCep}}</div>
        <button type="button" class="link" (click)="consultarCep()" [disabled]="buscandoCep || somenteNumeros(cep).length!==8">Buscar CEP novamente</button>
        <label>Rua / Avenida *
          <input name="logradouro" [(ngModel)]="logradouro" autocomplete="address-line1" required maxlength="200" placeholder="Logradouro"/>
        </label>
        <label>Número *
          <input name="numero" [(ngModel)]="numero" autocomplete="address-line2" required maxlength="20" placeholder="Número ou S/N"/>
        </label>
        <label>Bairro *
          <input name="bairro" [(ngModel)]="bairro" required maxlength="120"/>
        </label>
        <label>Cidade *
          <input name="cidade" [(ngModel)]="cidade" autocomplete="address-level2" required maxlength="120"/>
        </label>
        <label>Estado (UF) *
          <input name="uf" [(ngModel)]="uf" autocomplete="address-level1" required minlength="2" maxlength="2" placeholder="SP"/>
        </label>
        <label>Complemento (opcional)
          <input name="complemento" [(ngModel)]="complemento" maxlength="150" placeholder="Apartamento, bloco, casa..."/>
        </label>
        <label>Ponto de referência (opcional)
          <input name="referencia" [(ngModel)]="referencia" maxlength="200" placeholder="Próximo à praça, portaria..."/>
        </label>
        <label>Forma de pagamento
          <select name="pagamento" [(ngModel)]="pagamento">
            <option value="PIX">Pix</option><option value="CREDITO">Cartão de crédito</option>
            <option value="DEBITO">Cartão de débito</option><option value="DINHEIRO">Dinheiro</option>
          </select>
        </label>
        <button class="button full" type="submit" [disabled]="enviando || buscandoCep">{{enviando?'Confirmando...':'Confirmar pedido demonstrativo'}}</button>
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

  cep='';logradouro='';numero='';bairro='';cidade='';uf='';complemento='';referencia='';
  cepValidado='';buscandoCep=false;erroCep='';
  pagamento='PIX';enviando=false;erro='';sucesso:number|null=null;
  private consultaAtual=0;

  constructor(public api:ApiService) { }
  precoAtual(p:Produto){return p.precoPromocional!=null && p.precoPromocional>=0 && p.precoPromocional<p.preco?p.precoPromocional:p.preco;}
  get total(){return this.itens.reduce((s,i)=>s+this.precoAtual(i.produto)*i.quantidade,0);}
  mudar(item:Linha,delta:number){this.atualizar.emit({id:item.produto.id,delta});}

  somenteNumeros(valor:string){return (valor||'').replace(/\D/g,'');}

  alterarCep(valor:string){
    const digits=this.somenteNumeros(valor).slice(0,8);
    this.cep=digits.length>5?digits.slice(0,5)+'-'+digits.slice(5):digits;
    if(this.cepValidado!==digits){
      this.cepValidado='';
      this.logradouro='';this.bairro='';this.cidade='';this.uf='';
      this.erroCep='';this.consultaAtual++;
      this.buscandoCep=false;
    }
    if(digits.length===8 && !this.cepValidado)void this.consultarCep();
  }

  async consultarCep(){
    const cep=this.somenteNumeros(this.cep);
    if(cep.length!==8){
      if(cep.length>0)this.erroCep='Informe um CEP com 8 números.';
      return;
    }
    if(this.buscandoCep || this.cepValidado===cep)return;
    const consulta=++this.consultaAtual;
    this.buscandoCep=true;this.erroCep='';
    try {
      const resposta=await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      if(!resposta.ok)throw new Error('Falha na consulta do CEP');
      const dados:EnderecoViaCep=await resposta.json();
      if(consulta!==this.consultaAtual || this.somenteNumeros(this.cep)!==cep)return;
      if(dados.erro || !dados.localidade || !dados.uf){
        this.erroCep='CEP não encontrado. Confira o número e tente novamente.';
        return;
      }
      this.logradouro=dados.logradouro||'';
      this.bairro=dados.bairro||'';
      this.cidade=dados.localidade;
      this.uf=dados.uf;
      this.cepValidado=cep;
    }catch{
      if(consulta===this.consultaAtual)this.erroCep='Não foi possível consultar o CEP agora. Verifique sua conexão e tente novamente.';
    }finally{
      if(consulta===this.consultaAtual)this.buscandoCep=false;
    }
  }

  async confirmar(){
    this.erro='';
    if(this.somenteNumeros(this.cep).length!==8 || this.cepValidado!==this.somenteNumeros(this.cep)){
      this.erro='Digite um CEP válido e aguarde a confirmação do endereço.';return;
    }
    if(!this.logradouro.trim() || !this.numero.trim() || !this.bairro.trim() || !this.cidade.trim() || !/^[A-Za-z]{2}$/.test(this.uf.trim())){
      this.erro='Preencha rua, número, bairro, cidade e UF.';return;
    }
    const partes=[
      `${this.logradouro.trim()}, ${this.numero.trim()}`,
      this.complemento.trim() ? `Complemento: ${this.complemento.trim()}` : '',
      this.bairro.trim(),
      `${this.cidade.trim()}/${this.uf.trim().toUpperCase()}`,
      `CEP: ${this.cep}`,
      this.referencia.trim() ? `Referência: ${this.referencia.trim()}` : ''
    ];
    const endereco=partes.filter(Boolean).join(' | ');
    if(endereco.length>1500){this.erro='Endereço muito longo. Reduza os detalhes.';return;}
    this.enviando=true;
    try {
      const r=await this.api.post<{pedidoId:number}>('/loja/comprar',{pagamento:this.pagamento,endereco,
        itens:this.itens.map(i=>({produtoId:i.produto.id,quantidade:i.quantidade}))});
      this.sucesso=r.pedidoId;this.concluir.emit();
    } catch(e){this.erro=(e as Error).message;}finally{this.enviando=false;}
  }
}
