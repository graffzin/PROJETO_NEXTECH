/* =====================================================
   TERMO — Lógica do Jogo
   ===================================================== */

// ---------- ESTADO GLOBAL ----------
let modoAtual = 'normal';
let temaAtual = 'Geral';
let palavraSecreta = "";
let tentativas = [];
let tentativaAtual = "";
let cursorPos = 0;
let jogoTerminado = false;

// Cronômetro e estatísticas
let tempoInicial = null;
let intervaloTempo = null;
let segundosDecorridos = 0;

let estatisticas = {
    vitorias: 0,
    jogos: 0,
    sequencia: 0
};

const LIMITE_TENTATIVAS = 6;

// ---------- BANCO DE PALAVRAS ORIGINAL ----------


// ---------- FUNÇÃO ORIGINAL ----------
function sortearPalavra(tema) {
    const palavras = palavrasPorTema[tema];
    const indiceAleatorio = Math.floor(Math.random() * palavras.length);

    return palavras[indiceAleatorio];
}

// ---------- ELEMENTOS DO DOM ----------
const telas = {
    menu: document.getElementById('tela-menu'),
    temas: document.getElementById('tela-temas'),
    jogo: document.getElementById('tela-jogo')
};

const btns = {
    normal: document.getElementById('btn-normal'),
    infinito: document.getElementById('btn-infinito'),
    voltarTemas: document.getElementById('btn-voltar-temas'),
    voltarMenu: document.getElementById('btn-voltar'),
    ajuda: document.getElementById('btn-ajuda'),
    estatisticas: document.getElementById('btn-estatisticas'),
    jogarNovamente: document.getElementById('btn-jogar-novamente'),
    btnMenuModal: document.getElementById('btn-menu')
};

const elModal = document.getElementById('modal-fim');
const elAvisos = document.getElementById('avisos');
const elTabuleiro = document.getElementById('tabuleiro');
const elTeclado = document.getElementById('teclado');

// ---------- INICIALIZAÇÃO ----------
document.addEventListener('DOMContentLoaded', () => {
    carregarEstatisticas();
    configurarEventos();
});

function configurarEventos() {
    btns.normal.addEventListener('click', () => abrirTelaTemas('normal'));
    btns.infinito.addEventListener('click', () => abrirTelaTemas('infinito'));

    btns.voltarTemas.addEventListener('click', () => trocarTela('menu'));
    btns.voltarMenu.addEventListener('click', () => trocarTela('menu'));

    btns.ajuda.addEventListener('click', () => {
        mostrarAviso("Adivinhe a palavra secreta em 6 tentativas!");
    });
    btns.estatisticas.addEventListener('click', mostrarEstatisticasModal);

    btns.jogarNovamente.addEventListener('click', () => {
        fecharModal();
        iniciarJogo(modoAtual, temaAtual);
    });

    btns.btnMenuModal.addEventListener('click', () => {
        fecharModal();
        trocarTela('menu');
    });

    elTeclado.addEventListener('click', (e) => {
        const btn = e.target.closest('.tecla');
        if (!btn) return;
        const tecla = btn.dataset.tecla;
        tratarEntrada(tecla);
    });

    document.addEventListener('keydown', (e) => {
        if (!telas.jogo.classList.contains('ativa') || jogoTerminado) return;
    
        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            cursorPos = Math.max(0, cursorPos - 1);
            atualizarLinhaAtiva();
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            cursorPos = Math.min(
                Math.min(tentativaAtual.length, palavraSecreta.length - 1),
                cursorPos + 1
            );
            atualizarLinhaAtiva();
        } else if (e.key === 'Enter') {
            tratarEntrada('ENTER');
        } else if (e.key === 'Backspace') {
            tratarEntrada('APAGAR');
        } else {
            const letra = e.key.toUpperCase();
    
            if (/^[A-ZÃÁÂÀÉÊÍÓÔÕÚÇ]$/.test(letra)) {
                tratarEntrada(letra);
            }
        }
    });
}

// ---------- NAVEGAÇÃO ENTRE TELAS ----------
function trocarTela(nomeTela) {
    Object.values(telas).forEach(t => t.classList.remove('ativa'));
    telas[nomeTela].classList.add('ativa');

    if (nomeTela !== 'jogo') {
        pararCronometro();
    }
}

