let ultimaVenda = null;
let produtos = JSON.parse(localStorage.getItem("produtos")) || [];
let vendas = JSON.parse(localStorage.getItem("vendas")) || [];
let funcionarios = JSON.parse(localStorage.getItem("funcionarios")) || [];
let usuarioLogado = JSON.parse(localStorage.getItem("usuarioLogado")) || null;

let produtoSelecionado = null;
let produtoEditando = null;
let funcionarioEditando = null;

if (funcionarios.length === 0) {
  funcionarios.push({
    nome: "admin",
    sobrenome: "Sistema",
    senha: "1234",
    tipo: "admin"
  });

  localStorage.setItem("funcionarios", JSON.stringify(funcionarios));
}

garantirIdsProdutos();
verificarLogin();
atualizarLista();

function gerarId() {
  return Date.now().toString() + Math.random().toString(16).slice(2);
}

function garantirIdsProdutos() {
  let mudou = false;

  produtos.forEach(produto => {
    if (!produto.id) {
      produto.id = gerarId();
      mudou = true;
    }
  });

  if (mudou) {
    salvarProdutos();
  }
}

function verificarLogin() {
  const telaLogin = document.getElementById("telaLogin");
  const sistema = document.getElementById("sistema");

  if (usuarioLogado) {
    telaLogin.style.display = "none";
    sistema.style.display = "block";

    document.getElementById("nomeUsuarioLogado").innerText =
      `👤 Logado como: ${usuarioLogado.nome} ${usuarioLogado.sobrenome}`;

    const btnFuncionarios = document.getElementById("btnFuncionarios");
    const btnBackup = document.getElementById("btnBackup");
    const cardValor = document.getElementById("dashValor").parentElement;

    if (usuarioLogado.tipo !== "admin") {
      if (btnFuncionarios) btnFuncionarios.style.display = "none";
      if (btnBackup) btnBackup.style.display = "none";
      if (cardValor) cardValor.style.display = "none";
    } else {
      if (btnFuncionarios) btnFuncionarios.style.display = "inline-block";
      if (btnBackup) btnBackup.style.display = "inline-block";
      if (cardValor) cardValor.style.display = "";
    }

  } else {
    telaLogin.style.display = "flex";
    sistema.style.display = "none";
  }
}

function fazerLogin() {
  const nome = document.getElementById("loginNome").value.trim();
  const senha = document.getElementById("loginSenha").value.trim();

  const usuario = funcionarios.find(func =>
    func.nome.toLowerCase() === nome.toLowerCase() &&
    func.senha === senha
  );

  if (!usuario) {
    alert("Nome ou senha incorretos!");
    return;
  }

  usuarioLogado = usuario;
  localStorage.setItem("usuarioLogado", JSON.stringify(usuarioLogado));

  verificarLogin();
}

function sairSistema() {
  localStorage.removeItem("usuarioLogado");
  usuarioLogado = null;
  location.reload();
}

function adicionarProduto() {
  const nome = document.getElementById("nomeProduto").value.trim();
  const cor = document.getElementById("corProduto").value.trim();
  const categoria = document.getElementById("categoriaProduto").value;
  const quantidade = document.getElementById("quantidadeProduto").value;
  const preco = document.getElementById("precoProduto").value;
  const imagemArquivo = document.getElementById("imagemProduto").files[0];

  if (!nome || !cor || !categoria || !quantidade || !preco) {
    alert("Preencha nome, cor, categoria, quantidade e preço!");
    return;
  }

  if (imagemArquivo) {
    const leitor = new FileReader();

    leitor.onload = function (evento) {
      salvarNovoProduto(nome, cor, categoria, Number(quantidade), Number(preco), evento.target.result);
    };

    leitor.readAsDataURL(imagemArquivo);
  } else {
    salvarNovoProduto(nome, cor, categoria, Number(quantidade), Number(preco), "");
  }
}

