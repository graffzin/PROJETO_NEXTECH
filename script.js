let modoAtual = null;
let temaAtual = null;
let palavraSecreta = "";
let tentativas = [];
let jogoTerminado = false;
let tempoInicial = null;
const LIMITE_TENTATIVAS = 6;

function iniciarJogo(modo, tema) {
    modoAtual = modo;
    temaAtual = tema;
    palavraSecreta = "";
    tentativas = [];
    jogoTerminado = false;
    tempoInicial = null;
}


const palavrasPorTema = {
    Geral: [],
    Verbos: [],
    
    Alimentos: [],
    Objetos: [],
    Animais: [],
    
};