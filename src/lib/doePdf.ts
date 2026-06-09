import { jsPDF } from 'jspdf';
import type { DoeStudy } from '../types/doe';
import { getDoeTemplate } from '../data/doeTemplate';
import type { DoeReport, ReportSection } from './mockDoeAi';

// ---------------------------------------------------------------------------
// Client-side PDF export for the DoE report. Lays out the report text with
// jsPDF and embeds the already-rendered Recharts SVGs as PNG images
// (Strategy A: serialize <svg> → off-screen canvas → PNG data URL).
// ---------------------------------------------------------------------------

export interface ChartImage {
  title: string;
  /** PNG data URL produced by svgElementToPng. */
  dataUrl: string;
  /** Natural pixel width of the rasterized chart. */
  width: number;
  /** Natural pixel height of the rasterized chart. */
  height: number;
}

/**
 * Rasterize a rendered Recharts <svg> element to a PNG data URL.
 * Returns null if the SVG has no measurable size (e.g. not yet laid out).
 */
export async function svgElementToPng(
  svg: SVGSVGElement,
  scale = 2,
): Promise<{ dataUrl: string; width: number; height: number } | null> {
  const rect = svg.getBoundingClientRect();
  const width = svg.width.baseVal.value || rect.width;
  const height = svg.height.baseVal.value || rect.height;
  if (!width || !height) return null;

  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('width', String(width));
  clone.setAttribute('height', String(height));

  const xml = new XMLSerializer().serializeToString(clone);
  const svgDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`;

  const img = new Image();
  img.crossOrigin = 'anonymous';
  const loaded = new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Failed to rasterize chart SVG'));
  });
  img.src = svgDataUrl;
  await loaded;

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  return { dataUrl: canvas.toDataURL('image/png'), width: canvas.width, height: canvas.height };
}

/** Collect chart images from the given wrapper elements (skips missing/empty). */
export async function collectChartImages(
  charts: { title: string; el: HTMLElement | null }[],
): Promise<ChartImage[]> {
  const out: ChartImage[] = [];
  for (const c of charts) {
    if (!c.el) continue;
    const svg = c.el.querySelector('svg');
    if (!svg) continue;
    const png = await svgElementToPng(svg as SVGSVGElement);
    if (png) out.push({ title: c.title, dataUrl: png.dataUrl, width: png.width, height: png.height });
  }
  return out;
}

export function buildReportPdf(study: DoeStudy, report: DoeReport, charts: ChartImage[]): jsPDF {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 48;
  const contentW = pageW - margin * 2;
  let y = margin;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageH - margin) {
      doc.addPage();
      y = margin;
    }
  };

  const writeLines = (text: string, fontSize: number, fontStyle: 'normal' | 'bold' = 'normal', color = '#111111') => {
    doc.setFont('helvetica', fontStyle);
    doc.setFontSize(fontSize);
    doc.setTextColor(color);
    const lineH = fontSize * 1.4;
    const lines = doc.splitTextToSize(text, contentW);
    for (const line of lines) {
      ensureSpace(lineH);
      doc.text(line, margin, y);
      y += lineH;
    }
  };

  // --- Title -------------------------------------------------------------
  writeLines(`DoE Report — ${study.id}`, 20, 'bold');
  y += 4;
  writeLines(study.product, 13, 'bold');
  writeLines(`${study.project} · ${study.date} · ${study.designControlRef}`, 10, 'normal', '#555555');
  y += 6;

  // --- Disclaimer banner -------------------------------------------------
  writeLines(
    'AI-generated draft — requires scientist review and approval. All data is synthetic / sample data for demonstration only.',
    10,
    'bold',
    '#8a6d00',
  );
  y += 8;

  // --- Study metadata ----------------------------------------------------
  writeLines('Study overview', 13, 'bold');
  y += 2;
  const meta: [string, string][] = [
    ['Objective', study.objective],
    ['Hypothesis', study.hypothesis],
    ['Design', study.designType],
  ];
  for (const [label, value] of meta) {
    writeLines(label, 10, 'bold', '#555555');
    writeLines(value, 10, 'normal');
    y += 2;
  }
  writeLines('Factors', 10, 'bold', '#555555');
  for (const f of study.factors) {
    writeLines(`${f.id}  ${f.name}: ${f.low}–${f.high} ${f.unit}`, 10, 'normal');
  }
  y += 10;

  // --- Charts ------------------------------------------------------------
  if (charts.length) {
    writeLines('Effect charts', 13, 'bold');
    y += 4;
    for (const chart of charts) {
      const drawW = Math.min(contentW, chart.width);
      const drawH = (chart.height / chart.width) * drawW;
      ensureSpace(drawH + 18);
      writeLines(chart.title, 10, 'bold', '#555555');
      y += 2;
      doc.addImage(chart.dataUrl, 'PNG', margin, y, drawW, drawH);
      y += drawH + 12;
    }
  }

  // --- Report sections (in template order, using edited text) ------------
  const template = getDoeTemplate();
  const ordered = template
    .map((t) => report.sections.find((s) => s.id === t.id))
    .filter((s): s is ReportSection => !!s);

  ensureSpace(40);
  writeLines('Report', 13, 'bold');
  y += 4;
  ordered.forEach((s, i) => {
    writeLines(`${i + 1}. ${s.title}`, 12, 'bold');
    y += 2;
    writeLines(s.markdown, 10, 'normal');
    y += 8;
  });

  // --- Fact-check log ----------------------------------------------------
  const flagged = report.claims.filter((c) => c.status === 'flagged');
  ensureSpace(30);
  writeLines('Grounding / fact-check log', 13, 'bold');
  y += 4;
  for (const c of report.claims) {
    const tag = c.status === 'verified' ? 'VERIFIED' : 'FLAGGED→CORRECTED';
    writeLines(
      `[${tag}] ${c.metric}: claimed ${c.claimedValue}${c.unit ? ' ' + c.unit : ''}, ` +
        `computed ${c.computedValue}${c.unit ? ' ' + c.unit : ''} (${c.source}).`,
      10,
      'normal',
    );
  }
  if (flagged.length) {
    y += 4;
    writeLines(
      `${flagged.length} claim(s) were auto-corrected to match the computed statistics before approval.`,
      10,
      'normal',
      '#555555',
    );
  }

  return doc;
}
