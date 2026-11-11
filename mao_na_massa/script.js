// ============ CONFIGURAÇÃO DA API ============
// Se estiver rodando localmente com json-server:
const API_URL = 'http://localhost:3000/alugueis';

// ============ NAVEGAÇÃO SPA ============
let telaAnterior = 'tela-home';
let telaAtual = 'tela-home';

function navegar(destino) {
    const telas = document.getElementsByClassName('tela');
    Array.from(telas).forEach(el => {
        el.classList.remove('show');
        el.classList.add('collapse');
    });
    document.getElementById(destino).classList.remove('collapse');
    document.getElementById(destino).classList.add('show');
    telaAnterior = telaAtual;
    telaAtual = destino;
}

function voltar() {
    navegar(telaAnterior);
}

// ============ CÁLCULOS ============
function calcularNoites(checkin, checkout) {
    const d1 = new Date(checkin);
    const d2 = new Date(checkout);
    const diff = Math.abs(d2 - d1);
    return Math.max(1, Math.round(diff / (1000 * 60 * 60 * 24)));
}

function calcularLiquido(aluguel) {
    return aluguel.valorTotal - (aluguel.taxaPlataforma || 0) - (aluguel.custosExtras || 0);
}

function calcularLiquidoPorNoite(aluguel) {
    const noites = calcularNoites(aluguel.dataCheckin, aluguel.dataCheckout);
    return calcularLiquido(aluguel) / noites;
}

// ============ LISTAGEM (GET) ============
async function carregarAlugueis() {
    const lista = document.getElementById('lista-alugueis');
    lista.innerHTML = '<p class="text-center">Carregando...</p>';

    try {
        const response = await axios.get(API_URL);
        const alugueis = response.data;

        if (alugueis.length === 0) {
            lista.innerHTML = '<p class="text-center text-muted">Nenhum aluguel cadastrado.</p>';
            return;
        }

        lista.innerHTML = '';
        alugueis.forEach(a => {
            const noites = calcularNoites(a.dataCheckin, a.dataCheckout);
            const liquido = calcularLiquido(a);
            const porNoite = calcularLiquidoPorNoite(a);

            const card = document.createElement('div');
            card.className = 'col';
            card.innerHTML = `
                <div class="card h-100 shadow-sm">
                    <div class="card-body">
                        <h5 class="card-title">${a.hospede}</h5>
                        <span class="badge bg-primary mb-2">${a.plataforma}</span>
                        <p class="card-text small mb-1">
                            <strong>Check-in:</strong> ${formatarData(a.dataCheckin)}<br>
                            <strong>Check-out:</strong> ${formatarData(a.dataCheckout)}<br>
                            <strong>Noites:</strong> ${noites}<br>
                            <strong>Total:</strong> R$ ${a.valorTotal.toFixed(2)}<br>
                            <strong>Líquido:</strong> <span class="text-success">R$ ${liquido.toFixed(2)}</span><br>
                            <strong>Por noite:</strong> R$ ${porNoite.toFixed(2)}
                        </p>
                        <div class="d-flex gap-2 mt-3">
                            <button class="btn btn-sm btn-outline-primary" onclick="abrirDetalhes(${a.id})">Detalhes</button>
                            <button class="btn btn-sm btn-outline-danger" onclick="excluirAluguel(${a.id})">Excluir</button>
                        </div>
                    </div>
                </div>
            `;
            lista.appendChild(card);
        });
    } catch (error) {
        console.error('Erro ao carregar aluguéis:', error);
        lista.innerHTML = '<p class="text-center text-danger">Erro ao carregar. Verifique se o json server está funcionando <br> npm install -g json-server <br> cd /local do arquivo <br> json-server --watch db.json --port 3000 <br> http://localhost:3000 </p>';
        
    }
}

function formatarData(dataStr) {
    const [y, m, d] = dataStr.split('-');
    return `${d}/${m}/${y}`;
}

