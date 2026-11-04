// Genera en el build una página HTML estática por nota en /notas/<slug>/,
// además de sitemap.xml y _redirects (nota.html?id=<id> → /notas/<slug>/).
// Todo lo que necesita un buscador o una red social está en el HTML inicial;
// assets/app.js solo agrega la navegación y el rail cuando hay JavaScript.
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const MESES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
const TZ = "-06:00"; // hora del centro de México (sin horario de verano)

export function slugDe(titulo) {
  const s = String(titulo || "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const corto = s.length > 90 ? s.slice(0, 90).replace(/-[^-]*$/, "") : s;
  return corto || "nota";
}

// Asigna slugs únicos y estables: si dos titulares coinciden, la nota más antigua
// (por id) conserva el slug limpio y las demás llevan -2, -3…
export function asignarSlugs(notas) {
  const usados = new Map();
  for (const n of [...notas].sort((a, b) => (a.id < b.id ? -1 : 1))) {
    const base = slugDe(n.t);
    const k = (usados.get(base) || 0) + 1;
    usados.set(base, k);
    n.s = k === 1 ? base : `${base}-${k}`;
  }
}

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const fechaLarga = (d) => { const [y, m, dd] = d.slice(0, 10).split("-"); return `${parseInt(dd, 10)} de ${MESES[parseInt(m, 10) - 1]} de ${y}`; };
const iso = (f) => (/T\d{2}:\d{2}$/.test(f) ? `${f}:00${TZ}` : /^\d{4}-\d{2}-\d{2}$/.test(f) ? `${f}T00:00:00${TZ}` : f);

function relEnlace(n) { return n.p ? "sponsored noopener" : "noopener"; }

// Mismo formato que parrafos() en assets/app.js: **negritas**, [texto](url), ## subtítulos.
function parrafos(n) {
  const rel = relEnlace(n);
  let out = n.r ? `<p><strong>${esc(n.r)}</strong></p>` : "";
  for (let p of (n.b || "").split(/\n\s*\n/)) {
    p = p.trim(); if (!p) continue;
    const h = esc(p).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, `<a href="$2" target="_blank" rel="${rel}" style="text-decoration:underline">$1</a>`)
      .replace(/\n/g, "<br>");
    out += /^#{1,3} /.test(p) ? `<h2 style="font-size:24px;margin:24px 0 10px">${h.replace(/^#{1,3} /, "")}</h2>` : `<p>${h}</p>`;
  }
  if (!n.b && n.r) out = `<p>${esc(n.r)}</p>`;
  return out;
}

function leerImagenes(raiz) {
  const ctx = { window: {} };
  try { vm.runInNewContext(fs.readFileSync(path.join(raiz, "assets/imagenes.js"), "utf8"), ctx); } catch { }
  return ctx.window.IMAGENES || {};
}

