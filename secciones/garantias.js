// Garantías: plata retenida de cada alquiler, qué se rompió y si se arregló. El cobro real es simulado en la demo.
// Cada daño: {que, costo, arreglado, equipo}. g.danio guarda el último (lo mira C.devolver para no liberar con daño); g.danios, la lista.
(function (C) {
  const { S, esc } = C;
  const plata = C.plata;
  const ESTADO = { retenida: ['Retenida', 'info'], vence_hoy: ['Vence hoy', 'alerta'], liberada: ['Liberada', 'ok'], cobrada: ['Cobrada', ''] };
  const ORDEN = { vence_hoy: 0, retenida: 1, cobrada: 2, liberada: 3 };
  const CORTE = 6;
  const activa = (g) => g.estado === 'retenida' || g.estado === 'vence_hoy';
  const lectura = () => !C.puede('caja');
  // Las garantías de una reserva sacan monto y equipos de la reserva; las viejas los traen propios
  const datos = (g) => {
    const r = g.reserva && C.reserva(g.reserva);
    return { monto: r ? C.garantiaReserva(r) : g.monto || 0, equipos: r ? r.personas.map((p) => p.equipo).filter(Boolean) : g.equipos || [] };
  };
  const danios = (g) => g.danios || (g.danio ? [g.danio] : []);
  const equipoDe = (g, d) => d.equipo || (datos(g).equipos.length === 1 ? datos(g).equipos[0] : null);
  const puso = (g, d) => Math.min(d.costo || 0, datos(g).monto); // la persona no pone más que la garantía
  const buscar = (id) => S.garantias.find((g) => g.id === id);
  const refrescar = (txt) => { C.guardar(); C.render(); C.aviso(txt); };
  const mas = (clave, resto) => `<button type="button" class="mas-link" data-accion="gar-mas" data-clave="${clave}">Ver más (${resto})</button>`;

  const botones = (g) => lectura() ? '' : [
    activa(g) ? C.btn('Liberar', { accion: 'gar-liberar', tipo: 'sec', chico: true, data: { id: g.id } }) + C.btn('Cobrar', { accion: 'gar-cobrar', tipo: 'sec', chico: true, data: { id: g.id } }) : '',
    C.btn('Anotar daño', { accion: 'gar-danio', tipo: 'fan', chico: true, data: { id: g.id } })
  ].join('');

  function fila(g) {
    const { monto, equipos } = datos(g);
    const [txt, tono] = ESTADO[g.estado] || [g.estado, ''];
    const placas = equipos.length ? `<span class="gar-placas">${equipos.map((n) => C.placa(n)).join('')}</span>` : 'sin equipos todavía';
    return C.fila({
      lead: C.avatar(g.cliente, 32), titulo: esc(g.cliente),
      meta: `${esc(g.tarjeta)} · ${placas} · del ${esc(g.desde)} al ${esc(g.vence)}`,
      lado: `<b>${plata(monto)}</b>${C.estado(txt, tono)}`, acc: botones(g), cls: g.estado === 'vence_hoy' ? 'resalta' : ''
    });
  }

  function filaDanio({ g, d, k }) {
    const n = equipoDe(g, d);
    const acc = lectura() ? '' : C.btn(d.arreglado ? 'Reabrir' : 'Marcar arreglado', { accion: 'gar-arreglado', tipo: d.arreglado ? 'fan' : 'sec', chico: true, data: { id: g.id, i: k } });
    return C.fila({
      lead: n ? C.placa(n) : '', titulo: esc(d.que),
      meta: `${esc(g.cliente)} · arreglo ${plata(d.costo || 0)} · puso ${plata(puso(g, d))}`,
      lado: C.estado(d.arreglado ? 'Arreglado' : 'Pendiente', d.arreglado ? 'ok' : 'aviso'), acc
    });
  }

  C.V.garantias = () => {
    const act = S.garantias.filter(activa);
    const hoy = S.garantias.filter((g) => g.estado === 'vence_hoy');
    const roto = S.garantias.flatMap((g) => danios(g).map((d, k) => ({ g, d, k })));
    const sinArreglar = roto.filter((x) => !x.d.arreglado).length;
    const lista = [...S.garantias].sort((a, b) => (ORDEN[a.estado] ?? 9) - (ORDEN[b.estado] ?? 9));
    const ver = S.ui.garTodas ? lista : lista.slice(0, CORTE);
    const rotos = [...roto].sort((a, b) => !a.d.arreglado === !b.d.arreglado ? 0 : a.d.arreglado ? 1 : -1);
    const verRotos = S.ui.garDanios ? rotos : rotos.slice(0, CORTE);
    return `${C.kpis([
      { l: 'Retenido hoy', v: plata(act.reduce((s, g) => s + datos(g).monto, 0)) },
      { l: 'Activas', v: act.length },
      { l: 'Vence hoy', v: hoy.length, tono: hoy.length ? 'alerta' : '' },
      { l: 'Daños sin arreglar', v: sinArreglar, tono: sinArreglar ? 'aviso' : '' }
    ])}
      ${hoy.map((g) => C.nota(`Vence hoy la de ${esc(g.cliente)}: si nadie la revisa, se cobra.`, 'alerta', lectura() ? '' : C.btn('Liberar', { accion: 'gar-liberar', chico: true, data: { id: g.id } }) + C.btn('Cobrar', { accion: 'gar-cobrar', tipo: 'sec', chico: true, data: { id: g.id } }))).join('')}
      ${C.panel({ titulo: 'Garantías', sinPad: true, cuerpo: (ver.map(fila).join('') || C.vacio('No hay garantías.')) + (ver.length < lista.length ? mas('garTodas', lista.length - ver.length) : '') })}
      ${C.panel({ titulo: 'Lo que se rompió', sinPad: true, cuerpo: (verRotos.map(filaDanio).join('') || C.vacio('Todavía no se anotó ningún daño.')) + (verRotos.length < rotos.length ? mas('garDanios', rotos.length - verRotos.length) : '') })}
      ${C.nota('En la demo la liberación y el cobro son simulados: no sale plata de ningún lado. En la instalación, el cobro real se conecta con el procesador de pagos.')}`;
  };

  C.acciones['gar-mas'] = (d) => { S.ui[d.clave] = true; C.guardar(); C.render(); };
  C.acciones['gar-liberar'] = (d) => {
    const g = buscar(d.id);
    if (lectura() || !g || !activa(g)) return;
    g.estado = 'liberada';
    refrescar(`Garantía de ${C.primerNombre(g.cliente)} liberada: ${plata(datos(g).monto)} vuelven a su tarjeta (simulado)`);
  };
  C.acciones['gar-cobrar'] = (d) => {
    const g = buscar(d.id);
    if (lectura() || !g || !activa(g)) return;
    C.modal(`<h3>Cobrar la garantía</h3><p class="modal-sub">Se cobran <b>${plata(datos(g).monto)}</b> a la tarjeta de ${esc(g.cliente)} (${esc(g.tarjeta)}). En la demo es simulado.</p>
      <div class="acciones">${C.btn('Sí, cobrar', { accion: 'gar-cobrar-ok', data: { id: g.id } })}<button type="button" class="btn fan" data-cerrar>Cancelar</button></div>`);
  };
  C.acciones['gar-cobrar-ok'] = (d) => {
    const g = buscar(d.id);
    C.cerrarModal();
    if (lectura() || !g || !activa(g)) return;
    g.estado = 'cobrada';
    refrescar(`Garantía de ${C.primerNombre(g.cliente)} cobrada: ${plata(datos(g).monto)} (simulado)`);
  };
  C.acciones['gar-arreglado'] = (d) => {
    const g = buscar(d.id), x = g && danios(g)[+d.i];
    if (lectura() || !x) return;
    x.arreglado = !x.arreglado;
    g.danios = danios(g); g.danio = g.danios[g.danios.length - 1]; // sin esto, tras recargar, danio y danios quedan como copias distintas
    refrescar(x.arreglado ? 'Anotado como arreglado' : 'Vuelve a figurar como pendiente');
  };
  C.acciones['gar-danio'] = (d) => {
    const g = buscar(d.id);
    if (lectura() || !g) return;
    const eqs = datos(g).equipos;
    C.modal(`<h3>Anotar daño</h3><p class="modal-sub">${esc(g.cliente)} · garantía de ${plata(datos(g).monto)}</p>
      <form id="gar-form-danio" class="form"><input type="hidden" name="id" value="${esc(g.id)}">
        <div class="campo ancho"><label for="gd-eq">Equipo</label><select id="gd-eq" name="equipo">${eqs.length ? eqs.map((n) => `<option value="${esc(n)}">#${esc(n)} · ${esc(C.nombreEquipo(C.equipo(n)))}</option>`).join('') : '<option value="">Sin número asignado</option>'}</select></div>
        <div class="campo ancho"><label for="gd-que">Qué se rompió</label><input id="gd-que" name="que" maxlength="80" required placeholder="Por ejemplo: base rayada"></div>
        <div class="campo ancho"><label for="gd-costo">Costo del arreglo ($)</label><input id="gd-costo" name="costo" inputmode="numeric" maxlength="12" required placeholder="0 si no tuvo costo"></div>
        <label class="gar-check"><input type="checkbox" name="arreglado"> Ya está arreglado</label>
        <div class="acciones">${C.btn('Guardar daño', { submit: true })}<button type="button" class="btn fan" data-cerrar>Cancelar</button></div></form>`);
  };
  C.formularios['gar-form-danio'] = (fd) => {
    const g = buscar(String(fd.get('id')));
    if (lectura() || !g) return;
    const que = String(fd.get('que') || '').trim(), txt = String(fd.get('costo') || '').trim();
    if (!que) return C.aviso('Contá qué se rompió');
    if (que.length > 80) return C.aviso('Escribí menos de 80 letras');
    if (!/^[\d.\s$]+$/.test(txt)) return C.aviso('El costo va solo con números (0 si no tuvo costo)');
    const costo = C.numero(txt);
    if (costo > 99999999) return C.aviso('Ese costo es demasiado alto');
    const eq = C.numero(fd.get('equipo'));
    if (eq && !datos(g).equipos.includes(eq)) return C.aviso('Ese equipo no es de esta garantía');
    const nuevo = { que, costo, arreglado: fd.get('arreglado') === 'on', equipo: eq || null };
    g.danios = danios(g).concat(nuevo); g.danio = nuevo;
    C.cerrarModal();
    refrescar('Daño anotado');
  };
})(window.CUADRA);