function abrirTelaTemas(modo) {
    modoAtual = modo;
    document.getElementById('modo-temas').textContent = modo === 'normal' ? 'Normal' : 'Infinito';
    document.getElementById('modo-temas').className = `etiqueta-modo modo-${modo}`;
    document.getElementById('texto-temas').textContent = modo === 'normal'
        ? "Escolha um tema para jogar palavras de 5 letras."
        : "No modo infinito o tamanho da palavra muda a cada rodada!";

    renderizarListaTemas();
    trocarTela('temas');
}

function renderizarListaTemas() {
    const container = document.getElementById('lista-temas');
    container.innerHTML = '';

    const emojis = {
        Geral: '🌟',
        Verbos: '⚡',
        Alimentos: '🍎',
        Objetos: '📦',
        Animais: '🐾',
        Verbos2: '🔥'
    };

    const lista = Object.keys(palavrasPorTema);

    lista.forEach(tema => {
        const btn = document.createElement('button');
        btn.className = 'tema tema-botao';
        btn.innerHTML = `
            <span class="emoji">${emojis[tema] || '🎯'}</span>
            <span>${tema}</span>
        `;
        btn.addEventListener('click', () => {
            iniciarJogo(modoAtual, tema);
            trocarTela('jogo');
        });
        container.appendChild(btn);
    });
}

// ---------- LÓGICA DE JOGO ----------
function iniciarJogo(modo, tema) {
    modoAtual = modo;
    temaAtual = tema;
    tentativas = [];
    tentativaAtual = "";
    jogoTerminado = false;

    // Sorteia a palavra do tema escolhido
    let palavraCrua = sortearPalavra(tema);

    // No modo normal, busca uma palavra de 5 letras se a sorteada não for de 5
    if (modo === 'normal') {
        const listaNormalizada = palavrasPorTema[tema].filter(p => removerAcentos(p.trim()).length === 5);
        if (listaNormalizada.length > 0) {
            palavraCrua = listaNormalizada[Math.floor(Math.random() * listaNormalizada.length)];
        }
    }

    palavraSecreta = removerAcentos(palavraCrua.trim().toUpperCase());

    document.getElementById('tema-atual').textContent = tema;
    document.getElementById('modo-atual').textContent = modo === 'normal' ? 'Normal' : 'Infinito';
    document.getElementById('tela-jogo').className = `tela ativa jogo-${modo}`;
    
    document.getElementById('contador-tentativas').textContent = `0/${LIMITE_TENTATIVAS}`;
    document.getElementById('vitorias').textContent = estatisticas.vitorias;

    const dicaTamanho = document.getElementById('dica-tamanho');
    if (modo === 'infinito') {
        dicaTamanho.textContent = "Tamanho da palavra: Oculto (Descubra digitando!)";
        elTabuleiro.classList.add('oculto');
    } else {
        dicaTamanho.textContent = `Palavra de ${palavraSecreta.length} letras`;
        elTabuleiro.classList.remove('oculto');
    }

    montarTabuleiro();
    resetarTeclado();
    iniciarCronometro();
}

function removerAcentos(texto) {
    return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}


const cacheDicionario = new Map();

// Consulta uma palavra exata no dicionário.
async function consultarDicionario(palavra) {
    if (cacheDicionario.has(palavra)) {
        return cacheDicionario.get(palavra);
    }

    const resposta = await fetch(
        `https://api.dicionario-aberto.net/word/${encodeURIComponent(palavra)}`
    );

    if (!resposta.ok && resposta.status !== 404) {
        throw new Error(`Erro HTTP: ${resposta.status}`);
    }

    if (resposta.status === 404) {
        cacheDicionario.set(palavra, false);
        return false;
    }

    const dados = await resposta.json();
    const existe = Array.isArray(dados)
        ? dados.length > 0
        : Boolean(dados && (dados.word || dados.entry));

    cacheDicionario.set(palavra, existe);
    return existe;
}

