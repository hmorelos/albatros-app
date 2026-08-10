// app.js - Logica principal
// Albatros Departamentos

var mes=new Date().getMonth(),ano=new Date().getFullYear();
var editRsvp=null,editEgr=null,editDep=null,confirmCb=null,colorSel=COLORES[0],tabAct="cal",finTabAct="res",focusTpl=null;
var depById=function(id){return normDep(deps.find(function(d){return d.id===id;}));};
var WA_REPORTE_NUM="524431702533";
var ICAL_AUTO_SYNC_MS=6*60*60*1000;

var toggleAnticipo=function(){document.getElementById("fg-anticipo").style.display=document.getElementById("f-pago").value==="parcial"?"":"none";};
var updateColor=function(){var o=document.getElementById("f-origen").value;document.getElementById("f-color").value=COL_ORIG[o]||"#185FA5";document.getElementById("color-lbl").textContent=COL_LAB[o]||"";};
function fechaHoy(){var d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");}
function fmtD(s){return new Date(s+"T12:00:00").toLocaleDateString("es-MX",{day:"2-digit",month:"2-digit",year:"numeric"});}
function fmtDL(s){return new Date(s+"T12:00:00").toLocaleDateString("es-MX",{weekday:"long",year:"numeric",month:"long",day:"numeric"});}
function noches(e,s){return Math.round((new Date(s)-new Date(e))/86400000);}
function parseMonto(v){
  var t=(v===undefined||v===null)?"":String(v).trim();
  if(!t)return 0;
  return parseFloat(t)||0;
}
function saldoPendienteRsvp(r){return Math.max(0,(parseFloat(r.precio)||0)-(parseFloat(r.deposito)||0));}
function rsvpConAdeudo(r){return (r.pago||"pendiente")!=="liquidada"&&saldoPendienteRsvp(r)>0;}
function totalPorCobrar(list){return list.reduce(function(s,r){return s+saldoPendienteRsvp(r);},0);}

function aplicarTpl(tpl,r){
  var dep=depById(r.dep)||{};
  return tpl
    .replace(/\{nombre\}/g,r.huesped||r.nombre||"")
    .replace(/\{telefono\}/g,r.telefono||"")
    .replace(/\{fecha_entrada\}/g,fmtD(r.entrada))
    .replace(/\{fecha_salida\}/g,fmtD(r.salida))
    .replace(/\{dpto\}/g,dep.num||"")
    .replace(/\{depto_nombre\}/g,dep.nom||"")
    .replace(/\{personas\}/g,r.personas||"")
    .replace(/\{ubicacion\}/g,dep.ubi||UBI_DEF)
    .replace(/\{reglamento\}/g,dep.regl||REGL_DEF)
    .replace(/\{wifi\}/g,dep.wifi||"")
    .replace(/\{wifi_pass\}/g,dep.wpass||"")
    .replace(/\{monto\}/g,(r.precio||0).toLocaleString("es-MX"))
    .replace(/\{deposito\}/g,(r.deposito||0).toLocaleString("es-MX"));
}


// TABS
function setTab(tab,el){
  tabAct=tab;
  document.querySelectorAll(".tab").forEach(function(t){t.classList.remove("active");});
  el.classList.add("active");
  ["cal","rsvp","apart","hist","fin","msg","dep","usr"].forEach(function(t){
    document.getElementById("tab-"+t).style.display=t===tab?"":"none";
  });
  if(tab==="rsvp"){updFilDep();renderRsvp();}
  else if(tab==="apart"){limpiarAparts();renderAparts();}
  else if(tab==="hist")renderHist();
  else if(tab==="fin"){poblarMeses();renderFin();}
  else if(tab==="msg")renderMsg();
  else if(tab==="dep")renderDeps();
  else if(tab==="usr")renderUsrs();
}
function setFinTab(tab,el){
  finTabAct=tab;
  document.querySelectorAll(".fin-tab").forEach(function(t){t.classList.remove("active");});
  el.classList.add("active");
  ["res","depto","aseo","ing","egr"].forEach(function(t){document.getElementById("ft-"+t).style.display=t===tab?"":"none";});
  if(tab==="res")renderRes();
  else if(tab==="depto")renderDepto();
  else if(tab==="aseo")renderAseo();
  else if(tab==="ing")renderIng();
  else renderEgr();
}

function getTabBtn(tab){
  var idx={cal:0,rsvp:1,apart:2,hist:3,fin:4,msg:5,dep:6,usr:7}[tab];
  return typeof idx==="number"?document.querySelectorAll(".tab")[idx]:null;
}
function goTab(tab){
  var b=getTabBtn(tab);
  if(b)setTab(tab,b);
}
function getFinBtn(tab){
  var idx={res:0,depto:1,aseo:2,ing:3,egr:4}[tab];
  return typeof idx==="number"?document.querySelectorAll(".fin-tab")[idx]:null;
}
function goFinTab(tab){
  var b=getFinBtn(tab);
  if(b)setFinTab(tab,b);
}

function setRsvpFiltros(dep,est,pago,msg){
  document.getElementById("fil-dep").value=dep||"todos";
  document.getElementById("fil-est").value=est||"todos";
  document.getElementById("fil-pago").value=pago||"todos";
  document.getElementById("fil-msg").value=msg||"todos";
}
function enfocarReserva(id){
  setTimeout(function(){
    var el=document.getElementById("rsvp-"+id);
    if(!el)return;
    el.scrollIntoView({behavior:"smooth",block:"center"});
    el.style.boxShadow="0 0 0 2px var(--i)";
    setTimeout(function(){el.style.boxShadow="";},1800);
  },80);
}
function verReserva(id,est,pago,msg){
  goTab("rsvp");
  setRsvpFiltros("todos",est||"todos",pago||"todos",msg||"todos");
  renderRsvp();
  if(id)enfocarReserva(id);
}

function verDeptos(){
  goTab("dep");
}
function verProximasLlegadas(){
  verReserva(null,"prox","todos","todos");
}
function verIngresosMes(){
  goTab("fin");
  goFinTab("ing");
  var h=new Date(),ms=h.getFullYear()+"-"+String(h.getMonth()+1).padStart(2,"0");
  var filMes=document.getElementById("fil-ing-mes");
  if(filMes)filMes.value=ms;
  var filDep=document.getElementById("fil-ing-dep");
  if(filDep)filDep.value="todos";
  renderIng();
}
function verPorCobrar(){
  verReserva(null,"todos","pendiente","todos");
}
function verApartados(){
  goTab("apart");
}
function verMensajesPendientes(){
  var hoy=fechaHoy();
  var pendientes=rsvps.filter(function(r){return msgPendiente(r)&&r.salida>=hoy;}).sort(function(a,b){return a.entrada.localeCompare(b.entrada);});
  verReserva(pendientes.length?pendientes[0].id:null,"prox","todos","pendmsg");
}
function verLlegadasHoy(){
  var hoy=fechaHoy();
  var llegadas=rsvps.filter(function(r){return r.entrada===hoy;}).sort(function(a,b){return a.entrada.localeCompare(b.entrada);});
  verReserva(llegadas.length===1?llegadas[0].id:null,"prox","todos","todos");
}
function verLlegadasManana(){
  var man=new Date();
  man.setDate(man.getDate()+1);
  var manS=man.getFullYear()+"-"+String(man.getMonth()+1).padStart(2,"0")+"-"+String(man.getDate()).padStart(2,"0");
  var llegadas=rsvps.filter(function(r){return r.entrada===manS;}).sort(function(a,b){return a.entrada.localeCompare(b.entrada);});
  verReserva(llegadas.length===1?llegadas[0].id:null,"prox","todos","todos");
}
function verSalidasHoy(){
  var hoy=fechaHoy();
  var salidas=rsvps.filter(function(r){return r.salida===hoy;}).sort(function(a,b){return a.entrada.localeCompare(b.entrada);});
  verReserva(salidas.length===1?salidas[0].id:null,"prox","todos","todos");
}
function verApartadosPorVencer(){
  goTab("apart");
}

function irAMesFecha(fecha){
  if(!fecha)return;
  var d=new Date(fecha+"T12:00:00");
  mes=d.getMonth();
  ano=d.getFullYear();
}

// CALENDARIO
function cambiarMes(d){mes+=d;if(mes>11){mes=0;ano++;}if(mes<0){mes=11;ano--;}renderCal();}
function origenColor(o,c){if(c)return c;return COL_ORIG[o]||"#666";}

function diasDep(depId){
  var local=new Map(),ical=new Set(),ap=new Set();
  rsvps.filter(function(r){return r.dep===depId;}).forEach(function(r){
    var col=r.colorReserva||origenColor(r.origen,"");
    var d=new Date(r.entrada+"T12:00:00");
    var fin=new Date(r.salida+"T12:00:00");
    while(d<fin){
      local.set(d.toISOString().slice(0,10),{color:col,huesped:r.huesped,precio:r.precio,id:r.id,entrada:r.entrada,salida:r.salida});
      d.setDate(d.getDate()+1);
    }
  });
  var dep=depById(depId);
  if(dep&&dep.icalF)dep.icalF.forEach(function(f){ical.add(f);});
  limpiarAparts();
  aparts.filter(function(a){return a.dep===depId;}).forEach(function(a){
    var d=new Date(a.entrada+"T12:00:00");
    var fin=new Date(a.salida+"T12:00:00");
    while(d<fin){ap.add(d.toISOString().slice(0,10));d.setDate(d.getDate()+1);}
  });
  return{local:local,ical:ical,ap:ap};
}

function renderCal(){
  document.getElementById("cal-tit").textContent=MESES[mes]+" "+ano;
  var g=document.getElementById("cal-grid"),hoy=fechaHoy();
  if(!deps.length){g.innerHTML="<div class=\"empty\">Agrega un departamento primero</div>";return;}
  g.innerHTML=deps.map(function(dep){
    var d=diasDep(dep.id),local=d.local,ical=d.ical,ap=d.ap;
    var first=new Date(ano,mes,1).getDay(),total=new Date(ano,mes+1,0).getDate();
    var hh=DIAS.map(function(d){return "<div class=\"dhc\">"+d+"</div>";}).join("");
    var cc="";
    for(var i=0;i<first;i++)cc+="<div class=\"dc\"></div>";
    for(var day=1;day<=total;day++){
      var f=ano+"-"+String(mes+1).padStart(2,"0")+"-"+String(day).padStart(2,"0");
      var l=local.has(f),ic=ical.has(f),isAp=ap.has(f),isH=f===hoy;
      var lData=local.get(f);
      var st="",cls="dc";
      if(isAp){
        st="background:#f3e8ff;color:#7c3aed;font-weight:600;border:1.5px dashed #7c3aed60;border-radius:3px;";
      } else if(l){
        var c=lData.color;
        var nextS=new Date(new Date(f+"T12:00:00").getTime()+86400000).toISOString().slice(0,10);
        var prevS=new Date(new Date(f+"T12:00:00").getTime()-86400000).toISOString().slice(0,10);
        var isF=!local.has(prevS)||local.get(prevS).id!==lData.id;
        var isLast=!local.has(nextS)||local.get(nextS).id!==lData.id;
        var brad=isF&&isLast?"border-radius:4px;":isF?"border-radius:4px 0 0 4px;":isLast?"border-radius:0 4px 4px 0;":"border-radius:0;";
        var bl=isF?"border-left:3px solid "+c+";":"border-left:none;";
        var br=isLast?"border-right:3px solid "+c+";":"border-right:none;";
        var marg=isF?"margin:1.5px 0 1.5px 1.5px;":isLast?"margin:1.5px 1.5px 1.5px 0;":"margin:1.5px 0;";
        st="background:"+c+"66;color:var(--text-primary);font-weight:600;border-top:3px solid "+c+";border-bottom:3px solid "+c+";"+bl+br+brad+marg;
        } else if(ic){st="background:repeating-linear-gradient(45deg,#F7C1C1,#F7C1C1 3px,#fde8e8 3px,#fde8e8 8px);color:#A32D2D;font-weight:600;border-radius:3px;";
      } else {
        cls="dc dc-free";
      }
      var tip=l?(lData.huesped+(lData.precio?" - $"+lData.precio.toLocaleString("es-MX"):"")):(isAp?"Apartado":ic?"Airbnb":"");
      cc+="<div class=\""+cls+(isH?" dc-today":"")+"\" style=\""+st+"\" "+(tip?"data-tip=\""+tip+"\" onmouseenter=\"showTip(event,this)\" onmouseleave=\"hideTip()\"":"")+">"+(isH?"<b>"+day+"</b>":day)+"</div>";
    }
    var sb=dep.ical?(dep.icalS?"<span style=\"font-size:10px;padding:2px 7px;border-radius:100px;background:var(--sg);color:var(--s)\">Sync OK</span>":"<span style=\"font-size:10px;padding:2px 7px;border-radius:100px;background:var(--bg2);color:var(--text3)\">Sin sync</span>"):"<span style=\"font-size:10px;padding:2px 7px;border-radius:100px;background:var(--bg2);color:var(--text3)\">Sin iCal</span>";
    return "<div class=\"dep-cal\"><div class=\"dep-name-row\"><div style=\"display:flex;align-items:center;gap:6px\"><div class=\"dep-dot\" style=\"background:"+dep.color+"\"></div>"+dep.nom+"</div>"+sb+"</div><div class=\"dh\">"+hh+"</div><div class=\"dg\">"+cc+"</div></div>";
  }).join("");
}
function showTip(e,el){if(!el.dataset.tip)return;var t=document.getElementById("tip");t.textContent=el.dataset.tip;t.style.display="block";t.style.left=(e.clientX-60)+"px";t.style.top=(e.clientY-34)+"px";}
function hideTip(){document.getElementById("tip").style.display="none";}

// RESERVAS
function updFilDep(){
  var s=document.getElementById("fil-dep"),v=s.value;
  s.innerHTML="<option value=\"todos\">Todos los deptos</option>"+deps.map(function(d){return "<option value=\""+d.id+"\">"+d.nom+"</option>";}).join("");
  if(deps.find(function(d){return d.id===v;}))s.value=v;
  var pend=[];
  deps.forEach(function(dep){
    if(!dep.icalF||!dep.icalF.length)return;
    var hoy=fechaHoy(),man=new Set();
    rsvps.filter(function(r){return r.dep===dep.id;}).forEach(function(r){
      var d=new Date(r.entrada+"T12:00:00"),fin=new Date(r.salida+"T12:00:00");
      while(d<fin){man.add(d.toISOString().slice(0,10));d.setDate(d.getDate()+1);}
    });
    var sin=dep.icalF.filter(function(f){return f>=hoy&&!man.has(f);});
    if(sin.length)pend.push({dep:dep.nom,dias:sin.length});
  });
  document.getElementById("ical-alert").innerHTML=pend.length?"<div class=\"al al-man\" style=\"margin-bottom:10px\">"+pend.map(function(p){return "<strong>"+p.dep+"</strong>: "+p.dias+" dia(s) sin datos manuales";}).join(" - ")+"</div>":"";
}

function msgPendiente(r){var m=r.mensajes||{};return !m.huesped||!m.llaves||!m.admin;}

function rangosEmpalmados(entA,salA,entB,salB){
  return entA<salB&&salA>entB;
}
function conflictosReserva(depId,ent,sal,excludeId){
  if(!depId||!ent||!sal||sal<=ent)return [];
  return rsvps.filter(function(r){
    if(!r||r.id===excludeId)return false;
    if(r.dep!==depId)return false;
    if(typeof r.entrada!=="string"||typeof r.salida!=="string")return false;
    return rangosEmpalmados(ent,sal,r.entrada,r.salida);
  });
}
function renderWarningEmpalmeRsvp(){
  var dep=document.getElementById("f-dep").value;
  var ent=document.getElementById("f-ent").value;
  var sal=document.getElementById("f-sal").value;
  var wrap=document.getElementById("fg-overlap-warning");
  var txt=document.getElementById("overlap-warning-text");
  if(!wrap||!txt)return;
  var conflictos=conflictosReserva(dep,ent,sal,editRsvp);
  if(!conflictos.length){
    wrap.style.display="none";
    txt.textContent="";
    return;
  }
  txt.innerHTML=conflictos.slice(0,3).map(function(c){
    var origen=(c.origen||"sin origen");
    return "<div>"+fmtD(c.entrada)+" → "+fmtD(c.salida)+" | "+(c.huesped||"Sin nombre")+" | Reservo: "+origen+"</div>";
  }).join("")+(conflictos.length>3?"<div>... y "+(conflictos.length-3)+" mas</div>":"");
  wrap.style.display="";
}

function renderRsvp(){
  var fd=document.getElementById("fil-dep").value,fe=document.getElementById("fil-est").value;
  var fp=document.getElementById("fil-pago").value,fm=document.getElementById("fil-msg").value;
  var hoy=fechaHoy();
  var f=rsvps.filter(function(r){return r&&typeof r.entrada==="string"&&typeof r.salida==="string"&&(fd==="todos"||r.dep===fd);});
  if(fe==="prox")f=f.filter(function(r){return r.salida>=hoy;});
  if(fe==="pas")f=f.filter(function(r){return r.salida<hoy;});
  if(fp==="pendiente")f=f.filter(rsvpConAdeudo);
  else if(fp!=="todos")f=f.filter(function(r){return (r.pago||"pendiente")===fp;});
  if(fm==="pendmsg")f=f.filter(function(r){return msgPendiente(r)&&r.salida>=hoy;});
  if(fm==="enviados")f=f.filter(function(r){return !msgPendiente(r);});
  f.sort(function(a,b){return a.entrada.localeCompare(b.entrada);});
  var lista=document.getElementById("lista-rsvp");
  if(!f.length){lista.innerHTML="<div class=\"empty\">No hay reservas con estos filtros</div>";return;}
  lista.innerHTML=f.map(function(r){
    var dep=depById(r.dep),n=noches(r.entrada+"T12:00:00",r.salida+"T12:00:00");
    var ef=fmtD(r.entrada),sf=fmtD(r.salida),pasada=r.salida<hoy,ps=r.pago||"pendiente";
    var pb={pendiente:"<span class=\"badge b-pend\">Pendiente</span>",parcial:"<span class=\"badge b-parc\">Pendiente por liquidar · Anticipo $"+(r.anticipo||0).toLocaleString("es-MX")+" / Resto $"+(r.precio-(r.anticipo||0)).toLocaleString("es-MX")+"</span>",liquidada:"<span class=\"badge b-liq\">Liquidada</span>"}[ps]||"";
    var pa=ps!=="liquidada"?"<div class=\"wa-row\">"+(ps==="pendiente"?"<button class=\"btn btn-g\" style=\"font-size:11px;padding:3px 8px\" onclick=\"cambiarPago('"+r.id+"','parcial')\">Anticipo</button>":"")+"<button class=\"btn btn-ok\" onclick=\"cambiarPago('"+r.id+"','liquidada')\">Liquidada</button></div>":"";
    var m=r.mensajes||{};
    var allSent=m.huesped&&m.llaves&&m.admin,noneSent=!m.huesped&&!m.llaves&&!m.admin;
    var msgInd=allSent?"OK":noneSent?"PEND":"PARC";
    var msgColor=allSent?"var(--s)":noneSent?"var(--d)":"var(--w)";
    var msgTxt=(m.huesped?"<span style=\"color:var(--s)\">Huesped OK</span>":"<span style=\"color:var(--d)\">Huesped pend</span>")+" &middot; "+(m.llaves?"<span style=\"color:var(--s)\">Llaves OK</span>":"<span style=\"color:var(--d)\">Llaves pend</span>")+" &middot; "+(m.admin?"<span style=\"color:var(--s)\">Admin OK</span>":"<span style=\"color:var(--d)\">Admin pend</span>");
    var depBadge=dep?"<span class=\"badge\" style=\"background:"+dep.colorL+";color:"+dep.color+"\">"+dep.nom+"</span>":"";
    var pdfl=r.pdfLink?"<a href=\""+r.pdfLink+"\" target=\"_blank\" style=\"font-size:11px;color:var(--i)\">Ver PDF</a>":"";
    return "<div class=\"rv-card "+ps+"\" id=\"rsvp-"+r.id+"\" style=\""+(pasada?"opacity:.6":"")+"\"><div class=\"rv-info\"><div class=\"rv-h\">"+r.huesped+"</div><div class=\"rv-f\">"+ef+" &rarr; "+sf+" &middot; "+n+" noche"+(n!==1?"s":"")+"</div><div class=\"rv-m\">"+depBadge+"<span class=\"badge\">$"+r.precio.toLocaleString("es-MX")+" MXN</span><span class=\"badge\">"+r.personas+" pers</span>"+(r.deposito?"<span class=\"badge\">Dep $"+r.deposito.toLocaleString("es-MX")+"</span>":"")+(r.numAirbnb?"<span class=\"badge\">"+r.numAirbnb+"</span>":"")+"</div><div class=\"rv-m\">"+pb+"</div>"+pa+"<div class=\"wa-row\"><button class=\"btn btn-pdf\" onclick=\"generarPDF('"+r.id+"','huesped')\">PDF Huesped</button><button class=\"btn btn-pdf\" onclick=\"generarPDF('"+r.id+"','llaves')\">PDF Llaves</button><button class=\"btn btn-pdf\" onclick=\"generarPDF('"+r.id+"','admin')\">PDF Admin</button><button class=\"btn btn-warn\" onclick=\"genPDFReservacion('"+r.id+"')\" id=\"btn-rpdf-"+r.id+"\">"+(r.pdfLink?"PDF generado":"PDF Reservacion")+"</button>"+(r.pdfLink?"<a href=\\\""+r.pdfLink+"\\\" target=\\\"_blank\\\" style=\\\"font-size:11px;color:var(--i);margin-left:4px\\\">Ver</a>":"")+"</div><div class=\"wa-row\"><button class=\"btn btn-wa\" onclick=\"enviarWA('"+r.id+"','huesped')\">WA Huesped"+(m.huesped?" OK":"")+"</button><button class=\"btn btn-wa\" onclick=\"enviarWA('"+r.id+"','llaves')\">WA Llaves"+(m.llaves?" OK":"")+"</button><button class=\"btn btn-wa\" onclick=\"enviarWA('"+r.id+"','admin')\">WA Admin"+(m.admin?" OK":"")+"</button></div><div style=\"font-size:10px;color:"+msgColor+";margin-top:5px;font-weight:500\">"+msgTxt+"</div>"+(r.notas?"<div style=\"font-size:11px;color:var(--text3);margin-top:4px\">"+r.notas+"</div>":"")+"</div><div class=\"rv-actions\"><button class=\"btn btn-i\" onclick=\"abrirRsvp('"+r.id+"')\">Edit</button><button class=\"btn btn-del\" onclick=\"pConfirm('Eliminar reserva?','La fecha quedara disponible.',function(){delRsvp('"+r.id+"');})\">Del</button></div></div>";
  }).join("");
}

function cambiarPago(id,estado){
  var i=rsvps.findIndex(function(r){return r.id===id;});if(i<0)return;
  if(estado==="parcial"){var m=prompt("Cuanto es el anticipo? (MXN)");if(m===null)return;rsvps[i].anticipo=parseFloat(m)||0;}
  rsvps[i].pago=estado;sv("rsvp_v6",rsvps);renderTodo();
}
function delRsvp(id){rsvps=rsvps.filter(function(x){return x.id!==id;});sv("rsvp_v6",rsvps);renderTodo();triggerIcalUpdate();}

// PRECIO
function calcPrecio(){
  var modo=document.querySelector("input[name=\"pmodo\"]:checked");modo=modo?modo.value:"total";
  var ent=document.getElementById("f-ent").value,sal=document.getElementById("f-sal").value;
  var precio=parseFloat(document.getElementById("f-precio").value)||0;
  var el=document.getElementById("precio-calc");
  if(modo==="noche"&&ent&&sal&&precio){
    var n=Math.round((new Date(sal)-new Date(ent))/86400000);
    if(n>0){el.textContent=n+" noches x $"+precio.toLocaleString("es-MX")+" = $"+(n*precio).toLocaleString("es-MX")+" MXN total";el.style.display="block";return;}
  }
  el.style.display="none";
}
function getPrecioTotal(){
  var modo=document.querySelector("input[name=\"pmodo\"]:checked");modo=modo?modo.value:"total";
  var precio=parseFloat(document.getElementById("f-precio").value)||0;
  if(modo==="noche"){
    var e=document.getElementById("f-ent").value,s=document.getElementById("f-sal").value;
    if(e&&s){var n=Math.round((new Date(s)-new Date(e))/86400000);return n>0?n*precio:precio;}
  }
  return precio;
}

// WHATSAPP
function registrarMsg(id,tipo){
  var i=rsvps.findIndex(function(r){return r.id===id;});if(i<0)return;
  if(!rsvps[i].mensajes)rsvps[i].mensajes={};
  rsvps[i].mensajes[tipo]=new Date().toISOString();
  sv("rsvp_v6",rsvps);
}
function normalizarTelefonoWA(valor){
  var tel=String(valor||"").replace(/\D/g,"");
  if(tel.startsWith("00"))tel=tel.slice(2);
  return tel;
}
function enviarWA(id,tipo){
  var r=rsvps.find(function(x){return x.id===id;});if(!r)return;
  var dep=depById(r.dep)||{};
  var msg=aplicarTpl(tpls[tipo]||"",r);
  var tel="";
  if(tipo==="llaves")tel=normalizarTelefonoWA(dep.telL);
  else if(tipo==="admin")tel=normalizarTelefonoWA(dep.telA);
  else tel=normalizarTelefonoWA(r.telefono);
  if(!tel){
    alert("No hay telefono valido para este mensaje.");
    return;
  }
  var msgF=msg;
  if(tipo==="admin"&&r.pdfLink)msgF+="\n\nReservacion: "+r.pdfLink;
  registrarMsg(id,tipo);
  if(tabAct==="rsvp")renderRsvp();
  window.open("https://wa.me/"+tel+"?text="+encodeURIComponent(msgF),"_blank");
}

// PDFs
function hexRgb(h){var r=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h);return r?{r:parseInt(r[1],16),g:parseInt(r[2],16),b:parseInt(r[3],16)}:{r:24,g:95,b:165};}
function generarPDF(id,tipo){
  var r=rsvps.find(function(x){return x.id===id;});if(!r)return;
  var dep=depById(r.dep),doc=new jsPDF({unit:"mm",format:"a4"}),W=210,H=297;
  var rgb=hexRgb(dep?dep.color:"#185FA5");
  doc.setFillColor(rgb.r,rgb.g,rgb.b);doc.rect(0,0,W,42,"F");
  doc.setFillColor(245,248,252);doc.rect(0,42,W,H-42,"F");
  doc.setTextColor(255,255,255);doc.setFontSize(20);doc.setFont("helvetica","bold");
  doc.text(dep?dep.nom:"Albatros",15,17);
  doc.setFontSize(11);doc.setFont("helvetica","normal");
  var tits={huesped:"Bienvenida para Huesped",llaves:"Informacion para Ama de Llaves",admin:"Informacion para Administrador"};
  doc.text(tits[tipo],15,26);
  doc.setFontSize(9);doc.text(new Date().toLocaleDateString("es-MX",{day:"numeric",month:"long",year:"numeric"}),15,34);
  var y=54;
  function sec(t){doc.setFillColor(rgb.r,rgb.g,rgb.b);doc.rect(15,y-5,180,8,"F");doc.setTextColor(255,255,255);doc.setFontSize(10);doc.setFont("helvetica","bold");doc.text(t,18,y);doc.setTextColor(30,30,30);doc.setFont("helvetica","normal");y+=11;}
  function lin(l,v){doc.setFontSize(10);doc.setFont("helvetica","bold");doc.text(l+":",18,y);doc.setFont("helvetica","normal");doc.text(String(v||""),68,y);y+=7;}
  function par(t){doc.setFontSize(9);var ls=doc.splitTextToSize(t,175);doc.text(ls,18,y);y+=ls.length*5+3;}
  var n=noches(r.entrada+"T12:00:00",r.salida+"T12:00:00");
  if(tipo==="huesped"){
    sec("Datos de tu reserva");lin("Departamento",dep?dep.nom:"");lin("Direccion",dep?dep.dir:"");lin("Entrada",fmtDL(r.entrada));lin("Salida",fmtDL(r.salida));lin("Noches",n);lin("Personas",r.personas);
    y+=4;sec("Acceso");par(dep&&dep.acceso?dep.acceso:"El administrador te contactara.");
    y+=4;sec("WiFi");par("Red: "+(dep?dep.wifi:"")+" | Pass: "+(dep?dep.wpass:""));
  } else if(tipo==="llaves"){
    sec("Llegada proxima");lin("Departamento",dep?dep.nom:"");lin("Huesped",r.huesped);lin("Entrada",fmtDL(r.entrada));lin("Salida",fmtDL(r.salida));lin("Noches",n);lin("Personas",r.personas);
    y+=4;sec("Pendientes");par("- Limpieza completa antes de la llegada.\n- Cambio de sabanas y toallas.\n- Reposicion de consumibles.\n- Revision de electrodomesticos y accesos.");
    if(r.notas){y+=3;sec("Notas");par(r.notas);}
  } else {
    sec("Datos de llegada");lin("Departamento",dep?dep.nom:"");lin("Huesped",r.huesped);lin("Entrada",fmtDL(r.entrada));lin("Salida",fmtDL(r.salida));lin("Personas",r.personas);lin("Origen",r.origen||"");
    if(r.numAirbnb)lin("No. Airbnb",r.numAirbnb);
    y+=4;sec("Instrucciones");par("- Proporcionar acceso en la fecha y hora de entrada.\n- Entregar llaves al huesped.\n- Confirmar datos al momento de llegada.\n- Registrar cualquier incidencia.");
    if(r.notas){y+=3;sec("Notas");par(r.notas);}
  }
  doc.setFillColor(rgb.r,rgb.g,rgb.b);doc.rect(0,H-10,W,10,"F");
  doc.setTextColor(255,255,255);doc.setFontSize(8);doc.text("Albatros Departamentos - Generado automaticamente",W/2,H-4,{align:"center"});
  doc.save((dep?dep.nom.replace(/\s/g,"-"):"depto")+"-"+tipo+"-"+r.entrada+".pdf");
}

