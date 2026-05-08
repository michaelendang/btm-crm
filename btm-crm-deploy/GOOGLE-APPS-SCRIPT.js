// ═══════════════════════════════════════════════════════════
// BTM ENERGI NUSANTARA - CRM Backend (Google Apps Script)
// 
// CARA PAKAI:
// 1. Buka Google Sheet yang sudah dibuat
// 2. Klik Extensions > Apps Script
// 3. Hapus semua kode yang ada
// 4. Copy-paste SEMUA kode ini ke editor
// 5. Klik Save (ikon floppy disk)
// 6. Klik Deploy > New Deployment
// 7. Type: Web app
// 8. Execute as: Me
// 9. Who has access: Anyone
// 10. Klik Deploy, copy URL yang muncul
// ═══════════════════════════════════════════════════════════

const SHEET_NAME = "BTM_CRM_Data";
const DATA_CELL  = "A1";

function doGet(e) {
  try {
    const sheet = getOrCreateSheet();
    const raw   = sheet.getRange(DATA_CELL).getValue();
    const data  = raw ? JSON.parse(raw) : { deals: [], targets: {} };
    return buildResponse(data);
  } catch (err) {
    return buildResponse({ error: err.message });
  }
}

function doPost(e) {
  try {
    const sheet = getOrCreateSheet();
    const data  = JSON.parse(e.postData.contents);
    sheet.getRange(DATA_CELL).setValue(JSON.stringify(data));
    // Also write human-readable summary to column C for easy viewing
    writeSummary(sheet, data.deals || []);
    return buildResponse({ success: true, count: (data.deals || []).length });
  } catch (err) {
    return buildResponse({ error: err.message });
  }
}

function getOrCreateSheet() {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  let   sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    // Write headers for the summary columns
    sheet.getRange("C1:H1").setValues([["Company", "Sales", "Stage", "Value (IDR)", "Priority", "Next Action"]]);
    sheet.getRange("C1:H1").setFontWeight("bold");
    sheet.setColumnWidth(1, 400); // Wide column A for JSON data
  }
  return sheet;
}

function writeSummary(sheet, deals) {
  // Clear old summary
  const lastRow = Math.max(sheet.getLastRow(), 2);
  if (lastRow > 1) sheet.getRange(2, 3, lastRow, 6).clearContent();
  // Write new summary starting row 2
  if (deals.length === 0) return;
  const rows = deals.map(d => [
    d.company || "",
    d.assignedTo || "",
    d.stage || "",
    Number(d.value) || 0,
    d.priority || "",
    d.nextAction || ""
  ]);
  sheet.getRange(2, 3, rows.length, 6).setValues(rows);
}

function buildResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