// Gera formas possíveis da palavra original.
function gerarFormasBase(palavra) {
    const formas = new Set();

    // Plurais comuns: casas -> casa, flores -> flor.
    if (palavra.endsWith("ões")) formas.add(palavra.slice(0, -3) + "ão");
    if (palavra.endsWith("ais")) formas.add(palavra.slice(0, -3) + "al");
    if (palavra.endsWith("éis")) formas.add(palavra.slice(0, -3) + "el");
    if (palavra.endsWith("óis")) formas.add(palavra.slice(0, -3) + "ol");
    if (palavra.endsWith("uis")) formas.add(palavra.slice(0, -3) + "ul");

    if (palavra.endsWith("es")) formas.add(palavra.slice(0, -2));
    if (palavra.endsWith("s")) formas.add(palavra.slice(0, -1));

    // Conjugações regulares comuns.
    const terminacoes = [
        ["aram", "ar"], ["eram", "er"], ["iram", "ir"],
        ["avam", "ar"], ["ando", "ar"], ["endo", "er"],
        ["indo", "ir"], ["aria", "ar"], ["ariam", "ar"],
        ["arei", "ar"], ["ererei", "er"], ["irei", "ir"],
        ["aste", "ar"], ["este", "er"], ["iste", "ir"],
        ["ou", "ar"], ["eu", "er"], ["iu", "ir"],
        ["ava", "ar"], ["ado", "ar"], ["ido", "ir"]
    ];

    for (const [final, infinitivo] of terminacoes) {
        if (palavra.endsWith(final) && palavra.length > final.length) {
            formas.add(palavra.slice(0, -final.length) + infinitivo);
        }
    }

    formas.delete(palavra);
    return [...formas];
}

async function palavraExiste(palavra) {
    const busca = removerAcentos(
        palavra.trim().toLowerCase()
    );

    if (!busca) return false;

    try {
        // Primeiro, verifica a palavra exatamente como foi digitada.
        if (await consultarDicionario(busca)) {
            return true;
        }

        // Depois, verifica possíveis formas originais.
        const formasBase = gerarFormasBase(busca);

        for (const forma of formasBase) {
            if (forma && await consultarDicionario(forma)) {
                return true;
            }
        }

        return false;
    } catch (erro) {
        console.error("Falha na consulta:", erro);
        return null;
    }
}


// ---------- TABULEIRO ----------
function montarTabuleiro() {
    elTabuleiro.innerHTML = '';
    const numColunas = palavraSecreta.length;
    elTabuleiro.style.setProperty('--colunas', numColunas);

    for (let i = 0; i < LIMITE_TENTATIVAS; i++) {
        const linha = document.createElement('div');
        linha.className = 'linha';

        for (let j = 0; j < numColunas; j++) {
            const letra = document.createElement('div');
            letra.className = 'letra';
            linha.appendChild(letra);
        }
        elTabuleiro.appendChild(linha);
    }
    atualizarLinhaAtiva();
}

function atualizarLinhaAtiva() {
    if (jogoTerminado) return;
    
    const linhaIndex = tentativas.length;
    if (linhaIndex >= LIMITE_TENTATIVAS) return;

    const linhaAtual = elTabuleiro.children[linhaIndex];
    const letras = linhaAtual.children;
    const numColunas = palavraSecreta.length;

    for (let i = 0; i < numColunas; i++) {
        const char = tentativaAtual[i] || '';
        letras[i].textContent = char;

        letras[i].className = 'letra';
        if (char) {
            letras[i].classList.add('preenchida');
        }
        if (i === cursorPos && i < numColunas) {
            letras[i].classList.add('ativa');
        }
    }
}

// ---------- TECLAS ----------
function tratarEntrada(tecla) {
    if (jogoTerminado) return;

    const numColunas = palavraSecreta.length;

    if (tecla === 'APAGAR') {
        if (tentativaAtual.length > 0) {
            tentativaAtual = tentativaAtual.slice(0, -1);
            atualizarLinhaAtiva();
        }
    } else if (tecla === 'ENTER') {
        if (tentativaAtual.length < numColunas) {
            tremerLinha();
            mostrarAviso(`A palavra precisa ter ${numColunas} letras!`);
            return;
        }
        submeterTentativa();
    } else {
        if (cursorPos < numColunas) {
            if (cursorPos < tentativaAtual.length) {
                tentativaAtual =
                    tentativaAtual.slice(0, cursorPos) +
                    tecla +
                    tentativaAtual.slice(cursorPos + 1);
            } else {
                tentativaAtual += tecla;
            }
    
            cursorPos = Math.min(cursorPos + 1, numColunas - 1);
            atualizarLinhaAtiva();
        }
    }
}