function salvarNovoProduto(nome, cor, categoria, quantidade, preco, imagem) {
  produtos.push({
    id: gerarId(),
    nome,
    cor,
    categoria,
    quantidade,
    preco,
    imagem
  });

  salvarProdutos();
  atualizarLista();
  limparCampos();
}

function atualizarLista() {
  const lista = document.getElementById("listaProdutos");
  const total = document.getElementById("totalProdutos");
  const pesquisa = document.getElementById("pesquisaProduto").value.toLowerCase().trim();

  lista.innerHTML = "";
  let quantidadeExibida = 0;

  produtos.forEach((produto, index) => {
    if (
      pesquisa !== "" &&
      !produto.nome.toLowerCase().includes(pesquisa) &&
      !produto.cor.toLowerCase().includes(pesquisa) &&
      !(produto.categoria || "").toLowerCase().includes(pesquisa)
    ) {
      return;
    }

    quantidadeExibida++;

    const card = document.createElement("div");
    card.className = "card-produto";

    if (produto.quantidade <= 2) {
      card.classList.add("estoque-baixo");
    }

    card.innerHTML = `
      ${
        produto.imagem
          ? `<img src="${produto.imagem}" class="foto-produto">`
          : `<div class="sem-foto">Sem foto</div>`
      }

      <div class="info-produto">
        <h3>${produto.nome}</h3>
        <p><strong>Cor:</strong> ${produto.cor}</p>
        <p><strong>Categoria:</strong> ${produto.categoria || "Não definida"}</p>
        <p><strong>Quantidade:</strong> ${produto.quantidade}</p>
        <p><strong>Preço:</strong> R$ ${Number(produto.preco || 0).toFixed(2)}</p>

        ${produto.quantidade <= 2 ? `<p class="alerta">⚠ Estoque baixo</p>` : ""}

        <div class="ajustador-estoque">
          <button onclick="diminuirEstoque(${index})">-</button>
          <span>${produto.quantidade}</span>
          <button onclick="aumentarEstoque(${index})">+</button>
        </div>
      </div>

      <div class="botoes-card">
        <button class="btn-vender" onclick="abrirModalVenda(${index})">Vender</button>
        <button onclick="abrirModalEditar(${index})">Editar</button>
        <button class="btn-excluir" onclick="excluirProduto(${index})">Excluir</button>
      </div>
    `;

    lista.appendChild(card);
  });

  total.innerText = quantidadeExibida + " produtos";

  atualizarDashboard();
  atualizarVendas();
  atualizarEstoqueBaixo();
}

function aumentarEstoque(index) {
  produtos[index].quantidade++;
  salvarProdutos();
  atualizarLista();
}

function diminuirEstoque(index) {
  if (produtos[index].quantidade <= 0) {
    alert("A quantidade já está em 0!");
    return;
  }

  produtos[index].quantidade--;
  salvarProdutos();
  atualizarLista();
}

function abrirModalVenda(index) {
  produtoSelecionado = index;
  const produto = produtos[index];

  if (!usuarioLogado) {
    alert("Você precisa estar logado para vender!");
    return;
  }

  if (produto.quantidade <= 0) {
    alert("Esse produto está sem estoque!");
    return;
  }

  document.getElementById("detalhesVenda").innerHTML = `
    ${
      produto.imagem
        ? `<img src="${produto.imagem}" class="foto-modal">`
        : `<div class="sem-foto modal-sem-foto">Sem foto</div>`
    }

    <h3>${produto.nome}</h3>
    <p><strong>Vendedor:</strong> ${usuarioLogado.nome} ${usuarioLogado.sobrenome}</p>
    <p><strong>Cor:</strong> ${produto.cor}</p>
    <p><strong>Categoria:</strong> ${produto.categoria || "-"}</p>
    <p><strong>Preço:</strong> R$ ${Number(produto.preco || 0).toFixed(2)}</p>
    <p><strong>Quantidade em estoque:</strong> ${produto.quantidade}</p>
  `;

  document.getElementById("quantidadeVenda").value = "";
  document.getElementById("formaPagamento").value = "";
  document.getElementById("totalVenda").innerText = "Total: R$ 0,00";
  document.getElementById("modalVenda").style.display = "flex";
}

