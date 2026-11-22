/* ShelfSense — product illustrations (inline SVG, drawn in code, no external images).
 *   ShelfSenseArt.html(productId, size)  -> <svg> markup for a 64×64 tile
 *   ShelfSenseArt.has(productId)         -> true when an illustration exists
 * Style: soft 3D — every shape uses a light→dark gradient from a top-left light source, plus specular
 * highlights and a contact shadow. Every product in assets/data.js has an entry in ART below.
 */
(function () {
  // lighten (a>0) / darken (a<0) a #RRGGBB colour
  function sh(hex, a) {
    const n = parseInt(hex.slice(1), 16);
    const f = (v) => Math.max(0, Math.min(255, Math.round(a < 0 ? v * (1 + a) : v + (255 - v) * a)));
    return '#' + [n >> 16, (n >> 8) & 255, n & 255].map(f).map((v) => v.toString(16).padStart(2, '0')).join('');
  }

  let uidCounter = 0;
  // Gradient factory — ids are unique per rendered <svg>, so many tiles can sit on one page
  function makeG() {
    const u = 'sa' + (++uidCounter);
    let n = 0;
    const defs = [];
    const add = (inner) => { const id = u + 'g' + (n++); defs.push(inner.replace('ID', id)); return `url(#${id})`; };
    return {
      defs,
      // round / volumetric (light from top-left)
      r: (c) => add(`<radialGradient id="ID" cx=".34" cy=".28" r=".88"><stop offset="0" stop-color="${sh(c, 0.55)}"/><stop offset=".42" stop-color="${c}"/><stop offset="1" stop-color="${sh(c, -0.42)}"/></radialGradient>`),
      // cylinders / bottles / bags (light → dark across the width)
      l: (c) => add(`<linearGradient id="ID" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="${sh(c, 0.42)}"/><stop offset=".38" stop-color="${c}"/><stop offset="1" stop-color="${sh(c, -0.4)}"/></linearGradient>`),
      // top → bottom
      v: (c) => add(`<linearGradient id="ID" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${sh(c, 0.4)}"/><stop offset=".5" stop-color="${c}"/><stop offset="1" stop-color="${sh(c, -0.34)}"/></linearGradient>`)
    };
  }

  const SHADOW = '<ellipse cx="32" cy="56.5" rx="20" ry="4" fill="#0F172A" opacity=".18"/>';
  // soft specular highlight (white, translucent)
  const hl = (cx, cy, rx, ry, rot, op) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#fff" opacity="${op || 0.5}" transform="rotate(${rot || 0} ${cx} ${cy})"/>`;
  const dot = (cx, cy, r, c) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${c}"/>`;

  // ---- drawing templates: (main colour, extra colour, gradient factory) -> SVG ----
  const T = {
    breast: (c, x, G) => `<path d="M10 38c0-14 11-22 23-21 11 1 20 9 20 19 0 12-11 17-23 17-12 0-20-5-20-15z" fill="${G.r(c)}"/>
      <path d="M18 36c4-8 14-12 24-8" stroke="${sh(c, 0.55)}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".8"/>
      <path d="M20 46c7 3 17 2 24-4" stroke="${sh(c, -0.3)}" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".7"/>${hl(24, 27, 8, 4, -25, 0.5)}`,
    drumstick: (c, x, G) => `<rect x="34" y="35" width="8" height="19" rx="4" transform="rotate(-45 38 44)" fill="${G.l('#F4EBDD')}"/>
      <circle cx="49" cy="51" r="4.2" fill="${G.r('#F4EBDD')}"/><circle cx="44" cy="54" r="3.6" fill="${G.r('#F4EBDD')}"/>
      <ellipse cx="28" cy="28" rx="16" ry="14" fill="${G.r(c)}" transform="rotate(-20 28 28)"/>
      <path d="M17 26c3-6 10-9 16-6" stroke="${sh(c, 0.5)}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".85"/>${hl(23, 21, 6, 3, -30, 0.45)}`,
    ground: (c, x, G) => `<path d="M8 49c1-16 10-27 24-27s23 11 24 27z" fill="${G.r(c)}"/>
      ${dot(22, 41, 2.8, sh(c, -0.3))}${dot(33, 34, 2.8, sh(c, -0.3))}${dot(43, 42, 2.8, sh(c, -0.3))}${dot(30, 45, 2.4, sh(c, 0.35))}${dot(39, 30, 2.2, sh(c, 0.35))}${dot(17, 47, 2, sh(c, 0.35))}
      ${hl(22, 31, 7, 3, -35, 0.4)}`,
    steak: (c, x, G) => `<path d="M9 35c0-11 11-18 24-18 12 0 22 7 22 18 0 12-11 19-23 19-13 0-23-7-23-19z" fill="${G.r(c)}"/>
      <path d="M11 38c1 9 10 14 22 14 11 0 20-5 21-14" stroke="${sh(c, 0.62)}" stroke-width="2.4" fill="none" opacity=".7"/>
      <path d="M17 33c6-4 12-4 17 0M28 41c6-4 13-4 18 0" stroke="${sh(c, 0.6)}" stroke-width="2.6" fill="none" stroke-linecap="round"/>${hl(22, 24, 8, 3.2, -20, 0.4)}`,
    fish: (c, x, G) => `<path d="M7 32c8-14 25-16 35-5l11-8v26l-11-8C32 48 15 46 7 32z" fill="${G.v(c)}"/>
      <path d="M12 34c10 6 22 6 30-5" stroke="${sh(c, 0.55)}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".6"/>
      <path d="M20 25c5 4 6 12 1 18M27 23c3 5 3 12 0 17" stroke="${sh(c, -0.25)}" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".7"/>
      <circle cx="15" cy="30" r="3" fill="#fff"/><circle cx="15" cy="30" r="1.8" fill="#1E293B"/>${hl(24, 25, 7, 2.6, -15, 0.45)}`,
    eggs: (c, x, G) => `<ellipse cx="19" cy="29" rx="8" ry="10.5" fill="${G.r('#FBF3E2')}"/><ellipse cx="32" cy="26" rx="8" ry="10.5" fill="${G.r('#EBCB9B')}"/>
      <ellipse cx="45" cy="29" rx="8" ry="10.5" fill="${G.r('#FBF3E2')}"/>${hl(16, 24, 2.6, 4, 15, 0.7)}${hl(29, 21, 2.6, 4, 15, 0.7)}${hl(42, 24, 2.6, 4, 15, 0.7)}
      <path d="M7 38h50l-4 16H11z" fill="${G.v('#C9AE86')}"/><path d="M11 43h42" stroke="#9C8359" stroke-width="2" opacity=".55"/>`,
    tub: (c, x, G) => `<path d="M15 26h34l-4 28H19z" fill="${G.l(c)}"/>
      <ellipse cx="32" cy="22" rx="19" ry="5.5" fill="${G.r(x || sh(c, -0.35))}"/><rect x="13" y="22" width="38" height="5" fill="${G.l(x || sh(c, -0.35))}"/>
      <ellipse cx="32" cy="27" rx="19" ry="3" fill="${sh(x || sh(c, -0.35), -0.2)}"/>
      <rect x="21" y="35" width="22" height="11" rx="5.5" fill="#fff" opacity=".92"/><circle cx="32" cy="40.5" r="3.2" fill="${x || sh(c, -0.35)}"/>${hl(20, 36, 1.6, 9, 4, 0.45)}`,
    block: (c, x, G) => `<path d="M9 29l9-10h32l-9 10z" fill="${sh(c, 0.4)}"/><rect x="9" y="29" width="32" height="23" rx="2" fill="${G.v(c)}"/>
      <path d="M41 29l9-10v23l-9 10z" fill="${sh(c, -0.22)}"/>
      ${dot(17, 37, 2, sh(c, -0.2))}${dot(28, 44, 2, sh(c, -0.2))}${dot(34, 35, 1.6, sh(c, -0.2))}${dot(21, 47, 1.4, sh(c, -0.2))}${hl(18, 33, 5, 1.6, 0, 0.45)}`,
    carton: (c, x, G) => `<path d="M18 24l14-9 14 9z" fill="${sh(c, -0.25)}"/><path d="M32 15l14 9v30L32 50z" fill="${sh(c, -0.3)}"/>
      <rect x="18" y="24" width="28" height="30" rx="2" fill="${G.l(c)}" opacity="0"/><path d="M18 24h28v30H18z" fill="${G.l(c)}"/>
      <rect x="22" y="32" width="20" height="13" rx="6.5" fill="#fff" opacity=".9"/><circle cx="32" cy="38.5" r="3.4" fill="${sh(c, -0.3)}"/>${hl(21, 40, 1.6, 9, 0, 0.35)}`,
    tomato: (c, x, G) => `<circle cx="32" cy="36" r="18" fill="${G.r(c)}"/>
      <path d="M32 19l-7 7 7-2.5 7 2.5z" fill="${G.r('#3F8F4F')}"/><path d="M32 19v-6" stroke="#3F8F4F" stroke-width="3.2" stroke-linecap="round"/>${hl(24, 31, 6, 3.4, -35, 0.55)}`,
    cherry: (c, x, G) => `<circle cx="21" cy="41" r="10.5" fill="${G.r(c)}"/><circle cx="43" cy="41" r="10.5" fill="${G.r(c)}"/><circle cx="32" cy="27" r="10.5" fill="${G.r(c)}"/>
      <path d="M32 16l-3.5 6.5 3.5-1.8 3.5 1.8z" fill="#3F8F4F"/><path d="M22 31l-1 4M42 31l1 4" stroke="#3F8F4F" stroke-width="2.4" stroke-linecap="round"/>
      ${hl(27, 23, 3.4, 2.2, -35, 0.6)}${hl(16, 37, 3.4, 2.2, -35, 0.6)}${hl(38, 37, 3.4, 2.2, -35, 0.6)}`,
    cucumber: (c, x, G) => `<rect x="7" y="25" width="50" height="16" rx="8" transform="rotate(-24 32 33)" fill="${G.v(c)}"/>
      ${dot(20, 38, 1.5, sh(c, -0.3))}${dot(30, 34, 1.5, sh(c, -0.3))}${dot(40, 28, 1.5, sh(c, -0.3))}${dot(27, 42, 1.3, sh(c, -0.3))}${dot(46, 33, 1.3, sh(c, -0.3))}
      <path d="M13 31c8-5 20-9 36-9" stroke="#fff" stroke-width="2.6" stroke-linecap="round" fill="none" opacity=".4" transform="translate(-1 3)"/>`,
    pepper: (c, x, G) => `<path d="M18 28c0-8 6-10 14-8 8-2 14 0 14 8 2 14-3 26-14 26S16 42 18 28z" fill="${G.r(c)}"/>
      <path d="M32 21v-7" stroke="#3F8F4F" stroke-width="4.4" stroke-linecap="round"/><path d="M26 29c-1 6 0 12 3 17" stroke="#fff" stroke-width="2.8" fill="none" stroke-linecap="round" opacity=".4"/>
      <path d="M32 20c-2 10-2 24 0 34M38 24c3 8 3 18-1 28" stroke="${sh(c, -0.35)}" stroke-width="1.8" fill="none" opacity=".45"/>`,
    onion: (c, x, G) => `<path d="M32 11c2 8 16 11 16 27 0 10-7 15-16 15S16 48 16 38c0-16 14-19 16-27z" fill="${G.r(c)}"/>
      <path d="M32 17c-4 11-8 20-8 32M32 17c4 11 8 20 8 32M32 17v34" stroke="${sh(c, 0.45)}" stroke-width="2" fill="none" stroke-linecap="round" opacity=".7"/>
      <path d="M28 53l-1 5M36 53l1 5M32 53v5" stroke="#B8946A" stroke-width="2" stroke-linecap="round"/>${hl(24, 34, 3, 8, 12, 0.35)}`,
    potato: (c, x, G) => `<ellipse cx="32" cy="36" rx="22" ry="16" fill="${G.r(c)}" transform="rotate(-12 32 36)"/>
      ${dot(22, 35, 1.9, sh(c, -0.35))}${dot(34, 42, 1.9, sh(c, -0.35))}${dot(43, 31, 1.9, sh(c, -0.35))}${dot(28, 29, 1.6, sh(c, -0.35))}${dot(40, 38, 1.4, sh(c, -0.35))}${hl(23, 28, 8, 3, -22, 0.4)}`,
    carrot: (c, x, G) => `<g transform="rotate(35 32 34)"><path d="M24 22h16l-5.5 33c-.7 2.5-3.3 2.5-4 0z" fill="${G.l(c)}"/>
      <path d="M26 31h5M34 39h5M28 47h4" stroke="${sh(c, -0.3)}" stroke-width="2" stroke-linecap="round"/>
      <ellipse cx="27" cy="15" rx="3.2" ry="8" fill="${G.v('#4C9A5B')}"/><ellipse cx="32" cy="12" rx="3.2" ry="9" fill="${G.v('#3F8F4F')}"/><ellipse cx="37" cy="15" rx="3.2" ry="8" fill="${G.v('#4C9A5B')}"/></g>`,
    broccoli: (c, x, G) => `<path d="M26 38h12l3 17H23z" fill="${G.l('#9CC878')}"/>
      <circle cx="20" cy="31" r="10.5" fill="${G.r(c)}"/><circle cx="44" cy="31" r="10.5" fill="${G.r(c)}"/><circle cx="32" cy="22" r="11.5" fill="${G.r(c)}"/><circle cx="32" cy="33" r="10.5" fill="${G.r(c)}"/>
      ${dot(29, 20, 1.8, sh(c, 0.45))}${dot(21, 29, 1.8, sh(c, 0.45))}${dot(43, 29, 1.8, sh(c, 0.45))}${dot(33, 32, 1.8, sh(c, 0.45))}${dot(36, 26, 1.4, sh(c, -0.3))}${dot(26, 35, 1.4, sh(c, -0.3))}`,
    mushroom: (c, x, G) => `<rect x="25" y="32" width="14" height="21" rx="6" fill="${G.l('#F1E4D3')}"/><path d="M8 37c0-14 11-21 24-21s24 7 24 21z" fill="${G.r(c)}"/>
      ${dot(23, 29, 2.4, sh(c, 0.5))}${dot(37, 25, 2.4, sh(c, 0.5))}${dot(44, 32, 2, sh(c, 0.5))}<path d="M10 37h44" stroke="${sh(c, -0.3)}" stroke-width="2" opacity=".5"/>${hl(22, 24, 7, 2.6, -25, 0.4)}`,
    leafy: (c, x, G) => `<path d="M32 54C16 50 9 34 13 17c15 2 23 14 19 37z" fill="${G.v(c)}"/><path d="M32 54C48 50 55 34 51 17 36 19 28 31 32 54z" fill="${G.v(sh(c, -0.16))}"/>
      <path d="M32 54C23 42 29 26 32 12c7 13 9 27 0 42z" fill="${G.v(sh(c, 0.2))}"/><path d="M32 52V22M32 40l-8-8M32 40l8-8M32 32l-6-7M32 32l6-7" stroke="${sh(c, 0.6)}" stroke-width="1.8" stroke-linecap="round" opacity=".75"/>`,
    avocado: (c, x, G) => `<path d="M32 10c7 0 9 9 12 16 3 8 7 11 7 18 0 9-8 13-19 13S13 53 13 44c0-7 4-10 7-18 3-7 5-16 12-16z" fill="${G.r(c)}"/>
      <path d="M32 17c6 0 7 8 9 13 2 6 6 8 6 14 0 7-6 10-15 10s-15-3-15-10c0-6 4-8 6-14 2-5 3-13 9-13z" fill="${G.r('#C9DB7A')}"/>
      <circle cx="32" cy="42" r="8" fill="${G.r('#9A6A42')}"/>${hl(29, 39, 2.4, 3.6, 20, 0.5)}`,
    banana: (c, x, G) => `<path d="M10 20c0 19 13 33 36 31 5-.4 7-5 3-7-15 0-22-9-22-19 0-5-7-8-17-5z" fill="${G.v(c)}"/>
      <path d="M10 20c4-2 9-3 13-1" stroke="#6B4E1E" stroke-width="3.4" stroke-linecap="round" fill="none"/>
      <path d="M16 28c2 10 10 16 21 18" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".45"/><path d="M45 50c3 0 5-1 6-3" stroke="#6B4E1E" stroke-width="3" stroke-linecap="round" fill="none"/>`,
    beans: (c, x, G) => `<path d="M9 23c14-6 28 0 40 14" stroke="${sh(c, -0.3)}" stroke-width="8" fill="none" stroke-linecap="round" transform="translate(0 1.5)"/>
      <path d="M9 23c14-6 28 0 40 14" stroke="${c}" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M11 21c13-5 25 0 36 12" stroke="${sh(c, 0.5)}" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".7"/>
      <path d="M7 37c14-6 28-2 42 12" stroke="${sh(c, -0.3)}" stroke-width="8" fill="none" stroke-linecap="round" transform="translate(0 1.5)"/><path d="M7 37c14-6 28-2 42 12" stroke="${sh(c, -0.1)}" stroke-width="7" fill="none" stroke-linecap="round"/>
      <path d="M15 13c12-3 24 2 36 14" stroke="${sh(c, -0.3)}" stroke-width="8" fill="none" stroke-linecap="round" transform="translate(0 1.5)"/><path d="M15 13c12-3 24 2 36 14" stroke="${sh(c, 0.12)}" stroke-width="7" fill="none" stroke-linecap="round"/>`,
    leek: (c, x, G) => `<rect x="25" y="28" width="14" height="27" rx="6" fill="${G.l('#F3F7E8')}"/><path d="M25 41h14" stroke="#CFDDB4" stroke-width="2"/>
      <path d="M32 31C18 27 16 14 19 8c10 2 13 11 13 23zM32 31c14-4 16-17 13-23-10 2-13 11-13 23z" fill="${G.v(c)}"/><path d="M32 31C30 21 26 15 21 11" stroke="${sh(c, 0.5)}" stroke-width="1.6" fill="none" opacity=".7"/>`,
    pumpkin: (c, x, G) => `<ellipse cx="32" cy="38" rx="22" ry="16" fill="${G.r(sh(c, -0.18))}"/><ellipse cx="21" cy="38" rx="10" ry="16" fill="${G.r(c)}"/>
      <ellipse cx="43" cy="38" rx="10" ry="16" fill="${G.r(c)}"/><ellipse cx="32" cy="38" rx="8" ry="16" fill="${G.r(sh(c, 0.05))}"/>
      <path d="M32 23c0-5 2-9 7-10" stroke="#5C7D3A" stroke-width="4.4" stroke-linecap="round" fill="none"/>${hl(24, 30, 4, 5, 15, 0.4)}`,
    lemon: (c, x, G) => `<ellipse cx="32" cy="34" rx="22" ry="16" fill="${G.r(c)}" transform="rotate(-20 32 34)"/>
      <circle cx="11" cy="43" r="3.6" fill="${G.r(c)}"/><circle cx="53" cy="25" r="3.6" fill="${G.r(c)}"/>
      ${dot(25, 38, 0.9, sh(c, -0.3))}${dot(33, 41, 0.9, sh(c, -0.3))}${dot(40, 31, 0.9, sh(c, -0.3))}${dot(30, 30, 0.9, sh(c, -0.3))}${hl(24, 28, 8, 3, -28, 0.5)}
      <path d="M44 14c5-1 8 1 9 5-5 1-9-1-9-5z" fill="${G.v('#4C9A5B')}"/>`,
    herbs: (c, x, G) => `<path d="M32 55V26M32 45c-6-3-9-8-10-14M32 38c6-3 9-8 10-14M32 30c-4-3-5-8-5-12M32 30c4-3 5-8 5-12" stroke="#4E8040" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      <circle cx="22" cy="28" r="6" fill="${G.r(c)}"/><circle cx="42" cy="22" r="6" fill="${G.r(c)}"/><circle cx="27" cy="16" r="5.4" fill="${G.r(c)}"/><circle cx="37" cy="16" r="5.4" fill="${G.r(c)}"/>
      <circle cx="32" cy="22" r="6.4" fill="${G.r(c)}"/><circle cx="24" cy="40" r="5" fill="${G.r(c)}"/><circle cx="40" cy="38" r="5" fill="${G.r(c)}"/><path d="M26 55h12" stroke="#B8946A" stroke-width="3.2" stroke-linecap="round"/>`,
    ginger: (c, x, G) => `<ellipse cx="30" cy="39" rx="18" ry="10" fill="${G.r(c)}" transform="rotate(-10 30 39)"/><ellipse cx="47" cy="30" rx="7.5" ry="5.5" fill="${G.r(c)}" transform="rotate(-30 47 30)"/>
      <ellipse cx="17" cy="29" rx="6.5" ry="5" fill="${G.r(c)}" transform="rotate(20 17 29)"/><ellipse cx="30" cy="25" rx="6.5" ry="5" fill="${G.r(c)}"/>
      <path d="M22 40h16M26 33h10" stroke="${sh(c, -0.32)}" stroke-width="1.8" stroke-linecap="round" opacity=".7"/>${hl(22, 36, 6, 2.2, -10, 0.4)}`,
    bread: (c, x, G) => `<path d="M8 34c0-11 11-17 24-17s24 6 24 17c0 4-2 6-5 6v13H13V40c-3 0-5-2-5-6z" fill="${G.v(c)}"/>
      <path d="M13 40h38" stroke="${sh(c, -0.35)}" stroke-width="2" opacity=".4"/><path d="M21 26l4 9M32 24l4 9M44 27l3 8" stroke="${sh(c, 0.55)}" stroke-width="3" stroke-linecap="round"/>${hl(20, 24, 8, 2.6, -15, 0.4)}`,
    tortillas: (c, x, G) => `<ellipse cx="32" cy="46" rx="24" ry="9" fill="${sh(c, -0.3)}"/><ellipse cx="32" cy="42" rx="24" ry="9" fill="${G.v(sh(c, -0.12))}"/>
      <ellipse cx="32" cy="37" rx="24" ry="9" fill="${sh(c, -0.25)}"/><ellipse cx="32" cy="33" rx="24" ry="9" fill="${G.r(c)}"/>
      ${dot(24, 32, 1.7, sh(c, -0.28))}${dot(34, 35, 1.7, sh(c, -0.28))}${dot(43, 31, 1.7, sh(c, -0.28))}${hl(23, 30, 8, 2, -5, 0.35)}`,
    bottle: (c, x, G) => `<rect x="26.5" y="8" width="11" height="8" rx="2.4" fill="${G.l(x || '#475569')}"/><path d="M28 16h8v8c6 3 10 7 10 13v14c0 3-2 5-5 5H23c-3 0-5-2-5-5V37c0-6 4-10 10-13z" fill="${G.l(c)}"/>
      <rect x="22" y="36" width="20" height="13" rx="3.2" fill="#fff" opacity=".92"/><circle cx="32" cy="42.5" r="3.4" fill="${sh(c, -0.25)}"/><path d="M23 38c0 5 0 10 1 13" stroke="#fff" stroke-width="2.2" stroke-linecap="round" opacity=".5"/>`,
    jar: (c, x, G) => `<rect x="13" y="13" width="38" height="10" rx="3.4" fill="${G.l(x || '#475569')}"/><path d="M16 23h32l2 4v23c0 3-2 5-5 5H19c-3 0-5-2-5-5V27z" fill="${G.l(sh(c, 0.3))}"/>
      <path d="M16 38h32l2 1v11c0 3-2 5-5 5H19c-3 0-5-2-5-5V39z" fill="${G.l(c)}"/><rect x="20" y="29" width="24" height="14" rx="3.2" fill="#fff" opacity=".95"/><circle cx="32" cy="36" r="3.6" fill="${c}"/>
      <path d="M18 27c-1 8-1 16 0 22" stroke="#fff" stroke-width="2.2" stroke-linecap="round" opacity=".45"/>`,
    bag: (c, grain, G) => `<path d="M16 15h32l5 9-3 30H14l-3-30z" fill="${G.l(c)}"/><path d="M16 15h32l3 5H13z" fill="${sh(c, -0.4)}"/>
      <path d="M14 24h36" stroke="${sh(c, -0.35)}" stroke-width="1.6" opacity=".5"/><rect x="19" y="29" width="26" height="17" rx="4" fill="#fff" opacity=".94"/>
      <ellipse cx="27" cy="37" rx="2.2" ry="3.2" fill="${grain}" transform="rotate(25 27 37)"/><ellipse cx="33" cy="35" rx="2.2" ry="3.2" fill="${grain}" transform="rotate(-20 33 35)"/>
      <ellipse cx="39" cy="39" rx="2.2" ry="3.2" fill="${grain}" transform="rotate(30 39 39)"/><ellipse cx="31" cy="41" rx="2.2" ry="3.2" fill="${grain}"/>`,
    can: (c, x, G) => `<path d="M15 17v31c0 3.5 7.5 6.5 17 6.5s17-3 17-6.5V17z" fill="${G.l(c)}"/>
      <path d="M15 29v13c0 3.5 7.5 6.5 17 6.5s17-3 17-6.5V29c0 3.5-7.5 6.5-17 6.5S15 32.5 15 29z" fill="${x || '#fff'}" opacity=".94"/>
      <ellipse cx="32" cy="17" rx="17" ry="5.6" fill="${G.r('#E2E8F0')}"/><ellipse cx="32" cy="17" rx="12" ry="3.4" fill="#CBD5E1" opacity=".7"/><circle cx="32" cy="39" r="4.2" fill="${c}"/>
      <path d="M19 22v26" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".4"/>`,
    box: (c, x, G) => `<path d="M12 11l5-3h32l-5 3z" fill="${sh(c, 0.35)}"/><path d="M48 11l5-3v43l-5 4z" fill="${sh(c, -0.36)}"/><rect x="12" y="11" width="36" height="44" rx="3" fill="${G.l(c)}"/>
      <rect x="18" y="19" width="24" height="22" rx="3" fill="#FFF7E6"/><path d="M21 25c3-3 6 3 9 0s6 3 9 0M21 31c3-3 6 3 9 0s6 3 9 0M21 37c3-3 6 3 9 0s6 3 9 0" stroke="#D9A94A" stroke-width="2.2" fill="none" stroke-linecap="round"/>
      <rect x="18" y="45" width="24" height="4" rx="2" fill="${sh(c, 0.5)}"/>`,
    pea: (c, x, G) => `<path d="M7 39c4-17 23-25 48-21-2 23-21 35-42 27-4-2-6-4-6-6z" fill="${G.v(c)}"/><path d="M10 38c6-12 20-19 38-17" stroke="${sh(c, 0.5)}" stroke-width="2" fill="none" stroke-linecap="round" opacity=".6"/>
      <circle cx="21" cy="37" r="5.8" fill="${G.r(sh(c, 0.12))}"/><circle cx="32" cy="33" r="5.8" fill="${G.r(sh(c, 0.12))}"/><circle cx="43" cy="29" r="5.8" fill="${G.r(sh(c, 0.12))}"/>${hl(19, 35, 1.8, 1.2, -30, 0.7)}${hl(30, 31, 1.8, 1.2, -30, 0.7)}${hl(41, 27, 1.8, 1.2, -30, 0.7)}`,
    spices: (c, x, G) => `<rect x="8" y="26" width="15" height="27" rx="4.4" fill="${G.l(c)}"/><rect x="25" y="19" width="15" height="34" rx="4.4" fill="${G.l('#C0562F')}"/><rect x="42" y="28" width="15" height="25" rx="4.4" fill="${G.l('#E8B64A')}"/>
      <rect x="8" y="22" width="15" height="6.5" rx="2.4" fill="${G.l('#475569')}"/><rect x="25" y="15" width="15" height="6.5" rx="2.4" fill="${G.l('#475569')}"/><rect x="42" y="24" width="15" height="6.5" rx="2.4" fill="${G.l('#475569')}"/>
      <circle cx="15.5" cy="40" r="3.4" fill="#fff" opacity=".9"/><circle cx="32.5" cy="38" r="3.4" fill="#fff" opacity=".9"/><circle cx="49.5" cy="42" r="3.4" fill="#fff" opacity=".9"/>`
  };

  // background tints per department
  const BG = { meat: ['#FFF3EC', '#F9DCCB'], fish: ['#EEF6FC', '#D5E6F3'], dairy: ['#F4F7FC', '#DEE6F3'], veg: ['#EEF9F1', '#D3EDDA'], bread: ['#FFF7E6', '#F5E2B8'], pantry: ['#FFF7E8', '#F8E5C0'], can: ['#F3F6FA', '#DDE4EC'] };

  // productId -> [template, colour, extra colour / grain, background]
  const ART = {
    'chicken-breast': ['breast', '#F0B38A', 0, 'meat'], 'chicken-thighs': ['drumstick', '#E09660', 0, 'meat'],
    'turkey': ['breast', '#EFBBA3', 0, 'meat'], 'ground-turkey': ['ground', '#EBB49A', 0, 'meat'],
    'ground-beef': ['ground', '#C65D55', 0, 'meat'], 'beef-strips': ['steak', '#B5483F', 0, 'meat'], 'entrecote': ['steak', '#C4504A', 0, 'meat'],
    'salmon': ['fish', '#F58F7C', 0, 'fish'], 'frozen-fish': ['fish', '#B7C7D8', 0, 'fish'], 'tilapia': ['fish', '#C4D3E2', 0, 'fish'],
    'eggs': ['eggs', 0, 0, 'bread'],
    'cottage': ['tub', '#F4F6FA', '#2F6FB3', 'dairy'], 'greek-yogurt': ['tub', '#E3F0FB', '#1D4F91', 'dairy'],
    'feta': ['block', '#F3F4EE', 0, 'dairy'], 'tofu': ['block', '#F1E7C9', 0, 'dairy'], 'soy-milk': ['carton', '#EAF3E4', 0, 'dairy'],
    'tomatoes': ['tomato', '#E5483D', 0, 'veg'], 'cherry-tomatoes': ['cherry', '#E5483D', 0, 'veg'], 'cucumbers': ['cucumber', '#5BA45F', 0, 'veg'],
    'zucchini': ['cucumber', '#76A94A', 0, 'veg'], 'peppers': ['pepper', '#DD3B33', 0, 'veg'], 'onion': ['onion', '#E4A04F', 0, 'veg'],
    'potatoes': ['potato', '#D9B77A', 0, 'veg'], 'sweet-potato': ['potato', '#C9703F', 0, 'veg'], 'carrots': ['carrot', '#F08A24', 0, 'veg'],
    'broccoli': ['broccoli', '#4E9D55', 0, 'veg'], 'mushrooms': ['mushroom', '#C9A57E', 0, 'veg'], 'leafy': ['leafy', '#6DB36A', 0, 'veg'],
    'spinach': ['leafy', '#3E8F52', 0, 'veg'], 'avocado': ['avocado', '#3F7D3A', 0, 'veg'], 'banana': ['banana', '#F2C94C', 0, 'veg'],
    'green-beans': ['beans', '#5FA85A', 0, 'veg'], 'leek': ['leek', '#5FA85A', 0, 'veg'], 'pumpkin': ['pumpkin', '#EE8B2B', 0, 'veg'],
    'lemons': ['lemon', '#F4D03F', 0, 'veg'], 'herbs': ['herbs', '#58A75B', 0, 'veg'], 'ginger': ['ginger', '#D6B27A', 0, 'veg'],
    'bread': ['bread', '#D9A55C', 0, 'bread'], 'tortillas': ['tortillas', '#EBD3A2', 0, 'bread'],
    'olive-oil': ['bottle', '#8DA83A', '#2F6B3A', 'pantry'], 'sesame-oil': ['bottle', '#C98B2E', '#7A4A12', 'pantry'],
    'soy-sauce': ['bottle', '#5B3B2E', '#B91C1C', 'pantry'], 'teriyaki': ['bottle', '#8A4B2A', '#B91C1C', 'pantry'],
    'spices': ['spices', '#6C8E3A', 0, 'pantry'],
    'tahini': ['jar', '#D8B77A', '#475569', 'pantry'], 'peanut-butter': ['jar', '#C58A4B', '#B91C1C', 'pantry'], 'olives': ['jar', '#6B8E3A', '#475569', 'pantry'],
    'rice-basmati': ['bag', '#E9D9B5', '#C9B27A', 'pantry'], 'rice-brown': ['bag', '#C9A06A', '#7A5A2E', 'pantry'], 'quinoa': ['bag', '#C75B52', '#E8C27A', 'pantry'],
    'bulgur': ['bag', '#D9A55C', '#8C5A22', 'pantry'], 'ptitim': ['bag', '#F0C86A', '#C9953A', 'pantry'], 'oats': ['bag', '#B9C7A0', '#E8D9A8', 'pantry'],
    'lentils': ['bag', '#5E8F4A', '#7A5A2E', 'pantry'], 'red-lentils': ['bag', '#D9573D', '#F0A24A', 'pantry'],
    'frozen-peas': ['pea', '#5FA85A', 0, 'veg'],
    'black-beans': ['can', '#3B4A5A', '#F4EBDD', 'can'], 'chickpeas': ['can', '#C9A25A', '#FFFFFF', 'can'],
    'crushed-tomatoes': ['can', '#D63D33', '#FFFFFF', 'can'], 'tuna': ['can', '#2F6FB3', '#FFFFFF', 'can'],
    'egg-noodles': ['box', '#E3A73A', 0, 'pantry'], 'rice-noodles': ['box', '#5B8DB8', 0, 'pantry']
  };

  window.ShelfSenseArt = {
    ART,
    has: (id) => !!ART[id],
    /** SVG tile (decorative: the product name is always rendered next to it) */
    html(id, size) {
      const a = ART[id];
      const px = size || 56;
      if (!a) return `<span class="material-symbols-outlined" style="font-size:${Math.round(px * 0.55)}px;color:#94A3B8" aria-hidden="true">shopping_basket</span>`;
      const G = makeG();
      const art = T[a[0]](a[1], a[2], G);
      const bg = BG[a[3]] || ['#F8FAFC', '#E2E8F0'];
      const bgId = G.v === undefined ? '' : 'sa' + uidCounter + 'bg';
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${px}" height="${px}" aria-hidden="true" focusable="false">` +
        `<defs><linearGradient id="${bgId}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${bg[0]}"/><stop offset="1" stop-color="${bg[1]}"/></linearGradient>${G.defs.join('')}</defs>` +
        `<rect width="64" height="64" rx="14" fill="url(#${bgId})"/>${SHADOW}${art}</svg>`;
    }
  };
})();
