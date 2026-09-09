import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "../../hooks/use-toast";

export interface CurrencyRow {
  id: string;
  currencyType: string;
  amountReceived: string;
  rate: string;
  amountIssued: string;
}

export interface PDFData {
  serialNo: string;
  date: string;
  customerName: string;
  nicPassport: string;
  sources: string[];
  otherSource: string;
  rows: CurrencyRow[];
}

// ============================================================
// PDF Generation — A5 Landscape (209.9 × 148.2 mm)
// Every coordinate measured from the original PDF file
// ============================================================
export const generatePDF = (
  {
    serialNo,
    date,
    customerName,
    nicPassport,
    sources,
    otherSource,
    rows,
  }: PDFData,
  downloadOnClient: boolean = false
): string | undefined => {

  if (!customerName || !nicPassport || sources.length === 0) {
    toast({
      title: "Missing Information",
      description: "Please fill in all required customer details and source of currency.",
      variant: "destructive",
    });
    return;
  }

  // A5 landscape
  const doc = new jsPDF("l", "mm", "a5");
  const PW = doc.internal.pageSize.getWidth();   // 209.9 mm
  // const PH = doc.internal.pageSize.getHeight(); // 148.2 mm

  // ── Logo ─────────────────────────────────────────────────
  const logoImg = new Image();
  logoImg.src = "/logo.png";
  doc.addImage(logoImg, "PNG", 5, 4, 20, 20);

  // ── Header ───────────────────────────────────────────────
  // "PEARL CITY HOTEL (PVT) LTD"  top=8.21mm, size=10.08pt, centered
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.08);
  doc.text("PARL CITY HOTEL (PVT) LTD", PW / 2, 11, { align: "center" });

  // "AUTHORIZED FOREIGN MONEY CHANGER"  top=13.58mm, size=8.4pt
  doc.setFontSize(8.4);
  doc.text("AUTHORIZED FOREIGN MONEY CHANGER", PW / 2, 16.5, { align: "center" });

  // Address lines  size=6.96pt
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.96);
  doc.text("17, Bauddhaloka Mawatha, Colombo - 04", PW / 2, 21, { align: "center" });
  doc.text("Tel 011 4523800 (Auto Lines)", PW / 2, 24.5, { align: "center" });
  doc.text("E-mail : moneyexchange@pearlgrouphotels.com  Website :", PW / 2, 28.1, { align: "center" });
  doc.text("pearlgrouphotels.com", PW / 2, 31.5, { align: "center" });

  // ── Horizontal rule ───────────────────────────────────────
  // Measured line at y≈32mm (from divider below header, just before permit row)
  doc.setLineWidth(0.3);
  doc.line(5.98, 33.5, 203.9, 33.5);

  // ── Permit No. ───────────────────────────────────────────
  // Text "Permit No. :" at top=35.27mm x=5.98mm, size=7.44pt, bold
  // Text "DFE/RD6000" at top=35.27mm x=24.64mm, normal
  // Underline: x=24.1mm y=38.3mm w=17.2mm (measured rect)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.44);
  doc.text("Permit No. :", 5.98, 38);
  doc.setFont("helvetica", "normal");
  doc.text("DFE/RD6000", 24.64, 38);
  doc.setLineWidth(0.2);
  doc.line(24.1, 38.3, 41.3, 38.3);   // underline

  // ── Serial No box ─────────────────────────────────────────
  // Box: top=34.7mm x=172.8mm w=30mm h=3.9mm  (measured)
  // Label "Serial No" at top=35.27mm x=158.4mm
  doc.setFont("helvetica", "bold");
  doc.text("Serial No", 158.4, 38);
  doc.setLineWidth(0.2);
  doc.rect(172.8, 34.7, 30.1, 3.9);
  doc.setFont("helvetica", "normal");
  doc.text(serialNo || "", 173.8, 38);

  // ── Date box ─────────────────────────────────────────────
  // Box: top=38.8mm x=172.8mm w=30mm h=3.8mm  (measured)
  // Label "Date" at top=39.33mm x=159.06mm
  doc.setFont("helvetica", "bold");
  doc.text("Date", 159.06, 42.2);
  doc.rect(172.8, 38.8, 30.1, 3.8);
  doc.setFont("helvetica", "normal");
  doc.text(date, 173.8, 42.2);

  // ── NAME OF THE CUSTOMER ──────────────────────────────────
  // "NAME OF THE CUSTOMER" at top=46.36mm x=6.69mm
  // "Sanam Shrestha" at top=46.36mm x=46.34mm
  // Underline: x=45.8mm y=49.4mm w=63.2mm (measured rect)
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.44);
  doc.text("NAME OF THE CUSTOMER", 6.69, 49);
  doc.text(customerName, 46.34, 49);
  doc.setLineWidth(0.2);
  doc.line(45.8, 49.4, 109, 49.4);

  // ── NIC/PASSPORT NO ──────────────────────────────────────
  // "NIC/PASSPORT NO" at top=46.36mm x=149.14mm
  // Value at top=46.36mm x=177.29mm
  // Underline: x=176.8mm y=49.4mm w=24.7mm
  doc.text("NIC/PASSPORT NO", 149.14, 49);
  doc.text(nicPassport, 177.29, 49);
  doc.line(176.8, 49.4, 201.5, 49.4);

  // ── Source of Foreign Currency ────────────────────────────
  // Heading at top=56.35mm x=12.89mm  bold 7.44pt
  doc.setFont("helvetica", "bold");
  doc.text("Source of Foreign Currency", 12.89, 59);

  // Checkboxes: x=196.8mm w=3.8mm h=3.8mm (measured)
  // a) top=60.55mm checkbox top=58.3mm h=3.8mm  (58.3+3.8=62.1 so center at 60mm)
  // b) top=65.55mm checkbox top=63.2mm
  // c) top=70.54mm checkbox top=68.2mm
  // d) top=75.54mm checkbox top=73.2mm
  // e) top=80.53mm checkbox top=78.2mm
  const srcItems = [
    {
      key: "Persons return for vacation from foreign employment",
      label: "a) Persons return for vacation from foreign employment",
      textY: 63.2,
      boxY: 60.9,
    },
    {
      key: "Relatives of those employees abroad",
      label: "b) Relatives of those employees abroad",
      textY: 68.2,
      boxY: 65.9,
    },
    {
      key: "Foreign tourists (Directly or through tour guides)",
      label: "c) Foreign tourists (Directly or through tour guides)",
      textY: 73.1,
      boxY: 70.9,
    },
    {
      key: "Unutilized foreign currency obtained for travel purpose by residents",
      label: "d) Unutilized foreign currency obtained for travel purpose by residents",
      textY: 78.1,
      boxY: 75.9,
    },
  ];

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.96);

  srcItems.forEach((src) => {
    doc.text(src.label, 12.89, src.textY);
    doc.setLineWidth(0.2);
    doc.rect(196.8, src.boxY, 3.8, 3.8);
    if (sources.includes(src.key)) {
      doc.setFont("helvetica", "bold");
      doc.text("X", 198.7, src.boxY + 3.1, { align: "center" });
      doc.setFont("helvetica", "normal");
    }
  });

  // "e) Other" row:  e) at top=80.53mm, "Other" at 80.87mm
  // Other input box: top=80.4mm x=23.7mm w=50mm h=3.2mm
  // "If other specify" at top=80.53mm x=77.4mm
  // checkbox: top=82.0mm box top=78.2mm h=3.7mm  (actually top=78.2 as measured)
  doc.text("e)", 12.89, 83.1);
  doc.text("Other", 15.4, 83.5);
  doc.setLineWidth(0.2);
  doc.rect(23.7, 80.4, 50, 3.2);         // "other" input box
  if (otherSource) doc.text(otherSource, 24.5, 83.1);
  doc.setFontSize(5.5);
  doc.text("If other specify", 77.4, 83.1);
  doc.setFontSize(6.96);
  doc.rect(196.8, 80.4, 3.8, 3.7);       // checkbox
  if (sources.includes("Other")) {
    doc.setFont("helvetica", "bold");
    doc.text("X", 198.7, 83.6, { align: "center" });
    doc.setFont("helvetica", "normal");
  }

  // ── Currency Table ────────────────────────────────────────
  // Table starts at top≈86.4mm (measured first row top)
  // Col x positions (measured): 15.3, 45.3, 95.3, 142.8, 200.3 mm
  // Col widths: 30.0, 50.0, 47.5, 57.5 mm
  // Row height: 5.8mm each (measured)

  const fmt = (val: string | number | undefined): string => {
    if (val === undefined || val === null || val === "") return "";
    const num = Number(val);
    if (isNaN(num)) return String(val);
    return num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const tableData: string[][] = rows.map((r) => [
    r.currencyType || "",
    fmt(r.amountReceived),
    fmt(r.rate),
    fmt(r.amountIssued),
  ]);
  while (tableData.length < 3) tableData.push(["", "", "", ""]);

  const total = rows.reduce((sum, r) => {
    const n = parseFloat(r.amountIssued);
    return sum + (isNaN(n) ? 0 : n);
  }, 0);
  tableData.push(["", "", "Total", fmt(total)]);

  autoTable(doc, {
    startY: 86.4,
    head: [["Currency Type", "Amount Received", "Rate", "Amount Issued"]],
    body: tableData,
    theme: "grid",
    margin: { left: 15.3, right: 6 },
    styles: {
      fontSize: 7.44,
      cellPadding: 1.5,
      lineWidth: 0.2,
      lineColor: [0, 0, 0],
      textColor: 0,
      font: "helvetica",
      minCellHeight: 5.8,
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: 0,
      halign: "center",
      fontStyle: "bold",
      fontSize: 7.44,
    },
    bodyStyles: { textColor: 0 },
    columnStyles: {
      0: { cellWidth: 30.0, halign: "left" },
      1: { cellWidth: 50.0, halign: "right" },
      2: { cellWidth: 47.5, halign: "right" },
      3: { cellWidth: 57.5, halign: "right" },
    },
    didParseCell(data) {
      if (data.row.index === tableData.length - 1) {
        data.cell.styles.fontStyle = "bold";
      }
    },
  });

  // ── Signature lines ───────────────────────────────────────
  // Sig lines at top=127.32mm  (measured from PDF)
  // Left underscores: x=14.7mm → x=57.9mm  (41.76 to 164.13 pt → 14.7 to 57.9mm)
  // Right underscores: x=155.2mm → x=199.4mm (440.16 to 568.65 pt → 155.2 to 200.5mm)
  // Customer Signature label: top=131.88mm x=24.89mm
  // Money Changer label: top=131.88mm x=157.32mm
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.44);
  doc.setLineWidth(0.4);
  doc.line(14.7, 127.3, 57.9, 127.3);
  doc.text("Customer Signature", 24.89, 131.9);

  doc.line(155.2, 127.3, 200.4, 127.3);
  doc.text("Money Changer Signature & Stamp", 157.32, 131.9);

  // ── Output ────────────────────────────────────────────────
  if (downloadOnClient) {
    doc.save(`Receipt-${serialNo || Date.now()}.pdf`);
    toast({
      title: "PDF Generated",
      description: `Receipt downloaded for ${customerName}`,
    });
    return undefined;
  }

  return doc.output("datauristring").split("base64,")[1];
};
