// Chuyen bo tep Markdown cua bao cao PRJ1 sang mot tep .docx hoan chinh
const fs = require('fs');
const path = require('path');
const D = require('/Users/nthieuu/.local/lib/node_modules/docx');
const {
  Document, Packer, Paragraph, TextRun, ImageRun, Table, TableRow, TableCell,
  WidthType, HeadingLevel, AlignmentType, PageBreak, BorderStyle, ShadingType,
  LevelFormat, TableOfContents, StyleLevel, Footer, PageNumber, ExternalHyperlink,
  VerticalAlign, TabStopType, TabStopPosition, convertMillimetersToTwip
} = D;

const DOCDIR = '/Users/nthieuu/Documents/Codex/Code/PRJ1/Doc';
const FONT = 'Times New Roman';
const SZ = 26;              // 13pt (half-points)
const CONTENT_TWIP = 9071;  // A4, le trai 3cm, le phai 2cm
const MAX_IMG_W = 600;      // px @96dpi
const MAX_IMG_H = 780;

/* ---------------- doc kich thuoc PNG ---------------- */
function pngSize(file) {
  const b = fs.readFileSync(file);
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}

/* ---------------- phan tich inline ---------------- */
function inline(text, base = {}) {
  const runs = [];
  const re = /(\*\*([^*]+)\*\*)|(`([^`]+)`)|(\*([^*]+)\*)|(\[([^\]]+)\]\(([^)]+)\))/g;
  let last = 0, m;
  const push = (t, o) => { if (t) runs.push(new TextRun(Object.assign({ text: t, font: FONT, size: SZ }, base, o))); };
  while ((m = re.exec(text)) !== null) {
    push(text.slice(last, m.index), {});
    if (m[2] !== undefined) push(m[2], { bold: true });
    else if (m[4] !== undefined) push(m[4], { font: 'Consolas', size: SZ - 3 });
    else if (m[6] !== undefined) push(m[6], { italics: true });
    else if (m[8] !== undefined) {
      runs.push(new ExternalHyperlink({
        link: m[9],
        children: [new TextRun({ text: m[8], font: FONT, size: SZ, style: 'Hyperlink' })]
      }));
    }
    last = re.lastIndex;
  }
  push(text.slice(last), {});
  return runs.length ? runs : [new TextRun({ text: '', font: FONT, size: SZ })];
}

/* ---------------- tach khoi ---------------- */
function parseBlocks(lines) {
  const blocks = [];
  let i = 0;
  const isTableSep = s => /^\|[\s:|-]+\|$/.test(s.trim()) && s.includes('-');
  while (i < lines.length) {
    const raw = lines[i], line = raw.trim();
    if (line === '') { i++; continue; }

    if (/^```/.test(line)) {                                  // khoi ma
      const buf = []; i++;
      while (i < lines.length && !/^```/.test(lines[i].trim())) buf.push(lines[i++]);
      i++; blocks.push({ t: 'code', lines: buf }); continue;
    }
    if (/^(---|___|\*\*\*)$/.test(line)) { blocks.push({ t: 'hr' }); i++; continue; }

    let m = line.match(/^(#{1,6})\s+(.*)$/);
    if (m) { blocks.push({ t: 'h', lv: m[1].length, s: m[2] }); i++; continue; }

    m = line.match(/^!\[([^\]]*)\]\(([^)]+)\)\s*$/);
    if (m) { blocks.push({ t: 'img', alt: m[1], src: m[2] }); i++; continue; }

    if (line.startsWith('>')) {                                // trich dan
      const buf = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        buf.push(lines[i].trim().replace(/^>\s?/, '')); i++;
      }
      blocks.push({ t: 'quote', blocks: parseBlocks(buf) }); continue;
    }

    if (line.startsWith('|') && i + 1 < lines.length && isTableSep(lines[i + 1])) {
      const head = line, rows = [];
      i += 2;
      while (i < lines.length && lines[i].trim().startsWith('|')) rows.push(lines[i++].trim());
      blocks.push({ t: 'table', head, rows }); continue;
    }

    if (/^[-*+]\s+/.test(line) || /^\d+[.)]\s+/.test(line)) {   // danh sach
      const ordered = /^\d+[.)]\s+/.test(line);
      const items = [];
      while (i < lines.length) {
        const cur = lines[i];
        if (cur.trim() === '') {
          if (i + 1 < lines.length && /^\s*([-*+]|\d+[.)])\s+/.test(lines[i + 1])) { i++; continue; }
          break;
        }
        const mm = cur.match(/^(\s*)([-*+]|\d+[.)])\s+(.*)$/);
        if (!mm) {
          if (items.length) { items[items.length - 1].s += ' ' + cur.trim(); i++; continue; }
          break;
        }
        items.push({ lv: Math.min(2, Math.floor(mm[1].length / 2)), s: mm[3] });
        i++;
      }
      blocks.push({ t: ordered ? 'ol' : 'ul', items }); continue;
    }

    const buf = [];                                            // doan van
    while (i < lines.length && lines[i].trim() !== ''
           && !/^(#{1,6}\s|>|\||!\[|```|---$)/.test(lines[i].trim())
           && !/^([-*+]|\d+[.)])\s+/.test(lines[i].trim())) buf.push(lines[i++].trim());
    if (buf.length) blocks.push({ t: 'p', s: buf.join(' ') });
    else i++;
  }
  return blocks;
}

