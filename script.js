/* ==========================================================================
   Para minha Goianinha ❤
   --------------------------------------------------------------------------
   Tudo o que aparece na tela (vela, chama, isqueiro, flores, folhas e grama)
   é desenhado como uma NUVEM DE PALAVRAS: cada forma é uma máscara que vai
   sendo preenchida por palavras de amor, das maiores para as menores.

   Desempenho: as nuvens são geradas uma vez só (em fatias, sem travar a
   página) e guardadas como imagens; a cada quadro só se "carimbam" imagens.
   ========================================================================== */
(() => {
  'use strict';

  document.documentElement.classList.add('js');

  /* ============================ PERSONALIZAÇÃO ============================ */

  // ❤ Dia em que vocês começaram a namorar (ano-mês-dia)
  const INICIO_NAMORO = '2026-06-16';

  // ❤ Iniciais da constelação (a tua e a dela). Pode ter mais de uma letra: ['JP', 'G']
  const INICIAIS = ['N', 'M'];

  // ❤ A carta que a vela escreve ao derreter (parágrafos separados por uma linha em branco)
  const CARTA = {
    saudacao: 'Minha Mikaelly,',
    texto: `Desde o dia em que te conheci, tudo foi ficando mais bonito, você chegou de repente na minha vida, e quando dei por mim, você já morava em cada pensamento meu.

Obrigado pelo carinho, pelas risadas e por ser exatamente quem você é, esta vela queimou só para te dizer uma coisa que eu nunca vou cansar de repetir, eu te amo.

E prometo cuidar do nosso jardim todos os dias, para ele nunca parar de florescer.`,
    assinatura: 'Com todo o meu amor ❤',
  };

  // Quanto tempo a vela leva para escrever a carta sozinha (segundos).
  // Quando ela diz "eu também te amo", a chama cresce e fica umas 7x mais rápido.
  const DURACAO_CARTA = 90;
  const ESPERA_DERRETER = 12; // segundos depois da frase aparecer

  // Palavras da vela, da chama e do isqueiro
  const PALAVRAS_VELA = ['te amo'];

  // Palavras das flores
  const PALAVRAS_FLORES = [
    'amor', 'te amo', 'meu amor', 'paixão', 'carinho', 'linda', 'minha vida',
    'coração', 'pra sempre', 'juntos', 'beijo', 'abraço', 'saudade',
    'felicidade', 'Goianinha', 'eu e você', 'meu bem', 'sorriso', 'sonho', 'amo você',
  ];

  // Palavras curtinhas, usadas para preencher os cantinhos das formas
  const PALAVRAS_CURTAS = ['amor', 'te amo', 'beijo', 'linda', 'amo', 'nós', 'meu bem', 'paixão'];

  // Caules, folhas e grama
  const PALAVRAS_VERDES = ['amor', 'te amo', 'amo', 'nós', 'sempre'];

  const DICA_MOUSE = 'aproxime o isqueiro da vela';
  const DICA_TOQUE = 'arraste o isqueiro até a vela';

  const SANS = '"Quicksand", "Trebuchet MS", "Segoe UI", sans-serif';
  const CURSIVA = '"Dancing Script", "Brush Script MT", cursive';

  // Cores das flores: pétalas + miolo
  const PALETAS = [
    { petalas: ['#ff5c8a', '#ff7aa2', '#ff4778', '#ff9bb9'], miolo: ['#ffd23f', '#ffb627', '#ffe58a'] }, // rosa
    { petalas: ['#ff2b45', '#e8143a', '#ff4a5e', '#ff6b78'], miolo: ['#ffd23f', '#ffcd5a', '#ffbf1f'] }, // vermelho
    { petalas: ['#b06cff', '#9a4dff', '#c592ff', '#d4adff'], miolo: ['#ffe066', '#ffd23f'] },            // roxo
    { petalas: ['#ffd53d', '#ffe066', '#ffc61a', '#fff09a'], miolo: ['#7a4a22', '#5c3317', '#9a5c2a'] }, // amarelo
    { petalas: ['#ff8a3d', '#ff9f5a', '#ff7424', '#ffb27a'], miolo: ['#6b3a1c', '#8a4b22', '#a0602e'] }, // laranja
    { petalas: ['#fff6ee', '#ffe9f0', '#f4ecff', '#ffffff'], miolo: ['#ffd23f', '#ffc21a'] },            // branco
    { petalas: ['#4fa8ff', '#6dbbff', '#3b8cff', '#9fd2ff'], miolo: ['#fff1a8', '#ffe066'] },            // azul
    { petalas: ['#ffb3d9', '#f7a1e0', '#ffc8e6', '#ee8fd0'], miolo: ['#ffe066', '#ffcf40'] },            // lilás
    { petalas: ['#ff6f61', '#ff8c7a', '#ff5a4a', '#ffa596'], miolo: ['#ffe066', '#ffd23f'] },            // coral
  ];

  const VERDES = [
    ['#3fae5a', '#5cc46f', '#2e8b47', '#7ad384'],
    ['#2f9e6e', '#49b886', '#22805a', '#6fcf9f'],
    ['#6cbf3f', '#86d45c', '#4f9e2c', '#a3e07a'],
  ];

  /* ============================== AMBIENTE =============================== */

  const MOV = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches ? 0.35 : 1;
  const TOQUE = !!(window.matchMedia && matchMedia('(hover: none), (pointer: coarse)').matches);

  const tela = document.getElementById('cena');
  const ctx = tela.getContext('2d', { alpha: false });
  const telaCursor = document.getElementById('cursor');
  const cctx = telaCursor.getContext('2d');
  const elMensagem = document.getElementById('mensagem');
  const elTexto = document.getElementById('mensagem-texto');
  const elDica = document.getElementById('dica');

  const RL = 100;            // raio "de fábrica" das flores da biblioteca
  const DURACAO_LUZ = 6.2;   // segundos para a luz tomar a tela toda
  const ATRASO_LUZ = 0.35;

  let W = 0, H = 0, DPR = 1;
  let escala = 1;            // resolução da tela principal (pode baixar sozinha se o aparelho for lento)
  let limiteEscala = 2;
  let pronto = false, tPronto = 0, agora = 0, ultimo = 0, alfaCena = 0;
  const G = {}; // geometria da cena
  const est = { aceso: false, tAceso: 0, luzR: 0, mensagem: false, tMensagem: 0, inclinacao: -0.22, vx: 0 };
  const ponteiro = { x: 0, y: 0, ux: null, mexeu: false, toque: TOQUE };

  let velaApagada, velaAcesa, prato, chamaImg, isqueiro, chamaIsqImg, gramaImg = null, brilhoImg;
  let folhas = null, biblioteca = null, promessaBiblioteca = null;
  let flores = [];
  const fagulhas = [];
  let vagalumes = [];

  // fundo já pronto (luz + grama, e às vezes o jardim inteiro) para não repintar tudo a cada quadro
  let fundoFixo = null;
  const desempenho = { amostras: [], congelar: false, congelado: false };

  /* ============================== UTILIDADES ============================== */

  const rand = (a, b) => a + Math.random() * (b - a);
  const randInt = (a, b) => Math.floor(rand(a, b + 1));
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
  const easeInOutSine = (t) => -(Math.cos(Math.PI * t) - 1) / 2;
  const easeOutBack = (t) => {
    const c1 = 1.70158, c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  };
  const cruza = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  const dentro = (x, y, r) => r && x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
  const expandir = (r, px, py) => ({ x: r.x - px, y: r.y - py, w: r.w + 2 * px, h: r.h + 2 * py });
  const pausa = () => new Promise((ok) => setTimeout(ok, 0)); // devolve a vez ao navegador
  // vibração no celular (só depois de ela já ter tocado na tela, que é quando o navegador permite)
  const vibrar = (padrao) => {
    const ativo = !navigator.userActivation || navigator.userActivation.hasBeenActive;
    if (navigator.vibrate && ativo) { try { navigator.vibrate(padrao); } catch (_) { /* ok */ } }
  };

  function embaralhar(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  const cacheRgb = new Map();
  function hexRgb(hex) {
    let v = cacheRgb.get(hex);
    if (!v) {
      const n = parseInt(hex.slice(1), 16);
      v = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
      cacheRgb.set(hex, v);
    }
    return v;
  }

  // cor com brilho multiplicado por f e, opcionalmente, misturada com outra cor
  function tom(hex, f = 1, mistura = null, m = 0) {
    let [r, g, b] = hexRgb(hex);
    if (mistura) {
      const [r2, g2, b2] = hexRgb(mistura);
      r = lerp(r, r2, m); g = lerp(g, g2, m); b = lerp(b, b2, m);
    }
    return `rgb(${clamp(r * f, 0, 255) | 0},${clamp(g * f, 0, 255) | 0},${clamp(b * f, 0, 255) | 0})`;
  }

  function novoCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.ceil(w));
    c.height = Math.max(1, Math.ceil(h));
    return c;
  }

  // Mede cada palavra UMA vez (a 100px) e depois só faz regra de três:
  // o tamanho do texto cresce em proporção à fonte. (Medir é caro!)
  const medidor = novoCanvas(4, 4).getContext('2d');
  const cacheMedidas = new Map();
  function medir(texto, fonte) {
    const i1 = fonte.indexOf(' '), i2 = fonte.indexOf(' ', i1 + 1);
    const peso = fonte.slice(0, i1);
    const tam = parseFloat(fonte.slice(i1 + 1, i2)) || 10;
    const familia = fonte.slice(i2 + 1);
    const chave = peso + '|' + familia + '|' + texto;
    let b = cacheMedidas.get(chave);
    if (!b) {
      medidor.font = `${peso} 100px ${familia}`;
      const r = medidor.measureText(texto);
      b = {
        esq: r.actualBoundingBoxLeft ?? 0,
        dir: r.actualBoundingBoxRight ?? r.width,
        asc: r.actualBoundingBoxAscent ?? 75,
        desc: r.actualBoundingBoxDescent ?? 20,
      };
      cacheMedidas.set(chave, b);
    }
    const k = tam / 100;
    return { esq: b.esq * k, dir: b.dir * k, asc: b.asc * k, desc: b.desc * k };
  }
  const larguraTexto = (texto, fonte) => { const m = medir(texto, fonte); return m.esq + m.dir; };

  /* ========================== NUVEM DE PALAVRAS ========================== */
  /*
     o.w, o.h      tamanho da caixa (px)
     o.forma       função que desenha a forma (máscara) em branco
     o.palavras    lista de palavras
     o.max, o.min  maior e menor tamanho de fonte
     o.rotacao     chance de a palavra ficar em pé (90°)
     o.cursiva     chance de as palavras grandes usarem a fonte cursiva
     o.cota        quantas palavras grandes entram por nível de tamanho
     o.cor(nx,ny)  cor de cada palavra pela posição (0..1) dentro da caixa
  */
  function nuvem(o) {
    const w = Math.max(2, Math.ceil(o.w)), h = Math.max(2, Math.ceil(o.h));
    const palavras = o.palavras || PALAVRAS_VELA;
    const curtas = o.curtas || palavras;
    const rot = o.rotacao ?? 0.3;
    const cursiva = o.cursiva ?? 0.35;
    const espaco = o.espaco ?? 0.7;
    const tMin = Math.max(1.6, o.min);
    const tMax = Math.max(tMin, o.max);

    // máscara: 0 = livre, 1 = bloqueado
    const mc = novoCanvas(w, h);
    const mx = mc.getContext('2d', { willReadFrequently: true });
    mx.fillStyle = '#fff';
    o.forma(mx, w, h);
    const px = mx.getImageData(0, 0, w, h).data;
    const bloq = new Uint8Array(w * h);
    for (let i = 0; i < bloq.length; i++) bloq[i] = px[i * 4 + 3] > 140 ? 0 : 1;

    const livre = (x, y, bw, bh) => {
      const x0 = Math.floor(x), y0 = Math.floor(y), x1 = Math.ceil(x + bw), y1 = Math.ceil(y + bh);
      if (x0 < 0 || y0 < 0 || x1 > w || y1 > h || x1 <= x0 || y1 <= y0) return false;
      if (bloq[((y0 + y1) >> 1) * w + ((x0 + x1) >> 1)] || bloq[y0 * w + x0] || bloq[(y1 - 1) * w + x1 - 1] ||
          bloq[y0 * w + x1 - 1] || bloq[(y1 - 1) * w + x0]) return false;
      for (let yy = y0; yy < y1; yy++) {
        const l = yy * w;
        for (let xx = x0; xx < x1; xx++) if (bloq[l + xx]) return false;
      }
      return true;
    };

    const marcar = (x, y, bw, bh) => {
      const x0 = Math.max(0, Math.floor(x - espaco)), y0 = Math.max(0, Math.floor(y - espaco));
      const x1 = Math.min(w, Math.ceil(x + bw + espaco)), y1 = Math.min(h, Math.ceil(y + bh + espaco));
      for (let yy = y0; yy < y1; yy++) bloq.fill(1, yy * w + x0, yy * w + x1);
    };

    const preparar = (texto, tam, girar, familia) => {
      const fonte = `700 ${tam}px ${familia}`;
      const m = medir(texto, fonte);
      const larg = m.esq + m.dir, alt = m.asc + m.desc;
      return { texto, fonte, girar, m, tam, bw: girar ? alt : larg, bh: girar ? larg : alt };
    };

    const itens = [];
    const colocar = (p, x, y) => {
      marcar(x, y, p.bw, p.bh);
      p.x = x; p.y = y;
      p.nx = (x + p.bw / 2) / w;
      p.ny = (y + p.bh / 2) / h;
      p.cor = o.cor(p.nx, p.ny, p);
      itens.push(p);
    };

    // 1) das palavras grandes para as pequenas, em posições aleatórias
    let tam = tMax, nivel = 0;
    while (tam >= tMin) {
      const cota = tam > tMax * 0.45 ? (o.cota ?? 2) * (nivel + 1) : Infinity;
      let falhas = 0, postas = 0;
      while (falhas < 6 && postas < cota) {
        const t = Math.round(tam * rand(0.9, 1.08) * 4) / 4;
        const familia = t > tMax * 0.55 && Math.random() < cursiva ? CURSIVA : SANS;
        const p = preparar(pick(palavras), t, Math.random() < rot, familia);
        if (p.bw >= w || p.bh >= h) { falhas++; continue; }
        let ok = false;
        for (let k = 0; k < 50; k++) {
          const x = Math.random() * (w - p.bw), y = Math.random() * (h - p.bh);
          if (livre(x, y, p.bw, p.bh)) { colocar(p, x, y); ok = true; break; }
        }
        if (ok) postas++; else falhas++;
      }
      tam *= 0.82;
      nivel++;
    }

    // 2) preenchimento fino: varre a forma encaixando palavrinhas nos buracos
    if (o.preencher !== false) {
      const passo = Math.max(1, tMin * 0.45);
      for (let y = rand(0, passo); y < h; y += passo) {
        for (let x = rand(0, passo); x < w; x += passo) {
          if (bloq[Math.floor(y) * w + Math.floor(x)]) continue;
          const girar = Math.random() < rot;
          for (const g of [girar, !girar]) {
            const p = preparar(pick(curtas), tMin, g, SANS);
            if (livre(x, y, p.bw, p.bh)) { colocar(p, x, y); break; }
          }
        }
      }
    }
    return { itens, w, h };
  }

  function desenharPalavra(c, p) {
    c.font = p.fonte;
    c.fillStyle = p.cor;
    if (p.girar) {
      c.save();
      c.translate(p.x + p.m.asc, p.y + p.m.esq + p.m.dir);
      c.rotate(-Math.PI / 2);
      c.fillText(p.texto, p.m.esq, 0);
      c.restore();
    } else {
      c.fillText(p.texto, p.x + p.m.esq, p.y + p.m.asc);
    }
  }

  // aplica uma sombra/brilho a uma imagem inteira de uma vez (bem mais leve
  // do que aplicar palavra por palavra ou pétala por pétala)
  function comSombra(origem, cor, blur) {
    const c = novoCanvas(origem.width, origem.height);
    const x = c.getContext('2d');
    x.shadowColor = cor;
    x.shadowBlur = blur;
    x.drawImage(origem, 0, 0);
    Object.assign(c, { lw: origem.lw, lh: origem.lh, escala: origem.escala });
    return c;
  }

  // brilho (opcional): { cor, blur } deixa as palavras "acesas", como brasa
  function rasterizar(nv, escalaR, brilho) {
    const c = novoCanvas(nv.w * escalaR, nv.h * escalaR);
    const x = c.getContext('2d');
    x.scale(escalaR, escalaR);
    x.textBaseline = 'alphabetic';
    x.textAlign = 'left';
    for (const p of nv.itens) desenharPalavra(x, p);
    c.lw = nv.w; c.lh = nv.h; c.escala = escalaR;
    return brilho ? comSombra(c, brilho.cor, brilho.blur * escalaR) : c;
  }

  /* ================================ FORMAS ================================ */

  function retArred(c, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }

  function gota(c, x, y, r, comp) {
    c.beginPath();
    c.moveTo(x - r, y);
    c.lineTo(x - r, y + comp);
    c.arc(x, y + comp, r, Math.PI, 0, true);
    c.lineTo(x + r, y);
    c.closePath();
    c.fill();
  }

  function formaVela(c, w, h) {
    const x0 = w * 0.1, x1 = w * 0.9, topo = h * 0.045, r = w * 0.09;
    c.beginPath();
    c.moveTo(x0, topo + h * 0.02);
    c.bezierCurveTo(x0 + (x1 - x0) * 0.3, topo - h * 0.03, x0 + (x1 - x0) * 0.6, topo + h * 0.03, x1, topo);
    c.lineTo(x1, h - r);
    c.quadraticCurveTo(x1, h, x1 - r, h);
    c.lineTo(x0 + r, h);
    c.quadraticCurveTo(x0, h, x0, h - r);
    c.closePath();
    c.fill();
    // cera escorrendo pelas laterais
    gota(c, x0 + w * 0.015, topo + h * 0.02, w * 0.07, h * 0.13);
    gota(c, x1 - w * 0.01, topo + h * 0.01, w * 0.065, h * 0.22);
  }

  function formaElipse(c, w, h) {
    c.beginPath();
    c.ellipse(w / 2, h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
    c.fill();
  }

  function formaChama(c, w, h) {
    c.beginPath();
    c.moveTo(w * 0.5, 0);
    c.bezierCurveTo(w * 0.62, h * 0.22, w * 1.0, h * 0.48, w * 0.96, h * 0.72);
    c.bezierCurveTo(w * 0.92, h * 0.95, w * 0.66, h, w * 0.5, h);
    c.bezierCurveTo(w * 0.34, h, w * 0.08, h * 0.95, w * 0.04, h * 0.72);
    c.bezierCurveTo(w * 0.0, h * 0.48, w * 0.38, h * 0.22, w * 0.5, 0);
    c.closePath();
    c.fill();
  }

  function formaPetalaFina(c, w, h) {
    c.beginPath();
    c.moveTo(w / 2, h);
    c.bezierCurveTo(-w * 0.1, h * 0.75, w * 0.05, h * 0.1, w / 2, 0);
    c.bezierCurveTo(w * 0.95, h * 0.1, w * 1.1, h * 0.75, w / 2, h);
    c.fill();
  }

  function formaPetalaRedonda(c, w, h) {
    c.beginPath();
    c.moveTo(w / 2, h);
    c.bezierCurveTo(-w * 0.12, h * 0.72, w * 0.02, h * 0.02, w / 2, h * 0.02);
    c.bezierCurveTo(w * 0.98, h * 0.02, w * 1.12, h * 0.72, w / 2, h);
    c.fill();
  }

  function formaCoracao(c, w, h) {
    c.beginPath();
    c.moveTo(w * 0.5, h);
    c.bezierCurveTo(w * 0.1, h * 0.72, -w * 0.02, h * 0.38, w * 0.2, h * 0.12);
    c.bezierCurveTo(w * 0.36, -h * 0.04, w * 0.5, h * 0.1, w * 0.5, h * 0.24);
    c.bezierCurveTo(w * 0.5, h * 0.1, w * 0.64, -h * 0.04, w * 0.8, h * 0.12);
    c.bezierCurveTo(w * 1.02, h * 0.38, w * 0.9, h * 0.72, w * 0.5, h);
    c.fill();
  }

  function formaTulipa(c, w, h) {
    c.beginPath();
    c.moveTo(w * 0.1, h * 0.04);
    c.quadraticCurveTo(w * 0.24, h * 0.2, w * 0.33, h * 0.3);
    c.quadraticCurveTo(w * 0.4, h * 0.1, w * 0.5, 0);
    c.quadraticCurveTo(w * 0.6, h * 0.1, w * 0.67, h * 0.3);
    c.quadraticCurveTo(w * 0.76, h * 0.2, w * 0.9, h * 0.04);
    c.bezierCurveTo(w * 1.02, h * 0.4, w * 0.98, h * 0.82, w * 0.5, h);
    c.bezierCurveTo(w * 0.02, h * 0.82, -w * 0.02, h * 0.4, w * 0.1, h * 0.04);
    c.fill();
  }

  function formaFolha(c, w, h) {
    c.beginPath();
    c.moveTo(w / 2, h);
    c.quadraticCurveTo(-w * 0.1, h * 0.55, w / 2, 0);
    c.quadraticCurveTo(w * 1.1, h * 0.55, w / 2, h);
    c.fill();
  }

  /* ================================ CORES ================================ */

  function corVela(nx, ny) {
    const base = pick(['#f6e7c8', '#f1ddb5', '#fff2da', '#ecd3a6', '#f9ead0']);
    if (ny < 0.075) return tom(base, 1.04, '#ffffff', 0.35);   // cera derretida do topo
    const d = (nx - 0.4) / 0.6;                               // sombra de cilindro
    return tom(base, clamp(1.04 - 0.42 * d * d, 0.55, 1.05));
  }

  function corChama(nx, ny) {
    if (ny > 0.84 && Math.abs(nx - 0.5) < 0.2) return pick(['#8fc4ff', '#a9d2ff', '#6fa8ff']); // base azulada
    const dx = (nx - 0.5) / 0.46;
    const dy = ny < 0.68 ? (ny - 0.68) / 0.68 : (ny - 0.68) / 0.32;
    const d = Math.hypot(dx, dy) + rand(-0.06, 0.06);
    if (d < 0.3) return pick(['#fffdf2', '#fff8de']);
    if (d < 0.5) return pick(['#fff1a8', '#ffe98a']);
    if (d < 0.66) return pick(['#ffd96e', '#ffd055']);
    if (d < 0.82) return pick(['#ffb347', '#ffaa3c']);
    return pick(['#ff8a3a', '#ff7a30', '#ff6a2a']);
  }

  const corPetala = (paleta, fator = 1) => (nx, ny) =>
    tom(pick(paleta.petalas), fator * (0.72 + 0.32 * (1 - ny)) * rand(0.92, 1.06));

  // a luz da vela enfraquece longe dela (0 = perto, 1 = canto mais distante)
  const sombraDistancia = (x, y) => 0.38 * clamp((dist(G.cx, G.cy, x, y) / G.luzMax - 0.35) / 0.65);

  /* ========================= VELA, CHAMA, ISQUEIRO ========================= */

  function gerarVela() {
    const S = DPR;
    const v = G.vela;

    const nv = nuvem({
      w: v.w, h: v.h, forma: formaVela, palavras: PALAVRAS_VELA,
      max: v.w * 0.19, min: Math.max(4, v.w * 0.042), rotacao: 0.42, cursiva: 0.5, cota: 2, cor: corVela,
    });
    velaApagada = rasterizar(nv, S);
    velaNuvem = nv;
    // se a vela já tinha derretido (ex.: a tela mudou de tamanho), tira o que já derreteu
    const linha = linhaDerretimento();
    for (const p of nv.itens) if (p.y + p.bh * 0.4 < linha && derrete.progresso > 0) p.derretida = true;
    velaAcesa = rasterizarVelaAcesa();

    const p = G.prato;
    prato = rasterizar(nuvem({
      w: p.w, h: p.h, forma: formaElipse, palavras: PALAVRAS_VELA,
      max: p.h * 0.42, min: Math.max(3.6, p.h * 0.1), rotacao: 0.08, cursiva: 0.5, cota: 2,
      cor: (nx, ny) => tom(pick(['#d9ae5a', '#c99a45', '#e8c26e', '#b8893a']), 1.1 - ny * 0.45),
    }), S);

    const c = G.chama;
    chamaImg = rasterizar(nuvem({
      w: c.w, h: c.h, forma: formaChama, palavras: PALAVRAS_VELA,
      max: c.w * 0.21, min: Math.max(2.6, c.w * 0.045), rotacao: 0.6, cursiva: 0.5, cota: 1, espaco: 0.3,
      cor: corChama,
    }), S, { cor: 'rgba(255,150,50,0.95)', blur: 5 });
  }

  /* ===================== A VELA DERRETE E ESCREVE A CARTA ===================== */

  let velaNuvem = null;          // palavras da vela (para irem derretendo uma a uma)
  let velaSuja = false, ultimoRefazer = 0;
  const gotas = [];              // palavras de cera escorrendo
  const faiscas = [];            // faíscas que voam até a carta
  let palavrasCarta = [];
  const derrete = {
    ativo: false, progresso: 0, forca: 1, ateQuando: 0, falaAte: 0,
    segurando: false, revelados: 0, cartaVisivel: false, completa: false,
  };

  const elCarta = document.getElementById('carta');
  const elRolagem = document.getElementById('carta-rolagem');
  const elCartaTexto = document.getElementById('carta-texto');
  const elVoltar = document.getElementById('voltar-frase');
  const elLerCarta = document.getElementById('ler-carta');

  // até onde a vela já derreteu (em px, a partir do topo da vela)
  const linhaDerretimento = () => G.vela.h * (0.045 + 0.55 * derrete.progresso);
  const queda = () => G.vela.h * 0.55 * derrete.progresso;
  // a chama cresce com a força (1 = normal, ~2.2 = quando ela diz "te amo")
  const tamanhoChama = () => 1 + (derrete.forca - 1) * 0.7;

  function rasterizarVelaAcesa() {
    const S = DPR, v = G.vela;
    const c = rasterizar({ itens: velaNuvem.itens.filter((p) => !p.derretida), w: velaNuvem.w, h: velaNuvem.h }, S);
    const x = c.getContext('2d');
    x.setTransform(S, 0, 0, S, 0, 0);
    x.globalCompositeOperation = 'source-atop';
    const topo = linhaDerretimento();
    const g = x.createRadialGradient(v.w * 0.5, topo, 0, v.w * 0.5, topo, v.h * 0.9);
    g.addColorStop(0, 'rgba(255,190,110,0.6)');
    g.addColorStop(0.45, 'rgba(255,150,80,0.2)');
    g.addColorStop(1, 'rgba(255,140,60,0)');
    x.fillStyle = g;
    x.fillRect(0, 0, v.w, v.h);
    return c;
  }

  // monta a carta na página com todas as palavras invisíveis (o lugar de cada uma já fica reservado)
  function prepararCarta() {
    elCartaTexto.textContent = '';
    palavrasCarta = [];
    const bloco = (classe, texto) => {
      const el = document.createElement('p');
      el.className = classe;
      const ps = texto.trim().split(/\s+/);
      ps.forEach((w, i) => {
        const s = document.createElement('span');
        s.className = 'pc';
        s.textContent = w;
        el.appendChild(s);
        palavrasCarta.push(s);
        if (i < ps.length - 1) el.appendChild(document.createTextNode(' '));
      });
      elCartaTexto.appendChild(el);
    };
    if (CARTA.saudacao) bloco('carta__saudacao', CARTA.saudacao);
    for (const par of CARTA.texto.split(/\n\s*\n/)) if (par.trim()) bloco('carta__paragrafo', par);
    if (CARTA.assinatura) bloco('carta__assinatura', CARTA.assinatura);
  }

  function posicionarCarta() {
    const m = G.msg;
    const fundo = G.paisagem ? H - 92 : G.chama.y + queda() - 14;
    const altura = Math.max(m.h, fundo - m.y);
    elCarta.style.left = m.x + 'px';
    elCarta.style.top = m.y + 'px';
    elCarta.style.width = m.w + 'px';
    elRolagem.style.maxHeight = altura + 'px';
  }

  function mostrarCarta(sim) {
    elCarta.classList.toggle('visivel', sim);
    elCarta.setAttribute('aria-hidden', sim ? 'false' : 'true');
    elMensagem.classList.toggle('escondida', sim);
  }

  function atualizarDerretimento(t, dt) {
    if (!est.mensagem || !velaNuvem) return;
    if (!derrete.ativo && t - est.tMensagem > ESPERA_DERRETER) {
      derrete.ativo = true;
      mostrarBotaoOuvir();
    }

    // força da chama: cresce quando ela fala "te amo", quando fala alto ou quando segura a vela
    let alvo = 1;
    if (t < derrete.ateQuando) alvo = 2.2;
    else if (t < derrete.falaAte) alvo = 1.35;
    if (derrete.segurando) alvo = Math.max(alvo, 2);
    if (voz.forcaVolume > alvo) alvo = voz.forcaVolume;
    if (derrete.completa) alvo = 1;
    derrete.forca += (alvo - derrete.forca) * (1 - Math.exp(-dt * (alvo > derrete.forca ? 5 : 0.9)));

    if (!derrete.ativo || derrete.completa) return;
    derrete.progresso = Math.min(1, derrete.progresso + (dt / DURACAO_CARTA) * (1 + (derrete.forca - 1) * 5));

    // as palavras da vela acima da linha de derretimento escorrem como cera
    const linha = linhaDerretimento();
    for (const p of velaNuvem.itens) {
      if (p.derretida || p.y + p.bh * 0.4 > linha) continue;
      p.derretida = true;
      velaSuja = true;
      if (gotas.length < 90) {
        gotas.push({ p, x: G.vela.x + p.x, y: G.vela.y + p.y, vy: rand(6, 22), vida: 0, max: rand(1.8, 2.8) });
      }
    }
    if (velaSuja && t - ultimoRefazer > 0.12) {
      velaAcesa = rasterizarVelaAcesa();
      velaSuja = false;
      ultimoRefazer = t;
    }

    // cada pedacinho derretido vira uma faísca que escreve uma palavra da carta
    const alvoN = derrete.progresso >= 1 ? palavrasCarta.length : Math.floor(derrete.progresso * palavrasCarta.length);
    while (derrete.revelados < alvoN) lancarFaisca(palavrasCarta[derrete.revelados++], t);

    if (derrete.revelados >= palavrasCarta.length && !faiscas.length) terminarCarta();
  }

  function lancarFaisca(span, t) {
    if (!derrete.cartaVisivel) {
      derrete.cartaVisivel = true;
      posicionarCarta();
      mostrarCarta(true);
    }
    // rola a carta para a palavra que vai acender, se ela estiver fora da vista
    const fim = span.offsetTop + span.offsetHeight;
    if (fim > elRolagem.scrollTop + elRolagem.clientHeight - 6) {
      elRolagem.scrollTo({ top: Math.max(0, fim - elRolagem.clientHeight * 0.7), behavior: 'smooth' });
    }
    const v = G.vela;
    faiscas.push({
      span, t0: t, dur: rand(1, 1.5), alto: rand(60, 170),
      x0: v.x + v.w * rand(0.25, 0.75), y0: v.y + linhaDerretimento(),
    });
  }

  function terminarCarta() {
    derrete.completa = true;
    pararDeOuvir();
    elVoltar.hidden = false;
    elLerCarta.hidden = false;
    textoBotaoOuvir('❤', '');
    setTimeout(() => elOuvir.classList.remove('visivel'), 2500);
  }

  function desenharGotas(dt) {
    if (!gotas.length) return;
    const fundo = G.vela.y + G.vela.h;
    ctx.save();
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';
    for (let i = gotas.length - 1; i >= 0; i--) {
      const g = gotas[i];
      g.vida += dt;
      g.vy += 26 * dt;                       // cera escorre devagar, como mel
      g.y = Math.min(fundo - g.p.bh, g.y + g.vy * dt);
      if (g.vida > g.max) { gotas.splice(i, 1); continue; }
      ctx.globalAlpha = alfaCena * (1 - g.vida / g.max) * 0.95;
      ctx.translate(g.x - g.p.x, g.y - g.p.y);
      desenharPalavra(ctx, g.p);
      ctx.setTransform(escala, 0, 0, escala, 0, 0);
    }
    ctx.restore();
  }

  function desenharFaiscas(t) {
    if (!faiscas.length) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = faiscas.length - 1; i >= 0; i--) {
      const f = faiscas[i];
      const r = f.span.getBoundingClientRect();
      const tx = r.left + r.width / 2, ty = r.top + r.height / 2;
      const p = clamp((t - f.t0) / f.dur);
      if (p >= 1) {
        f.span.classList.add('acesa');
        faiscas.splice(i, 1);
        continue;
      }
      const cx = (f.x0 + tx) / 2, cy = Math.min(f.y0, ty) - f.alto;
      // a faísca e um rastrinho atrás dela
      for (let k = 0; k < 4; k++) {
        const e = easeInOutSine(Math.max(0, p - k * 0.035));
        const a = 1 - e;
        const x = a * a * f.x0 + 2 * a * e * cx + e * e * tx;
        const y = a * a * f.y0 + 2 * a * e * cy + e * e * ty;
        const tam = (16 - k * 3.2) * (0.8 + 0.2 * Math.sin(t * 20 + i));
        ctx.globalAlpha = alfaCena * (1 - k * 0.22) * Math.min(1, p * 5);
        ctx.drawImage(brilhoImg, x - tam / 2, y - tam / 2, tam, tam);
      }
    }
    ctx.restore();
  }

  /* ========================= MICROFONE: A VELA OUVE ========================= */

  const elOuvir = document.getElementById('ouvir');
  const elOuvirTexto = document.getElementById('ouvir-texto');
  const elOuvirDica = document.getElementById('ouvir-dica');
  const voz = { modo: null, rec: null, ac: null, stream: null, analisador: null, buf: null, forcaVolume: 0, ultimoTeAmo: -9, timer: 0 };
  const normalizar = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

  function textoBotaoOuvir(principal, dica) {
    elOuvirTexto.textContent = principal;
    elOuvirDica.textContent = dica;
    elOuvirDica.hidden = !dica;
  }

  function mostrarBotaoOuvir() {
    elOuvir.hidden = false;
    requestAnimationFrame(() => elOuvir.classList.add('visivel'));
  }

  function iniciarEscuta() {
    if (voz.modo || derrete.completa) return;
    elOuvir.classList.add('ouvindo');
    // o "motor" de áudio precisa nascer dentro do toque/clique
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) { voz.ac = new AC(); voz.ac.resume().catch(() => {}); }
    } catch (_) { /* sem áudio */ }
    textoBotaoOuvir('ouvindo… diga “eu também te amo” 💗', 'ou segure a vela');
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      ouvirFala(SR);
      // se o reconhecimento de voz não arrancar em 3 s, passa a ouvir só o volume
      setTimeout(() => {
        if (voz.modo === 'fala' && !voz.comecou) {
          voz.modo = 'trocando';
          try { voz.rec.abort(); } catch (_) { /* ok */ }
          ouvirVolume();
        }
      }, 3000);
    } else {
      ouvirVolume();
    }
  }

  // 1ª opção: reconhecimento de voz (entende a frase "eu também te amo")
  function ouvirFala(SR) {
    voz.modo = 'fala';
    const rec = new SR();
    voz.rec = rec;
    rec.lang = 'pt-BR';
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 3;
    rec.onstart = () => { voz.comecou = true; };
    rec.onresult = (e) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        derrete.falaAte = agora + 0.8; // qualquer fala já faz a chama dançar
        for (let a = 0; a < e.results[i].length; a++) {
          const txt = normalizar(e.results[i][a].transcript);
          if (/\b(te amo|ti amo|amo te|amo voce)\b/.test(txt)) { ouviuTeAmo(); return; }
        }
      }
    };
    rec.onerror = (e) => {
      if (['not-allowed', 'service-not-allowed', 'audio-capture', 'network', 'language-not-supported'].includes(e.error)) {
        voz.modo = 'trocando';
        try { rec.abort(); } catch (_) { /* ok */ }
        ouvirVolume();
      }
    };
    rec.onend = () => {
      // o navegador para de ouvir sozinho depois de um silêncio: volta a ouvir
      if (voz.modo === 'fala' && voz.comecou && !derrete.completa) {
        setTimeout(() => { if (voz.modo === 'fala') { try { rec.start(); } catch (_) { /* ok */ } } }, 250);
      }
    };
    try { rec.start(); } catch (_) { voz.modo = 'trocando'; ouvirVolume(); }
  }

  // 2ª opção: só o volume do microfone (falar alto com a vela faz a chama crescer)
  async function ouvirVolume() {
    voz.modo = 'volume';
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ac = voz.ac || new (window.AudioContext || window.webkitAudioContext)();
      ac.resume().catch(() => {});
      const an = ac.createAnalyser();
      an.fftSize = 1024;
      ac.createMediaStreamSource(stream).connect(an);
      Object.assign(voz, { stream, ac, analisador: an, buf: new Float32Array(an.fftSize) });
      textoBotaoOuvir('fale com a vela: “eu também te amo” 💗', 'ou segure a vela');
    } catch (_) {
      // 3ª opção: sem microfone, segurar a vela também funciona
      voz.modo = 'sem';
      textoBotaoOuvir('segure a vela para a chama crescer 🔥', '');
    }
  }

  function ouviuTeAmo() {
    if (agora - voz.ultimoTeAmo < 2) return;
    voz.ultimoTeAmo = agora;
    derrete.ateQuando = agora + 5;
    for (let i = 0; i < 22; i++) criarFagulha(true);
    vibrar([30, 60, 30]);
    textoBotaoOuvir('a vela ouviu ❤', 'diga de novo para ela derreter mais');
    clearTimeout(voz.timer);
    voz.timer = setTimeout(() => {
      if (!derrete.completa) textoBotaoOuvir('ouvindo… diga “eu também te amo” 💗', 'ou segure a vela');
    }, 2600);
  }

  function lerVolume() {
    if (!voz.analisador) { voz.forcaVolume = 0; return; }
    voz.analisador.getFloatTimeDomainData(voz.buf);
    let s = 0;
    for (let i = 0; i < voz.buf.length; i++) s += voz.buf[i] * voz.buf[i];
    const rms = Math.sqrt(s / voz.buf.length);
    voz.forcaVolume = 1 + clamp((rms - 0.012) * 28, 0, 1.2);
  }

  function pararDeOuvir() {
    voz.modo = 'fim';
    try { if (voz.rec) voz.rec.abort(); } catch (_) { /* ok */ }
    if (voz.stream) voz.stream.getTracks().forEach((tr) => tr.stop());
    if (voz.ac) voz.ac.close().catch(() => {});
    voz.analisador = null;
    voz.forcaVolume = 0;
    elOuvir.classList.remove('ouvindo');
  }

  function gerarIsqueiro() {
    const S = DPR, LW = G.LW, LH = G.LH;

    const corpo = rasterizar(nuvem({
      w: LW, h: LH * 0.7,
      forma: (c, w, h) => { retArred(c, 0, 0, w, h, w * 0.22); c.fill(); },
      palavras: PALAVRAS_VELA, max: LW * 0.27, min: Math.max(2.8, LW * 0.07), rotacao: 0.5, cursiva: 0.4, cota: 1,
      cor: (nx) => {
        const d = (nx - 0.4) / 0.6;
        return tom(pick(['#ff4f8b', '#ff6b9d', '#e83a78', '#ff86b0']), clamp(1.08 - 0.45 * d * d, 0.5, 1.1));
      },
    }), S);

    const capa = rasterizar(nuvem({
      w: LW * 0.88, h: LH * 0.27,
      forma: (c, w, h) => { retArred(c, 0, 0, w, h, w * 0.06); c.fill(); },
      palavras: PALAVRAS_VELA, max: LH * 0.27 * 0.36, min: 2.6, rotacao: 0.2, cursiva: 0, cota: 1,
      cor: (nx) => tom(pick(['#e8e8ee', '#c9cbd3', '#f5f5fa', '#aeb0ba']), 0.78 + 0.3 * Math.sin(nx * Math.PI)),
    }), S);

    const rr = LW * 0.16;
    const roda = rasterizar(nuvem({
      w: rr * 2, h: rr * 2, forma: formaElipse, palavras: PALAVRAS_VELA,
      max: rr * 0.6, min: 2.2, rotacao: 0.5, cursiva: 0, cota: 1,
      cor: () => tom(pick(['#5b5b66', '#7a7a85', '#46464f', '#8d8d99'])),
    }), S);

    isqueiro = novoCanvas(LW * S, LH * S);
    const x = isqueiro.getContext('2d');
    x.scale(S, S);
    x.drawImage(corpo, 0, LH * 0.3, corpo.lw, corpo.lh);
    x.drawImage(capa, LW * 0.06, LH * 0.06, capa.lw, capa.lh);
    x.drawImage(roda, LW * 0.3 - rr, LH * 0.075 - rr, roda.lw, roda.lh);
    isqueiro.lw = LW; isqueiro.lh = LH;

    chamaIsqImg = rasterizar(nuvem({
      w: G.lfw, h: G.lfh, forma: formaChama, palavras: PALAVRAS_VELA,
      max: G.lfw * 0.3, min: 2.2, rotacao: 0.65, cursiva: 0.3, cota: 1, espaco: 0.3, cor: corChama,
    }), S, { cor: 'rgba(255,150,50,0.95)', blur: 4 });
  }

  function criarBrilho() {
    const c = novoCanvas(128, 128);
    const x = c.getContext('2d');
    const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,240,200,1)');
    g.addColorStop(0.22, 'rgba(255,200,120,0.55)');
    g.addColorStop(1, 'rgba(255,150,60,0)');
    x.fillStyle = g;
    x.fillRect(0, 0, 128, 128);
    return c;
  }

  /* ================================ FLORES ================================ */

  function miolo(x, r, cores, S, fator = 1) {
    const v = rasterizar(nuvem({
      w: r * 2, h: r * 2, forma: formaElipse, palavras: PALAVRAS_CURTAS,
      max: r * 0.5, min: 2.6, rotacao: 0.4, cursiva: 0, cota: 1,
      cor: (nx, ny) => tom(pick(cores), fator * (1.08 - Math.hypot(nx - 0.5, ny - 0.5) * 0.7)),
    }), S);
    x.save();
    x.shadowColor = 'rgba(0,0,0,0.6)';
    x.shadowBlur = 8;
    x.drawImage(v, -r, -r, v.lw, v.lh);
    x.restore();
  }

  // Cria a "cabeça" de uma flor (pétalas + miolo) numa tela de 2RL x 2RL
  function criarCabeca(tipo, paleta, S) {
    const lado = RL * 2;
    const c = novoCanvas(lado * S, lado * S);
    const x = c.getContext('2d');
    x.scale(S, S);
    x.translate(RL, RL);
    c.lw = c.lh = lado;
    c.ax = RL; c.ay = RL; // ponto onde o caule encosta
    c.tipo = tipo;

    // as pétalas são desenhadas numa "camada" e a sombra é aplicada uma vez só
    const camada = (desenhar) => {
      const cam = novoCanvas(c.width, c.height);
      const cx = cam.getContext('2d');
      cx.scale(S, S);
      cx.translate(RL, RL);
      desenhar(cx);
      x.save();
      x.setTransform(1, 0, 0, 1, 0, 0);
      x.shadowColor = 'rgba(0,0,0,0.55)';
      x.shadowBlur = 6 * S;
      x.drawImage(cam, 0, 0);
      x.restore();
    };
    const petalas = (cx, v, n, desloc, ini, filtro = () => true, jitter = 0) => {
      for (let i = 0; i < n; i++) {
        if (!filtro(i)) continue;
        const img = Array.isArray(v) ? v[i % v.length] : v;
        cx.save();
        cx.rotate(desloc + (i / n) * Math.PI * 2 + rand(-jitter, jitter));
        cx.drawImage(img, -img.lw / 2, -(ini + img.lh), img.lw, img.lh);
        cx.restore();
      }
    };

    if (tipo === 'margarida') {
      const n = randInt(11, 14), pw = RL * 0.34, pl = RL * 0.86;
      const variantes = [0, 1].map(() => rasterizar(nuvem({
        w: pw, h: pl, forma: formaPetalaFina, palavras: PALAVRAS_CURTAS,
        max: pw * 0.46, min: 2.8, rotacao: 0.9, cursiva: 0.2, cota: 1, espaco: 0.5, cor: corPetala(paleta),
      }), S));
      const desloc = rand(0, Math.PI);
      camada((cx) => petalas(cx, variantes, n, desloc, RL * 0.1, undefined, 0.05));
      miolo(x, RL * 0.27, paleta.miolo, S);
    } else if (tipo === 'camelia') {
      const camadas = [
        { n: 6, pw: RL * 0.66, pl: RL * 0.7, ini: RL * 0.26, f: 1.05 },
        { n: 5, pw: RL * 0.52, pl: RL * 0.56, ini: RL * 0.12, f: 0.9 },
        { n: 4, pw: RL * 0.4, pl: RL * 0.42, ini: RL * 0.02, f: 0.76 },
      ];
      let desloc = rand(0, Math.PI);
      for (const cm of camadas) {
        const v = rasterizar(nuvem({
          w: cm.pw, h: cm.pl, forma: formaPetalaRedonda, palavras: PALAVRAS_FLORES, curtas: PALAVRAS_CURTAS,
          max: cm.pw * 0.26, min: 3, rotacao: 0.35, cursiva: 0.4, cota: 2, cor: corPetala(paleta, cm.f),
        }), S);
        const d = desloc;
        camada((cx) => petalas(cx, v, cm.n, d, cm.ini));
        desloc += Math.PI / cm.n;
      }
      miolo(x, RL * 0.11, paleta.petalas, S, 0.62);
    } else if (tipo === 'coracoes') {
      const n = 5, pw = RL * 0.78, ph = RL * 0.84;
      const v = rasterizar(nuvem({
        w: pw, h: ph, forma: formaCoracao, palavras: PALAVRAS_FLORES, curtas: PALAVRAS_CURTAS,
        max: pw * 0.22, min: 3, rotacao: 0.3, cursiva: 0.4, cota: 2, cor: corPetala(paleta),
      }), S);
      const desloc = rand(0, Math.PI);
      // duas camadas (pares e ímpares) para as pétalas que se sobrepõem continuarem separadas
      camada((cx) => petalas(cx, v, n, desloc, RL * 0.08, (i) => i % 2 === 0));
      camada((cx) => petalas(cx, v, n, desloc, RL * 0.08, (i) => i % 2 === 1));
      miolo(x, RL * 0.2, paleta.miolo, S);
    } else { // tulipa (vista de lado)
      const tw = RL * 1.25, th = RL * 1.4;
      const v = rasterizar(nuvem({
        w: tw, h: th, forma: formaTulipa, palavras: PALAVRAS_FLORES, curtas: PALAVRAS_CURTAS,
        max: tw * 0.16, min: 3.2, rotacao: 0.55, cursiva: 0.45, cota: 2,
        cor: (nx, ny) => {
          const borda = Math.pow((nx - 0.5) * 2, 2);
          return tom(pick(paleta.petalas), (0.62 + 0.42 * (1 - ny)) * (1 - 0.28 * borda) * rand(0.94, 1.05));
        },
      }), S);
      x.drawImage(v, -v.lw / 2, RL * 0.88 - v.lh, v.lw, v.lh);
      c.ay = RL + RL * 0.85;
    }
    return c;
  }

  // Biblioteca de cabeças e folhas: feita uma vez só, uma peça por vez
  function prepararBiblioteca() {
    if (!promessaBiblioteca) {
      promessaBiblioteca = (async () => {
        const S = Math.min(DPR, 2);
        const listaFolhas = [];
        for (let i = 0; i < 6; i++) {
          const verdes = VERDES[i % VERDES.length];
          listaFolhas.push(rasterizar(nuvem({
            w: RL * 0.34, h: RL * 0.85, forma: formaFolha, palavras: PALAVRAS_VERDES,
            max: RL * 0.34 * 0.42, min: 2.8, rotacao: 0.85, cursiva: 0.3, cota: 1,
            cor: (nx) => tom(pick(verdes), (0.78 + 0.3 * (1 - Math.abs(nx - 0.5) * 2)) * rand(0.9, 1.05)),
          }), S));
        }
        folhas = listaFolhas;
        await pausa();
        const lista = [];
        for (const tipo of ['margarida', 'camelia', 'coracoes', 'tulipa']) {
          for (const p of embaralhar(PALETAS.slice()).slice(0, 5)) {
            lista.push(criarCabeca(tipo, p, S));
            await pausa();
          }
        }
        biblioteca = lista;
      })();
    }
    return promessaBiblioteca;
  }

  // A cabeça de cada flor já sai no tamanho final: assim, a cada quadro,
  // o navegador só carimba a imagem (sem redimensionar 100 flores grandes).
  function assarCabeca(f, S) {
    const cab = f.cab, k = f.k;
    const c = novoCanvas(cab.lw * k * S, cab.lh * k * S);
    const x = c.getContext('2d');
    x.imageSmoothingQuality = 'high';
    x.drawImage(cab, 0, 0, c.width, c.height);
    c.lw = cab.lw * k; c.lh = cab.lh * k;
    c.ax = cab.ax * k; c.ay = cab.ay * k;
    return c;
  }

  // Caule (palavras seguindo uma curva) + folhas. Origem = pé do caule.
  function criarCaule(f, S) {
    const cx = f.dx * 0.5 + rand(-0.12, 0.12) * f.L, cy = -f.L * 0.5;
    const fs = clamp(f.r * 0.13, 3.2, 10);
    const verdes = pick(VERDES);

    const pts = [];
    let total = 0, px = 0, py = 0;
    for (let i = 0; i <= 40; i++) {
      const t = i / 40, a = 1 - t;
      const x = 2 * a * t * cx + t * t * f.dx;
      const y = 2 * a * t * cy + t * t * -f.L;
      if (i > 0) total += Math.hypot(x - px, y - py);
      pts.push({ x, y, s: total });
      px = x; py = y;
    }
    const noComprimento = (alvo) => {
      let i = 1;
      while (i < pts.length - 1 && pts[i].s < alvo) i++;
      const a = pts[i - 1], b = pts[i];
      const t = clamp((alvo - a.s) / Math.max(1e-6, b.s - a.s));
      return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), ang: Math.atan2(b.y - a.y, b.x - a.x) };
    };

    const folhaLen = f.r * rand(0.75, 1.05);
    const pad = folhaLen + fs * 2;
    const minX = Math.min(0, cx, f.dx) - pad, maxX = Math.max(0, cx, f.dx) + pad;
    const minY = -f.L - pad, maxY = fs * 2;
    const lw = maxX - minX, lh = maxY - minY;

    const c = novoCanvas(lw * S, lh * S);
    const x = c.getContext('2d');
    x.imageSmoothingQuality = 'high';
    x.scale(S, S);
    x.translate(-minX, -minY);
    c.ox = -minX; c.oy = -minY; c.escala = S;

    // folhas (atrás do caule)
    const nf = f.r > 22 ? randInt(1, 2) : 1;
    let lado = Math.random() < 0.5 ? -1 : 1;
    for (let i = 0; i < nf; i++) {
      const q = noComprimento(total * rand(0.32, 0.65));
      const folha = pick(folhas);
      const k = folhaLen / folha.lh;
      x.save();
      x.translate(q.x, q.y);
      x.rotate(q.ang + Math.PI / 2 + lado * rand(0.55, 0.95));
      x.drawImage(folha, -(folha.lw * k) / 2, -folha.lh * k, folha.lw * k, folha.lh * k);
      x.restore();
      lado *= -1;
    }

    // caule
    x.textBaseline = 'middle';
    x.textAlign = 'left';
    let s = 0;
    while (s < total) {
      const texto = pick(PALAVRAS_VERDES);
      const fonte = `700 ${fs.toFixed(2)}px ${SANS}`;
      const m = medir(texto, fonte);
      const larg = m.esq + m.dir;
      const q = noComprimento(Math.min(total, s + larg / 2));
      x.save();
      x.translate(q.x, q.y);
      x.rotate(q.ang);
      x.font = fonte;
      x.fillStyle = tom(pick(verdes), rand(0.8, 1.02));
      x.fillText(texto, -larg / 2 + m.esq, 0);
      x.restore();
      s += larg + fs * 0.25;
    }

    // a base do caule some suavemente no escuro
    x.globalCompositeOperation = 'destination-out';
    const g = x.createLinearGradient(0, -f.L * 0.32, 0, 0);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(0,0,0,1)');
    x.fillStyle = g;
    x.fillRect(minX, minY, lw, lh);
    return c;
  }

  // Escolhe onde cada flor nasce (rápido: só contas, nada é desenhado aqui)
  function posicionarFlores() {
    const lista = [];
    const rBase = clamp(Math.min(W, H) * 0.085, 28, 80);
    const yTopo = Math.max(H * 0.05, G.horizonte); // acima disso é céu
    const alvo = Math.round(clamp((W * (H - yTopo)) / 11000, 30, 90));
    const M = expandir(G.msg, 28, 22);
    const V = expandir(G.areaVela, 24, 20);

    for (let tent = 0; tent < 6000 && lista.length < alvo; tent++) {
      const hx = rand(-rBase * 0.3, W + rBase * 0.3);
      const hy = rand(yTopo, H * 0.97);
      const prof = clamp((hy - yTopo) / (H - yTopo)); // perspectiva: embaixo = mais perto = maior
      const r = rBase * lerp(0.55, 1.2, prof) * rand(0.85, 1.12);
      const cab = pick(biblioteca);
      const tulipa = cab.tipo === 'tulipa';
      const caixaCab = tulipa
        ? { x: hx - 0.66 * r, y: hy - 1.4 * r, w: 1.32 * r, h: 1.4 * r }
        : { x: hx - r, y: hy - r, w: 2 * r, h: 2 * r };
      if (cruza(caixaCab, M) || cruza(caixaCab, V)) continue;

      const L = r * rand(1.9, 3.1);
      const dx = rand(-0.18, 0.18) * L;
      const caixaCaule = { x: Math.min(hx, hx - dx) - r, y: hy, w: Math.abs(dx) + 2 * r, h: L * 0.72 };
      if (cruza(caixaCaule, M) || cruza(caixaCaule, V)) continue;

      let apertado = false;
      for (const o of lista) {
        if (dist(hx, hy, o.hx, o.hy) < (r + o.r) * 0.78) { apertado = true; break; }
      }
      if (apertado) continue;

      lista.push({
        hx, hy, r, L, dx, bx: hx - dx, by: hy + L, cab, tulipa, prof,
        k: r / RL,
        rot: tulipa ? rand(-0.12, 0.12) : rand(0, Math.PI * 2),
        achat: tulipa ? 1 : rand(0.8, 1),
        fase: rand(0, Math.PI * 2),
        vel: rand(0.6, 1.1),
        amp: rand(0.02, 0.045) * MOV,
        brilho: lerp(0.86, 1, prof) * (1 - sombraDistancia(hx, hy)),
        dur: rand(1.4, 2.1),
        dist: dist(G.cx, G.cy, hx, hy),
        inicio: null,
      });
    }
    lista.sort((a, b) => a.by - b.by); // de trás para frente
    return lista;
  }

  function criarGrama() {
    const S = Math.min(escala, 1.5);
    const hg = clamp(H * 0.09, 40, 100);
    const c = novoCanvas(W * S, hg * S);
    const x = c.getContext('2d');
    x.scale(S, S);
    x.textBaseline = 'middle';
    const base = clamp(H * 0.012, 6, 11);
    const camadas = [
      { cores: ['#174d2a', '#1d5a31', '#22633a', '#2a6b3d'], passo: [2.5, 5], alt: 1, f: 0.85 },
      { cores: ['#2f8a48', '#3a9a52', '#4cae62', '#62c174', '#7ccf86'], passo: [3.5, 7], alt: 0.55, f: 1 },
    ];
    for (const cam of camadas) {
      let px = rand(-8, 0);
      while (px < W + 8) {
        const tam = Math.round(base * rand(0.8, 1.3) * cam.f * 2) / 2; // poucos tamanhos = desenho mais rápido
        const texto = pick(PALAVRAS_VERDES);
        const fonte = `700 ${tam}px ${SANS}`;
        const larg = larguraTexto(texto, fonte);
        const yb = hg - rand(0, hg * 0.35) * cam.alt + rand(0, larg * 0.5);
        x.save();
        x.translate(px, yb);
        x.rotate(-Math.PI / 2 + rand(-0.28, 0.28));
        x.font = fonte;
        x.fillStyle = tom(pick(cam.cores), rand(0.85, 1.1));
        x.fillText(texto, 0, 0);
        x.restore();
        px += rand(cam.passo[0], cam.passo[1]);
      }
    }
    // longe da vela a grama fica mais escura
    x.globalCompositeOperation = 'source-atop';
    const oy = H - hg;
    const g = x.createRadialGradient(G.cx, G.cy - oy, G.luzMax * 0.35, G.cx, G.cy - oy, G.luzMax);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(0,0,0,0.38)');
    x.fillStyle = g;
    x.fillRect(0, 0, W, hg);
    c.lw = W; c.lh = hg;
    return c;
  }

  function criarVagalumes() {
    const n = Math.round(clamp((W * H) / 60000, 10, 28));
    vagalumes = Array.from({ length: n }, () => ({
      x: rand(0, W), y: rand(0, H * 0.95),
      ax: rand(20, 70), ay: rand(15, 50),
      f1: rand(0.1, 0.35), f2: rand(0.1, 0.3), f3: rand(0.8, 2.2),
      p: rand(0, Math.PI * 2), tam: rand(10, 22),
    }));
  }

  /* ===================== CÉU E CONSTELAÇÃO DAS INICIAIS ===================== */
  // Cada letra é desenhada como uma constelação: pontos (estrelas) numa grade
  // de 4 de largura por 6 de altura, ligados por traços na ordem da lista.
  const LETRAS = {
    A: [[[0, 6], [2, 0], [4, 6]], [[0.83, 3.5], [3.17, 3.5]]],
    B: [[[0, 6], [0, 0], [2.6, 0], [3.5, 0.8], [3.5, 2.2], [2.6, 3], [0, 3]], [[2.6, 3], [3.8, 3.8], [3.8, 5.2], [2.8, 6], [0, 6]]],
    C: [[[4, 1], [3, 0], [1, 0], [0, 1.5], [0, 4.5], [1, 6], [3, 6], [4, 5]]],
    D: [[[0, 0], [0, 6], [2.5, 6], [4, 4.5], [4, 1.5], [2.5, 0], [0, 0]]],
    E: [[[4, 0], [0, 0], [0, 6], [4, 6]], [[0, 3], [3, 3]]],
    F: [[[4, 0], [0, 0], [0, 6]], [[0, 3], [3, 3]]],
    G: [[[4, 1], [3, 0], [1, 0], [0, 1.5], [0, 4.5], [1, 6], [3, 6], [4, 5], [4, 3.3], [2.3, 3.3]]],
    H: [[[0, 0], [0, 6]], [[4, 0], [4, 6]], [[0, 3], [4, 3]]],
    I: [[[1, 0], [3, 0]], [[2, 0], [2, 6]], [[1, 6], [3, 6]]],
    J: [[[4, 0], [4, 4.8], [3, 6], [1, 6], [0, 4.8]]],
    K: [[[0, 0], [0, 6]], [[4, 0], [0, 3.5]], [[1.3, 2.36], [4, 6]]],
    L: [[[0, 0], [0, 6], [4, 6]]],
    M: [[[0, 6], [0, 0], [2, 3.5], [4, 0], [4, 6]]],
    N: [[[0, 6], [0, 0], [4, 6], [4, 0]]],
    O: [[[1, 0], [3, 0], [4, 1.5], [4, 4.5], [3, 6], [1, 6], [0, 4.5], [0, 1.5], [1, 0]]],
    P: [[[0, 6], [0, 0], [3, 0], [4, 1], [4, 2.2], [3, 3.2], [0, 3.2]]],
    Q: [[[1, 0], [3, 0], [4, 1.5], [4, 4.5], [3, 6], [1, 6], [0, 4.5], [0, 1.5], [1, 0]], [[2.6, 4.6], [4.2, 6.3]]],
    R: [[[0, 6], [0, 0], [3, 0], [4, 1], [4, 2.2], [3, 3.2], [0, 3.2]], [[2, 3.2], [4, 6]]],
    S: [[[4, 1], [3, 0], [1, 0], [0, 1], [0, 2.2], [1, 3], [3, 3], [4, 3.8], [4, 5], [3, 6], [1, 6], [0, 5]]],
    T: [[[0, 0], [4, 0]], [[2, 0], [2, 6]]],
    U: [[[0, 0], [0, 4.6], [1.2, 6], [2.8, 6], [4, 4.6], [4, 0]]],
    V: [[[0, 0], [2, 6], [4, 0]]],
    W: [[[0, 0], [1, 6], [2, 2.5], [3, 6], [4, 0]]],
    X: [[[0, 0], [4, 6]], [[4, 0], [0, 6]]],
    Y: [[[0, 0], [2, 3], [4, 0]], [[2, 3], [2, 6]]],
    Z: [[[0, 0], [4, 0], [0, 6], [4, 6]]],
  };
  const CORACAO = [[[2, 5.6], [0.5, 3.9], [0, 2.6], [0.2, 1.3], [1, 0.6], [2, 1.4], [3, 0.6], [3.8, 1.3], [4, 2.6], [3.5, 3.9], [2, 5.6]]];

  let estrelaImg, estrelaRosaImg;
  let constelacao = null;  // { estrelas, tracos }
  let estrelasCeu = [];
  const cadente = { proxima: 0, t0: -1, x: 0, y: 0, vx: 0, vy: 0 };

  function criarSprite(c1, c2) {
    const c = novoCanvas(64, 64);
    const x = c.getContext('2d');
    const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, c1);
    g.addColorStop(0.18, c2);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g;
    x.fillRect(0, 0, 64, 64);
    return c;
  }

  function montarCeu() {
    constelacao = null;
    estrelasCeu = [];
    // estrelinhas de fundo, só na faixa do céu
    const altura = G.horizonte;
    const n = Math.round(clamp((W * altura) / 1700, 14, 110));
    for (let i = 0; i < n; i++) {
      estrelasCeu.push({
        x: rand(0, W), y: rand(0, altura * 0.95), tam: rand(3, 8),
        f: rand(0.6, 2.2), fase: rand(0, Math.PI * 2), base: rand(0.25, 0.7),
      });
    }

    const box = G.constBox;
    if (!box) return;
    const glifos = [];
    const partes = INICIAIS.map((s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase());
    partes.forEach((p, i) => {
      for (const ch of p) if (LETRAS[ch]) glifos.push({ tracos: LETRAS[ch], k: 1, rosa: false });
      if (i < partes.length - 1) glifos.push({ tracos: CORACAO, k: 0.6, rosa: true });
    });
    if (!glifos.length) return;

    const espaco = 1.8;
    const larguraTotal = glifos.reduce((s, g) => s + 4 * g.k, 0) + espaco * (glifos.length - 1);
    const u = Math.min(box.w / larguraTotal, box.h / 6.4);
    let x0 = box.x + (box.w - larguraTotal * u) / 2;
    const y0 = box.y + (box.h - 6 * u) / 2;

    const estrelas = [], tracos = [];
    for (const g of glifos) {
      const dy = (6 - 6 * g.k) / 2 + (g.rosa ? 0.3 : 0);
      const mapa = new Map();
      for (const traco of g.tracos) {
        let anterior = null;
        for (const [px, py] of traco) {
          const chave = px + ',' + py;
          let e = mapa.get(chave);
          if (!e) {
            e = {
              x: x0 + px * g.k * u + rand(-0.12, 0.12) * u,
              y: y0 + (dy + py * g.k) * u + rand(-0.12, 0.12) * u,
              rosa: g.rosa, tam: rand(0.8, 1.35), f: rand(1, 2.6), fase: rand(0, Math.PI * 2),
            };
            mapa.set(chave, e);
            estrelas.push(e);
          }
          if (anterior) tracos.push({ a: anterior, b: e, rosa: g.rosa });
          anterior = e;
        }
      }
      x0 += (4 * g.k + espaco) * u;
    }
    // ritmo: as estrelas acendem uma a uma, depois os traços vão ligando tudo
    estrelas.forEach((e, i) => { e.t0 = (i / estrelas.length) * 2.4; });
    const durTraco = 3.2 / tracos.length;
    tracos.forEach((tr, i) => { tr.t0 = 1.2 + i * durTraco; tr.dur = durTraco * 1.6; });
    constelacao = { estrelas, tracos, u };
  }

  function desenharCeu(t) {
    if (!est.mensagem) return;
    const e = t - est.tMensagem;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    // estrelinhas de fundo piscando
    const aF = clamp((e - 1) / 3) * alfaCena;
    if (aF > 0) {
      for (const s of estrelasCeu) {
        ctx.globalAlpha = aF * s.base * (0.55 + 0.45 * Math.sin(t * s.f + s.fase));
        ctx.drawImage(estrelaImg, s.x - s.tam / 2, s.y - s.tam / 2, s.tam, s.tam);
      }
      desenharCadente(t, aF);
    }

    // a constelação
    const ec = e - 2;
    if (constelacao && ec > 0) {
      ctx.lineCap = 'round';
      ctx.lineWidth = clamp(constelacao.u / 18, 0.8, 1.6);
      for (const tr of constelacao.tracos) {
        const p = clamp((ec - tr.t0) / tr.dur);
        if (p <= 0) continue;
        ctx.globalAlpha = alfaCena * 0.75;
        ctx.strokeStyle = tr.rosa ? 'rgba(255,160,200,0.6)' : 'rgba(170,200,255,0.55)';
        ctx.beginPath();
        ctx.moveTo(tr.a.x, tr.a.y);
        ctx.lineTo(lerp(tr.a.x, tr.b.x, p), lerp(tr.a.y, tr.b.y, p));
        ctx.stroke();
      }
      for (const s of constelacao.estrelas) {
        const p = clamp((ec - s.t0) / 0.6);
        if (p <= 0) continue;
        const pisca = 0.5 + 0.5 * Math.sin(t * s.f + s.fase);
        const pop = easeOutBack(p);
        const r = constelacao.u * 0.55 * s.tam * pop * (0.85 + 0.25 * pisca);
        ctx.globalAlpha = alfaCena * Math.min(1, p * 1.6) * (0.65 + 0.35 * pisca);
        ctx.drawImage(s.rosa ? estrelaRosaImg : estrelaImg, s.x - r, s.y - r, r * 2, r * 2);
        ctx.fillStyle = s.rosa ? '#ffe0ec' : '#ffffff';
        ctx.beginPath();
        ctx.arc(s.x, s.y, Math.max(0.6, constelacao.u * 0.07 * s.tam * pop), 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  // de vez em quando, uma estrela cadente atravessa o céu
  function desenharCadente(t, a) {
    if (G.horizonte < 60) return;
    if (cadente.t0 < 0 || t - cadente.t0 > 1.1) {
      if (!cadente.proxima) cadente.proxima = t + rand(4, 8);
      if (t < cadente.proxima) return;
      const dir = Math.random() < 0.5 ? 1 : -1;
      cadente.t0 = t;
      cadente.x = dir > 0 ? rand(0, W * 0.6) : rand(W * 0.4, W);
      cadente.y = rand(0, G.horizonte * 0.4);
      const v = rand(380, 620);
      cadente.vx = dir * v * 0.9;
      cadente.vy = v * 0.32;
      cadente.proxima = t + rand(7, 15);
    }
    const vida = (t - cadente.t0) / 1.1;
    if (vida > 1) return;
    const hx = cadente.x + cadente.vx * (t - cadente.t0);
    const hy = cadente.y + cadente.vy * (t - cadente.t0);
    const tx = hx - cadente.vx * 0.16, ty = hy - cadente.vy * 0.16;
    const g = ctx.createLinearGradient(hx, hy, tx, ty);
    g.addColorStop(0, 'rgba(255,255,255,0.9)');
    g.addColorStop(1, 'rgba(160,190,255,0)');
    ctx.globalAlpha = a * Math.sin(Math.PI * vida);
    ctx.strokeStyle = g;
    ctx.lineWidth = 1.6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(hx, hy);
    ctx.lineTo(tx, ty);
    ctx.stroke();
  }

  /* =============================== CONTADOR =============================== */

  const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho',
    'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  const elDias = document.getElementById('contador-dias');
  const elUnidade = document.getElementById('contador-unidade');
  const elDesde = document.getElementById('contador-desde');
  const elFesta = document.getElementById('contador-festa');
  const [anoI, mesI, diaI] = INICIO_NAMORO.split('-').map(Number);
  function tempoJuntos(d) {
    const hoje = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const dias = Math.round((Date.UTC(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()) - Date.UTC(anoI, mesI - 1, diaI)) / 86400000);
    if (dias < 0) return null;
    let meses = (hoje.getFullYear() - anoI) * 12 + (hoje.getMonth() - (mesI - 1));
    if (hoje.getDate() < diaI) meses--;
    return { dias, meses, eDia: hoje.getDate() === diaI };
  }

  function prepararContador() {
    elDesde.textContent = `desde ${diaI} de ${MESES[mesI - 1]} de ${anoI}`;
    const j = tempoJuntos(new Date());
    // no dia 16 de cada mês, uma frasezinha de parabéns
    if (j && j.eDia && j.meses > 0) {
      elFesta.textContent = j.meses % 12 === 0
        ? `feliz ${j.meses / 12} ${j.meses === 12 ? 'ano' : 'anos'} de namoro ❤`
        : `hoje fazemos ${j.meses} ${j.meses === 1 ? 'mês' : 'meses'} ❤`;
      elFesta.hidden = false;
    }
    atualizarContador(0);
  }

  function atualizarContador(t) {
    const j = tempoJuntos(new Date()) || { dias: 0 };
    // o número "corre" de 0 até o total quando o contador aparece
    const p = est.mensagem ? easeOutCubic(clamp((t - est.tMensagem - 3.8) / 2.4)) : 0;
    const dias = Math.round(j.dias * p);
    const txt = String(dias);
    if (elDias.textContent !== txt) {
      elDias.textContent = txt;
      elUnidade.textContent = dias === 1 ? 'dia' : 'dias';
    }
  }

  /* ========================== GERAÇÃO DA CENA ========================== */

  let geracao = 0;     // se a tela mudar de tamanho no meio, a geração antiga é abandonada
  let gerando = false; // enquanto monta o jardim, não mede o desempenho

  function gerarVelaEIsqueiro() {
    if (!brilhoImg) {
      brilhoImg = criarBrilho();
      estrelaImg = criarSprite('rgba(255,255,255,1)', 'rgba(190,210,255,0.5)');
      estrelaRosaImg = criarSprite('rgba(255,240,246,1)', 'rgba(255,150,195,0.55)');
    }
    gerarVela();
    gerarIsqueiro();
  }

  // O jardim é montado aos pouquinhos (fatias de ~10 ms), sem travar a animação
  async function gerarJardim() {
    const id = ++geracao;
    gerando = true;
    try {
      await montarJardim(id);
    } finally {
      if (id === geracao) gerando = false;
    }
  }

  async function montarJardim(id) {
    await prepararBiblioteca();
    if (id !== geracao) return;

    const novas = posicionarFlores();
    const S = Math.min(escala, 2);
    const Sc = Math.min(escala, 1.5);
    let t0 = performance.now();
    for (const f of novas) {
      f.caule = criarCaule(f, Sc);
      f.cabeca = assarCabeca(f, S);
      if (performance.now() - t0 > 10) {
        await pausa();
        if (id !== geracao) return;
        t0 = performance.now();
      }
    }
    const grama = criarGrama();
    if (id !== geracao) return;

    if (est.aceso) {
      for (const f of novas) if (f.dist <= est.luzR) f.inicio = -1e6; // já floridas
    }
    flores = novas;
    gramaImg = grama;
    fundoFixo = null;
    desempenho.congelado = false;
    if (est.mensagem) criarVagalumes();
  }

  /* ================================ LAYOUT ================================ */

  function ajustarTelaPrincipal() {
    escala = Math.min(DPR, limiteEscala);
    tela.width = Math.round(W * escala);
    tela.height = Math.round(H * escala);
    ctx.setTransform(escala, 0, 0, escala, 0, 0);
    fundoFixo = null;
  }

  function calcularLayout() {
    W = window.innerWidth;
    H = window.innerHeight;
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    ajustarTelaPrincipal();

    // vela: um pouco à esquerda (no celular ela é posicionada depois da frase)
    const paisagem = W >= H * 0.9;
    G.paisagem = paisagem;
    if (paisagem) {
      const ch = clamp(H * 0.4, 150, 400), cw = ch * 0.34;
      posicionarVela(ch, cw, clamp(W * 0.2, cw * 1.3, W * 0.28), H * 0.8);
    }

    // isqueiro (desenhado numa telinha própria que acompanha o mouse)
    G.lk = clamp(Math.min(W, H) / 760, 0.8, 1.25);
    G.LW = 56 * G.lk;
    G.LH = 128 * G.lk;
    G.lfw = G.LW * 0.56;
    G.lfh = G.LH * 0.5;
    G.offToque = 64 * G.lk; // no celular, a chama fica acima do dedo
    G.ladoCursor = Math.ceil(G.LH * 2.3);
    telaCursor.width = telaCursor.height = Math.round(G.ladoCursor * DPR);
    telaCursor.style.width = telaCursor.style.height = G.ladoCursor + 'px';
    cctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    // céu com a constelação no alto + a frase no meio do jardim
    let top, hC, constTop, cxMsg, mw;
    if (paisagem) {
      const esq = G.prato.x + G.prato.w + 36;
      mw = Math.max(260, Math.min(640, W * 0.5, W - esq - 28));
      const left = Math.max(16, Math.min(Math.max(W / 2, esq + mw / 2) - mw / 2, W - mw - 16));
      cxMsg = left + mw / 2;
      elMensagem.style.width = mw + 'px';
      elMensagem.style.left = left + 'px';
      elMensagem.style.top = '0px';
      const hm = elMensagem.offsetHeight;
      constTop = H * 0.04;
      hC = Math.min(clamp(H * 0.17, 0, 170), H - hm - 30 - constTop); // o céu usa o espaço que sobrar
      if (hC < 45) {
        hC = 0;
        top = clamp(H * 0.46 - hm / 2, 16, Math.max(16, H - hm - 16));
      } else {
        top = clamp(H * 0.5 - hm / 2, constTop + hC + 14, Math.max(constTop + hC + 14, H - hm - 16));
      }
    } else {
      mw = Math.min(W * 0.88, 560);
      cxMsg = W / 2;
      elMensagem.style.width = mw + 'px';
      elMensagem.style.left = (W - mw) / 2 + 'px';
      constTop = Math.max(14, H * 0.03);
      hC = clamp(H * 0.11, 48, 100);
      top = constTop + hC + 12;
      elMensagem.style.top = top + 'px';
      const hm = elMensagem.offsetHeight;
      // a vela ocupa o espaço entre a frase e o rodapé
      const baseY = H * 0.9;
      const ch = clamp(Math.min(H * 0.27, (baseY - (top + hm) - 20) / 1.5), 100, 280), cw = ch * 0.36;
      posicionarVela(ch, cw, clamp(W * 0.27, cw * 1.15, W * 0.4), baseY);
    }
    elMensagem.style.top = top + 'px';
    const r = elMensagem.getBoundingClientRect();
    G.msg = { x: r.left, y: r.top, w: r.width, h: r.height };
    G.distMsg = dist(G.cx, G.cy, r.left + r.width / 2, r.top + r.height / 2) * 0.85;

    if (hC > 0) {
      const larg = Math.min(mw, paisagem ? 560 : W * 0.8);
      G.constBox = { x: cxMsg - larg / 2, y: constTop, w: larg, h: hC };
      G.horizonte = constTop + hC + 10; // as flores nascem daqui para baixo
    } else {
      G.constBox = null;
      G.horizonte = H * 0.05;
    }
    montarCeu();
    if (derrete.cartaVisivel) posicionarCarta();

    if (!ponteiro.mexeu) {
      ponteiro.x = W * (paisagem ? 0.74 : 0.72);
      ponteiro.y = H * 0.62;
    }
  }

  function posicionarVela(ch, cw, vx, baseY) {
    G.cw = cw;
    G.vela = { x: vx - cw / 2, y: baseY - ch, w: cw, h: ch };
    const dw = cw * 1.9, dh = cw * 0.42;
    G.prato = { x: vx - dw / 2, y: baseY - dh * 0.55, w: dw, h: dh };

    G.pavioX = vx;
    G.pavioBase = G.vela.y + ch * 0.06;
    const alturaPavio = cw * 0.16;
    G.pavioTopo = G.pavioBase - alturaPavio;
    G.pavioFonte = (10 * alturaPavio) / larguraTexto('te amo', `700 10px ${SANS}`);

    const fw = cw * 0.7, fh = cw * 1.45;
    G.chama = { x: vx - fw / 2, y: G.pavioTopo + fh * 0.1 - fh, w: fw, h: fh };
    G.cx = vx;
    G.cy = G.chama.y + fh * 0.62;
    G.limiar = Math.max(24, cw * 0.3);
    G.luzMax = Math.max(dist(G.cx, G.cy, 0, 0), dist(G.cx, G.cy, W, 0), dist(G.cx, G.cy, 0, H), dist(G.cx, G.cy, W, H)) * 1.08;
    const topoVela = G.chama.y - fh * 0.25;
    G.areaVela = { x: G.prato.x, y: topoVela, w: dw, h: G.prato.y + dh - topoVela };
    G.cliqueVela = { x: G.vela.x - 12, y: G.chama.y - 12, w: cw + 24, h: baseY - G.chama.y + 12 };
  }

  /* =============================== DESENHO =============================== */

  // desenha uma imagem em faixas horizontais que ondulam (efeito de fogo)
  function tiras(c, img, x, y, w, h, t, n, amp) {
    const sh = img.height / n, dh = h / n;
    for (let i = 0; i < n; i++) {
      const u = i / (n - 1);
      const a = amp * Math.pow(1 - u, 1.6);
      const off = Math.sin(t * 8.7 + i * 0.6) * a + Math.sin(t * 14.3 + i * 1.7) * a * 0.4;
      const sy = i * sh;
      const shh = Math.min(sh + 1, img.height - sy);
      if (shh <= 0) continue;
      c.drawImage(img, 0, sy, img.width, shh, x + off, y + i * dh, w, dh * (shh / sh));
    }
  }

  function pintarLuz(c, R, I) {
    if (R < 2 || I <= 0) return;
    const g = c.createRadialGradient(G.cx, G.cy, 0, G.cx, G.cy, R);
    g.addColorStop(0, `rgba(255,170,90,${0.28 * I})`);
    g.addColorStop(0.1, `rgba(255,128,70,${0.22 * I})`);
    g.addColorStop(0.32, `rgba(140,46,72,${0.2 * I})`);
    g.addColorStop(0.68, `rgba(52,14,42,${0.17 * I})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g;
    c.fillRect(0, 0, W, H);
  }

  // grama aparecendo aos poucos, conforme a luz chega
  function desenharGrama(R) {
    if (!gramaImg) return;
    const y = H - gramaImg.lh;
    const pedacos = 24, lp = W / pedacos, sp = gramaImg.width / pedacos;
    for (let i = 0; i < pedacos; i++) {
      const d = dist(G.cx, G.cy, (i + 0.5) * lp, y + gramaImg.lh * 0.5);
      const a = clamp((R - d) / 260);
      if (a <= 0) continue;
      ctx.globalAlpha = alfaCena * a;
      ctx.drawImage(gramaImg, i * sp, 0, Math.min(sp + 1, gramaImg.width - i * sp), gramaImg.height,
        i * lp, y, lp + 1 / escala, gramaImg.lh);
    }
    ctx.globalAlpha = alfaCena;
  }

  function desenharFlor(c, f, t, p, comBalanco) {
    const pc = easeOutCubic(clamp(p / 0.55));      // crescimento do caule
    const pf = clamp((p - 0.28) / 0.72);           // desabrochar
    const balanco = comBalanco ? Math.sin(t * f.vel + f.fase) * f.amp * Math.min(1, p * 1.5) : 0;
    const cl = f.caule;

    c.save();
    c.globalAlpha = (comBalanco ? alfaCena : 1) * f.brilho;
    c.translate(f.bx, f.by);
    if (balanco) c.rotate(balanco);

    const corte = cl.oy * (1 - pc);
    const sy = corte * cl.escala;
    const sh = cl.height - sy;
    if (sh > 1) {
      c.drawImage(cl, 0, sy, cl.width, sh, -cl.ox, -cl.oy + corte, cl.width / cl.escala, sh / cl.escala);
    }

    if (pf > 0) {
      const e = pf < 1 ? easeOutBack(pf) : 1;
      const cab = f.cabeca;
      c.translate(f.dx, -f.L);
      if (f.achat !== 1 || e !== 1) c.scale(e, e * f.achat);
      c.rotate(f.rot + (comBalanco ? Math.sin(t * f.vel * 1.3 + f.fase) * 0.06 * MOV : 0));
      c.globalAlpha = (comBalanco ? alfaCena : 1) * f.brilho * clamp(pf * 2.2);
      c.drawImage(cab, -cab.ax, -cab.ay, cab.lw, cab.lh);
    }
    c.restore();
  }

  function desenharJardim(t, R) {
    for (const f of flores) {
      if (f.inicio === null && R >= f.dist) f.inicio = t + rand(0, 0.25);
      if (f.inicio === null) continue;
      const p = clamp((t - f.inicio) / f.dur);
      if (p > 0) desenharFlor(ctx, f, t, p, true);
    }
  }

  // Guarda numa imagem tudo o que não se mexe mais (luz de fundo + grama).
  // Se o aparelho estiver lento, guarda também as flores (elas param de balançar).
  function criarFundoFixo(comJardim) {
    const c = novoCanvas(tela.width, tela.height);
    const x = c.getContext('2d', { alpha: false });
    x.setTransform(escala, 0, 0, escala, 0, 0);
    x.fillStyle = '#000';
    x.fillRect(0, 0, W, H);
    pintarLuz(x, G.luzMax, 1);
    if (gramaImg) x.drawImage(gramaImg, 0, H - gramaImg.lh, W, gramaImg.lh);
    if (comJardim) for (const f of flores) desenharFlor(x, f, 0, 1, false);
    return c;
  }

  function desenharVela(t, pv) {
    const a = alfaCena;
    ctx.globalAlpha = a * lerp(0.45, 1, pv);
    ctx.drawImage(prato, G.prato.x, G.prato.y, G.prato.w, G.prato.h);

    if (pv < 1) {
      ctx.globalAlpha = a * 0.5;
      ctx.drawImage(velaApagada, G.vela.x, G.vela.y, G.vela.w, G.vela.h);
    }
    if (pv > 0) {
      ctx.globalAlpha = a * pv;
      ctx.drawImage(velaAcesa, G.vela.x, G.vela.y, G.vela.w, G.vela.h);
    }

    // pavio: um "te amo" bem pequenininho em pé
    ctx.save();
    ctx.globalAlpha = a;
    ctx.translate(G.pavioX, G.pavioBase + queda());
    ctx.rotate(-Math.PI / 2 + 0.06);
    ctx.font = `700 ${G.pavioFonte}px ${SANS}`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillStyle = pv > 0 ? '#3a271b' : '#8a7562';
    ctx.fillText('te amo', 0, 0);
    ctx.restore();

    // antes de acender, um brilho fraquinho chamando atenção para o pavio
    if (!est.aceso) {
      const pulso = 0.5 + 0.5 * Math.sin(t * 2.2);
      const r = G.cw * 0.55;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = a * (0.08 + 0.1 * pulso);
      ctx.drawImage(brilhoImg, G.pavioX - r, G.pavioTopo - r, r * 2, r * 2);
      ctx.restore();
    }
  }

  function desenharChama(t, p, tremor) {
    const e = p < 1 ? easeOutBack(p) : 1;
    if (e <= 0.01) return;
    const c = G.chama;
    const q = queda();            // a chama desce junto com a vela que derrete
    const k = tamanhoChama();     // e cresce quando ela diz "te amo"
    const cy = G.cy + q - (k - 1) * c.h * 0.3;

    // halo quente (respira junto com a chama)
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = alfaCena * Math.min(1, e);
    const rh = G.cw * 2.6 * e * tremor * k;
    const g = ctx.createRadialGradient(G.cx, cy, 0, G.cx, cy, rh);
    g.addColorStop(0, `rgba(255,150,70,${0.26 + (k - 1) * 0.12})`);
    g.addColorStop(0.4, 'rgba(255,110,40,0.12)');
    g.addColorStop(1, 'rgba(255,80,20,0)');
    ctx.fillStyle = g;
    ctx.fillRect(G.cx - rh, cy - rh, rh * 2, rh * 2);
    ctx.restore();

    // a chama, ondulando
    ctx.save();
    ctx.globalAlpha = alfaCena;
    ctx.translate(G.pavioX, c.y + c.h + q);
    const balanco = (Math.sin(t * 2.3) * 0.07 + Math.sin(t * 5.9) * 0.025) * MOV * (1 + (k - 1) * 0.6);
    ctx.transform(1, 0, -balanco, 1, 0, 0);
    ctx.scale(e * k * (1 + Math.sin(t * 7.3) * 0.035 * MOV), e * k * (0.97 + (tremor - 1) * 1.5));
    tiras(ctx, chamaImg, -c.w / 2, -c.h, c.w, c.h, t, 16, c.w * 0.09 * MOV);
    ctx.restore();
  }

  function criarFagulha(explosao) {
    const c = G.chama;
    const ang = rand(-Math.PI * 0.9, -Math.PI * 0.1);
    const v = explosao ? rand(40, 120) : rand(25, 55);
    fagulhas.push({
      x: G.pavioX + rand(-c.w * 0.15, c.w * 0.15),
      y: c.y + queda() + c.h * rand(0.15, 0.45),
      vx: explosao ? Math.cos(ang) * v : rand(-10, 10),
      vy: explosao ? Math.sin(ang) * v : -v,
      vida: 0, max: rand(1.4, 2.8), tam: rand(3.5, 6.5), rot: rand(-0.6, 0.6), fase: rand(0, 6),
    });
  }

  function desenharFagulhas(t, dt) {
    if (est.aceso && t - est.tAceso > 0.6 && Math.random() < dt * 3.5 * MOV * derrete.forca * derrete.forca) criarFagulha(false);
    if (!fagulhas.length) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    for (let i = fagulhas.length - 1; i >= 0; i--) {
      const f = fagulhas[i];
      f.vida += dt;
      if (f.vida > f.max) { fagulhas.splice(i, 1); continue; }
      f.x += (f.vx + Math.sin(f.vida * 3 + f.fase) * 12) * dt;
      f.y += f.vy * dt;
      f.vy -= 6 * dt;
      const k = 1 - f.vida / f.max;
      ctx.globalAlpha = alfaCena * k;
      ctx.fillStyle = k > 0.6 ? '#ffe2a0' : '#ff9a4a';
      ctx.font = `700 ${f.tam}px ${SANS}`;
      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.rotate(f.rot);
      ctx.fillText('te amo', 0, 0);
      ctx.restore();
    }
    ctx.restore();
  }

  function desenharVagalumes(t) {
    if (!est.mensagem || !vagalumes.length) return;
    const a0 = clamp((t - est.tMensagem - 1.5) / 3) * alfaCena;
    if (a0 <= 0) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const v of vagalumes) {
      const x = v.x + Math.sin(t * v.f1 + v.p) * v.ax + Math.sin(t * v.f3 * 0.5 + v.p * 2) * 8;
      const y = v.y + Math.cos(t * v.f2 + v.p) * v.ay;
      const brilho = 0.2 + 0.8 * Math.pow(Math.sin(t * v.f3 + v.p), 2);
      ctx.globalAlpha = a0 * brilho * 0.7;
      ctx.drawImage(brilhoImg, x - v.tam / 2, y - v.tam / 2, v.tam, v.tam);
    }
    ctx.restore();
  }

  const fogoIsqueiro = (t) => (est.aceso ? 1 - clamp((t - est.tAceso - 1.2) / 0.7) : 1);

  // a chaminha do isqueiro ilumina um pouquinho o que está por perto
  function brilhoDoIsqueiro(t, fx, fy) {
    const f = fogoIsqueiro(t) * alfaCena;
    if (f <= 0.01) return;
    const r = 120 * G.lk * (1 + Math.sin(t * 12.7) * 0.06 * MOV);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.22 * f;
    const g = ctx.createRadialGradient(fx, fy, 0, fx, fy, r);
    g.addColorStop(0, 'rgba(255,170,80,1)');
    g.addColorStop(0.4, 'rgba(255,120,50,0.35)');
    g.addColorStop(1, 'rgba(255,90,30,0)');
    ctx.fillStyle = g;
    ctx.fillRect(fx - r, fy - r, r * 2, r * 2);
    ctx.restore();
  }

  // O isqueiro vive numa telinha do tamanho dele, que só é deslocada (bem leve)
  let cursorVisivel = true;
  function desenharIsqueiro(t, fx, fy) {
    // no celular não existe "cursor": depois de acender, o isqueiro some devagar
    const sumir = ponteiro.toque && est.aceso ? 1 - clamp((t - est.tAceso - 1.6) / 1.2) : 1;
    const alfa = alfaCena * sumir;
    if (alfa <= 0) {
      if (cursorVisivel) { telaCursor.style.visibility = 'hidden'; cursorVisivel = false; }
      return;
    }
    if (!cursorVisivel) { telaCursor.style.visibility = ''; cursorVisivel = true; }

    const lado = G.ladoCursor;
    const bicoX = fx, bicoY = fy + G.lfh * 0.5;
    telaCursor.style.transform = `translate3d(${(bicoX - lado / 2).toFixed(1)}px, ${(bicoY - lado / 2).toFixed(1)}px, 0)`;

    cctx.setTransform(1, 0, 0, 1, 0, 0);
    cctx.clearRect(0, 0, telaCursor.width, telaCursor.height);
    cctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    cctx.globalAlpha = alfa;

    cctx.save();
    cctx.translate(lado / 2, lado / 2);
    cctx.rotate(est.inclinacao);
    cctx.drawImage(isqueiro, -0.68 * G.LW, -0.06 * G.LH, G.LW, G.LH);
    cctx.restore();

    const f = fogoIsqueiro(t);
    if (f > 0.01) {
      cctx.save();
      cctx.globalAlpha = alfa * f;
      cctx.translate(lado / 2, lado / 2 + G.lfh * 0.02);
      cctx.scale(f * (1 + Math.sin(t * 9.1) * 0.05 * MOV), f * (1 + Math.sin(t * 6.7 + 1) * 0.08 * MOV));
      tiras(cctx, chamaIsqImg, -G.lfw / 2, -G.lfh, G.lfw, G.lfh, t * 1.3, 8, G.lfw * 0.12 * MOV);
      cctx.restore();
    }
  }

  /* ========================== DESEMPENHO AUTOMÁTICO ========================== */
  // Se o aparelho não der conta (menos de ~28 quadros por segundo), o site se
  // adapta sozinho: 1º baixa um pouco a resolução; 2º deixa as flores paradas.
  function avaliarDesempenho(dtReal) {
    const d = desempenho;
    if (!est.aceso || document.hidden || dtReal > 0.25 || gerando) { if (gerando) d.amostras.length = 0; return; }
    d.amostras.push(dtReal);
    if (d.amostras.length < 45) return;
    const ord = d.amostras.slice().sort((a, b) => a - b);
    d.amostras.length = 0;
    if (ord[22] < 0.036) return;
    if (escala > 1.01) {
      limiteEscala = 1;
      ajustarTelaPrincipal();
    } else if (!d.congelar) {
      d.congelar = true;
    }
  }

  /* ============================== ANIMAÇÃO ============================== */

  function quadro(ms) {
    requestAnimationFrame(quadro);
    const t = ms / 1000;
    const dtReal = ultimo ? t - ultimo : 0.016;
    const dt = Math.min(0.05, dtReal);
    ultimo = t;
    agora = t;
    if (!pronto) return;

    alfaCena = easeOutCubic(clamp((t - tPronto) / 1.8));

    // ponta de fogo do isqueiro (no celular fica um pouco acima do dedo)
    const fx = ponteiro.x;
    const fy = ponteiro.y - (ponteiro.toque ? G.offToque : 0);
    if (ponteiro.ux === null) ponteiro.ux = fx;
    est.vx = lerp(est.vx, (fx - ponteiro.ux) / Math.max(dt, 0.001), 0.15);
    ponteiro.ux = fx;
    est.inclinacao = lerp(est.inclinacao, -0.22 - clamp(est.vx * 0.0009, -0.4, 0.4) * MOV, 0.15);

    if (!est.aceso && alfaCena > 0.6 &&
        dist(fx, fy, G.pavioX, G.pavioTopo) < G.limiar * (ponteiro.toque ? 1.6 : 1)) {
      acender();
    }

    let pChama = 0, pVela = 0, intens = 0, luzR = 0, luzCompleta = false;
    if (est.aceso) {
      const e = t - est.tAceso;
      pChama = clamp(e / 0.9);
      pVela = easeOutCubic(clamp(e / 1.4));
      intens = easeOutCubic(clamp((e - 0.1) / 1.8));
      const pl = clamp((e - ATRASO_LUZ) / DURACAO_LUZ);
      luzR = G.luzMax * easeInOutSine(pl);
      luzCompleta = pl >= 1;
      est.luzR = luzR;
      if (!est.mensagem && luzR >= G.distMsg) mostrarMensagem(t);
      avaliarDesempenho(dtReal);
    }
    const tremor = 1 + (Math.sin(t * 11.3) * 0.025 + Math.sin(t * 17.9 + 1.7) * 0.018 + Math.sin(t * 5.3) * 0.03) * MOV;

    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;

    if (est.aceso && luzCompleta) {
      // a luz já tomou a tela: fundo pronto + flores
      if (desempenho.congelar && !desempenho.congelado && flores.length &&
          flores.every((f) => f.inicio !== null && t >= f.inicio + f.dur)) {
        desempenho.congelado = true;
        fundoFixo = null;
      }
      if (!fundoFixo) fundoFixo = criarFundoFixo(desempenho.congelado);
      ctx.globalAlpha = 1;
      ctx.drawImage(fundoFixo, 0, 0, W, H);
      ctx.globalAlpha = alfaCena;
      desenharCeu(t);
      if (!desempenho.congelado) desenharJardim(t, luzR);
    } else {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = alfaCena;
      if (est.aceso) {
        pintarLuz(ctx, luzR, intens * tremor);
        desenharCeu(t);
        desenharGrama(luzR);
        desenharJardim(t, luzR);
      }
    }
    if (est.mensagem) {
      atualizarContador(t);
      lerVolume();
      atualizarDerretimento(t, dt);
    }

    desenharVela(t, pVela);
    desenharGotas(dt);
    if (est.aceso) desenharChama(t, pChama, tremor);
    desenharFagulhas(t, dt);
    desenharFaiscas(t);
    desenharVagalumes(t);
    brilhoDoIsqueiro(t, fx, fy);
    desenharIsqueiro(t, fx, fy);
  }

  function acender() {
    if (est.aceso || !pronto) return;
    est.aceso = true;
    est.tAceso = agora;
    elDica.classList.remove('visivel');
    for (let i = 0; i < 18; i++) criarFagulha(true);
    vibrar(25);
  }

  function mostrarMensagem(t) {
    est.mensagem = true;
    est.tMensagem = t;
    elMensagem.classList.add('visivel');
    elMensagem.removeAttribute('aria-hidden');
    criarVagalumes();
  }

  function mostrarDica() {
    if (est.aceso) return;
    elDica.textContent = ponteiro.toque ? DICA_TOQUE : DICA_MOUSE;
    elDica.classList.add('visivel');
  }

  // separa a frase em palavras para elas aparecerem uma a uma
  function prepararTexto() {
    const palavras = elTexto.textContent.trim().split(/\s+/);
    elTexto.textContent = '';
    palavras.forEach((p, i) => {
      const s = document.createElement('span');
      s.className = 'palavra';
      s.textContent = p;
      s.style.transitionDelay = (1.1 + i * 0.075).toFixed(3) + 's';
      elTexto.appendChild(s);
      if (i < palavras.length - 1) elTexto.appendChild(document.createTextNode(' '));
    });
  }

  /* =============================== EVENTOS =============================== */

  function moverPonteiro(e) {
    ponteiro.x = e.clientX;
    ponteiro.y = e.clientY;
    ponteiro.toque = e.pointerType === 'touch';
    ponteiro.mexeu = true;
  }

  window.addEventListener('pointermove', moverPonteiro, { passive: true });
  // área da vela (acompanha a vela enquanto ela derrete)
  const zonaVela = () => {
    const topo = G.chama.y + queda() - 20;
    return { x: G.vela.x - 20, y: topo, w: G.vela.w + 40, h: G.vela.y + G.vela.h - topo + 20 };
  };

  window.addEventListener('pointerdown', (e) => {
    if (e.target.closest && e.target.closest('button, .carta')) return;
    moverPonteiro(e);
    if (e.pointerType === 'touch') ponteiro.ux = null; // evita "tranco" ao tocar longe
    if (!pronto) return;
    if (!est.aceso && dentro(e.clientX, e.clientY, G.cliqueVela)) acender();
    // segurar a vela acesa faz a chama crescer (e a vela derreter mais rápido)
    else if (est.aceso && dentro(e.clientX, e.clientY, zonaVela())) derrete.segurando = true;
  });
  const soltar = () => { derrete.segurando = false; };
  window.addEventListener('pointerup', soltar);
  window.addEventListener('pointercancel', soltar);
  window.addEventListener('blur', soltar);

  window.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    if (e.target.closest && e.target.closest('button')) return;
    e.preventDefault();
    if (!est.aceso) acender();
    else derrete.segurando = true; // segurar espaço também alimenta a chama
  });
  window.addEventListener('keyup', (e) => {
    if (e.key === 'Enter' || e.key === ' ') soltar();
  });

  elOuvir.addEventListener('click', iniciarEscuta);
  elVoltar.addEventListener('click', () => mostrarCarta(false));
  elLerCarta.addEventListener('click', () => mostrarCarta(true));

  let timerResize = 0, ultimoW = 0, ultimoH = 0;
  window.addEventListener('resize', () => {
    clearTimeout(timerResize);
    timerResize = setTimeout(() => {
      if (!pronto) return;
      const mudouMuito = Math.abs(window.innerWidth - ultimoW) > 30 ||
        Math.abs(window.innerHeight - ultimoH) > window.innerHeight * 0.12;
      calcularLayout();
      if (mudouMuito) {
        ultimoW = W; ultimoH = H;
        gerarVelaEIsqueiro();
        gerarJardim();
      }
    }, 250);
  });

  /* ================================ INÍCIO ================================ */

  async function carregarFontes() {
    if (!document.fonts || !document.fonts.load) return;
    const lista = [
      '700 16px "Quicksand"', '700 16px "Dancing Script"',
      '400 16px "Great Vibes"', 'italic 500 16px "Cormorant Garamond"',
    ];
    const limite = new Promise((ok) => setTimeout(ok, 3000));
    try {
      await Promise.race([Promise.all(lista.map((f) => document.fonts.load(f, 'te amo ção'))), limite]);
    } catch (_) { /* segue com as fontes do sistema */ }
  }

  async function iniciar() {
    prepararTexto();
    prepararContador();
    prepararCarta();
    await carregarFontes();
    calcularLayout();
    ultimoW = W; ultimoH = H;
    gerarVelaEIsqueiro();      // rápido: a vela aparece logo
    pronto = true;
    tPronto = performance.now() / 1000;
    setTimeout(mostrarDica, 2400);
    gerarJardim();             // o jardim vai sendo montado nos bastidores
  }

  requestAnimationFrame(quadro);
  iniciar();
})();
