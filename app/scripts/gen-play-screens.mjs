// Gera telas-modelo (mockups) para a ficha da Play, em 3 formatos:
// telefone (1080x1920), tablet (1920x1200) e chromebook (1920x1080).
// Uso: node scripts/gen-play-screens.mjs   (dentro de app/; usa sharp)
// Regras: dados SEMPRE fictícios (Ana, João, Maria) — nunca aluno real.
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const INDIGO = "#4f46e5";
const INDIGO7 = "#3730a3";
const INDIGO50 = "#eef2ff";
const WHATS = "#25d366";
const PEND = "#b45309";
const PEND_BG = "#fef3c7";
const PAGO = "#15803d";
const PAGO_BG = "#dcfce7";
const FALTA = "#b91c1c";
const FALTA_BG = "#fee2e2";
const C900 = "#111827";
const C500 = "#6b7280";
const C200 = "#e5e7eb";
const C100 = "#f3f4f6";
const FUNDO = "#f9fafb";

const W = 1080, H = 1920;

const card = (x, y, w, h, fill = "#fff", stroke = C200) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="30" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;

const badge = (x, y, w, texto, bg, cor) =>
  `<rect x="${x}" y="${y}" width="${w}" height="58" rx="29" fill="${bg}"/>
   <text x="${x + w / 2}" y="${y + 40}" text-anchor="middle" font-family="Arial" font-size="28" font-weight="700" fill="${cor}">${texto}</text>`;

const tick = (x, y, cor = PAGO, esc = 1) =>
  `<path d="M${x} ${y}l${13 * esc} ${13 * esc} ${24 * esc} -${28 * esc}" stroke="${cor}" stroke-width="${7 * esc}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;

function topo(titulo, sub) {
  return `
    <text x="56" y="118" font-family="Arial" font-size="56" font-weight="800" fill="${C900}">${titulo}</text>
    ${sub ? `<text x="56" y="168" font-family="Arial" font-size="32" fill="${C500}">${sub}</text>` : ""}`;
}

function bottomNav(ativa) {
  const itens = [["Agenda", 135], ["Alunos", 405], ["Cobranças", 675], ["Perfil", 945]];
  let s = `<rect x="0" y="${H - 140}" width="${W}" height="140" fill="#ffffff"/>
    <line x1="0" y1="${H - 140}" x2="${W}" y2="${H - 140}" stroke="${C200}" stroke-width="2"/>`;
  for (const [nome, cx] of itens) {
    const cor = nome === ativa ? INDIGO : C500;
    s += `<rect x="${cx - 26}" y="${H - 118}" width="52" height="44" rx="10" fill="none" stroke="${cor}" stroke-width="5"/>
      <text x="${cx}" y="${H - 34}" text-anchor="middle" font-family="Arial" font-size="26" font-weight="700" fill="${cor}">${nome}</text>`;
  }
  return s;
}

const wrap = (inner) =>
  `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${W}" height="${H}" fill="${FUNDO}"/>${inner}</svg>`;

