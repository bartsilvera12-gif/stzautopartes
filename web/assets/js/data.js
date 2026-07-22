/* ============================================================
   STZ AUTOPARTES · datos de demostración
   Reemplazar por la respuesta del ERP cuando se conecte la API.

   FOTOS · viven en assets/img/fotos/.
   · Las que empiezan con `cat-` son de STZ (categorías motores, bombas,
     eléctrico, burletes e interior).
   · El resto son de banco (Pexels, uso libre, sin atribución) y son
     PROVISORIAS: corresponden al rubro de cada pieza, no a la unidad real.
   Para reemplazar cualquiera basta con cambiar el nombre de archivo en
   `img` y `photos` — no hay que tocar el HTML.
   ============================================================ */

/* Número de WhatsApp de la tienda — REEMPLAZAR por el real (formato internacional, sin +) */
const STZ_WHATSAPP = '595973738238';

const STZ_CATEGORIES = [
  { id:'burletes',  code:'CAT · 01', name:'Burletes y molduras',            count:64,  img:'cat-burletes.jpg', ph:'Burletes y molduras' },
  { id:'faros',     code:'CAT · 02', name:'Faros, señaleros e iluminación', count:312, img:'faro-delantero.jpg', ph:'Faros e iluminación' },
  { id:'comandos',  code:'CAT · 03', name:'Comandos y botones',             count:97,  img:'comandos.jpg',     ph:'Comandos alza vidrio' },
  { id:'electrico', code:'CAT · 04', name:'Sistema eléctrico y electrónico',count:184, img:'cat-electrico.jpg',ph:'Sistema eléctrico' },
  { id:'interior',  code:'CAT · 05', name:'Interior y cabina',              count:128, img:'cat-interior.jpg', ph:'Interior y cabina' },
  { id:'bombas',    code:'CAT · 06', name:'Bombas de combustible',          count:86,  img:'cat-bombas.jpg',   ph:'Bombas de combustible' },
  { id:'frisos',    code:'CAT · 07', name:'Frisos de techo',                count:41,  img:'cabina-techo.jpg', ph:'Frisos de techo' },
  { id:'motores',   code:'CAT · 09', name:'Motores y cajas',                count:73,  img:'cat-motores.jpg',  ph:'Motores y cajas' },
  { id:'otras',     code:'CAT · 10', name:'Cubre piedras, cubre barros y otras autopartes', count:155, img:'otras.jpg', ph:'Otras autopartes' }
];

/* condition: nuevo | usado | recuperado   ·   stock: número o null (= consultar)
   photos: [archivo, epígrafe] — la primera es la principal */
