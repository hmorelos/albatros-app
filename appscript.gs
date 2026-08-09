const SHEET_ID = '1xW0rkVQSJZ7H5mPHJ3_oC03CDrQ8haO4FEAgWvSPhBc';
const TABS = ['reservas','egresos','apartados','departamentos','usuarios','templates','config'];
const RES_TAB = 'reservas';
const META_CHUNK_KEY = 'alb_chunk_state_v1';

function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || 'getAll';
  const tab = e && e.parameter ? e.parameter.tab : '';
  try {
    if (action === 'get' && tab) return respond(getData(tab));
    return respond(getAllData());
  } catch (err) {
    return respond({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
    const raw = e && e.postData && e.postData.contents ? e.postData.contents : '{}';
    const body = JSON.parse(raw);

    if (body && body.action) {
      if (body.action === 'replaceRowsStart') {
        return respond(replaceRowsStart(body));
      }
      if (body.action === 'replaceRowsChunk') {
        return respond(replaceRowsChunk(body));
      }
      if (body.action === 'replaceRowsCommit') {
        return respond(replaceRowsCommit(body));
      }
      return respond({ ok: false, error: 'Accion no soportada' });
    }

    const tab = body ? body.tab : '';
    const data = body ? body.data : undefined;
    if (!tab || data === undefined) return respond({ ok: false, error: 'Faltan parametros' });
    assertTabAllowed(tab);
    setData(tab, data);
    return respond({ ok: true, tab: tab });
  } catch (err) {
    return respond({ ok: false, error: String(err && err.message ? err.message : err) });
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}

function respond(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function assertTabAllowed(tab) {
  if (TABS.indexOf(tab) === -1) throw new Error('Tab invalida: ' + tab);
}

function getSheet(tab) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(tab);
  if (!sheet) {
    sheet = ss.insertSheet(tab);
    sheet.getRange(1, 1).setValue('data');
  }
  if (sheet.getLastRow() < 1) sheet.getRange(1, 1).setValue('data');
  return sheet;
}

function clearDataRows(sheet) {
  const last = sheet.getLastRow();
  if (last >= 2) sheet.getRange(2, 1, last - 1, 1).clearContent();
}

function parseCellJSON(val) {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val !== 'string') val = String(val);
  return JSON.parse(val);
}

function readReservasRows() {
  const sheet = getSheet(RES_TAB);
  const last = sheet.getLastRow();
  if (last < 2) return [];

  const vals = sheet.getRange(2, 1, last - 1, 1).getValues().map(function (r) { return r[0]; });
  const nonEmpty = vals.filter(function (v) { return v !== '' && v !== null && v !== undefined; });
  if (!nonEmpty.length) return [];

  if (nonEmpty.length === 1) {
    try {
      const legacy = parseCellJSON(nonEmpty[0]);
      if (Array.isArray(legacy)) return legacy;
      if (legacy && typeof legacy === 'object') return [legacy];
    } catch (_) {}
  }

  const out = [];
  for (var i = 0; i < nonEmpty.length; i++) {
    try {
      const rowObj = parseCellJSON(nonEmpty[i]);
      if (Array.isArray(rowObj)) {
        rowObj.forEach(function (item) {
          if (item && typeof item === 'object' && !Array.isArray(item)) out.push(item);
        });
      } else if (rowObj && typeof rowObj === 'object') {
        out.push(rowObj);
      }
    } catch (_) {}
  }
  return out;
}

function writeReservasRows(rows) {
  const sheet = getSheet(RES_TAB);
  clearDataRows(sheet);
  if (!Array.isArray(rows) || !rows.length) {
    SpreadsheetApp.flush();
    return;
  }
  const data = rows.map(function (r) { return [JSON.stringify(r)]; });
  sheet.getRange(2, 1, data.length, 1).setValues(data);
  SpreadsheetApp.flush();
}

function getData(tab) {
  assertTabAllowed(tab);
  if (tab === RES_TAB) return { tab: tab, data: readReservasRows() };

  const sheet = getSheet(tab);
  const val = sheet.getLastRow() >= 2 ? sheet.getRange(2, 1).getValue() : '';
  if (!val) return { tab: tab, data: [] };
  try {
    return { tab: tab, data: parseCellJSON(val) };
  } catch (_) {
    return { tab: tab, data: [] };
  }
}

function getAllData() {
  const result = {};
  TABS.forEach(function (tab) {
    try {
      if (tab === RES_TAB) {
        result[tab] = readReservasRows();
      } else {
        const sheet = getSheet(tab);
        const val = sheet.getLastRow() >= 2 ? sheet.getRange(2, 1).getValue() : '';
        result[tab] = val ? parseCellJSON(val) : [];
      }
    } catch (_) {
      result[tab] = [];
    }
  });
  return result;
}

function setData(tab, data) {
  assertTabAllowed(tab);
  if (tab === RES_TAB && Array.isArray(data)) {
    writeReservasRows(data);
    return { ok: true, tab: tab, mode: 'rows', count: data.length };
  }

  const sheet = getSheet(tab);
  const str = JSON.stringify(data);
  if (sheet.getLastRow() < 2) sheet.getRange(2, 1).setValue(str);
  else sheet.getRange(2, 1).setValue(str);
  SpreadsheetApp.flush();
  return { ok: true, tab: tab, mode: 'single-cell' };
}

function getChunkState() {
  const raw = PropertiesService.getScriptProperties().getProperty(META_CHUNK_KEY);
  if (!raw) return null;
  return JSON.parse(raw);
}

function setChunkState(state) {
  PropertiesService.getScriptProperties().setProperty(META_CHUNK_KEY, JSON.stringify(state));
}

function clearChunkState() {
  PropertiesService.getScriptProperties().deleteProperty(META_CHUNK_KEY);
}

function replaceRowsStart(body) {
  const tab = body.tab;
  assertTabAllowed(tab);
  if (tab !== RES_TAB) throw new Error('replaceRows solo soporta reservas');

  const sheet = getSheet(tab);
  clearDataRows(sheet);
  const totalRows = Number(body.totalRows || 0);
  const totalChunks = Number(body.totalChunks || 0);

  setChunkState({
    tab: tab,
    totalRows: totalRows,
    totalChunks: totalChunks,
    receivedChunks: 0,
    receivedRows: 0,
    startedAt: Date.now()
  });

  SpreadsheetApp.flush();
  return { ok: true, action: 'replaceRowsStart', tab: tab, totalRows: totalRows, totalChunks: totalChunks };
}

function replaceRowsChunk(body) {
  const tab = body.tab;
  assertTabAllowed(tab);
  if (tab !== RES_TAB) throw new Error('replaceRows solo soporta reservas');

  const state = getChunkState();
  if (!state) throw new Error('No hay sesion de reemplazo activa');
  if (state.tab !== tab) throw new Error('Tab no coincide con sesion activa');

  const chunkIndex = Number(body.chunkIndex || 0);
  const totalChunks = Number(body.totalChunks || 0);
  if (state.totalChunks && totalChunks && state.totalChunks !== totalChunks) throw new Error('totalChunks inconsistente');
  if (chunkIndex !== state.receivedChunks + 1) throw new Error('Orden de chunk invalido');

  const rows = Array.isArray(body.rows) ? body.rows : [];
  const sheet = getSheet(tab);
  if (rows.length) {
    const data = rows.map(function (r) { return [JSON.stringify(r)]; });
    const startRow = Math.max(2, sheet.getLastRow() + 1);
    sheet.getRange(startRow, 1, data.length, 1).setValues(data);
  }

  state.receivedChunks += 1;
  state.receivedRows += rows.length;
  setChunkState(state);
  SpreadsheetApp.flush();

  return {
    ok: true,
    action: 'replaceRowsChunk',
    chunkIndex: chunkIndex,
    totalChunks: state.totalChunks,
    receivedRows: state.receivedRows
  };
}

function replaceRowsCommit(body) {
  const tab = body.tab;
  assertTabAllowed(tab);
  if (tab !== RES_TAB) throw new Error('replaceRows solo soporta reservas');

  const state = getChunkState();
  if (!state) throw new Error('No hay sesion de reemplazo activa');
  if (state.tab !== tab) throw new Error('Tab no coincide con sesion activa');

  const expectedChunks = Number(body.totalChunks || state.totalChunks || 0);
  const expectedRows = Number(body.totalRows || state.totalRows || 0);

  if (expectedChunks && state.receivedChunks !== expectedChunks) {
    throw new Error('Faltan chunks por recibir');
  }
  if (expectedRows && state.receivedRows !== expectedRows) {
    throw new Error('Conteo de filas inconsistente');
  }

  clearChunkState();
  SpreadsheetApp.flush();

  return {
    ok: true,
    action: 'replaceRowsCommit',
    tab: tab,
    receivedChunks: state.receivedChunks,
    receivedRows: state.receivedRows
  };
}