function tremerLinha() {
    const linhaIndex = tentativas.length;
    const linha = elTabuleiro.children[linhaIndex];
    linha.classList.add('tremer');
    setTimeout(() => linha.classList.remove('tremer'), 400);
}

let consultandoPalavra = false;

async function submeterTentativa() {
    if (consultandoPalavra || jogoTerminado) {
        return;
    }

    const pal = removerAcentos(tentativaAtual.trim().toUpperCase());

    // Verifica se a palavra tem o tamanho correto
    if (pal.length !== palavraSecreta.length) {
        mostrarAviso("A palavra está incompleta!");
        return;
    }

    consultandoPalavra = true;

    try {
        // Consulta o dicionário antes de gastar uma tentativa
        const existe = await palavraExiste(pal);

        if (existe === null) {
            mostrarAviso("Não foi possível consultar o dicionário. Tente novamente.");
            return;
        }

        if (!existe) {
            tremerLinha();
            mostrarAviso("Essa palavra não foi encontrada no dicionário!");
            return;
        }

        // Só adiciona a tentativa se a palavra for válida
        tentativas.push(pal);

        const linhaIndex = tentativas.length - 1;
        const linha = elTabuleiro.children[linhaIndex];

        if (!linha) {
            tentativas.pop();
            mostrarAviso("Não foi possível registrar a tentativa.");
            return;
        }

        const letrasEl = linha.children;

        document.getElementById('contador-tentativas').textContent =
            `${tentativas.length}/${LIMITE_TENTATIVAS}`;

        const segredoArray = palavraSecreta.split('');
        const resultado = new Array(palavraSecreta.length).fill('errada');

        // Primeiro, identifica as letras na posição correta
        for (let i = 0; i < palavraSecreta.length; i++) {
            if (pal[i] === segredoArray[i]) {
                resultado[i] = 'correta';
                segredoArray[i] = null;
            }
        }

        // Depois, identifica as letras existentes em outras posições
        for (let i = 0; i < palavraSecreta.length; i++) {
            if (resultado[i] !== 'correta') {
                const pos = segredoArray.indexOf(pal[i]);

                if (pos !== -1) {
                    resultado[i] = 'existe';
                    segredoArray[pos] = null;
                }
            }
        }

        // Revela as cores com animação, uma letra por vez
        for (let i = 0; i < palavraSecreta.length; i++) {
            setTimeout(() => {
                letrasEl[i].classList.add('revelando', resultado[i]);
                atualizarTeclado(pal[i], resultado[i]);
            }, i * 120);
        }

        // Aguarda o fim da animação para continuar o jogo
        setTimeout(() => {
            try {
                if (pal === palavraSecreta) {
                    finalizarJogo(true);
                } else if (tentativas.length >= LIMITE_TENTATIVAS) {
                    finalizarJogo(false);
                } else {
                    tentativaAtual = "";
                    atualizarLinhaAtiva();
                }
            } finally {
                consultandoPalavra = false;
            }
        }, palavraSecreta.length * 120 + 200);

    } catch (erro) {
        console.error("Erro ao validar a palavra:", erro);
        mostrarAviso("Ocorreu um erro ao verificar a palavra. Tente novamente.");
    } finally {
        // Libera o envio quando não há uma animação pendente
        if (
            !tentativas.length ||
            tentativas[tentativas.length - 1] !== pal
        ) {
            consultandoPalavra = false;
        }
    }
}

function atualizarTeclado(letra, estado) {
    const btnTecla = elTeclado.querySelector(`[data-tecla="${letra}"]`);
    if (!btnTecla) return;

    if (estado === 'correta') {
        btnTecla.className = 'tecla correta';
    } else if (estado === 'existe' && !btnTecla.classList.contains('correta')) {
        btnTecla.className = 'tecla existe';
    } else if (estado === 'errada' && !btnTecla.classList.contains('correta') && !btnTecla.classList.contains('existe')) {
        btnTecla.className = 'tecla errada';
    }
}

