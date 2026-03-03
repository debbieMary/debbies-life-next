import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Transaction, Goal, GoalAction, ExchangeRate, WeightEntry, DiaryEntry, PeriodEntry, PeriodCycleLength } from '@/types';
import { format, parseISO, isWithinInterval, startOfDay, endOfDay, addDays } from 'date-fns';
import { es } from 'date-fns/locale';

const PINK       = [201, 132, 154] as [number, number, number];
const PINK_LIGHT = [252, 232, 238] as [number, number, number];
const DARK       = [42, 21, 32]   as [number, number, number];
const GRAY       = [212, 160, 176] as [number, number, number];
const GREEN      = [6, 95, 70]    as [number, number, number];
const RED        = [153, 27, 27]  as [number, number, number];

const fmtUSD = (n: number) =>
  `$ ${n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtBOB = (n: number) =>
  `Bs. ${n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDate = (d: string) =>
  format(parseISO(d), 'dd/MM/yyyy', { locale: es });

const MOOD_LABELS: Record<string, string> = {
  increible: 'Increible', feliz: 'Feliz', normal: 'Normal', triste: 'Triste',
  enojada: 'Enojada', ansiosa: 'Ansiosa', cansada: 'Cansada', enferma: 'Enferma',
};
const MOOD_ORDER = ['increible','feliz','normal','triste','enojada','ansiosa','cansada','enferma'];

export interface ReportPeriod {
  from: string;
  to: string;
  label: string;
}

function sectionTitle(doc: jsPDF, text: string, y: number): number {
  doc.setTextColor(...PINK);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(text, 14, y);
  return y + 8;
}

export function exportReportPDF(
  transactions:  Transaction[],
  goals:         Goal[],
  goalActions:   GoalAction[] = [],
  rates:         ExchangeRate[],
  period:        ReportPeriod,
  weightEntries: WeightEntry[] = [],
  weightTarget:  number | null = null,
  diaryEntries:  DiaryEntry[]  = [],
  periodEntries: PeriodEntry[] = [],
  cycleLengths:  PeriodCycleLength[] = [],
) {
  const from = startOfDay(parseISO(period.from));
  const to   = endOfDay(parseISO(period.to));

  const inPeriod = (dateStr: string) =>
    isWithinInterval(parseISO(dateStr), { start: from, end: to });

  const filteredTx      = transactions.filter((t) => inPeriod(t.date));
  const filteredActions = goalActions.filter((a) => a.action_date && inPeriod(a.action_date));
  const filteredWeight  = [...weightEntries].filter((w) => inPeriod(w.date)).sort((a, b) => a.date.localeCompare(b.date));
  const filteredDiary   = diaryEntries.filter((d) => inPeriod(d.date));

  const sortedRates = [...rates].sort((a, b) => b.date.localeCompare(a.date));
  const rateForPeriod = sortedRates.find((r) => r.date <= period.to)?.rate ?? sortedRates[0]?.rate ?? 1;

  const incomeTx   = filteredTx.filter((t) => t.type === 'ingreso');
  const expensesTx = filteredTx.filter((t) => t.type === 'gasto');

  const incomeBOB   = incomeTx.filter((t) => t.currency === 'BOB').reduce((s, t) => s + t.amount, 0);
  const incomeUSD   = incomeTx.filter((t) => t.currency === 'USD').reduce((s, t) => s + t.amount, 0);
  const expensesBOB = expensesTx.filter((t) => t.currency === 'BOB').reduce((s, t) => s + t.amount, 0);
  const expensesUSD = expensesTx.filter((t) => t.currency === 'USD').reduce((s, t) => s + t.amount, 0);
  const balanceBOB  = incomeBOB - expensesBOB;
  const balanceUSD  = incomeUSD - expensesUSD;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  let y = 0;

  // ── Header ──────────────────────────────────────────────
  doc.setFillColor(...PINK);
  doc.rect(0, 0, W, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text("Debbie's Life Dashboard", 14, 12);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Reporte: ${period.label}`, 14, 20);
  doc.text(`Generado: ${format(new Date(), "dd 'de' MMMM yyyy", { locale: es })}`, W - 14, 20, { align: 'right' });

  y = 36;

  // ── Tipo de cambio ───────────────────────────────────────
  doc.setFillColor(...PINK_LIGHT);
  doc.roundedRect(14, y, W - 28, 12, 2, 2, 'F');
  doc.setTextColor(...DARK);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`Tipo de cambio aplicado: 1 USD = ${rateForPeriod.toFixed(2)} BOB`, 20, y + 7.5);
  y += 20;

  // ── Resumen financiero ───────────────────────────────────
  y = sectionTitle(doc, 'Resumen Financiero', y);

  autoTable(doc, {
    startY: y,
    head: [['Concepto', 'Total en BOB', 'Total en USD']],
    body: [
      ['Ingresos', fmtBOB(incomeBOB),   fmtUSD(incomeUSD)],
      ['Gastos',   fmtBOB(expensesBOB), fmtUSD(expensesUSD)],
      ['Balance',  fmtBOB(balanceBOB),  fmtUSD(balanceUSD)],
    ],
    theme: 'grid',
    headStyles: { fillColor: PINK, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { textColor: DARK, fontSize: 9 },
    alternateRowStyles: { fillColor: [255, 247, 249] },
    columnStyles: { 0: { fontStyle: 'bold' } },
    margin: { left: 14, right: 14 },
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // ── Movimientos del período ──────────────────────────────
  if (filteredTx.length > 0) {
    if (y > 220) { doc.addPage(); y = 20; }
    y = sectionTitle(doc, `Movimientos del período (${filteredTx.length})`, y);

    autoTable(doc, {
      startY: y,
      head: [['Fecha', 'Tipo', 'Descripción', 'Categoría', 'Monto', 'Moneda']],
      body: filteredTx.map((t) => [
        fmtDate(t.date),
        t.type === 'ingreso' ? 'Ingreso' : 'Gasto',
        t.description,
        t.category,
        t.amount.toLocaleString('es-ES', { minimumFractionDigits: 2 }),
        t.currency,
      ]),
      theme: 'grid',
      headStyles: { fillColor: PINK, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { textColor: DARK, fontSize: 8 },
      alternateRowStyles: { fillColor: [255, 247, 249] },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 1) {
          const val = data.cell.raw as string;
          data.cell.styles.textColor = val === 'Ingreso' ? GREEN : RED;
          data.cell.styles.fontStyle = 'bold';
        }
      },
      margin: { left: 14, right: 14 },
    });

    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // ── Acciones de objetivos ────────────────────────────────
  if (y > 220) { doc.addPage(); y = 20; }
  y = sectionTitle(doc, `Acciones de objetivos (${filteredActions.length} en el período)`, y);

  const actionRows = goals
    .map((g) => {
      const acts   = filteredActions.filter((a) => a.goal_id === g.id);
      const buenas = acts.filter((a) => a.type === 'buena').length;
      const malas  = acts.filter((a) => a.type === 'mala').length;
      return { title: g.title, buenas, malas, total: buenas + malas };
    })
    .filter((r) => r.total > 0)
    .sort((a, b) => b.total - a.total);

  if (actionRows.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [['Objetivo', 'Buenas', 'Malas', 'Total']],
      body: actionRows.map((r) => [r.title, String(r.buenas), String(r.malas), String(r.total)]),
      theme: 'grid',
      headStyles: { fillColor: PINK, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { textColor: DARK, fontSize: 9 },
      alternateRowStyles: { fillColor: [255, 247, 249] },
      didParseCell: (data) => {
        if (data.section === 'body') {
          if (data.column.index === 1) data.cell.styles.textColor = GREEN;
          if (data.column.index === 2) data.cell.styles.textColor = RED;
        }
      },
      columnStyles: { 1: { halign: 'center' }, 2: { halign: 'center' }, 3: { halign: 'center' } },
      margin: { left: 14, right: 14 },
    });
    y = (doc as any).lastAutoTable.finalY + 10;
  } else {
    doc.setFontSize(9);
    doc.setTextColor(...GRAY);
    doc.setFont('helvetica', 'normal');
    doc.text('Sin acciones registradas en este período.', 14, y);
    y += 10;
  }

  // ── Estado de ánimo ──────────────────────────────────────
  if (y > 220) { doc.addPage(); y = 20; }
  y = sectionTitle(doc, `Estado de ánimo (${filteredDiary.length} entrada${filteredDiary.length !== 1 ? 's' : ''})`, y);

  const moodRows = MOOD_ORDER
    .map((m) => ({ label: MOOD_LABELS[m], count: filteredDiary.filter((d) => d.mood === m).length }))
    .filter((r) => r.count > 0);

  if (moodRows.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [['Estado', 'Veces']],
      body: moodRows.map((r) => [r.label, String(r.count)]),
      theme: 'grid',
      headStyles: { fillColor: PINK, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { textColor: DARK, fontSize: 9 },
      alternateRowStyles: { fillColor: [255, 247, 249] },
      columnStyles: { 0: { fontStyle: 'bold' }, 1: { halign: 'center' } },
      margin: { left: 14, right: 14 },
    });
    y = (doc as any).lastAutoTable.finalY + 10;
  } else {
    doc.setFontSize(9);
    doc.setTextColor(...GRAY);
    doc.setFont('helvetica', 'normal');
    doc.text('Sin entradas de diario en este período.', 14, y);
    y += 10;
  }

  // ── Tracker de Peso ──────────────────────────────────────
  if (filteredWeight.length > 0) {
    if (y > 220) { doc.addPage(); y = 20; }
    y = sectionTitle(doc, 'Tracker de Peso', y);

    const latest = filteredWeight[filteredWeight.length - 1];
    const first  = filteredWeight[0];
    const diff   = latest.weight - first.weight;

    const weightSummary: [string, string][] = [
      ['Registros en el período', String(filteredWeight.length)],
    ];
    if (weightTarget) weightSummary.push(['Meta', `${weightTarget} kg`]);
    if (filteredWeight.length > 1) weightSummary.push(['Variación total', `${diff > 0 ? '+' : ''}${diff.toFixed(1)} kg`]);

    autoTable(doc, {
      startY: y,
      body: weightSummary,
      theme: 'grid',
      bodyStyles: { textColor: DARK, fontSize: 9 },
      alternateRowStyles: { fillColor: [255, 247, 249] },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 70 } },
      margin: { left: 14, right: 14 },
    });
    y = (doc as any).lastAutoTable.finalY + 6;

    autoTable(doc, {
      startY: y,
      head: [['Fecha', 'Peso (kg)', 'Variación', 'Nota']],
      body: filteredWeight.map((e, i) => {
        const prev  = filteredWeight[i - 1];
        const delta = prev ? e.weight - prev.weight : null;
        return [
          fmtDate(e.date),
          `${e.weight} kg`,
          delta !== null ? `${delta > 0 ? '+' : ''}${delta.toFixed(1)} kg` : '—',
          e.notes || '—',
        ];
      }),
      theme: 'grid',
      headStyles: { fillColor: PINK, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { textColor: DARK, fontSize: 8 },
      alternateRowStyles: { fillColor: [255, 247, 249] },
      columnStyles: {
        0: { cellWidth: 28 },
        1: { cellWidth: 28, halign: 'center' },
        2: { cellWidth: 24, halign: 'center' },
        3: { cellWidth: 'auto', overflow: 'linebreak' },
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 2 && data.cell.raw) {
          const val = String(data.cell.raw);
          if (val.startsWith('-')) data.cell.styles.textColor = GREEN;
          else if (val.startsWith('+')) data.cell.styles.textColor = RED;
        }
      },
      margin: { left: 14, right: 14 },
    });
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // ── Ciclo Menstrual ──────────────────────────────────────
  const sortedCycles  = [...cycleLengths].sort((a, b) => a.recorded_at.localeCompare(b.recorded_at));
  const currentCycle  = sortedCycles[sortedCycles.length - 1];
  const sortedPeriods = [...periodEntries].sort((a, b) => a.start_date.localeCompare(b.start_date));
  const lastPeriod    = sortedPeriods[sortedPeriods.length - 1];
  const filteredPeriods = periodEntries.filter((e) => inPeriod(e.start_date));

  if (currentCycle || periodEntries.length > 0) {
    if (y > 220) { doc.addPage(); y = 20; }
    y = sectionTitle(doc, 'Ciclo Menstrual', y);

    // Resumen del ciclo
    const nextPeriod = lastPeriod && currentCycle
      ? addDays(parseISO(lastPeriod.start_date), currentCycle.cycle_days) : null;
    const ovulDate = lastPeriod && currentCycle
      ? addDays(parseISO(lastPeriod.start_date), currentCycle.cycle_days - 14) : null;

    const summaryRows: [string, string][] = [];
    if (currentCycle) summaryRows.push(['Duración del ciclo', `cada ${currentCycle.cycle_days} días`]);
    if (lastPeriod)   summaryRows.push(['Último período', `${fmtDate(lastPeriod.start_date)} · ${lastPeriod.duration_days} días`]);
    if (nextPeriod)   summaryRows.push(['Próximo período estimado', format(nextPeriod, "d 'de' MMMM yyyy", { locale: es })]);
    if (ovulDate)     summaryRows.push(['Ovulación estimada', format(ovulDate, "d 'de' MMMM yyyy", { locale: es })]);

    if (summaryRows.length > 0) {
      autoTable(doc, {
        startY: y,
        body: summaryRows,
        theme: 'grid',
        bodyStyles: { textColor: DARK, fontSize: 9 },
        alternateRowStyles: { fillColor: [255, 247, 249] },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 70 } },
        margin: { left: 14, right: 14 },
      });
      y = (doc as any).lastAutoTable.finalY + 8;
    }

    // Períodos en el rango
    if (filteredPeriods.length > 0) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...PINK);
      doc.text(`Períodos en el período (${filteredPeriods.length})`, 14, y);
      y += 6;
      autoTable(doc, {
        startY: y,
        head: [['Fecha inicio', 'Duración', 'Notas']],
        body: filteredPeriods.map((e) => [
          fmtDate(e.start_date),
          `${e.duration_days} días`,
          e.notes || '—',
        ]),
        theme: 'grid',
        headStyles: { fillColor: PINK, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
        bodyStyles: { textColor: DARK, fontSize: 9 },
        alternateRowStyles: { fillColor: [255, 247, 249] },
        margin: { left: 14, right: 14 },
      });
      y = (doc as any).lastAutoTable.finalY + 10;
    }
  }

  // ── Footer ───────────────────────────────────────────────
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(...GRAY);
    doc.text(
      `Debbie's Life Dashboard · Pág. ${i} de ${pageCount}`,
      W / 2, doc.internal.pageSize.getHeight() - 8,
      { align: 'center' }
    );
  }

  doc.save(`reporte_${period.from}_${period.to}.pdf`);
}