// ---- Tela 1: Agenda semanal ----
function aulaCard(y, hora, nome, detalhe, badgeTxt, badgeBg, badgeCor) {
  return `${card(56, y, W - 112, 150)}
    <text x="96" y="${y + 92}" font-family="Arial" font-size="42" font-weight="800" fill="${INDIGO7}">${hora}</text>
    <text x="240" y="${y + 72}" font-family="Arial" font-size="38" font-weight="700" fill="${C900}">${nome}</text>
    <text x="240" y="${y + 118}" font-family="Arial" font-size="30" fill="${C500}">${detalhe}</text>
    ${badgeTxt ? badge(W - 300, y + 46, 220, badgeTxt, badgeBg, badgeCor) : ""}`;
}
const tela1 = wrap(`
  ${topo("Agenda", "Sua semana de aulas")}
  ${card(56, 210, W - 112, 100, "#fff")}
  <text x="120" y="278" font-family="Arial" font-size="44" fill="${C500}">&#8249;</text>
  <text x="${W / 2}" y="275" text-anchor="middle" font-family="Arial" font-size="34" font-weight="700" fill="${C900}">13/07 &#8211; 19/07</text>
  <text x="${W - 120}" y="278" text-anchor="end" font-family="Arial" font-size="44" fill="${C500}">&#8250;</text>

  <text x="56" y="410" font-family="Arial" font-size="30" font-weight="800" fill="${INDIGO}">SEGUNDA 13/07 &#183; HOJE</text>
  ${aulaCard(440, "18:00", "Ana Souza", "60 min &#183; R$ 60,00", "dada", PAGO_BG, PAGO)}
  ${tick(W - 250, 505)}

  <text x="56" y="700" font-family="Arial" font-size="30" font-weight="800" fill="${C500}">TERÇA 14/07</text>
  ${aulaCard(730, "19:00", "João Lima", "60 min &#183; R$ 70,00", "", "", "")}
  ${aulaCard(900, "20:00", "Maria Reis", "60 min &#183; mensalista", "falta", FALTA_BG, FALTA)}

  <text x="56" y="1160" font-family="Arial" font-size="30" font-weight="800" fill="${C500}">QUARTA 15/07</text>
  ${aulaCard(1190, "10:00", "Pedro Alves", "90 min &#183; R$ 90,00", "", "", "")}

  <circle cx="${W - 130}" cy="${H - 260}" r="62" fill="${INDIGO}"/>
  <text x="${W - 130}" y="${H - 238}" text-anchor="middle" font-family="Arial" font-size="64" fill="#fff">+</text>
  ${bottomNav("Agenda")}
`);

// ---- Tela 2: Cobrar no WhatsApp (a feature matadora) ----
const linhasMsg = [
  "Oi, Ana! Tudo bem?",
  "",
  "Segue o resumo das suas aulas",
  "de julho:",
  "",
  "4 aulas:",
  "&#8226; seg 06/07 às 18:00",
  "&#8226; seg 13/07 às 18:00",
  "&#8226; seg 20/07 às 18:00",
  "&#8226; seg 27/07 às 18:00",
  "",
  "Total: R$ 240,00",
  "",
  "Pode fazer o Pix para a chave:",
  "professora@email.com",
  "",
  "Qualquer dúvida me chama!",
];
const tela2 = wrap(`
  ${topo("Cobrar Ana", "Revise a mensagem antes de enviar")}
  <rect x="56" y="210" width="${W - 112}" height="170" rx="30" fill="${PEND_BG}" stroke="#fcd34d" stroke-width="2"/>
  <text x="${W / 2}" y="295" text-anchor="middle" font-family="Arial" font-size="62" font-weight="800" fill="${PEND}">R$ 240,00</text>
  <text x="${W / 2}" y="350" text-anchor="middle" font-family="Arial" font-size="30" font-weight="600" fill="${PEND}">total desta cobrança</text>

  ${card(56, 420, W - 112, 900)}
  ${linhasMsg.map((l, i) => `<text x="104" y="${492 + i * 48}" font-family="Arial" font-size="32" fill="${C900}">${l}</text>`).join("")}

  <rect x="56" y="1370" width="${W - 112}" height="120" rx="26" fill="${WHATS}"/>
  <text x="${W / 2}" y="1445" text-anchor="middle" font-family="Arial" font-size="40" font-weight="700" fill="#fff">Abrir no WhatsApp</text>
  <rect x="56" y="1520" width="${W - 112}" height="110" rx="26" fill="${INDIGO50}"/>
  <text x="${W / 2}" y="1590" text-anchor="middle" font-family="Arial" font-size="36" font-weight="700" fill="${INDIGO7}">Copiar mensagem</text>
  <text x="${W / 2}" y="1700" text-anchor="middle" font-family="Arial" font-size="26" fill="${C500}">Você revisa e envia pelo seu WhatsApp. Nada é enviado sozinho.</text>
  ${bottomNav("Cobranças")}
`);

