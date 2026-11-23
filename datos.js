// Datos de ejemplo de Cuadra · Rentals. Nada es de un rental real: nombres, números y montos son inventados para la demo.
(function () {
  const D = {
    rental: 'Cumbre Rental (ejemplo)',
    hoy: 'Sábado 18 de julio',
    hora: '09:48',
    usuario: { id: 'laura', nombre: 'Laura Méndez', rol: 'Administración' },

    // Cada gama tiene su rango de números: no puede haber una premium con número de estándar.
    gamas: [
      { id: 'estandar', nombre: 'Estándar', desde: 100, hasta: 399, tarifa: 38000, garantia: 150000 },
      { id: 'premium', nombre: 'Premium', desde: 400, hasta: 699, tarifa: 52000, garantia: 250000 },
      { id: 'alta', nombre: 'Alta gama', desde: 700, hasta: 999, tarifa: 70000, garantia: 400000 }
    ],
    // El modelo sale del número: n % 4 (el 3 es siempre snowboard)
    modelos: {
      estandar: [['Esquí', 'Elan', 'Element'], ['Esquí', 'Salomon', 'Distance'], ['Esquí', 'Head', 'Joy'], ['Snowboard', 'Nitro', 'Prime']],
      premium: [['Esquí', 'Rossignol', 'Experience 82'], ['Esquí', 'Head', 'Shape V8'], ['Esquí', 'Atomic', 'Redster X'], ['Snowboard', 'Burton', 'Process']],
      alta: [['Esquí', 'Fischer', 'RC4 WC'], ['Esquí', 'Völkl', 'Deacon'], ['Esquí', 'Atomic', 'Redster S9'], ['Snowboard', 'Burton', 'Custom X']]
    },
    ubicaciones: ['Depósito 1 · lado A', 'Depósito 1 · lado B', 'Depósito 2 · lado A', 'Depósito 2 · lado B', 'Taller', 'Mostrador'],
    // Trabajos de taller y minutos que lleva cada uno
    trabajos: [['Encerar', 5], ['Afilar cantos', 20], ['Reparar base', 40], ['Ajustar fijaciones', 10]],
    accesorios: [
      { tipo: 'Botas', detalle: 'Talles 35 a 46', total: 260, alquiladas: 171 },
      { tipo: 'Bastones', detalle: '100 a 130 cm', total: 220, alquiladas: 140 },
      { tipo: 'Cascos', detalle: 'S, M y L', total: 180, alquiladas: 96 }
    ],
    // Lo que se suma en el mostrador a una reserva (precios de ejemplo). «por»: 'día' se cobra por los días de la reserva
    extras: [
      { id: 'casco', nombre: 'Casco', precio: 8000, por: 'día' },
      { id: 'antiparras', nombre: 'Antiparras', precio: 6000, por: 'día' },
      { id: 'guantes', nombre: 'Guantes', precio: 5000, por: 'día' },
      { id: 'bastones', nombre: 'Bastones', precio: 4000, por: 'día' },
      { id: 'botas', nombre: 'Botas', precio: 15000, por: 'día' },
      { id: 'seguro', nombre: 'Seguro del equipo', precio: 9000, por: 'día' },
      { id: 'locker', nombre: 'Locker', precio: 7000, por: 'día' },
      { id: 'clase', nombre: 'Clase con instructor', precio: 65000, por: 'una' }
    ],

    // Grupos: un grupo puede tener varias reservas (los que van los mismos días quedan juntos)
    grupos: [
      { id: 'gr1', nombre: 'Familia Souza', contacto: 'Rafael Souza', tel: '+55 11 9 8123 4567', origen: 'Brasil', ciudad: 'São Paulo', canal: 'Web' },
      { id: 'gr2', nombre: 'Amigos de Córdoba', contacto: 'Martín Ledesma', tel: '+54 9 351 555 0142', origen: 'Zona centro', ciudad: 'Córdoba', canal: 'WhatsApp (audio)' },
      { id: 'gr3', nombre: 'Pareja Fuentes', contacto: 'Ignacio Fuentes', tel: '+56 9 5555 0188', origen: 'Chile', ciudad: 'Santiago', canal: 'Web' },
      { id: 'gr4', nombre: 'Familia Gómez', contacto: 'Carolina Gómez', tel: '+54 9 11 5555 0193', origen: 'Buenos Aires', ciudad: 'CABA', canal: 'Mostrador' },
      { id: 'gr5', nombre: 'Amigos de Rosario', contacto: 'Federico Sosa', tel: '+54 9 341 555 0107', origen: 'Zona centro', ciudad: 'Rosario', canal: 'Web' },
      { id: 'gr6', nombre: 'Ana Torres', contacto: 'Ana Torres', tel: '+57 300 555 0161', origen: 'Colombia', ciudad: 'Bogotá', canal: 'Instagram' },
      { id: 'gr7', nombre: 'Familia Pereyra', contacto: 'Luis Pereyra', tel: '+54 9 261 555 0175', origen: 'Zona centro', ciudad: 'Mendoza', canal: 'Mostrador' }
    ],
    // estado: 'en_curso' | 'retira_hoy' | 'devuelve_hoy' | 'manana'. Persona: [nombre, tipo, gama, nivel, altura, peso, calzado, equipo (número o null), pago]
    reservas: [
      { id: 'r1', grupo: 'gr1', desde: '18/07', hasta: '22/07', dias: 5, estado: 'en_curso', personas: [
        ['Rafael Souza', 'Esquí', 'premium', 'Intermedio', 178, 82, 43, 412, 'Tarjeta'],
        ['Camila Souza', 'Esquí', 'premium', 'Intermedio', 165, 60, 38, 413, 'Tarjeta'],
        ['Lucas Souza', 'Snowboard', 'estandar', 'Principiante', 160, 52, 39, 231, 'Tarjeta'],
        ['Bia Souza', 'Esquí', 'estandar', 'Principiante', 140, 38, 34, 128, 'Tarjeta']] },
      { id: 'r2', grupo: 'gr2', desde: '18/07', hasta: '20/07', dias: 3, estado: 'retira_hoy', personas: [
        ['Martín Ledesma', 'Esquí', 'estandar', 'Intermedio', 181, 85, 44, null, 'Transferencia'],
        ['Juan Cruz Bustos', 'Snowboard', 'estandar', 'Intermedio', 176, 74, 42, null, 'Efectivo'],
        ['Paula Ríos', 'Esquí', 'estandar', 'Principiante', 163, 58, 38, null, 'Tarjeta'],
        ['Agustina Vera', 'Esquí', 'estandar', 'Principiante', 168, 61, 39, null, 'Pendiente']] },
      { id: 'r3', grupo: 'gr2', desde: '18/07', hasta: '21/07', dias: 4, estado: 'retira_hoy', personas: [
        ['Tomás Ledesma', 'Esquí', 'premium', 'Avanzado', 183, 80, 44, null, 'Tarjeta'],
        ['Sol Medina', 'Snowboard', 'premium', 'Intermedio', 166, 57, 38, null, 'Tarjeta']] },
      { id: 'r4', grupo: 'gr3', desde: '17/07', hasta: '19/07', dias: 3, estado: 'en_curso', personas: [
        ['Ignacio Fuentes', 'Esquí', 'alta', 'Avanzado', 185, 84, 44, 704, 'Tarjeta'],
        ['Fernanda Lagos', 'Esquí', 'alta', 'Avanzado', 170, 62, 39, 705, 'Tarjeta']] },
      { id: 'r5', grupo: 'gr4', desde: '15/07', hasta: '18/07', dias: 4, estado: 'devuelve_hoy', personas: [
        ['Carolina Gómez', 'Esquí', 'estandar', 'Intermedio', 167, 63, 39, 120, 'Efectivo'],
        ['Hernán Gómez', 'Esquí', 'estandar', 'Intermedio', 180, 88, 43, 121, 'Efectivo'],
        ['Mora Gómez', 'Esquí', 'estandar', 'Principiante', 150, 44, 36, 122, 'Efectivo'],
        ['Thiago Gómez', 'Snowboard', 'estandar', 'Principiante', 158, 50, 38, 123, 'Efectivo'],
        ['Elena Ruiz', 'Esquí', 'estandar', 'Principiante', 160, 66, 37, 124, 'Efectivo']] },
      { id: 'r6', grupo: 'gr5', desde: '19/07', hasta: '23/07', dias: 5, estado: 'manana', personas: [
        ['Federico Sosa', 'Esquí', 'premium', 'Intermedio', 179, 78, 43, null, 'Tarjeta'],
        ['Lara Benítez', 'Esquí', 'premium', 'Principiante', 164, 55, 38, null, 'Tarjeta'],
        ['Iván Sosa', 'Snowboard', 'estandar', 'Intermedio', 175, 70, 42, null, 'Tarjeta']] },
      { id: 'r7', grupo: 'gr6', desde: '18/07', hasta: '19/07', dias: 2, estado: 'retira_hoy', personas: [
        ['Ana Torres', 'Esquí', 'premium', 'Principiante', 162, 57, 37, null, 'Tarjeta']] },
      { id: 'r8', grupo: 'gr7', desde: '18/07', hasta: '20/07', dias: 3, estado: 'retira_hoy', personas: [
        ['Luis Pereyra', 'Esquí', 'estandar', 'Intermedio', 177, 81, 42, null, 'Efectivo'],
        ['Marta Pereyra', 'Esquí', 'estandar', 'Principiante', 161, 59, 38, null, 'Tarjeta'],
        ['Bruno Pereyra', 'Snowboard', 'estandar', 'Principiante', 155, 48, 37, null, 'Tarjeta']] }
    ],
    // Gente en el local esperando, por orden de llegada (por grupo: no se intercalan)
    espera: [['gr2', '09:20'], ['gr6', '09:35'], ['gr7', '09:41']],
    // Para el audio de ejemplo: lo que dijo el cliente y lo que anotó el sistema
    audioEjemplo: {
      de: 'Valeria Núñez', dur: '0:38', origen: 'Buenos Aires',
      txt: 'Hola, quería reservar para el 25 de julio. Somos cuatro: mi marido y yo esquí, intermedio, y los dos chicos snowboard, principiantes. Nos quedamos hasta el 28. Pagamos cada uno con su tarjeta.',
      grupo: 'Familia Núñez', desde: '25/07', hasta: '28/07', dias: 4,
      personas: [['Valeria Núñez', 'Esquí', 'premium', 'Intermedio'], ['Pablo Núñez', 'Esquí', 'premium', 'Intermedio'],
        ['Joaquín Núñez', 'Snowboard', 'estandar', 'Principiante'], ['Emma Núñez', 'Snowboard', 'estandar', 'Principiante']]
    },

    // Gente por día: personas con equipo en la montaña y lo que retiran ese día, por gama
    agenda: [
      { dia: 'Sáb 18', personas: 164, retiran: { estandar: 38, premium: 22, alta: 9 }, evento: '' },
      { dia: 'Dom 19', personas: 158, retiran: { estandar: 31, premium: 19, alta: 15 }, evento: '' },
      { dia: 'Lun 20', personas: 131, retiran: { estandar: 22, premium: 14, alta: 6 }, evento: '' },
      { dia: 'Mar 21', personas: 118, retiran: { estandar: 19, premium: 12, alta: 5 }, evento: '' },
      { dia: 'Mié 22', personas: 126, retiran: { estandar: 24, premium: 15, alta: 6 }, evento: 'Llega un contingente de egresados (40 personas)' },
      { dia: 'Jue 23', personas: 149, retiran: { estandar: 33, premium: 17, alta: 7 }, evento: '' },
      { dia: 'Vie 24', personas: 171, retiran: { estandar: 41, premium: 23, alta: 10 }, evento: 'Carrera del club de esquí (ejemplo)' }
    ],
    margen: 0.1, // equipos de más, listos por las dudas

    tallerHoy: { entraron: 18, salieron: 11 },

    garantias: [
      { id: 'g1', reserva: 'r1', cliente: 'Rafael Souza', tarjeta: 'Visa ···· 4821', estado: 'retenida', desde: '18/07', vence: '17/08', danio: null },
      { id: 'g2', reserva: 'r4', cliente: 'Ignacio Fuentes', tarjeta: 'Mastercard ···· 0937', estado: 'retenida', desde: '17/07', vence: '16/08', danio: null },
      { id: 'g3', reserva: 'r5', cliente: 'Carolina Gómez', tarjeta: 'Visa ···· 1176', estado: 'retenida', desde: '15/07', vence: '14/08', danio: null },
      { id: 'g4', reserva: null, cliente: 'Diego Paz', equipos: [717], monto: 400000, tarjeta: 'Visa ···· 3390', estado: 'cobrada', desde: '02/07', vence: '01/08',
        danio: { que: 'Base rayada hasta el núcleo', costo: 120000, arreglado: true } },
      { id: 'g5', reserva: null, cliente: 'Valentina Ríos', equipos: [433], monto: 250000, tarjeta: 'Amex ···· 2004', estado: 'vence_hoy', desde: '18/06', vence: '18/07',
        danio: null, nota: 'Pasó un mes y la reserva no se dio de baja: hoy se cobra si nadie la revisa' },
      { id: 'g6', reserva: null, cliente: 'Marcos Villalba', equipos: [151], monto: 150000, tarjeta: 'Visa ···· 6612', estado: 'liberada', desde: '10/07', vence: '09/08',
        danio: { que: 'Fijación floja', costo: 0, arreglado: true } }
    ],

    caja: {
      apertura: 50000,
      // [hora, concepto, categoría, medio, monto]
      movimientos: [
        ['08:31', 'Alquiler · Familia Souza (4 personas, 5 días)', 'Alquiler', 'Tarjeta', 1000000],
        ['08:52', 'Alquiler · Pareja Fuentes (saldo)', 'Alquiler', 'Tarjeta', 210000],
        ['09:05', 'Clase de esquí · Mora Gómez', 'Clases', 'Efectivo', 45000],
        ['09:14', 'Alquiler · Martín Ledesma', 'Alquiler', 'Transferencia', 114000],
        ['09:22', 'Cera y limas para el taller', 'Taller', 'Efectivo', -38000],
        ['09:30', 'Alquiler · Juan Cruz Bustos', 'Alquiler', 'Efectivo', 114000],
        ['09:31', 'Alquiler · Paula Ríos', 'Alquiler', 'Tarjeta', 114000],
        ['09:40', 'Transfer · combi de las 8', 'Transfers', 'Efectivo', 96000],
        ['09:44', 'Repuesto de fijación', 'Taller', 'Tarjeta', -27500]
      ],
      categorias: ['Alquiler', 'Clases', 'Transfers', 'Taller', 'Sueldos', 'Servicios'],
      comprobantes: [
        { id: 'c1', txt: 'Factura · cera y limas', monto: 38000, de: 'Nicolás', hora: '09:23' },
        { id: 'c2', txt: 'Ticket · repuesto de fijación', monto: 27500, de: 'Matías', hora: '09:45' }
      ]
    },

    // origen: Buenos Aires | Brasil | Chile | Zona centro | Colombia | Otros
    clientes: [
      ['Rafael Souza', 'Brasil', 'São Paulo', 3, 'Premium · Esquí', 2600000, 'Julio'],
      ['Carolina Gómez', 'Buenos Aires', 'CABA', 4, 'Estándar · Esquí', 3100000, 'Julio'],
      ['Ignacio Fuentes', 'Chile', 'Santiago', 2, 'Alta gama · Esquí', 1680000, 'Julio'],
      ['Martín Ledesma', 'Zona centro', 'Córdoba', 1, 'Estándar · Esquí', 684000, 'Julio'],
      ['Ana Torres', 'Colombia', 'Bogotá', 1, 'Premium · Esquí', 104000, 'Julio'],
      ['Gustavo Paredes', 'Buenos Aires', 'La Plata', 5, 'Premium · Snowboard', 3900000, 'Agosto 2025'],
      ['Juliana Costa', 'Brasil', 'Porto Alegre', 2, 'Premium · Esquí', 1250000, 'Julio 2025'],
      ['Sebastián Mora', 'Buenos Aires', 'Pilar', 3, 'Alta gama · Esquí', 2450000, 'Septiembre 2025'],
      ['Camila Rojas', 'Chile', 'Valparaíso', 1, 'Estándar · Snowboard', 228000, 'Agosto 2025'],
      ['Diego Paz', 'Zona centro', 'Río Cuarto', 2, 'Alta gama · Esquí', 980000, 'Julio'],
      ['Valentina Ríos', 'Buenos Aires', 'Quilmes', 1, 'Premium · Esquí', 312000, 'Junio'],
      ['Thiago Lima', 'Brasil', 'Curitiba', 2, 'Estándar · Esquí', 760000, 'Julio 2025'],
      ['Florencia Díaz', 'Otros', 'Montevideo', 1, 'Premium · Esquí', 416000, 'Agosto 2025'],
      ['Marcos Villalba', 'Zona centro', 'Mendoza', 3, 'Estándar · Esquí', 1140000, 'Julio']
    ],
    // Porcentaje de clientes de la temporada según de dónde vienen
    origenes: [['Buenos Aires', 38], ['Brasil', 24], ['Chile', 14], ['Zona centro', 13], ['Colombia', 5], ['Otros', 6]],

    // estado: 'trabajando' | 'sin_fichar' | 'franco' | 'no_entro'
    personal: [
      { id: 'laura', nombre: 'Laura Méndez', rol: 'Administración', horario: '08:00 a 16:00', entrada: '07:56', estado: 'trabajando', semana: 31.5, extra: 0 },
      { id: 'nico', nombre: 'Nicolás Ferreyra', rol: 'Taller', horario: '07:30 a 15:30', entrada: '07:28', estado: 'trabajando', semana: 34, extra: 0 },
      { id: 'mati', nombre: 'Matías Gil', rol: 'Taller', horario: '08:00 a 16:00', entrada: '08:03', estado: 'trabajando', semana: 29, extra: 0 },
      { id: 'sofi', nombre: 'Sofía Herrera', rol: 'Mostrador', horario: '08:00 a 16:00', entrada: null, estado: 'sin_fichar', semana: 24, extra: 0 },
      { id: 'tomi', nombre: 'Tomás Quiroga', rol: 'Mostrador', horario: '08:00 a 16:00', entrada: '07:58', estado: 'trabajando', semana: 38.5, extra: 1.5 },
      { id: 'juli', nombre: 'Julieta Ponce', rol: 'Mostrador', horario: '12:00 a 20:00', entrada: null, estado: 'franco', semana: 32, extra: 0 },
      { id: 'raul', nombre: 'Raúl Benítez', rol: 'Chofer', horario: '07:00 a 15:00', entrada: '06:55', estado: 'trabajando', semana: 33, extra: 2 }
    ],
    pedidosDia: [
      { id: 'p1', quien: 'mati', dia: 'Jue 23', motivo: 'Trámite personal', estado: 'pendiente' },
      { id: 'p2', quien: 'sofi', dia: 'Lun 27', motivo: 'Cumpleaños de la hija', estado: 'pendiente' }
    ],
    roles: [
      ['Mostrador', ['Ver reservas', 'Asignar y entregar equipos', 'Recibir devoluciones', 'Fichar']],
      ['Taller', ['Ver la cola del taller', 'Marcar trabajos terminados', 'Anotar dónde queda cada equipo', 'Fichar']],
      ['Chofer', ['Ver los transfers del día', 'Fichar']],
      ['Administración', ['Crear y cambiar reservas', 'Caja y cierre del día', 'Garantías', 'Aprobar horas extra y días libres', 'Clientes']],
      ['Dueño', ['Todo, más los números del mes']]
    ],

    transfers: [
      { id: 't1', hora: '08:00', desde: 'Centro (plaza)', hacia: 'Base del cerro', combi: 'Combi 1', chofer: 'raul', lugares: 15, reservas: ['r1', 'r5'], estado: 'hecho' },
      { id: 't2', hora: '10:30', desde: 'Centro (plaza)', hacia: 'Base del cerro', combi: 'Combi 1', chofer: 'raul', lugares: 15, reservas: ['r2', 'r3', 'r8'], estado: 'proximo' },
      { id: 't3', hora: '17:30', desde: 'Base del cerro', hacia: 'Centro (plaza)', combi: 'Combi 1', chofer: 'raul', lugares: 15, reservas: ['r1', 'r4', 'r5'], estado: 'proximo' }
    ],

    // [nombre, descripción, conectado]
    conexiones: [
      ['Web de reservas', 'Las reservas de la web entran solas al sistema', true],
      ['WhatsApp', 'Reservas por audio o texto: se anotan solas y las revisás antes de confirmar', true],
      ['Procesador de pagos', 'Preautoriza la garantía y la libera al devolver', false],
      ['Planilla de horas', 'Las horas de cada uno pasan solas a la planilla', true],
      ['Correo de avisos', 'Avisos de fichaje, horas extra y garantías', true],
      ['Facturación', 'Factura electrónica de cada alquiler', false]
    ]
  };

  // ---------- Equipos (tablas): se arman a partir de los rangos de cada gama ----------
  // Cantidad por gama y cuántos de cada estado (además de los que ya figuran en las reservas)
  const CUANTOS = { estandar: { primero: 100, total: 140, alquilado: 80, taller: 14 }, premium: { primero: 400, total: 90, alquilado: 55, taller: 9 }, alta: { primero: 700, total: 50, alquilado: 31, taller: 6 } };
  const CLIENTES_SUELTOS = ['Paz', 'Acosta', 'Silva', 'Romero', 'Ferrari', 'Oliveira', 'Muñoz', 'Castro', 'Navarro', 'Ibáñez', 'Correa', 'Aguirre', 'Santos', 'Rey', 'Vidal'];
  const VUELVE = ['Dom 19', 'Lun 20', 'Mar 21', 'Mié 22'];
  let semilla = 7;
  const azar = () => { semilla = (semilla * 16807) % 2147483647; return (semilla - 1) / 2147483646; };
  const enReserva = {};
  D.reservas.forEach((r) => r.personas.forEach((p) => { if (p[7]) enReserva[p[7]] = r.id; }));
  D.equipos = [];
  D.gamas.forEach((g) => {
    const c = CUANTOS[g.id];
    const nums = Array.from({ length: c.total }, (_, i) => c.primero + i);
    const libres = nums.filter((n) => !enReserva[n]).sort(() => azar() - .5);
    const alq = new Set(libres.slice(0, c.alquilado - nums.filter((n) => enReserva[n]).length));
    const tal = new Set(libres.slice(alq.size, alq.size + c.taller));
    nums.forEach((n) => {
      const [tipo, marca, modelo] = D.modelos[g.id][n % 4];
      const largo = tipo === 'Snowboard' ? 146 + (n % 5) * 4 : 150 + (n % 7) * 5;
      const e = { n, gama: g.id, tipo, marca, modelo, largo, estado: 'disponible', ubic: '', reserva: null, cliente: '', vuelve: '' };
      if (enReserva[n]) { e.estado = 'alquilado'; e.reserva = enReserva[n]; }
      else if (alq.has(n)) { e.estado = 'alquilado'; e.cliente = 'Reserva ' + CLIENTES_SUELTOS[n % CLIENTES_SUELTOS.length]; e.vuelve = VUELVE[n % VUELVE.length]; }
      else if (tal.has(n)) { e.estado = 'taller'; e.ubic = 'Taller'; }
      else e.ubic = D.ubicaciones[g.id === 'estandar' ? (n < 170 ? 0 : 1) : g.id === 'premium' ? 2 : 3];
      D.equipos.push(e);
    });
  });
  // Órdenes del taller: una por cada equipo que está en el taller
  const QUIEN = ['nico', 'mati'];
  D.taller = D.equipos.filter((e) => e.estado === 'taller').map((e, i) => {
    const t = D.trabajos[[0, 1, 0, 2, 1, 3, 0, 1][i % 8]];
    return { id: 'o' + (i + 1), equipo: e.n, trabajo: t[0], min: t[1], estado: i % 5 === 0 ? 'haciendo' : 'en_cola', quien: QUIEN[i % 2],
      entro: `0${7 + (i % 3)}:${String(10 + ((i * 7) % 50)).padStart(2, '0')}`, nota: i === 3 ? 'Golpe en el canto, revisar antes de afilar' : '' };
  });
  // ---------- Filas como objetos (más claro para las pantallas) ----------
  const obj = (campos, a) => Object.fromEntries(campos.map((c, i) => [c, a[i]]));
  // Contrato: firmado online (web) o en la tablet al retirar. Fijaciones: las ajusta el técnico al entregar la tabla.
  const FIRMO_ONLINE = { r2: [0, 1], r3: [0, 1], r6: [0, 1, 2], r7: [0] };
  D.reservas.forEach((r) => {
    r.personas = r.personas.map((a, k) => {
      const p = obj(['nombre', 'tipo', 'gama', 'nivel', 'altura', 'peso', 'calzado', 'equipo', 'pago'], a);
      p.contrato = !!p.equipo || (FIRMO_ONLINE[r.id] || []).includes(k);
      p.fijacion = !!p.equipo; p.devuelto = false;
      return p;
    });
  });
  D.audioEjemplo.personas = D.audioEjemplo.personas.map((a) => obj(['nombre', 'tipo', 'gama', 'nivel'], a));
  D.espera = D.espera.map(([grupo, llegada]) => ({ grupo, llegada }));
  D.caja.movimientos = D.caja.movimientos.map((a) => obj(['hora', 'concepto', 'categoria', 'medio', 'monto'], a));
  D.clientes = D.clientes.map((a) => obj(['nombre', 'origen', 'ciudad', 'visitas', 'alquilo', 'gasto', 'ultima'], a));

  // ---------- Integraciones que suele tener un rental (estado: conectada | disponible) ----------
  D.integraciones = [
    { id: 'web', grupo: 'Reservas', nombre: 'Web de reservas', que: 'Reservan y pagan las 24 horas, con el stock en vivo', estado: 'conectada' },
    { id: 'whatsapp', grupo: 'Reservas', nombre: 'WhatsApp Business', que: 'Reservas por audio o texto, confirmaciones y aviso de devolución', estado: 'conectada' },
    { id: 'agencias', grupo: 'Reservas', nombre: 'Agencias y portales de turismo', que: 'Las reservas que venden agencias y portales entran solas, con su comisión', estado: 'disponible' },
    { id: 'convenios', grupo: 'Reservas', nombre: 'Hoteles y escuelas de esquí', que: 'Cada convenio con su código: sabés cuánto te trae cada uno', estado: 'disponible' },
    { id: 'pases', grupo: 'Reservas', nombre: 'Pases del cerro', que: 'Vendé el pase junto con el equipo, si el cerro lo permite', estado: 'disponible' },
    { id: 'mp', grupo: 'Cobros', nombre: 'Mercado Pago', que: 'Link de pago, QR y posnet en el mostrador', estado: 'conectada' },
    { id: 'garantia', grupo: 'Cobros', nombre: 'Preautorización de tarjeta', que: 'Retiene la garantía y la libera sola al devolver', estado: 'conectada' },
    { id: 'monedas', grupo: 'Cobros', nombre: 'Dólares y reales', que: 'Precios en pesos, dólares y reales con el cambio del día', estado: 'conectada' },
    { id: 'arca', grupo: 'Facturación y números', nombre: 'Factura electrónica (ARCA)', que: 'La factura de cada alquiler sale sola', estado: 'disponible' },
    { id: 'contador', grupo: 'Facturación y números', nombre: 'Planilla para el contador', que: 'Ventas, gastos y comprobantes del mes, listos para mandar', estado: 'conectada' },
    { id: 'sueldos', grupo: 'Facturación y números', nombre: 'Horas y sueldos', que: 'Las horas de cada uno pasan solas a la planilla', estado: 'conectada' },
    { id: 'contrato', grupo: 'Mostrador', nombre: 'Contrato con firma digital', que: 'El cliente firma el contrato y el deslinde en su celular o en la tablet', estado: 'conectada' },
    { id: 'lector', grupo: 'Mostrador', nombre: 'Lector de etiquetas', que: 'Escaneás la etiqueta de la tabla con el celular para entregar o recibir', estado: 'conectada' },
    { id: 'etiquetas', grupo: 'Mostrador', nombre: 'Impresora de etiquetas', que: 'Etiqueta con número y gama para cada tabla nueva', estado: 'disponible' },
    { id: 'fichador', grupo: 'Mostrador', nombre: 'Reloj de fichaje', que: 'Las entradas y salidas llegan solas; si falla, se ficha desde la tablet', estado: 'disponible' },
    { id: 'meta', grupo: 'Clientes y campañas', nombre: 'Meta (Instagram y Facebook)', que: 'Públicos con tus clientes por país para tus campañas', estado: 'disponible' },
    { id: 'resenas', grupo: 'Clientes y campañas', nombre: 'Reseñas de Google', que: 'Al devolver, el cliente recibe el pedido de reseña', estado: 'disponible' },
    { id: 'correo', grupo: 'Clientes y campañas', nombre: 'Correo', que: 'Confirmaciones, avisos de fichaje, horas extra y garantías', estado: 'conectada' },
    { id: 'nieve', grupo: 'Clientes y campañas', nombre: 'Parte de nieve y clima', que: 'El pronóstico del cerro junto a las reservas, para prever cuánta gente viene', estado: 'disponible' }
  ];
  delete D.conexiones;
  window.DATOS = D;
})();
