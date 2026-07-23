// data.js - Datos iniciales
const DIAS=["Do","Lu","Ma","Mi","Ju","Vi","Sa"];
const MESES=["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const COLORES=["#185FA5","#3B6D11","#993556","#854F0B","#533AB7","#0F6E56","#A32D2D","#444441","#185F5F","#6B3B11"];
const COLORES_L=["#E6F1FB","#EAF3DE","#FBEAF0","#FAEEDA","#EEEDFE","#E1F5EE","#FCEBEB","#F1EFE8","#E1F5F5","#FAF0E6"];
const COL_ORIG={airbnb:"#E8393A",directo:"#185FA5",mary:"#0F6E56",alejandra:"#993556",gestor:"#854F0B",otro:"#533AB7"};
const COL_LAB={airbnb:"Rojo (Airbnb)",directo:"Azul (Directo)",mary:"Verde (Mary)",alejandra:"Rosa (Alejandra)",gestor:"Naranja (Gestor)",otro:"Morado (Otro)"};
const LOGO_B64="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";
const DB_URL="https://script.google.com/macros/s/AKfycbxnuJU72VCmzkJ8CxKZqs3Mi9Yb5c87-EothQ3RMRdwITsklsKFGGMVIE4Ibt40PTQS/exec";
const PDF_URL="https://script.google.com/macros/s/AKfycbwQGyi981UZPiJS1-2MNL802YOfPIwSr4e4HkwDQCGIj5OyF1WrZ1QfCFVptP0lOZnz/exec";
const ICAL_BASE="https://hmorelos.github.io/albatros-app/";
const ICAL_UPDT="https://script.google.com/macros/s/AKfycbzedB-wel8IpQ5bF-ebFiNWF4ZNHOPMAODma6hCJkoIBvwrLxfMZbZx6j_5l2UQmKCinw/exec";
const REGL_DEF="https://docs.google.com/document/d/1nDyiRlUJ-Qn-MQCehdVszYFPwVovZ3W1WineLMSrG78/edit?usp=sharing";
const UBI_DEF="https://goo.gl/maps/aUSMKCMqsLnVWdFi9";
const ETQS=["{nombre}","{telefono}","{fecha_entrada}","{fecha_salida}","{dpto}","{depto_nombre}","{personas}","{ubicacion}","{reglamento}","{wifi}","{wifi_pass}","{monto}","{deposito}"];

function ld(k,d){try{return JSON.parse(localStorage.getItem(k)||"null")||d;}catch(e){return d;}}
function sv(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}syncTab(k,v);}
async function syncTab(k,v){
  const m={deps_v6:"departamentos",rsvp_v6:"reservas",egr_v6:"egresos",apart_v6:"apartados",usr_v6:"usuarios",tpl_v6:"templates",cfg_v6:"config"};
  const t=m[k];if(!t)return;
  try{await fetch(DB_URL+"?action=set&tab="+t+"&data="+encodeURIComponent(JSON.stringify(v)));}catch(e){}
}
async function cargarSheets(){
  const bar=document.getElementById("sync-bar");if(bar)bar.style.display="block";
  try{
    const r=await fetch(DB_URL+"?action=getAll");const all=await r.json();
    if(all.departamentos&&all.departamentos.length)deps=all.departamentos;
    if(all.reservas&&all.reservas.length)rsvps=all.reservas;
    if(all.egresos&&all.egresos.length)egrs=all.egresos;
    if(all.apartados&&all.apartados.length)aparts=all.apartados;
    if(all.usuarios&&all.usuarios.length)usrs=all.usuarios;
    if(all.templates&&Object.keys(all.templates).length)tpls=all.templates;
    if(all.config&&Object.keys(all.config).length)cfg=all.config;
    ["deps_v6","rsvp_v6","egr_v6","apart_v6","usr_v6","tpl_v6","cfg_v6"].forEach(function(k){
      var mk={deps_v6:deps,rsvp_v6:rsvps,egr_v6:egrs,apart_v6:aparts,usr_v6:usrs,tpl_v6:tpls,cfg_v6:cfg};
      try{localStorage.setItem(k,JSON.stringify(mk[k]));}catch(e){}
    });
    if(bar)bar.style.display="none";
  }catch(e){
    if(bar){bar.textContent="Sin conexion - usando datos locales";bar.style.background="var(--wg)";bar.style.color="var(--w)";setTimeout(function(){bar.style.display="none";},3000);}
  }
}

