// Caja: lo de hoy, el cierre del día y los comprobantes. S.contado = efectivo contado (número o null); S.cierreDia = {hora, contado, esperado} o null.
(function (C) {
  const { S, D, esc } = C;
  const plata = C.plata;
  const MEDIOS = ['Efectivo', 'Tarjeta', 'Transferencia'];
  const SUB = [['hoy', 'Hoy'], ['cierre', 'Cierre del día'], ['comprobantes', 'Comprobantes']];
  const TOPE = 100000000;
  const CORTE = 6;
  const sinPermiso = () => !C.puede('caja');
  const suma = (l) => l.reduce((s, m) => s + m.monto, 0);

  // Entró, salió y lo que tendría que haber por medio. En efectivo se suma la apertura.
  C.cajaTotales = (movs, apertura) => {
    const por = {}; let entro = 0, salio = 0;
    MEDIOS.forEach((md) => {
      const l = movs.filter((m) => m.medio === md);
      const e = suma(l.filter((m) => m.monto > 0)), s = -suma(l.filter((m) => m.monto < 0));
      por[md] = { entro: e, salio: s, neto: e - s, esperado: e - s + (md === 'Efectivo' ? apertura : 0) };
      entro += e; salio += s;
    });
    return { por, entro, salio, neto: entro - salio };
  };
  const totales = () => C.cajaTotales(S.movimientos, D.caja.apertura);
  // Plata escrita por una persona: solo números y puntos. Devuelve 0 si no sirve o si es muy alta.
  const monto = (txt) => { txt = String(txt || '').trim(); const n = /^[\d.\s$]+$/.test(txt) ? C.numero(txt) : 0; return n > 0 && n <= TOPE ? n : 0; };
  // [tono, texto] de la diferencia entre lo contado y lo esperado
  const dif = (contado, esperado) => {
    if (contado == null) return ['', 'Escribí lo que contaste para ver la diferencia'];
    const d = contado - esperado;
    return d === 0 ? ['ok', 'Da justo'] : ['alerta', `${d < 0 ? 'Faltan' : 'Sobran'} ${plata(Math.abs(d))}`];
  };

  function vistaHoy() {
    const t = totales();
    const movs = [...S.movimientos].reverse(), ver = S.ui.cajaTodos ? movs : movs.slice(0, CORTE);
    const filas = ver.map((m) => C.fila({
      titulo: esc(m.concepto), meta: `${esc(m.hora)} · ${esc(m.categoria)} · ${esc(m.medio)}`,
      lado: `<b class="cj-monto ${m.monto < 0 ? 'sal' : ''}">${m.monto > 0 ? '+ ' : ''}${plata(m.monto)}</b>`
    })).join('');
    return `${C.kpis([{ l: 'Entró', v: plata(t.entro) }, { l: 'Salió', v: plata(t.salio) }, { l: 'Queda', v: plata(t.neto), s: 'del día, sin la apertura' }])}
      ${S.cierreDia ? C.nota(`El día está cerrado desde las ${esc(S.cierreDia.hora)}. Para anotar algo más, reabrilo en Cierre del día.`) : ''}
      ${C.panel({ titulo: 'Por medio de pago', sinPad: true, cuerpo: MEDIOS.map((md) => C.fila({ titulo: md, meta: `Entró ${plata(t.por[md].entro)} · Salió ${plata(t.por[md].salio)}`, lado: `<b>${plata(t.por[md].neto)}</b>` })).join('') })}
      ${C.panel({ titulo: 'Movimientos', sub: movs.length, sinPad: true, cuerpo: (filas || C.vacio('Todavía no hay movimientos hoy.')) + (ver.length < movs.length ? `<button type="button" class="mas-link" data-accion="cj-mas">Ver más (${movs.length - ver.length})</button>` : '') })}`;
  }

  function vistaCierre() {
    const t = totales(), c = S.cierreDia, ef = t.por.Efectivo, esp = ef.esperado;
    const [tono, txt] = c ? dif(c.contado, c.esperado) : dif(S.contado, esp);
    const valor = c ? c.contado : S.contado;
    return `${c ? C.nota(`Día cerrado a las ${esc(c.hora)}. Contaste ${plata(c.contado)}: ${esc(txt.toLowerCase())}.`, tono, C.btn('Reabrir el día', { accion: 'cj-reabrir', tipo: 'sec', chico: true })) : ''}
      ${C.panel({ titulo: 'Lo que tendría que haber', sinPad: true, cuerpo: [
        C.fila({ titulo: 'Efectivo', meta: `Apertura ${plata(D.caja.apertura)} + entradas ${plata(ef.entro)} − salidas ${plata(ef.salio)}`, lado: `<b>${plata(esp)}</b>` }),
        C.fila({ titulo: 'Tarjeta', meta: 'Tiene que figurar en el resumen del procesador de pagos', lado: `<b>${plata(t.por.Tarjeta.esperado)}</b>` }),
        C.fila({ titulo: 'Transferencia', meta: 'Tiene que figurar en el banco', lado: `<b>${plata(t.por.Transferencia.esperado)}</b>` })].join('') })}
      ${C.panel({ titulo: 'Contá el efectivo', cuerpo: `<div class="campo cj-contar"><label for="cj-contado">Lo que contaste en efectivo ($)</label>
          <input id="cj-contado" data-cambio="cjContado" inputmode="numeric" maxlength="12" placeholder="Por ejemplo: ${esp}" value="${valor == null ? '' : valor}" ${c ? 'disabled' : ''}></div>
        <p class="cj-dif ${tono}" id="cj-dif" aria-live="polite">${esc(txt)}</p>
        ${c ? '' : `<div class="acciones">${C.btn('Cerrar el día', { accion: 'cj-cerrar' })}</div>`}` })}`;
  }

  function vistaComprobantes() {
    const l = [...S.comprobantes].reverse();
    return `${C.panel({ titulo: 'Comprobantes', sub: l.length, sinPad: true, cuerpo: l.map((x) => C.fila({
        lead: `<span class="cj-ico">${C.icono('escanear')}</span>`, titulo: esc(x.txt), meta: `subió ${esc(x.de)} · ${esc(x.hora)}`, lado: `<b>${plata(x.monto)}</b>`
      })).join('') || C.vacio('Todavía no se subió ningún comprobante.') })}
      ${C.nota('La foto de cada comprobante queda guardada junto a la caja del día, para la contabilidad. En la demo la foto es simulada.')}`;
  }

  C.V.caja = (param) => {
    if (sinPermiso()) return C.vacio('Tu puesto no tiene acceso a la caja.');
    const sub = SUB.some(([k]) => k === param) ? param : 'hoy';
    return C.subtabs('caja', sub, SUB.map(([k, l]) => [k, l, k === 'comprobantes' ? S.comprobantes.length : 0]))
      + (sub === 'cierre' ? vistaCierre() : sub === 'comprobantes' ? vistaComprobantes() : vistaHoy());
  };
  C.cab.caja = (param) => {
    if (sinPermiso()) return '';
    if (param === 'comprobantes') return C.btn('Subir comprobante', { accion: 'cj-subir', icono: 'mas' });
    if (param === 'cierre') return '';
    const b = C.btn('Nuevo movimiento', { accion: 'cj-nuevo', icono: 'mas' });
    return S.cierreDia ? b.replace('<button', '<button disabled') : b;
  };

  C.acciones['cj-mas'] = () => { S.ui.cajaTodos = true; C.guardar(); C.render(); };

  C.acciones['cj-nuevo'] = () => {
    if (sinPermiso() || S.cierreDia) return;
    const opt = (l) => l.map((x) => `<option>${esc(x)}</option>`).join('');
    C.modal(`<h3>Nuevo movimiento</h3><p class="modal-sub">Anotá lo que entró o salió de la caja.</p><form id="cj-form-mov" class="form">
      <div class="campo ancho"><label for="cm-con">Concepto</label><input id="cm-con" name="concepto" maxlength="80" required placeholder="Por ejemplo: alquiler de casco"></div>
      <div class="campo"><label for="cm-tipo">Qué pasó</label><select id="cm-tipo" name="tipo"><option value="ingreso">Entró plata</option><option value="egreso">Salió plata</option></select></div>
      <div class="campo"><label for="cm-monto">Monto ($)</label><input id="cm-monto" name="monto" inputmode="numeric" maxlength="12" required placeholder="45000"></div>
      <div class="campo"><label for="cm-cat">Categoría</label><select id="cm-cat" name="categoria">${opt(D.caja.categorias)}</select></div>
      <div class="campo"><label for="cm-med">Medio</label><select id="cm-med" name="medio">${opt(MEDIOS)}</select></div>
      <div class="acciones">${C.btn('Agregar', { submit: true })}<button type="button" class="btn fan" data-cerrar>Cancelar</button></div></form>`);
  };
  C.formularios['cj-form-mov'] = (fd) => {
    if (sinPermiso() || S.cierreDia) return;
    const concepto = String(fd.get('concepto') || '').trim(), n = monto(fd.get('monto'));
    const cat = String(fd.get('categoria')), med = String(fd.get('medio'));
    if (!concepto) return C.aviso('Escribí el concepto');
    if (concepto.length > 80) return C.aviso('El concepto es muy largo (máximo 80 letras)');
    if (!n) return C.aviso('El monto tiene que ser un número mayor a 0');
    if (!D.caja.categorias.includes(cat) || !MEDIOS.includes(med)) return C.aviso('Elegí la categoría y el medio de la lista');
    S.movimientos.push({ hora: C.ahora(), concepto, categoria: cat, medio: med, monto: fd.get('tipo') === 'egreso' ? -n : n });
    C.cerrarModal(); C.guardar(); C.render(); C.aviso('Movimiento anotado');
  };

  // Lo contado se actualiza mientras se escribe, sin redibujar la pantalla
  C.cambios.cjContado = (input) => {
    if (S.cierreDia) return;
    const txt = input.value.trim();
    S.contado = txt && /^[\d.\s$]+$/.test(txt) && C.numero(txt) <= TOPE ? C.numero(txt) : null;
    C.guardar();
    const [tono, t] = dif(S.contado, totales().por.Efectivo.esperado), el = document.getElementById('cj-dif');
    if (el) { el.className = 'cj-dif ' + tono; el.textContent = t; }
  };
  document.addEventListener('input', (e) => { if (e.target.dataset && e.target.dataset.cambio === 'cjContado') C.cambios.cjContado(e.target); });

  C.acciones['cj-cerrar'] = () => {
    if (sinPermiso() || S.cierreDia) return;
    if (S.contado == null) return C.aviso('Antes escribí cuánto contaste en efectivo');
    S.cierreDia = { hora: C.ahora(), contado: S.contado, esperado: totales().por.Efectivo.esperado };
    C.guardar(); C.render(); C.aviso('Día cerrado');
  };
  C.acciones['cj-reabrir'] = () => { if (sinPermiso()) return; S.cierreDia = null; C.guardar(); C.render(); C.aviso('Día reabierto'); };

  C.acciones['cj-subir'] = () => {
    if (sinPermiso()) return;
    C.modal(`<h3>Subir comprobante</h3><p class="modal-sub">Factura o ticket de algo que se pagó.</p><form id="cj-form-comp" class="form">
      <div class="cj-foto campo ancho" aria-hidden="true">Foto del comprobante<span>En la demo la foto es simulada</span></div>
      <div class="campo ancho"><label for="cc-txt">Descripción</label><input id="cc-txt" name="txt" maxlength="60" required placeholder="Por ejemplo: factura de la cera"></div>
      <div class="campo ancho"><label for="cc-monto">Monto ($)</label><input id="cc-monto" name="monto" inputmode="numeric" maxlength="12" required placeholder="38000"></div>
      <div class="acciones">${C.btn('Subir', { submit: true })}<button type="button" class="btn fan" data-cerrar>Cancelar</button></div></form>`);
  };
  C.formularios['cj-form-comp'] = (fd) => {
    if (sinPermiso()) return;
    const txt = String(fd.get('txt') || '').trim(), n = monto(fd.get('monto'));
    if (!txt) return C.aviso('Escribí una descripción');
    if (txt.length > 60) return C.aviso('La descripción es muy larga (máximo 60 letras)');
    if (!n) return C.aviso('El monto tiene que ser un número mayor a 0');
    S.comprobantes.push({ id: 'c' + Date.now(), txt, monto: n, de: C.primerNombre(D.usuario.nombre), hora: C.ahora() });
    C.cerrarModal(); C.guardar(); C.render(); C.aviso('Comprobante subido');
  };
})(window.CUADRA);
