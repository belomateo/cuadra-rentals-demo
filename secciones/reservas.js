// Reservas de Cuadra · Rentals: grupos de hoy, próximos días, lista de espera y reserva por audio.
(function (C) {
  const { S, D, esc, norm } = C;
  const HOY = '18/07', ANIO = '2026', MIN_ISO = '2026-07-18', MAX_ISO = '2026-09-30', CORTE = 8;
  const TIPOS = ['Esquí', 'Snowboard'], NIVELES = ['Principiante', 'Intermedio', 'Avanzado'];
  const ORIGENES = D.origenes.map((o) => o[0]);
  let uid = 0;

  // ---------- Helpers ----------
  const min = (hhmm) => { const [h, m] = String(hhmm).split(':'); return +h * 60 + +m; };
  const nPers = (n) => `${n} ${n === 1 ? 'persona' : 'personas'}`;
  const aIso = (f) => { const [d, m] = f.split('/'); return `${ANIO}-${m}-${d}`; };
  const deIso = (s) => s.slice(8) + '/' + s.slice(5, 7);
  const dif = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 864e5);
  const sig = (pre, lista) => pre + (Math.max(0, ...lista.map((x) => parseInt(String(x.id).slice(pre.length), 10) || 0)) + 1);
  const personasDe = (gid) => C.reservasDe(gid).reduce((s, r) => s + r.personas.length, 0);
  const ocupados = (t) => t.reservas.reduce((s, id) => s + (C.reserva(id) ? C.reserva(id).personas.length : 0), 0);
  const opts = (arr, sel) => arr.map((x) => `<option ${x === sel ? 'selected' : ''}>${esc(x)}</option>`).join('');
  const campo = (lbl, ctl, cls = '') => { const id = 'rc' + (++uid); return `<div class="campo ${cls}"><label for="${id}">${lbl}</label>${ctl(id)}</div>`; };
  const ir = (hash) => { if (location.hash === hash) C.render(); else location.hash = hash; };
  // Tablas de esta reserva que todavía están afuera
  const afuera = (r) => r.personas.map((p, k) => [p, k, p.equipo && C.equipo(p.equipo)]).filter(([p, , e]) => e && !p.devuelto && e.reserva === r.id && e.estado === 'alquilado');
  // Lista larga: corta en CORTE filas y deja un «Ver todas». filas = html de cada fila (o grupo de filas)
  const cortar = (filas, clave, todas) => (todas || S.ui[clave] || filas.length <= CORTE ? filas.join('')
    : `${filas.slice(0, CORTE).join('')}<button type="button" class="mas-link" data-accion="res-todas" data-clave="${clave}">Ver todas (${filas.length})</button>`);
  const errorFechas = (a, b) => {
    const ok = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));
    if (!ok(a) || !ok(b)) return 'completá las dos fechas';
    if (a < MIN_ISO) return 'la entrada no puede ser anterior a hoy';
    if (b < a) return 'la salida no puede ser antes de la entrada';
    if (b > MAX_ISO) return 'las fechas llegan hasta fin de septiembre';
    if (dif(a, b) > 29) return 'el alquiler no puede pasar de 30 días';
    return '';
  };
  const nuevaPersona = (p) => ({ nombre: p.nombre, tipo: p.tipo, gama: p.gama, nivel: p.nivel, altura: null, peso: null, calzado: null, equipo: null, pago: 'Pendiente', contrato: false, fijacion: false, devuelto: false });
  // Prueba de equipos: el grupo viene a probarse la tarde anterior o esa mañana, y ahí se completan nombres y talles
  const pruebaHoy = (gid) => C.reservasDe(gid).find((r) => r.estado === 'manana' && r.prueba && r.prueba.dia === HOY);
  const cuandoPrueba = (pr) => `Prueba ${pr.dia === HOY ? 'hoy' : 'el ' + pr.dia} a las ${pr.hora}`;

  // ---------- Pestañas ----------
  const ALIAS = { grupos: 'hoy', transfers: 'hoy', agenda: 'proximos' };
  C.V.reservas = (param) => {
    const clave = ['hoy', 'proximos', 'espera', 'audio'].includes(param) ? param : ALIAS[param] || 'hoy';
    return C.subtabs('reservas', clave, [['hoy', 'Hoy'], ['proximos', 'Próximos días'], ['espera', 'Lista de espera', S.espera.length], ['audio', 'Por audio']])
      + ({ hoy: vistaHoy, proximos: vistaProximos, espera: vistaEspera, audio: vistaAudio })[clave]();
  };
  C.cab.reservas = () => (C.puede('reservar') ? C.btn('Nueva reserva', { accion: 'res-nueva', icono: 'mas' }) : '');
  C.acciones['res-todas'] = (d) => { S.ui[d.clave] = true; C.guardar(); C.render(); };

  // ---------- Hoy ----------
  function filaPersona(r, p, k) {
    const e = p.equipo && C.equipo(p.equipo), hecha = p.devuelto || r.estado === 'devuelta', puede = C.puede('asignar') && !hecha;
    const datos = [p.tipo, p.nivel, p.altura ? `${p.altura} cm` : '', p.peso ? `${p.peso} kg` : '', p.calzado ? `calzado ${p.calzado}` : ''].filter(Boolean);
    if (!p.altura && !p.peso && !p.calzado) datos.push('sin medidas');
    const mano = { accion: 'res-asignar', chico: true, data: { r: r.id, k } };
    let acc = '';
    if (puede) acc = p.porCompletar ? C.btn('Completar', { accion: 'res-datos', chico: true, data: { r: r.id, k } })
      : !p.contrato ? C.btn('Firmar', { accion: 'res-firmar', chico: true, data: { r: r.id, k } })
        : !e ? C.btn('Asignar tabla', mano)
          : r.estado === 'devuelve_hoy' ? '' : C.btn('Cambiar', Object.assign({ tipo: 'sec' }, mano));
    return C.fila({
      cls: 'sub', lead: C.avatar(p.nombre, 28), titulo: esc(p.nombre), meta: `${C.marca(p.gama)} · ${esc(datos.join(' · '))}`, acc,
      lado: hecha ? C.estado('Devuelta') + (e ? C.placa(e.n) : '')
        : p.porCompletar ? C.estado('Faltan nombre y talles', 'aviso') + '<span class="muted">Sin tabla</span>'
          : C.estado(p.contrato ? 'Firmó' : 'Falta firmar', p.contrato ? 'ok' : 'aviso') + (e ? C.placa(e.n) : '<span class="muted">Sin tabla</span>')
    });
  }

  function filasGrupo(g) {
    const rs = C.reservasDe(g.id), abierto = S.ui.grupoAbierto === g.id, multi = rs.length > 1;
    const vivas = rs.filter((r) => r.estado !== 'devuelta').flatMap((r) => r.personas.filter((p) => !p.devuelto));
    const conTabla = vivas.filter((p) => p.equipo).length;
    const devuelve = rs.some((r) => r.estado === 'devuelve_hoy'), retira = rs.some((r) => r.estado === 'retira_hoy');
    const porDevolver = rs.filter((r) => r.estado === 'devuelve_hoy').reduce((s, r) => s + afuera(r).length, 0);
    const desde = rs.map((r) => r.desde).sort((a, b) => aIso(a).localeCompare(aIso(b)))[0];
    const hasta = rs.map((r) => r.hasta).sort((a, b) => aIso(b).localeCompare(aIso(a)))[0];
    const enLocal = S.espera.some((e) => e.grupo === g.id), prueba = pruebaHoy(g.id);
    const lado = !vivas.length ? C.estado('Devuelto', 'ok')
      : devuelve && porDevolver ? C.estado(`${porDevolver} por devolver`, 'aviso')
        : prueba ? C.estado(`Prueba ${prueba.prueba.hora} · ${conTabla} de ${vivas.length} listas`, conTabla === vivas.length ? 'ok' : 'info')
          : C.estado(`${conTabla} de ${vivas.length} con tabla`, conTabla === vivas.length ? 'ok' : 'aviso');
    const alternar = (txt, tipo) => C.btn(abierto ? 'Cerrar' : txt, { accion: 'res-abrir', tipo: abierto ? 'fan' : tipo, chico: true, data: { id: g.id } });
    let acc;
    if (devuelve && porDevolver && C.puede('asignar')) acc = C.btn('Recibir', { accion: 'res-recibir', chico: true, data: { g: g.id } }) + alternar('Ver', 'fan');
    else if ((retira || prueba) && C.puede('asignar')) acc = alternar(retira ? 'Entregar' : 'Atender prueba', '');
    else acc = alternar('Ver', 'sec');
    let html = C.fila({
      lead: C.avatar(g.nombre, 34), titulo: esc(g.nombre) + (enLocal ? ` ${C.etiqueta('En el local', 'aviso')}` : ''),
      meta: [nPers(personasDe(g.id)), `${desde} al ${hasta}`, g.origen].filter(Boolean).map(esc).join(' · '), lado, acc
    });
    if (abierto) {
      if (multi) html += `<div class="res-nota">${C.nota(`Van en días distintos: quedan en ${rs.length} reservas del mismo grupo.`)}</div>`;
      html += rs.map((r) => (multi ? `<div class="res-tramo">${esc(r.desde)} al ${esc(r.hasta)} · ${nPers(r.personas.length)}</div>` : '')
        + r.personas.map((p, k) => filaPersona(r, p, k)).join('') + filaExtras(r)).join('');
    }
    return html;
  }

  function vistaHoy() {
    const abierto = S.ui.grupoAbierto;
    const rango = (g) => {
      const est = C.reservasDe(g.id).map((r) => r.estado);
      return g.id === abierto ? 0 : S.espera.some((e) => e.grupo === g.id) ? 1 : est.includes('retira_hoy') ? 2 : pruebaHoy(g.id) ? 3 : est.includes('devuelve_hoy') ? 4 : est.includes('en_curso') ? 5 : 6;
    };
    const grupos = S.grupos.filter((g) => g.id === abierto || pruebaHoy(g.id) || C.reservasDe(g.id).some((r) => r.estado !== 'manana')).sort((a, b) => rango(a) - rango(b));
    const filas = grupos.map(filasGrupo);
    const transfers = S.transfers.map((t) => {
      const chofer = S.personal.find((p) => p.id === t.chofer), hecho = t.estado === 'hecho';
      return C.fila({
        lead: C.icono('combi', 20), titulo: `${esc(t.hora)} · ${esc(t.desde)} a ${esc(t.hacia)}`,
        meta: `${esc(chofer ? chofer.nombre : 'Sin chofer')} · ${ocupados(t)} de ${t.lugares} lugares`,
        lado: hecho ? C.estado('Hecho', 'ok') : C.estado('Próximo', 'info'),
        acc: hecho ? '' : C.btn('Marcar hecho', { accion: 'res-transfer-hecho', tipo: 'sec', chico: true, data: { id: t.id } })
      });
    });
    return C.panel({ titulo: 'Grupos de hoy', sinPad: true, cuerpo: filas.length ? `<div class="lista">${cortar(filas, 'resTodasHoy')}</div>` : C.vacio('Hoy no hay grupos.') })
      + C.panel({ titulo: 'Transfers de hoy', sinPad: true, cuerpo: transfers.length ? `<div class="lista">${transfers.join('')}</div>` : C.vacio('Hoy no hay transfers.') });
  }

  C.acciones['res-abrir'] = (d) => { S.ui.grupoAbierto = S.ui.grupoAbierto === d.id ? null : d.id; C.guardar(); C.render(); };
  C.acciones['res-transfer-hecho'] = (d) => {
    const t = S.transfers.find((x) => x.id === d.id); if (!t) return;
    t.estado = 'hecho'; C.guardar(); C.render(); C.aviso(`Transfer de las ${t.hora} hecho`);
  };
  C.acciones['res-firmar'] = (d) => {
    const r = C.reserva(d.r), p = r && r.personas[+d.k];
    if (!p || !C.puede('asignar')) return;
    C.firmar(r.id, +d.k); C.render(); C.aviso(`${C.primerNombre(p.nombre)} firmó el contrato`);
  };

  // ---------- Extras: lo que se llevan de más en el local, con el total al instante (no en comentarios) ----------
  const puedeSumar = () => C.puede('asignar') || C.puede('reservar');
  const alquiler = (r) => r.personas.reduce((s, p) => s + C.montoPersona(r, p), 0);
  const unidad = (x) => (x.por === 'día' ? 'por día' : 'cada una');
  function filaExtras(r) {
    const ex = r.extras || [];
    return C.fila({
      cls: 'sub', lead: `<span class="res-ex-ic">${C.icono('mas', 16)}</span>`, titulo: 'Extras',
      meta: ex.length ? esc(ex.map((x) => x.nombre + (x.cant > 1 ? ` ×${x.cant}` : '')).join(' · ')) : 'Nada sumado todavía',
      lado: `<span class="num"><b>${C.plata(C.montoReserva(r))}</b><span class="muted"> total</span></span>`,
      acc: puedeSumar() && r.estado !== 'devuelta' ? C.btn('Sumar', { accion: 'res-extras', tipo: 'sec', chico: true, data: { r: r.id } }) : ''
    });
  }
  function modalExtras(rid, foco) {
    const r = C.reserva(rid), g = r && C.grupo(r.grupo); if (!r) return;
    const ex = r.extras || [], suma = ex.reduce((s, x) => s + C.montoExtra(r, x), 0);
    const filas = ex.map((x, i) => C.fila({
      titulo: esc(x.nombre), meta: `${C.plata(x.precio)} ${unidad(x)}${x.por === 'día' ? ` · ${r.dias} días` : ''}`,
      lado: `<span class="num">${C.plata(C.montoExtra(r, x))}</span>`,
      acc: `<span class="res-ex-cant">${C.btn('−', { accion: 'res-extra-menos', tipo: 'sec', chico: true, data: { r: r.id, i } })}<b class="num">${x.cant}</b>${C.btn('+', { accion: 'res-extra-mas', tipo: 'sec', chico: true, data: { r: r.id, i } })}</span>`
    })).join('');
    C.modal(`<h3>Sumar a la reserva</h3><p class="modal-sub">${esc(g ? g.nombre : 'Reserva')} · ${esc(r.desde)} al ${esc(r.hasta)} · ${r.dias} días</p>
      <div class="res-ex-total"><span>Total de la reserva</span><b class="num">${C.plata(C.montoReserva(r))}</b>
        <span class="muted">Alquiler ${C.plata(alquiler(r))} + extras ${C.plata(suma)}</span></div>
      <div class="res-ex-chips">${D.extras.map((x) => `<button type="button" data-accion="res-extra-mas" data-r="${esc(r.id)}" data-id="${x.id}"><b>+ ${esc(x.nombre)}</b><span>${C.plata(x.precio)} ${unidad(x)}</span></button>`).join('')}</div>
      ${filas ? `<div class="lista res-modal-lista">${filas}</div>` : ''}
      <form id="res-form-extra" class="form" novalidate><input type="hidden" name="r" value="${esc(r.id)}">
        ${campo('Otra cosa', (id) => `<input id="${id}" name="nombre" maxlength="40" placeholder="Ej: Mochila" autocomplete="off">`)}
        ${campo('Precio total', (id) => `<input id="${id}" name="precio" inputmode="numeric" maxlength="9" placeholder="Ej: 20000" autocomplete="off">`)}
        <div class="campo ancho"><span class="error" id="res-err-ex" role="alert"></span></div>
        <div class="acciones">${C.btn('Sumar otra cosa', { submit: true, tipo: 'sec' })}<button type="button" class="btn" data-cerrar>Listo</button></div></form>`);
    // vuelve a enfocar el botón que se tocó (el modal se redibuja con cada toque)
    const b = foco && document.querySelector(`#capa [data-accion="${foco[0]}"][data-${foco[1]}="${foco[2]}"]`); if (b) b.focus();
  }
  const cambioExtras = (r, txt, foco) => { C.guardar(); C.render(); modalExtras(r.id, foco); C.aviso(`${txt} · total ${C.plata(C.montoReserva(r))}`); };
  C.acciones['res-extras'] = (d) => { if (puedeSumar()) modalExtras(d.r); };
  C.acciones['res-extra-mas'] = (d) => {
    const r = C.reserva(d.r); if (!r || !puedeSumar()) return;
    r.extras = r.extras || [];
    let x = d.i != null ? r.extras[+d.i] : r.extras.find((y) => y.id === d.id);
    if (!x) { const base = D.extras.find((y) => y.id === d.id); if (!base) return; x = Object.assign({ cant: 0 }, base); r.extras.push(x); }
    x.cant++; cambioExtras(r, `${x.nombre} sumado`, d.i != null ? ['res-extra-mas', 'i', d.i] : ['res-extra-mas', 'id', d.id]);
  };
  C.acciones['res-extra-menos'] = (d) => {
    const r = C.reserva(d.r), x = r && (r.extras || [])[+d.i]; if (!x || !puedeSumar()) return;
    x.cant--; if (x.cant <= 0) r.extras.splice(+d.i, 1);
    cambioExtras(r, `${x.nombre} ${x.cant > 0 ? 'restado' : 'quitado'}`, x.cant > 0 ? ['res-extra-menos', 'i', d.i] : null);
  };
  C.formularios['res-form-extra'] = (fd) => {
    const r = C.reserva(String(fd.get('r'))), el = document.querySelector('#res-err-ex'), fallo = (t) => { if (el) el.textContent = t; };
    if (!r || !puedeSumar()) return;
    const nombre = String(fd.get('nombre') || '').trim().replace(/\s+/g, ' '), precio = String(fd.get('precio') || '').replace(/[.\s$]/g, '');
    if (nombre.length < 2) return fallo('Escribí qué se lleva (por ejemplo «Campera»).');
    if (!/^\d{1,8}$/.test(precio) || +precio <= 0) return fallo('Poné el precio en pesos, solo números (por ejemplo 20000).');
    (r.extras = r.extras || []).push({ id: 'otro' + Date.now(), nombre, precio: +precio, por: 'una', cant: 1 });
    cambioExtras(r, `${nombre} sumado`);
  };

  // Asignar una tabla: las libres de su gama y tipo, o escribir el número
  C.acciones['res-asignar'] = (d) => {
    const r = C.reserva(d.r), p = r && r.personas[+d.k];
    if (!p || !C.puede('asignar')) return;
    const libres = S.equipos.filter((e) => e.gama === p.gama && e.tipo === p.tipo && e.estado === 'disponible').sort((a, b) => a.n - b.n);
    C.modal(`<h3>Tabla para ${esc(p.nombre)}</h3><p class="modal-sub">${esc(p.tipo)} · ${C.marca(p.gama)}${p.altura ? ` · mide ${p.altura} cm` : ''}</p>
      <form id="res-form-num" class="form" novalidate><input type="hidden" name="r" value="${esc(r.id)}"><input type="hidden" name="k" value="${+d.k}">
        ${campo('Escribí o escaneá el número', (id) => `<input id="${id}" name="n" inputmode="numeric" maxlength="3" placeholder="Ej: 412" autocomplete="off">`, 'ancho')}
        <div class="campo ancho"><span class="error" id="res-err" role="alert"></span></div></form>
      <div class="opciones">${libres.slice(0, 12).map((e) => `<button type="button" data-accion="res-asignar-ok" data-n="${e.n}" data-r="${esc(r.id)}" data-k="${+d.k}">${C.placa(e.n)}<span>${esc(e.marca)} ${esc(e.modelo)} · ${e.largo} cm · ${esc(e.ubic || 'Sin ubicación')}</span></button>`).join('') || C.vacio('No quedan tablas libres de esta gama y tipo.')}</div>
      ${libres.length > 12 ? `<p class="muted">Hay ${libres.length - 12} más: escribí el número arriba.</p>` : ''}
      <div class="acciones"><button type="submit" form="res-form-num" class="btn">Asignar</button><button type="button" class="btn fan" data-cerrar>Cerrar</button></div>`);
  };
  const asignar = (n, rid, k) => {
    const err = C.asignar(n, rid, k), el = document.querySelector('#res-err');
    if (err) { if (el) el.textContent = err; C.aviso(err); return; }
    const p = C.reserva(rid).personas[k];
    C.cerrarModal(); C.render(); C.aviso(`La #${n} quedó para ${C.primerNombre(p.nombre)}`);
  };
  C.acciones['res-asignar-ok'] = (d) => { if (C.puede('asignar')) asignar(+d.n, d.r, +d.k); };
  C.formularios['res-form-num'] = (fd) => {
    const t = String(fd.get('n') || '').trim(), el = document.querySelector('#res-err'), r = C.reserva(String(fd.get('r'))), k = +fd.get('k');
    if (!C.puede('asignar') || !r || !r.personas[k]) return;
    if (!/^\d{3}$/.test(t)) { if (el) el.textContent = 'Escribí el número de la tabla, de tres cifras (por ejemplo 412).'; return; }
    asignar(+t, r.id, k);
  };

  // Completar en la prueba: nombre, nivel y talles de cada lugar reservado por cantidad
  C.acciones['res-datos'] = (d) => {
    const r = C.reserva(d.r), p = r && r.personas[+d.k];
    if (!p || !puedeSumar()) return;
    const num = (name, lbl, ph, val) => campo(lbl, (id) => `<input id="${id}" name="${name}" inputmode="numeric" maxlength="3" placeholder="${ph}" value="${val == null ? '' : +val}" autocomplete="off">`);
    C.modal(`<h3>Datos para la prueba</h3><p class="modal-sub">${esc(p.tipo)} · ${C.marca(p.gama)}. Con la altura, el peso y el calzado se preparan la tabla y las botas.</p>
      <form id="res-form-datos" class="form" novalidate><input type="hidden" name="r" value="${esc(r.id)}"><input type="hidden" name="k" value="${+d.k}">
        ${campo('Nombre y apellido', (id) => `<input id="${id}" name="nombre" maxlength="40" placeholder="Ej: Lucía Pérez" value="${p.porCompletar ? '' : esc(p.nombre)}" autocomplete="off">`)}
        ${campo('Nivel', (id) => `<select id="${id}" name="nivel">${opts(NIVELES, p.nivel || 'Intermedio')}</select>`)}
        ${num('altura', 'Altura (cm)', 'Ej: 172', p.altura)}${num('peso', 'Peso (kg)', 'Ej: 70', p.peso)}${num('calzado', 'Calzado', 'Ej: 41', p.calzado)}
        <div class="campo ancho"><span class="error" id="res-err-datos" role="alert"></span></div>
        <div class="acciones">${C.btn('Guardar', { submit: true })}<button type="button" class="btn fan" data-cerrar>Cancelar</button></div></form>`);
  };
  C.formularios['res-form-datos'] = (fd) => {
    const r = C.reserva(String(fd.get('r'))), k = +fd.get('k'), p = r && r.personas[k];
    const el = document.querySelector('#res-err-datos'), fallo = (t) => { if (el) el.textContent = t; };
    if (!p || !puedeSumar()) return;
    const nombre = String(fd.get('nombre') || '').trim().replace(/\s+/g, ' '), nivel = String(fd.get('nivel') || '');
    if (nombre.length < 2 || nombre.length > 40) return fallo('Poné el nombre (entre 2 y 40 letras)');
    if (/^persona \d+$/i.test(nombre)) return fallo('Poné el nombre de la persona');
    if (r.personas.some((x, i) => i !== k && norm(x.nombre) === norm(nombre))) return fallo('Ya hay alguien con ese nombre en esta reserva');
    if (!NIVELES.includes(nivel)) return fallo('Elegí el nivel');
    // Vacío = todavía no se midió; si hay número, tiene que tener sentido
    const medida = (name, a, b) => { const s = String(fd.get(name) || '').trim(); return !s ? [null, ''] : /^\d{1,3}$/.test(s) && +s >= a && +s <= b ? [+s, ''] : [null, `entre ${a} y ${b}`]; };
    const [altura, eA] = medida('altura', 90, 220), [peso, eP] = medida('peso', 15, 150), [calzado, eC] = medida('calzado', 20, 48);
    if (eA) return fallo(`La altura va en centímetros, ${eA}`);
    if (eP) return fallo(`El peso va en kilos, ${eP}`);
    if (eC) return fallo(`El calzado va ${eC}`);
    Object.assign(p, { nombre, nivel, altura, peso, calzado, porCompletar: false });
    C.guardar(); C.cerrarModal(); C.render(); C.aviso(`Listo: ${C.primerNombre(nombre)} ya tiene sus datos`);
  };

  // Recibir: cada tabla vuelve al stock o va al taller con un trabajo
  C.acciones['res-recibir'] = (d) => {
    const g = C.grupo(d.g); if (!g || !C.puede('asignar')) return;
    const filas = C.reservasDe(g.id).flatMap((r) => afuera(r).map(([p, , e]) => ({ p, e })));
    if (!filas.length) { C.aviso('Ya está todo devuelto'); return; }
    C.modal(`<h3>Recibir a ${esc(g.nombre)}</h3><p class="modal-sub">Elegí qué pasa con cada tabla.</p>
      <form id="res-form-devolver"><input type="hidden" name="g" value="${esc(g.id)}">
        <div class="lista res-modal-lista">${filas.map(({ p, e }) => C.fila({
          lead: C.placa(e.n), titulo: esc(p.nombre), meta: `${esc(e.marca)} ${esc(e.modelo)} · ${e.largo} cm`,
          lado: `<div class="campo"><select name="e-${e.n}" aria-label="Qué hacer con la ${e.n}"><option value="">Al stock</option>${D.trabajos.map((t) => `<option value="${esc(t[0])}">Al taller · ${esc(t[0].toLowerCase())} (${t[1]} min)</option>`).join('')}</select></div>`
        })).join('')}</div>
        <div class="acciones">${C.btn(`Recibir ${filas.length === 1 ? 'la tabla' : `las ${filas.length} tablas`}`, { submit: true })}<button type="button" class="btn fan" data-cerrar>Cancelar</button></div></form>`);
  };
  C.formularios['res-form-devolver'] = (fd) => {
    const g = C.grupo(String(fd.get('g'))); if (!g || !C.puede('asignar')) return;
    let stock = 0, taller = 0;
    C.reservasDe(g.id).forEach((r) => afuera(r).forEach(([, , e]) => {
      const t = String(fd.get('e-' + e.n) || ''), trabajo = D.trabajos.some((x) => x[0] === t) ? t : '';
      C.devolver(e.n, trabajo || null);
      if (trabajo) taller++; else stock++;
    }));
    C.cerrarModal(); C.render(); C.aviso(`Recibidas: ${stock} al stock y ${taller} al taller`);
  };

  // ---------- Próximos días ----------
  function vistaProximos() {
    const max = Math.max(...D.agenda.map((a) => a.personas));
    const dias = D.agenda.map((a, i) => `<div class="res-dia"><div class="barra-fila"><span>${esc(a.dia)}${i === 0 ? ' · hoy' : i === 1 ? ' · mañana' : ''}</span>${C.barra(a.personas, max, i === 0 ? 'info' : '')}<b>${a.personas}</b></div>
      <div class="res-ret"><span class="muted">Retiran</span>${D.gamas.map((g) => `<span class="res-g">${C.marca(g.id, false)}<b class="num">${a.retiran[g.id]}</b></span>`).join('')}</div>
      ${a.evento ? `<div class="res-ret muted">${esc(a.evento)}</div>` : ''}</div>`).join('');
    const q = norm(S.ui.buscaRes || '');
    const rs = S.reservas.filter((r) => r.estado === 'manana').filter((r) => {
      const g = C.grupo(r.grupo);
      return !q || norm([g ? g.nombre : '', g ? g.contacto : '', ...r.personas.map((p) => p.nombre)].join(' ')).includes(q);
    }).sort((a, b) => aIso(a.desde).localeCompare(aIso(b.desde)));
    const filas = rs.map((r) => {
      const g = C.grupo(r.grupo) || { nombre: 'Grupo', origen: '', id: '' };
      return C.fila({
        lead: C.avatar(g.nombre, 34), titulo: esc(g.nombre),
        meta: [nPers(r.personas.length), `${r.desde} al ${r.hasta}`, g.origen, C.puede('reservar') ? C.plata(C.montoReserva(r)) : ''].filter(Boolean).map(esc).join(' · '),
        lado: r.prueba ? C.estado(cuandoPrueba(r.prueba), r.prueba.dia === HOY ? 'aviso' : 'info')
          : r.desde === '19/07' ? C.estado('Retira mañana', 'info') : C.estado(`Retira el ${r.desde}`),
        acc: C.btn('Ver', { accion: 'res-ver', tipo: 'sec', chico: true, data: { id: g.id } })
      });
    });
    return C.panel({ titulo: 'Gente por día', sub: 'personas con equipo', cuerpo: dias })
      + C.panel({
        titulo: 'Reservas de mañana en adelante', sinPad: true,
        acciones: `<input class="busca-chica" id="res-busca" data-busca="buscaRes" type="search" placeholder="Buscar grupo o persona" aria-label="Buscar reserva" value="${esc(S.ui.buscaRes || '')}" autocomplete="off">`,
        cuerpo: filas.length ? `<div class="lista">${cortar(filas, 'resTodasProx', !!q)}</div>` : C.vacio('No hay reservas con eso.')
      });
  }
  C.acciones['res-ver'] = (d) => { S.ui.grupoAbierto = d.id; C.guardar(); ir('#/reservas/hoy'); };

  // ---------- Lista de espera ----------
  function vistaEspera() {
    const lista = S.espera.map((e) => ({ g: C.grupo(e.grupo), hora: e.llegada })).filter((x) => x.g).sort((a, b) => min(a.hora) - min(b.hora));
    const puede = C.puede('asignar');
    const filas = lista.map(({ g, hora }, i) => {
      const m = Math.max(0, min(D.hora) - min(hora)), n = C.reservasDe(g.id).length;
      return C.fila({
        lead: `<span class="avatar" style="width:32px;height:32px;background:var(--noche)">${i + 1}</span>`, titulo: esc(g.nombre),
        meta: `${nPers(personasDe(g.id))} · ${n === 1 ? '1 reserva' : `${n} reservas`} · llegó a las ${esc(hora)}`,
        lado: C.estado(`${m} min`, m >= 25 ? 'alerta' : m >= 15 ? 'aviso' : ''),
        acc: puede ? C.btn('Atender', { accion: 'res-atender', chico: true, data: { g: g.id } }) : ''
      });
    });
    const eligibles = S.grupos.filter((g) => !S.espera.some((e) => e.grupo === g.id) && C.reservasDe(g.id).some((r) => r.estado === 'retira_hoy'));
    const llego = !puede ? '' : C.panel({
      titulo: 'Llegó al local',
      cuerpo: eligibles.length ? `<form id="res-form-llego" class="form">${campo('Grupo que retira hoy', (id) => `<select id="${id}" name="g">${eligibles.map((g) => `<option value="${esc(g.id)}">${esc(g.nombre)}</option>`).join('')}</select>`)}
        <div class="acciones">${C.btn('Anotar en la fila', { submit: true, tipo: 'sec' })}</div></form>` : '<p class="muted">Todos los grupos que retiran hoy ya están anotados.</p>'
    });
    return C.nota('El grupo se atiende junto, aunque haya reservado por separado.')
      + C.panel({ titulo: 'En la fila', sinPad: true, cuerpo: filas.length ? `<div class="lista">${filas.join('')}</div>` : C.vacio('No hay nadie esperando en el local.') }) + llego;
  }
  C.acciones['res-atender'] = (d) => {
    const g = C.grupo(d.g); if (!g || !C.puede('asignar')) return;
    S.espera = S.espera.filter((e) => e.grupo !== g.id); S.ui.grupoAbierto = g.id; C.guardar();
    C.aviso(`Atendiendo a ${g.nombre}`); ir('#/reservas/hoy');
  };
  C.formularios['res-form-llego'] = (fd) => {
    const g = C.grupo(String(fd.get('g')));
    if (!g || !C.puede('asignar') || S.espera.some((e) => e.grupo === g.id)) return;
    S.espera.push({ grupo: g.id, llegada: D.hora }); C.guardar(); C.render(); C.aviso(`${g.nombre} quedó en la fila`);
  };

  // ---------- Por audio ----------
  function vistaAudio() {
    const a = D.audioEjemplo, hecho = S.grupos.find((g) => g.audio), puede = C.puede('reservar');
    if (S.ui.audioDescartado && !hecho) return C.nota(`Descartaste el audio de ${esc(a.de)}. No se creó ninguna reserva.`, '', C.btn('Recuperar', { accion: 'res-audio-volver', tipo: 'sec', chico: true }));
    const izq = C.panel({
      titulo: 'Audio de WhatsApp', sinPad: true,
      cuerpo: `${C.fila({ lead: C.icono('audio', 20), titulo: esc(a.de), meta: `${esc(a.origen)} · ${esc(a.dur)}` })}<p class="res-cita sec-txt">«${esc(a.txt)}»</p>`
    });
    const acciones = hecho || !puede ? '' : C.btn('Descartar', { accion: 'res-audio-descartar', tipo: 'fan' }) + C.btn('Confirmar reserva', { accion: 'res-audio-ok' });
    const der = C.panel({
      titulo: 'Reserva armada', acciones, sinPad: true,
      cuerpo: `<div class="lista">${C.fila({ lead: C.icono('reservas', 20), titulo: esc(a.grupo), meta: `${esc(a.desde)} al ${esc(a.hasta)} · ${a.dias} días · ${nPers(a.personas.length)}` })}
        ${a.personas.map((p) => C.fila({ lead: C.avatar(p.nombre, 28), titulo: esc(p.nombre), meta: `${C.marca(p.gama)} · ${esc(p.tipo)} · ${esc(p.nivel)}` })).join('')}</div>`
    });
    const rs = hecho ? C.reservasDe(hecho.id) : [];
    const nota = hecho
      ? C.nota(`<b>${esc(hecho.nombre)}</b> ya está en el sistema: ${nPers(personasDe(hecho.id))}, del ${esc(rs[0].desde)} al ${esc(rs[0].hasta)}.`, 'ok',
        C.btn('Ver reserva', { accion: 'res-ver', tipo: 'sec', chico: true, data: { id: hecho.id } }) + (puede ? C.btn('Deshacer', { accion: 'res-audio-deshacer', tipo: 'sec', chico: true }) : ''))
      : C.nota(puede ? 'La revisás antes de confirmar.' : 'La revisás antes de confirmar. La confirma Administración.');
    return `${nota}<div class="grid-par">${izq}${der}</div>`;
  }
  C.acciones['res-audio-ok'] = () => {
    const a = D.audioEjemplo;
    if (!C.puede('reservar') || S.grupos.some((g) => g.audio)) return;
    const { g } = crearReservas({ nombre: a.grupo, contacto: a.de, tel: '', origen: a.origen, ciudad: a.origen, canal: 'WhatsApp (audio)', audio: true },
      a.personas.map((p) => Object.assign({}, p, { desde: aIso(a.desde), hasta: aIso(a.hasta) })));
    S.ui.audioDescartado = false; C.guardar(); C.render(); C.aviso(`Reserva confirmada: ${g.nombre}`);
  };
  C.acciones['res-audio-descartar'] = () => { if (!C.puede('reservar')) return; S.ui.audioDescartado = true; C.guardar(); C.render(); C.aviso('Audio descartado'); };
  C.acciones['res-audio-volver'] = () => { S.ui.audioDescartado = false; C.guardar(); C.render(); };
  C.acciones['res-audio-deshacer'] = () => {
    const g = S.grupos.find((x) => x.audio); if (!g || !C.puede('reservar')) return;
    C.reservasDe(g.id).forEach((r) => r.personas.forEach((p) => { const e = p.equipo && C.equipo(p.equipo); if (e && e.reserva === r.id) { e.estado = 'disponible'; e.reserva = null; e.ubic = 'Mostrador'; } }));
    S.reservas = S.reservas.filter((r) => r.grupo !== g.id); S.grupos = S.grupos.filter((x) => x !== g);
    S.espera = S.espera.filter((e) => e.grupo !== g.id); if (S.ui.grupoAbierto === g.id) S.ui.grupoAbierto = null;
    C.guardar(); C.render(); C.aviso('Listo, el audio volvió a estar sin confirmar');
  };

  // ---------- Nueva reserva: primero qué se llevan y cuántos, después quiénes y cuándo ----------
  // Cada esquí o snowboard es un lugar («Persona 1», «Persona 2»…): el nombre y los talles se completan en la prueba.
  // La reserva aparta cantidades por gama; el número de tabla se asigna en la prueba, desde el stock.
  const TABLAS = () => TIPOS.flatMap((tipo) => D.gamas.map((g) => ({
    id: `${tipo === 'Esquí' ? 'esqui' : 'snow'}-${g.id}`, tipo, gama: g.id, nombre: `${tipo} ${g.nombre.toLowerCase()}`, precio: g.tarifa, por: 'día', ic: tipo === 'Esquí' ? 'esqui' : 'snowboard'
  })));
  const TOPE = 30;
  const PRUEBAS = [['antes|17:00', 'El día antes, a las 17'], ['antes|18:00', 'El día antes, a las 18'], ['antes|19:30', 'El día antes, a las 19:30'],
    ['mismo|08:00', 'El mismo día, a las 8'], ['mismo|08:30', 'El mismo día, a las 8:30'], ['no|', 'Sin prueba: retiran directo']];
  const libresDe = (t) => S.equipos.filter((e) => e.gama === t.gama && e.tipo === t.tipo && e.estado === 'disponible').length;
  const nombreCant = (x, n) => `${n} ${(n === 1 ? x.nombre : x.pl || x.nombre).toLowerCase()}`;
  let B = null; // borrador de la reserva nueva (vive mientras está abierta la ventana)
  const elegidos = () => [...TABLAS(), ...D.extras].filter((x) => B.cant[x.id]);
  const nTablas = () => TABLAS().reduce((s, t) => s + (B.cant[t.id] || 0), 0);
  const totalB = (dias) => elegidos().reduce((s, x) => s + x.precio * B.cant[x.id] * (x.por === 'día' ? dias : 1), 0);
  const resumenB = () => elegidos().map((x) => nombreCant(x, B.cant[x.id])).join(' · ');

  function tarjeta(a, esTabla) {
    const n = B.cant[a.id] || 0;
    const pie = n
      ? `<span class="res-ex-cant">${C.btn('−', { accion: 'rn-menos', tipo: 'sec', chico: true, data: { id: a.id } })}<b class="num">${n}</b>${C.btn('+', { accion: 'rn-mas', tipo: 'sec', chico: true, data: { id: a.id } })}</span>`
      : C.btn(`Agregar ×${B.son}`, { accion: 'rn-agregar', tipo: 'sec', chico: true, data: { id: a.id } });
    return `<div class="res-art${n ? ' on' : ''}"><span class="res-art-ic">${C.icono(a.ic, 22)}</span>
      <div class="res-art-txt"><b>${esTabla ? C.marca(a.gama, false) : ''}${esc(a.nombre)}</b><span>${C.plata(a.precio)} ${unidad(a)}${esTabla ? ` · ${libresDe(a)} libres hoy` : ''}</span></div>${pie}</div>`;
  }

  // foco: [accion, id] del botón a enfocar después de redibujar (el modal se redibuja con cada toque)
  function modalNueva(foco) {
    if (!B) return;
    const capa = document.querySelector('#capa .modal'), scroll = capa ? capa.scrollTop : 0;
    if (B.paso === 2) modalDatos(); else modalArticulos();
    const m = document.querySelector('#capa .modal'); if (m) m.scrollTop = scroll;
    const b = foco && (document.querySelector(`#capa [data-accion="${foco[0]}"][data-id="${foco[1]}"]`) || document.querySelector(`#capa [data-accion="rn-agregar"][data-id="${foco[1]}"]`));
    if (b) b.focus({ preventScroll: true });
  }
  function modalArticulos() {
    const porDia = elegidos().filter((x) => x.por === 'día').reduce((s, x) => s + x.precio * B.cant[x.id], 0);
    const unaVez = elegidos().filter((x) => x.por !== 'día').reduce((s, x) => s + x.precio * B.cant[x.id], 0);
    const nT = nTablas(), nO = elegidos().filter((x) => !x.gama).reduce((s, x) => s + B.cant[x.id], 0);
    C.modal(`<h3>Nueva reserva</h3><p class="modal-sub">Elegí qué se llevan y cuántos. Los nombres y los talles se completan en la prueba.</p>
      <div class="res-son"><span>Cuántos son</span><span class="res-ex-cant">${C.btn('−', { accion: 'rn-son', tipo: 'sec', chico: true, data: { id: 'menos' } })}<b class="num">${B.son}</b>${C.btn('+', { accion: 'rn-son', tipo: 'sec', chico: true, data: { id: 'mas' } })}</span>
        <span class="muted">«Agregar» suma ${B.son} de una vez</span></div>
      <h4 class="res-h">Esquís y snowboards</h4><div class="res-arts">${TABLAS().map((t) => tarjeta(t, true)).join('')}</div>
      <h4 class="res-h">Lo que se suma</h4><div class="res-arts">${D.extras.map((x) => tarjeta(x, false)).join('')}</div>
      <div class="res-ex-total res-pie"><span>Por día</span><b class="num">${C.plata(porDia)}</b>
        <span class="muted">${nT ? `${nT} ${nT === 1 ? 'tabla' : 'tablas'}` : 'Ninguna tabla todavía'}${nO ? ` · ${nO} ${nO === 1 ? 'cosa más' : 'cosas más'}` : ''}${unaVez ? ` · más ${C.plata(unaVez)} una sola vez` : ''}</span></div>
      <div class="campo"><span class="error" id="rn-err" role="alert"></span></div>
      <div class="acciones">${C.btn('Siguiente', { accion: 'rn-sig' })}<button type="button" class="btn fan" data-cerrar>Cancelar</button></div>`);
  }
  function modalDatos() {
    const v = B.datos, desde = v.desde || '2026-07-19', hasta = v.hasta || '2026-07-22';
    C.modal(`<h3>Nueva reserva</h3><p class="modal-sub">${esc(resumenB())}</p>
      <form id="res-form-nueva" class="form" novalidate>
        ${campo('Grupo', (id) => `<input id="${id}" name="grupo" maxlength="40" placeholder="Ej: Familia Pérez" value="${esc(v.grupo || '')}" autocomplete="off">`)}
        ${campo('Contacto', (id) => `<input id="${id}" name="contacto" maxlength="40" placeholder="Nombre y apellido" value="${esc(v.contacto || '')}" autocomplete="off">`)}
        ${campo('Teléfono', (id) => `<input id="${id}" name="tel" maxlength="25" inputmode="tel" placeholder="+54 9 11 5555 0100" value="${esc(v.tel || '')}" autocomplete="off">`)}
        ${campo('Origen', (id) => `<select id="${id}" name="origen">${opts(ORIGENES, v.origen || 'Buenos Aires')}</select>`)}
        ${campo('Desde', (id) => `<input id="${id}" name="desde" type="date" min="${MIN_ISO}" max="${MAX_ISO}" value="${esc(desde)}" data-cambio="rn-fechas">`)}
        ${campo('Hasta', (id) => `<input id="${id}" name="hasta" type="date" min="${MIN_ISO}" max="${MAX_ISO}" value="${esc(hasta)}" data-cambio="rn-fechas">`)}
        ${campo('Prueba de equipos', (id) => `<select id="${id}" name="prueba">${PRUEBAS.map(([k, l]) => `<option value="${k}" ${k === (v.prueba || 'antes|18:00') ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>`, 'ancho')}
        <div class="res-ex-total res-pie" id="rn-total">${totalHtml(desde, hasta)}</div>
        <div class="campo ancho"><span class="error" id="res-err" role="alert"></span></div>
        <div class="acciones">${C.btn('Guardar reserva', { submit: true })}${C.btn('Volver', { accion: 'rn-volver', tipo: 'sec' })}</div></form>`);
  }
  function totalHtml(desde, hasta) {
    const dias = errorFechas(desde, hasta) ? 0 : dif(desde, hasta) + 1;
    return dias ? `<span>Total de la reserva</span><b class="num">${C.plata(totalB(dias))}</b><span class="muted">${dias} ${dias === 1 ? 'día' : 'días'} · ${nTablas()} ${nTablas() === 1 ? 'tabla' : 'tablas'}</span>`
      : '<span>Total de la reserva</span><b class="num">—</b><span class="muted">Elegí las fechas para ver el total</span>';
  }
  C.cambios['rn-fechas'] = () => {
    const f = document.querySelector('#res-form-nueva'), t = document.querySelector('#rn-total');
    if (f && t && B) t.innerHTML = totalHtml(f.elements.desde.value, f.elements.hasta.value);
  };

  // pre: id de un artículo que ya viene cargado (por ejemplo, desde Stock)
  C.acciones['res-nueva'] = (d) => {
    if (!C.puede('reservar')) { C.aviso('Tu puesto no puede crear reservas'); return; }
    B = { paso: 1, son: 2, cant: {}, datos: {} };
    if (d && d.pre && TABLAS().some((t) => t.id === d.pre)) B.cant[d.pre] = 1;
    modalNueva();
  };
  const conB = (fn) => (d) => { if (B && C.puede('reservar')) fn(d); };
  C.acciones['rn-son'] = conB((d) => { B.son = Math.min(TOPE, Math.max(1, B.son + (d.id === 'mas' ? 1 : -1))); modalNueva(['rn-son', d.id]); });
  const poner = (id, n) => {
    const esTabla = TABLAS().some((t) => t.id === id), antes = B.cant[id] || 0;
    if (esTabla && nTablas() - antes + n > TOPE) { C.aviso(`Hasta ${TOPE} tablas por reserva`); return false; }
    if (n > 0) B.cant[id] = Math.min(TOPE, n); else delete B.cant[id];
    return true;
  };
  C.acciones['rn-agregar'] = conB((d) => { if (poner(d.id, B.son)) modalNueva(['rn-mas', d.id]); });
  C.acciones['rn-mas'] = conB((d) => { if (poner(d.id, (B.cant[d.id] || 0) + 1)) modalNueva(['rn-mas', d.id]); });
  C.acciones['rn-menos'] = conB((d) => { poner(d.id, (B.cant[d.id] || 0) - 1); modalNueva(['rn-menos', d.id]); });
  C.acciones['rn-sig'] = conB(() => {
    if (!nTablas()) { const el = document.querySelector('#rn-err'); if (el) el.textContent = 'Sumá al menos un esquí o un snowboard: cada uno es una persona.'; return; }
    B.paso = 2; modalNueva();
  });
  C.acciones['rn-volver'] = conB(() => {
    const f = document.querySelector('#res-form-nueva'); if (f) B.datos = Object.fromEntries(new FormData(f));
    B.paso = 1; modalNueva();
  });

  // Arma el grupo y una reserva por cada tramo de fechas distinto
  function crearReservas(datosGrupo, personas) {
    const g = Object.assign({ id: sig('gr', S.grupos) }, datosGrupo), tramos = new Map();
    personas.forEach((p) => { const k = p.desde + '|' + p.hasta; if (!tramos.has(k)) tramos.set(k, []); tramos.get(k).push(p); });
    S.grupos.unshift(g);
    const rs = [...tramos.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([k, ps]) => {
      const [desde, hasta] = k.split('|');
      const r = { id: sig('r', S.reservas), grupo: g.id, desde: deIso(desde), hasta: deIso(hasta), dias: dif(desde, hasta) + 1, estado: deIso(desde) === HOY ? 'retira_hoy' : 'manana', personas: ps.map(nuevaPersona) };
      S.reservas.push(r); return r;
    });
    return { g, rs };
  }

  C.formularios['res-form-nueva'] = (fd) => {
    const el = document.querySelector('#res-err'), fallo = (t) => { if (el) el.textContent = t; };
    if (!C.puede('reservar')) return fallo('Tu puesto no puede crear reservas');
    const t = (k) => String(fd.get(k) || '').trim().replace(/\s+/g, ' ');
    const nombre = t('grupo'), contacto = t('contacto'), tel = t('tel'), origen = t('origen');
    if (nombre.length < 2 || nombre.length > 40) return fallo('Poné el nombre del grupo (entre 2 y 40 letras)');
    if (contacto.length < 2 || contacto.length > 40) return fallo('Poné quién contacta (entre 2 y 40 letras)');
    if (tel.length > 25 || !/^[0-9+()\-\s]*$/.test(tel)) return fallo('El teléfono solo puede tener números, espacios, + y guiones');
    if (!ORIGENES.includes(origen)) return fallo('Elegí de dónde vienen');
    if (!B || !nTablas()) return fallo('Volvé y sumá al menos un esquí o un snowboard');
    const desde = t('desde'), hasta = t('hasta'), ef = errorFechas(desde, hasta);
    if (ef) return fallo(ef[0].toUpperCase() + ef.slice(1));
    const pr = String(fd.get('prueba') || '');
    if (!PRUEBAS.some(([k]) => k === pr)) return fallo('Elegí cuándo se prueban el equipo');
    const [cuando, hora] = pr.split('|');
    if (cuando === 'antes' && desde === MIN_ISO) return fallo('Retiran hoy: la prueba tiene que ser hoy a la mañana, o sin prueba');
    // Un lugar por cada esquí o snowboard, numerados; el nombre real se pone en la prueba
    const personas = [];
    TABLAS().forEach((a) => { for (let i = 0; i < (B.cant[a.id] || 0); i++) personas.push({ nombre: `Persona ${personas.length + 1}`, tipo: a.tipo, gama: a.gama, nivel: '', desde, hasta }); });
    const { g, rs } = crearReservas({ nombre, contacto, tel, origen, ciudad: origen, canal: 'Mostrador' }, personas), r = rs[0];
    r.personas.forEach((p) => { p.porCompletar = true; });
    r.extras = D.extras.filter((x) => B.cant[x.id]).map((x) => Object.assign({}, x, { cant: B.cant[x.id] }));
    r.prueba = cuando === 'no' ? null : { dia: cuando === 'antes' ? deIso(new Date(Date.parse(desde) - 864e5).toISOString().slice(0, 10)) : deIso(desde), hora };
    B = null;
    const hoy = r.estado === 'retira_hoy' || (r.prueba && r.prueba.dia === HOY);
    S.ui.buscaRes = ''; S.ui.grupoAbierto = hoy ? g.id : S.ui.grupoAbierto; C.guardar(); C.cerrarModal();
    C.aviso(`Listo: reserva de ${g.nombre}, ${nPers(r.personas.length)}${r.prueba ? ` · ${cuandoPrueba(r.prueba).toLowerCase()}` : ''}`);
    ir(hoy ? '#/reservas/hoy' : '#/reservas/proximos');
  };
})(window.CUADRA);