/* ---------------- dung bang ---------------- */
function splitRow(s) {
  let t = s.trim();
  if (t.startsWith('|')) t = t.slice(1);
  if (t.endsWith('|')) t = t.slice(0, -1);
  return t.split('|').map(c => c.trim());
}
function cellParas(txt, bold) {
  return txt.split(/<br\s*\/?>/i).map(seg =>
    new Paragraph({
      children: inline(seg.trim(), bold ? { bold: true } : {}),
      spacing: { before: 20, after: 20, line: 240 },
      alignment: AlignmentType.LEFT
    }));
}
function buildTable(b) {
  const head = splitRow(b.head);
  const body = b.rows.map(splitRow);
  const n = head.length;
  const wmax = new Array(n).fill(0);
  [head, ...body].forEach(r => r.forEach((c, k) => { if (k < n) wmax[k] = Math.max(wmax[k], Math.min(c.length, 70)); }));
  const sum = wmax.reduce((a, x) => a + x, 0) || n;
  let widths = wmax.map(x => Math.max(700, Math.round(CONTENT_TWIP * x / sum)));
  const tot = widths.reduce((a, x) => a + x, 0);
  widths = widths.map(x => Math.round(x * CONTENT_TWIP / tot));
  widths[n - 1] += CONTENT_TWIP - widths.reduce((a, x) => a + x, 0);

  const mkRow = (cells, isHead) => new TableRow({
    tableHeader: isHead,
    children: Array.from({ length: n }, (_, k) => new TableCell({
      width: { size: widths[k], type: WidthType.DXA },
      shading: isHead ? { type: ShadingType.CLEAR, fill: 'D9E2F3' } : undefined,
      verticalAlign: VerticalAlign.CENTER,
      margins: { top: 40, bottom: 40, left: 80, right: 80 },
      children: cellParas(cells[k] === undefined ? '' : cells[k], isHead)
    }))
  });
  return new Table({
    columnWidths: widths,
    width: { size: CONTENT_TWIP, type: WidthType.DXA },
    rows: [mkRow(head, true), ...body.map(r => mkRow(r, false))]
  });
}

/* ---------------- dung khoi -> phan tu docx ---------------- */
const HL = [null, HeadingLevel.HEADING_1, HeadingLevel.HEADING_2, HeadingLevel.HEADING_3,
            HeadingLevel.HEADING_4, HeadingLevel.HEADING_5, HeadingLevel.HEADING_6];