function fecharModalVenda() {
  document.getElementById("modalVenda").style.display = "none";
  produtoSelecionado = null;
}

document.getElementById("quantidadeVenda").addEventListener("input", function () {
  if (produtoSelecionado === null) return;

  const produto = produtos[produtoSelecionado];
  const quantidade = Number(this.value);
  const total = quantidade * Number(produto.preco || 0);

  document.getElementById("totalVenda").innerText = `Total: R$ ${total.toFixed(2)}`;
});

function confirmarVenda() {
  if (produtoSelecionado === null) return;

  const produto = produtos[produtoSelecionado];
  const quantidadeVendida = Number(document.getElementById("quantidadeVenda").value);
  const formaPagamento = document.getElementById("formaPagamento").value;

  if (!usuarioLogado) {
    alert("Você precisa estar logado para vender!");
    return;
  }

  if (!quantidadeVendida || quantidadeVendida <= 0) {
    alert("Digite uma quantidade válida!");
    return;
  }

  if (!formaPagamento) {
    alert("Selecione a forma de pagamento!");
    return;
  }

  if (quantidadeVendida > produto.quantidade) {
    alert("Você não pode vender mais do que tem no estoque!");
    return;
  }

  produto.quantidade -= quantidadeVendida;

  vendas.push({
    id: gerarId(),
    produtoId: produto.id,
    nome: produto.nome,
    cor: produto.cor,
    categoria: produto.categoria || "",
    vendedor: `${usuarioLogado.nome} ${usuarioLogado.sobrenome}`,
    formaPagamento,
    preco: Number(produto.preco || 0),
    quantidade: quantidadeVendida,
    total: quantidadeVendida * Number(produto.preco || 0),
    data: new Date().toISOString()
  });
  ultimaVenda = {
  produto: produto.nome,
  cor: produto.cor,
  categoria: produto.categoria || "-",
  quantidade: quantidadeVendida,
  preco: Number(produto.preco || 0),
  total: quantidadeVendida * Number(produto.preco || 0),
  vendedor: `${usuarioLogado.nome} ${usuarioLogado.sobrenome}`,
  pagamento: formaPagamento,
  data: new Date().toLocaleString("pt-BR")
};

  salvarProdutos();
    salvarVendas();
    atualizarLista();
    fecharModalVenda();

    mostrarToastSucesso();
}

function excluirVenda(index) {
  if (!usuarioLogado || usuarioLogado.tipo !== "admin") {
    alert("Somente administrador pode excluir vendas.");
    return;
  }

  if (!confirm("Deseja excluir esta venda?")) {
    return;
  }

  vendas.splice(index, 1);

  salvarVendas();
  atualizarVendas();
  atualizarRelatorios();

  alert("Venda excluída!");
}

function excluirProduto(index) {
  if (!confirm("Deseja excluir este produto?")) return;

  produtos.splice(index, 1);
  salvarProdutos();
  atualizarLista();
}

function salvarProdutos() {
  localStorage.setItem("produtos", JSON.stringify(produtos));
}

function salvarVendas() {
  localStorage.setItem("vendas", JSON.stringify(vendas));
}

function salvarFuncionarios() {
  localStorage.setItem("funcionarios", JSON.stringify(funcionarios));
}

function limparCampos() {
  document.getElementById("nomeProduto").value = "";
  document.getElementById("corProduto").value = "";
  document.getElementById("categoriaProduto").value = "";
  document.getElementById("quantidadeProduto").value = "";
  document.getElementById("precoProduto").value = "";
  document.getElementById("imagemProduto").value = "";
}

