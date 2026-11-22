// Configuración (solo Administración o Dueño): gamas y tarifas, y permisos de cada puesto.
// Lo que se edita se escribe directo en D.gamas / D.margen (que ya lee el núcleo) y se guarda en S.cfg para que sobreviva a recargar.
(function (C) {
  const { S, D, esc } = C;
  const SUBS = [['gamas', 'Gamas y tarifas'], ['permisos', 'Permisos']];
  const CAMPOS = [['desde', 'Primer número', 1, 9999], ['hasta', 'Último número', 1, 9999], ['tarifa', 'Tarifa por día ($)', 1, 10000000], ['garantia', 'Garantía ($)', 1, 10000000]];

  // Aplica lo guardado apenas carga la página, antes de que ninguna sección lea D.gamas
  const aplicar = () => {
    const c = S.cfg; if (!c) return;
    D.gamas.forEach((g) => { const x = c.gamas && c.gamas[g.id]; if (x) Object.assign(g, x); });
    if (typeof c.margen === 'number') D.margen = c.margen;
  };
  aplicar();

  // Los rangos no se pueden pisar y cada tabla existente tiene que seguir dentro del rango de su gama. Devuelve el error o ''.
  const validarGamas = (gamas, equipos) => {
    for (const g of gamas) {
      for (const [k, txt, min, max] of CAMPOS) {
        if (!Number.isInteger(g[k]) || g[k] < min || g[k] > max) return `${g.nombre}: "${txt}" tiene que ser un número entero entre ${min.toLocaleString('es-AR')} y ${max.toLocaleString('es-AR')}`;
      }
      if (g.desde > g.hasta) return `${g.nombre}: el primer número no puede ser mayor que el último`;
    }
    const orden = [...gamas].sort((a, b) => a.desde - b.desde);
    for (let i = 1; i < orden.length; i++) {
      const a = orden[i - 1], b = orden[i];
      if (b.desde <= a.hasta) return `${a.nombre} (${a.desde} a ${a.hasta}) se pisa con ${b.nombre} (${b.desde} a ${b.hasta}): una tabla no puede ser de dos gamas`;
    }
    for (const g of gamas) {
      const afuera = equipos.find((e) => e.gama === g.id && (e.n < g.desde || e.n > g.hasta));
      if (afuera) return `La tabla #${afuera.n} es ${g.nombre} y quedaría fuera del rango ${g.desde} a ${g.hasta}`;
    }
    return '';
  };
  const validarMargen = (t) => { const n = Number(String(t).trim()); return String(t).trim() !== '' && Number.isInteger(n) && n >= 0 && n <= 30 ? n : null; };
  C.cfg = { validarGamas, validarMargen };

  const gamas = () => {
    const man = C.paraManana();
    const retiran = man.reduce((s, x) => s + x.retiran, 0), listas = man.reduce((s, x) => s + x.necesita, 0);
    const bloques = D.gamas.map((g) => `<div class="cfg-gama"><div class="cfg-nom">${C.marca(g.id)}</div>
      <div class="cfg-campos">${CAMPOS.map(([k, txt, min, max]) => `<div class="campo"><label for="cfg-${esc(g.id)}-${k}">${esc(txt)}</label><input id="cfg-${esc(g.id)}-${k}" name="${esc(g.id)}-${k}" type="number" inputmode="numeric" min="${min}" max="${max}" step="1" value="${g[k]}"></div>`).join('')}</div></div>`).join('');
    return C.nota('Cada gama tiene su rango de números. Si dos rangos se pisan, no te deja guardar.')
      + C.panel({ titulo: 'Gamas y tarifas', cuerpo: `<form id="cfg-gamas-form" novalidate>${bloques}<div class="acciones">${C.btn('Guardar gamas', { submit: true })}</div></form>` })
      + C.panel({ titulo: 'Tablas de más para mañana', cuerpo: `<form id="cfg-margen-form" class="cfg-margen" novalidate>
          <div class="campo"><label for="cfg-margen">Margen (de 0 a 30 %)</label><input id="cfg-margen" name="margen" type="number" inputmode="numeric" min="0" max="30" step="1" value="${Math.round(D.margen * 100)}"></div>
          ${C.btn('Guardar margen', { submit: true })}</form>
        <p class="cfg-impl">Para mañana el taller deja listas ${listas} tablas: ${retiran} que retiran y ${listas - retiran} de más.</p>` });
  };

  const permisos = () => C.nota('El empleado solo asigna y entrega; administración reserva, cobra y aprueba horas.')
    + C.panel({ titulo: 'Qué puede hacer cada puesto', sinPad: true,
      acciones: C.btn('Ver como Mostrador', { accion: 'cfg-probar', tipo: 'sec', chico: true, data: { rol: 'Mostrador' } }) + C.btn('Ver como Taller', { accion: 'cfg-probar', tipo: 'sec', chico: true, data: { rol: 'Taller' } }),
      cuerpo: D.roles.map(([rol, cosas]) => C.fila({ titulo: esc(rol), meta: esc(cosas.join(' · ')), lado: rol === S.rol ? C.etiqueta('Vista actual', 'info') : '' })).join('') });

  C.V.configuracion = (param) => {
    if (!C.puede('configurar')) return C.vacio('La configuración la ven solo Administración y Dueño.');
    const sub = SUBS.some(([k]) => k === param) ? param : 'gamas';
    return C.subtabs('configuracion', sub, SUBS) + { gamas, permisos }[sub]();
  };

  const cfg = () => (S.cfg = S.cfg || {});
  C.formularios['cfg-gamas-form'] = (fd) => {
    if (!C.puede('configurar')) return C.aviso('Solo Administración o Dueño cambian las gamas');
    const nuevas = D.gamas.map((g) => { const o = { id: g.id, nombre: g.nombre }; CAMPOS.forEach(([k]) => { o[k] = Number(String(fd.get(`${g.id}-${k}`) || '').trim()); }); return o; });
    const error = validarGamas(nuevas, S.equipos);
    if (error) return C.aviso(error);
    cfg().gamas = {};
    nuevas.forEach((n) => { const g = D.gamas.find((x) => x.id === n.id); CAMPOS.forEach(([k]) => { g[k] = n[k]; }); cfg().gamas[n.id] = { desde: n.desde, hasta: n.hasta, tarifa: n.tarifa, garantia: n.garantia }; });
    C.guardar(); C.render(); C.aviso('Gamas guardadas: los rangos y los precios ya valen en todo el sistema');
  };
  C.formularios['cfg-margen-form'] = (fd) => {
    if (!C.puede('configurar')) return C.aviso('Solo Administración o Dueño cambian el margen');
    const n = validarMargen(fd.get('margen'));
    if (n === null) return C.aviso('El margen tiene que ser un número entero entre 0 y 30');
    D.margen = n / 100; cfg().margen = D.margen;
    C.guardar(); C.render(); C.aviso(`Margen de ${n} %: ya lo usa la lista para mañana del taller`);
  };

  C.acciones['cfg-probar'] = (d) => {
    if (!C.ROLES.includes(d.rol)) return;
    S.rol = d.rol; C.guardar();
    location.hash = d.rol === 'Taller' ? '#/taller' : '#/reservas';
    C.render(); C.aviso(`Ahora ves el sistema como ${d.rol}. Para volver, cambiá «Ver como» a Administración`);
  };
})(window.CUADRA);