function render(blocks, out, opt) {
  opt = opt || {};
  const ind = opt.indent || 0;
  for (const b of blocks) {
    switch (b.t) {
      case 'h': {
        const isChapter = b.lv === 1;
        out.push(new Paragraph({
          heading: HL[b.lv],
          pageBreakBefore: isChapter && !opt.noBreak,
          spacing: { before: isChapter ? 0 : 240, after: isChapter ? 240 : 120 },
          alignment: isChapter ? AlignmentType.CENTER : AlignmentType.LEFT,
          children: inline(b.s)
        }));
        break;
      }
      case 'p': {
        const mt = b.s.match(/^\*\*(Bảng [\d.]+ — .*?)\*\*$/);
        if (mt) {
          out.push(new Paragraph({
            style: 'TableCaption', keepNext: true,
            children: [new TextRun({ text: mt[1], font: FONT, size: SZ - 2, bold: true })]
          }));
          break;
        }
        out.push(new Paragraph({
          children: inline(b.s),
          alignment: AlignmentType.JUSTIFIED,
          indent: ind ? { left: ind } : undefined,
          spacing: { after: 120, line: 340 }
        }));
        break;
      }
      case 'img': {
        const p = path.resolve(DOCDIR, b.src);
        if (fs.existsSync(p)) {
          const { w, h } = pngSize(p);
          const k = Math.min(MAX_IMG_W / w, MAX_IMG_H / h, 1);
          out.push(new Paragraph({
            alignment: AlignmentType.CENTER, spacing: { before: 160, after: 60 },
            children: [new ImageRun({ type: 'png', data: fs.readFileSync(p),
              transformation: { width: Math.round(w * k), height: Math.round(h * k) } })]
          }));
        } else {
          out.push(new Paragraph({ alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: '[THIẾU ẢNH: ' + b.src + ']', font: FONT, size: SZ, color: 'C00000' })] }));
        }
        out.push(new Paragraph({
          style: 'FigureCaption',
          children: [new TextRun({ text: b.alt, font: FONT, size: SZ - 2, italics: true })]
        }));
        break;
      }
      case 'table':
        out.push(buildTable(b));
        out.push(new Paragraph({ spacing: { after: 160 }, children: [new TextRun({ text: '', size: 8 })] }));
        break;
      case 'quote': {
        const inner = [];
        render(b.blocks, inner, { indent: 400, noBreak: true });
        inner.forEach(el => {
          if (el instanceof Paragraph) {
            out.push(el);
          } else out.push(el);
        });
        break;
      }
      case 'ul': case 'ol':
        b.items.forEach(it => out.push(new Paragraph({
          children: inline(it.s),
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 60, line: 320 },
          numbering: { reference: b.t === 'ul' ? 'bul' : 'num', level: it.lv },
          indent: ind ? { left: ind + 360 * (it.lv + 1) } : undefined
        })));
        break;
      case 'code':
        b.lines.forEach(l => out.push(new Paragraph({
          spacing: { after: 0, line: 260 },
          shading: { type: ShadingType.CLEAR, fill: 'F2F2F2' },
          indent: { left: 300 + ind },
          children: [new TextRun({ text: l || ' ', font: 'Consolas', size: SZ - 4 })]
        })));
        out.push(new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: '', size: 8 })] }));
        break;
      case 'hr':
        out.push(new Paragraph({
          spacing: { before: 120, after: 120 },
          border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'BFBFBF', space: 1 } },
          children: [new TextRun({ text: '', size: 8 })]
        }));
        break;
    }
  }
}

/* ---------------- trang bia va phan dau ---------------- */
const T = (s, o) => new TextRun(Object.assign({ text: s, font: FONT, size: SZ }, o || {}));
const C = (children, o) => new Paragraph(Object.assign({ alignment: AlignmentType.CENTER, children }, o || {}));
const blank = (n) => Array.from({ length: n }, () => C([T('')]));