function atualizarDashboard() {
  const totalProdutos = produtos.length;

  const totalPecas = produtos.reduce((soma, produto) => {
    return soma + Number(produto.quantidade || 0);
  }, 0);

  const estoqueBaixo = produtos.filter(produto => produto.quantidade <= 2).length;

  const valorEstoque = produtos.reduce((soma, produto) => {
    return soma + Number(produto.quantidade || 0) * Number(produto.preco || 0);
  }, 0);

  document.getElementById("dashProdutos").innerText = totalProdutos;
  document.getElementById("dashPecas").innerText = totalPecas;
  document.getElementById("dashBaixo").innerText = estoqueBaixo;
  document.getElementById("dashValor").innerText = `R$ ${valorEstoque.toFixed(2)}`;
}

function vendaPassaFiltro(venda) {
  const filtro = document.getElementById("filtroVendas").value;
  const dataVenda = new Date(venda.data);
  const agora = new Date();

  if (filtro === "todas") return true;

  if (filtro === "hoje") {
    return dataVenda.toLocaleDateString("pt-BR") === agora.toLocaleDateString("pt-BR");
  }

  if (filtro === "mes") {
    return dataVenda.getMonth() === agora.getMonth() &&
      dataVenda.getFullYear() === agora.getFullYear();
  }

  if (filtro === "semana") {
    const seteDias = 7 * 24 * 60 * 60 * 1000;
    return agora - dataVenda <= seteDias;
  }

  return true;
}

function atualizarVendas() {
  const listaVendas = document.getElementById("listaVendas");

  listaVendas.innerHTML = "";

  const vendasFiltradas = vendas
    .map((venda, index) => ({ venda, index }))
    .filter(item => vendaPassaFiltro(item.venda))
    .reverse();

  if (vendasFiltradas.length === 0) {
    listaVendas.innerHTML = "<p>Nenhuma venda encontrada.</p>";
    return;
  }

  vendasFiltradas.forEach(item => {
    const venda = item.venda;
    const indexOriginal = item.index;
    const data = new Date(venda.data).toLocaleString("pt-BR");

    const card = document.createElement("div");
    card.className = "venda-card";

    card.innerHTML = `
      <strong>${venda.nome}</strong><br>
      Vendedor: ${venda.vendedor || "Não informado"}<br>
      Forma de pagamento: ${venda.formaPagamento || "-"}<br>
      Cor: ${venda.cor}<br>
      Categoria: ${venda.categoria || "-"}<br>
      Quantidade vendida: ${venda.quantidade}<br>
      Valor unitário: R$ ${Number(venda.preco || 0).toFixed(2)}<br>
      Total: R$ ${Number(venda.total || 0).toFixed(2)}<br>
      Data: ${data}<br><br>

      ${
        usuarioLogado && usuarioLogado.tipo === "admin"
          ? `<button class="btn-excluir" onclick="excluirVenda(${indexOriginal})">Excluir venda</button>`
          : ""
      }
    `;

    listaVendas.appendChild(card);
  });
}

function mostrarEstoque() {
  esconderAbas();
  document.getElementById("abaEstoque").style.display = "block";
  atualizarBotoesAbas(0);
}

function mostrarVendas() {
  esconderAbas();
  document.getElementById("abaVendas").style.display = "block";
  atualizarBotoesAbas(1);
  atualizarVendas();
}

function mostrarRelatorios() {
  esconderAbas();
  document.getElementById("abaRelatorios").style.display = "block";
  atualizarBotoesAbas(2);
  atualizarRelatorios();
}

function mostrarEstoqueBaixo() {
  esconderAbas();
  document.getElementById("abaEstoqueBaixo").style.display = "block";
  atualizarBotoesAbas(3);
  atualizarEstoqueBaixo();
}

function mostrarFuncionarios() {
  if (!usuarioLogado || usuarioLogado.tipo !== "admin") {
    alert("Somente o administrador pode acessar funcionários!");
    return;
  }

  esconderAbas();
  document.getElementById("abaFuncionarios").style.display = "block";
  atualizarBotoesAbas(4);
  carregarFuncionarios();
}