// ============ DETALHES (GET por ID) ============
async function abrirDetalhes(id) {
    const detalhes = document.getElementById('detalhes-aluguel');
    detalhes.innerHTML = 'Carregando...';
    navegar('tela-detalhe');

    try {
        const response = await axios.get(`${API_URL}/${id}`);
        const a = response.data;
        const noites = calcularNoites(a.dataCheckin, a.dataCheckout);
        const liquido = calcularLiquido(a);
        const porNoite = calcularLiquidoPorNoite(a);

        detalhes.innerHTML = `
            <h3>${a.hospede}</h3>
            <p><strong>Plataforma:</strong> ${a.plataforma}</p>
            <p><strong>Check-in:</strong> ${formatarData(a.dataCheckin)}</p>
            <p><strong>Check-out:</strong> ${formatarData(a.dataCheckout)}</p>
            <p><strong>Noites:</strong> ${noites}</p>
            <hr>
            <p><strong>Valor Total:</strong> R$ ${a.valorTotal.toFixed(2)}</p>
            <p><strong>Taxa Plataforma:</strong> - R$ ${(a.taxaPlataforma || 0).toFixed(2)}</p>
            <p><strong>Custos Extras:</strong> - R$ ${(a.custosExtras || 0).toFixed(2)}</p>
            <p class="fs-5"><strong>Ganho Líquido:</strong> <span class="text-success">R$ ${liquido.toFixed(2)}</span></p>
            <p class="fs-5"><strong>Ganho Líquido / Noite:</strong> R$ ${porNoite.toFixed(2)}</p>
        `;
    } catch (error) {
        console.error('Erro ao carregar detalhes:', error);
        detalhes.innerHTML = '<p class="text-danger">Erro ao carregar detalhes.</p>';
    }
}

// ============ CADASTRO (POST) ============
async function salvarAluguel(event) {
    event.preventDefault();

    const novo = {
        hospede: document.getElementById('hospede').value,
        plataforma: document.getElementById('plataforma').value,
        dataCheckin: document.getElementById('dataCheckin').value,
        dataCheckout: document.getElementById('dataCheckout').value,
        valorTotal: parseFloat(document.getElementById('valorTotal').value),
        taxaPlataforma: parseFloat(document.getElementById('taxaPlataforma').value) || 0,
        custosExtras: parseFloat(document.getElementById('custosExtras').value) || 0
    };

    if (new Date(novo.dataCheckout) <= new Date(novo.dataCheckin)) {
        alert('A data de check-out deve ser posterior ao check-in.');
        return;
    }

    try {
        await axios.post(API_URL, novo);
        alert('Aluguel cadastrado com sucesso!');
        document.getElementById('form-aluguel').reset();
        await carregarAlugueis();
        navegar('tela-home');
    } catch (error) {
        console.error('Erro ao salvar:', error);
        alert('Erro ao salvar o aluguel.');
    }
}

// ============ EXCLUSÃO (DELETE) ============
async function excluirAluguel(id) {
    if (!confirm('Deseja realmente excluir este aluguel?')) return;

    try {
        await axios.delete(`${API_URL}/${id}`);
        alert('Aluguel excluído!');
        await carregarAlugueis();
    } catch (error) {
        console.error('Erro ao excluir:', error);
        alert('Erro ao excluir.');
    }
}