function resetarTeclado() {
    const teclas = elTeclado.querySelectorAll('.tecla');
    teclas.forEach(t => {
        if (t.classList.contains('enviar')) {
            t.className = 'tecla especial enviar';
        } else if (t.classList.contains('especial')) {
            t.className = 'tecla especial';
        } else {
            t.className = 'tecla';
        }
    });
}

// ---------- CRONÔMETRO ----------
function iniciarCronometro() {
    pararCronometro();
    segundosDecorridos = 0;
    document.getElementById('tempo').textContent = "00:00";

    intervaloTempo = setInterval(() => {
        segundosDecorridos++;
        const mins = String(Math.floor(segundosDecorridos / 60)).padStart(2, '0');
        const segs = String(segundosDecorridos % 60).padStart(2, '0');
        document.getElementById('tempo').textContent = `${mins}:${segs}`;
    }, 1000);
}

function pararCronometro() {
    if (intervaloTempo) clearInterval(intervaloTempo);
}

// ---------- ESTATÍSTICAS E MODAL ----------
function finalizarJogo(vitoria) {
    jogoTerminado = true;
    pararCronometro();

    estatisticas.jogos++;
    if (vitoria) {
        estatisticas.vitorias++;
        estatisticas.sequencia++;
        
        const linhaIndex = tentativas.length - 1;
        elTabuleiro.children[linhaIndex].classList.add('vitoria');
    } else {
        estatisticas.sequencia = 0;
    }

    salvarEstatisticas();
    document.getElementById('vitorias').textContent = estatisticas.vitorias;

    setTimeout(() => {
        abrirModalResultado(vitoria);
    }, 600);
}

function abrirModalResultado(vitoria) {
    const elTitulo = document.getElementById('resultado-titulo');
    const elTexto = document.getElementById('resultado-texto');
    const elPalavra = document.getElementById('resultado-palavra');

    if (vitoria) {
        elTitulo.textContent = "Você acertou! 🎉";
        elTexto.textContent = "Parabéns, a palavra era:";
    } else {
        elTitulo.textContent = "Que pena! 😢";
        elTexto.textContent = "A palavra correta era:";
    }

    elPalavra.textContent = palavraSecreta;
    elModal.classList.add('aberto');
}

function fecharModal() {
    elModal.classList.remove('aberto');
}

function carregarEstatisticas() {
    const dados = localStorage.getItem('termo_estatisticas');
    if (dados) {
        try {
            estatisticas = JSON.parse(dados);
        } catch (e) {
            console.error(e);
        }
    }
}

function salvarEstatisticas() {
    localStorage.setItem('termo_estatisticas', JSON.stringify(estatisticas));
}

function mostrarEstatisticasModal() {
    const percentual = estatisticas.jogos > 0 
        ? Math.round((estatisticas.vitorias / estatisticas.jogos) * 100) 
        : 0;

    const elTitulo = document.getElementById('resultado-titulo');
    const elTexto = document.getElementById('resultado-texto');
    const elPalavra = document.getElementById('resultado-palavra');

    elTitulo.textContent = "Sua Estatísticas";
    elTexto.textContent = "";
    elPalavra.style.display = 'none';

    let container = document.querySelector('.estatisticas');
    if (!container) {
        container = document.createElement('div');
        container.className = 'estatisticas';
        elPalavra.parentNode.insertBefore(container, elPalavra.nextSibling);
    }

    container.innerHTML = `
        <div class="estatistica"><strong>${estatisticas.jogos}</strong><span>Jogos</span></div>
        <div class="estatistica"><strong>${percentual}%</strong><span>Vitórias</span></div>
        <div class="estatistica"><strong>${estatisticas.sequencia}</strong><span>Sequência</span></div>
    `;

    elModal.classList.add('aberto');

    const fecharEstat = () => {
        elPalavra.style.display = 'inline-block';
        if (container) container.remove();
        btns.jogarNovamente.removeEventListener('click', fecharEstat);
    };
    btns.jogarNovamente.addEventListener('click', fecharEstat);
}

// ---------- AVISOS ----------
function mostrarAviso(texto) {
    const aviso = document.createElement('div');
    aviso.className = 'aviso';
    aviso.textContent = texto;

    elAvisos.appendChild(aviso);

    setTimeout(() => {
        aviso.classList.add('saindo');
        setTimeout(() => aviso.remove(), 300);
    }, 2500);
}