async function genPDFReservacion(id){
  var r=rsvps.find(function(x){return x.id===id;});if(!r)return;
  var dep=depById(r.dep)||{};
  var btn=document.getElementById("btn-rpdf-"+id);
  if(btn){btn.textContent="Generando...";btn.disabled=true;}
  try{
    var data=encodeURIComponent(JSON.stringify({huesped:r.huesped,dpto:dep.num||"",entrada:fmtD(r.entrada),salida:fmtD(r.salida),personas:r.personas}));
    var res=await fetch(PDF_URL+"?data="+data);
    var result=await res.json();
    if(result.ok&&result.link){
      var i=rsvps.findIndex(function(x){return x.id===id;});
      if(i>=0){rsvps[i].pdfLink=result.link;sv("rsvp_v6",rsvps);}
      if(btn){btn.textContent="PDF generado";btn.disabled=false;}
      window.open(result.link,"_blank");
    } else throw new Error(result.error||"Error");
  } catch(e){
    alert("Error: "+e.message);
    if(btn){btn.textContent="PDF Reservacion";btn.disabled=false;}
  }
}

// APARTADOS
function limpiarAparts(){
  var ahora=Date.now();
  var prev=aparts.length;
  aparts=aparts.filter(function(a){return ahora<=a.expira;});
  if(aparts.length!==prev){
    sv("apart_v6",aparts);
    triggerIcalUpdate();
  }
}
function renderAparts(){
  var lista=document.getElementById("lista-apart");
  limpiarAparts();
  if(!aparts.length){lista.innerHTML="<div class=\"empty\">No hay fechas apartadas</div>";return;}
  lista.innerHTML=aparts.map(function(a){
    var dep=depById(a.dep),ef=fmtD(a.entrada),sf=fmtD(a.salida);
    var ms=a.expira-Date.now(),hrs=Math.floor(ms/3600000),min=Math.floor((ms%3600000)/60000);
    return "<div class=\"rv-card apartado\"><div class=\"rv-info\"><div class=\"rv-h\">"+a.nombre+"</div><div class=\"rv-f\">"+ef+" &rarr; "+sf+"</div><div class=\"rv-m\">"+(dep?"<span class=\"badge\" style=\"background:"+dep.colorL+";color:"+dep.color+"\">"+dep.nom+"</span>":"")+"<span class=\"badge\">"+a.telefono+"</span><span class=\"badge\" style=\"background:var(--wg);color:var(--w)\">"+hrs+"h "+min+"m</span></div>"+(a.notas?"<div style=\"font-size:11px;color:var(--text3);margin-top:5px\">"+a.notas+"</div>":"")+"<div class=\"wa-row\"><button class=\"btn btn-p\" style=\"font-size:12px\" onclick=\"confirmarApartado('"+a.id+"')\">Confirmar como reserva</button><button class=\"btn btn-del\" style=\"font-size:12px\" onclick=\"liberarApartado('"+a.id+"')\">Liberar</button></div></div></div>";
  }).join("");
}
function abrirApartado(){
  var s=document.getElementById("ap-dep");
  s.innerHTML="<option value=\"\">Seleccionar...</option>"+deps.map(function(d){return "<option value=\""+d.id+"\">"+d.nom+"</option>";}).join("");
  ["ap-nom","ap-tel","ap-ent","ap-sal","ap-notas"].forEach(function(i){var el=document.getElementById(i);if(el)el.value="";});
  ["fg-ap-nom","fg-ap-tel","fg-ap-dep","fg-ap-ent","fg-ap-sal"].forEach(function(id){var el=document.getElementById(id);if(el)el.classList.remove("fe");});
  document.getElementById("mo-apart").classList.add("open");
}
function cerrarApartado(){document.getElementById("mo-apart").classList.remove("open");}
function guardarApartado(){
  var nom=document.getElementById("ap-nom").value.trim(),tel=document.getElementById("ap-tel").value.trim();
  var dep=document.getElementById("ap-dep").value,ent=document.getElementById("ap-ent").value;
  var sal=document.getElementById("ap-sal").value,notas=document.getElementById("ap-notas").value.trim();
  ["fg-ap-nom","fg-ap-tel","fg-ap-dep","fg-ap-ent","fg-ap-sal"].forEach(function(id){var el=document.getElementById(id);if(el)el.classList.remove("fe");});
  var ok=true;
  if(!nom){document.getElementById("fg-ap-nom").classList.add("fe");ok=false;}
  if(!tel){document.getElementById("fg-ap-tel").classList.add("fe");ok=false;}
  if(!dep){document.getElementById("fg-ap-dep").classList.add("fe");ok=false;}
  if(!ent){document.getElementById("fg-ap-ent").classList.add("fe");ok=false;}
  if(!sal||sal<=ent){document.getElementById("fg-ap-sal").classList.add("fe");ok=false;}
  if(!ok)return;
  var expira=Date.now()+24*60*60*1000;
  aparts.push({id:"ap_"+Date.now(),nombre:nom,telefono:tel,dep:dep,entrada:ent,salida:sal,notas:notas,expira:expira,creado:new Date().toISOString()});
  sv("apart_v6",aparts);cerrarApartado();
  triggerIcalUpdate();
  var fakeR={huesped:nom,telefono:tel,dep:dep,entrada:ent,salida:sal,precio:0,personas:"",deposito:0};
  var msg=aplicarTpl(tpls.apartado||"",fakeR);
  window.open("https://wa.me/"+tel.replace(/[\s\-\(\)]/g,"")+"?text="+encodeURIComponent(msg),"_blank");
  renderTodo();
}
function liberarApartado(id){
  var a=aparts.find(function(x){return x.id===id;});
  if(a){var fakeR={huesped:a.nombre,telefono:a.telefono,dep:a.dep,entrada:a.entrada,salida:a.salida,precio:0,personas:"",deposito:0};var msg=aplicarTpl(tpls.liberado||"",fakeR);window.open("https://wa.me/"+a.telefono.replace(/[\s\-\(\)]/g,"")+"?text="+encodeURIComponent(msg),"_blank");}
  aparts=aparts.filter(function(x){return x.id!==id;});sv("apart_v6",aparts);triggerIcalUpdate();renderTodo();
}
function confirmarApartado(id){var a=aparts.find(function(x){return x.id===id;});if(!a)return;aparts=aparts.filter(function(x){return x.id!==id;});sv("apart_v6",aparts);triggerIcalUpdate();abrirRsvp(null,a);}

