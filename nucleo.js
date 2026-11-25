// Núcleo de la demo de Cuadra · Rentals. Sin backend: todo sale de datos.js y se guarda en el navegador.
// Cada sección vive en secciones/<id>.js y se registra en window.CUADRA:
//   C.V[id] = (param) => html del cuerpo · C.cab[id] = (param) => botones del encabezado (opcional)
//   C.acciones[nombre] = (dataset, boton) · C.formularios[idForm] = (FormData, form) · C.cambios[clave] = (input)
// Las piezas visuales (C.fila, C.panel, C.kpis, C.placa…) están abajo: usarlas siempre, no armar HTML suelto.
(function () {
  const D = window.DATOS;
  const CLAVE = 'cuadra-rentals-demo-v3';
  const C = window.CUADRA = { D, V: {}, cab: {}, acciones: {}, formularios: {}, cambios: {} };
  const $ = C.$ = (s, el = document) => el.querySelector(s);
  const esc = C.esc = (t) => String(t == null ? '' : t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  C.plata = (n) => (n < 0 ? '− ' : '') + '$ ' + Math.round(Math.abs(n)).toLocaleString('es-AR');
  C.ahora = () => new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });
  const copia = C.copia = (o) => JSON.parse(JSON.stringify(o));
  C.primerNombre = (n) => String(n).split(' ')[0];
  C.numero = (txt) => parseInt(String(txt).replace(/\D/g, ''), 10) || 0;
  const norm = C.norm = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

  // ---------- Estado (se guarda en el navegador) ----------
  const inicial = () => ({
    rol: 'Administración', ui: {},
    equipos: copia(D.equipos), reservas: copia(D.reservas), grupos: copia(D.grupos), espera: copia(D.espera), taller: copia(D.taller),
    tallerHoy: copia(D.tallerHoy), garantias: copia(D.garantias), movimientos: copia(D.caja.movimientos), comprobantes: copia(D.caja.comprobantes),
    personal: copia(D.personal), pedidosDia: copia(D.pedidosDia), transfers: copia(D.transfers), integraciones: copia(D.integraciones), contado: null
  });
  let S;
  try { S = Object.assign(inicial(), JSON.parse(localStorage.getItem(CLAVE)) || {}); } catch (e) { S = inicial(); }
  C.S = S;
  // Tamaño del plan solo por enlace (…?plan=chica|mediana); sin nada, se ve todo
  const NIVEL = { chica: 1, mediana: 2, grande: 3 };
  const plan = (location.search.match(/[?&]plan=(chica|mediana|grande)\b/) || [])[1] || 'grande';
  C.nivel = () => NIVEL[plan];
  const guardar = C.guardar = () => { try { localStorage.setItem(CLAVE, JSON.stringify(S)); } catch (e) { /* sin almacenamiento: la demo sigue igual */ } };

  // ---------- Íconos (trazo fino, 24 px) ----------
  const ICONOS = {
    inicio: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M10 21v-6h4v6"/>',
    reservas: '<rect x="3" y="4.5" width="18" height="16.5" rx="2"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/>',
    stock: '<path d="m12 2.5 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5"/><path d="m3 16.5 9 5 9-5"/>',
    taller: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
    garantias: '<path d="M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6l-8-3Z"/><path d="m9 12 2 2 4-4"/>',
    caja: '<path d="M3 7a2 2 0 0 1 2-2h13v4"/><path d="M3 7v11a2 2 0 0 0 2 2h15V9H5a2 2 0 0 1-2-2Z"/><circle cx="16" cy="14.5" r="1.2"/>',
    clientes: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.5a6.5 6.5 0 0 1 3.5 5.5"/>',
    equipo: '<rect x="4" y="3" width="16" height="18" rx="2"/><circle cx="12" cy="10" r="3"/><path d="M8 17a4 4 0 0 1 8 0"/>',
    integraciones: '<path d="M9 2v5M15 2v5"/><path d="M6 7h12v4a6 6 0 0 1-12 0V7Z"/><path d="M12 17v5"/>',
    configuracion: '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
    buscar: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    escanear: '<path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3"/><path d="M7 12h10"/>',
    flecha: '<path d="m9 6 6 6-6 6"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    alerta: '<path d="M12 3.5 2.5 20h19L12 3.5Z"/><path d="M12 10v4.5M12 17.5v.01"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8v.01"/>',
    mas: '<path d="M12 5v14M5 12h14"/>',
    cerrar: '<path d="M6 6l12 12M18 6 6 18"/>',
    bajar: '<path d="M12 4v11M7 10.5l5 5 5-5M5 20h14"/>',
    audio: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/>',
    combi: '<rect x="3" y="5" width="18" height="12" rx="2"/><path d="M3 11h18M7 17v2M17 17v2"/>',
    reloj: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    firma: '<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4Z"/>',
    puntos: '<circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/>',
    // Artículos de la reserva
    esqui: '<path d="M3 18 15.5 5.5c1.2-1.2 3-1.4 4-.5"/><path d="M6.5 21.5 19 9c1.2-1.2 3-1.4 4-.5"/><path d="m8 13 2 2M11.5 16.5l2 2"/>',
    snowboard: '<path d="M3.8 17.4 17.4 3.8a2.2 2.2 0 0 1 3.1 3.1L6.9 20.5a2.2 2.2 0 0 1-3.1-3.1Z"/><path d="M7.5 14.5h3M12.5 9.5h3"/>',
    botas: '<path d="M7 3h6l1 6 4.5 3.5V18H5V9.5Z"/><path d="M4 21h16M7 7h5.5M5 14.5h13.5"/>',
    casco: '<path d="M3.5 16a8.5 8.5 0 0 1 17 0v1.5h-17Z"/><path d="M10 7.8c1.4 2.4 1.4 5.3.2 8.2"/>',
    antiparras: '<rect x="3" y="8" width="18" height="8" rx="4"/><path d="M10.5 16 12 14.5l1.5 1.5M3 12H1.5M21 12h1.5"/>',
    guantes: '<path d="M7.5 21v-3L5 13.5V8a1.5 1.5 0 0 1 3 0V5a1.5 1.5 0 0 1 3 0v-.5a1.5 1.5 0 0 1 3 0V6a1.5 1.5 0 0 1 3 0v7.5L15 18v3"/><path d="M7.5 18H15"/>',
    bastones: '<path d="M8 3l3 18M16 3l-3 18M7 7.5h2M15 7.5h2"/><circle cx="10.4" cy="17.5" r="1.7"/><circle cx="13.6" cy="17.5" r="1.7"/>',
    campera: '<path d="M9 3 4 6v13h4M15 3l5 3v13h-4"/><path d="M9 3a3 3 0 0 0 6 0M8 21V11M16 21V11M8 21h8M12 6v15"/>',
    pantalon: '<path d="M6 3h12l1 18h-5l-2-11-2 11H5Z"/><path d="M6 6.5h12"/>',
    locker: '<rect x="5" y="3" width="14" height="18" rx="1.5"/><path d="M12 3v18M9.5 8v2.5M14.5 8v2.5"/>',
    clase: '<circle cx="12" cy="7" r="3.2"/><path d="M5.5 21v-2.5a6.5 6.5 0 0 1 13 0V21"/>'
  };
  const icono = C.icono = (n, px = 18) => `<svg width="${px}" height="${px}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONOS[n] || ''}</svg>`;

  // ---------- Pestañas, roles y permisos ----------
  const TABS = C.TABS = [
    { id: 'inicio', t: 'Inicio', n: 1, g: 'Operación' },
    { id: 'reservas', t: 'Reservas', n: 1, g: 'Operación' },
    { id: 'stock', t: 'Stock en vivo', corto: 'Stock', n: 1, g: 'Operación' },
    { id: 'taller', t: 'Taller', n: 1, g: 'Operación' },
    { id: 'garantias', t: 'Garantías', n: 2, g: 'Administración' },
    { id: 'caja', t: 'Caja', n: 2, g: 'Administración' },
    { id: 'clientes', t: 'Clientes', n: 2, g: 'Administración' },
    { id: 'equipo', t: 'Equipo', n: 3, g: 'Administración' },
    { id: 'integraciones', t: 'Integraciones', n: 1, g: 'Ajustes' },
    { id: 'configuracion', t: 'Configuración', corto: 'Ajustes', n: 1, g: 'Ajustes' }
  ];
  const BAJADA = {
    reservas: 'Grupos, lista de espera y reservas que llegan por la web o por audio',
    stock: 'Cada tabla por su número: libre, alquilada o en el taller, y dónde está',
    taller: 'Lo que hay que preparar para mañana y la cola de trabajos',
    garantias: 'La plata retenida de cada alquiler y lo que se rompió',
    caja: 'Lo que entró y salió hoy, y el cierre del día',
    clientes: 'De dónde vienen, qué alquilan y quiénes vuelven',
    equipo: 'Fichaje, horas y días libres',
    integraciones: 'Con qué se conecta el sistema: cobros, reservas, facturación y mensajes',
    configuracion: 'Gamas y números, tarifas y permisos de cada puesto'
  };
  const ROLES = C.ROLES = ['Administración', 'Dueño', 'Mostrador', 'Taller'];
  const VE = { Mostrador: ['inicio', 'reservas', 'stock'], Taller: ['taller', 'stock'] };
  const PERMISOS = { reservar: ['Administración', 'Dueño'], asignar: ['Administración', 'Dueño', 'Mostrador'], taller: ['Administración', 'Dueño', 'Taller'],
    caja: ['Administración', 'Dueño'], aprobar: ['Administración', 'Dueño'], configurar: ['Administración', 'Dueño'] };
  C.puede = (accion) => (PERMISOS[accion] || []).includes(S.rol);
  const visibles = C.visibles = () => TABS.filter((t) => t.n <= C.nivel() && (!VE[S.rol] || VE[S.rol].includes(t.id)) && (t.g !== 'Ajustes' || C.puede('configurar')));
  C.visible = (id) => visibles().some((t) => t.id === id);

  // ---------- Marca: los 4 cuadros de Cuadra, con el rojo de rentals ----------
  const ROJO = C.ROJO = '#E30613', NOCHE = '#0F1B3A';
  const iso = C.iso = (px, trazo, lleno, llenos) => {
    const c = [[0, 0], [55, 0], [0, 55], [55, 55]];
    return `<svg width="${px}" height="${px}" viewBox="0 0 100 100" aria-hidden="true">${c.map(([x, y], i) => llenos.includes(i)
      ? `<rect x="${x}" y="${y}" width="45" height="45" fill="${lleno}"/>`
      : `<rect x="${x + 4}" y="${y + 4}" width="37" height="37" fill="none" stroke="${trazo}" stroke-width="8"/>`).join('')}</svg>`;
  };
  const logo = (h, color) => `<svg height="${h}" viewBox="0 0 420 100" aria-label="Cuadra" role="img">${iso(100, color, ROJO, [3]).replace(/<svg[^>]*>/, '<g>').replace('</svg>', '</g>')}<text x="118" y="80" font-family="Work Sans" font-weight="700" font-size="96" fill="${color}" textLength="296" lengthAdjust="spacingAndGlyphs">cuadra</text></svg>`;
  $('#logo').innerHTML = logo(22, NOCHE);
  $('#logo-movil').innerHTML = logo(20, NOCHE);
  $('#fecha').textContent = `${D.hoy} · ${D.hora}`;

  // ---------- Piezas visuales (usarlas en todas las secciones) ----------
  const COLORES = ['#1F3F8F', '#2E6E5E', '#5B6478', '#8A5A1F', '#0F1B3A', '#6B4E9B'];
  C.avatar = (nombre, px = 32) => {
    const ini = String(nombre).split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
    const c = COLORES[[...String(nombre)].reduce((a, ch) => a + ch.charCodeAt(0), 0) % COLORES.length];
    return `<span class="avatar" style="width:${px}px;height:${px}px;background:${c}">${esc(ini)}</span>`;
  };
  // Tono: '' (neutro) | 'ok' | 'aviso' | 'alerta' | 'info'
  C.estado = (txt, tono = '') => `<span class="estado ${tono ? 't-' + tono : ''}"><i></i>${esc(txt)}</span>`;
  C.etiqueta = (txt, tono = '') => `<span class="etiqueta ${tono ? 't-' + tono : ''}">${esc(txt)}</span>`;
  // La gama se marca como las pistas: círculo verde, cuadrado azul, rombo negro
  C.marca = (gid, conNombre = true) => `<span class="marca" title="${esc(C.gama(gid).nombre)}"><i class="m m-${gid}"></i>${conNombre ? esc(C.gama(gid).nombre) : ''}</span>`;
  // Placa con el número de la tabla y la marca de su gama
  C.placa = (n, grande = false) => { const g = (C.gamaDe(+n) || D.gamas[0]).id; return `<span class="placa ${grande ? 'grande' : ''}"><i class="m m-${g}"></i>${esc(n)}</span>`; };
  C.estadoEquipo = (e) => e.estado === 'disponible' ? C.estado('Libre', 'ok') : e.estado === 'alquilado' ? C.estado('Alquilada', 'info') : C.estado('En el taller', 'aviso');
  // Cifras en una sola tira. items: {l: etiqueta, v: valor (html), s: bajada (html), tono, href}
  C.kpis = (items) => `<div class="kpis">${items.map(({ l, v, s, tono, href }) => `<${href ? `a href="${href}"` : 'div'} class="kpi ${tono ? 't-' + tono : ''}"><span class="l">${esc(l)}</span><span class="v">${v}</span>${s ? `<span class="s">${s}</span>` : ''}</${href ? 'a' : 'div'}>`).join('')}</div>`;
  // Panel blanco con título; cuerpo en html. sinPad = para listas de filas que van de borde a borde
  C.panel = ({ titulo = '', sub = '', acciones = '', cuerpo = '', sinPad = false, id = '' }) => `<section class="panel"${id ? ` id="${esc(id)}"` : ''}>${titulo || acciones ? `<div class="panel-cab"><h2>${esc(titulo)}${sub ? `<span class="sub">${sub}</span>` : ''}</h2><div class="panel-acc">${acciones}</div></div>` : ''}<div class="panel-cuerpo${sinPad ? ' sin-pad' : ''}">${cuerpo}</div></section>`;
  // Fila de lista: lead (placa/avatar/ícono) · título y meta · lado (estado o monto) · acciones. Todo html salvo href.
  C.fila = ({ lead = '', titulo = '', meta = '', lado = '', acc = '', href = '', cls = '' }) => {
    const abre = href ? `<a class="fila ${cls}" href="${esc(href)}">` : `<div class="fila ${cls}">`;
    return `${abre}${lead ? `<div class="lead">${lead}</div>` : ''}<div class="txt"><div class="t">${titulo}</div>${meta ? `<div class="meta">${meta}</div>` : ''}</div>${lado ? `<div class="lado">${lado}</div>` : ''}${acc ? `<div class="acc">${acc}</div>` : ''}${href ? `<span class="ir">${icono('flecha', 16)}</span></a>` : '</div>'}`;
  };
  // Botón. tipo: '' (principal, azul noche) | 'sec' | 'fan' (sin fondo) | 'urgente' (rojo, solo para lo que no puede esperar)
  C.btn = (txt, { accion = '', tipo = '', icono: ic = '', href = '', data = {}, chico = false, submit = false } = {}) => {
    const cls = `btn ${tipo} ${chico ? 'chico' : ''}`;
    const attrs = Object.entries(data).map(([k, v]) => ` data-${k}="${esc(v)}"`).join('');
    const ico = ic ? icono(ic, 16) : '';
    if (href) return `<a class="${cls}" href="${esc(href)}"${attrs}>${ico}${esc(txt)}</a>`;
    return `<button type="${submit ? 'submit' : 'button'}" class="${cls}"${accion ? ` data-accion="${esc(accion)}"` : ''}${attrs}>${ico}${esc(txt)}</button>`;
  };
  C.barra = (v, max, tono = '') => `<div class="barra-h ${tono ? 't-' + tono : ''}"><i style="width:${max ? Math.min(100, Math.round(v / max * 100)) : 0}%"></i></div>`;
  C.vacio = (txt) => `<p class="vacio">${esc(txt)}</p>`;
  C.nota = (html, tono = '', acc = '') => `<div class="nota ${tono ? 't-' + tono : ''}">${icono(tono === 'alerta' ? 'alerta' : tono === 'ok' ? 'check' : 'info', 16)}<div>${html}</div>${acc ? `<div class="acc">${acc}</div>` : ''}</div>`;
  // Subpestañas: [clave, etiqueta, cuenta?] → ruta #/<seccion>/<clave>
  C.subtabs = (seccion, actual, items) => `<nav class="subtabs" aria-label="Partes de ${esc(seccion)}">${items.map(([k, l, n]) => `<a href="#/${seccion}/${k}" class="${actual === k ? 'on' : ''}" ${actual === k ? 'aria-current="page"' : ''}>${esc(l)}${n ? `<span class="cuenta">${n}</span>` : ''}</a>`).join('')}</nav>`;
  // Control segmentado que guarda la elección en S.ui[clave]. Etiquetas en html (pueden llevar la marca de gama).
  C.segmento = (clave, actual, items) => `<div class="segmento" role="group">${items.map(([k, l]) => `<button type="button" data-accion="segmento" data-clave="${esc(clave)}" data-valor="${esc(k)}" class="${actual === k ? 'on' : ''}" aria-pressed="${actual === k}">${l}</button>`).join('')}</div>`;
  C.acciones.segmento = (d) => { S.ui[d.clave] = d.valor; guardar(); render(); };
  C.aviso = (txt) => {
    const el = $('#aviso');
    el.textContent = txt; el.classList.add('on');
    clearTimeout(C.aviso.t); C.aviso.t = setTimeout(() => el.classList.remove('on'), 2800);
  };
  C.modal = (html) => { const c = $('#capa'); c.innerHTML = `<div class="modal" role="dialog" aria-modal="true">${html}</div>`; c.classList.add('on'); const f = c.querySelector('input,select,textarea,button'); if (f) f.focus(); };
  const cerrarModal = C.cerrarModal = () => { $('#capa').classList.remove('on'); };
  $('#capa').addEventListener('click', (e) => { if (e.target.id === 'capa' || e.target.closest('[data-cerrar]')) cerrarModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') cerrarModal(); });

  // ---------- Datos y reglas del rental ----------
  C.gama = (id) => D.gamas.find((g) => g.id === id);
  C.gamaDe = (n) => D.gamas.find((g) => n >= g.desde && n <= g.hasta);
  C.equipo = (n) => S.equipos.find((e) => e.n === +n);
  C.nombreEquipo = (e) => (e ? `${e.marca} ${e.modelo} · ${e.largo} cm` : 'Sin asignar');
  C.grupo = (id) => S.grupos.find((g) => g.id === id);
  C.reserva = (id) => S.reservas.find((r) => r.id === id);
  C.reservasDe = (grupoId) => S.reservas.filter((r) => r.grupo === grupoId);
  // Persona: {nombre, tipo, gama, nivel, altura, peso, calzado, equipo, pago, contrato, fijacion, devuelto}
  C.montoPersona = (r, p) => C.gama(p.gama).tarifa * r.dias;
  // Extra: {id, nombre, precio, por: 'día' | 'una', cant}. Los «por día» se cobran por los días de la reserva
  C.montoExtra = (r, x) => x.precio * x.cant * (x.por === 'día' ? r.dias : 1);
  C.montoReserva = (r) => r.personas.reduce((s, p) => s + C.montoPersona(r, p), 0) + (r.extras || []).reduce((s, x) => s + C.montoExtra(r, x), 0);
  C.garantiaReserva = (r) => r.personas.reduce((s, p) => s + C.gama(p.gama).garantia, 0);
  C.contar = (gamaId) => {
    const lista = S.equipos.filter((e) => !gamaId || e.gama === gamaId);
    const n = (est) => lista.filter((e) => e.estado === est).length;
    return { total: lista.length, disponible: n('disponible'), alquilado: n('alquilado'), taller: n('taller') };
  };
  // Para mañana: lo que retiran mañana, más el margen, contra lo que está listo hoy
  C.paraManana = () => D.gamas.map((g) => {
    const retiran = D.agenda[1].retiran[g.id];
    const necesita = Math.ceil(retiran * (1 + D.margen));
    const c = C.contar(g.id);
    return { gama: g, retiran, necesita, listas: c.disponible, taller: c.taller, faltan: Math.max(0, necesita - c.disponible) };
  });
  // El cliente firma el contrato y el deslinde (en su celular o en la tablet)
  C.firmar = (rid, k) => { const p = C.reserva(rid).personas[k]; p.contrato = true; guardar(); };
  // Entrega una tabla a una persona. Devuelve un texto de error o '' si salió bien.
  C.asignar = (n, rid, k) => {
    const e = C.equipo(n), r = C.reserva(rid), p = r && r.personas[k];
    if (!e) return `No existe la tabla #${n}`;
    if (!p) return 'No encontré a esa persona';
    if (!p.contrato) return `${C.primerNombre(p.nombre)} todavía no firmó el contrato`;
    if (e.gama !== p.gama) return `La #${n} es ${C.gama(e.gama).nombre}: ${C.primerNombre(p.nombre)} reservó ${C.gama(p.gama).nombre}`;
    if (e.tipo !== p.tipo) return `La #${n} es ${e.tipo.toLowerCase()}: ${C.primerNombre(p.nombre)} reservó ${p.tipo.toLowerCase()}`;
    if (e.estado !== 'disponible') return `La #${n} no está libre: está ${e.estado === 'taller' ? 'en el taller' : 'alquilada'}`;
    if (p.equipo) { const vieja = C.equipo(p.equipo); if (vieja && vieja.reserva === rid) { vieja.estado = 'disponible'; vieja.reserva = null; vieja.ubic = 'Mostrador'; } }
    e.estado = 'alquilado'; e.reserva = rid; e.ubic = ''; p.equipo = e.n; p.fijacion = true; p.devuelto = false;
    guardar(); return '';
  };
  // Recibe una tabla: vuelve al stock o entra al taller con un trabajo. Si volvió todo, libera la garantía.
  C.devolver = (n, trabajo) => {
    const e = C.equipo(n); if (!e) return;
    const rid = e.reserva;
    e.reserva = null; e.cliente = ''; e.vuelve = '';
    if (trabajo) {
      const t = D.trabajos.find((x) => x[0] === trabajo) || D.trabajos[0];
      e.estado = 'taller'; e.ubic = 'Taller';
      S.taller.push({ id: 'o' + Date.now(), equipo: e.n, trabajo: t[0], min: t[1], estado: 'en_cola', quien: 'nico', entro: C.ahora(), nota: '' });
      S.tallerHoy.entraron++;
    } else { e.estado = 'disponible'; e.ubic = 'Mostrador'; }
    const r = rid && C.reserva(rid);
    if (r) {
      r.personas.forEach((p) => { if (p.equipo === e.n) p.devuelto = true; });
      if (r.personas.every((p) => !p.equipo || p.devuelto)) {
        r.estado = 'devuelta';
        const g = S.garantias.find((x) => x.reserva === rid && x.estado === 'retenida');
        if (g && !g.danio) g.estado = 'liberada';
      }
    }
    guardar();
  };
  // El taller termina un trabajo y anota dónde dejó la tabla
  C.terminarTaller = (oid, ubic) => {
    const o = S.taller.find((x) => x.id === oid); if (!o) return;
    const e = C.equipo(o.equipo);
    S.taller = S.taller.filter((x) => x !== o);
    if (e) { e.estado = 'disponible'; e.ubic = ubic || D.ubicaciones[0]; }
    S.tallerHoy.salieron++; guardar();
  };
  // Dónde anda una persona con esa tabla (para la ficha)
  C.quienTiene = (e) => {
    if (!e.reserva) return null;
    const r = C.reserva(e.reserva); if (!r) return null;
    const p = r.personas.find((x) => x.equipo === e.n);
    return { r, p, g: C.grupo(r.grupo) };
  };

  // ---------- Buscar o escanear (arriba de todo) ----------
  C.fichaTabla = (n) => {
    const e = C.equipo(n);
    if (!e) { C.aviso(`No hay ninguna tabla con el número ${n}`); return; }
    const q = C.quienTiene(e);
    const o = S.taller.find((x) => x.equipo === e.n);
    const donde = e.estado === 'alquilado'
      ? (q ? `${esc(q.p ? q.p.nombre : q.g.nombre)} · ${esc(q.g.nombre)} · vuelve el ${esc(q.r.hasta)}` : `${esc(e.cliente)} · vuelve el ${esc(e.vuelve)}`)
      : e.estado === 'taller' ? `${esc(o ? o.trabajo : 'En el taller')}${o ? ` · ${o.min} min` : ''}` : esc(e.ubic);
    const acc = [];
    if (e.estado === 'alquilado' && C.puede('asignar')) acc.push(C.btn('Recibir devolución', { accion: 'ficha-recibir', data: { n: e.n } }), C.btn('Recibir y mandar a encerar', { accion: 'ficha-recibir', tipo: 'sec', data: { n: e.n, trabajo: 'Encerar' } }));
    if (e.estado === 'disponible' && C.puede('taller')) acc.push(C.btn('Mandar al taller', { accion: 'ficha-taller', tipo: 'sec', data: { n: e.n } }));
    C.modal(`<div style="display:flex;align-items:center;gap:12px;margin-bottom:4px">${C.placa(e.n, true)}<h3 style="margin:0">${esc(e.marca)} ${esc(e.modelo)}</h3></div>
      <p class="modal-sub">${esc(e.tipo)} · ${e.largo} cm · ${C.marca(e.gama)}</p>
      <div class="lista" style="margin:0 -24px 16px;border-top:1px solid var(--linea-suave)">
        ${C.fila({ titulo: 'Estado', lado: C.estadoEquipo(e) })}
        ${C.fila({ titulo: e.estado === 'alquilado' ? 'La tiene' : e.estado === 'taller' ? 'Trabajo' : 'Dónde está', lado: `<span class="sec-txt">${donde}</span>` })}
      </div>
      <div class="acciones">${acc.join('')}${C.visible('stock') ? C.btn('Ver en el stock', { href: '#/stock', tipo: 'fan', data: { cerrar: '' } }) : ''}<button class="btn fan" data-cerrar>Cerrar</button></div>`);
  };
  C.acciones['ficha-recibir'] = (d) => { C.devolver(+d.n, d.trabajo); cerrarModal(); C.aviso(d.trabajo ? `La #${d.n} volvió y entró al taller` : `La #${d.n} volvió al stock`); render(); };
  C.acciones['ficha-taller'] = (d) => {
    const e = C.equipo(+d.n); if (!e || e.estado !== 'disponible') return;
    const t = D.trabajos[0]; e.estado = 'taller'; e.ubic = 'Taller';
    S.taller.push({ id: 'o' + Date.now(), equipo: e.n, trabajo: t[0], min: t[1], estado: 'en_cola', quien: 'nico', entro: C.ahora(), nota: '' });
    S.tallerHoy.entraron++; guardar(); cerrarModal(); C.aviso(`La #${e.n} entró al taller para encerar`); render();
  };
  C.buscar = (txt) => {
    const q = String(txt || '').trim(); if (!q) return;
    const n = (q.match(/^#?\s*(\d{3})$/) || [])[1];
    if (n) { C.fichaTabla(+n); return; }
    const t = norm(q);
    const grupos = S.grupos.filter((g) => norm(`${g.nombre} ${g.contacto}`).includes(t) || C.reservasDe(g.id).some((r) => r.personas.some((p) => norm(p.nombre).includes(t))));
    const clientes = C.visible('clientes') ? D.clientes.filter((c) => norm(c.nombre).includes(t)) : [];
    const tablas = S.equipos.filter((e) => norm(`${e.marca} ${e.modelo}`).includes(t)).slice(0, 5);
    const filas = [
      ...grupos.map((g) => C.fila({ lead: C.avatar(g.nombre, 28), titulo: esc(g.nombre), meta: `Grupo · ${esc(g.ciudad)}`, acc: C.btn('Abrir', { accion: 'abrir-grupo', tipo: 'sec', chico: true, data: { id: g.id } }) })),
      ...clientes.map((c) => C.fila({ lead: C.avatar(c.nombre, 28), titulo: esc(c.nombre), meta: `Cliente · ${esc(c.ciudad)} · ${c.visitas} visitas`, acc: C.btn('Ver', { accion: 'abrir-cliente', tipo: 'sec', chico: true, data: { nombre: c.nombre } }) })),
      ...tablas.map((e) => C.fila({ lead: C.placa(e.n), titulo: `${esc(e.marca)} ${esc(e.modelo)}`, meta: `${e.largo} cm`, lado: C.estadoEquipo(e), acc: C.btn('Ver', { accion: 'abrir-tabla', tipo: 'sec', chico: true, data: { n: e.n } }) }))
    ];
    C.modal(`<h3>Resultados para «${esc(q)}»</h3><p class="modal-sub">${filas.length ? `${filas.length} encontrados` : 'No encontré nada con eso. Probá con el número de la tabla, un grupo o un cliente.'}</p>
      <div class="lista" style="margin:0 -24px 12px">${filas.join('')}</div><div class="acciones"><button class="btn fan" data-cerrar>Cerrar</button></div>`);
  };
  C.acciones['abrir-grupo'] = (d) => { S.ui.grupoAbierto = d.id; guardar(); cerrarModal(); if (location.hash === '#/reservas/hoy') render(); else location.hash = '#/reservas/hoy'; };
  C.acciones['abrir-cliente'] = (d) => { S.ui.buscaCli = d.nombre; guardar(); cerrarModal(); if (location.hash === '#/clientes') render(); else location.hash = '#/clientes'; };
  C.acciones['abrir-tabla'] = (d) => C.fichaTabla(+d.n);
  C.acciones.escanear = () => {
    const ej = [412, 112, 716].filter((n) => C.equipo(n));
    C.modal(`<h3>Escanear etiqueta</h3><p class="modal-sub">Apuntá la cámara del celular o la tablet a la etiqueta de la tabla. En la demo, elegí una:</p>
      <div style="height:150px;border-radius:var(--r-m);background:var(--noche);display:flex;align-items:center;justify-content:center;margin-bottom:12px"><div style="width:58%;height:64px;border:2px solid rgba(255,255,255,.7);border-radius:8px;box-shadow:0 0 0 999px rgba(15,27,58,.35) inset"></div></div>
      <div class="opciones">${ej.map((n) => `<button data-accion="abrir-tabla" data-n="${n}">${C.placa(n)}<span>${esc(C.nombreEquipo(C.equipo(n)))}</span></button>`).join('')}</div>
      <div class="acciones"><button class="btn fan" data-cerrar>Cerrar</button></div>`);
  };

  // ---------- Render y navegación ----------
  function ruta() { const [, id, param] = (location.hash || '#/inicio').split('/'); return { id: id || 'inicio', param }; }
  function render() {
    let { id, param } = ruta();
    const vis = visibles();
    // si el puesto no ve esta pantalla, va a la primera suya (el taller arranca en Taller)
    if (!vis.some((t) => t.id === id)) { id = (VE[S.rol] && vis.some((t) => t.id === VE[S.rol][0])) ? VE[S.rol][0] : vis[0].id; param = undefined; }
    const tab = TABS.find((t) => t.id === id);
    document.title = tab.t + ' · Cuadra';
    $('#usuario').innerHTML = `${C.avatar(D.usuario.nombre, 30)}<span>${esc(D.usuario.nombre)}<small>${esc(D.rental)}</small></span>`;
    $('#rol').innerHTML = $('#rol-movil').innerHTML = ROLES.map((r) => `<option ${S.rol === r ? 'selected' : ''}>${r}</option>`).join('');
    const cuenta = (t) => t.id === 'reservas' ? [S.espera.length, false] : t.id === 'taller' ? [C.paraManana().reduce((s, x) => s + x.faltan, 0), true] : [0];
    let grupo = '';
    $('#nav').innerHTML = vis.map((t) => {
      const [n, alerta] = cuenta(t);
      const cab = t.g !== grupo ? `<div class="nav-grupo">${esc(t.g)}</div>` : ''; grupo = t.g;
      return `${cab}<a class="tab ${t.id === id ? 'on' : ''}" href="#/${t.id}" ${t.id === id ? 'aria-current="page"' : ''}>${icono(t.id)}${esc(t.t)}${n ? `<span class="cuenta ${alerta ? 'alerta' : ''}">${n}</span>` : ''}</a>`;
    }).join('');
    const enBarra = vis.length > 5 ? vis.slice(0, 4) : vis;
    const enMas = !enBarra.some((t) => t.id === id);
    $('#nav-movil').innerHTML = enBarra.map((t) => `<a class="${t.id === id ? 'on' : ''}" href="#/${t.id}">${icono(t.id, 20)}${esc(t.corto || t.t)}</a>`).join('')
      + (vis.length > 5 ? `<button data-accion="mas" class="${enMas ? 'on' : ''}">${icono('puntos', 20)}Más</button>` : '');
    const titulo = id === 'inicio' ? `Buen día, ${C.primerNombre(D.usuario.nombre)}` : tab.t;
    const bajada = id === 'inicio' ? `${D.hoy} · ${D.rental}` : BAJADA[id] || '';
    const cuerpo = C.V[id] ? C.V[id](param) : C.vacio('Esta sección todavía no está.');
    $('#vista').innerHTML = `<div class="pagina"><header class="cab"><div><h1>${esc(titulo)}</h1>${bajada ? `<p>${esc(bajada)}</p>` : ''}</div><div class="cab-acc">${C.cab[id] ? C.cab[id](param) : ''}</div></header>${cuerpo}</div>`;
  }
  C.render = render;

  // ---------- Eventos ----------
  document.addEventListener('click', (e) => {
    const b = e.target.closest('button,[data-accion]');
    if (!b) return;
    const d = b.dataset;
    if (d.accion === 'mas') {
      const vis = visibles().slice(4);
      C.modal(`<h3>Más secciones</h3><div class="opciones">${vis.map((t) => `<a href="#/${t.id}" data-cerrar>${icono(t.id)}${esc(t.t)}</a>`).join('')}</div><div class="acciones"><button class="btn fan" data-cerrar>Cerrar</button></div>`);
      return;
    }
    if (d.accion && C.acciones[d.accion]) { e.preventDefault(); C.acciones[d.accion](d, b, e); return; }
    if (d.ok) C.aviso(d.ok);
  });
  document.addEventListener('change', (e) => {
    const t = e.target;
    if (t.id === 'rol' || t.id === 'rol-movil') { S.rol = t.value; guardar(); C.aviso(`Viendo como ${S.rol}: ${visibles().map((x) => x.t).join(', ')}`); render(); return; }
    if (t.dataset.cambio && C.cambios[t.dataset.cambio]) C.cambios[t.dataset.cambio](t);
  });
  // Buscadores de cada sección: data-busca="<clave>" guarda el texto en S.ui[clave] y redibuja sin perder el foco
  document.addEventListener('input', (e) => {
    const t = e.target, k = t.dataset.busca;
    if (!k) return;
    S.ui[k] = t.value; const pos = t.selectionStart; const id = t.id; render();
    const i = id && document.getElementById(id); if (i) { i.focus(); try { i.setSelectionRange(pos, pos); } catch (er) { /* select */ } }
  });
  document.addEventListener('submit', (e) => {
    const f = e.target;
    if (f.id === 'buscar') { e.preventDefault(); C.buscar($('#q').value); return; }
    if (!C.formularios[f.id]) return;
    e.preventDefault(); C.formularios[f.id](new FormData(f), f);
  });
  $('#reiniciar').addEventListener('click', () => { try { localStorage.removeItem(CLAVE); } catch (e) { /* nada */ } location.hash = '#/inicio'; location.reload(); });
  C.iniciar = () => { render(); window.addEventListener('hashchange', () => { render(); $('#vista').scrollTop = 0; }); };
})();