// ============ RESUMO ============
async function carregarResumo() {
    const div = document.getElementById('resumo-conteudo');
    div.innerHTML = 'Carregando...';

    try {
        const response = await axios.get(API_URL);
        const alugueis = response.data;

        if (alugueis.length === 0) {
            div.innerHTML = '<p class="text-muted">Nenhum dado disponível.</p>';
            return;
        }

        let totalBruto = 0, totalLiquido = 0, totalNoites = 0;
        const porPlataforma = {};

        alugueis.forEach(a => {
            const noites = calcularNoites(a.dataCheckin, a.dataCheckout);
            const liquido = calcularLiquido(a);

            totalBruto += a.valorTotal;
            totalLiquido += liquido;
            totalNoites += noites;

            if (!porPlataforma[a.plataforma]) {
                porPlataforma[a.plataforma] = { bruto: 0, liquido: 0, noites: 0, qtd: 0 };
            }
            porPlataforma[a.plataforma].bruto += a.valorTotal;
            porPlataforma[a.plataforma].liquido += liquido;
            porPlataforma[a.plataforma].noites += noites;
            porPlataforma[a.plataforma].qtd += 1;
        });

        let linhas = '';
        let cards = '';

        for (const [plat, dados] of Object.entries(porPlataforma)) {
            const porNoite = dados.noites > 0 ? dados.liquido / dados.noites : 0;

            // Linha da Tabela (Desktop)
            linhas += `
                <tr>
                    <td>${plat}</td>
                    <td>${dados.qtd}</td>
                    <td>${dados.noites}</td>
                    <td>R$ ${dados.bruto.toFixed(2)}</td>
                    <td class="text-success">R$ ${dados.liquido.toFixed(2)}</td>
                    <td>R$ ${porNoite.toFixed(2)}</td>
                </tr>
            `;

            // Card (Mobile)
            cards += `
                <div class="col-12 mb-3">
                    <div class="card shadow-sm border-0">
                        <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                            <strong>${plat}</strong>
                            <span class="badge bg-light text-dark">${dados.qtd} aluguel(is)</span>
                        </div>
                        <div class="card-body p-0">
                            <ul class="list-group list-group-flush">
                                <li class="list-group-item d-flex justify-content-between align-items-center">
                                    <span>Noites</span>
                                    <strong>${dados.noites}</strong>
                                </li>
                                <li class="list-group-item d-flex justify-content-between align-items-center">
                                    <span>Bruto</span>
                                    <span>R$ ${dados.bruto.toFixed(2)}</span>
                                </li>
                                <li class="list-group-item d-flex justify-content-between align-items-center text-success">
                                    <span>Líquido</span>
                                    <strong>R$ ${dados.liquido.toFixed(2)}</strong>
                                </li>
                                <li class="list-group-item d-flex justify-content-between align-items-center">
                                    <span>R$ / Noite</span>
                                    <strong>R$ ${porNoite.toFixed(2)}</strong>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            `;
        }

        div.innerHTML = `
            <!-- Topo: Totalizadores -->
            <div class="row text-center mb-4 g-2">
                <div class="col-6 col-md-3">
                    <div class="p-2 p-md-3 bg-light rounded h-100">
                        <small class="text-muted d-block text-truncate">Total Aluguéis</small>
                        <div class="fs-5 fs-md-4 fw-bold">${alugueis.length}</div>
                    </div>
                </div>
                <div class="col-6 col-md-3">
                    <div class="p-2 p-md-3 bg-light rounded h-100">
                        <small class="text-muted d-block text-truncate">Noites Alugadas</small>
                        <div class="fs-5 fs-md-4 fw-bold">${totalNoites}</div>
                    </div>
                </div>
                <div class="col-6 col-md-3">
                    <div class="p-2 p-md-3 bg-light rounded h-100">
                        <small class="text-muted d-block text-truncate">Bruto Total</small>
                        <div class="fs-6 fs-md-5 fw-bold">R$ ${totalBruto.toFixed(2)}</div>
                    </div>
                </div>
                <div class="col-6 col-md-3">
                    <div class="p-2 p-md-3 bg-light rounded h-100">
                        <small class="text-muted d-block text-truncate">Líquido Total</small>
                        <div class="fs-6 fs-md-5 fw-bold text-success">R$ ${totalLiquido.toFixed(2)}</div>
                    </div>
                </div>
            </div>

            <h5 class="mt-4 mb-3">Por Plataforma</h5>

            <!-- Tabela (Desktop >= md) -->
            <div class="table-responsive d-none d-md-block">
                <table class="table table-striped align-middle">
                    <thead>
                        <tr>
                            <th>Plataforma</th>
                            <th>Qtd</th>
                            <th>Noites</th>
                            <th>Bruto</th>
                            <th>Líquido</th>
                            <th>R$/Noite</th>
                        </tr>
                    </thead>
                    <tbody>${linhas}</tbody>
                </table>
            </div>

            <!-- Cards (Mobile < md) -->
            <div class="row d-md-none">
                ${cards}
            </div>
        `;
    } catch (error) {
        console.error('Erro ao carregar resumo:', error);
        div.innerHTML = '<p class="text-danger">Erro ao carregar resumo.</p>';
    }
}

// ============ SERVICE WORKER ============
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js');
}

let pedidoInstalacao = null;

window.addEventListener('appinstalled', function () {
    console.log('Aplicativo instalado!');
    document.getElementById('installAppBt').style.display = 'none';
    pedidoInstalacao = null;
});

window.addEventListener('beforeinstallprompt', function (evento) {
    evento.preventDefault();
    pedidoInstalacao = evento;
    document.getElementById('installAppBt').style.display = 'block';
});

async function installApp() {
    if (!pedidoInstalacao) {
        alert('A instalação não está disponível neste momento.');
        return;
    }
    pedidoInstalacao.prompt();
    const resultado = await pedidoInstalacao.userChoice;
    console.log('Resultado:', resultado.outcome);
    pedidoInstalacao = null;
}

// ============ INICIALIZAÇÃO ============
carregarAlugueis();

// Recarrega o resumo ao navegar para ele
const _navegarOriginal = navegar;
navegar = function (destino) {
    _navegarOriginal(destino);
    if (destino === 'tela-resumo') carregarResumo();
};