// HISTORIAL
function renderHist(){
  var buscar=document.getElementById("buscar-h").value.toLowerCase(),map={};
  rsvps.forEach(function(r){var k=r.huesped.toLowerCase();if(!map[k])map[k]={nom:r.huesped,tel:r.telefono,rsvps:[],total:0};map[k].rsvps.push(r);map[k].total+=r.precio;});
  var lista=Object.values(map).filter(function(h){return h.nom.toLowerCase().includes(buscar);});
  lista.sort(function(a,b){return b.rsvps.length-a.rsvps.length;});
  var el=document.getElementById("lista-hist");
  if(!lista.length){el.innerHTML="<div class=\"empty\">No hay huespedes registrados</div>";return;}
  el.innerHTML=lista.map(function(h){
    var ini=h.nom.trim()[0]&&h.nom.trim()[0].toUpperCase()||"?";
    var col=COLORES[h.nom.charCodeAt(0)%COLORES.length];
    var ult=h.rsvps.slice().sort(function(a,b){return b.entrada.localeCompare(a.entrada);})[0];
    return "<div class=\"hc\" onclick=\"filtrarPorHuesped('"+h.nom.replace(/'/g,"\\'")+"')\"><div class=\"hav\" style=\"background:"+col+"\">"+ini+"</div><div style=\"flex:1\"><div style=\"font-size:14px;font-weight:600\">"+h.nom+"</div><div style=\"font-size:12px;color:var(--text2);margin-top:2px\">"+h.tel+" &middot; "+h.rsvps.length+" estancia"+(h.rsvps.length!==1?"s":"")+" &middot; Ultima: "+fmtD(ult.entrada)+"</div></div><div style=\"text-align:right\"><div style=\"font-size:14px;font-weight:600;color:var(--s)\">$"+h.total.toLocaleString("es-MX")+"</div><div style=\"font-size:11px;color:var(--text3)\">MXN total</div></div></div>";
  }).join("");
}
function filtrarPorHuesped(nom){
  setTab("rsvp",document.querySelectorAll(".tab")[1]);
  setTimeout(function(){
    document.getElementById("fil-dep").value="todos";document.getElementById("fil-est").value="todos";
    document.getElementById("fil-pago").value="todos";document.getElementById("fil-msg").value="todos";
    updFilDep();
    var f=rsvps.filter(function(r){return r.huesped===nom;}).sort(function(a,b){return b.entrada.localeCompare(a.entrada);});
    document.getElementById("lista-rsvp").innerHTML="<div style=\"font-size:12px;color:var(--text2);margin-bottom:8px;padding:6px 10px;background:var(--bg2);border-radius:var(--r)\">"+f.length+" reserva"+(f.length!==1?"s":"")+" de <strong>"+nom+"</strong> <a href=\"#\" onclick=\"updFilDep();renderRsvp();return false;\" style=\"color:var(--i)\">Ver todas</a></div>"+
    f.map(function(r){var dep=depById(r.dep),n=noches(r.entrada+"T12:00:00",r.salida+"T12:00:00");return "<div class=\"rv-card "+(r.pago||"pendiente")+"\"><div class=\"rv-info\"><div class=\"rv-h\">"+r.huesped+"</div><div class=\"rv-f\">"+fmtD(r.entrada)+" &rarr; "+fmtD(r.salida)+" &middot; "+n+" noches</div><div class=\"rv-m\">"+(dep?"<span class=\"badge\" style=\"background:"+dep.colorL+";color:"+dep.color+"\">"+dep.nom+"</span>":"")+"<span class=\"badge\">$"+r.precio.toLocaleString("es-MX")+"</span></div></div></div>";}).join("");
  },100);
}

// FINANZAS
function mesesDisp(){
  var m=new Set();
  rsvps.forEach(function(r){m.add(r.entrada.slice(0,7));});
  egrs.forEach(function(e){m.add(e.fecha.slice(0,7));});
  if(!m.size){var h=new Date();m.add(h.getFullYear()+"-"+String(h.getMonth()+1).padStart(2,"0"));}
  return Array.from(m).sort().reverse();
}
function fmtMes(m){var p=m.split("-");return MESES[parseInt(p[1])-1]+" "+p[0];}
function poblarMeses(){
  var ms=mesesDisp();
  ["fil-ing-mes","fil-egr-mes"].forEach(function(id){
    var s=document.getElementById(id),v=s.value;
    s.innerHTML="<option value=\"todos\">Todos los meses</option>"+ms.map(function(m){return "<option value=\""+m+"\">"+fmtMes(m)+"</option>";}).join("");
    if(ms.includes(v))s.value=v;
  });
  var ds=document.getElementById("fil-ing-dep"),dv=ds.value;
  ds.innerHTML="<option value=\"todos\">Todos los deptos</option>"+deps.map(function(d){return "<option value=\""+d.id+"\">"+d.nom+"</option>";}).join("");
  if(deps.find(function(d){return d.id===dv;}))ds.value=dv;
}
function renderFin(){poblarMeses();if(finTabAct==="res")renderRes();else if(finTabAct==="depto")renderDepto();else if(finTabAct==="aseo")renderAseo();else if(finTabAct==="ing")renderIng();else renderEgr();}

function yearsDisp(){
  var ys=new Set();
  rsvps.forEach(function(r){ys.add(parseInt(r.entrada.slice(0,4),10));});
  egrs.forEach(function(e){ys.add(parseInt(e.fecha.slice(0,4),10));});
  if(!ys.size)ys.add(new Date().getFullYear());
  return Array.from(ys).sort(function(a,b){return b-a;});
}
function mkMes(y,m){return y+"-"+String(m).padStart(2,"0");}
function buildYearSeries(year,depSel){
  var acum=0;
  var serie=[];
  for(var m=1;m<=12;m++){
    var key=mkMes(year,m);
    var ing=0,egr2=0;
    if(depSel&&depSel!=="todos"){
      ing=rsvps.filter(function(r){return r.dep===depSel&&r.entrada.startsWith(key);}).reduce(function(s,r){return s+r.precio;},0);
      egr2=egrs.filter(function(e){return e.dep===depSel&&e.fecha.startsWith(key);}).reduce(function(s,e){return s+e.monto;},0);
    } else {
      ing=rsvps.filter(function(r){return r.entrada.startsWith(key);}).reduce(function(s,r){return s+r.precio;},0);
      egr2=egrs.filter(function(e){return e.fecha.startsWith(key);}).reduce(function(s,e){return s+e.monto;},0);
    }
    var util=ing-egr2;
    acum+=util;
    serie.push({mes:key,ing:ing,egr:egr2,balance:acum,util:util,label:MESES[m-1].slice(0,3)});
  }
  return serie;
}
function buildFinLineChart(serie){
  var vals=[];
  serie.forEach(function(r){vals.push(r.ing,r.egr,r.balance,r.util);});
  var minV=Math.min.apply(null,vals.concat([0])),maxV=Math.max.apply(null,vals.concat([1]));
  var W=900,H=360,padL=62,padR=18,padT=18,padB=28;
  var plotW=W-padL-padR,plotH=H-padT-padB;
  function xAt(v){if(maxV===minV)return padL+plotW/2;return padL+((maxV-v)/(maxV-minV))*plotW;}
  function yAt(i){return serie.length===1?padT+plotH/2:padT+(i/(serie.length-1))*plotH;}
  function pathBy(k){return serie.map(function(r,i){return (i?"L":"M")+xAt(r[k]).toFixed(1)+" "+yAt(i).toFixed(1);}).join(" ");}
  var zeroX=xAt(0).toFixed(1);
  var pts=function(k,c){return serie.map(function(r,i){return "<circle cx=\""+xAt(r[k]).toFixed(1)+"\" cy=\""+yAt(i).toFixed(1)+"\" r=\"3\" fill=\""+c+"\"></circle>";}).join("");};
  var yLbls=serie.map(function(r,i){return "<text x=\""+(padL-8)+"\" y=\""+(yAt(i)+3).toFixed(1)+"\" text-anchor=\"end\" font-size=\"10\" fill=\"#777\">"+r.label+"</text>";}).join("");
  var xMinLbl="<text x=\""+(W-padR)+"\" y=\""+(H-8)+"\" text-anchor=\"end\" font-size=\"10\" fill=\"#777\">$"+Math.round(minV).toLocaleString("es-MX")+"</text>";
  var xMaxLbl="<text x=\""+padL+"\" y=\""+(H-8)+"\" text-anchor=\"start\" font-size=\"10\" fill=\"#777\">$"+Math.round(maxV).toLocaleString("es-MX")+"</text>";
  return "<div style=\"background:var(--bg);border:.5px solid var(--border);border-radius:var(--rlg);padding:10px;overflow-x:auto\"><svg viewBox=\"0 0 "+W+" "+H+"\" width=\"100%\" height=\"360\" role=\"img\" aria-label=\"Grafica lineal de finanzas con ejes invertidos\"><line x1=\""+zeroX+"\" y1=\""+padT+"\" x2=\""+zeroX+"\" y2=\""+(H-padB)+"\" stroke=\"#cfcfcf\" stroke-width=\"1\" stroke-dasharray=\"4 3\"></line><line x1=\""+padL+"\" y1=\""+padT+"\" x2=\""+padL+"\" y2=\""+(H-padB)+"\" stroke=\"#ddd\" stroke-width=\"1\"></line><line x1=\""+padL+"\" y1=\""+(H-padB)+"\" x2=\""+(W-padR)+"\" y2=\""+(H-padB)+"\" stroke=\"#ddd\" stroke-width=\"1\"></line><path d=\""+pathBy("ing")+"\" fill=\"none\" stroke=\"#2e7d32\" stroke-width=\"3\"></path><path d=\""+pathBy("egr")+"\" fill=\"none\" stroke=\"#b91c1c\" stroke-width=\"3\"></path><path d=\""+pathBy("balance")+"\" fill=\"none\" stroke=\"#b45309\" stroke-width=\"3\"></path><path d=\""+pathBy("util")+"\" fill=\"none\" stroke=\"#1565c0\" stroke-width=\"3\"></path>"+pts("ing","#2e7d32")+pts("egr","#b91c1c")+pts("balance","#b45309")+pts("util","#1565c0")+yLbls+xMinLbl+xMaxLbl+"</svg></div>";
}
function renderRes(){
  var el=document.getElementById("ft-res");
  var ys=yearsDisp();
  var ySelEl=document.getElementById("fil-res-year");
  var ySel=ySelEl?parseInt(ySelEl.value,10):ys[0];
  if(!ys.includes(ySel))ySel=ys[0];
  var serie=buildYearSeries(ySel,"todos");
  var tI=serie.reduce(function(s,r){return s+r.ing;},0),tE=serie.reduce(function(s,r){return s+r.egr;},0),util=tI-tE;
  var mNow=new Date().getMonth();
  var iM=serie[mNow]?serie[mNow].ing:0;
  var eM=serie[mNow]?serie[mNow].egr:0;
  var pc=totalPorCobrar(rsvps.filter(rsvpConAdeudo));
  var lineChart=buildFinLineChart(serie);
  var cats={};egrs.forEach(function(e){cats[e.cat]=(cats[e.cat]||0)+e.monto;});
  var catR=Object.entries(cats).sort(function(a,b){return b[1]-a[1];}).map(function(e){return "<tr><td>"+e[0]+"</td><td class=\"amt-e\">$"+e[1].toLocaleString("es-MX")+"</td></tr>";}).join("");
  var yOpts=ys.map(function(y){return "<option value=\""+y+"\">"+y+"</option>";}).join("");
  el.innerHTML="<div class=\"filtros\" style=\"margin-bottom:10px\"><select class=\"fi\" id=\"fil-res-year\" onchange=\"renderRes()\" style=\"width:auto;padding:5px 8px;font-size:12px\">"+yOpts+"</select></div><div class=\"rg\"><div class=\"rc\"><div class=\"rc-l\">Ingresos totales</div><div class=\"rc-v\" style=\"color:var(--s)\">$"+tI.toLocaleString("es-MX")+"</div></div><div class=\"rc\"><div class=\"rc-l\">Egresos totales</div><div class=\"rc-v\" style=\"color:var(--d)\">$"+tE.toLocaleString("es-MX")+"</div></div><div class=\"rc\"><div class=\"rc-l\">Utilidad neta</div><div class=\"rc-v\" style=\"color:"+(util>=0?"var(--s)":"var(--d)")+"\">$"+util.toLocaleString("es-MX")+"</div></div><div class=\"rc\"><div class=\"rc-l\">Por cobrar</div><div class=\"rc-v\" style=\"color:var(--w)\">$"+pc.toLocaleString("es-MX")+"</div></div><div class=\"rc\"><div class=\"rc-l\">Este mes (Ing/Egr)</div><div class=\"rc-v\" style=\"font-size:13px\"><span style=\"color:var(--s)\">$"+iM.toLocaleString("es-MX")+"</span> / <span style=\"color:var(--d)\">$"+eM.toLocaleString("es-MX")+"</span></div></div></div><div style=\"display:flex;gap:10px;flex-wrap:wrap;margin-bottom:8px;font-size:11px;color:var(--text2)\"><span><span style=\"color:#2e7d32\">●</span> Ingresos</span><span><span style=\"color:#b91c1c\">●</span> Egresos</span><span><span style=\"color:#b45309\">●</span> Balance</span><span><span style=\"color:#1565c0\">●</span> Utilidad</span></div>"+lineChart+(catR?"<div style=\"font-size:11px;color:var(--text2);margin:1rem 0 8px;font-weight:500\">Egresos por categoria</div><table class=\"fin-table\"><thead><tr><th>Categoria</th><th>Total</th></tr></thead><tbody>"+catR+"</tbody></table>":"");
  var ySelEl2=document.getElementById("fil-res-year");
  if(ySelEl2)ySelEl2.value=String(ySel);
}
function getGeneralEgrMes(mes){
  return egrs.filter(function(e){return (e.dep==="general"||!e.dep)&&e.fecha.startsWith(mes);}).reduce(function(s,e){return s+e.monto;},0);
}
function getDeptoMesRows(mesSel){
  var meses=mesSel&&mesSel!=="todos"?[mesSel]:mesesDisp();
  var rows=[];
  meses.forEach(function(mes){
    deps.forEach(function(dep){
      var ing=rsvps.filter(function(r){return r.dep===dep.id&&r.entrada.startsWith(mes);}).reduce(function(s,r){return s+r.precio;},0);
      var egr2=egrs.filter(function(e){return e.dep===dep.id&&e.fecha.startsWith(mes);}).reduce(function(s,e){return s+e.monto;},0);
      if(!ing&&!egr2)return;
      rows.push({mes:mes,depNom:dep.nom,depColor:dep.color,ing:ing,egr:egr2,balance:ing-egr2,ale:ing*0.4,hector:ing*0.2,utilPct:ing?((ing-egr2)/ing*100):0});
    });
    var generalEgr=getGeneralEgrMes(mes);
    if(generalEgr){
      rows.push({mes:mes,depNom:"General",depColor:"#666",ing:0,egr:generalEgr,balance:-generalEgr,ale:0,hector:0,utilPct:0});
    }
  });
  return rows;
}
function getDeptoResumen(rows){
  return rows.reduce(function(acc,row){
    acc.ing+=row.ing;acc.egr+=row.egr;acc.balance+=row.balance;acc.ale+=row.ale;acc.hector+=row.hector;
    return acc;
  },{ing:0,egr:0,balance:0,ale:0,hector:0});
}
function renderDepto(){
  var el=document.getElementById("ft-depto");
  var meses=mesesDisp();
  var ys=yearsDisp();
  var depSelIn=document.getElementById("fil-depto-dep");
  var depSel=depSelIn?depSelIn.value:"todos";
  var ySelIn=document.getElementById("fil-depto-year");
  var ySel=ySelIn?parseInt(ySelIn.value,10):ys[0];
  if(!ys.includes(ySel))ySel=ys[0];
  var pdfSelIn=document.getElementById("fil-depto-pdf-mes");
  var pdfMesSel=pdfSelIn?pdfSelIn.value:(meses[0]||"todos");
  var depOpts="<option value=\"todos\">Todos los deptos</option>"+deps.map(function(d){return "<option value=\""+d.id+"\">"+d.nom+"</option>";}).join("");
  var mesOpts="<option value=\"todos\">Todos los meses</option>"+meses.map(function(m){return "<option value=\""+m+"\">"+fmtMes(m)+"</option>";}).join("");
  var yearOpts=ys.map(function(y){return "<option value=\""+y+"\">"+y+"</option>";}).join("");
  var serie=buildYearSeries(ySel,depSel);
  var resumen=serie.reduce(function(acc,r){acc.ing+=r.ing;acc.egr+=r.egr;acc.balance=r.balance;acc.util+=r.util;return acc;},{ing:0,egr:0,balance:0,util:0});
  var ale=resumen.ing*0.4,hector=resumen.ing*0.2;
  var chart=buildFinLineChart(serie);
  var det=serie.map(function(r){return "<div style=\"display:flex;justify-content:space-between;gap:8px;font-size:12px;padding:6px 0;border-bottom:.5px solid var(--border)\"><span>"+fmtMes(r.mes)+"</span><span style=\"color:var(--s)\">Ing $"+r.ing.toLocaleString("es-MX")+"</span><span style=\"color:var(--d)\">Egr $"+r.egr.toLocaleString("es-MX")+"</span><span style=\"color:var(--w)\">Bal $"+r.balance.toLocaleString("es-MX")+"</span><span style=\"color:var(--i)\">Uti $"+r.util.toLocaleString("es-MX")+"</span></div>";}).join("");
  el.innerHTML="<div class=\"filtros\" style=\"margin-bottom:12px;justify-content:space-between\"><div style=\"display:flex;gap:8px;flex-wrap:wrap\"><select class=\"fi\" id=\"fil-depto-dep\" onchange=\"renderDepto()\" style=\"width:auto;padding:5px 8px;font-size:12px\">"+depOpts+"</select><select class=\"fi\" id=\"fil-depto-year\" onchange=\"renderDepto()\" style=\"width:auto;padding:5px 8px;font-size:12px\">"+yearOpts+"</select><select class=\"fi\" id=\"fil-depto-pdf-mes\" style=\"width:auto;padding:5px 8px;font-size:12px\">"+mesOpts+"</select></div><div style=\"display:flex;gap:8px;flex-wrap:wrap\"><button class=\"btn btn-pdf\" onclick=\"pdfFinanzasMesDepto()\">PDF mensual</button><button class=\"btn btn-wa\" onclick=\"enviarPdfFinanzasWA()\">Enviar WA</button></div></div><div style=\"display:flex;gap:10px;flex-wrap:wrap;margin-bottom:10px;font-size:11px;color:var(--text2)\"><span><span style=\"color:#2e7d32\">●</span> Ingresos</span><span><span style=\"color:#b91c1c\">●</span> Egresos</span><span><span style=\"color:#b45309\">●</span> Balance</span><span><span style=\"color:#1565c0\">●</span> Utilidad</span></div><div class=\"rg\"><div class=\"rc\"><div class=\"rc-l\">Ingresos</div><div class=\"rc-v\" style=\"color:var(--s);font-size:16px\">$"+resumen.ing.toLocaleString("es-MX")+"</div></div><div class=\"rc\"><div class=\"rc-l\">Egresos</div><div class=\"rc-v\" style=\"color:var(--d);font-size:16px\">$"+resumen.egr.toLocaleString("es-MX")+"</div></div><div class=\"rc\"><div class=\"rc-l\">Balance</div><div class=\"rc-v\" style=\"color:"+(resumen.balance>=0?"var(--w)":"var(--d)")+";font-size:16px\">$"+resumen.balance.toLocaleString("es-MX")+"</div></div><div class=\"rc\"><div class=\"rc-l\">Utilidad</div><div class=\"rc-v\" style=\"color:var(--i);font-size:16px\">$"+resumen.util.toLocaleString("es-MX")+"</div></div><div class=\"rc\"><div class=\"rc-l\">Ale 40%</div><div class=\"rc-v\" style=\"font-size:16px\">$"+ale.toLocaleString("es-MX")+"</div></div><div class=\"rc\"><div class=\"rc-l\">Hector 20%</div><div class=\"rc-v\" style=\"font-size:16px\">$"+hector.toLocaleString("es-MX")+"</div></div></div>"+chart+"<div style=\"margin-top:12px;background:var(--bg);border:.5px solid var(--border);border-radius:var(--rlg);padding:10px\">"+det+"</div>";
  var depSelEl=document.getElementById("fil-depto-dep");
  if(depSelEl)depSelEl.value=depSel;
  var ySelEl2=document.getElementById("fil-depto-year");
  if(ySelEl2)ySelEl2.value=String(ySel);
  var pdfSelEl=document.getElementById("fil-depto-pdf-mes");
  if(pdfSelEl)pdfSelEl.value=pdfMesSel;
}
function pdfFinanzasMesDepto(){
  var sel=document.getElementById("fil-depto-pdf-mes");
  var mes=sel?sel.value:"todos";
  if(!mes||mes==="todos"){alert("Selecciona un mes para generar el PDF");return;}
  var rows=getDeptoMesRows(mes);
  if(!rows.length){alert("No hay movimientos en ese mes");return;}
  var resumen=getDeptoResumen(rows);
  var utilidadPct=resumen.ing?((resumen.balance/resumen.ing)*100):0;
  var doc=new jsPDF({unit:"mm",format:"a4"}),W=210,H=297;
  doc.setFillColor(24,95,165);doc.rect(0,0,W,28,"F");
  doc.setTextColor(255,255,255);doc.setFont("helvetica","bold");doc.setFontSize(16);doc.text("Albatros Departamentos",14,12);
  doc.setFontSize(10);doc.setFont("helvetica","normal");doc.text("Reporte financiero mensual - "+fmtMes(mes),14,20);
  doc.setTextColor(30,30,30);doc.setFillColor(245,248,252);doc.rect(0,28,W,H-28,"F");
  var y=40;
  function money(v){return "$"+v.toLocaleString("es-MX");}
  function line(lbl,val,col){doc.setFont("helvetica","bold");doc.setFontSize(10);doc.text(lbl,14,y);doc.setTextColor.apply(doc,col||[30,30,30]);doc.text(val,92,y,{align:"right"});doc.setTextColor(30,30,30);doc.setFont("helvetica","normal");y+=6;}
  line("Ingresos",money(resumen.ing),[46,125,50]);
  line("Egresos",money(resumen.egr),[185,28,28]);
  line("Balance",money(resumen.balance),[180,131,0]);
  line("Ale 40%",money(resumen.ale));
  line("Hector 20%",money(resumen.hector));
  line("Utilidad %",utilidadPct.toFixed(1)+"%");
  y+=4;
  doc.setFont("helvetica","bold");doc.text("Detalle por departamento",14,y);y+=8;
  doc.setFontSize(9);doc.setFont("helvetica","bold");
  doc.text("Depto",14,y);doc.text("Ingresos",92,y,{align:"right"});doc.text("Egresos",128,y,{align:"right"});doc.text("Balance",164,y,{align:"right"});doc.text("Util %",196,y,{align:"right"});
  y+=4;doc.line(14,y,196,y);y+=6;doc.setFont("helvetica","normal");
  rows.forEach(function(row){
    if(y>270){doc.addPage();y=20;}
    doc.text(row.depNom,14,y);
    doc.text(money(row.ing),92,y,{align:"right"});
    doc.text(money(row.egr),128,y,{align:"right"});
    doc.text(money(row.balance),164,y,{align:"right"});
    doc.text((row.utilPct||0).toFixed(1)+"%",196,y,{align:"right"});
    y+=6;
  });
  y+=4;doc.line(14,y,196,y);y+=8;doc.setFont("helvetica","bold");
  doc.text("Totales",14,y);doc.text(money(resumen.ing),92,y,{align:"right"});doc.text(money(resumen.egr),128,y,{align:"right"});doc.text(money(resumen.balance),164,y,{align:"right"});doc.text(utilidadPct.toFixed(1)+"%",196,y,{align:"right"});
  doc.save("finanzas-"+mes+".pdf");
}
function enviarPdfFinanzasWA(){
  var sel=document.getElementById("fil-depto-pdf-mes");
  var mes=sel?sel.value:"todos";
  if(!mes||mes==="todos"){alert("Selecciona un mes para generar y enviar");return;}
  pdfFinanzasMesDepto();
  var msg="Te envio el PDF de finanzas de "+fmtMes(mes)+". Ya se genero en esta app, lo adjunto en este chat.";
  window.open("https://wa.me/"+WA_REPORTE_NUM+"?text="+encodeURIComponent(msg),"_blank");
}

// ASEO
function renderAseo(){
  var el=document.getElementById("ft-aseo"),hoy=fechaHoy(),meses=mesesDisp();
  var aseoData=meses.map(function(m){
    var rv16=rsvps.filter(function(r){return r.dep==="dep1"&&r.entrada.startsWith(m);});
    var rv30=rsvps.filter(function(r){return r.dep==="dep2"&&r.entrada.startsWith(m);});
    return{mes:m,rv16:rv16,rv30:rv30,tot16:rv16.length*cfg.aseo16,tot30:rv30.length*cfg.aseo30,total:rv16.length*cfg.aseo16+rv30.length*cfg.aseo30};
  }).filter(function(d){return d.total>0;});
  el.innerHTML="<div style=\"background:var(--bg);border:.5px solid var(--border);border-radius:var(--rlg);padding:14px;margin-bottom:14px\"><div style=\"font-size:13px;font-weight:500;margin-bottom:10px\">Tarifa por reserva</div><div style=\"display:flex;gap:16px;flex-wrap:wrap\"><div class=\"fg-g\"><label class=\"fl\">Albatros 16 (MXN)</label><input class=\"fi\" type=\"number\" id=\"aseo16\" value=\""+cfg.aseo16+"\" style=\"width:100px\" oninput=\"cfg.aseo16=parseFloat(this.value)||0;sv('cfg_v6',cfg);renderAseo()\"></div><div class=\"fg-g\"><label class=\"fl\">Albatros 30 (MXN)</label><input class=\"fi\" type=\"number\" id=\"aseo30\" value=\""+cfg.aseo30+"\" style=\"width:100px\" oninput=\"cfg.aseo30=parseFloat(this.value)||0;sv('cfg_v6',cfg);renderAseo()\"></div></div></div>"+aseoData.map(function(d){
    var filas=d.rv16.map(function(r){return "<tr><td>"+r.huesped+"</td><td>Albatros 16</td><td>"+fmtD(r.entrada)+"</td><td class=\"amt-e\">$"+cfg.aseo16.toLocaleString("es-MX")+"</td></tr>";}).join("")+d.rv30.map(function(r){return "<tr><td>"+r.huesped+"</td><td>Albatros 30</td><td>"+fmtD(r.entrada)+"</td><td class=\"amt-e\">$"+cfg.aseo30.toLocaleString("es-MX")+"</td></tr>";}).join("");
    return "<div style=\"background:var(--bg);border:.5px solid var(--border);border-radius:var(--rlg);padding:14px;margin-bottom:10px\"><div style=\"display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;flex-wrap:wrap;gap:8px\"><div style=\"font-size:14px;font-weight:600\">"+fmtMes(d.mes)+"</div><div style=\"display:flex;gap:8px\"><button class=\"btn btn-wa\" onclick=\"enviarResumenAseo('"+d.mes+"')\">WA Resumen</button><button class=\"btn btn-pdf\" onclick=\"pdfResumenAseo('"+d.mes+"')\">PDF</button></div></div><table class=\"fin-table\"><thead><tr><th>Huesped</th><th>Depto</th><th>Entrada</th><th>Aseo</th></tr></thead><tbody>"+filas+"<tr style=\"font-weight:600;background:var(--bg2)\"><td colspan=\"3\" style=\"text-align:right;padding:8px\">Total</td><td class=\"amt-e\" style=\"padding:8px\">$"+d.total.toLocaleString("es-MX")+"</td></tr></tbody></table></div>";
  }).join("")+(aseoData.length===0?"<div class=\"empty\">No hay reservas registradas aun</div>":"");
}
function getAseoMes(mes){
  var rv16=rsvps.filter(function(r){return r.dep==="dep1"&&r.entrada.startsWith(mes);});
  var rv30=rsvps.filter(function(r){return r.dep==="dep2"&&r.entrada.startsWith(mes);});
  var lineas=rv16.map(function(r){return "- "+r.huesped+" - Albatros 16 - "+fmtD(r.entrada)+" - $"+cfg.aseo16.toLocaleString("es-MX");}).concat(rv30.map(function(r){return "- "+r.huesped+" - Albatros 30 - "+fmtD(r.entrada)+" - $"+cfg.aseo30.toLocaleString("es-MX");}));
  return{lineas:lineas,total:rv16.length*cfg.aseo16+rv30.length*cfg.aseo30};
}
function enviarResumenAseo(mes){
  var d=getAseoMes(mes);
  var msg="Resumen de aseo - "+fmtMes(mes)+"\n\n"+d.lineas.join("\n")+"\n\nTotal: $"+d.total.toLocaleString("es-MX")+" MXN";
  var telL=deps.find(function(d){return d.telL;}),tel=telL?telL.telL:"";
  window.open("https://wa.me/"+tel.replace(/[\s\-\(\)]/g,"")+"?text="+encodeURIComponent(msg),"_blank");
}
function pdfResumenAseo(mes){
  var d=getAseoMes(mes),doc=new jsPDF({unit:"mm",format:"a5"}),W=148,H=210;
  doc.setFillColor(24,95,165);doc.rect(0,0,W,30,"F");
  doc.setTextColor(255,255,255);doc.setFontSize(14);doc.setFont("helvetica","bold");doc.text("Albatros Departamentos",8,12);
  doc.setFontSize(10);doc.setFont("helvetica","normal");doc.text("Resumen de aseo - "+fmtMes(mes),8,20);
  doc.setFontSize(8);doc.text(new Date().toLocaleDateString("es-MX"),8,27);
  doc.setTextColor(30,30,30);doc.setFillColor(245,248,252);doc.rect(0,30,W,H-30,"F");
  var y=42;d.lineas.forEach(function(l){doc.setFontSize(9);doc.text(l,8,y);y+=6;});
  y+=4;doc.setFontSize(10);doc.setFont("helvetica","bold");doc.text("Total: $"+d.total.toLocaleString("es-MX")+" MXN",8,y);
  doc.setFillColor(24,95,165);doc.rect(0,H-8,W,8,"F");doc.setTextColor(255,255,255);doc.setFontSize(7);doc.text("Albatros Departamentos",W/2,H-3,{align:"center"});
  doc.save("aseo-"+mes+".pdf");
}

function renderIng(){
  var mes=document.getElementById("fil-ing-mes").value,dep=document.getElementById("fil-ing-dep").value;
  var f=rsvps.filter(function(r){return (mes==="todos"||r.entrada.startsWith(mes))&&(dep==="todos"||r.dep===dep);});
  f.sort(function(a,b){return b.entrada.localeCompare(a.entrada);});
  var total=f.reduce(function(s,r){return s+r.precio;},0);
  var t=document.getElementById("tabla-ing");
  if(!f.length){t.innerHTML="<tr><td colspan=\"7\" style=\"text-align:center;padding:2rem;color:var(--text3)\">Sin ingresos</td></tr>";return;}
  t.innerHTML="<thead><tr><th>Fecha</th><th>Huesped</th><th>Depto</th><th>Noches</th><th>Origen</th><th>Pago</th><th>Monto</th></tr></thead><tbody>"+f.map(function(r){var d=depById(r.dep),n=noches(r.entrada+"T12:00:00",r.salida+"T12:00:00"),ps={pendiente:"Pend",parcial:"Pend (anticipo)",liquidada:"OK"}[r.pago||"pendiente"];return "<tr><td>"+fmtD(r.entrada)+"</td><td>"+r.huesped+"</td><td>"+(d?"<span style=\"color:"+d.color+"\">"+d.nom+"</span>":r.dep)+"</td><td>"+n+"</td><td>"+(r.origen||"-")+"</td><td>"+ps+"</td><td class=\"amt-i\">$"+r.precio.toLocaleString("es-MX")+"</td></tr>";}).join("")+"<tr style=\"font-weight:600;background:var(--bg2)\"><td colspan=\"6\" style=\"text-align:right;padding:8px\">Total</td><td class=\"amt-i\" style=\"padding:8px\">$"+total.toLocaleString("es-MX")+"</td></tr></tbody>";
}
function renderEgr(){
  var mes=document.getElementById("fil-egr-mes").value;
  var f=egrs.filter(function(e){return mes==="todos"||e.fecha.startsWith(mes);});
  f.sort(function(a,b){return b.fecha.localeCompare(a.fecha);});
  var total=f.reduce(function(s,e){return s+e.monto;},0);
  var t=document.getElementById("tabla-egr");
  if(!f.length){t.innerHTML="<tr><td colspan=\"5\" style=\"text-align:center;padding:2rem;color:var(--text3)\">Sin gastos</td></tr>";return;}
  t.innerHTML="<thead><tr><th>Fecha</th><th>Categoria</th><th>Depto</th><th>Descripcion</th><th>Monto</th><th></th></tr></thead><tbody>"+f.map(function(e){var d=depById(e.dep);return "<tr><td>"+fmtD(e.fecha)+"</td><td>"+e.cat+"</td><td>"+(d?"<span style=\"color:"+d.color+"\">"+d.nom+"</span>":"General")+"</td><td>"+e.desc+"</td><td class=\"amt-e\">$"+e.monto.toLocaleString("es-MX")+"</td><td><button class=\"btn btn-del\" style=\"padding:3px 6px;font-size:11px\" onclick=\"pConfirm('Eliminar gasto?','',function(){delEgr('"+e.id+"');})\">Del</button></td></tr>";}).join("")+"<tr style=\"font-weight:600;background:var(--bg2)\"><td colspan=\"4\" style=\"text-align:right;padding:8px\">Total</td><td class=\"amt-e\" style=\"padding:8px\">$"+total.toLocaleString("es-MX")+"</td><td></td></tr></tbody>";
}

// EGRESOS MODAL
function abrirEgreso(id){
  editEgr=id||null;
  var s=document.getElementById("e-dep");
  s.innerHTML="<option value=\"general\">General (ambos)</option>"+deps.map(function(d){return "<option value=\""+d.id+"\">"+d.nom+"</option>";}).join("");
  limpiarErrs("mo-egr");document.getElementById("mo-egr").classList.add("open");
  if(id){
    var e=egrs.find(function(x){return x.id===id;});if(!e)return;
    document.getElementById("egr-tit").textContent="Editar gasto";document.getElementById("egr-btn-txt").textContent="Guardar cambios";
    document.getElementById("e-fecha").value=e.fecha;document.getElementById("e-cat").value=e.cat;
    s.value=e.dep||"general";document.getElementById("e-desc").value=e.desc;document.getElementById("e-monto").value=e.monto;
  } else {
    document.getElementById("egr-tit").textContent="Nuevo gasto";document.getElementById("egr-btn-txt").textContent="Guardar";
    document.getElementById("e-fecha").value=fechaHoy();document.getElementById("e-cat").value="";
    document.getElementById("e-desc").value="";document.getElementById("e-monto").value="";
  }
}
function cerrarEgr(){document.getElementById("mo-egr").classList.remove("open");editEgr=null;}
function guardarEgr(){
  limpiarErrs("mo-egr");
  var fecha=document.getElementById("e-fecha").value,cat=document.getElementById("e-cat").value;
  var dep=document.getElementById("e-dep").value,desc=document.getElementById("e-desc").value.trim();
  var monto=document.getElementById("e-monto").value;
  var ok=true;
  if(!fecha){document.getElementById("fg-ef").classList.add("fe");ok=false;}
  if(!cat){document.getElementById("fg-ecat").classList.add("fe");ok=false;}
  if(!desc){document.getElementById("fg-edesc").classList.add("fe");ok=false;}
  if(!monto||parseFloat(monto)<0){document.getElementById("fg-emonto").classList.add("fe");ok=false;}
  if(!ok)return;
  var obj={fecha:fecha,cat:cat,dep:dep,desc:desc,monto:parseFloat(monto)};
  if(editEgr){var i=egrs.findIndex(function(x){return x.id===editEgr;});if(i>=0)egrs[i]=Object.assign({},egrs[i],obj);}
  else egrs.push(Object.assign({id:Date.now().toString()},obj));
  sv("egr_v6",egrs);cerrarEgr();if(tabAct==="fin")renderFin();renderStats();
}
function delEgr(id){egrs=egrs.filter(function(x){return x.id!==id;});sv("egr_v6",egrs);if(tabAct==="fin")renderFin();renderStats();}

// MENSAJES
function renderMsg(){
  document.getElementById("etags-wrap").innerHTML=ETQS.map(function(e){return "<span class=\"etag\" onclick=\"insertEtag('"+e+"')\">"+e+"</span>";}).join("");
  var defs={huesped:"Mensaje al huesped",llaves:"Mensaje al ama de llaves",admin:"Mensaje al administrador",apartado:"Mensaje de fecha apartada",liberado:"Mensaje de fecha liberada",aseo:"Resumen mensual de aseo"};
  document.getElementById("tpl-list").innerHTML=Object.entries(defs).map(function(e){var k=e[0],l=e[1];return "<div><div style=\"font-size:13px;font-weight:600;margin-bottom:6px\">"+l+"</div><textarea class=\"fi\" id=\"tpl-"+k+"\" style=\"min-height:90px;font-size:12px;line-height:1.6\" oninput=\"prevTpl('"+k+"')\">"+(tpls[k]||"")+"</textarea><div class=\"tpl-box\" id=\"prev-"+k+"\">"+(tpls[k]||"")+"</div></div>";}).join("");
}
document.addEventListener("focusin",function(e){if(e.target.id&&e.target.id.startsWith("tpl-"))focusTpl=e.target.id.replace("tpl-","");});
function insertEtag(tag){if(!focusTpl)return;var ta=document.getElementById("tpl-"+focusTpl);if(!ta)return;var s=ta.selectionStart,e=ta.selectionEnd;ta.value=ta.value.slice(0,s)+tag+ta.value.slice(e);ta.selectionStart=ta.selectionEnd=s+tag.length;ta.focus();prevTpl(focusTpl);}
function prevTpl(k){var ta=document.getElementById("tpl-"+k);if(ta)document.getElementById("prev-"+k).textContent=ta.value;}
function guardarTpls(){Object.keys(tpls).forEach(function(k){var ta=document.getElementById("tpl-"+k);if(ta)tpls[k]=ta.value;});sv("tpl_v6",tpls);alert("Mensajes guardados");}

// DEPTOS
function renderDeps(){
  var lista=document.getElementById("lista-dep");
  if(!deps.length){lista.innerHTML="<div class=\"empty\">Agrega un departamento</div>";return;}
  lista.innerHTML=deps.map(function(dep){
    var nR=rsvps.filter(function(r){return r.dep===dep.id;}).length;
    var sl=dep.icalS?"Ultima sync: "+new Date(dep.icalS).toLocaleString("es-MX",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"}):"Nunca sincronizado";
    return "<div class=\"dep-row\"><div style=\"width:14px;height:14px;border-radius:50%;background:"+dep.color+";flex-shrink:0;margin-top:2px\"></div><div class=\"dep-row-info\"><div style=\"font-size:14px;font-weight:600\">"+dep.nom+"</div><div style=\"font-size:12px;color:var(--text2);margin-top:2px\">"+(dep.dir||"Sin direccion")+" &middot; "+nR+" reserva"+(nR!==1?"s":"")+"</div><div style=\"font-size:11px;color:var(--text3);margin-top:3px\">WiFi: "+(dep.wifi||"-")+" | Pass: "+(dep.wpass||"-")+(dep.telL?" | Llaves: "+dep.telL:"")+(dep.telA?" | Admin: "+dep.telA:"")+"</div><div class=\"ical-row\" style=\"flex-direction:column;gap:6px\"><div style=\"font-size:11px;color:var(--text2)\">iCal escritura (GitHub → Airbnb):</div><input class=\"ical-inp\" type=\"text\" placeholder=\"Link iCal de escritura...\" value=\""+(dep.ical||"")+"\" id=\"ical-"+dep.id+"\" oninput=\"dep.ical=this.value;sv('deps_v6',deps)\"><div style=\"font-size:11px;color:var(--text2)\">iCal lectura (Airbnb → App):</div><input class=\"ical-inp\" type=\"text\" placeholder=\"https://www.airbnb.mx/calendar/ical/...\" value=\""+(dep.icalAirbnb||"")+"\" id=\"ical-ab-"+dep.id+"\" oninput=\"dep.icalAirbnb=this.value;sv('deps_v6',deps)\"><button class=\"btn btn-g\" style=\"font-size:12px;padding:5px 10px\" onclick=\"syncIcal('"+dep.id+"')\">Sincronizar Airbnb</button></div><div style=\"font-size:11px;color:var(--text3);margin-top:4px\" id=\"ical-st-"+dep.id+"\">"+(dep.icalAirbnb?sl:"Sin link iCal de Airbnb")+"</div></div><div style=\"display:flex;gap:5px;flex-shrink:0\"><button class=\"btn btn-i\" onclick=\"abrirDep('"+dep.id+"')\">Edit</button><button class=\"btn btn-del\" onclick=\"pConfirm('Eliminar departamento?','Se eliminaran tambien todas sus reservas.',function(){delDep('"+dep.id+"');})\">Del</button></div></div>";
  }).join("");
}
async function syncIcal(depId){
  var dep=depById(depId);
  var url=dep&&dep.icalAirbnb?dep.icalAirbnb:"";
  if(!url){var st=document.getElementById("ical-st-"+depId);if(st){st.textContent="Sin link iCal de Airbnb";st.style.color="var(--d)";}return;}
  var st=document.getElementById("ical-st-"+depId);
  if(st)st.textContent="Sincronizando...";
  try{
    var txt="";
    if(url.includes("BEGIN:VCALENDAR")){
      txt=url;
    } else {
      try{
        var res1=await fetch("https://api.allorigins.win/get?url="+encodeURIComponent(url));
        var raw1=await res1.text();
        if(raw1.includes("BEGIN:VCALENDAR"))txt=raw1;
        else {
          try{var data1=JSON.parse(raw1);txt=data1&&data1.contents?data1.contents:"";}catch(_){txt="";}
        }
      }catch(_){txt="";}

      if(!txt.includes("BEGIN:VCALENDAR")){
        try{
          var res2=await fetch("https://api.allorigins.win/raw?url="+encodeURIComponent(url));
          var raw2=await res2.text();
          if(raw2.includes("BEGIN:VCALENDAR"))txt=raw2;
        }catch(_){ }
      }

      if(!txt.includes("BEGIN:VCALENDAR")&&/^https?:\/\//i.test(url)){
        try{
          var urlNoProto=url.replace(/^https?:\/\//i,"");
          var res3=await fetch("https://r.jina.ai/http://"+urlNoProto);
          var raw3=await res3.text();
          if(raw3.includes("BEGIN:VCALENDAR"))txt=raw3;
        }catch(_){ }
      }
    }
    if(!txt.includes("BEGIN:VCALENDAR"))throw new Error("Link no valido");
    var fechas=parsearIcal(txt);dep.icalF=fechas;dep.icalS=new Date().toISOString();
    sv("deps_v6",deps);
    if(st){st.textContent="OK - "+fechas.length+" dias de Airbnb importados";st.style.color="var(--s)";}
    renderCal();
  }catch(e){
    if(st){st.textContent="Error: "+e.message;st.style.color="var(--d)";}
  }
}
function parsearIcal(txt){
  var f=new Set();
  txt.split("BEGIN:VEVENT").slice(1).forEach(function(ev){
    var s=ev.match(/DTSTART[^:]*:(\d{8})/),e=ev.match(/DTEND[^:]*:(\d{8})/);
    if(s&&e){
      var d=pfi(s[1]),fin=pfi(e[1]);
      while(d<fin){f.add(d.toISOString().slice(0,10));d.setDate(d.getDate()+1);}
    }
  });
  return Array.from(f);
}
function pfi(s){return new Date(parseInt(s.slice(0,4)),parseInt(s.slice(4,6))-1,parseInt(s.slice(6,8)));}
async function triggerIcalUpdate(){try{await fetch(ICAL_UPDT);}catch(e){}}
function shouldAutoSyncIcal(dep){
  if(!dep||!dep.icalAirbnb)return false;
  if(!Array.isArray(dep.icalF)||!dep.icalF.length)return true;
  if(!dep.icalS)return true;
  var last=Date.parse(dep.icalS);
  if(isNaN(last))return true;
  return Date.now()-last>=ICAL_AUTO_SYNC_MS;
}
function autoSyncIcals(){
  deps.forEach(function(dep){
    if((dep.id==="dep1"||dep.id==="dep2")&&shouldAutoSyncIcal(dep))syncIcal(dep.id);
  });
}

function abrirDep(id){
  editDep=id||null;
  buildColorPicker(id&&depById(id)?depById(id).color:COLORES[deps.length%COLORES.length]);
  limpiarErrs("mo-dep");document.getElementById("mo-dep").classList.add("open");
  if(id){
    var d=depById(id);if(!d)return;
    document.getElementById("dep-tit").textContent="Editar departamento";document.getElementById("dep-btn-txt").textContent="Guardar cambios";
    document.getElementById("d-nom").value=d.nom;document.getElementById("d-num").value=d.num||"";
    document.getElementById("d-dir").value=d.dir||"";document.getElementById("d-ical").value=d.ical||"";
    document.getElementById("d-ical-ab").value=d.icalAirbnb||"";
    document.getElementById("d-ubi").value=d.ubi||"";document.getElementById("d-acceso").value=d.acceso||"";
    document.getElementById("d-tel-llaves").value=d.telL||"";document.getElementById("d-tel-admin").value=d.telA||"";
    document.getElementById("d-wifi").value=d.wifi||"";document.getElementById("d-wpass").value=d.wpass||"";
    document.getElementById("d-regl").value=d.regl||"";
  } else {
    document.getElementById("dep-tit").textContent="Nuevo departamento";document.getElementById("dep-btn-txt").textContent="Agregar";
    ["d-nom","d-num","d-dir","d-ical","d-ical-ab","d-ubi","d-acceso","d-tel-llaves","d-tel-admin","d-wifi","d-wpass","d-regl"].forEach(function(i){document.getElementById(i).value="";});
  }
}
function cerrarDep(){document.getElementById("mo-dep").classList.remove("open");editDep=null;}
function guardarDep(){
  limpiarErrs("mo-dep");
  var nom=document.getElementById("d-nom").value.trim();
  if(!nom){document.getElementById("fg-dep-nom").classList.add("fe");return;}
  var num=document.getElementById("d-num").value.trim(),dir=document.getElementById("d-dir").value.trim();
  var ical=document.getElementById("d-ical").value.trim();
  var icalAirbnb=document.getElementById("d-ical-ab").value.trim();
  var ubi=document.getElementById("d-ubi").value.trim();
  var acceso=document.getElementById("d-acceso").value.trim(),telL=document.getElementById("d-tel-llaves").value.trim();
  var telA=document.getElementById("d-tel-admin").value.trim(),wifi=document.getElementById("d-wifi").value.trim();
  var wpass=document.getElementById("d-wpass").value.trim(),regl=document.getElementById("d-regl").value.trim();
  var idx=COLORES.indexOf(colorSel),colorL=idx>=0?COLORES_L[idx]:"#E6F1FB";
  if(editDep){
    var i=deps.findIndex(function(d){return d.id===editDep;});
    if(i>=0)deps[i]=Object.assign({},deps[i],{nom:nom,num:num,dir:dir,ical:ical,icalAirbnb:icalAirbnb,ubi:ubi,acceso:acceso,telL:telL,telA:telA,wifi:wifi,wpass:wpass,regl:regl,color:colorSel,colorL:colorL});
  } else {
    deps.push({id:"dep_"+Date.now(),nom:nom,num:num,dir:dir,ical:ical,icalAirbnb:icalAirbnb,ubi:ubi,acceso:acceso,telL:telL,telA:telA,wifi:wifi,wpass:wpass,regl:regl,color:colorSel,colorL:colorL,icalF:[],icalS:null});
  }
  sv("deps_v6",deps);cerrarDep();renderTodo();if(tabAct==="dep")renderDeps();
}
function delDep(id){deps=deps.filter(function(d){return d.id!==id;});rsvps=rsvps.filter(function(r){return r.dep!==id;});sv("deps_v6",deps);sv("rsvp_v6",rsvps);renderTodo();renderDeps();}
function buildColorPicker(sel){
  colorSel=sel||COLORES[0];
  document.getElementById("cp-row").innerHTML=COLORES.map(function(c,i){return "<div class=\"cp"+(c===colorSel?" sel":"")+"\" style=\"background:"+c+"\" onclick=\"selCol('"+c+"',"+i+")\"></div>";}).join("");
}
function selCol(c,i){colorSel=c;document.querySelectorAll(".cp").forEach(function(el,j){el.classList.toggle("sel",j===i);});}

// USUARIOS
function renderUsrs(){
  document.getElementById("lista-usr").innerHTML=usrs.map(function(u,i){
    return "<div style=\"display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:.5px solid var(--border)\"><div style=\"flex:1\"><div style=\"font-size:13px;font-weight:500\">"+u.user+"</div></div>"+(i>0?"<button class=\"btn btn-del\" style=\"padding:4px 8px;font-size:11px\" onclick=\"delUser("+i+")\">Del</button>":"<span style=\"font-size:11px;color:var(--text3)\">Admin</span>")+"</div>";
  }).join("");
}
function addUser(){
  var u=document.getElementById("new-usr").value.trim(),p=document.getElementById("new-pass").value.trim();
  if(!u||!p){alert("Completa usuario y contrasena");return;}
  if(usrs.find(function(x){return x.user.toLowerCase()===u.toLowerCase();})){alert("Ya existe");return;}
  usrs.push({user:u,pass:p,rol:"user"});sv("usr_v6",usrs);
  document.getElementById("new-usr").value="";document.getElementById("new-pass").value="";
  renderUsrs();
}
function delUser(i){usrs.splice(i,1);sv("usr_v6",usrs);renderUsrs();}

// ALERTAS Y STATS
function renderAlertas(){
  var hoy=fechaHoy();
  var man=new Date();man.setDate(man.getDate()+1);
  var manS=man.getFullYear()+"-"+String(man.getMonth()+1).padStart(2,"0")+"-"+String(man.getDate()).padStart(2,"0");
  var rs=rsvps.filter(function(r){return r&&typeof r.entrada==="string"&&typeof r.salida==="string";});
  var als=[];
  var salHoy=rs.filter(function(r){return r.salida===hoy;});
  var llegHoy=rs.filter(function(r){return r.entrada===hoy;});
  var llegMan=rs.filter(function(r){return r.entrada===manS;});
  var pend=rs.filter(rsvpConAdeudo);
  limpiarAparts();
  var apExp=aparts.filter(function(a){var h=(a.expira-Date.now())/3600000;return h<6&&h>0;});
  var msgPend=rs.filter(function(r){return msgPendiente(r)&&r.salida>=hoy;});
  if(salHoy.length)als.push("<div class=\"al al-hoy al-click\" onclick=\"verSalidasHoy()\">Check-out hoy: "+salHoy.map(function(r){return r.huesped;}).join(", ")+"</div>");
  if(llegHoy.length)als.push("<div class=\"al al-hoy al-click\" onclick=\"verLlegadasHoy()\">Llegadas hoy: "+llegHoy.map(function(r){return r.huesped;}).join(", ")+"</div>");
  if(llegMan.length)als.push("<div class=\"al al-man al-click\" onclick=\"verLlegadasManana()\">Llegadas manana: "+llegMan.map(function(r){return r.huesped;}).join(", ")+"</div>");
  if(pend.length)als.push("<div class=\"al al-pago al-click\" onclick=\"verPorCobrar()\">"+pend.length+" pago(s) pendiente(s): $"+totalPorCobrar(pend).toLocaleString("es-MX")+" MXN</div>");
  if(apExp.length)als.push("<div class=\"al al-ap al-click\" onclick=\"verApartadosPorVencer()\">"+apExp.length+" apartado(s) por vencer: "+apExp.map(function(a){return a.nombre;}).join(", ")+"</div>");
  if(msgPend.length)als.push("<div class=\"al al-man al-click\" onclick=\"verMensajesPendientes()\">"+msgPend.length+" reserva(s) con mensajes pendientes</div>");
  document.getElementById("alertas-wrap").innerHTML=als.join("");
}
function renderStats(){
  var h=new Date(),ms=h.getFullYear()+"-"+String(h.getMonth()+1).padStart(2,"0");
  var rs=rsvps.filter(function(r){return r&&typeof r.entrada==="string"&&typeof r.salida==="string";});
  var iM=rs.filter(function(r){return r.entrada.startsWith(ms);}).reduce(function(s,r){return s+r.precio;},0);
  var pend=rs.filter(rsvpConAdeudo);
  var prox=rs.filter(function(r){return r.salida>=fechaHoy();}).length;
  document.getElementById("stats").innerHTML="<div class=\"sc sc-click\" onclick=\"verDeptos()\"><div class=\"sc-l\">Deptos</div><div class=\"sc-v\">"+deps.length+"</div><div class=\"sc-s\">activos</div></div><div class=\"sc sc-click\" onclick=\"verProximasLlegadas()\"><div class=\"sc-l\">Proximas llegadas</div><div class=\"sc-v\">"+prox+"</div><div class=\"sc-s\">reservadas</div></div><div class=\"sc sc-click\" onclick=\"verIngresosMes()\"><div class=\"sc-l\">Ingresos este mes</div><div class=\"sc-v\" style=\"color:var(--s)\">$"+iM.toLocaleString("es-MX")+"</div><div class=\"sc-s\">MXN</div></div><div class=\"sc sc-click\" onclick=\"verPorCobrar()\"><div class=\"sc-l\">Por cobrar</div><div class=\"sc-v\" style=\""+(pend.length?"color:var(--w)":"")+"\">$"+totalPorCobrar(pend).toLocaleString("es-MX")+"</div><div class=\"sc-s\">"+pend.length+" pendiente"+(pend.length!==1?"s":"")+"</div></div><div class=\"sc sc-click\" onclick=\"verApartados()\"><div class=\"sc-l\">Apartados activos</div><div class=\"sc-v\" style=\"color:#7c3aed\">"+aparts.length+"</div><div class=\"sc-s\">en espera</div></div>";
}

// MODAL RESERVA
function abrirRsvp(id,prefill){
  editRsvp=id||null;
  var s=document.getElementById("f-dep");
  s.innerHTML="<option value=\"\">Seleccionar...</option>"+deps.map(function(d){return "<option value=\""+d.id+"\">"+d.nom+"</option>";}).join("");
  limpiarErrs("mo-rsvp");document.getElementById("fg-anticipo").style.display="none";
  document.getElementById("mo-rsvp").classList.add("open");document.getElementById("precio-calc").style.display="none";
  if(id){
    var r=rsvps.find(function(x){return x.id===id;});if(!r)return;
    document.getElementById("mo-rsvp-tit").textContent="Editar reserva";document.getElementById("btn-rsvp-txt").textContent="Guardar cambios";
    document.getElementById("f-huesped").value=r.huesped;document.getElementById("f-tel").value=r.telefono;
    document.getElementById("f-correo").value=r.correo||"";s.value=r.dep;document.getElementById("f-per").value=r.personas;
    document.getElementById("f-ent").value=r.entrada;document.getElementById("f-sal").value=r.salida;
    document.getElementById("f-precio").value=r.precio;document.getElementById("f-dep2").value=r.deposito||"";
    document.getElementById("f-airbnb").value=r.numAirbnb||"";document.getElementById("f-origen").value=r.origen||"airbnb";
    document.getElementById("f-color").value=r.colorReserva||COL_ORIG[r.origen||"airbnb"]||"#185FA5";
    document.getElementById("f-pago").value=r.pago||"pendiente";document.getElementById("f-anticipo").value=r.anticipo||"";
    document.getElementById("fg-anticipo").style.display=r.pago==="parcial"?"":"none";
    document.getElementById("f-notas").value=r.notas||"";
    var rads=document.querySelectorAll("input[name=\"pmodo\"]");if(rads[0])rads[0].checked=true;
    renderWarningEmpalmeRsvp();
  } else {
    document.getElementById("mo-rsvp-tit").textContent="Nueva reserva";document.getElementById("btn-rsvp-txt").textContent="Guardar";
    ["f-huesped","f-tel","f-correo","f-per","f-ent","f-sal","f-precio","f-notas","f-anticipo","f-dep2","f-airbnb"].forEach(function(i){document.getElementById(i).value="";});
    s.value="";document.getElementById("f-origen").value="airbnb";document.getElementById("f-color").value="#E8393A";
    document.getElementById("color-lbl").textContent="Rojo (Airbnb)";document.getElementById("f-pago").value="pendiente";
    var rads=document.querySelectorAll("input[name=\"pmodo\"]");if(rads[0])rads[0].checked=true;
    if(prefill){
      document.getElementById("f-huesped").value=prefill.nombre||"";document.getElementById("f-tel").value=prefill.telefono||"";
      s.value=prefill.dep||"";document.getElementById("f-ent").value=prefill.entrada||"";document.getElementById("f-sal").value=prefill.salida||"";
    }
    renderWarningEmpalmeRsvp();
  }
}
function cerrarRsvp(){document.getElementById("mo-rsvp").classList.remove("open");editRsvp=null;}
async function guardarRsvp(){
  limpiarErrs("mo-rsvp");
  var huesped=document.getElementById("f-huesped").value.trim(),tel=document.getElementById("f-tel").value.trim();
  var correo=document.getElementById("f-correo").value.trim(),dep=document.getElementById("f-dep").value;
  var per=document.getElementById("f-per").value,ent=document.getElementById("f-ent").value;
  var sal=document.getElementById("f-sal").value,deposito=document.getElementById("f-dep2").value;
  var airbnb=document.getElementById("f-airbnb").value.trim(),origen=document.getElementById("f-origen").value;
  var colorR=document.getElementById("f-color").value,pago=document.getElementById("f-pago").value;
  var anticipo=document.getElementById("f-anticipo").value,notas=document.getElementById("f-notas").value.trim();
  var telD=tel.replace(/\D/g,"");
  var ok=true;
  if(!huesped){document.getElementById("fg-huesped").classList.add("fe");ok=false;}
  if(!tel||telD.length<10||telD.length>15){document.getElementById("fg-tel").classList.add("fe");ok=false;}
  if(!dep){document.getElementById("fg-dep").classList.add("fe");ok=false;}
  if(!per||parseInt(per)<1){document.getElementById("fg-per").classList.add("fe");ok=false;}
  if(!ent){document.getElementById("fg-ent").classList.add("fe");ok=false;}
  if(!sal||sal<=ent){document.getElementById("fg-sal").classList.add("fe");ok=false;}
  if(!ok)return;
  var precioFinal=getPrecioTotal();
  var depositoNum=parseMonto(deposito);
  var msj=editRsvp?(rsvps.find(function(x){return x.id===editRsvp;})||{mensajes:{}}).mensajes||{}:{};
  var obj={huesped:huesped,telefono:tel,correo:correo,dep:dep,personas:parseInt(per),entrada:ent,salida:sal,precio:precioFinal,deposito:depositoNum,numAirbnb:airbnb,origen:origen,colorReserva:colorR,pago:pago,anticipo:pago==="parcial"?parseMonto(anticipo):0,notas:notas,mensajes:msj,updatedAt:new Date().toISOString()};
  if(editRsvp){var i=rsvps.findIndex(function(x){return x.id===editRsvp;});if(i>=0)rsvps[i]=Object.assign({},rsvps[i],obj);}
  else rsvps.push(Object.assign({id:Date.now().toString(),creado:new Date().toISOString()},obj));
  irAMesFecha(ent);
  if(tabAct!=="cal")goTab("cal");
  sv("rsvp_v6",rsvps);
  cerrarRsvp();renderTodo();triggerIcalUpdate();
  syncTab("rsvp_v6",rsvps);
}

// UTILS
function limpiarErrs(modal){document.getElementById(modal).querySelectorAll(".fe").forEach(function(el){el.classList.remove("fe");});}
function pConfirm(t,txt,cb){confirmCb=cb;document.getElementById("co-tit").textContent=t;document.getElementById("co-txt").textContent=txt;document.getElementById("co").classList.add("open");}
function cerrarConfirm(){document.getElementById("co").classList.remove("open");confirmCb=null;}
function ejecutarConfirm(){if(confirmCb)confirmCb();cerrarConfirm();}
function renderTodo(){renderStats();renderAlertas();renderCal();if(tabAct==="rsvp"){updFilDep();renderRsvp();}if(tabAct==="apart"){limpiarAparts();renderAparts();}if(tabAct==="hist")renderHist();if(tabAct==="fin")renderFin();if(tabAct==="dep")renderDeps();}
function exportarRespaldoLocal(){
  var payload={
    exportedAt:new Date().toISOString(),
    deps_v6:deps,
    rsvp_v6:rsvps,
    egr_v6:egrs,
    apart_v6:aparts,
    usr_v6:usrs,
    tpl_v6:tpls,
    cfg_v6:cfg,
    pending:getPendingSync()
  };
  var blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});
  var url=URL.createObjectURL(blob);
  var a=document.createElement("a");
  a.href=url;
  a.download="albatros-respaldo-"+new Date().toISOString().slice(0,19).replace(/[T:]/g,"-")+".json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  setSyncBar("Respaldo exportado en JSON.","var(--sg)","var(--s)",2200);
}
function abrirImportacionRespaldo(){
  var input=document.getElementById("backup-file");
  if(!input)return;
  input.value="";
  input.click();
}
async function syncAirbnbFeedsManual(){
  var targets=(deps||[]).filter(function(dep){return dep&&dep.icalAirbnb&&String(dep.icalAirbnb).trim();});
  for(var i=0;i<targets.length;i++){
    try{await syncIcal(targets[i].id);}catch(e){}
  }
}
function importarRespaldoLocal(ev){
  var file=ev&&ev.target&&ev.target.files?ev.target.files[0]:null;
  if(!file)return;
  var reader=new FileReader();
  reader.onload=function(){
    try{
      var data=JSON.parse(reader.result||"{}");
      if(Array.isArray(data.deps_v6))deps=data.deps_v6.map(function(d){return normDep(d);});
      if(Array.isArray(data.rsvp_v6))rsvps=mergeReservasByUpdatedAt(rsvps,data.rsvp_v6);
      if(Array.isArray(data.egr_v6))egrs=data.egr_v6;
      if(Array.isArray(data.apart_v6))aparts=data.apart_v6;
      if(data.usr_v6!==undefined)usrs=normalizeUsers(data.usr_v6);
      if(data.tpl_v6&&typeof data.tpl_v6==="object")tpls=data.tpl_v6;
      if(data.cfg_v6&&typeof data.cfg_v6==="object")cfg=data.cfg_v6;

      try{localStorage.setItem("deps_v6",JSON.stringify(deps));}catch(e){}
      try{localStorage.setItem("rsvp_v6",JSON.stringify(rsvps));}catch(e){}
      try{localStorage.setItem("egr_v6",JSON.stringify(egrs));}catch(e){}
      try{localStorage.setItem("apart_v6",JSON.stringify(aparts));}catch(e){}
      try{localStorage.setItem("usr_v6",JSON.stringify(usrs));}catch(e){}
      try{localStorage.setItem("tpl_v6",JSON.stringify(tpls));}catch(e){}
      try{localStorage.setItem("cfg_v6",JSON.stringify(cfg));}catch(e){}

      if(Array.isArray(data.rsvp_v6))setPendingSync("rsvp_v6");
      if(Array.isArray(data.apart_v6))setPendingSync("apart_v6");
      if(Array.isArray(data.egr_v6))setPendingSync("egr_v6");
      if(Array.isArray(data.deps_v6))setPendingSync("deps_v6");
      if(data.tpl_v6&&typeof data.tpl_v6==="object")setPendingSync("tpl_v6");
      if(data.cfg_v6&&typeof data.cfg_v6==="object")setPendingSync("cfg_v6");
      if(data.usr_v6!==undefined)setPendingSync("usr_v6");

      renderTodo();
      setSyncBar("Respaldo importado. Quedo marcado para sincronizar.","var(--sg)","var(--s)",2600);
    }catch(err){
      setSyncBar("No se pudo importar el respaldo.","var(--wg)","var(--w)",2600);
    }
  };
  reader.readAsText(file);
}
async function syncManual(){
  await syncAirbnbFeedsManual();
  await retryPendingSync();
  await cargarSheets();
  renderTodo();
}
async function refreshSharedData(){await retryPendingSync();await cargarSheets();renderTodo();}

// LOGIN
function doLogin(){
  var u=document.getElementById("lu").value.trim(),p=document.getElementById("lp").value.trim();
  usrs=normalizeUsers(usrs);
  try{localStorage.setItem("usr_v6",JSON.stringify(usrs));}catch(e){}
  var found=usrs.find(function(x){return x.user.toLowerCase()===u.toLowerCase()&&x.pass===p;});
  if(found){sessionStorage.setItem("alb",u);document.getElementById("login-screen").style.display="none";document.getElementById("app").style.display="";document.getElementById("usr-nom").textContent=u;iniciarApp();}
  else{document.getElementById("login-err").style.display="block";}
}
function logout(){sessionStorage.removeItem("alb");document.getElementById("app").style.display="none";document.getElementById("login-screen").style.display="flex";document.getElementById("lu").value="";document.getElementById("lp").value="";document.getElementById("login-err").style.display="none";}
document.getElementById("lp").addEventListener("keydown",function(e){if(e.key==="Enter")doLogin();});
document.getElementById("lu").addEventListener("keydown",function(e){if(e.key==="Enter")document.getElementById("lp").focus();});
document.getElementById("f-ent").addEventListener("change",calcPrecio);
document.getElementById("f-sal").addEventListener("change",calcPrecio);
document.getElementById("f-dep").addEventListener("change",renderWarningEmpalmeRsvp);
document.getElementById("f-ent").addEventListener("change",renderWarningEmpalmeRsvp);
document.getElementById("f-sal").addEventListener("change",renderWarningEmpalmeRsvp);

// Override limpio de la vista Por dpto.
function renderDepto(){
  var el=document.getElementById("ft-depto");
  var meses=mesesDisp();
  var ys=yearsDisp();
  var depSelIn=document.getElementById("fil-depto-dep");
  var depSel=depSelIn?depSelIn.value:"todos";
  var ySelIn=document.getElementById("fil-depto-year");
  var ySel=ySelIn?parseInt(ySelIn.value,10):ys[0];
  if(!ys.includes(ySel))ySel=ys[0];
  var pdfSelIn=document.getElementById("fil-depto-pdf-mes");
  var pdfMesSel=pdfSelIn?pdfSelIn.value:(meses[0]||"todos");

  var depOpts="<option value=\"todos\">Todos los deptos</option>"+deps.map(function(d){return "<option value=\""+d.id+"\">"+d.nom+"</option>";}).join("");
  var mesOpts="<option value=\"todos\">Todos los meses</option>"+meses.map(function(m){return "<option value=\""+m+"\">"+fmtMes(m)+"</option>";}).join("");
  var yearOpts=ys.map(function(y){return "<option value=\""+y+"\">"+y+"</option>";}).join("");

  // Orden natural del arreglo: enero -> diciembre.
  var serie=buildYearSeries(ySel,depSel);
  var resumen=serie.reduce(function(acc,r){
    acc.ing+=r.ing;
    acc.egr+=r.egr;
    acc.balance=r.balance;
    acc.util+=r.util;
    return acc;
  },{ing:0,egr:0,balance:0,util:0});

  var ale=resumen.ing*0.4;
  var hector=resumen.ing*0.2;
  var bancoInicial=69000;
  var banco=bancoInicial-resumen.egr;
  var chart=buildFinLineChart(serie);

  var det=serie.map(function(r){
    var aleMes=r.ing*0.4;
    var hectorMes=r.ing*0.2;
    var alePct=r.ing?40:0;
    var hectorPct=r.ing?20:0;
    return "<div style=\"display:flex;justify-content:space-between;gap:8px;font-size:12px;padding:6px 0;border-bottom:.5px solid var(--border)\">"
      +"<span>"+fmtMes(r.mes)+"</span>"
      +"<span style=\"color:var(--s)\">Ing $"+r.ing.toLocaleString("es-MX")+"</span>"
      +"<span style=\"color:var(--d)\">Egr $"+r.egr.toLocaleString("es-MX")+"</span>"
      +"<span style=\"color:var(--w)\">Bal $"+r.balance.toLocaleString("es-MX")+"</span>"
      +"<span style=\"color:var(--i)\">Uti $"+r.util.toLocaleString("es-MX")+"</span>"
      +"<span style=\"color:var(--text2)\">Ale " + alePct.toFixed(0) + "% ($"+aleMes.toLocaleString("es-MX")+")</span>"
      +"<span style=\"color:var(--text2)\">Hector " + hectorPct.toFixed(0) + "% ($"+hectorMes.toLocaleString("es-MX")+")</span>"
      +"</div>";
  }).join("");

  var cards="<div class=\"rg\">"
    +"<div class=\"rc\"><div class=\"rc-l\">Ingresos</div><div class=\"rc-v\" style=\"color:var(--s);font-size:16px\">$"+resumen.ing.toLocaleString("es-MX")+"</div></div>"
    +"<div class=\"rc\"><div class=\"rc-l\">Egresos</div><div class=\"rc-v\" style=\"color:var(--d);font-size:16px\">$"+resumen.egr.toLocaleString("es-MX")+"</div></div>"
    +"<div class=\"rc\"><div class=\"rc-l\">Balance</div><div class=\"rc-v\" style=\"color:"+(resumen.balance>=0?"var(--w)":"var(--d)")+";font-size:16px\">$"+resumen.balance.toLocaleString("es-MX")+"</div></div>"
    +"<div class=\"rc\"><div class=\"rc-l\">Utilidad</div><div class=\"rc-v\" style=\"color:var(--i);font-size:16px\">$"+resumen.util.toLocaleString("es-MX")+"</div></div>"
    +"<div class=\"rc\"><div class=\"rc-l\">Ale 40%</div><div class=\"rc-v\" style=\"font-size:16px\">$"+ale.toLocaleString("es-MX")+"</div></div>"
    +"<div class=\"rc\"><div class=\"rc-l\">Hector 20%</div><div class=\"rc-v\" style=\"font-size:16px\">$"+hector.toLocaleString("es-MX")+"</div></div>"
    +"<div class=\"rc\"><div class=\"rc-l\">Banco</div><div class=\"rc-v\" style=\"color:"+(banco>=0?"var(--i)":"var(--d)")+";font-size:16px\">$"+banco.toLocaleString("es-MX")+"</div><div class=\"rc-s\">Inicio $"+bancoInicial.toLocaleString("es-MX")+" - gastos</div></div>"
    +"</div>";

  el.innerHTML=
    "<div class=\"filtros\" style=\"margin-bottom:12px;justify-content:space-between\"><div style=\"display:flex;gap:8px;flex-wrap:wrap\"><select class=\"fi\" id=\"fil-depto-dep\" onchange=\"renderDepto()\" style=\"width:auto;padding:5px 8px;font-size:12px\">"+depOpts+"</select><select class=\"fi\" id=\"fil-depto-year\" onchange=\"renderDepto()\" style=\"width:auto;padding:5px 8px;font-size:12px\">"+yearOpts+"</select><select class=\"fi\" id=\"fil-depto-pdf-mes\" style=\"width:auto;padding:5px 8px;font-size:12px\">"+mesOpts+"</select></div><div style=\"display:flex;gap:8px;flex-wrap:wrap\"><button class=\"btn btn-pdf\" onclick=\"pdfFinanzasMesDepto()\">PDF mensual</button><button class=\"btn btn-wa\" onclick=\"enviarPdfFinanzasWA()\">Enviar WA</button></div></div>"
    +"<div style=\"display:flex;gap:10px;flex-wrap:wrap;margin-bottom:10px;font-size:11px;color:var(--text2)\"><span><span style=\"color:#2e7d32\">●</span> Ingresos</span><span><span style=\"color:#b91c1c\">●</span> Egresos</span><span><span style=\"color:#b45309\">●</span> Balance</span><span><span style=\"color:#1565c0\">●</span> Utilidad</span></div>"
    +cards
    +chart
    +"<div style=\"background:var(--bg);border:.5px solid var(--border);border-radius:var(--rlg);padding:10px;margin-top:10px\">"
    +"<div style=\"font-size:12px;font-weight:600;margin-bottom:6px;color:var(--text2)\">Detalle mensual</div>"
    +det
    +"</div>";

  var depSelEl=document.getElementById("fil-depto-dep");
  if(depSelEl)depSelEl.value=depSel;
  var ySelEl2=document.getElementById("fil-depto-year");
  if(ySelEl2)ySelEl2.value=String(ySel);
  var pdfSelEl=document.getElementById("fil-depto-pdf-mes");
  if(pdfSelEl)pdfSelEl.value=pdfMesSel;
}

async function iniciarApp(){
  document.getElementById("fecha-hoy").textContent=new Date().toLocaleDateString("es-MX",{weekday:"long",year:"numeric",month:"long",day:"numeric"});
  await retryPendingSync();
  await cargarSheets();
  cargarHistoricas();
  limpiarAparts();
  autoSyncIcals();
  renderTodo();
}

if(sessionStorage.getItem("alb")){
  document.getElementById("login-screen").style.display="none";
  document.getElementById("app").style.display="";
  document.getElementById("usr-nom").textContent=sessionStorage.getItem("alb");
  iniciarApp();
}
