// Equipo: quién trabaja hoy, horas extra y días libres. Todo simulado: se guarda en el navegador.
(function (C) {
  const { S, D, esc } = C;
  const SUBS = [['hoy', 'Hoy'], ['horas', 'Horas'], ['libres', 'Días libres']];
  const PUESTOS = ['Mostrador', 'Taller', 'Chofer', 'Administración'];
  const DIAS = ['Sáb', 'Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie'];
  const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;
  const persona = (id) => S.personal.find((p) => p.id === id);
  const nombreDe = (id) => (persona(id) || { nombre: 'Alguien que ya no está' }).nombre;
  const limpio = (t) => String(t == null ? '' : t).replace(/\s+/g, ' ').trim();
  const redondo = (n) => Math.round(n * 100) / 100;
  const num = (n) => String(redondo(n)).replace('.', ',');
  const horasTxt = (n) => num(n) + ' h';
  const inicio = (p) => String(p.horario).split(' a ')[0];
  const pendiente = (p) => p.extra > 0 && !p.extraEstado;
  const diasLibres = () => Array.from({ length: 13 }, (_, i) => `${DIAS[(i + 1) % 7]} ${19 + i}`);
  // No se da de baja a quien usa el sistema ni a quien tiene transfers o trabajos del taller asignados
  const bloqueada = (p) => p.id === D.usuario.id || S.transfers.some((t) => t.chofer === p.id) || S.taller.some((o) => o.quien === p.id);

  // ---------- Piezas puras (se prueban aparte) ----------
  // En el CSV: todo entre comillas, y si un texto empieza con = + - @ se le antepone ' para que Excel no lo tome como fórmula.
  const celda = (v) => {
    let t = String(v == null ? '' : v);
    if (/^[=+\-@\t\r]/.test(t)) t = "'" + t;
    return '"' + t.replace(/"/g, '""') + '"';
  };
  const estadoExtra = (p) => !p.extra ? '' : p.extraEstado === 'aprobada' ? 'Aprobadas' : p.extraEstado === 'rechazada' ? 'Rechazadas' : 'Esperan aprobación';
  const csv = (personal) => {
    const filas = [['Nombre', 'Puesto', 'Horario', 'Horas de la semana', 'Horas extra', 'Estado de las horas extra']]
      .concat(personal.map((p) => [p.nombre, p.rol, p.horario, num(p.semana), num(p.extra), estadoExtra(p)]))
      .concat([['Total', '', '', num(personal.reduce((s, p) => s + p.semana, 0)), num(personal.reduce((s, p) => s + p.extra, 0)), '']]);
    return '﻿' + filas.map((f) => f.map(celda).join(';')).join('\r\n') + '\r\n'; // ; y BOM: así lo abre bien el Excel en español
  };
  const validarCorreo = (c) => c.length <= 80 && /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]{2,}$/.test(c);
  // Devuelve el texto del error o '' si está todo bien
  const validarAlta = (d, personal) => {
    if (!/^\p{L}[\p{L} .'-]{1,59}$/u.test(d.nombre)) return 'Escribí el nombre (entre 2 y 60 letras)';
    if (!PUESTOS.includes(d.puesto)) return 'Elegí un puesto de la lista';
    if (!HORA.test(d.desde) || !HORA.test(d.hasta)) return 'Completá la hora de entrada y la de salida';
    if (d.desde === d.hasta) return 'La hora de entrada y la de salida no pueden ser iguales';
    if (!validarCorreo(d.correo)) return 'El correo no parece válido (por ejemplo: nombre@cumbre.com)';
    if (personal.some((p) => p.correo && p.correo === d.correo)) return 'Ese correo ya lo usa otra persona';
    if (personal.some((p) => p.nombre.toLowerCase() === d.nombre.toLowerCase())) return 'Esa persona ya está en el equipo';
    return '';
  };
  C.eq = { csv, celda, validarAlta, validarCorreo };

  // ---------- Pantallas ----------
  const estadoDe = (p) => p.estado === 'trabajando' ? (p.salida ? C.estado('Ya salió') : C.estado(`Trabajando desde ${p.entrada}`, 'ok'))
    : p.estado === 'sin_fichar' ? C.estado('No fichó', 'alerta') : p.estado === 'franco' ? C.estado('Franco') : C.estado('Todavía no entró');
  const meta = (p) => `${esc(p.rol)} · ${esc(p.horario)}`;
  const aprobarRechazar = (accion, id) => C.btn('Aprobar', { accion, chico: true, data: { id, res: 'si' } }) + C.btn('Rechazar', { accion, tipo: 'sec', chico: true, data: { id, res: 'no' } });

  const hoy = () => {
    const puede = C.puede('aprobar');
    const orden = { sin_fichar: 0, trabajando: 1, no_entro: 2, franco: 3 };
    const lista = [...S.personal].sort((a, b) => orden[a.estado] - orden[b.estado]);
    const alertas = S.personal.filter((p) => p.estado === 'sin_fichar').map((p) => C.nota(
      `<b>${esc(p.nombre)}</b> entraba a las ${esc(inicio(p))} y no fichó. Le llegó un aviso a ${esc(C.primerNombre(p.nombre))} y a administración.`, 'alerta',
      C.btn('Cargar entrada', { accion: 'eq-fichar', tipo: 'sec', chico: true, data: { id: p.id, tipo: 'entrada' } }))).join('');
    const filas = lista.map((p) => C.fila({ lead: C.avatar(p.nombre, 32), titulo: esc(p.nombre), meta: meta(p), lado: estadoDe(p),
      acc: puede && !bloqueada(p) ? C.btn('Dar de baja', { accion: 'eq-baja', tipo: 'fan', chico: true, data: { id: p.id } }) : '' })).join('');
    const quien = S.ui.eqQuien;
    const ficha = `<div class="form"><div class="campo ancho"><label for="eq-quien">Tu nombre</label><select id="eq-quien" data-cambio="eq-quien"><option value="">Elegí tu nombre</option>${S.personal.map((p) => `<option value="${esc(p.id)}" ${p.id === quien ? 'selected' : ''}>${esc(p.nombre)}</option>`).join('')}</select></div>
      <div class="acciones">${C.btn('Entrada', { accion: 'eq-fichar', data: { tipo: 'entrada' } })}${C.btn('Salida', { accion: 'eq-fichar', tipo: 'sec', data: { tipo: 'salida' } })}</div></div>
      <p class="eq-ayuda">También se puede fichar por ubicación desde el celular: al llegar al local se anota la entrada.</p>`;
    return `${alertas}<div class="grid-2">${C.panel({ titulo: 'Hoy', sub: esc(D.hoy), sinPad: true, cuerpo: filas })}${C.panel({ titulo: 'Fichar desde la tablet', cuerpo: ficha })}</div>`;
  };

  const horas = () => {
    const puede = C.puede('aprobar');
    const total = redondo(S.personal.reduce((s, p) => s + p.semana, 0));
    const pend = S.personal.filter(pendiente);
    const extra = redondo(pend.reduce((s, p) => s + p.extra, 0));
    const kpis = C.kpis([{ l: 'Horas de la semana', v: horasTxt(total) }, { l: 'Extra por aprobar', v: horasTxt(extra), tono: extra ? 'aviso' : '' },
      { l: 'Promedio por persona', v: horasTxt(S.personal.length ? total / S.personal.length : 0) }]);
    const aprobar = puede && pend.length ? C.panel({ titulo: 'Horas extra para aprobar', sinPad: true, cuerpo: pend.map((p) => C.fila({ lead: C.avatar(p.nombre, 32), titulo: esc(p.nombre),
      meta: meta(p), lado: `<b>${esc(horasTxt(p.extra))}</b>`, acc: aprobarRechazar('eq-extra', p.id) })).join('') }) : '';
    const tag = (p) => !p.extra ? '' : p.extraEstado === 'aprobada' ? C.estado(`+${horasTxt(p.extra)} aprobadas`, 'ok') : p.extraEstado === 'rechazada' ? C.estado(`${horasTxt(p.extra)} rechazadas`)
      : C.estado(`Incluye ${horasTxt(p.extra)} extra`, 'aviso');
    const filas = S.personal.map((p) => C.fila({ lead: C.avatar(p.nombre, 32), titulo: esc(p.nombre), meta: esc(p.rol), lado: `${tag(p)}<b class="num">${esc(horasTxt(p.semana))}</b>` })).join('')
      + C.fila({ titulo: 'Total del equipo', lado: `<b class="num">${esc(horasTxt(total))}</b>` });
    return kpis + aprobar + C.panel({ titulo: 'Horas por persona', sub: 'esta semana', sinPad: true, cuerpo: filas });
  };

  const libres = () => {
    const puede = C.puede('aprobar');
    const pend = S.pedidosDia.filter((x) => x.estado === 'pendiente');
    const resueltos = S.pedidosDia.filter((x) => x.estado !== 'pendiente');
    const pedido = (x) => C.fila({ lead: C.avatar(nombreDe(x.quien), 32), titulo: `${esc(nombreDe(x.quien))} · ${esc(x.dia)}`, meta: esc(x.motivo),
      lado: x.estado === 'pendiente' ? (puede ? '' : C.estado('Lo aprueba administración', 'aviso')) : x.estado === 'aprobado' ? C.estado('Aprobado', 'ok') : C.estado('Rechazado'),
      acc: x.estado === 'pendiente' && puede ? aprobarRechazar('eq-pedido', x.id) : '' });
    const pedidos = C.panel({ titulo: 'Pedidos de día libre', sinPad: true, cuerpo: pend.concat(resueltos).map(pedido).join('') || C.vacio('No hay pedidos.') });
    const franco = S.personal.filter((p) => p.estado === 'franco');
    const aprobados = S.pedidosDia.filter((x) => x.estado === 'aprobado');
    const quienes = franco.map((p) => C.fila({ lead: C.avatar(p.nombre, 32), titulo: esc(p.nombre), meta: esc(p.rol), lado: C.estado('Franco hoy') }))
      .concat(aprobados.map((x) => C.fila({ lead: C.avatar(nombreDe(x.quien), 32), titulo: esc(nombreDe(x.quien)), meta: esc(x.motivo), lado: C.etiqueta(x.dia) }))).join('');
    const semana = C.panel({ titulo: 'Con franco esta semana', sinPad: true, cuerpo: quienes || C.vacio('Nadie tiene franco ni día libre.') });
    const form = C.panel({ titulo: 'Pedir un día libre', cuerpo: `<form id="eq-pedir-form" class="form" novalidate>
      <div class="campo ancho"><label for="eq-p-quien">Quién</label><select id="eq-p-quien" name="quien">${S.personal.map((p) => `<option value="${esc(p.id)}">${esc(p.nombre)}</option>`).join('')}</select></div>
      <div class="campo ancho"><label for="eq-p-dia">Día</label><select id="eq-p-dia" name="dia">${diasLibres().map((d) => `<option>${esc(d)}</option>`).join('')}</select></div>
      <div class="campo ancho"><label for="eq-p-motivo">Motivo</label><input id="eq-p-motivo" name="motivo" maxlength="80" placeholder="Por ejemplo: trámite personal" autocomplete="off"></div>
      <div class="acciones">${C.btn('Mandar el pedido', { submit: true })}</div></form>` });
    return `<div class="grid-2"><div class="pila">${pedidos}${semana}</div>${form}</div>`;
  };

  C.V.equipo = (param) => {
    const sub = SUBS.some(([k]) => k === param) ? param : 'hoy';
    return C.subtabs('equipo', sub, SUBS) + { hoy, horas, libres }[sub]();
  };
  C.cab.equipo = (param) => param === 'horas' ? C.btn('Bajar planilla', { accion: 'eq-planilla', tipo: 'sec', icono: 'bajar' })
    : C.puede('aprobar') ? C.btn('Sumar persona', { accion: 'eq-sumar', icono: 'mas' }) : '';

  // ---------- Acciones ----------
  const listo = (txt) => { C.guardar(); C.render(); C.aviso(txt); };
  C.cambios['eq-quien'] = (i) => { S.ui.eqQuien = i.value; C.guardar(); };

  C.acciones['eq-fichar'] = (d) => {
    const sel = document.getElementById('eq-quien');
    const p = persona(d.id || (sel && sel.value) || S.ui.eqQuien);
    if (!p) return C.aviso('Primero elegí tu nombre');
    const hora = C.ahora(), nom = C.primerNombre(p.nombre);
    S.ui.eqQuien = p.id;
    if (d.tipo === 'entrada') {
      if (p.estado === 'trabajando' && !p.salida) return C.aviso(`${nom} ya fichó la entrada a las ${p.entrada}`);
      p.estado = 'trabajando'; p.entrada = hora; p.salida = null;
      return listo(`${nom} fichó la entrada a las ${hora}`);
    }
    if (p.estado !== 'trabajando' || p.salida) return C.aviso(`${nom} todavía no fichó la entrada`);
    p.salida = hora;
    listo(`${nom} fichó la salida a las ${hora}`);
  };

  C.acciones['eq-extra'] = (d) => {
    if (!C.puede('aprobar')) return C.aviso('Las horas extra las aprueba Administración');
    const p = persona(d.id); if (!p || !pendiente(p)) return;
    const si = d.res === 'si';
    p.extraEstado = si ? 'aprobada' : 'rechazada'; // Inicio lee este campo
    listo(si ? `Aprobaste ${horasTxt(p.extra)} extra de ${C.primerNombre(p.nombre)}` : `Rechazaste las horas extra de ${C.primerNombre(p.nombre)}: no pasan a la planilla`);
  };

  C.acciones['eq-pedido'] = (d) => {
    if (!C.puede('aprobar')) return C.aviso('Los días libres los aprueba Administración');
    const x = S.pedidosDia.find((y) => y.id === d.id); if (!x || x.estado !== 'pendiente') return;
    x.estado = d.res === 'si' ? 'aprobado' : 'rechazado';
    listo(`${x.estado === 'aprobado' ? 'Aprobaste' : 'Rechazaste'} el día libre de ${C.primerNombre(nombreDe(x.quien))} (${x.dia})`);
  };

  C.acciones['eq-planilla'] = () => {
    const url = URL.createObjectURL(new Blob([csv(S.personal)], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url; a.download = `planilla-horas-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    C.aviso('Bajó la planilla de horas (CSV)');
  };

  C.formularios['eq-pedir-form'] = (fd) => {
    const quien = fd.get('quien'), dia = fd.get('dia'), motivo = limpio(fd.get('motivo'));
    if (!persona(quien)) return C.aviso('Elegí quién pide el día');
    if (!diasLibres().includes(dia)) return C.aviso('Elegí un día de la lista');
    if (motivo.length < 3 || motivo.length > 80) return C.aviso('Contá el motivo en pocas palabras (entre 3 y 80 letras)');
    if (S.pedidosDia.some((x) => x.quien === quien && x.dia === dia && x.estado !== 'rechazado')) return C.aviso('Ya hay un pedido de esa persona para ese día');
    S.pedidosDia.push({ id: 'p' + Date.now().toString(36), quien, dia, motivo, estado: 'pendiente' });
    listo('Pedido enviado: lo ve administración y le llega un aviso por correo');
  };

  // Alta: modal con el formulario. Con el correo se crea el usuario (simulado).
  C.acciones['eq-sumar'] = () => {
    if (!C.puede('aprobar')) return C.aviso('Solo Administración o Dueño suman gente');
    C.modal(`<h3>Sumar persona</h3><p class="modal-sub">Con el correo se crea su usuario y le llegan los avisos. En la demo es simulado.</p>
      <form id="eq-alta-form" class="form" novalidate>
        <div class="campo ancho"><label for="eq-a-nombre">Nombre y apellido</label><input id="eq-a-nombre" name="nombre" maxlength="60" autocomplete="off"></div>
        <div class="campo ancho"><label for="eq-a-puesto">Puesto</label><select id="eq-a-puesto" name="puesto">${PUESTOS.map((p) => `<option>${esc(p)}</option>`).join('')}</select></div>
        <div class="campo"><label for="eq-a-desde">Entra a las</label><input id="eq-a-desde" name="desde" type="time" value="08:00"></div>
        <div class="campo"><label for="eq-a-hasta">Sale a las</label><input id="eq-a-hasta" name="hasta" type="time" value="16:00"></div>
        <div class="campo ancho"><label for="eq-a-correo">Correo</label><input id="eq-a-correo" name="correo" type="email" maxlength="80" placeholder="nombre@cumbre.com" autocomplete="off"></div>
        <p class="eq-error" id="eq-error" role="alert"></p>
        <div class="acciones">${C.btn('Sumar al equipo', { submit: true })}${C.btn('Cancelar', { tipo: 'fan', data: { cerrar: '' } })}</div></form>`);
  };
  C.formularios['eq-alta-form'] = (fd) => {
    const falla = (txt) => { const el = document.getElementById('eq-error'); if (el) el.textContent = txt; else C.aviso(txt); };
    if (!C.puede('aprobar')) return falla('Solo Administración o Dueño suman gente');
    const d = { nombre: limpio(fd.get('nombre')), puesto: fd.get('puesto'), desde: fd.get('desde'), hasta: fd.get('hasta'), correo: limpio(fd.get('correo')).toLowerCase() };
    const error = validarAlta(d, S.personal);
    if (error) return falla(error);
    S.personal.push({ id: 'u' + Date.now().toString(36), nombre: d.nombre, rol: d.puesto, horario: `${d.desde} a ${d.hasta}`, entrada: null, estado: 'no_entro', semana: 0, extra: 0, correo: d.correo });
    C.cerrarModal();
    listo(`${C.primerNombre(d.nombre)} ya está en el equipo. Se le creó el usuario con ${d.correo} (simulado)`);
  };

  // La baja se confirma antes
  C.acciones['eq-baja'] = (d) => {
    if (!C.puede('aprobar')) return C.aviso('Solo Administración o Dueño dan de baja');
    const p = persona(d.id); if (!p) return;
    if (p.id === D.usuario.id) return C.aviso('No podés darte de baja desde tu propio usuario');
    if (bloqueada(p)) return C.aviso(`${C.primerNombre(p.nombre)} tiene transfers o trabajos del taller asignados: pasalos a otra persona primero`);
    C.modal(`<h3>Dar de baja a ${esc(p.nombre)}</h3><p class="modal-sub">Deja de aparecer en el fichaje y en la planilla de horas. Se borran sus pedidos de día libre que siguen abiertos.</p>
      <div class="acciones">${C.btn('Sí, dar de baja', { accion: 'eq-baja-ok', data: { id: p.id } })}${C.btn('Cancelar', { tipo: 'fan', data: { cerrar: '' } })}</div>`);
  };
  C.acciones['eq-baja-ok'] = (d) => {
    const p = persona(d.id); C.cerrarModal();
    if (!p || !C.puede('aprobar') || bloqueada(p)) return;
    S.personal = S.personal.filter((x) => x.id !== p.id);
    S.pedidosDia = S.pedidosDia.filter((x) => x.quien !== p.id || x.estado !== 'pendiente');
    if (S.ui.eqQuien === p.id) S.ui.eqQuien = '';
    listo(`${p.nombre} salió del equipo`);
  };
})(window.CUADRA);
