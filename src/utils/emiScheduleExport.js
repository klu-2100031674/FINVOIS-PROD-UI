import finvoisLogoUrl from '../assets/finvois.png';
import { formatInr, getFrequencyLabel } from './emiCalculator';
import { buildFinancialYearSummary } from './emiSchedulePeriods';

const GREY_HEADER_FONT = 'FF4B5563';
const GREY_HEADER_FILL = 'FFF3F4F6';
const GREEN_HEADER_FILL = 'FFD9EAD3';
const BORDER_GREY = 'FFE5E7EB';

function roundAmount(n) {
  return Math.round(Number(n) || 0);
}

async function ensureBufferPolyfill() {
  if (typeof globalThis.Buffer !== 'undefined') return;
  const { Buffer } = await import('buffer');
  globalThis.Buffer = Buffer;
}

async function getExcelJS() {
  await ensureBufferPolyfill();
  const mod = await import('exceljs');
  return mod.default ?? mod;
}

const FINVOIS_LOGO_ASPECT = 4.2;
const COL_WIDTH_PX = 7;
const LOGO_SIZE_SCALE = 0.6;

async function loadFinvoisLogo() {
  try {
    const response = await fetch(finvoisLogoUrl);
    if (!response.ok) return null;
    const blob = await response.blob();
    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = String(reader.result || '');
        resolve(result.includes(',') ? result.split(',')[1] : result);
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
    if (!base64) return null;

    const dimensions = await new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({
          width: img.naturalWidth || 420,
          height: img.naturalHeight || 100,
        });
      };
      img.onerror = () => resolve({ width: 420, height: 100 });
      img.src = finvoisLogoUrl;
    });

    return { base64, ...dimensions };
  } catch {
    return null;
  }
}

function sheetContentWidthPx(columns) {
  return columns.reduce((sum, col) => sum + (col.width || 10) * COL_WIDTH_PX, 0);
}

function placeCenteredLogo(sheet, imageId, colCount, naturalWidth, naturalHeight) {
  const aspect =
    naturalWidth > 0 && naturalHeight > 0
      ? naturalWidth / naturalHeight
      : FINVOIS_LOGO_ASPECT;

  const contentWidth = sheetContentWidthPx(sheet.columns);
  const baseLogoWidth = Math.min(Math.max(contentWidth * 0.72, 200), 380);
  const logoWidth = baseLogoWidth * LOGO_SIZE_SCALE;
  const logoHeight = logoWidth / aspect;

  const startPx = Math.max(0, (contentWidth - logoWidth) / 2);
  let accumulated = 0;
  let tlCol = 0;
  let colOffset = 0;

  for (let i = 0; i < colCount; i += 1) {
    const colPx = (sheet.getColumn(i + 1).width || 10) * COL_WIDTH_PX;
    if (accumulated + colPx > startPx) {
      tlCol = i;
      colOffset = (startPx - accumulated) / colPx;
      break;
    }
    accumulated += colPx;
  }

  sheet.addImage(imageId, {
    tl: { col: tlCol + colOffset, row: 0.15 },
    ext: { width: logoWidth, height: logoHeight },
  });

  const logoRowCount = 4;
  const rowHeightPt = Math.max(16, logoHeight / 1.33 / logoRowCount);
  for (let r = 1; r <= logoRowCount; r += 1) {
    sheet.getRow(r).height = rowHeightPt;
  }

  return logoRowCount;
}

function downloadBuffer(buffer, filename) {
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function colLetter(col) {
  let letter = '';
  let n = col;
  while (n > 0) {
    const rem = (n - 1) % 26;
    letter = String.fromCharCode(65 + rem) + letter;
    n = Math.floor((n - 1) / 26);
  }
  return letter;
}

function styleHeaderRow(row, colCount, { green = false } = {}) {
  row.height = 26;
  for (let c = 1; c <= colCount; c += 1) {
    const cell = row.getCell(c);
    cell.font = { bold: true, size: 11, color: { argb: green ? 'FF1F2937' : GREY_HEADER_FONT } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: green ? GREEN_HEADER_FILL : GREY_HEADER_FILL },
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: BORDER_GREY } },
      left: { style: 'thin', color: { argb: BORDER_GREY } },
      bottom: { style: 'thin', color: { argb: BORDER_GREY } },
      right: { style: 'thin', color: { argb: BORDER_GREY } },
    };
  }
}

function styleDataRow(row, colCount, { inrFormat = true } = {}) {
  row.height = 20;
  for (let c = 1; c <= colCount; c += 1) {
    const cell = row.getCell(c);
    cell.alignment = {
      vertical: 'middle',
      horizontal: c === 1 ? 'center' : c === 2 ? 'left' : 'right',
    };
    cell.border = {
      left: { style: 'thin', color: { argb: BORDER_GREY } },
      right: { style: 'thin', color: { argb: BORDER_GREY } },
      bottom: { style: 'thin', color: { argb: BORDER_GREY } },
    };
    if (inrFormat && c > 2 && typeof cell.value === 'number') {
      cell.numFmt = '#,##0';
    }
  }
}

function writeTableSection(sheet, startRow, headers, dataRows, { greenHeader = false } = {}) {
  const colCount = headers.length;
  let rowIndex = startRow;

  const headerRow = sheet.getRow(rowIndex);
  headers.forEach((header, i) => {
    headerRow.getCell(i + 1).value = header;
  });
  styleHeaderRow(headerRow, colCount, { green: greenHeader });
  rowIndex += 1;

  dataRows.forEach((values) => {
    const row = sheet.getRow(rowIndex);
    values.forEach((val, i) => {
      row.getCell(i + 1).value = val;
    });
    styleDataRow(row, colCount);
    rowIndex += 1;
  });

  return rowIndex;
}

