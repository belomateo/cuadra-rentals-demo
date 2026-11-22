// Clientes: de dónde vienen, quiénes vuelven y un público listo para campañas (simulado).
// Filtros guardados en S.ui.buscaCli (el buscador de arriba del núcleo también lo usa) y S.ui.cliOrigen.
(function (C) {
  const { S, D, esc } = C;
  const plata = C.plata;
  const VUELVE = 3; // visitas para contar como que vuelve
  const ARGENTINA = ['Buenos Aires', 'Zona centro'];
  const CORTE = 8;
  const vuelve = (c) => c.visitas >= VUELVE;
  const mas = (clave, resto) => `<button type="button" class="mas-link" data-accion="cli-mas" data-clave="${clave}">Ver más (${resto})</button>`;

  // Cuántos clientes hay de un origen y el texto listo para la campaña
  const publico = (origen) => {
    const l = D.clientes.filter((c) => c.origen === origen);
    const pct = (D.origenes.find((o) => o[0] === origen) || [0, 0])[1];
    const lugar = origen === 'Otros' ? 'otros lugares' : origen;
    return { n: l.length, texto: `Público: clientes de ${lugar} de las últimas 2 temporadas (${pct} de cada 100 clientes). Incluye ${l.filter(vuelve).length} que vuelven seguido. Para avisarles cuando abren las reservas de la próxima temporada y para mostrar anuncios a gente parecida. Dejar afuera a los que ya reservaron esta temporada.` };
  };

  function fila(c) {
    return C.fila({
      lead: C.avatar(c.nombre, 32), titulo: esc(c.nombre),
      meta: `${esc(c.ciudad)} · ${esc(c.origen)} · ${esc(c.alquilo)} · última vez ${esc(c.ultima)}`,
      lado: `<b>${plata(c.gasto)}</b>${vuelve(c) ? C.etiqueta('Vuelve', 'ok') : ''}`
    });
  }

  C.V.clientes = () => {
    const todos = D.clientes, vuelven = todos.filter(vuelve).sort((a, b) => b.visitas - a.visitas);
    const q = C.norm(S.ui.buscaCli).trim(), o = D.origenes.some((x) => x[0] === S.ui.cliOrigen) ? S.ui.cliOrigen : '';
    const lista = todos.filter((c) => (!o || c.origen === o) && (!q || C.norm(`${c.nombre} ${c.ciudad} ${c.alquilo}`).includes(q))).sort((a, b) => b.gasto - a.gasto);
    const ver = S.ui.cliTodos || q || o ? lista : lista.slice(0, CORTE);
    const verVuelven = S.ui.cliVuelven ? vuelven : vuelven.slice(0, CORTE - 2);
    const max = Math.max(1, ...D.origenes.map((x) => x[1]));
    return `${C.kpis([
      { l: 'Clientes', v: todos.length },
      { l: 'Vuelven', v: vuelven.length, s: `${VUELVE} visitas o más` },
      { l: 'Del exterior', v: todos.filter((c) => !ARGENTINA.includes(c.origen)).length }
    ])}
      <div class="grid-2" style="margin-bottom:20px">
        ${C.panel({ titulo: 'De dónde vienen', acciones: C.btn('Armar público para Meta', { accion: 'cli-publico', tipo: 'sec', chico: true }),
          cuerpo: `${D.origenes.map(([n, p]) => `<div class="barra-fila"><span>${esc(n)}</span>${C.barra(p, max)}<b>${p} %</b></div>`).join('')}
            <p class="cli-sirve">Para decidir dónde poner la plata de las campañas.</p>` })}
        ${C.panel({ titulo: 'Los que vuelven', sinPad: true, cuerpo: (verVuelven.map((c) => C.fila({ lead: C.avatar(c.nombre, 32), titulo: esc(c.nombre), meta: `${c.visitas} visitas · ${esc(c.origen)}`, lado: `<b>${plata(c.gasto)}</b>` })).join('') || C.vacio('Todavía no hay clientes que vuelvan.'))
          + (verVuelven.length < vuelven.length ? mas('cliVuelven', vuelven.length - verVuelven.length) : '') })}
      </div>
      ${C.panel({ titulo: 'Clientes', sinPad: true,
        acciones: `<input class="busca-chica" id="busca-cli" data-busca="buscaCli" type="search" maxlength="40" placeholder="Buscar por nombre o ciudad" aria-label="Buscar cliente" value="${esc(S.ui.buscaCli || '')}">`,
        cuerpo: `<div class="cli-filtros">${C.segmento('cliOrigen', o, [['', 'Todos'], ...D.origenes.map((x) => [x[0], esc(x[0])])])}</div>
          ${ver.map(fila).join('') || C.vacio('No hay clientes con ese filtro.')}${ver.length < lista.length ? mas('cliTodos', lista.length - ver.length) : ''}` })}`;
  };

  const resultado = (o) => {
    const p = publico(o);
    return `<p class="cli-pub-num"><b>${p.n}</b> ${p.n === 1 ? 'cliente' : 'clientes'} de ejemplo en este público</p><p class="cli-pub-txt" id="cli-pub-txt">${esc(p.texto)}</p>`;
  };
  C.acciones['cli-mas'] = (d) => { S.ui[d.clave] = true; C.guardar(); C.render(); };
  C.acciones['cli-publico'] = () => {
    const o = D.origenes.some((x) => x[0] === S.ui.cliOrigen) ? S.ui.cliOrigen : D.origenes[0][0];
    C.modal(`<h3>Armar público para Meta</h3><p class="modal-sub">Elegí de dónde son los clientes y copiá el texto para la campaña.</p>
      <div class="campo"><label for="cli-pub-o">Clientes de</label><select id="cli-pub-o" data-cambio="cliPublico">${D.origenes.map(([n]) => `<option ${n === o ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select></div>
      <div id="cli-pub-res">${resultado(o)}</div>
      ${C.nota('Simulado: en la instalación se arma con los datos reales y se carga en las campañas.')}
      <div class="acciones">${C.btn('Copiar el texto', { accion: 'cli-copiar' })}<button type="button" class="btn fan" data-cerrar>Cerrar</button></div>`);
  };
  C.cambios.cliPublico = (input) => {
    const el = document.getElementById('cli-pub-res');
    if (el && D.origenes.some((x) => x[0] === input.value)) el.innerHTML = resultado(input.value);
  };
  C.acciones['cli-copiar'] = () => {
    const el = document.getElementById('cli-pub-txt');
    if (!el) return;
    const mal = () => C.aviso('No se pudo copiar: seleccionalo y copialo a mano');
    try { navigator.clipboard.writeText(el.textContent).then(() => C.aviso('Texto copiado'), mal); } catch (e) { mal(); }
  };
})(window.CUADRA);