// ---- Tela 3: Central de cobranças ----
function resumo(x, titulo, valor, cor) {
  const w = (W - 152) / 3;
  return `${card(x, 210, w, 170)}
    <text x="${x + w / 2}" y="290" text-anchor="middle" font-family="Arial" font-size="40" font-weight="800" fill="${cor}">${valor}</text>
    <text x="${x + w / 2}" y="345" text-anchor="middle" font-family="Arial" font-size="24" font-weight="600" fill="${C500}">${titulo}</text>`;
}
const tela3 = wrap(`
  ${topo("Cobranças", "Seu mês em dinheiro &#8212; julho")}
  ${resumo(56, "recebido no mês", "R$ 480", PAGO)}
  ${resumo(56 + (W - 152) / 3 + 20, "em aberto", "R$ 240", PEND)}
  ${resumo(56 + 2 * ((W - 152) / 3 + 20), "previsto", "R$ 720", C900)}

  <text x="56" y="480" font-family="Arial" font-size="30" font-weight="800" fill="${C500}">QUEM ESTÁ DEVENDO</text>
  ${card(56, 510, W - 112, 190)}
  <circle cx="140" cy="605" r="44" fill="${INDIGO50}"/>
  <text x="140" y="622" text-anchor="middle" font-family="Arial" font-size="42" font-weight="800" fill="${INDIGO7}">A</text>
  <text x="215" y="585" font-family="Arial" font-size="38" font-weight="700" fill="${C900}">Ana Souza</text>
  <text x="215" y="640" font-family="Arial" font-size="30" fill="${C500}">4 aulas &#183; <tspan font-weight="800" fill="${PEND}">R$ 240,00</tspan></text>
  <rect x="${W - 320}" y="560" width="240" height="90" rx="22" fill="${WHATS}"/>
  <text x="${W - 200}" y="618" text-anchor="middle" font-family="Arial" font-size="30" font-weight="700" fill="#fff">Cobrar</text>

  <text x="56" y="820" font-family="Arial" font-size="30" font-weight="800" fill="${C500}">PAGAMENTOS DE JULHO</text>
  ${[["R$ 120,00", "10/07 &#183; pix", 850], ["R$ 240,00", "05/07 &#183; pix", 1020], ["R$ 120,00", "02/07 &#183; dinheiro", 1190]]
    .map(([v, d, y]) => `${card(56, y, W - 112, 150)}
      <text x="104" y="${y + 68}" font-family="Arial" font-size="36" font-weight="700" fill="${C900}">${v}</text>
      <text x="104" y="${y + 116}" font-family="Arial" font-size="28" fill="${C500}">${d}</text>
      ${badge(W - 300, y + 46, 220, "recebido", PAGO_BG, PAGO)}`).join("")}
  ${bottomNav("Cobranças")}
`);

