// Inicio de Cuadra · Rentals: qué hay que hacer ahora y cómo viene mañana.
(function (C) {
  const { S, D, esc } = C;
  const TOPE = 6, HOY = '18/07';
  const min = (hhmm) => { const [h, m] = String(hhmm).split(':'); return +h * 60 + +m; };
  const nPers = (n) => `${n} ${n === 1 ? 'persona' : 'personas'}`;
  const personasDe = (gid) => C.reservasDe(gid).reduce((s, r) => s + r.personas.length, 0);
  const ocupados = (t) => t.reservas.reduce((s, id) => s + (C.reserva(id) ? C.reserva(id).personas.length : 0), 0);
  const fmtH = (h) => `${String(h).replace('.', ',')} h`;
  const si = (id, hash) => (C.visible(id) ? hash : '');

  C.V.inicio = () => {
    const P = C.paraManana();
    const faltan = P.reduce((s, x) => s + x.faltan, 0);
    const espera = S.espera.filter((e) => C.grupo(e.grupo));
    const hrefManana = si('taller', '#/taller') || si('stock', '#/stock');

    // ---- Cuatro cifras ----
    const caja = C.visible('caja');
    const netoCaja = S.movimientos.reduce((s, m) => s + m.monto, 0);
    const deHoy = S.reservas.filter((r) => r.estado === 'retira_hoy' || r.estado === 'devuelve_hoy').length;
    const kpis = C.kpis([
      { l: 'Faltan para mañana', v: faltan, s: faltan ? 'tablas por preparar' : 'Todo listo', tono: faltan ? 'alerta' : 'ok', href: hrefManana },
      { l: 'Tablas libres', v: C.contar().disponible, s: `de ${C.contar().total}`, href: si('stock', '#/stock') },
      { l: 'Esperando en el local', v: espera.reduce((s, e) => s + personasDe(e.grupo), 0), s: `${espera.length} ${espera.length === 1 ? 'grupo' : 'grupos'}`, href: si('reservas', '#/reservas/espera') },
      caja ? { l: 'Caja de hoy', v: C.plata(netoCaja), s: 'neto', href: '#/caja' }
        : { l: 'Reservas de hoy', v: deHoy, s: 'retiran o devuelven', href: si('reservas', '#/reservas/hoy') }
    ]);

    // ---- Para hacer ahora: en orden de urgencia ----
    const tareas = [];
    const tarea = (t, m, e, href) => tareas.push({ t, m, e, href });
    if (C.visible('reservas')) {
      espera.forEach(({ grupo, llegada }) => {
        const hace = Math.max(0, min(D.hora) - min(llegada));
        tarea(`${C.grupo(grupo).nombre} espera en el local`, `${nPers(personasDe(grupo))} · hace ${hace} min`, C.estado('En el local', hace >= 25 ? 'alerta' : 'aviso'), '#/reservas/espera');
      });
      const sinFirma = S.reservas.filter((r) => r.estado === 'retira_hoy').reduce((s, r) => s + r.personas.filter((p) => !p.contrato).length, 0);
      if (sinFirma) tarea(`${sinFirma} ${sinFirma === 1 ? 'contrato sin firmar' : 'contratos sin firmar'}`, 'De quienes retiran hoy', C.estado('Falta firmar', 'aviso'), '#/reservas/hoy');
      S.reservas.filter((r) => r.estado === 'devuelve_hoy').forEach((r) => {
        const n = r.personas.filter((p) => p.equipo && !p.devuelto).length, g = C.grupo(r.grupo);
        if (n) tarea(`${g ? g.nombre : 'Un grupo'} devuelve hoy`, `${n} ${n === 1 ? 'tabla' : 'tablas'} para recibir`, C.estado('Devuelve hoy', 'info'), '#/reservas/hoy');
      });
    }
    P.filter((x) => x.faltan).forEach((x) => tarea(`Faltan ${x.faltan} de ${x.gama.nombre.toLowerCase()} para mañana`, `Hay ${x.listas} listas y hacen falta ${x.necesita}`, C.estado('Mañana', 'alerta'), hrefManana));
    if (C.visible('garantias')) S.garantias.filter((g) => g.estado === 'vence_hoy').forEach((g) => tarea(`La garantía de ${g.cliente} vence hoy`, 'Si nadie la revisa, se cobra', C.estado('Vence hoy', 'alerta'), '#/garantias'));
    if (C.visible('equipo')) S.personal.filter((p) => p.estado === 'sin_fichar').forEach((p) => tarea(`${p.nombre} no fichó`, `Tenía que entrar a las ${p.horario.split(' ')[0]}`, C.estado('Sin fichar', 'aviso'), '#/equipo'));
    if (C.visible('equipo') && C.puede('aprobar')) {
      const ex = S.personal.filter((p) => p.extra > 0 && !p.extraEstado);
      if (ex.length) tarea('Horas extra para aprobar', ex.map((p) => `${C.primerNombre(p.nombre)} (${fmtH(p.extra)})`).join(' y '), C.estado('Para aprobar', 'aviso'), '#/equipo');
    }
    const ver = S.ui.iniTodas ? tareas : tareas.slice(0, TOPE);
    const filasTareas = ver.map((x) => C.fila({ titulo: esc(x.t), meta: esc(x.m), lado: x.e, href: x.href })).join('')
      + (tareas.length > ver.length ? `<button type="button" class="mas-link" data-accion="ini-todas">Ver todas (${tareas.length})</button>` : '');
    const hacer = C.panel({ titulo: 'Para hacer ahora', sinPad: true, cuerpo: tareas.length ? `<div class="lista">${filasTareas}</div>` : C.vacio('No hay nada pendiente por ahora.') });

    // ---- Mañana y transfers ----
    const manana = C.panel({
      titulo: 'Mañana', sinPad: true, acciones: hrefManana ? C.btn('Ver', { href: hrefManana, tipo: 'fan', chico: true }) : '',
      cuerpo: `<div class="lista">${P.map((x) => C.fila({
        titulo: C.marca(x.gama.id), meta: `retiran ${x.retiran} · hacen falta ${x.necesita} · listas ${x.listas}`,
        lado: x.faltan ? C.estado(`Faltan ${x.faltan}`, 'alerta') : C.estado('Alcanza', 'ok')
      })).join('')}</div>`
    });
    // ---- Pruebas de hoy: quién viene a probarse y qué hay que tener preparado ----
    const pruebas = C.visible('reservas') ? S.reservas.filter((r) => r.estado === 'manana' && r.prueba && r.prueba.dia === HOY).sort((a, b) => min(a.prueba.hora) - min(b.prueba.hora)) : [];
    const preparar = (r) => {
      const m = new Map();
      r.personas.forEach((p) => { const k = `${p.tipo.toLowerCase()} ${C.gama(p.gama).nombre.toLowerCase()}`; m.set(k, (m.get(k) || 0) + 1); });
      return [...[...m].map(([k, n]) => `${n} ${k}`), ...(r.extras || []).map((x) => `${x.cant} ${(x.cant === 1 ? x.nombre : x.pl || x.nombre).toLowerCase()}`)].join(' · ');
    };
    const pruebasP = !pruebas.length ? '' : C.panel({
      titulo: 'Pruebas de equipos de hoy', sinPad: true,
      cuerpo: `<div class="lista">${pruebas.map((r) => {
        const g = C.grupo(r.grupo), listas = r.personas.filter((p) => p.equipo).length;
        return C.fila({
          lead: C.icono('reloj', 20), titulo: `${esc(r.prueba.hora)} · ${esc(g ? g.nombre : 'Grupo')}`, meta: `Preparar: ${esc(preparar(r))}`,
          lado: C.estado(`${listas} de ${r.personas.length} listas`, listas === r.personas.length ? 'ok' : 'aviso'),
          acc: C.btn('Ver', { accion: 'res-ver', tipo: 'sec', chico: true, data: { id: r.grupo } })
        });
      }).join('')}</div>`
    });
    const transfers = C.panel({
      titulo: 'Transfers de hoy', sinPad: true,
      cuerpo: S.transfers.length ? `<div class="lista">${S.transfers.slice(0, 3).map((t) => C.fila({
        lead: C.icono('combi', 20), titulo: `${esc(t.hora)} · ${esc(t.desde)} a ${esc(t.hacia)}`, meta: `${ocupados(t)} de ${t.lugares} lugares`,
        lado: t.estado === 'hecho' ? C.estado('Hecho', 'ok') : C.estado('Próximo', 'info'), href: si('reservas', '#/reservas/hoy')
      })).join('')}</div>` : C.vacio('Hoy no hay transfers.')
    });

    return `${kpis}<div class="grid-2">${hacer}<div class="pila ini-pila">${pruebasP}${manana}${transfers}</div></div>`;
  };

  C.acciones['ini-todas'] = () => { S.ui.iniTodas = true; C.guardar(); C.render(); };
})(window.CUADRA);