var deps=ld("deps_v6",[
  {id:"dep1",nom:"Albatros 16",num:"16",dir:"Albatros 16, Manzanillo, Colima",color:"#185FA5",colorL:"#E6F1FB",ical:"",icalF:[],icalS:null,ubi:UBI_DEF,acceso:"Pasar a recoger las llaves en la caseta de vigilancia. Check in a partir de las 3 PM, check out antes de las 11 AM.",telL:"",telA:"",wifi:"Albatros 16",wpass:"Ixtapa16",regl:REGL_DEF},
  {id:"dep2",nom:"Albatros 30",num:"30",dir:"Albatros 30, Manzanillo, Colima",color:"#3B6D11",colorL:"#EAF3DE",ical:"",icalF:[],icalS:null,ubi:UBI_DEF,acceso:"Pasar a recoger las llaves en la caseta de vigilancia. Check in a partir de las 3 PM, check out antes de las 11 AM.",telL:"",telA:"",wifi:"Albatros 30",wpass:"Ixtapa30",regl:REGL_DEF}
]);
var rsvps=ld("rsvp_v6",[]);
var egrs=ld("egr_v6",[]);
var aparts=ld("apart_v6",[]);
var usrs=ld("usr_v6",[{user:"Hector",pass:"Ruiz Morelos",rol:"admin"}]);
var tpls=ld("tpl_v6",{
  huesped:"Buen dia {nombre} confirmamos tu reserva del {fecha_entrada} al {fecha_salida}, pueden pasar a recoger las llaves del dpto {dpto} en la caseta de vigilancia, check in 3 PM, check out 11 AM.\n\nUBICACION {ubicacion}\nREGLAMENTO {reglamento}\nWiFi: {wifi} | Pass: {wifi_pass}",
  llaves:"Llegada proxima - {depto_nombre}\nHuesped: {nombre}\nEntrada: {fecha_entrada}\nSalida: {fecha_salida}\nPersonas: {personas}\n\nFavor tener el departamento listo.",
  admin:"Nueva llegada - {depto_nombre}\nHuesped: {nombre}\nEntrada: {fecha_entrada}\nSalida: {fecha_salida}\nPersonas: {personas}\n\nFavor coordinar acceso.",
  apartado:"Hola {nombre}, tu fecha del {fecha_entrada} al {fecha_salida} en {depto_nombre} quedo apartada por 24 hrs. Confirma a la brevedad.",
  liberado:"Hola {nombre}, la fecha del {fecha_entrada} al {fecha_salida} en {depto_nombre} fue liberada por vencimiento. Si aun tienes interes contactanos.",
  aseo:"Resumen de aseo\n\n{detalle}\n\nTotal: ${total}"
});
var cfg=ld("cfg_v6",{aseo16:250,aseo30:300});