// ---- Tela 4: Detalhe do aluno ----
const tela4 = wrap(`
  <circle cx="120" cy="120" r="52" fill="${INDIGO50}"/>
  <text x="120" y="140" text-anchor="middle" font-family="Arial" font-size="48" font-weight="800" fill="${INDIGO7}">A</text>
  <text x="205" y="105" font-family="Arial" font-size="48" font-weight="800" fill="${C900}">Ana Souza</text>
  <text x="205" y="160" font-family="Arial" font-size="30" fill="${C500}">Avulso &#183; R$ 60,00/aula</text>

  <rect x="56" y="220" width="${W - 112}" height="180" rx="30" fill="${PEND_BG}" stroke="#fcd34d" stroke-width="2"/>
  <text x="${W / 2}" y="310" text-anchor="middle" font-family="Arial" font-size="64" font-weight="800" fill="${PEND}">R$ 240,00</text>
  <text x="${W / 2}" y="368" text-anchor="middle" font-family="Arial" font-size="28" font-weight="600" fill="${PEND}">em aberto &#183; 4 aulas</text>

  <rect x="56" y="440" width="${W - 112}" height="115" rx="26" fill="${WHATS}"/>
  <text x="${W / 2}" y="512" text-anchor="middle" font-family="Arial" font-size="38" font-weight="700" fill="#fff">Cobrar no WhatsApp</text>
  <rect x="56" y="580" width="${W - 112}" height="105" rx="26" fill="${INDIGO50}"/>
  <text x="${W / 2}" y="647" text-anchor="middle" font-family="Arial" font-size="34" font-weight="700" fill="${INDIGO7}">Registrar pagamento</text>

  <rect x="56" y="740" width="${W - 112}" height="90" rx="24" fill="${C100}"/>
  <rect x="66" y="750" width="300" height="70" rx="18" fill="#fff"/>
  <text x="216" y="797" text-anchor="middle" font-family="Arial" font-size="30" font-weight="700" fill="${C900}">Aulas</text>
  <text x="530" y="797" text-anchor="middle" font-family="Arial" font-size="30" font-weight="700" fill="${C500}">Pagamentos</text>
  <text x="850" y="797" text-anchor="middle" font-family="Arial" font-size="30" font-weight="700" fill="${C500}">Dados</text>

  ${[["seg 27/07 às 18:00", "R$ 60,00 &#183; pendente", "agendada", INDIGO50, INDIGO7, 870],
     ["seg 20/07 às 18:00", "R$ 60,00 &#183; pendente", "dada", PAGO_BG, PAGO, 1040],
     ["seg 13/07 às 18:00", "R$ 60,00 &#183; paga", "dada", PAGO_BG, PAGO, 1210],
     ["seg 06/07 às 18:00", "R$ 60,00 &#183; paga", "dada", PAGO_BG, PAGO, 1380]]
    .map(([t, d, b, bg, cor, y]) => `${card(56, y, W - 112, 150)}
      <text x="104" y="${y + 66}" font-family="Arial" font-size="34" font-weight="700" fill="${C900}">${t}</text>
      <text x="104" y="${y + 114}" font-family="Arial" font-size="28" fill="${C500}">${d}</text>
      ${badge(W - 300, y + 46, 220, b, bg, cor)}`).join("")}
  ${bottomNav("Alunos")}
`);

const telas = { "tela1-agenda": tela1, "tela2-cobrar": tela2, "tela3-cobrancas": tela3, "tela4-aluno": tela4 };

const DIR = "../play-assets";
mkdirSync(`${DIR}/telefone`, { recursive: true });
mkdirSync(`${DIR}/tablet`, { recursive: true });
mkdirSync(`${DIR}/chromebook`, { recursive: true });

const buffers = {};
for (const [nome, svg] of Object.entries(telas)) {
  buffers[nome] = await sharp(Buffer.from(svg)).png().toBuffer();
  await sharp(buffers[nome]).toFile(`${DIR}/telefone/${nome}.png`);
}
console.log(`telefone: ${Object.keys(telas).length} telas (1080x1920)`);

async function paisagem(destino, larg, alt) {
  let i = 1;
  for (const nome of Object.keys(telas)) {
    const alturaTela = Math.round(alt * 0.86);
    const largTela = Math.round((alturaTela * W) / H);
    const tela = await sharp(buffers[nome]).resize(largTela, alturaTela).png().toBuffer();
    const fundo = `<svg width="${larg}" height="${alt}" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${INDIGO50}"/><stop offset="1" stop-color="#e0e7ff"/></linearGradient></defs>
      <rect width="${larg}" height="${alt}" fill="url(#g)"/>
      <text x="${larg / 2}" y="${Math.round(alt * 0.09)}" text-anchor="middle" font-family="Arial" font-size="${Math.round(alt * 0.035)}" font-weight="800" fill="${INDIGO7}">Marcaula &#8212; marque, dê e cobre suas aulas</text>
    </svg>`;
    await sharp(Buffer.from(fundo))
      .composite([{ input: tela, left: Math.round((larg - largTela) / 2), top: alt - alturaTela }])
      .png()
      .toFile(`${DIR}/${destino}/${destino}-${i}.png`);
    i++;
  }
}
await paisagem("tablet", 1920, 1200);
console.log("tablet: 4 telas (1920x1200)");
await paisagem("chromebook", 1920, 1080);
console.log("chromebook: 4 telas (1920x1080)");
console.log("OK — telas geradas em play-assets/");