const STZ_PRODUCTS = [
  {
    id:'P-024', oem:'5U0941005', internal:'STZ-P024', name:'Faro delantero izquierdo con lente ámbar',
    category:'faros', brand:'Volkswagen', model:'Gol Trend', yearFrom:2010, yearTo:2013,
    condition:'usado', price:480000, stock:1, side:'Izquierdo · frontal', unit:'04-118',
    img:'faro-delantero.jpg', ph:'Faro delantero izquierdo',
    notes:'Lente sin fisuras. Marcas mínimas de uso en carcasa. Reflector interior íntegro. Conector original en buen estado. Se prueba antes de despachar.',
    compat:[['VW Gol Trend 10–13',1],['VW Voyage 10–13',1],['VW Saveiro 11–13 (verificar)',0]],
    photos:[['faro-delantero.jpg','Vista principal'],['faro-detalle.jpg','Detalle de la óptica'],['paragolpe.jpg','Montaje en el frente'],['taller.jpg','Depósito STZ']],
    featured:true
  },
  {
    id:'P-025', oem:'5U0941006', internal:'STZ-P025', name:'Faro delantero derecho con lente ámbar',
    category:'faros', brand:'Volkswagen', model:'Gol Trend', yearFrom:2010, yearTo:2013,
    condition:'usado', price:480000, stock:2, side:'Derecho · frontal', unit:'04-118',
    img:'faro-delantero.jpg', ph:'Faro delantero derecho',
    notes:'Lente sin fisuras. Carcasa con marcas leves de montaje. Probado antes del despacho.',
    compat:[['VW Gol Trend 10–13',1],['VW Voyage 10–13',1]],
    photos:[['faro-delantero.jpg','Vista principal'],['faro-detalle.jpg','Detalle de la óptica'],['paragolpe.jpg','Montaje en el frente']]
  },
  {
    id:'P-118', oem:'377959855', internal:'STZ-P118', name:'Comando alza vidrio conductor 4 botones',
    category:'comandos', brand:'Volkswagen', model:'Gol / Voyage', yearFrom:2008, yearTo:2015,
    condition:'nuevo', price:145000, stock:4, side:'Izquierdo · puerta conductor', unit:null,
    img:'comandos.jpg', ph:'Comando alza vidrio 4 botones',
    notes:'Pieza nueva en caja. Conector original. Garantía de 30 días por falla de fábrica.',
    compat:[['VW Gol 08–15',1],['VW Voyage 08–15',1],['VW Saveiro 10–14 (verificar)',0]],
    photos:[['comandos.jpg','Vista principal'],['comandos-2.jpg','Detalle de botones'],['butaca-vw.jpg','Ubicación en la puerta']],
    featured:true
  },
  {
    id:'P-201', oem:'6R0919051', internal:'STZ-P201', name:'Bomba de combustible completa con flotante',
    category:'bombas', brand:'Volkswagen', model:'Polo', yearFrom:2011, yearTo:2014,
    condition:'recuperado', price:620000, stock:1, side:'Tanque', unit:'04-118',
    img:'motor-partes.jpg', ph:'Bomba de combustible',
    note:'Desgaste leve visible en carcasa',
    notes:'Recuperada y verificada en banco de pruebas. Presenta desgaste leve visible en la carcasa. Flotante y aforador funcionando.',
    compat:[['VW Polo 11–14',1],['VW Fox 10–14 (verificar)',0]],
    photos:[['motor-partes.jpg','Vista principal'],['motor.jpg','Conjunto del motor'],['alternador.jpg','Auxiliares'],['taller.jpg','Banco de pruebas']],
    featured:true
  },
  {
    id:'P-047', oem:null, internal:'STZ-B47', name:'Burlete de puerta trasera derecha',
    category:'burletes', brand:'Fiat', model:'Palio', yearFrom:2008, yearTo:2013,
    condition:'usado', price:95000, stock:null, side:'Derecho · trasero', unit:'04-092',
    img:'burletes.jpg', ph:'Burlete de puerta',
    notes:'Goma flexible, sin cortes. Puede requerir limpieza previa al montaje.',
    compat:[['Fiat Palio 08–13',1],['Fiat Siena 08–13 (verificar)',0]],
    photos:[['burletes.jpg','Vista principal'],['butaca-vw.jpg','Marco de puerta'],['taller.jpg','Depósito STZ']],
    featured:true
  },
  {
    id:'P-206', oem:'51890370', internal:'STZ-P206', name:'Faro delantero derecho compatible',
    category:'faros', brand:'Fiat', model:'Palio', yearFrom:2012, yearTo:2016,
    condition:'nuevo', price:720000, stock:3, side:'Derecho · frontal', unit:null,
    img:'faro-detalle.jpg', ph:'Faro delantero Fiat Palio',
    notes:'Pieza nueva de línea alternativa homologada. Óptica clara, sin regulador eléctrico.',
    compat:[['Fiat Palio 12–16',1],['Fiat Grand Siena 12–16',1]],
    photos:[['faro-detalle.jpg','Vista principal'],['faro-delantero.jpg','Ángulo lateral'],['paragolpe.jpg','Montaje en el frente']],
    featured:true
  },
  {
    id:'P-220', oem:null, internal:'STZ-O220', name:'Óptica trasera izquierda con desgaste leve',
    category:'faros', brand:'Chevrolet', model:'Corsa', yearFrom:2005, yearTo:2008,
    condition:'recuperado', price:210000, stock:1, side:'Izquierdo · trasero', unit:'04-076',
    img:'optica-trasera.jpg', ph:'Óptica trasera Corsa',
    note:'Micro rayas en el lente',
    notes:'Lente con micro rayas por uso. Portalámparas completo y probado. Última unidad disponible.',
    compat:[['Chevrolet Corsa 05–08',1]],
    photos:[['optica-trasera.jpg','Vista principal'],['taller.jpg','Depósito STZ']]
  },
  {
    id:'P-231', oem:'6Q0949117A', internal:'STZ-P231', name:'Señalero lateral guardabarros ámbar',
    category:'faros', brand:'Volkswagen', model:'Fox / Polo', yearFrom:2003, yearTo:2010,
    condition:'nuevo', price:45000, stock:12, side:'Ambos lados', unit:null,
    img:'optica-trasera.jpg', ph:'Señalero lateral ámbar',
    notes:'Pieza nueva, universal para ambos lados. Incluye lámpara.',
    compat:[['VW Fox 03–10',1],['VW Polo 03–08',1],['VW Gol 06–12 (verificar)',0]],
    photos:[['optica-trasera.jpg','Vista principal'],['faro-detalle.jpg','Detalle del lente']]
  },
  {
    id:'P-118L', oem:null, internal:'STZ-L118', name:'Luz de patente completa con cableado',
    category:'electrico', brand:'Ford', model:'Ka', yearFrom:2010, yearTo:2015,
    condition:'usado', price:60000, stock:null, side:'Trasero', unit:'04-104',
    img:'optica-trasera.jpg', ph:'Luz de patente con cableado',
    notes:'Incluye cableado original de 30 cm. Probada antes del despacho.',
    compat:[['Ford Ka 10–15',1]],
    photos:[['optica-trasera.jpg','Vista principal'],['parrilla.jpg','Zona de montaje'],['taller.jpg','Depósito STZ']]
  },
  {
    id:'P-208', oem:'0124325003', internal:'STZ-P208', name:'Alternador Bosch 90A',
    category:'electrico', brand:'Volkswagen', model:'Gol Trend', yearFrom:2010, yearTo:2013,
    condition:'usado', price:320000, stock:1, side:'Motor', unit:'04-118',
    img:'alternador.jpg', ph:'Alternador Bosch',
    notes:'Probado en banco: carga correcta. Poleas y bornes en buen estado.',
    compat:[['VW Gol Trend 10–13',1],['VW Voyage 10–13',1]],
    photos:[['alternador.jpg','Vista principal'],['motor.jpg','Ubicación en el motor'],['motor-partes.jpg','Auxiliares del bloque']],
    featured:true
  },
  {
    id:'P-212', oem:'5U0919051', internal:'STZ-P212', name:'Bomba de combustible Gol Trend',
    category:'bombas', brand:'Volkswagen', model:'Gol Trend', yearFrom:2010, yearTo:2013,
    condition:'usado', price:620000, stock:1, side:'Tanque', unit:'04-118',
    img:'motor-partes.jpg', ph:'Bomba de combustible Gol Trend',
    notes:'Extraída de la unidad 04-118. Probada con presión de línea.',
    compat:[['VW Gol Trend 10–13',1],['VW Voyage 10–13',1]],
    photos:[['motor-partes.jpg','Vista principal'],['motor.jpg','Conjunto del motor'],['taller.jpg','Banco de pruebas']]
  },
  {
    id:'P-214', oem:'030103475', internal:'STZ-P214', name:'Tapa de válvulas 1.6 8v',
    category:'motores', brand:'Volkswagen', model:'Gol Trend', yearFrom:2010, yearTo:2013,
    condition:'usado', price:180000, stock:2, side:'Motor', unit:'04-118',
    img:'motor.jpg', ph:'Tapa de válvulas 1.6',
    notes:'Sin fisuras. Junta no incluida.',
    compat:[['VW Gol Trend 10–13',1],['VW Fox 06–13 (verificar)',0]],
    photos:[['motor.jpg','Vista principal'],['motor-partes.jpg','Detalle del bloque'],['alternador.jpg','Auxiliares']]
  },
  {
    id:'P-217', oem:'030129713', internal:'STZ-P217', name:'Múltiple de admisión completo',
    category:'motores', brand:'Volkswagen', model:'Gol Trend', yearFrom:2010, yearTo:2013,
    condition:'usado', price:240000, stock:1, side:'Motor', unit:'04-118',
    img:'motor-partes.jpg', ph:'Múltiple de admisión',
    notes:'Incluye cuerpo de mariposa. Sensores no incluidos.',
    compat:[['VW Gol Trend 10–13',1]],
    photos:[['motor-partes.jpg','Vista principal'],['motor.jpg','Conjunto del motor']]
  },
  {
    id:'P-230', oem:null, internal:'STZ-M230', name:'Motor 1.6 8v completo con caja manual',
    category:'motores', brand:'Volkswagen', model:'Gol Trend', yearFrom:2010, yearTo:2013,
    condition:'usado', price:4800000, stock:1, side:'Motor', unit:'04-118',
    img:'motor.jpg', ph:'Motor 1.6 8v completo',
    notes:'Unidad completa con caja manual de 5 velocidades. Compresión medida en los cuatro cilindros. Se entrega con informe de estado.',
    compat:[['VW Gol Trend 10–13',1],['VW Voyage 10–13',1],['VW Saveiro 11–13 (verificar)',0]],
    photos:[['motor.jpg','Vista principal'],['motor-partes.jpg','Auxiliares'],['alternador.jpg','Distribución'],['taller-2.jpg','Extracción de la unidad']],
    featured:true
  },
  {
    id:'P-041', oem:null, internal:'STZ-P041', name:'Paragolpe delantero completo',
    category:'otras', brand:'Volkswagen', model:'Gol Trend', yearFrom:2010, yearTo:2013,
    condition:'usado', price:780000, stock:1, side:'Frontal', unit:'04-118',
    img:'paragolpe.jpg', ph:'Paragolpe delantero',
    notes:'Sin roturas estructurales. Presenta rayas de uso. Se entrega sin pintar.',
    compat:[['VW Gol Trend 10–13',1]],
    photos:[['paragolpe.jpg','Vista principal'],['parrilla.jpg','Zona de la parrilla'],['taller-2.jpg','Desmontaje']]
  },
  {
    id:'P-052', oem:null, internal:'STZ-P052', name:'Parrilla frontal con emblema',
    category:'otras', brand:'Volkswagen', model:'Gol Trend', yearFrom:2010, yearTo:2013,
    condition:'usado', price:220000, stock:2, side:'Frontal', unit:'04-118',
    img:'parrilla.jpg', ph:'Parrilla frontal con emblema',
    notes:'Clips completos. Emblema original incluido.',
    compat:[['VW Gol Trend 10–13',1]],
    photos:[['parrilla.jpg','Vista principal'],['paragolpe.jpg','Conjunto frontal']]
  },
  {
    id:'P-063', oem:null, internal:'STZ-P063', name:'Guardabarros delantero izquierdo',
    category:'otras', brand:'Volkswagen', model:'Gol Trend', yearFrom:2010, yearTo:2013,
    condition:'usado', price:340000, stock:1, side:'Izquierdo · frontal', unit:'04-118',
    img:'paragolpe.jpg', ph:'Guardabarros delantero izquierdo',
    notes:'Chapa sana, sin óxido perforante. Requiere pintura.',
    compat:[['VW Gol Trend 10–13',1]],
    photos:[['paragolpe.jpg','Vista principal'],['unidad-lateral.jpg','Ubicación en el vehículo']]
  },
  {
    id:'P-310', oem:null, internal:'STZ-F310', name:'Friso de techo con tapizado gris',
    category:'frisos', brand:'Toyota', model:'Corolla', yearFrom:2009, yearTo:2013,
    condition:'usado', price:150000, stock:1, side:'Techo', unit:'04-081',
    img:'cabina-techo.jpg', ph:'Friso de techo tapizado',
    notes:'Tapizado sin manchas ni descolgamiento. Sin quiebres en los bordes.',
    compat:[['Toyota Corolla 09–13',1]],
    photos:[['cabina-techo.jpg','Vista principal'],['butaca-vw.jpg','Detalle del tapizado']]
  },
  {
    id:'P-322', oem:null, internal:'STZ-I322', name:'Butaca delantera derecha en tela',
    category:'interior', brand:'Toyota', model:'Corolla', yearFrom:2009, yearTo:2013,
    condition:'usado', price:850000, stock:1, side:'Derecho · delantero', unit:'04-081',
    img:'butaca-cuero.jpg', ph:'Butaca delantera',
    notes:'Tela sin roturas, espuma firme. Rieles funcionando.',
    compat:[['Toyota Corolla 09–13',1]],
    photos:[['butaca-cuero.jpg','Vista principal'],['butaca-vw.jpg','Respaldo'],['cabina-techo.jpg','Ubicación en cabina']],
    featured:true
  },
  {
    id:'P-334', oem:null, internal:'STZ-E334', name:'Módulo de vidrios eléctricos 4 puertas',
    category:'electrico', brand:'Peugeot', model:'207', yearFrom:2009, yearTo:2013,
    condition:'recuperado', price:290000, stock:1, side:'Cabina', unit:'04-063',
    img:'comandos-2.jpg', ph:'Módulo de vidrios eléctricos',
    note:'Recuperado y verificado',
    notes:'Módulo recuperado y probado en banco. Todas las salidas funcionando.',
    compat:[['Peugeot 207 09–13',1]],
    photos:[['comandos-2.jpg','Vista principal'],['comandos.jpg','Comando asociado'],['taller.jpg','Banco de pruebas']]
  }
];

