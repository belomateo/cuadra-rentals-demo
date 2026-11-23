// Stock en vivo de Cuadra · Rentals. Todo sale de S.equipos: si en Reservas asignan una tabla, acá aparece alquilada.
(function (C) {
  const { S, D, esc, plata } = C;
  const PAGINA = 30;
  const SUBS = [['vivo', 'En vivo'], ['deposito', 'Depósito'], ['gamas', 'Gamas']];
  const depositos = () => D.ubicaciones.filter((u) => /^Depósito/.test(u));
  const lugares = () => D.ubicaciones.filter((u) => u !== 'Taller');
  const opciones = (lista, actual) => lista.map((l) => `<option ${l === actual ? 'selected' : ''}>${esc(l)}</option>`).join('');
  const entero = (v) => (/^\s*\d+\s*$/.test(String(v || '')) ? parseInt(v, 10) : NaN);
  const error = (form, txt) => { const p = form.querySelector('[data-error]'); if (p) p.textContent = txt; };

  // Dónde está cada tabla, en una línea
  function donde(e) {
    if (e.estado === 'disponible') return esc(e.ubic || 'Sin lugar anotado');
    if (e.estado === 'taller') { const o = S.taller.find((x) => x.equipo === e.n); return o ? `${esc(o.trabajo)} · ${o.min} min` : 'En el taller'; }
    const q = C.quienTiene(e);
    if (q) return `${esc(q.p ? q.p.nombre : q.g.nombre)} · vuelve el ${esc(q.r.hasta)}`;
    return `${esc(e.cliente || 'Alquilada')}${e.vuelve ? ` · vuelve el ${esc(e.vuelve)}` : ''}`;
  }

  // ---------- En vivo ----------
  // Cada estado en su casilla (pedido de un rental, 23/11): si las libres van mezcladas entre las ocupadas, se pierden
  const CASILLAS = [['disponible', 'Libres', 'Ninguna libre con este filtro.'], ['alquilado', 'Alquiladas', 'Ninguna alquilada con este filtro.'],
    ['taller', 'En el taller', 'Nada en el taller con este filtro.']];
  function vivo() {
    const u = S.ui, c = C.contar();
    const gama = u.stkGama || 'todas', est = u.stkEstado || 'todas', texto = String(u.buscaStock || '');
    const q = C.norm(texto).replace(/^#/, '').trim();
    const base = S.equipos.filter((e) => (gama === 'todas' || e.gama === gama)
      && (!q || String(e.n).includes(q) || C.norm(`${e.marca} ${e.modelo}`).includes(q))).sort((a, b) => a.n - b.n);
    const casillas = CASILLAS.filter(([k]) => est === 'todas' || est === k).map(([k, titulo, vacio]) => {
      const lista = base.filter((e) => e.estado === k);
      // cada casilla muestra 30 y crece con «Ver más»; con otro filtro o búsqueda vuelve a 30
      const clave = [gama, k, q].join('|');
      const n = (u.stkMas && u.stkMas[clave]) || PAGINA;
      const filas = lista.slice(0, n).map((e) => C.fila({
        cls: 'stk-f', lead: C.placa(e.n),
        titulo: `${esc(e.marca)} ${esc(e.modelo)} · ${e.largo} cm`,
        meta: `${esc(e.tipo)} · ${donde(e)}`,
        lado: C.estadoEquipo(e),
        acc: C.btn('Ver', { accion: 'abrir-tabla', tipo: 'sec', chico: true, data: { n: e.n } })
      })).join('');
      return C.panel({
        titulo, sub: `${lista.length}`, sinPad: true,
        cuerpo: (filas || C.vacio(vacio))
          + (lista.length > n ? `<button type="button" class="mas-link" data-accion="stk-mas" data-c="${esc(clave)}" data-n="${n + PAGINA}">Ver más (quedan ${lista.length - n})</button>` : '')
      });
    }).join('');
    return C.kpis([{ l: 'Libres', v: c.disponible, tono: 'ok' }, { l: 'Alquiladas', v: c.alquilado }, { l: 'En el taller', v: c.taller }, { l: 'Total', v: c.total }])
      + `<div class="filtros">
        ${C.segmento('stkGama', gama, [['todas', 'Todas'], ...D.gamas.map((g) => [g.id, C.marca(g.id)])])}
        ${C.segmento('stkEstado', est, [['todas', 'Todas'], ['disponible', 'Libres'], ['alquilado', 'Alquiladas'], ['taller', 'En el taller']])}
        <input class="busca-chica" id="busca-stock" data-busca="buscaStock" value="${esc(texto)}" placeholder="Número o marca" aria-label="Buscar tabla por número o marca" autocomplete="off">
      </div>` + casillas;
  }

  // ---------- Depósito ----------
  function deposito() {
    const libres = S.equipos.filter((e) => e.estado === 'disponible');
    const cuantas = (en, g) => en.filter((e) => e.gama === g).length;
    const sitios = D.ubicaciones.map((l) => [l, libres.filter((e) => e.ubic === l)]);
    const sinLugar = libres.filter((e) => !D.ubicaciones.includes(e.ubic));
    if (sinLugar.length) sitios.push(['Sin lugar anotado', sinLugar]);
    const filas = sitios.filter(([l, en]) => en.length || !['Taller', 'Mostrador'].includes(l)).map(([l, en]) => C.fila({
      titulo: esc(l), meta: `${en.length} ${en.length === 1 ? 'libre' : 'libres'}`,
      lado: D.gamas.map((g) => `<span class="stk-cant">${C.marca(g.id, false)}<b>${cuantas(en, g.id)}</b></span>`).join('')
    })).join('');
    const mueve = C.puede('taller');
    const form = mueve ? `<form id="stk-mover" class="form" novalidate>
        <div class="campo"><label for="stk-m-n">Número de la tabla</label><input id="stk-m-n" name="numero" inputmode="numeric" placeholder="Por ejemplo 250" autocomplete="off"></div>
        <div class="campo"><label for="stk-m-l">Pasarla a</label><select id="stk-m-l" name="ubic">${opciones(lugares())}</select></div>
        <p class="stk-err" data-error role="alert"></p>
        <div class="acciones">${C.btn('Mover', { submit: true })}</div></form>`
      : C.nota('Tu puesto puede ver el depósito, pero no mover tablas.');
    return C.panel({ titulo: 'Tablas libres por lugar', sinPad: true, cuerpo: filas })
      + C.panel({ titulo: 'Mover una tabla', cuerpo: form });
  }

  // ---------- Gamas ----------
  function gamas() {
    const filas = D.gamas.map((g) => {
      const k = C.contar(g.id);
      return C.fila({
        titulo: C.marca(g.id),
        meta: `Números ${g.desde} a ${g.hasta} · ${k.total} tablas · ${k.disponible} libres · ${k.alquilado} alquiladas · ${k.taller} en taller<div class="stk-barra">${C.barra(k.disponible, k.total, 'ok')}</div>`,
        lado: `<span class="num">${plata(g.tarifa)}<span class="muted"> por día</span></span>`
      });
    }).join('');
    const acc = D.accesorios.map((a) => C.fila({
      titulo: esc(a.tipo), meta: `${esc(a.detalle)} · ${a.alquiladas} alquiladas`,
      lado: `<span class="num"><b>${a.total - a.alquiladas}</b><span class="muted"> libres de ${a.total}</span></span>`
    })).join('');
    return C.nota('El número dice la gama: no puede haber una premium con número de estándar.')
      + C.panel({ titulo: 'Gamas', sinPad: true, cuerpo: filas })
      + C.panel({ titulo: 'Accesorios', sinPad: true, cuerpo: acc });
  }

  C.V.stock = (param) => {
    const sub = { vivo, deposito, gamas }[param] ? param : 'vivo';
    return C.subtabs('stock', sub, SUBS) + { vivo, deposito, gamas }[sub]();
  };
  C.cab.stock = () => (C.puede('configurar') ? C.btn('Dar de alta una tabla', { accion: 'stk-alta', icono: 'mas' }) : '');

  // ---------- Acciones y formularios ----------
  C.acciones['stk-mas'] = (d) => { S.ui.stkMas = Object.assign({}, S.ui.stkMas, { [d.c]: +d.n }); C.guardar(); C.render(); };

  C.acciones['stk-alta'] = () => {
    if (!C.puede('configurar')) return;
    C.modal(`<h3>Dar de alta una tabla</h3><p class="modal-sub">El número tiene que ser de la gama y no estar repetido.</p>
      <form id="stk-alta" class="form" novalidate>
        <div class="campo"><label for="stk-a-n">Número</label><input id="stk-a-n" name="numero" inputmode="numeric" placeholder="Por ejemplo 240" autocomplete="off"></div>
        <div class="campo"><label for="stk-a-g">Gama</label><select id="stk-a-g" name="gama">${D.gamas.map((g) => `<option value="${g.id}">${esc(g.nombre)} (${g.desde} a ${g.hasta})</option>`).join('')}</select></div>
        <div class="campo"><label for="stk-a-t">Tipo</label><select id="stk-a-t" name="tipo"><option>Esquí</option><option>Snowboard</option></select></div>
        <div class="campo"><label for="stk-a-l">Largo (cm)</label><input id="stk-a-l" name="largo" inputmode="numeric" placeholder="Por ejemplo 165" autocomplete="off"></div>
        <div class="campo"><label for="stk-a-m">Marca</label><input id="stk-a-m" name="marca" maxlength="30" placeholder="Por ejemplo Atomic" autocomplete="off"></div>
        <div class="campo"><label for="stk-a-o">Modelo</label><input id="stk-a-o" name="modelo" maxlength="30" placeholder="Por ejemplo Redster X" autocomplete="off"></div>
        <div class="campo ancho"><label for="stk-a-d">Dónde queda</label><select id="stk-a-d" name="ubic">${opciones(depositos())}</select></div>
        <p class="stk-err" data-error role="alert"></p>
        <div class="acciones">${C.btn('Dar de alta', { submit: true })}<button type="button" class="btn fan" data-cerrar>Cancelar</button></div></form>`);
  };

  C.formularios['stk-alta'] = (f, form) => {
    if (!C.puede('configurar')) return error(form, 'Tu puesto no puede dar de alta tablas.');
    const n = entero(f.get('numero')), g = C.gama(f.get('gama')), largo = entero(f.get('largo'));
    const marca = String(f.get('marca') || '').trim(), modelo = String(f.get('modelo') || '').trim(), tipo = f.get('tipo'), ubic = f.get('ubic');
    if (Number.isNaN(n)) return error(form, 'Poné el número de la tabla, solo cifras.');
    if (!g) return error(form, 'Elegí la gama.');
    const real = C.gamaDe(n);
    if (!real) return error(form, `El ${n} no es de ninguna gama: los números van del ${D.gamas[0].desde} al ${D.gamas[D.gamas.length - 1].hasta}.`);
    if (real.id !== g.id) return error(form, `El ${n} es de ${real.nombre}, no de ${g.nombre}. ${g.nombre} va del ${g.desde} al ${g.hasta}.`);
    if (C.equipo(n)) return error(form, `Ya existe la tabla ${n}: elegí otro número.`);
    if (!['Esquí', 'Snowboard'].includes(tipo)) return error(form, 'Elegí si es esquí o snowboard.');
    if (!marca || !modelo) return error(form, 'Completá la marca y el modelo.');
    if (Number.isNaN(largo) || largo < 90 || largo > 210) return error(form, 'El largo tiene que estar entre 90 y 210 cm.');
    if (!depositos().includes(ubic)) return error(form, 'Elegí dónde queda.');
    S.equipos.push({ n, gama: g.id, tipo, marca, modelo, largo, estado: 'disponible', ubic, reserva: null, cliente: '', vuelve: '' });
    S.equipos.sort((a, b) => a.n - b.n);
    C.guardar(); C.cerrarModal(); C.render(); C.aviso(`Tabla ${n} dada de alta en ${g.nombre}: ${ubic}`);
  };

  C.formularios['stk-mover'] = (f, form) => {
    if (!C.puede('taller')) return error(form, 'Tu puesto no puede mover tablas.');
    const n = entero(f.get('numero')), ubic = f.get('ubic');
    if (Number.isNaN(n)) return error(form, 'Poné el número de la tabla, solo cifras.');
    const e = C.equipo(n);
    if (!e) return error(form, `No existe la tabla ${n}.`);
    if (e.estado !== 'disponible') return error(form, `La ${n} está ${e.estado === 'taller' ? 'en el taller' : 'alquilada'}: solo se mueven las libres.`);
    if (!lugares().includes(ubic)) return error(form, 'Elegí el lugar.');
    if (e.ubic === ubic) return error(form, `La ${n} ya está en ${ubic}.`);
    e.ubic = ubic;
    C.guardar(); C.render(); C.aviso(`La ${n} ahora está en ${ubic}`);
  };
})(window.CUADRA);