function frontMatter() {
  const f = [];
  f.push(C([T('TRƯỜNG ĐẠI HỌC [ĐIỀN TÊN TRƯỜNG]', { bold: true, size: 28 })], { spacing: { after: 60 } }));
  f.push(C([T('KHOA [ĐIỀN TÊN KHOA]', { bold: true, size: 28 })], { spacing: { after: 600 } }));
  f.push(...blank(2));
  f.push(C([T('BÁO CÁO PROJECT 1', { bold: true, size: 36 })], { spacing: { after: 200 } }));
  f.push(C([T('ĐỀ TÀI', { size: 28 })], { spacing: { after: 160 } }));
  f.push(C([T('HỆ THỐNG QUẢN LÝ VÀ VẬN HÀNH', { bold: true, size: 40 })], { spacing: { after: 60 } }));
  f.push(C([T('CHUNG CƯ MINI — MiniApart', { bold: true, size: 40 })], { spacing: { after: 700 } }));
  f.push(...blank(3));
  f.push(C([T('Giảng viên hướng dẫn:  [ĐIỀN]', { size: 28 })], { spacing: { after: 120 } }));
  f.push(C([T('Nhóm sinh viên thực hiện:', { size: 28 })], { spacing: { after: 120 } }));
  ['1.  [ĐIỀN HỌ TÊN] — [MSSV]', '2.  [ĐIỀN HỌ TÊN] — [MSSV]',
   '3.  [ĐIỀN HỌ TÊN] — [MSSV]', '4.  [ĐIỀN HỌ TÊN] — [MSSV]']
    .forEach(s => f.push(C([T(s, { size: 28 })], { spacing: { after: 60 } })));
  f.push(...blank(3));
  f.push(C([T('Hà Nội, tháng 8 năm 2026', { italics: true, size: 28 })]));

  const sec = (title) => {
    f.push(new Paragraph({ children: [new PageBreak()] }));
    f.push(C([T(title, { bold: true, size: 32 })], { spacing: { after: 300 } }));
  };

  sec('LỜI CẢM ƠN');
  f.push(new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { line: 340 },
    children: [T('[ĐIỀN — khoảng nửa trang: cảm ơn giảng viên hướng dẫn, nhà trường, và những người đã hỗ trợ nhóm trong quá trình thực hiện đề tài.]', { italics: true, color: '808080' })] }));

  sec('MỤC LỤC');
  f.push(new TableOfContents('Mục lục', { hyperlink: true, headingStyleRange: '1-4' }));

  sec('DANH MỤC HÌNH VẼ');
  f.push(new TableOfContents('Danh mục hình', { hyperlink: true, stylesWithLevels: [new StyleLevel('FigureCaption', 1)] }));

  sec('DANH MỤC BẢNG BIỂU');
  f.push(new TableOfContents('Danh mục bảng', { hyperlink: true, stylesWithLevels: [new StyleLevel('TableCaption', 1)] }));

  return f;
}

