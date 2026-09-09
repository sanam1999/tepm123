// app/components/purchaseRegister/generatePurchasePDF.ts

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "../../hooks/use-toast";

export interface CurrencyDetail {
    currencyType: string;
    amountFcy: string;
    rate: string;
    amountIssuedLkr: string;
    id: string;
}

export interface PurchaseRecord {
    id: string;
    date: string;
    serialNumber: string;
    customerName: string;
    nicPassport: string;
    sourceOfForeignCurrency: string[];
    remarks: string;
    currencies: CurrencyDetail[];
}

export const generatePurchasePDF = (
    purchases: PurchaseRecord[],
    fromDate: string,
    toDate: string
): void => {
    if (purchases.length === 0) {
        toast({
            title: "No Data",
            description: "No purchase transactions found for the selected date range.",
            variant: "destructive",
        });
        return;
    }

    // Sort ascending by date (earliest first)
    const sortedPurchases = [...purchases].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // ── Portrait A4 ───────────────────────────────────────
    const doc = new jsPDF("p", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 10;

    const logoImg = new Image();
    logoImg.src = "/logo.png";

    // ── Logo ─────────────────────────────────────────────
    doc.addImage(logoImg, "PNG", margin, 5, 30, 30);

    // ── Company Header (centred, matches receipt) ─────────
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("PEARL CITY HOTEL (PVT) LTD", pageWidth / 2, 12, { align: "center" });

    doc.setFontSize(11);
    doc.text("AUTHORIZED FOREIGN MONEY CHANGER", pageWidth / 2, 18, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("17, Bauddhaloka Mawatha, Colombo - 04", pageWidth / 2, 24, { align: "center" });
    doc.text("Tel 011 4523800 (Auto Lines)", pageWidth / 2, 28, { align: "center" });
    doc.text("E-mail : moneyexchange@pearlgrouphotels.com", pageWidth / 2, 32, { align: "center" });
    doc.text("Website : pearlgrouphotels.com", pageWidth / 2, 36, { align: "center" });

    // ── Permit No. (matches receipt) ──────────────────────
    let currentY = 43;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Permit No. :", margin, currentY);
    doc.setFont("helvetica", "normal");
    doc.text("DFE/RD/6000", margin + 24, currentY);
    doc.line(margin + 23, currentY + 0.5, margin + 55, currentY + 0.5);

    // ── From / To date boxes top-right ──
    const boxW = 50;
    const boxH = 6;
    const boxX = pageWidth - margin - boxW;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.text("From", boxX - 12, currentY - 1);
    doc.rect(boxX, currentY - 5, boxW, boxH);
    doc.setFont("helvetica", "normal");
    doc.text(fromDate ? new Date(fromDate).toLocaleDateString("en-GB") : "-", boxX + 2, currentY - 0.5);

    currentY += 8;
    doc.setFont("helvetica", "bold");
    doc.text("To", boxX - 8, currentY - 1);
    doc.rect(boxX, currentY - 5, boxW, boxH);
    doc.setFont("helvetica", "normal");
    doc.text(toDate ? new Date(toDate).toLocaleDateString("en-GB") : "-", boxX + 2, currentY - 0.5);

    currentY += 6;

    // ── Report Title ──────────────────────────────────────
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("PURCHASE REGISTER", margin, currentY);
    currentY += 6;

    // ── Build table rows ──────────────────────────────────
    const bodyRows: (string | object)[][] = [];

    sortedPurchases.forEach((purchase) => {
        purchase.currencies.forEach((currency, index) => {
            bodyRows.push([
                index === 0 ? new Date(purchase.date).toLocaleDateString("en-GB") : "",
                index === 0 ? purchase.serialNumber : "",
                index === 0 ? purchase.customerName : "",
                index === 0 ? purchase.nicPassport : "",
                currency.currencyType,
                parseFloat(currency.amountFcy).toFixed(2),
                parseFloat(currency.rate).toFixed(2),
                parseFloat(currency.amountIssuedLkr).toFixed(2),
            ]);
        });
    });

    const totalLkr = sortedPurchases.reduce(
        (sum, p) => sum + p.currencies.reduce((s, c) => s + parseFloat(c.amountIssuedLkr || "0"), 0),
        0
    );

    const totalRow = [
        { content: "TOTAL", colSpan: 7, styles: { halign: "right" as const, fontStyle: "bold" as const } },
        {
            content: totalLkr.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            styles: { fontStyle: "bold" as const, halign: "right" as const },
        },
    ];

    const usable = pageWidth - margin * 2;

    autoTable(doc, {
        startY: currentY,
        head: [["Date", "Ser. No.", "Customer Name", "NIC / Passport", "Currency", "Amt (FCY)", "Rate", "Amt (LKR)"]],
        body: [...bodyRows, totalRow] as unknown as string[][],
        theme: "grid",
        margin: { left: margin, right: margin },
        styles: {
            fontSize: 7,
            cellPadding: 1.8,
            lineWidth: 0.2,
            lineColor: [0, 0, 0],
            textColor: [0, 0, 0],
            font: "helvetica",
            overflow: "linebreak",
        },
        headStyles: {
            fillColor: [255, 255, 255],
            textColor: [0, 0, 0],
            halign: "center",
            fontStyle: "normal",
            fontSize: 7,
            lineWidth: 0.3,
            lineColor: [0, 0, 0],
        },
        bodyStyles: { textColor: [0, 0, 0], fillColor: [255, 255, 255] },
        columnStyles: {
            0: { cellWidth: usable * 0.10 },
            1: { cellWidth: usable * 0.07 },
            2: { cellWidth: usable * 0.22 },
            3: { cellWidth: usable * 0.17 },
            4: { cellWidth: usable * 0.09, halign: "center" },
            5: { cellWidth: usable * 0.12, halign: "right" },
            6: { cellWidth: usable * 0.10, halign: "right" },
            7: { cellWidth: usable * 0.13, halign: "right" },
        },
        didParseCell: (data) => {
            if (data.row.index === bodyRows.length) {
                data.cell.styles.fillColor = [255, 255, 255];
                data.cell.styles.fontStyle = "bold";
            }
        },
    });

    // ── Currency Summary Table (BEFORE SIGNATURE) ─────────
    const finalY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 250;
    let summaryY = finalY + 8;

    // Check if we need a new page for currency summary
    if (summaryY + 40 > pageHeight - 30) {
        doc.addPage();
        summaryY = margin;
    }

    // Section title
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text("Currency Summary", margin, summaryY);
    summaryY += 5;

    const allCurrencies = ["USD", "GBP", "CHF", "AUD", "NZD", "SGD", "INR", "CAD", "JPY", "EUR"];

    // Calculate totals and filter out zero-amount currencies
    const activeCurrencies = allCurrencies
        .map((currency) => {
            const totalFcy = sortedPurchases.reduce((sum, purchase) => {
                return sum + purchase.currencies
                    .filter((c) => c.currencyType === currency)
                    .reduce((s, c) => s + parseFloat(c.amountFcy || "0"), 0);
            }, 0);
            return { currency, totalFcy };
        })
        .filter((item) => item.totalFcy > 0);

    if (activeCurrencies.length > 0) {
        const colCount = activeCurrencies.length;
        const tableUsable = pageWidth - margin * 2;
        const colW = tableUsable / colCount;

        const summaryHead = [activeCurrencies.map((item) => item.currency)];
        const summaryBody = [
            activeCurrencies.map((item) =>
                item.totalFcy.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            ),
        ];

        const colStyles: Record<number, object> = {};
        activeCurrencies.forEach((_, i) => {
            colStyles[i] = { cellWidth: colW, halign: "center" as const };
        });

        autoTable(doc, {
            startY: summaryY,
            head: summaryHead,
            body: summaryBody,
            theme: "grid",
            margin: { left: margin, right: margin },
            styles: {
                fontSize: 8,
                cellPadding: 2.5,
                lineWidth: 0.3,
                lineColor: [0, 0, 0],
                textColor: [0, 0, 0],
                font: "helvetica",
                halign: "center",
            },
            headStyles: {
                fillColor: [255, 255, 255],
                textColor: [0, 0, 0],
                fontStyle: "bold",
                fontSize: 8,
                lineWidth: 0.3,
                lineColor: [0, 0, 0],
                halign: "center",
            },
            bodyStyles: {
                textColor: [0, 0, 0],
                fillColor: [255, 255, 255],
                halign: "center",
            },
            columnStyles: colStyles,
        });

        summaryY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? summaryY + 20;
    } else {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text("No currency transactions found.", margin, summaryY + 6);
        summaryY += 12;
    }

    // ── Signature lines (AFTER CURRENCY SUMMARY) ──────────
    const sigY = Math.min(summaryY + 12, pageHeight - 12);
    const sigLen = 65;

    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    doc.line(margin, sigY, margin + sigLen, sigY);
    doc.line(pageWidth - margin - sigLen, sigY, pageWidth - margin, sigY);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.text("Prepared By", margin + 5, sigY + 4);
    doc.text("Authorized Signatory & Stamp", pageWidth - margin - sigLen + 2, sigY + 4);

    // ── Save ──────────────────────────────────────────────
    const filename = `Purchase-Register-${fromDate || "start"}-to-${toDate || "end"}.pdf`;
    doc.save(filename);
    toast({ title: "PDF Downloaded", description: `Saved: ${filename}` });
};