function esconderAbas() {
  document.getElementById("abaEstoque").style.display = "none";
  document.getElementById("abaVendas").style.display = "none";
  document.getElementById("abaRelatorios").style.display = "none";
  document.getElementById("abaEstoqueBaixo").style.display = "none";
  document.getElementById("abaFuncionarios").style.display = "none";
}

function atualizarBotoesAbas(indiceAtivo) {
  const botoes = document.querySelectorAll(".aba-btn");

  botoes.forEach((botao, index) => {
    if (index === indiceAtivo) {
      botao.classList.add("ativa");
    } else {
      botao.classList.remove("ativa");
    }
  });
}

function atualizarRelatorios() {
  const hoje = new Date().toLocaleDateString("pt-BR");
  const mesAtual = new Date().getMonth();
  const anoAtual = new Date().getFullYear();

  let totalHoje = 0;
  let totalMes = 0;
  let pecasMes = 0;

  const vendasPorProduto = {};
  const vendasPorMes = {};
  const vendasPorVendedor = {};
  const vendasPorPagamento = {};

  vendas.forEach(venda => {
    const dataVenda = new Date(venda.data);

    if (dataVenda.toLocaleDateString("pt-BR") === hoje) {
      totalHoje += Number(venda.total || 0);
    }

    if (dataVenda.getMonth() === mesAtual && dataVenda.getFullYear() === anoAtual) {
      totalMes += Number(venda.total || 0);
      pecasMes += Number(venda.quantidade || 0);

      vendasPorVendedor[venda.vendedor] =
        (vendasPorVendedor[venda.vendedor] || 0) + Number(venda.quantidade || 0);
    }

    vendasPorProduto[venda.nome] =
      (vendasPorProduto[venda.nome] || 0) + Number(venda.quantidade || 0);

    const nomeMes = dataVenda.toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric"
    });

    vendasPorMes[nomeMes] =
      (vendasPorMes[nomeMes] || 0) + Number(venda.total || 0);

    const forma = venda.formaPagamento || "Não informado";

    vendasPorPagamento[forma] =
      (vendasPorPagamento[forma] || 0) + Number(venda.total || 0);
  });

  document.getElementById("relatorioHoje").innerText = `R$ ${totalHoje.toFixed(2)}`;
  document.getElementById("relatorioMes").innerText = `R$ ${totalMes.toFixed(2)}`;
  document.getElementById("relatorioPecasMes").innerText = `${pecasMes} peças`;

  let maisVendido = "Nenhum";
  let maiorQuantidade = 0;

  for (let produto in vendasPorProduto) {
    if (vendasPorProduto[produto] > maiorQuantidade) {
      maiorQuantidade = vendasPorProduto[produto];
      maisVendido = `${produto} (${maiorQuantidade} peças)`;
    }
  }

  document.getElementById("relatorioMaisVendido").innerText = maisVendido;

  let vendedorMes = "Nenhum";
  let maiorVendaVendedor = 0;

  for (let vendedor in vendasPorVendedor) {
    if (vendasPorVendedor[vendedor] > maiorVendaVendedor) {
      maiorVendaVendedor = vendasPorVendedor[vendedor];
      vendedorMes = `${vendedor} (${maiorVendaVendedor} peças)`;
    }
  }

  document.getElementById("relatorioVendedorMes").innerText = vendedorMes;

  const divMeses = document.getElementById("vendasPorMes");
  divMeses.innerHTML = "";

  for (let mes in vendasPorMes) {
    divMeses.innerHTML += `
      <div class="mes-card">
        <strong>${mes}</strong><br>
        Total vendido: R$ ${vendasPorMes[mes].toFixed(2)}
      </div>
    `;
  }

  if (Object.keys(vendasPorMes).length === 0) {
    divMeses.innerHTML = "<p>Nenhuma venda registrada ainda.</p>";
  }

  const divPagamento = document.getElementById("formasPagamento");
  divPagamento.innerHTML = "";

  for (let forma in vendasPorPagamento) {
    divPagamento.innerHTML += `
      <div class="mes-card">
        <strong>${forma}</strong><br>
        Total: R$ ${vendasPorPagamento[forma].toFixed(2)}
      </div>
    `;
  }

  if (Object.keys(vendasPorPagamento).length === 0) {
    divPagamento.innerHTML = "<p>Nenhuma forma de pagamento registrada ainda.</p>";
  }
}

