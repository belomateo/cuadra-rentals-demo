// Integraciones: con qué se conecta el sistema (solo Administración o Dueño). En la demo todo es simulado.
(function (C) {
  const { S, esc } = C;
  // Ícono del núcleo si hay uno que sirve; si no, la inicial del nombre
  const ICO = { web: 'reservas', whatsapp: 'audio', mp: 'caja', garantia: 'garantias', contador: 'bajar', sueldos: 'reloj', contrato: 'firma', lector: 'escanear', fichador: 'reloj', correo: 'info' };
  // Qué hace y qué se necesita para conectarla. Sin precios ni comisiones: eso se acuerda con cada proveedor al instalar.
  const DETALLE = {
    web: ['Tus clientes reservan y pagan desde la web las 24 horas, viendo el stock en vivo. La reserva entra sola al sistema y queda lista para firmar el contrato.', 'La dirección de la web del rental.'],
    whatsapp: ['El cliente manda un audio o un texto y el sistema anota la reserva. Vos la revisás antes de confirmar. Desde acá salen también las confirmaciones y el aviso de devolución.', 'El número de WhatsApp del rental, con una cuenta de WhatsApp Business.'],
    agencias: ['Las reservas que venden agencias y portales de turismo entran solas, marcadas con quién las vendió y con la comisión que acordaron. Así ves cuánto te trae cada uno.', 'La lista de agencias y portales con los que trabajan, y cómo te mandan hoy las reservas.'],
    convenios: ['Cada hotel o escuela de esquí tiene su código. El cliente lo usa al reservar y sabés cuántas reservas trae cada convenio.', 'La lista de hoteles y escuelas con convenio, y el código de cada uno.'],
    pases: ['El pase del cerro se vende junto con el equipo, en la misma reserva y con un solo cobro. Depende de que el cerro lo permita.', 'El acuerdo con el cerro para vender sus pases y los datos de acceso que ellos den.'],
    mp: ['Cobrás con link de pago, QR o posnet. El cobro queda anotado en la caja del día con su medio.', 'La cuenta de Mercado Pago del rental.'],
    garantia: ['Al entregar el equipo se retiene la garantía en la tarjeta del cliente. Si todo vuelve en orden, se libera sola. Si hay un daño, se cobra solo lo que corresponde.', 'Una cuenta de cobros del rental que permita retener y liberar importes en tarjeta.'],
    monedas: ['Los precios se muestran en pesos, dólares y reales. El cambio del día sale de la cotización que elijas y cada cobro queda anotado con su moneda.', 'Elegir de dónde se toma la cotización del día.'],
    arca: ['Cada alquiler cobrado genera su factura electrónica. Queda guardada en el sistema y se le manda al cliente por correo.', 'El CUIT del rental, el punto de venta habilitado y la autorización de ARCA para facturar desde el sistema.'],
    contador: ['Al cerrar el mes se arma una planilla con ventas, gastos y comprobantes, lista para mandar al contador o para bajar como archivo.', 'El correo del contador.'],
    sueldos: ['Las horas de cada persona, con las extra ya aprobadas, pasan solas a la planilla de sueldos. No hay que copiarlas a mano.', 'La planilla de sueldos que usa hoy administración.'],
    contrato: ['El cliente firma el contrato y el deslinde en su celular o en la tablet del mostrador. La firma queda guardada en la reserva y no se entrega la tabla hasta que firma.', 'El texto del contrato y del deslinde que usa el rental.'],
    lector: ['Escaneás la etiqueta de la tabla con la cámara del celular o la tablet para entregarla o recibirla, sin tipear el número.', 'Un celular o una tablet con cámara, y la etiqueta pegada en cada tabla.'],
    etiquetas: ['Cuando sumás una tabla nueva sale su etiqueta con el número y la gama, lista para pegar.', 'Una impresora de etiquetas en el local y el tamaño de etiqueta que usan.'],
    fichador: ['Las entradas y salidas del equipo llegan solas al sistema. Si el reloj falla, se ficha desde la tablet.', 'El reloj de fichaje del local, si ya tienen uno, y su modelo.'],
    meta: ['Armás públicos con tus clientes por país para mostrar tus campañas de Instagram y Facebook a gente que ya te alquiló o se les parece. Solo se usan clientes que aceptaron recibir novedades.', 'La cuenta de anuncios de Meta del rental y el permiso de quien la administra.'],
    resenas: ['Al devolver el equipo, el cliente recibe el pedido de reseña con el enlace directo a la ficha de Google del rental.', 'La ficha de Google del rental y el enlace para dejar reseñas.'],
    correo: ['Por correo salen las confirmaciones a los clientes y los avisos internos: fichaje, horas extra y garantías.', 'La casilla de correo desde la que querés que salgan los mensajes.'],
    nieve: ['Ves el pronóstico y el parte de nieve del cerro junto a las reservas, para prever cuánta gente viene y cuánto equipo preparar.', 'Elegir de dónde se toma el parte del cerro.']
  };
  const detalle = (i) => { const [hace, necesita] = DETALLE[i.id] || [i.que, 'Los datos de la cuenta del rental.']; return { hace, necesita }; };
  const lista = () => S.integraciones || [];
  const lead = (i, px = 18) => `<span class="int-ico">${ICO[i.id] ? C.icono(ICO[i.id], px) : esc(i.nombre.charAt(0).toUpperCase())}</span>`;
  const on = (i) => i.estado === 'conectada';
  C.int = { DETALLE, detalle };

  C.V.integraciones = () => {
    const todas = lista(), n = todas.filter(on).length;
    const grupos = [...new Set(todas.map((i) => i.grupo))];
    const edita = C.puede('configurar');
    const paneles = grupos.map((g) => {
      const del = todas.filter((i) => i.grupo === g);
      return C.panel({ titulo: g, sub: `${del.filter(on).length} de ${del.length} conectadas`, sinPad: true, cuerpo: del.map((i) => C.fila({
        lead: lead(i), titulo: esc(i.nombre), meta: esc(i.que),
        lado: on(i) ? C.estado('Conectada', 'ok') : C.estado('Disponible'),
        acc: on(i) ? C.btn(edita ? 'Configurar' : 'Ver', { accion: 'int-abrir', tipo: 'sec', chico: true, data: { id: i.id } }) : C.btn(edita ? 'Conectar' : 'Ver', { accion: 'int-abrir', chico: true, tipo: edita ? '' : 'sec', data: { id: i.id } })
      })).join('') });
    }).join('');
    return C.nota('En la demo están simuladas. En la instalación se conectan con las cuentas del rental.')
      + C.kpis([{ l: 'Conectadas', v: n, tono: 'ok' }, { l: 'Disponibles', v: todas.length - n }, { l: 'Total', v: todas.length }]) + paneles;
  };

  C.acciones['int-abrir'] = (d) => {
    const i = lista().find((x) => x.id === d.id); if (!i) return;
    const { hace, necesita } = detalle(i);
    const cambiar = C.puede('configurar') ? C.btn(on(i) ? 'Desconectar' : 'Conectar', { accion: 'int-cambiar', tipo: on(i) ? 'sec' : '', data: { id: i.id } }) : '';
    C.modal(`<div class="int-cab">${lead(i, 20)}<div><h3>${esc(i.nombre)}</h3><div class="int-sub"><span class="muted">${esc(i.grupo)}</span>${on(i) ? C.estado('Conectada', 'ok') : C.estado('Disponible')}</div></div></div>
      <div class="int-bloque"><span class="int-et">Qué hace</span><p>${esc(hace)}</p></div>
      <div class="int-bloque"><span class="int-et">Qué se necesita</span><p>${esc(necesita)}</p></div>
      <div class="acciones">${cambiar}${C.btn('Cerrar', { tipo: 'fan', data: { cerrar: '' } })}</div>`);
  };
  C.acciones['int-cambiar'] = (d) => {
    if (!C.puede('configurar')) return C.aviso('Solo Administración o Dueño cambian las integraciones');
    const i = lista().find((x) => x.id === d.id); if (!i) return;
    i.estado = on(i) ? 'disponible' : 'conectada';
    C.guardar(); C.cerrarModal(); C.render();
    C.aviso(`${on(i) ? 'Conectaste' : 'Desconectaste'} ${i.nombre} (simulado)`);
  };
})(window.CUADRA);
