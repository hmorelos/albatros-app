// app.js - Logica principal
// Albatros Departamentos

var mes=new Date().getMonth(),ano=new Date().getFullYear();
var editRsvp=null,editEgr=null,editDep=null,confirmCb=null,colorSel=COLORES[0],tabAct="cal",finTabAct="res",focusTpl=null;

var depById=function(id){return deps.find(function(d){return d.id===id;});};
var toggleAnticipo=function(){document.getElementById("fg-anticipo").style.display=document.getElementById("f-pago").value==="parcial"?"":"none";};
var updateColor=function(){var o=document.getElementById("f-origen").value;document.getElementById("f-color").value=COL_ORIG[o]||"#185FA5";document.getElementById("color-lbl").textContent=COL_LAB[o]||"";};
function fechaHoy(){var d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");}
function fmtD(s){return new Date(s+"T12:00:00").toLocaleDateString("es-MX",{day:"2-digit",month:"2-digit",year:"numeric"});}
function fmtDL(s){return new Date(s+"T12:00:00").toLocaleDateString("es-MX",{weekday:"long",year:"numeric",month:"long",day:"numeric"});}
function noches(e,s){return Math.round((new Date(s)-new Date(e))/86400000);}

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

function renderRsvp(){
  var fd=document.getElementById("fil-dep").value,fe=document.getElementById("fil-est").value;
  var fp=document.getElementById("fil-pago").value,fm=document.getElementById("fil-msg").value;
  var hoy=fechaHoy();
  var f=rsvps.filter(function(r){return fd==="todos"||r.dep===fd;});
  if(fe==="prox")f=f.filter(function(r){return r.salida>=hoy;});
  if(fe==="pas")f=f.filter(function(r){return r.salida<hoy;});
  if(fp!=="todos")f=f.filter(function(r){return (r.pago||"pendiente")===fp;});
  if(fm==="pendmsg")f=f.filter(function(r){return msgPendiente(r)&&r.salida>=hoy;});
  if(fm==="enviados")f=f.filter(function(r){return !msgPendiente(r);});
  f.sort(function(a,b){return a.entrada.localeCompare(b.entrada);});
  var lista=document.getElementById("lista-rsvp");
  if(!f.length){lista.innerHTML="<div class=\"empty\">No hay reservas con estos filtros</div>";return;}
  lista.innerHTML=f.map(function(r){
    var dep=depById(r.dep),n=noches(r.entrada+"T12:00:00",r.salida+"T12:00:00");
    var ef=fmtD(r.entrada),sf=fmtD(r.salida),pasada=r.salida<hoy,ps=r.pago||"pendiente";
    var pb={pendiente:"<span class=\"badge b-pend\">Pendiente</span>",parcial:"<span class=\"badge b-parc\">Anticipo $"+(r.anticipo||0).toLocaleString("es-MX")+" / Resto $"+(r.precio-(r.anticipo||0)).toLocaleString("es-MX")+"</span>",liquidada:"<span class=\"badge b-liq\">Liquidada</span>"}[ps]||"";
    var pa=ps!=="liquidada"?"<div class=\"wa-row\">"+(ps==="pendiente"?"<button class=\"btn btn-g\" style=\"font-size:11px;padding:3px 8px\" onclick=\"cambiarPago('"+r.id+"','parcial')\">Anticipo</button>":"")+"<button class=\"btn btn-ok\" onclick=\"cambiarPago('"+r.id+"','liquidada')\">Liquidada</button></div>":"";
    var m=r.mensajes||{};
    var allSent=m.huesped&&m.llaves&&m.admin,noneSent=!m.huesped&&!m.llaves&&!m.admin;
    var msgInd=allSent?"OK":noneSent?"PEND":"PARC";
    var msgColor=allSent?"var(--s)":noneSent?"var(--d)":"var(--w)";
    var msgTxt=(m.huesped?"<span style=\"color:var(--s)\">Huesped OK</span>":"<span style=\"color:var(--d)\">Huesped pend</span>")+" &middot; "+(m.llaves?"<span style=\"color:var(--s)\">Llaves OK</span>":"<span style=\"color:var(--d)\">Llaves pend</span>")+" &middot; "+(m.admin?"<span style=\"color:var(--s)\">Admin OK</span>":"<span style=\"color:var(--d)\">Admin pend</span>");
    var depBadge=dep?"<span class=\"badge\" style=\"background:"+dep.colorL+";color:"+dep.color+"\">"+dep.nom+"</span>":"";
    var pdfl=r.pdfLink?"<a href=\""+r.pdfLink+"\" target=\"_blank\" style=\"font-size:11px;color:var(--i)\">Ver PDF</a>":"";
    return "<div class=\"rv-card "+ps+"\" style=\""+(pasada?"opacity:.6":"")+"\"><div class=\"rv-info\"><div class=\"rv-h\">"+r.huesped+"</div><div class=\"rv-f\">"+ef+" &rarr; "+sf+" &middot; "+n+" noche"+(n!==1?"s":"")+"</div><div class=\"rv-m\">"+depBadge+"<span class=\"badge\">$"+r.precio.toLocaleString("es-MX")+" MXN</span><span class=\"badge\">"+r.personas+" pers</span>"+(r.deposito?"<span class=\"badge\">Dep $"+r.deposito.toLocaleString("es-MX")+"</span>":"")+(r.numAirbnb?"<span class=\"badge\">"+r.numAirbnb+"</span>":"")+"</div><div class=\"rv-m\">"+pb+"</div>"+pa+"<div class=\"wa-row\"><button class=\"btn btn-pdf\" onclick=\"generarPDF('"+r.id+"','huesped')\">PDF Huesped</button><button class=\"btn btn-pdf\" onclick=\"generarPDF('"+r.id+"','llaves')\">PDF Llaves</button><button class=\"btn btn-pdf\" onclick=\"generarPDF('"+r.id+"','admin')\">PDF Admin</button><button class=\"btn btn-warn\" onclick=\"genPDFReservacion('"+r.id+"')\" id=\"btn-rpdf-"+r.id+"\">PDF Reservacion</button>"+pdfl+"</div><div class=\"wa-row\"><button class=\"btn btn-wa\" onclick=\"enviarWA('"+r.id+"','huesped')\">WA Huesped"+(m.huesped?" OK":"")+"</button><button class=\"btn btn-wa\" onclick=\"enviarWA('"+r.id+"','llaves')\">WA Llaves"+(m.llaves?" OK":"")+"</button><button class=\"btn btn-wa\" onclick=\"enviarWA('"+r.id+"','admin')\">WA Admin"+(m.admin?" OK":"")+"</button></div><div style=\"font-size:10px;color:"+msgColor+";margin-top:5px;font-weight:500\">"+msgTxt+"</div>"+(r.notas?"<div style=\"font-size:11px;color:var(--text3);margin-top:4px\">"+r.notas+"</div>":"")+"</div><div class=\"rv-actions\"><button class=\"btn btn-i\" onclick=\"abrirRsvp('"+r.id+"')\">Edit</button><button class=\"btn btn-del\" onclick=\"pConfirm('Eliminar reserva?','La fecha quedara disponible.',function(){delRsvp('"+r.id+"');})\">Del</button></div></div>";
  }).join("");
}

function cambiarPago(id,estado){
  var i=rsvps.findIndex(function(r){return r.id===id;});if(i<0)return;
  if(estado==="parcial"){var m=prompt("Cuanto es el anticipo? (MXN)");if(m===null)return;rsvps[i].anticipo=parseFloat(m)||0;}
  rsvps[i].pago=estado;sv("rsvp_v6",rsvps);renderRsvp();renderStats();
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
function enviarWA(id,tipo){
  var r=rsvps.find(function(x){return x.id===id;});if(!r)return;
  var dep=depById(r.dep)||{};
  var msg=aplicarTpl(tpls[tipo]||"",r);
  var tel="";
  if(tipo==="llaves")tel=(dep.telL||"").replace(/[\s\-\(\)]/g,"");
  else if(tipo==="admin")tel=(dep.telA||"").replace(/[\s\-\(\)]/g,"");
  else tel=(r.telefono||"").replace(/[\s\-\(\)]/g,"");
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
      if(btn){btn.textContent="PDF listo";btn.disabled=false;}
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
  aparts=aparts.filter(function(a){return ahora<=a.expira;});
  sv("apart_v6",aparts);
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
  var fakeR={huesped:nom,telefono:tel,dep:dep,entrada:ent,salida:sal,precio:0,personas:"",deposito:0};
  var msg=aplicarTpl(tpls.apartado||"",fakeR);
  window.open("https://wa.me/"+tel.replace(/[\s\-\(\)]/g,"")+"?text="+encodeURIComponent(msg),"_blank");
  renderTodo();
}
function liberarApartado(id){
  var a=aparts.find(function(x){return x.id===id;});
  if(a){var fakeR={huesped:a.nombre,telefono:a.telefono,dep:a.dep,entrada:a.entrada,salida:a.salida,precio:0,personas:"",deposito:0};var msg=aplicarTpl(tpls.liberado||"",fakeR);window.open("https://wa.me/"+a.telefono.replace(/[\s\-\(\)]/g,"")+"?text="+encodeURIComponent(msg),"_blank");}
  aparts=aparts.filter(function(x){return x.id!==id;});sv("apart_v6",aparts);renderTodo();
}
function confirmarApartado(id){var a=aparts.find(function(x){return x.id===id;});if(!a)return;aparts=aparts.filter(function(x){return x.id!==id;});sv("apart_v6",aparts);abrirRsvp(null,a);}

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
function renderRes(){
  var el=document.getElementById("ft-res");
  var tI=rsvps.reduce(function(s,r){return s+r.precio;},0),tE=egrs.reduce(function(s,e){return s+e.monto;},0),util=tI-tE;
  var h=new Date(),ms=h.getFullYear()+"-"+String(h.getMonth()+1).padStart(2,"0");
  var iM=rsvps.filter(function(r){return r.entrada.startsWith(ms);}).reduce(function(s,r){return s+r.precio;},0);
  var eM=egrs.filter(function(e){return e.fecha.startsWith(ms);}).reduce(function(s,e){return s+e.monto;},0);
  var pc=rsvps.filter(function(r){return (r.pago||"pendiente")==="pendiente"&&r.salida>=fechaHoy();}).reduce(function(s,r){return s+r.precio;},0);
  var meses=mesesDisp().slice(0,6).reverse();
  var maxV=Math.max.apply(null,meses.map(function(m){return Math.max(rsvps.filter(function(r){return r.entrada.startsWith(m);}).reduce(function(s,r){return s+r.precio;},0),egrs.filter(function(e){return e.fecha.startsWith(m);}).reduce(function(s,e){return s+e.monto;},0),1);}));
  var barras=meses.map(function(m){
    var p=m.split("-"),label=MESES[parseInt(p[1])-1].slice(0,3);
    var ing=rsvps.filter(function(r){return r.entrada.startsWith(m);}).reduce(function(s,r){return s+r.precio;},0);
    var egr2=egrs.filter(function(eg){return eg.fecha.startsWith(m);}).reduce(function(s,eg){return s+eg.monto;},0);
    return "<div class=\"bar-row\"><div class=\"bar-lbl\">"+label+"</div><div style=\"flex:1;display:flex;flex-direction:column;gap:2px\"><div class=\"bar-track\"><div class=\"bar-fill bi\" style=\"width:"+Math.round(ing/maxV*100)+"%\">$"+(ing/1000).toFixed(0)+"k</div></div><div class=\"bar-track\"><div class=\"bar-fill be\" style=\"width:"+Math.round(egr2/maxV*100)+"%\">$"+(egr2/1000).toFixed(0)+"k</div></div></div></div>";
  }).join("");
  var cats={};egrs.forEach(function(e){cats[e.cat]=(cats[e.cat]||0)+e.monto;});
  var catR=Object.entries(cats).sort(function(a,b){return b[1]-a[1];}).map(function(e){return "<tr><td>"+e[0]+"</td><td class=\"amt-e\">$"+e[1].toLocaleString("es-MX")+"</td></tr>";}).join("");
  el.innerHTML="<div class=\"rg\"><div class=\"rc\"><div class=\"rc-l\">Ingresos totales</div><div class=\"rc-v\" style=\"color:var(--s)\">$"+tI.toLocaleString("es-MX")+"</div></div><div class=\"rc\"><div class=\"rc-l\">Egresos totales</div><div class=\"rc-v\" style=\"color:var(--d)\">$"+tE.toLocaleString("es-MX")+"</div></div><div class=\"rc\"><div class=\"rc-l\">Utilidad neta</div><div class=\"rc-v\" style=\"color:"+(util>=0?"var(--s)":"var(--d)")+"\">$"+util.toLocaleString("es-MX")+"</div></div><div class=\"rc\"><div class=\"rc-l\">Por cobrar</div><div class=\"rc-v\" style=\"color:var(--w)\">$"+pc.toLocaleString("es-MX")+"</div></div><div class=\"rc\"><div class=\"rc-l\">Este mes (Ing/Egr)</div><div class=\"rc-v\" style=\"font-size:13px\"><span style=\"color:var(--s)\">$"+iM.toLocaleString("es-MX")+"</span> / <span style=\"color:var(--d)\">$"+eM.toLocaleString("es-MX")+"</span></div></div></div><div style=\"font-size:11px;color:var(--text2);margin-bottom:6px;font-weight:500\">Ultimos 6 meses <span style=\"margin-left:8px;font-size:10px\"><span style=\"color:#3B6D11\">■</span> Ing <span style=\"color:#A32D2D;margin-left:4px\">■</span> Egr</span></div><div class=\"bar-chart\">"+barras+"</div>"+(catR?"<div style=\"font-size:11px;color:var(--text2);margin:1rem 0 8px;font-weight:500\">Egresos por categoria</div><table class=\"fin-table\"><thead><tr><th>Categoria</th><th>Total</th></tr></thead><tbody>"+catR+"</tbody></table>":"");
}
function renderDepto(){
  document.getElementById("ft-depto").innerHTML=deps.map(function(dep){
    var rv=rsvps.filter(function(r){return r.dep===dep.id;}),eg=egrs.filter(function(e){return e.dep===dep.id;});
    var ing=rv.reduce(function(s,r){return s+r.precio;},0),egr2=eg.reduce(function(s,e){return s+e.monto;},0),util=ing-egr2;
    var avg=rv.length?Math.round(rv.reduce(function(s,r){return s+noches(r.entrada+"T12:00:00",r.salida+"T12:00:00");},0)/rv.length):0;
    return "<div style=\"background:var(--bg);border:.5px solid var(--border);border-radius:var(--rlg);padding:14px;margin-bottom:10px\"><div style=\"display:flex;align-items:center;gap:8px;margin-bottom:12px\"><div style=\"width:12px;height:12px;border-radius:50%;background:"+dep.color+"\"></div><div style=\"font-size:15px;font-weight:600\">"+dep.nom+"</div></div><div class=\"rg\"><div class=\"rc\"><div class=\"rc-l\">Ingresos</div><div class=\"rc-v\" style=\"color:var(--s);font-size:16px\">$"+ing.toLocaleString("es-MX")+"</div></div><div class=\"rc\"><div class=\"rc-l\">Egresos</div><div class=\"rc-v\" style=\"color:var(--d);font-size:16px\">$"+egr2.toLocaleString("es-MX")+"</div></div><div class=\"rc\"><div class=\"rc-l\">Utilidad</div><div class=\"rc-v\" style=\"color:"+(util>=0?"var(--s)":"var(--d)")+";font-size:16px\">$"+util.toLocaleString("es-MX")+"</div></div><div class=\"rc\"><div class=\"rc-l\">Reservas / Prom noches</div><div class=\"rc-v\" style=\"font-size:16px\">"+rv.length+" / "+avg+"n</div></div></div></div>";
  }).join("");
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
  t.innerHTML="<thead><tr><th>Fecha</th><th>Huesped</th><th>Depto</th><th>Noches</th><th>Origen</th><th>Pago</th><th>Monto</th></tr></thead><tbody>"+f.map(function(r){var d=depById(r.dep),n=noches(r.entrada+"T12:00:00",r.salida+"T12:00:00"),ps={pendiente:"Pend",parcial:"Anticipo",liquidada:"OK"}[r.pago||"pendiente"];return "<tr><td>"+fmtD(r.entrada)+"</td><td>"+r.huesped+"</td><td>"+(d?"<span style=\"color:"+d.color+"\">"+d.nom+"</span>":r.dep)+"</td><td>"+n+"</td><td>"+(r.origen||"-")+"</td><td>"+ps+"</td><td class=\"amt-i\">$"+r.precio.toLocaleString("es-MX")+"</td></tr>";}).join("")+"<tr style=\"font-weight:600;background:var(--bg2)\"><td colspan=\"6\" style=\"text-align:right;padding:8px\">Total</td><td class=\"amt-i\" style=\"padding:8px\">$"+total.toLocaleString("es-MX")+"</td></tr></tbody>";
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
    return "<div class=\"dep-row\"><div style=\"width:14px;height:14px;border-radius:50%;background:"+dep.color+";flex-shrink:0;margin-top:2px\"></div><div class=\"dep-row-info\"><div style=\"font-size:14px;font-weight:600\">"+dep.nom+"</div><div style=\"font-size:12px;color:var(--text2);margin-top:2px\">"+(dep.dir||"Sin direccion")+" &middot; "+nR+" reserva"+(nR!==1?"s":"")+"</div><div style=\"font-size:11px;color:var(--text3);margin-top:3px\">WiFi: "+(dep.wifi||"-")+" | Pass: "+(dep.wpass||"-")+(dep.telL?" | Llaves: "+dep.telL:"")+(dep.telA?" | Admin: "+dep.telA:"")+"</div><div class=\"ical-row\"><input class=\"ical-inp\" type=\"text\" placeholder=\"Link iCal...\" value=\""+(dep.ical||"")+"\" id=\"ical-"+dep.id+"\" oninput=\"dep.ical=this.value;sv('deps_v6',deps)\"><button class=\"btn btn-g\" style=\"font-size:12px;padding:5px 10px\" onclick=\"syncIcal('"+dep.id+"')\">Sincronizar</button></div><div style=\"font-size:11px;color:var(--text3);margin-top:4px\" id=\"ical-st-"+dep.id+"\">"+(dep.ical?sl:"Sin link iCal")+"</div></div><div style=\"display:flex;gap:5px;flex-shrink:0\"><button class=\"btn btn-i\" onclick=\"abrirDep('"+dep.id+"')\">Edit</button><button class=\"btn btn-del\" onclick=\"pConfirm('Eliminar departamento?','Se eliminaran tambien todas sus reservas.',function(){delDep('"+dep.id+"');})\">Del</button></div></div>";
  }).join("");
}
async function syncIcal(depId){
  var dep=depById(depId);
  var url=dep&&dep.ical?dep.ical:"";
  if(depId==="dep1")url=ICAL_BASE+"albatros16.ics";
  if(depId==="dep2")url=ICAL_BASE+"albatros30.ics";
  if(!url){alert("Sin link iCal");return;}
  var st=document.getElementById("ical-st-"+depId);st.textContent="Sincronizando...";
  try{
    var res=await fetch(url+"?t="+Date.now()),txt=await res.text();
    if(!txt.includes("BEGIN:VCALENDAR"))throw new Error("Link no valido");
    var fechas=parsearIcal(txt);dep.icalF=fechas;dep.icalS=new Date().toISOString();
    sv("deps_v6",deps);st.textContent="OK - "+fechas.length+" dias importados";st.style.color="var(--s)";renderCal();
  }catch(e){st.textContent="Error: "+e.message;st.style.color="var(--d)";}
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
function autoSyncIcals(){deps.forEach(function(dep){if(dep.id==="dep1"||dep.id==="dep2")syncIcal(dep.id);});}

function abrirDep(id){
  editDep=id||null;
  buildColorPicker(id&&depById(id)?depById(id).color:COLORES[deps.length%COLORES.length]);
  limpiarErrs("mo-dep");document.getElementById("mo-dep").classList.add("open");
  if(id){
    var d=depById(id);if(!d)return;
    document.getElementById("dep-tit").textContent="Editar departamento";document.getElementById("dep-btn-txt").textContent="Guardar cambios";
    document.getElementById("d-nom").value=d.nom;document.getElementById("d-num").value=d.num||"";
    document.getElementById("d-dir").value=d.dir||"";document.getElementById("d-ical").value=d.ical||"";
    document.getElementById("d-ubi").value=d.ubi||"";document.getElementById("d-acceso").value=d.acceso||"";
    document.getElementById("d-tel-llaves").value=d.telL||"";document.getElementById("d-tel-admin").value=d.telA||"";
    document.getElementById("d-wifi").value=d.wifi||"";document.getElementById("d-wpass").value=d.wpass||"";
    document.getElementById("d-regl").value=d.regl||"";
  } else {
    document.getElementById("dep-tit").textContent="Nuevo departamento";document.getElementById("dep-btn-txt").textContent="Agregar";
    ["d-nom","d-num","d-dir","d-ical","d-ubi","d-acceso","d-tel-llaves","d-tel-admin","d-wifi","d-wpass","d-regl"].forEach(function(i){document.getElementById(i).value="";});
  }
}
function cerrarDep(){document.getElementById("mo-dep").classList.remove("open");editDep=null;}
function guardarDep(){
  limpiarErrs("mo-dep");
  var nom=document.getElementById("d-nom").value.trim();
  if(!nom){document.getElementById("fg-dep-nom").classList.add("fe");return;}
  var num=document.getElementById("d-num").value.trim(),dir=document.getElementById("d-dir").value.trim();
  var ical=document.getElementById("d-ical").value.trim(),ubi=document.getElementById("d-ubi").value.trim();
  var acceso=document.getElementById("d-acceso").value.trim(),telL=document.getElementById("d-tel-llaves").value.trim();
  var telA=document.getElementById("d-tel-admin").value.trim(),wifi=document.getElementById("d-wifi").value.trim();
  var wpass=document.getElementById("d-wpass").value.trim(),regl=document.getElementById("d-regl").value.trim();
  var idx=COLORES.indexOf(colorSel),colorL=idx>=0?COLORES_L[idx]:"#E6F1FB";
  if(editDep){
    var i=deps.findIndex(function(d){return d.id===editDep;});
    if(i>=0)deps[i]=Object.assign({},deps[i],{nom:nom,num:num,dir:dir,ical:ical,ubi:ubi,acceso:acceso,telL:telL,telA:telA,wifi:wifi,wpass:wpass,regl:regl,color:colorSel,colorL:colorL});
  } else {
    deps.push({id:"dep_"+Date.now(),nom:nom,num:num,dir:dir,ical:ical,ubi:ubi,acceso:acceso,telL:telL,telA:telA,wifi:wifi,wpass:wpass,regl:regl,color:colorSel,colorL:colorL,icalF:[],icalS:null});
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
  var als=[];
  var salHoy=rsvps.filter(function(r){return r.salida===hoy;});
  var llegHoy=rsvps.filter(function(r){return r.entrada===hoy;});
  var llegMan=rsvps.filter(function(r){return r.entrada===manS;});
  var pend=rsvps.filter(function(r){return (r.pago||"pendiente")==="pendiente"&&r.salida>=hoy;});
  limpiarAparts();
  var apExp=aparts.filter(function(a){var h=(a.expira-Date.now())/3600000;return h<6&&h>0;});
  var msgPend=rsvps.filter(function(r){return msgPendiente(r)&&r.salida>=hoy;});
  if(salHoy.length)als.push("<div class=\"al al-hoy\">Check-out hoy: "+salHoy.map(function(r){return r.huesped;}).join(", ")+"</div>");
  if(llegHoy.length)als.push("<div class=\"al al-hoy\">Llegadas hoy: "+llegHoy.map(function(r){return r.huesped;}).join(", ")+"</div>");
  if(llegMan.length)als.push("<div class=\"al al-man\">Llegadas manana: "+llegMan.map(function(r){return r.huesped;}).join(", ")+"</div>");
  if(pend.length)als.push("<div class=\"al al-pago\">"+pend.length+" pago(s) pendiente(s): $"+pend.reduce(function(s,r){return s+r.precio;},0).toLocaleString("es-MX")+" MXN</div>");
  if(apExp.length)als.push("<div class=\"al al-ap\">"+apExp.length+" apartado(s) por vencer: "+apExp.map(function(a){return a.nombre;}).join(", ")+"</div>");
  if(msgPend.length)als.push("<div class=\"al al-man\">"+msgPend.length+" reserva(s) con mensajes pendientes</div>");
  document.getElementById("alertas-wrap").innerHTML=als.join("");
}
function renderStats(){
  var h=new Date(),ms=h.getFullYear()+"-"+String(h.getMonth()+1).padStart(2,"0");
  var iM=rsvps.filter(function(r){return r.entrada.startsWith(ms);}).reduce(function(s,r){return s+r.precio;},0);
  var pend=rsvps.filter(function(r){return (r.pago||"pendiente")==="pendiente"&&r.salida>=fechaHoy();});
  var prox=rsvps.filter(function(r){return r.salida>=fechaHoy();}).length;
  document.getElementById("stats").innerHTML="<div class=\"sc\"><div class=\"sc-l\">Deptos</div><div class=\"sc-v\">"+deps.length+"</div><div class=\"sc-s\">activos</div></div><div class=\"sc\"><div class=\"sc-l\">Proximas llegadas</div><div class=\"sc-v\">"+prox+"</div><div class=\"sc-s\">reservadas</div></div><div class=\"sc\"><div class=\"sc-l\">Ingresos este mes</div><div class=\"sc-v\" style=\"color:var(--s)\">$"+iM.toLocaleString("es-MX")+"</div><div class=\"sc-s\">MXN</div></div><div class=\"sc\"><div class=\"sc-l\">Por cobrar</div><div class=\"sc-v\" style=\""+(pend.length?"color:var(--w)":"")+"\">$"+pend.reduce(function(s,r){return s+r.precio;},0).toLocaleString("es-MX")+"</div><div class=\"sc-s\">"+pend.length+" pendiente"+(pend.length!==1?"s":"")+"</div></div><div class=\"sc\"><div class=\"sc-l\">Apartados activos</div><div class=\"sc-v\" style=\"color:#7c3aed\">"+aparts.length+"</div><div class=\"sc-s\">en espera</div></div>";
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
  }
}
function cerrarRsvp(){document.getElementById("mo-rsvp").classList.remove("open");editRsvp=null;}
function guardarRsvp(){
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
  var msj=editRsvp?(rsvps.find(function(x){return x.id===editRsvp;})||{mensajes:{}}).mensajes||{}:{};
  var obj={huesped:huesped,telefono:tel,correo:correo,dep:dep,personas:parseInt(per),entrada:ent,salida:sal,precio:precioFinal,deposito:parseFloat(deposito)||0,numAirbnb:airbnb,origen:origen,colorReserva:colorR,pago:pago,anticipo:pago==="parcial"?parseFloat(anticipo)||0:0,notas:notas,mensajes:msj};
  if(editRsvp){var i=rsvps.findIndex(function(x){return x.id===editRsvp;});if(i>=0)rsvps[i]=Object.assign({},rsvps[i],obj);}
  else rsvps.push(Object.assign({id:Date.now().toString(),creado:new Date().toISOString()},obj));
  sv("rsvp_v6",rsvps);cerrarRsvp();renderTodo();triggerIcalUpdate();
}

// UTILS
function limpiarErrs(modal){document.getElementById(modal).querySelectorAll(".fe").forEach(function(el){el.classList.remove("fe");});}
function pConfirm(t,txt,cb){confirmCb=cb;document.getElementById("co-tit").textContent=t;document.getElementById("co-txt").textContent=txt;document.getElementById("co").classList.add("open");}
function cerrarConfirm(){document.getElementById("co").classList.remove("open");confirmCb=null;}
function ejecutarConfirm(){if(confirmCb)confirmCb();cerrarConfirm();}
function renderTodo(){renderStats();renderAlertas();renderCal();if(tabAct==="rsvp"){updFilDep();renderRsvp();}if(tabAct==="apart"){limpiarAparts();renderAparts();}if(tabAct==="hist")renderHist();if(tabAct==="fin")renderFin();if(tabAct==="dep")renderDeps();}
async function syncManual(){await cargarSheets();renderTodo();}

// LOGIN
function doLogin(){
  var u=document.getElementById("lu").value.trim(),p=document.getElementById("lp").value.trim();
  var found=usrs.find(function(x){return x.user.toLowerCase()===u.toLowerCase()&&x.pass===p;});
  if(found){sessionStorage.setItem("alb",u);document.getElementById("login-screen").style.display="none";document.getElementById("app").style.display="";document.getElementById("usr-nom").textContent=u;iniciarApp();}
  else{document.getElementById("login-err").style.display="block";}
}
function logout(){sessionStorage.removeItem("alb");document.getElementById("app").style.display="none";document.getElementById("login-screen").style.display="flex";document.getElementById("lu").value="";document.getElementById("lp").value="";document.getElementById("login-err").style.display="none";}
document.getElementById("lp").addEventListener("keydown",function(e){if(e.key==="Enter")doLogin();});
document.getElementById("lu").addEventListener("keydown",function(e){if(e.key==="Enter")document.getElementById("lp").focus();});
document.getElementById("f-ent").addEventListener("change",calcPrecio);
document.getElementById("f-sal").addEventListener("change",calcPrecio);

async function iniciarApp(){
  document.getElementById("fecha-hoy").textContent=new Date().toLocaleDateString("es-MX",{weekday:"long",year:"numeric",month:"long",day:"numeric"});
  await cargarSheets();
  cargarHistoricas();
  limpiarAparts();
  autoSyncIcals();
  renderTodo();
  setInterval(function(){limpiarAparts();renderAlertas();if(tabAct==="apart")renderAparts();},60000);
}

if(sessionStorage.getItem("alb")){
  document.getElementById("login-screen").style.display="none";
  document.getElementById("app").style.display="";
  document.getElementById("usr-nom").textContent=sessionStorage.getItem("alb");
  iniciarApp();
}