function atualizarEstoqueBaixo() {
  const lista = document.getElementById("listaEstoqueBaixo");

  lista.innerHTML = "";

  const produtosBaixos = produtos.filter(produto => Number(produto.quantidade || 0) <= 2);

  if (produtosBaixos.length === 0) {
    lista.innerHTML = "<p>Nenhum produto com estoque baixo.</p>";
    return;
  }

  produtosBaixos.forEach(produto => {
    const card = document.createElement("div");
    card.className = "card-produto estoque-baixo";

    card.innerHTML = `
      ${
        produto.imagem
          ? `<img src="${produto.imagem}" class="foto-produto">`
          : `<div class="sem-foto">Sem foto</div>`
      }

      <div class="info-produto">
        <h3>${produto.nome}</h3>
        <p><strong>Cor:</strong> ${produto.cor}</p>
        <p><strong>Categoria:</strong> ${produto.categoria || "-"}</p>
        <p><strong>Quantidade:</strong> ${produto.quantidade}</p>
        <p><strong>Preço:</strong> R$ ${Number(produto.preco || 0).toFixed(2)}</p>
      </div>
    `;

    lista.appendChild(card);
  });
}

function abrirModalEditar(index) {
  produtoEditando = index;
  const produto = produtos[index];

  document.getElementById("editarNome").value = produto.nome;
  document.getElementById("editarCor").value = produto.cor;
  document.getElementById("editarCategoria").value = produto.categoria || "";
  document.getElementById("editarQuantidade").value = produto.quantidade;
  document.getElementById("editarPreco").value = produto.preco;
  document.getElementById("editarImagem").value = "";

  document.getElementById("modalEditar").style.display = "flex";
}

function fecharModalEditar() {
  document.getElementById("modalEditar").style.display = "none";
  produtoEditando = null;
}

function salvarEdicaoProduto() {
  if (produtoEditando === null) return;

  const produto = produtos[produtoEditando];

  produto.nome = document.getElementById("editarNome").value.trim();
  produto.cor = document.getElementById("editarCor").value.trim();
  produto.categoria = document.getElementById("editarCategoria").value;
  produto.quantidade = Number(document.getElementById("editarQuantidade").value);
  produto.preco = Number(document.getElementById("editarPreco").value);

  const novaImagem = document.getElementById("editarImagem").files[0];

  if (novaImagem) {
    const leitor = new FileReader();

    leitor.onload = function (evento) {
      produto.imagem = evento.target.result;

      salvarProdutos();
      atualizarLista();
      fecharModalEditar();
    };

    leitor.readAsDataURL(novaImagem);
    return;
  }

  salvarProdutos();
  atualizarLista();
  fecharModalEditar();
}

function cadastrarFuncionario() {
  if (!usuarioLogado || usuarioLogado.tipo !== "admin") {
    alert("Somente o administrador pode cadastrar funcionários!");
    return;
  }

  const nome = document.getElementById("funcNome").value.trim();
  const sobrenome = document.getElementById("funcSobrenome").value.trim();
  const senha = document.getElementById("funcSenha").value.trim();

  if (!nome || !sobrenome || !senha) {
    alert("Preencha nome, sobrenome e senha!");
    return;
  }

  funcionarios.push({
    nome,
    sobrenome,
    senha,
    tipo: "funcionario"
  });

  salvarFuncionarios();

  document.getElementById("funcNome").value = "";
  document.getElementById("funcSobrenome").value = "";
  document.getElementById("funcSenha").value = "";

  carregarFuncionarios();

  alert("Funcionário cadastrado!");
}