/**
 * Build and download .xlsx with amortization schedule + financial-year summary.
 */
export async function downloadEmiScheduleExcel({
  enrichedRows,
  loanAmount,
  interestRate,
  tenureYears,
  interestFrequency,
  periodsPerYear,
  totalInstallments,
  moratoriumMonths,
  moratoriumPeriods,
  emi,
  totalInterest,
  totalAmount,
  installmentLabel = 'Installment',
  calculationMode,
  loanStartDate,
  interestPerPeriod,
  fixedPrincipalPerPeriod,
}) {
  const scheduleHeaders = [
    'Period',
    'Month / Quarter / Half-Year',
    'Opening Balance',
    'Interest',
    'Principal',
    'EMI',
    'Closing Balance',
    'Financial Year',
  ];

  const scheduleData = enrichedRows.map((r) => [
    r.period,
    r.periodRange,
    roundAmount(r.openingBalance),
    roundAmount(r.interest),
    roundAmount(r.principal),
    roundAmount(r.installment ?? r.emi),
    roundAmount(r.closingBalance),
    r.financialYear,
  ]);

  const fySummary = buildFinancialYearSummary(enrichedRows);
  const fyHeaders = [
    'Financial Year',
    'Outstanding as on 31st March',
    'Interest',
    'Principal Repaid',
    'Short Term Loan Outstanding',
  ];
  const fyData = fySummary.map((fy) => [
    fy.financialYear,
    fy.outstandingOn31March,
    fy.interest,
    fy.principalRepaid,
    fy.shortTermLoanOutstanding,
  ]);

  const colCount = scheduleHeaders.length;
  const lastCol = colLetter(colCount);

  const ExcelJS = await getExcelJS();
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Finvois';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Loan Schedule', {
    views: [{ showGridLines: true }],
  });

  sheet.columns = [
    { width: 8 },
    { width: 22 },
    { width: 18 },
    { width: 14 },
    { width: 14 },
    { width: 14 },
    { width: 18 },
    { width: 14 },
  ];

  let summaryStartRow = 5;
  const logoMeta = await loadFinvoisLogo();
  if (logoMeta?.base64) {
    try {
      const imageId = workbook.addImage({
        base64: logoMeta.base64,
        extension: 'png',
      });
      const logoRows = placeCenteredLogo(
        sheet,
        imageId,
        colCount,
        logoMeta.width,
        logoMeta.height,
      );
      summaryStartRow = logoRows + 2;
    } catch {
      /* continue without logo */
    }
  }

  let rowIndex = summaryStartRow;
  const freqLabel =
    interestFrequency != null ? getFrequencyLabel(interestFrequency) : '—';
  const modeLabel =
    calculationMode === 'flat_interest' ? 'Flat interest rate' : 'Reducing interest rate';

  const summaryLines = [
    'EMI Calculator - Loan Repayment Schedule',
    `Calculation: ${modeLabel} | Loan start: ${loanStartDate || '—'}`,
    `Loan amount: ${formatInr(loanAmount)} | Interest rate: ${interestRate}% p.a. | Tenure: ${tenureYears} years`,
    `Interest frequency: ${freqLabel} | Periods per year: ${periodsPerYear ?? '—'} | Total installments: ${totalInstallments ?? '—'}`,
    `Interest per period: ${formatInr(interestPerPeriod)} | Fixed principal/period: ${formatInr(fixedPrincipalPerPeriod)} | ${installmentLabel}: ${formatInr(emi)}`,
    `Moratorium: ${moratoriumMonths ?? 0} months (${moratoriumPeriods ?? 0} installments) | Total interest: ${formatInr(totalInterest)} | Total payable: ${formatInr(totalAmount)}`,
  ];

  summaryLines.forEach((text, i) => {
    const row = sheet.getRow(rowIndex);
    row.height = i === 0 ? 24 : 20;
    const cell = row.getCell(1);
    cell.value = text;
    cell.font =
      i === 0
        ? { bold: true, size: 13, color: { argb: 'FF111827' } }
        : { size: 11, color: { argb: 'FF374151' } };
    cell.alignment = { vertical: 'middle', horizontal: 'left' };
    sheet.mergeCells(`A${rowIndex}:${lastCol}${rowIndex}`);
    rowIndex += 1;
  });

  rowIndex += 1;
  rowIndex = writeTableSection(sheet, rowIndex, scheduleHeaders, scheduleData, {
    greenHeader: true,
  });

  rowIndex += 2;
  const fyTitleRow = sheet.getRow(rowIndex);
  fyTitleRow.getCell(1).value = 'Financial Year Summary';
  fyTitleRow.getCell(1).font = { bold: true, size: 12, color: { argb: 'FF111827' } };
  sheet.mergeCells(`A${rowIndex}:${colLetter(fyHeaders.length)}${rowIndex}`);
  rowIndex += 1;

  writeTableSection(sheet, rowIndex, fyHeaders, fyData, { greenHeader: true });

  const filename = `emi-schedule-${interestFrequency || 'loan'}-${new Date().toISOString().slice(0, 10)}.xlsx`;
  const buffer = await workbook.xlsx.writeBuffer();
  downloadBuffer(buffer, filename);
}
