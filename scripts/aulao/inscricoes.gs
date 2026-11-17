// Web app da Neural Hub. A resposta pública contém somente o estado da gravação.
const PLANILHA = '14uxsVX1BUNziDXSgue4GyB3VhuaF5yhv-Ib2vYQyfmg';
const ABA = 'Inscrições da LP';

function resposta(estado, eventoLead) {
  return ContentService.createTextOutput(JSON.stringify({ inscricao: estado, eventoLead: eventoLead || null }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(evento) {
  if (!evento.postData || evento.postData.length > 4096) return resposta('invalida');
  let dados;
  try { dados = JSON.parse(evento.postData.contents); } catch { return resposta('invalida'); }
  if (!dados || typeof dados.nome !== 'string' || typeof dados.email !== 'string' || typeof dados.whatsapp !== 'string') return resposta('invalida');
  const nome = dados.nome.trim();
  const email = dados.email.trim().toLowerCase();
  const whatsapp = dados.whatsapp.replace(/\D/g, '');
  if (nome.length < 2 || nome.length > 100 || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      || !/^\d{10,15}$/.test(whatsapp)) return resposta('invalida');

  const trava = LockService.getScriptLock();
  if (!trava.tryLock(7000)) return resposta('tente_novamente');
  try {
    const planilha = SpreadsheetApp.openById(PLANILHA);
    let aba = planilha.getSheetByName(ABA);
    if (!aba) {
      aba = planilha.insertSheet(ABA, 0);
      aba.getRange('A1:D1').setValues([['Data da inscrição', 'Nome e sobrenome', 'E-mail', 'WhatsApp']]).setFontWeight('bold');
      aba.setFrozenRows(1);
      aba.setColumnWidths(1, 4, 200);
    }
    const ultima = aba.getLastRow();
    const existente = ultima > 1 && aba.getRange(2, 3, ultima - 1).createTextFinder(email)
      .matchCase(false).matchEntireCell(true).useRegularExpression(false).findNext();
    if (!existente) {
      const linha = ultima + 1;
      aba.getRange(linha, 2, 1, 3).setNumberFormat('@');
      aba.getRange(linha, 1, 1, 4).setValues([[new Date(), valorTexto(nome), valorTexto(email), whatsapp]]);
      aba.getRange(linha, 1).setNumberFormat('dd/mm/yyyy hh:mm:ss');
      SpreadsheetApp.flush();
    }
    return resposta('registrada', existente ? null : Utilities.getUuid());
  } finally {
    trava.releaseLock();
  }
}

function valorTexto(valor) {
  return /^[=+\-@]/.test(valor) ? "'" + valor : valor;
}