function carregarFuncionarios() {
  const lista = document.getElementById("listaFuncionarios");

  lista.innerHTML = "";

  funcionarios.forEach((func, index) => {
    const card = document.createElement("div");
    card.className = "venda-card";

    card.innerHTML = `
      <strong>${func.nome} ${func.sobrenome}</strong><br>
      Tipo: ${func.tipo}<br><br>

      <button onclick="abrirEditarFuncionario(${index})">Editar</button>

      ${
        func.tipo !== "admin"
          ? `<button class="btn-excluir" onclick="excluirFuncionario(${index})">Excluir</button>`
          : ""
      }
    `;

    lista.appendChild(card);
  });
}

function abrirEditarFuncionario(index) {
  funcionarioEditando = index;
  const func = funcionarios[index];

  document.getElementById("editarFuncNome").value = func.nome;
  document.getElementById("editarFuncSobrenome").value = func.sobrenome;
  document.getElementById("editarFuncSenha").value = func.senha;

  document.getElementById("modalEditarFuncionario").style.display = "flex";
}

function fecharModalEditarFuncionario() {
  document.getElementById("modalEditarFuncionario").style.display = "none";
  funcionarioEditando = null;
}

function salvarEdicaoFuncionario() {
  if (funcionarioEditando === null) return;

  funcionarios[funcionarioEditando].nome =
    document.getElementById("editarFuncNome").value.trim();

  funcionarios[funcionarioEditando].sobrenome =
    document.getElementById("editarFuncSobrenome").value.trim();

  funcionarios[funcionarioEditando].senha =
    document.getElementById("editarFuncSenha").value.trim();

  salvarFuncionarios();

  usuarioLogado = funcionarios[funcionarioEditando];
  localStorage.setItem("usuarioLogado", JSON.stringify(usuarioLogado));
  verificarLogin();

  fecharModalEditarFuncionario();
  carregarFuncionarios();

  alert("Funcionário atualizado!");
}

function excluirFuncionario(index) {
  if (funcionarios[index].tipo === "admin") {
    alert("Você não pode excluir o administrador!");
    return;
  }

  if (!confirm("Deseja excluir este funcionário?")) return;

  funcionarios.splice(index, 1);
  salvarFuncionarios();
  carregarFuncionarios();
}

function exportarBackup() {
  if (!usuarioLogado || usuarioLogado.tipo !== "admin") {
    alert("Somente administrador pode fazer backup.");
    return;
  }

  const dados = {
    produtos,
    vendas,
    funcionarios
  };

  const arquivo = new Blob(
    [JSON.stringify(dados, null, 2)],
    { type: "application/json" }
  );

  const link = document.createElement("a");
  link.href = URL.createObjectURL(arquivo);
  link.download = "backup-bell-carvalho.json";
  link.click();
}

