import { db } from "./firebase.js";
import {
  collection, addDoc, doc, updateDoc, deleteDoc, getDoc,
  getDocs, onSnapshot, query, where, orderBy, Timestamp
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const APP_PIN = "1803";

/* ELEMENTOS PRINCIPAIS */
const loginScreen = document.getElementById("loginScreen");
const app = document.getElementById("app");
const pinInput = document.getElementById("pinInput");
const pinSubmit = document.getElementById("pinSubmit");
const loginMsg = document.getElementById("loginMsg");

/* PÁGINAS */
const pages = document.querySelectorAll(".page");
const sidebarBtns = document.querySelectorAll(".sidebar-btn");

/* SIDEBAR MOBILE */
const mobileMenuBtn = document.getElementById("mobileMenuBtn");
const mobileSidebar = document.getElementById("mobileSidebar");
const closeMobileSidebar = document.getElementById("closeMobileSidebar");

/* DASHBOARD ELEMENTOS */
const statHoje = document.getElementById("statHoje");
const statMes = document.getElementById("statMes");
const statClientes = document.getElementById("statClientes");
const statProdutos = document.getElementById("statProdutos");

/* PEDIDOS PAGE */
const pedidosList = document.getElementById("pedidosList");
const emptyMsg = document.getElementById("emptyMsg");
const addPedidoBtn = document.getElementById("addPedidoBtn");

/* FORM PEDIDO */
const detailsPage = document.getElementById("detailsPage");
const backBtn = document.getElementById("backBtn");
const saveBtn = document.getElementById("saveBtn");
const deleteBtn = document.getElementById("deleteBtn");
const detailsTitle = document.getElementById("detailsTitle");

const pedidoForm = document.getElementById("pedidoForm");
const clienteSelect = document.getElementById("clienteSelect");
const tipoEntregaSelect = document.getElementById("tipoEntrega");
const enderecoInput = document.getElementById("endereco");
const produtoSelect = document.getElementById("produtoSelect");
const produtoQtd = document.getElementById("produtoQtd");
const addItemBtn = document.getElementById("addItemBtn");
const listaItens = document.getElementById("listaItens");
const horarioInput = document.getElementById("horario");
const valorTotalInput = document.getElementById("valorTotal");

let itensPedido = [];
let editingPedidoId = null;

/* CLIENTES PAGE */
const clientesList = document.getElementById("clientesList");
const addClienteBtn = document.getElementById("addClienteBtn");

/* PRODUTOS PAGE */
const produtosList = document.getElementById("produtosList");
const addProdutoBtn = document.getElementById("addProdutoBtn");

/* ========================= LOGIN ========================= */

pinSubmit.onclick = () => {
  if (pinInput.value === APP_PIN) {
    loginScreen.classList.add("hidden");
    app.classList.remove("hidden");
    carregarTudo();
  } else {
    loginMsg.textContent = "PIN incorreto";
    pinInput.value = "";
  }
};

/* ======================= TROCA DE PÁGINA ======================= */

function showPage(pageId) {
  pages.forEach(p => p.classList.remove("active"));
  document.getElementById(pageId).classList.add("active");
}
sidebarBtns.forEach(btn => {
  btn.addEventListener("click", () => showPage(btn.dataset.page));
});
mobileMenuBtn.onclick = () => mobileSidebar.classList.add("show");
closeMobileSidebar.onclick = () => mobileSidebar.classList.remove("show");

/* ========================= CLIENTES ========================= */

async function carregarClientes() {
  clienteSelect.innerHTML = "";
  clientesList.innerHTML = "";

  const snaps = await getDocs(collection(db, "clientes"));
  snaps.forEach(docu => {
    const c = docu.data();
    clienteSelect.innerHTML += `<option value="${docu.id}">${c.nome}</option>`;

    clientesList.innerHTML += `
      <li class="list-item">
        <span>${c.nome} — ${c.telefone}</span>
      </li>`;
  });
}
addClienteBtn.onclick = async () => {
  const nome = prompt("Nome do cliente:");
  if (!nome) return;
  const telefone = prompt("Telefone:");
  await addDoc(collection(db, "clientes"), { nome, telefone });
  carregarClientes();
};

/* ========================= PRODUTOS ========================= */

async function carregarProdutos() {
  produtoSelect.innerHTML = "";
  produtosList.innerHTML = "";

  const snaps = await getDocs(collection(db, "produtos"));
  snaps.forEach(docu => {
    const p = docu.data();
    produtoSelect.innerHTML += `<option value="${docu.id}" data-preco="${p.valor}">${p.nome} — R$${p.valor}</option>`;

    produtosList.innerHTML += `
      <div class="produto-card">
         <h4>${p.nome}</h4>
         <p>R$ ${p.valor}</p>
         <button class="btn danger" onclick="deletarProduto('${docu.id}')">Excluir</button>
      </div>`;
  });
}
window.deletarProduto = async (id) => {
  if (!confirm("Excluir produto?")) return;
  await deleteDoc(doc(db, "produtos", id));
  carregarProdutos();
};
addProdutoBtn.onclick = async () => {
  const nome = prompt("Nome do produto:");
  if (!nome) return;
  const valor = parseFloat(prompt("Valor (ex: 5.50):") || "0");
  await addDoc(collection(db, "produtos"), { nome, valor });
  carregarProdutos();
};

/* ========================= PEDIDOS ========================= */

addPedidoBtn.onclick = () => abrirFormPedido();

function abrirFormPedido(pedido = null) {
  editingPedidoId = pedido?.id || null;
  itensPedido = pedido?.itens || [];
  renderItens();
  detailsTitle.textContent = editingPedidoId ? "Editar Pedido" : "Novo Pedido";

  if (pedido) {
    clienteSelect.value = pedido.clienteId;
    tipoEntregaSelect.value = pedido.tipoEntrega;
    enderecoInput.value = pedido.endereco || "";
    valorTotalInput.value = pedido.valorTotal;
    horarioInput.value = dateToInput(pedido.horario.toDate());
  } else {
    pedidoForm.reset();
    enderecoInput.value = "";
    valorTotalInput.value = "";
    horarioInput.value = "";
  }

  showPage("detailsPage");
}

backBtn.onclick = () => showPage("pedidosPage");

function renderItens() {
  listaItens.innerHTML = "";
  itensPedido.forEach((item, i) => {
    listaItens.innerHTML += `
      <li>
        ${item.nome} x${item.qtd}
        <button onclick="removerItem(${i})">✕</button>
      </li>`;
  });
}
window.removerItem = (i) => {
  itensPedido.splice(i, 1);
  atualizarTotal();
  renderItens();
};

addItemBtn.onclick = () => {
  const option = produtoSelect.selectedOptions[0];
  const nome = option.textContent.split("—")[0].trim();
  const valor = parseFloat(option.dataset.preco);
  const qtd = parseInt(produtoQtd.value);

  itensPedido.push({ nome, qtd, valor });
  produtoQtd.value = 1;
  renderItens();
  atualizarTotal();
};

function atualizarTotal() {
  const total = itensPedido.reduce((t, it) => t + it.valor * it.qtd, 0);
  valorTotalInput.value = total.toFixed(2);
}

pedidoForm.onsubmit = async (e) => {
  e.preventDefault();
  const pedidoData = {
    clienteId: clienteSelect.value,
    clienteNome: clienteSelect.options[clienteSelect.selectedIndex].textContent,
    itens: itensPedido,
    valorTotal: parseFloat(valorTotalInput.value),
    tipoEntrega: tipoEntregaSelect.value,
    endereco: enderecoInput.value,
    horario: Timestamp.fromDate(new Date(horarioInput.value)),
    status: "active",
    pago: false
  };

  if (editingPedidoId) {
    await updateDoc(doc(db, "pedidos", editingPedidoId), pedidoData);
  } else {
    await addDoc(collection(db, "pedidos"), pedidoData);
  }

  showPage("pedidosPage");
};

/* MARCAR COMO CONCLUÍDO */
window.concluirPedido = async (id) => {
  const pago = confirm("O pedido foi pago?");
  await updateDoc(doc(db, "pedidos", id), { status: "completed", pago });
};

/* EXCLUIR PEDIDO */
window.deletarPedido = async (id) => {
  if (!confirm("Excluir pedido?")) return;
  await deleteDoc(doc(db, "pedidos", id));
};

/* LISTAR PEDIDOS */
function carregarPedidos() {
  const q = query(collection(db, "pedidos"), where("status", "==", "active"));
  onSnapshot(q, snaps => {
    pedidosList.innerHTML = "";
    snaps.forEach(docu => {
      const p = docu.data();
      pedidosList.innerHTML += `
        <div class="pedido-card">
          <div class="pedido-card-header">${p.clienteNome}</div>
          <div class="pedido-card-body">Valor: R$${p.valorTotal.toFixed(2)}</div>
          <div class="pedido-card-footer">
            <button class="btn success" onclick="concluirPedido('${docu.id}')">Concluir</button>
            <button class="btn ghost" onclick="abrirFormPedido({id:'${docu.id}', ...${JSON.stringify(p)}})">Editar</button>
            <button class="btn danger" onclick="deletarPedido('${docu.id}')">Excluir</button>
          </div>
        </div>`;
    });

    emptyMsg.style.display = snaps.size ? "none" : "block";
  });
}

/* DASHBOARD */
async function carregarDashboard() {
  const pedidosSnap = await getDocs(collection(db, "pedidos"));
  const pedidos = pedidosSnap.docs.map(d => d.data());

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const totalHoje = pedidos.filter(p => p.pago && p.horario.toDate() >= hoje)
    .reduce((t, p) => t + p.valorTotal, 0);

  const mesAtual = new Date().getMonth();
  const totalMes = pedidos.filter(p => p.pago && p.horario.toDate().getMonth() === mesAtual)
    .reduce((t, p) => t + p.valorTotal, 0);

  statHoje.textContent = "Hoje: R$ " + totalHoje.toFixed(2);
  statMes.textContent = "Este mês: R$ " + totalMes.toFixed(2);

  statClientes.textContent = "Clientes: " + (await getDocs(collection(db, "clientes"))).size;
  statProdutos.textContent = "Produtos: " + (await getDocs(collection(db, "produtos"))).size;
}

/* UTILS */
function dateToInput(date) {
  return date.toISOString().slice(0, 16);
}

/* INÍCIO */
async function carregarTudo() {
  carregarClientes();
  carregarProdutos();
  carregarPedidos();
  carregarDashboard();
}

console.log("%c Império das Gramas — Sistema Carregado 🍃👑", "font-weight:700;color:#4fb579");