function imagenDe(n, IMG, sitio, w = 1200) {
  if (n.foto) return /^https?:/.test(n.foto) ? n.foto : sitio + "/" + n.foto.replace(/^\/+/, "");
  const m = IMG[n.img];
  if (m && m.file) {
    if (/^https?:/.test(m.file)) return m.file;
    if (/^img\//.test(m.file)) return `${sitio}/${m.file}`;
    return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(m.file)}?width=${w}`;
  }
  return `${sitio}/assets/logo.png`;
}

function textoPlano(s, max = 300) {
  const t = String(s || "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/[*#]/g, "").replace(/\s+/g, " ").trim();
  return t.length > max ? t.slice(0, max - 1).replace(/\s+\S*$/, "") + "…" : t;
}

function pagina(n, ctx) {
  const { sitio, nombre, CATS, IMG, v, cabeza } = ctx;
  const url = `${sitio}/notas/${n.s}/`;
  const titulo = `${n.t} · ${nombre}`;
  const desc = textoPlano(n.r || n.b, 300);
  const img = imagenDe(n, IMG, sitio);
  const m = IMG[n.img] || {};
  const alt = n.foto ? n.t : (m.alt || n.t);
  const publicado = iso(n.f), modificado = iso(n.mod || n.f);
  const rel = relEnlace(n);
  const ld = {
    "@context": "https://schema.org", "@type": "Article",
    headline: n.t.slice(0, 110), description: desc,
    datePublished: publicado, dateModified: modificado,
    image: [img], mainEntityOfPage: { "@type": "WebPage", "@id": url },
    author: { "@type": "Organization", name: n.a || nombre },
    publisher: { "@type": "Organization", name: nombre, logo: { "@type": "ImageObject", url: `${sitio}/assets/logo.png` } },
    articleSection: CATS[n.c] || n.c
  };
  const etiqueta = n.p ? `<p class="patrocinado" style="display:inline-block;margin:0 0 12px;padding:4px 10px;border:1px solid currentColor;border-radius:4px;font:700 12px/1.4 Montserrat,sans-serif;letter-spacing:.06em;text-transform:uppercase">Contenido patrocinado</p>` : "";
  const fuentes = n.src.length ? `<div class="caja-fuentes"><b>Fuentes</b><ul>${n.src.map((s) => `<li><a href="${esc(s[1])}" target="_blank" rel="${rel}">${esc(s[0])}</a></li>`).join("")}</ul></div>` : "";
  return `<!doctype html>
<html lang="es-MX">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<base href="/">
<title>${esc(titulo)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="robots" content="index, follow, max-image-preview:large">
<link rel="canonical" href="${esc(url)}">
<meta name="theme-color" content="${esc(cabeza.tema)}">
<meta property="og:site_name" content="${esc(nombre)}">
<meta property="og:locale" content="es_MX">
<meta property="og:type" content="article">
<meta property="og:title" content="${esc(n.t)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${esc(img)}">
<meta property="og:image:alt" content="${esc(alt)}">
<meta property="article:published_time" content="${publicado}">
<meta property="article:modified_time" content="${modificado}">
<meta property="article:section" content="${esc(CATS[n.c] || n.c)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(n.t)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${esc(img)}">
<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, "\\u003c")}</script>
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
${cabeza.fuentes}
<link rel="stylesheet" href="/assets/style.css">
</head>
<body data-pagina="nota" data-id="${esc(n.id)}">
<div id="app">
<header style="padding:14px 16px;border-bottom:1px solid rgba(0,0,0,.1)"><a href="/" aria-label="${esc(nombre)}, inicio">${cabeza.logo ? `<img src="${esc(cabeza.logo)}" alt="${esc(nombre)}" style="height:44px;width:auto">` : esc(nombre)}</a></header>
<div class="wrap"><main class="cuerpo" id="contenido"><article class="nota-art">
<div class="migas"><a href="/">Portada</a><span>›</span><a href="/seccion.html?s=${esc(n.c)}">${esc(CATS[n.c] || n.c)}</a></div>
${etiqueta}<h1>${esc(n.t)}</h1>
<div class="meta"><a class="cat" href="/seccion.html?s=${esc(n.c)}">${esc(CATS[n.c] || n.c)}</a><span>${esc(n.a)} · <time datetime="${publicado}">${fechaLarga(n.f)}</time></span></div>
<figure><div class="img"><img src="${esc(img)}" alt="${esc(alt)}" loading="eager" decoding="async" referrerpolicy="no-referrer"></div>${n.cred ? `<figcaption>${esc(n.cred)}</figcaption>` : ""}</figure>
<div class="texto">${parrafos(n)}</div>
${fuentes}
</article></main></div>
<footer style="padding:24px 16px;font-size:14px"><a href="/">${esc(nombre)}</a></footer>
</div>
<script src="/assets/imagenes.js"></script>
<script src="/assets/datos.js?v=${v}"></script>
<script src="/assets/app.js?v=${v}"></script>
</body>
</html>
`;
}

// Lee nombre del sitio, URL, color, fuentes y logo de la página de nota existente
// y de admin/config.yml, para que el mismo script sirva en todos los sitios.
export function configSitio(raiz) {
  const nota = fs.readFileSync(path.join(raiz, "nota.html"), "utf8");
  let sitio = process.env.SITIO_URL || "";
  if (!sitio) {
    try { sitio = (fs.readFileSync(path.join(raiz, "admin/config.yml"), "utf8").match(/^site_url:\s*(\S+)/m) || [])[1] || ""; } catch { }
  }
  if (!sitio) sitio = process.env.URL || "";
  sitio = sitio.replace(/\/+$/, "");
  const nombre = (nota.match(/property="og:site_name" content="([^"]+)"/) || [])[1] || "Noticias";
  const tema = (nota.match(/name="theme-color" content="([^"]+)"/) || [])[1] || "#000000";
  const fuentes = (nota.match(/<link rel="preconnect"[\s\S]*?fonts\.googleapis\.com\/css2[^>]*>/) || [""])[0];
  const logo = ["assets/logo.webp", "assets/logo.png", "assets/logo.svg"].find((f) => fs.existsSync(path.join(raiz, f)));
  return { sitio, nombre, cabeza: { tema, fuentes, logo: logo ? "/" + logo : "" } };
}

export function generar(raiz, notas, CATS, v) {
  const cfg = configSitio(raiz);
  if (!cfg.sitio) throw new Error("No encontré la URL del sitio (site_url en admin/config.yml o SITIO_URL).");
  const IMG = leerImagenes(raiz);
  const dir = path.join(raiz, "notas");
  fs.rmSync(dir, { recursive: true, force: true });
  const ctx = { ...cfg, CATS, IMG, v };
  for (const n of notas) {
    fs.mkdirSync(path.join(dir, n.s), { recursive: true });
    fs.writeFileSync(path.join(dir, n.s, "index.html"), pagina(n, ctx));
  }

  // sitemap.xml
  const urls = notas.map((n) => `  <url><loc>${esc(`${cfg.sitio}/notas/${n.s}/`)}</loc><lastmod>${iso(n.mod || n.f)}</lastmod></url>`);
  const ultima = notas.length ? iso(notas[0].mod || notas[0].f) : new Date().toISOString();
  fs.writeFileSync(path.join(raiz, "sitemap.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    `  <url><loc>${esc(cfg.sitio)}/</loc><lastmod>${ultima}</lastmod></url>\n${urls.join("\n")}\n</urlset>\n`);

  // robots.txt
  fs.writeFileSync(path.join(raiz, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${cfg.sitio}/sitemap.xml\n`);

  // _redirects: 301 desde la URL antigua con parámetro. El "!" obliga a aplicar la
  // regla aunque nota.html exista; sin id (o con un id desconocido) se sirve nota.html.
  const reglas = [];
  for (const n of notas) {
    const id = encodeURIComponent(n.id);
    reglas.push(`/nota.html id=${id} /notas/${n.s}/ 301!`, `/nota id=${id} /notas/${n.s}/ 301!`);
  }
  fs.writeFileSync(path.join(raiz, "_redirects"), "# Generado por scripts/paginas.mjs — no editar a mano.\n" + reglas.join("\n") + "\n");
  return { ...cfg, total: notas.length };
}