var HISTORICAS=[
  {id:"h1",huesped:"Guillermo Gaytan",telefono:"526563546756",dep:"dep1",personas:6,entrada:"2026-07-03",salida:"2026-07-06",precio:1204.28,deposito:0,origen:"airbnb",colorReserva:"#E8393A",pago:"liquidada",anticipo:0,notas:"",mensajes:{},correo:""},
  {id:"h2",huesped:"Raul Gutierrez Quintanilla",telefono:"524424067215",dep:"dep2",personas:9,entrada:"2026-07-06",salida:"2026-07-10",precio:2100.00,deposito:0,origen:"directo",colorReserva:"#185FA5",pago:"liquidada",anticipo:0,notas:"",mensajes:{},correo:""},
  {id:"h3",huesped:"Raul Gutierrez Alvarez",telefono:"524424067215",dep:"dep1",personas:6,entrada:"2026-07-06",salida:"2026-07-10",precio:1400.00,deposito:0,origen:"directo",colorReserva:"#185FA5",pago:"liquidada",anticipo:0,notas:"",mensajes:{},correo:""},
  {id:"h4",huesped:"Hernan Ruiz Morelos",telefono:"524427485277",dep:"dep2",personas:9,entrada:"2026-07-10",salida:"2026-07-14",precio:0.01,deposito:0,origen:"directo",colorReserva:"#185FA5",pago:"liquidada",anticipo:0,notas:"Uso familiar",mensajes:{},correo:""},
  {id:"h5",huesped:"Hernan Ruiz Morelos",telefono:"524427485277",dep:"dep1",personas:6,entrada:"2026-07-10",salida:"2026-07-14",precio:0.10,deposito:0,origen:"directo",colorReserva:"#185FA5",pago:"liquidada",anticipo:0,notas:"Uso familiar",mensajes:{},correo:""},
  {id:"h6",huesped:"Rodrigo Sanchez Anguiano",telefono:"525555092940",dep:"dep2",personas:9,entrada:"2026-07-14",salida:"2026-07-18",precio:1775.02,deposito:0,origen:"airbnb",colorReserva:"#E8393A",pago:"liquidada",anticipo:0,notas:"",mensajes:{},correo:""},
  {id:"h7",huesped:"Ernesto Lopez",telefono:"524432731925",dep:"dep1",personas:6,entrada:"2026-07-15",salida:"2026-07-16",precio:1196.16,deposito:0,origen:"airbnb",colorReserva:"#E8393A",pago:"liquidada",anticipo:0,notas:"",mensajes:{},correo:""},
  {id:"h8",huesped:"Sara Mota Mora",telefono:"+524494482368",dep:"dep1",personas:6,entrada:"2026-07-16",salida:"2026-07-19",precio:1413.98,deposito:0,origen:"airbnb",colorReserva:"#E8393A",pago:"liquidada",anticipo:0,notas:"",mensajes:{},correo:""},
  {id:"h9",huesped:"Lizeth Gomez Aguilar",telefono:"524522106728",dep:"dep2",personas:9,entrada:"2026-07-18",salida:"2026-07-21",precio:5427.86,deposito:0,origen:"airbnb",colorReserva:"#E8393A",pago:"liquidada",anticipo:0,notas:"",mensajes:{},correo:""},
  {id:"h10",huesped:"Moises Lopez Fonseca",telefono:"524439441314",dep:"dep1",personas:6,entrada:"2026-07-19",salida:"2026-07-20",precio:1213.25,deposito:0,origen:"airbnb",colorReserva:"#E8393A",pago:"liquidada",anticipo:0,notas:"",mensajes:{},correo:""},
  {id:"h11",huesped:"Alejandra Morelos Borja",telefono:"524433902013",dep:"dep2",personas:9,entrada:"2026-07-20",salida:"2026-07-24",precio:300.00,deposito:0,origen:"alejandra",colorReserva:"#993556",pago:"liquidada",anticipo:0,notas:"",mensajes:{},correo:""},
  {id:"h12",huesped:"Liliana Marusa Castillo Bugallo",telefono:"525625470442",dep:"dep1",personas:6,entrada:"2026-07-20",salida:"2026-07-22",precio:2844.72,deposito:0,origen:"airbnb",colorReserva:"#E8393A",pago:"liquidada",anticipo:0,notas:"",mensajes:{},correo:""},
  {id:"h13",huesped:"Sandra Moyao",telefono:"527471213394",dep:"dep2",personas:7,entrada:"2026-07-22",salida:"2026-07-24",precio:1815.60,deposito:0,origen:"airbnb",colorReserva:"#E8393A",pago:"liquidada",anticipo:0,notas:"",mensajes:{},correo:""},
  {id:"h14",huesped:"Carla Esquivel",telefono:"527321113143",dep:"dep1",personas:6,entrada:"2026-07-22",salida:"2026-07-24",precio:1204.71,deposito:0,origen:"airbnb",colorReserva:"#E8393A",pago:"liquidada",anticipo:0,notas:"",mensajes:{},correo:""},
  {id:"h15",huesped:"Imelda Guadalupe Cruz Vizcaino",telefono:"523317930779",dep:"dep1",personas:6,entrada:"2026-07-24",salida:"2026-07-26",precio:5729.64,deposito:0,origen:"airbnb",colorReserva:"#E8393A",pago:"liquidada",anticipo:0,notas:"",mensajes:{},correo:""},
  {id:"h16",huesped:"Karina Sanchez Munoz",telefono:"523338094204",dep:"dep2",personas:9,entrada:"2026-07-24",salida:"2026-07-28",precio:2115.95,deposito:0,origen:"airbnb",colorReserva:"#E8393A",pago:"liquidada",anticipo:0,notas:"",mensajes:{},correo:""},
  {id:"h17",huesped:"Daniela Yuritxi Mendez Bernal",telefono:"524691420746",dep:"dep2",personas:9,entrada:"2026-07-28",salida:"2026-07-31",precio:2154.48,deposito:0,origen:"airbnb",colorReserva:"#E8393A",pago:"liquidada",anticipo:0,notas:"",mensajes:{},correo:""},
  {id:"h18",huesped:"Fernando Esquivias Vargas",telefono:"524611007174",dep:"dep1",personas:6,entrada:"2026-07-29",salida:"2026-08-01",precio:1400.00,deposito:0,origen:"directo",colorReserva:"#185FA5",pago:"liquidada",anticipo:0,notas:"",mensajes:{},correo:""}
];

function cargarHistoricas(){
  if(ld("hist_v1",false))return;
  HISTORICAS.forEach(function(h){
    if(!rsvps.find(function(r){return r.huesped===h.huesped&&r.entrada===h.entrada&&r.dep===h.dep;}))
      rsvps.push(h);
  });
  sv("rsvp_v6",rsvps);
  sv("hist_v1",true);
}