/* --- phan dau cho che do xuat rieng mot tep --- */
function soloFront() {
  const first = fs.readFileSync(path.join(DOCDIR, ARGV[0]), 'utf8')
    .split('\n').find(l => /^#\s+/.test(l)) || 'Tài liệu';
  return [
    C([T(first.replace(/^#\s+/, ''), { bold: true, size: 32 })], { spacing: { after: 200 } }),
    C([T('Dự án PRJ1-CCM — MiniApart', { italics: true, size: 24, color: '595959' })], { spacing: { after: 320 } }),
    new Paragraph({ spacing: { after: 200 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'BFBFBF', space: 1 } },
      children: [new TextRun({ text: '', size: 8 })] }),
    new Paragraph({ spacing: { after: 160 },
      children: [new TextRun({ text: 'MỤC LỤC', bold: true, font: FONT, size: SZ })] }),
    new TableOfContents('Mục lục', { hyperlink: true, headingStyleRange: '1-3' }),
    new Paragraph({ children: [new PageBreak()] })
  ];
}

/* ---------------- ghep ---------------- */
// Che do CLI: node build-docx.js <tep.md> [tep2.md ...]  -> xuat rieng tung tep
// Khong tham so                                          -> ghep ca quyen bao cao
const ARGV = process.argv.slice(2);
const SOLO = ARGV.length > 0;

const FILES = SOLO ? ARGV : [
  'PRJ1_Bao-cao_Chuong-1_Tong-quan.md',
  'PRJ1_Bao-cao_Chuong-2_Khao-sat-phan-tich.md',
  'PRJ1_Bao-cao_Chuong-3_Phan-tich-thiet-ke.md',
  'PRJ1_Bao-cao_Chuong-4_Cong-nghe.md',
  'PRJ1_Bao-cao_Chuong-5_Xay-dung-trien-khai.md',
  'PRJ1_Bao-cao_Chuong-6_Kiem-thu.md',
  'PRJ1_Bao-cao_Chuong-7_Ket-luan.md',
  'PRJ1_Bao-cao_Tai-lieu-tham-khao.md',
  'PRJ1_Bao-cao_Phu-luc.md'
];

const body = [];
let nFig = 0, nTab = 0;
FILES.forEach(f => {
  const raw = fs.readFileSync(path.join(DOCDIR, f), 'utf8')
    .split('\n')
    .filter(l => !/^## Ghi chú cho người viết chương này/.test(l));
  // cat bo phan "Ghi chu cho nguoi viet" o cuoi moi chuong
  const lines = [];
  let skip = false;
  for (const l of fs.readFileSync(path.join(DOCDIR, f), 'utf8').split('\n')) {
    if (/^##\s+Ghi chú cho người viết/.test(l)) { skip = true; continue; }
    if (skip && /^#{1,2}\s/.test(l)) skip = false;
    if (!skip) lines.push(l);
  }
  const blocks = parseBlocks(lines);
  nFig += blocks.filter(b => b.t === 'img').length;
  render(blocks, body, {});
});

const doc = new Document({
  creator: 'Nhóm PRJ1-CCM',
  title: 'Báo cáo Project 1 — Hệ thống Quản lý và Vận hành Chung cư mini',
  styles: {
    default: {
      document: { run: { font: FONT, size: SZ }, paragraph: { spacing: { line: 340, after: 120 } } },
      heading1: { run: { font: FONT, size: 32, bold: true, color: '000000' }, paragraph: { spacing: { before: 0, after: 240 } } },
      heading2: { run: { font: FONT, size: 30, bold: true, color: '000000' }, paragraph: { spacing: { before: 280, after: 140 } } },
      heading3: { run: { font: FONT, size: 28, bold: true, color: '000000' }, paragraph: { spacing: { before: 240, after: 120 } } },
      heading4: { run: { font: FONT, size: 26, bold: true, italics: true, color: '000000' }, paragraph: { spacing: { before: 200, after: 100 } } }
    },
    paragraphStyles: [
      { id: 'FigureCaption', name: 'Figure Caption', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { font: FONT, size: SZ - 2, italics: true },
        paragraph: { alignment: AlignmentType.CENTER, spacing: { before: 40, after: 200 } } },
      { id: 'TableCaption', name: 'Table Caption', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { font: FONT, size: SZ - 2, bold: true },
        paragraph: { alignment: AlignmentType.LEFT, spacing: { before: 160, after: 60 } } }
    ]
  },
  numbering: {
    config: [
      { reference: 'bul', levels: [0, 1, 2].map(l => ({
          level: l, format: LevelFormat.BULLET, text: ['●', '○', '▪'][l], alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 360 * (l + 1) + 360, hanging: 260 } } } })) },
      { reference: 'num', levels: [0, 1, 2].map(l => ({
          level: l, format: [LevelFormat.DECIMAL, LevelFormat.LOWER_LETTER, LevelFormat.LOWER_ROMAN][l],
          text: ['%1.', '%2.', '%3.'][l], alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 360 * (l + 1) + 360, hanging: 300 } } } })) }
    ]
  },
  sections: SOLO ? [
    { properties: { page: { size: { width: 11906, height: 16838 },
        margin: { top: 1417, right: 1134, bottom: 1417, left: 1701 } } },
      footers: { default: new Footer({ children: [ new Paragraph({ alignment: AlignmentType.CENTER,
          children: [new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: SZ - 2 })] }) ] }) },
      children: soloFront().concat(body) }
  ] : [
    { properties: { page: { size: { width: 11906, height: 16838 },
        margin: { top: 1417, right: 1134, bottom: 1417, left: 1701 } } },
      children: frontMatter() },
    { properties: { page: { size: { width: 11906, height: 16838 },
        margin: { top: 1417, right: 1134, bottom: 1417, left: 1701 } } },
      footers: { default: new Footer({ children: [ new Paragraph({ alignment: AlignmentType.CENTER,
          children: [new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: SZ - 2 })] }) ] }) },
      children: body }
  ]
});

Packer.toBuffer(doc).then(buf => {
  const out = SOLO
    ? path.join(DOCDIR, path.basename(FILES[0]).replace(/\.md$/i, '') + '.docx')
    : path.join(DOCDIR, 'PRJ1_Bao-cao_TOAN-VAN.docx');
  fs.writeFileSync(out, buf);
  console.log('Da ghi:', out, (buf.length / 1024 / 1024).toFixed(2) + ' MB');
  if (!SOLO) console.log('So hinh:', nFig);
});