document.getElementById("pesquisaProduto").addEventListener("keyup", function () {
  atualizarLista();
});
function mostrarComprovante(
  produto,
  quantidade,
  preco,
  total,
  vendedor
){

  const data = new Date().toLocaleString("pt-BR");

  const comprovante = `
=========================
 BELL CARVALHO
=========================

Produto: ${produto}

Quantidade: ${quantidade}

Valor Unitário:
R$ ${preco.toFixed(2)}

Total:
R$ ${total.toFixed(2)}

Vendedor:
${vendedor}

Data:
${data}

=========================
Obrigado pela compra!
=========================
`;

  alert(comprovante);
}
function imprimirComprovante(){

  if(!ultimaVenda){
    alert("Nenhuma venda registrada.");
    return;
  }

  const janela = window.open("", "_blank");

  janela.document.write(`
    <html>
    <head>
      <title>Comprovante</title>

      <style>
        body{
          font-family:Arial;
          padding:20px;
          text-align:center;
        }

        h2{
          margin-bottom:20px;
        }

        .linha{
          margin:10px 0;
        }

        hr{
          margin:15px 0;
        }
      </style>
    </head>

    <body>

      <h2>BELL CARVALHO</h2>

      <hr>

      <div class="linha">
        Produto: ${ultimaVenda.produto}
      </div>

      <div class="linha">
        Quantidade: ${ultimaVenda.quantidade}
      </div>

      <div class="linha">
        Valor Unitário: R$ ${ultimaVenda.preco.toFixed(2)}
      </div>

      <div class="linha">
        Total: R$ ${ultimaVenda.total.toFixed(2)}
      </div>

      <div class="linha">
        Forma de Pagamento: ${ultimaVenda.pagamento}
      </div>

      <div class="linha">
        Vendedor: ${ultimaVenda.vendedor}
      </div>

      <div class="linha">
        Data: ${ultimaVenda.data}
      </div>

      <hr>

      <h3>Obrigado pela preferência ❤️</h3>

    </body>
    </html>
  `);

  janela.document.close();

  janela.print();
}
function imprimirComprovante() {
  if (!ultimaVenda) {
    alert("Nenhuma venda registrada ainda.");
    return;
  }

  const janela = window.open("", "_blank");

  janela.document.write(`
    <html>
      <head>
        <title>Comprovante Bell Carvalho</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 30px;
            background: #f4f4f4;
          }

          .comprovante {
            max-width: 420px;
            margin: auto;
            background: white;
            padding: 25px;
            border-radius: 18px;
            text-align: center;
            border: 2px solid #ff7a21;
          }

          .logo-comprovante {
            width: 90px;
            height: 90px;
            border-radius: 50%;
            object-fit: cover;
            margin-bottom: 10px;
          }

          h2 {
            margin: 5px 0;
          }

          .linha {
            display: flex;
            justify-content: space-between;
            border-bottom: 1px dashed #ccc;
            padding: 10px 0;
            text-align: left;
          }

          .total {
            margin-top: 20px;
            padding: 15px;
            background: #111;
            color: white;
            font-size: 22px;
            font-weight: bold;
            border-radius: 12px;
          }

          .rodape {
            margin-top: 20px;
            font-style: italic;
            color: #555;
          }

          @media print {
            body {
              background: white;
            }
          }
        </style>
      </head>
      <body>
        <div class="comprovante">
          <img src="logo.png" class="logo-comprovante">

          <h2>Bell Carvalho</h2>
          <p>Comprovante de Venda</p>

          <div class="linha">
            <strong>Produto:</strong>
            <span>${ultimaVenda.produto}</span>
          </div>

          <div class="linha">
            <strong>Cor:</strong>
            <span>${ultimaVenda.cor}</span>
          </div>

          <div class="linha">
            <strong>Categoria:</strong>
            <span>${ultimaVenda.categoria}</span>
          </div>

          <div class="linha">
            <strong>Quantidade:</strong>
            <span>${ultimaVenda.quantidade}</span>
          </div>

          <div class="linha">
            <strong>Valor unitário:</strong>
            <span>R$ ${ultimaVenda.preco.toFixed(2)}</span>
          </div>

          <div class="linha">
            <strong>Pagamento:</strong>
            <span>${ultimaVenda.pagamento}</span>
          </div>

          <div class="linha">
            <strong>Vendedor:</strong>
            <span>${ultimaVenda.vendedor}</span>
          </div>

          <div class="linha">
            <strong>Data:</strong>
            <span>${ultimaVenda.data}</span>
          </div>

          <div class="total">
            Total: R$ ${ultimaVenda.total.toFixed(2)}
          </div>

          <p class="rodape">Obrigada pela preferência 🧡</p>
        </div>

        <script>
          window.onload = function() {
            window.print();
          }
        <\/script>
      </body>
    </html>
  `);

  janela.document.close();
}
function mostrarToastSucesso() {
  const toast = document.getElementById("toastSucesso");

  toast.classList.add("mostrar");

  setTimeout(() => {
    toast.classList.remove("mostrar");
  }, 3000);
}