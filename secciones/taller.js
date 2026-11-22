// Taller de Cuadra · Rentals. Pensado para el celular o la tablet del tallerista: botones grandes y lo urgente arriba.
(function (C) {
  const { S, D, esc } = C;
  const PAGINA = 12;
  const lugares = () => D.ubicaciones.filter((u) => u !== 'Taller');
  const minTxt = (m) => (m < 60 ? `${m} min` : `${Math.floor(m / 60)} h${m % 60 ? ` ${m % 60} min` : ''}`);
  const quien = (id) => { const p = D.personal.find((x) => x.id === id); return p ? C.primerNombre(p.nombre) : 'Nadie todavía'; };
  const gamaDeOrden = (o) => (C.equipo(o.equipo) || {}).gama;
  const ordenPorId = (id) => S.taller.find((o) => o.id === id);
  // Las que ya están en marcha primero, y después las más cortas (salen más tablas por hora)
  const porRapidez = (a, b) => (b.estado === 'haciendo') - (a.estado === 'haciendo') || a.min - b.min || a.equipo - b.equipo;
  // Lugar sugerido para dejarla, según la gama (el mismo criterio con que se guardan al armar el stock)
  const sugerido = (e) => (e ? D.ubicaciones[e.gama === 'estandar' ? (e.n < 170 ? 0 : 1) : e.gama === 'premium' ? 2 : 3] : D.ubicaciones[0]);

  // Para cada gama que falta mañana: qué órdenes conviene sacar primero
  function prioridades(man) {
    const p = {};
    man.filter((m) => m.faltan > 0).forEach((m) => {
      const ords = S.taller.filter((o) => gamaDeOrden(o) === m.gama.id).sort(porRapidez);
      p[m.gama.id] = { gama: m.gama, ords: ords.slice(0, m.faltan), sinCubrir: Math.max(0, m.faltan - ords.length) };
    });
    return p;
  }

  function manana(man, pri) {
    const filas = man.map((m) => C.fila({
      titulo: C.marca(m.gama.id),
      meta: `retiran ${m.retiran} · hacen falta ${m.necesita} · listas ${m.listas}`,
      lado: m.faltan ? C.estado(`Faltan ${m.faltan}`, 'alerta') : C.estado('Alcanza', 'ok')
    })).join('');
    const lista = Object.values(pri).map((p) => `<b>${esc(p.gama.nombre)}</b> ${p.ords.length ? p.ords.map((o) => `#${o.equipo}`).join(', ') : 'ninguna en el taller'}${p.sinCubrir ? ` (faltan ${p.sinCubrir} más)` : ''}`).join(' · ');
    return C.panel({ titulo: 'Para mañana', sub: `con ${Math.round(D.margen * 100)} % de margen`, sinPad: true, cuerpo: filas })
      + (lista ? C.nota(`Terminá primero: ${lista}`, 'alerta') : '');
  }

  function fila(o, lectura, urgente) {
    const e = C.equipo(o.equipo), haciendo = o.estado === 'haciendo';
    const meta = [e ? `${esc(e.marca)} ${esc(e.modelo)}` : '', `La tiene ${esc(quien(o.quien))}`, `desde ${esc(o.desde || o.entro)}`, o.nota ? esc(o.nota) : ''].filter(Boolean).join(' · ');
    return C.fila({
      cls: 'tal-f', lead: C.placa(o.equipo, true),
      titulo: `${esc(o.trabajo)} · ${o.min} min`, meta,
      lado: `${urgente ? C.etiqueta('Para mañana', 'alerta') : ''}${haciendo ? C.estado('Haciendo', 'info') : C.estado('En cola')}`,
      acc: lectura ? '' : `${haciendo ? '' : C.btn('Empezar', { accion: 'tal-empezar', tipo: 'sec', data: { id: o.id } })}${C.btn('Terminar', { accion: 'tal-terminar', data: { id: o.id } })}`
    });
  }

  C.V.taller = () => {
    const lectura = !C.puede('taller');
    const man = C.paraManana(), pri = prioridades(man);
    const cola = S.taller;
    const urgentes = new Set(Object.values(pri).flatMap((p) => p.ords.map((o) => o.id)));
    const rango = (o) => (urgentes.has(o.id) ? 0 : pri[gamaDeOrden(o)] ? 1 : o.estado === 'haciendo' ? 2 : 3);
    const ordenadas = [...cola].sort((a, b) => rango(a) - rango(b) || porRapidez(a, b));
    const minutos = cola.reduce((s, o) => s + o.min, 0);
    const n = S.ui.talMas || PAGINA;
    return (lectura ? C.nota('Solo lectura: tu puesto ve el taller, pero no empieza ni termina trabajos.') : '')
      + manana(man, pri)
      + C.kpis([
        { l: 'En cola', v: cola.filter((o) => o.estado !== 'haciendo').length },
        { l: 'Haciendo', v: cola.filter((o) => o.estado === 'haciendo').length },
        { l: 'Trabajo pendiente', v: minTxt(minutos) },
        { l: 'Entraron / salieron hoy', v: `${S.tallerHoy.entraron} / ${S.tallerHoy.salieron}` }
      ])
      + C.panel({
        titulo: 'Cola de trabajo', sub: `${cola.length} ${cola.length === 1 ? 'tabla' : 'tablas'}`, sinPad: true,
        cuerpo: (ordenadas.slice(0, n).map((o) => fila(o, lectura, urgentes.has(o.id))).join('') || C.vacio('No hay nada en el taller. Todo al día.'))
          + (ordenadas.length > n ? `<button type="button" class="mas-link" data-accion="tal-mas" data-n="${n + PAGINA}">Ver más (quedan ${ordenadas.length - n})</button>` : '')
      });
  };
  C.cab.taller = () => (C.puede('taller') ? C.btn('Ingresar tabla', { accion: 'tal-ingresar', icono: 'mas' }) : '');

  // ---------- Acciones ----------
  C.acciones['tal-mas'] = (d) => { S.ui.talMas = +d.n; C.guardar(); C.render(); };

  C.acciones['tal-empezar'] = (d) => {
    const o = ordenPorId(d.id);
    if (!C.puede('taller') || !o) return;
    o.estado = 'haciendo'; o.desde = C.ahora();
    C.guardar(); C.render(); C.aviso(`Empezaste la ${o.equipo}: ${o.trabajo}`);
  };

  C.acciones['tal-terminar'] = (d) => {
    const o = ordenPorId(d.id);
    if (!C.puede('taller') || !o) return;
    const e = C.equipo(o.equipo), pref = sugerido(e);
    C.modal(`<h3>Terminar la ${o.equipo}</h3><p class="modal-sub">${esc(o.trabajo)} listo. Anotá dónde la dejás para encontrarla después.</p>
      <form id="tal-terminar" class="form" novalidate>
        <div class="campo ancho"><label for="tal-ubic">Dónde la dejás</label><select id="tal-ubic" name="ubic">${lugares().map((l) => `<option ${l === pref ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></div>
        <input type="hidden" name="id" value="${esc(o.id)}">
        <div class="acciones">${C.btn('Listo, la dejé ahí', { submit: true })}<button type="button" class="btn fan" data-cerrar>Cancelar</button></div></form>`);
  };

  C.formularios['tal-terminar'] = (f) => {
    const o = ordenPorId(f.get('id')), ubic = f.get('ubic');
    if (!C.puede('taller') || !o || !lugares().includes(ubic)) { C.cerrarModal(); return C.aviso('No se pudo terminar: elegí un lugar de la lista'); }
    const n = o.equipo;
    C.terminarTaller(o.id, ubic);
    C.cerrarModal(); C.render(); C.aviso(`La ${n} está lista y guardada en ${ubic}`);
  };

  C.acciones['tal-ingresar'] = () => {
    if (!C.puede('taller')) return;
    const libres = S.equipos.filter((e) => e.estado === 'disponible');
    const taller = D.personal.filter((p) => p.rol === 'Taller');
    C.modal(`<h3>Ingresar una tabla al taller</h3><p class="modal-sub">Solo entran las que están libres (${libres.length} ahora).</p>
      <form id="tal-ingreso" class="form" novalidate>
        <div class="campo"><label for="tal-n">Número de la tabla</label><input id="tal-n" name="numero" inputmode="numeric" list="tal-libres" placeholder="Por ejemplo 250" autocomplete="off">
          <datalist id="tal-libres">${libres.map((e) => `<option value="${e.n}">${esc(e.marca)} ${esc(e.modelo)}</option>`).join('')}</datalist></div>
        <div class="campo"><label for="tal-t">Trabajo</label><select id="tal-t" name="trabajo">${D.trabajos.map((t) => `<option value="${esc(t[0])}">${esc(t[0])} (${t[1]} min)</option>`).join('')}</select></div>
        <div class="campo"><label for="tal-q">Quién lo hace</label><select id="tal-q" name="quien">${taller.map((p) => `<option value="${esc(p.id)}">${esc(p.nombre)}</option>`).join('')}</select></div>
        <div class="campo"><label for="tal-o">Nota (si hace falta)</label><input id="tal-o" name="nota" maxlength="80" placeholder="Por ejemplo golpe en el canto" autocomplete="off"></div>
        <p class="stk-err" data-error role="alert"></p>
        <div class="acciones">${C.btn('Ingresar al taller', { submit: true })}<button type="button" class="btn fan" data-cerrar>Cancelar</button></div></form>`);
  };

  C.formularios['tal-ingreso'] = (f, form) => {
    const error = (txt) => { const p = form.querySelector('[data-error]'); if (p) p.textContent = txt; };
    if (!C.puede('taller')) return error('Tu puesto no puede ingresar tablas al taller.');
    const txt = String(f.get('numero') || '').trim();
    if (!/^\d+$/.test(txt)) return error('Poné el número de la tabla, solo cifras.');
    const n = parseInt(txt, 10), e = C.equipo(n), t = D.trabajos.find((x) => x[0] === f.get('trabajo'));
    if (!e) return error(`No existe la tabla ${n}.`);
    if (e.estado !== 'disponible') return error(`La ${n} está ${e.estado === 'taller' ? 'ya en el taller' : 'alquilada'}: solo entran las libres.`);
    if (!t) return error('Elegí el trabajo.');
    const q = D.personal.find((p) => p.id === f.get('quien') && p.rol === 'Taller');
    if (!q) return error('Elegí quién lo hace.');
    e.estado = 'taller'; e.ubic = 'Taller';
    S.taller.push({ id: 'o' + Date.now(), equipo: n, trabajo: t[0], min: t[1], estado: 'en_cola', quien: q.id, entro: C.ahora(), nota: String(f.get('nota') || '').trim().slice(0, 80) });
    S.tallerHoy.entraron++;
    C.guardar(); C.cerrarModal(); C.render();
    const falta = C.paraManana().find((m) => m.gama.id === e.gama && m.faltan > 0);
    C.aviso(`La ${n} entró al taller: ${t[0]}.${falta ? ` Ojo: ${falta.gama.nombre} ya falta para mañana.` : ''}`);
  };
})(window.CUADRA);