/* Unidades en desarme · la foto lateral se usa como plano de zonas.
   Cada unidad puede publicar UNA o MÁS fotos:
     - img:  string       → foto principal (obligatoria)
     - imgs: [string,...] → opcional, extras (además de la principal) para el carrusel del detalle
   Ejemplo:
     img:  'unidades/toyota-voxy-2010.jpg',
     imgs: ['unidades/toyota-voxy-2010-frente.jpg', 'unidades/toyota-voxy-2010-interior.jpg']
*/
const STZ_UNITS = (() => {
  const baseZones = (m) => ([
    { n:1, x:14, y:52, name:'Frente',  count:m.frente, desc:'Paragolpe, parrilla, faros, guardabarros y soportes frontales.', parts:[] },
    { n:2, x:30, y:44, name:'Motor',   count:m.motor,  desc:'Motor completo, bomba de combustible, alternador y auxiliares del bloque.', parts:[] },
    { n:3, x:46, y:36, name:'Cabina',  count:m.cabina, desc:'Tablero, butacas, comandos y guarnecidos interiores.', parts:[] },
    { n:4, x:60, y:56, name:'Puertas', count:m.puertas,desc:'Puertas completas, burletes, alza vidrios y espejos.', parts:[] },
    { n:5, x:78, y:48, name:'Cola',    count:m.cola,   desc:'Portón, ópticas traseras, paragolpe trasero y luz de patente.', parts:[] }
  ]);
  return [
    {
      code:'04-201', name:'Toyota Voxy', year:2010, engine:'3ZR-FAE', gearbox:'CVT K111', fuel:'Nafta',
      pieces:46, status:'ok', img:'unidades/toyota-voxy-2010.jpg', ph:'Toyota Voxy 2010 — vista lateral',
      zones: baseZones({ frente:10, motor:14, cabina:12, puertas:6, cola:4 })
    },
    {
      code:'04-198', name:'Toyota Wish', year:2010, engine:'2ZR-FAE', gearbox:'CVT K310', fuel:'Nafta',
      pieces:38, status:'ok', img:'unidades/toyota-wish-2010.jpg', ph:'Toyota Wish 2010 — vista lateral',
      zones: baseZones({ frente:9, motor:12, cabina:9, puertas:5, cola:3 })
    },
    {
      code:'04-193', name:'Toyota Vitz RS', year:2007, engine:'1NZ-FE', gearbox:'Manual 5v', fuel:'Nafta',
      pieces:31, status:'ok', img:'unidades/toyota-vitz-rs-2005-2007.jpg', ph:'Toyota Vitz RS 2007 — vista lateral',
      zones: baseZones({ frente:8, motor:10, cabina:7, puertas:4, cola:2 })
    },
    {
      code:'04-187', name:'Toyota Premio', year:2012, engine:'1NZ-FE', gearbox:'CVT', fuel:'Nafta',
      pieces:44, status:'ok', img:'unidades/toyota-premio-2012.jpg', ph:'Toyota Premio 2012 — vista lateral',
      zones: baseZones({ frente:10, motor:13, cabina:11, puertas:6, cola:4 })
    },
    {
      code:'04-181', name:'Toyota Auris', year:2010, engine:'1ZR-FE', gearbox:'CVT', fuel:'Nafta',
      pieces:29, status:'ok', img:'unidades/toyota-auris-2010.jpg', ph:'Toyota Auris 2010 — vista lateral',
      zones: baseZones({ frente:7, motor:10, cabina:6, puertas:4, cola:2 })
    },
    {
      code:'04-174', name:'Toyota Axio', year:2005, engine:'1NZ-FE', gearbox:'Automática 4v', fuel:'Nafta',
      pieces:22, status:'low', img:'unidades/toyota-axio-2005.jpg', ph:'Toyota Axio 2005 — vista lateral',
      zones: baseZones({ frente:5, motor:8, cabina:5, puertas:3, cola:1 })
    },
    {
      code:'04-165', name:'Toyota Vitz', year:2005, engine:'2SZ-FE', gearbox:'Automática 4v', fuel:'Nafta',
      pieces:24, status:'ok', img:'unidades/toyota-vitz-2005.jpg', ph:'Toyota Vitz 2005 — vista lateral',
      zones: baseZones({ frente:6, motor:9, cabina:5, puertas:3, cola:1 })
    },
    {
      code:'04-158', name:'Toyota Duet', year:2003, engine:'EJ-VE 1.0', gearbox:'Automática 4v', fuel:'Nafta',
      pieces:17, status:'low', img:'unidades/toyota-duet-2003.jpg', ph:'Toyota Duet 2003 — vista lateral',
      zones: baseZones({ frente:4, motor:7, cabina:3, puertas:2, cola:1 })
    },
    {
      code:'04-142', name:'Toyota MR-S', year:1999, engine:'1ZZ-FE', gearbox:'Manual 5v', fuel:'Nafta',
      pieces:19, status:'low', img:'unidades/toyota-mr-s-1999.jpg', ph:'Toyota MR-S 1999 — vista lateral',
      zones: baseZones({ frente:4, motor:8, cabina:4, puertas:2, cola:1 })
    },
    {
      code:'04-136', name:'Kia Rio', year:2014, engine:'G4FA 1.4', gearbox:'Manual 5v', fuel:'Nafta',
      pieces:33, status:'ok', img:'unidades/kia-rio-2014.jpg', ph:'Kia Rio 2014 — vista lateral',
      zones: baseZones({ frente:8, motor:11, cabina:7, puertas:5, cola:2 })
    }
  ];
})();

const STZ_CONDITION_LABEL = { nuevo:'Nuevo', usado:'Usado original', recuperado:'Recuperado verificado' };
const STZ_CONDITION_SHORT = { nuevo:'NUEVO', usado:'USADO ORIGINAL', recuperado:'RECUPERADO VERIF.' };
