// app/components/depositHistory/generateDepositPDF.ts

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "../../hooks/use-toast";

export interface Deposit {
    id: string;
    currencyType: string;
    amount: number;
    date: string;
    createdAt: string;
}

export const generateDepositPDF = (
    deposits: Deposit[],
    fromDate: string,
    toDate: string
): void => {
    if (deposits.length === 0) {
        toast({
            title: "No Data",
            description: "No deposits found for the selected date range.",
            variant: "destructive",
        });
        return;
    }

    // Sort ascending by date (earliest first)
    const sortedDeposits = [...deposits].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Portrait A4
    const doc = new jsPDF("p", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 10;

    const logoImg = new Image();
    logoImg.src = "/logo.png";

    // ── Logo ─────────────────────────────────────────────
    doc.addImage(logoImg, "PNG", margin, 5, 30, 30);

    // ── Company Header ────────────────────────────────────
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

    // ── Permit No. ────────────────────────────────────────
    let currentY = 42;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Permit No. :", margin, currentY);
    doc.setFont("helvetica", "normal");
    doc.text("DFE/RD/6000", margin + 24, currentY);
    doc.line(margin + 23, currentY + 0.5, margin + 55, currentY + 0.5);

    // ── From / To date boxes top-right ────────────────────
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
    doc.text("DEPOSIT HISTORY", margin, currentY);
    currentY += 6;

    // ── Build table rows ──────────────────────────────────
    const bodyRows = sortedDeposits.map((d) => [
        new Date(d.date).toLocaleDateString("en-GB"),
        d.currencyType,
        d.amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    ]);

    const totalDeposit = sortedDeposits.reduce((sum, d) => sum + d.amount, 0);

    const totalRow = [
        { content: "" },
        { content: "TOTAL", styles: { fontStyle: "bold" as const, halign: "right" as const } },
        {
            content: totalDeposit.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            styles: { fontStyle: "bold" as const, halign: "right" as const },
        },
    ];

    // ── Main Table ────────────────────────────────────────
    autoTable(doc, {
        startY: currentY,
        head: [["Date", "Currency Type", "Deposit"]],
        body: [...bodyRows, totalRow as unknown as string[]],
        theme: "grid",
        margin: { left: margin, right: margin },
        styles: {
            fontSize: 9,
            cellPadding: 2,
            lineWidth: 0.2,
            lineColor: [0, 0, 0],
            textColor: [0, 0, 0],
            font: "helvetica",
        },
        headStyles: {
            fillColor: [255, 255, 255],
            textColor: [0, 0, 0],
            halign: "center",
            fontStyle: "normal",
            lineWidth: 0.3,
            lineColor: [0, 0, 0],
        },
        bodyStyles: { textColor: [0, 0, 0], fillColor: [255, 255, 255] },
        columnStyles: {
            0: { cellWidth: (pageWidth - margin * 2) * 0.30, halign: "left" },
            1: { cellWidth: (pageWidth - margin * 2) * 0.25, halign: "left" },
            2: { cellWidth: (pageWidth - margin * 2) * 0.45, halign: "right" },
        },
        didParseCell: (data) => {
            if (data.row.index === bodyRows.length) {
                data.cell.styles.fillColor = [255, 255, 255];
                data.cell.styles.fontStyle = "bold";
            }
        },
    });

    // ── Currency Summary Table (BEFORE SIGNATURE) ─────────
    const finalY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 120;
    let summaryY = finalY + 8;

    // Check if we need a new page
    if (summaryY + 30 > pageHeight - 30) {
        doc.addPage();
        summaryY = margin;
    }

    // All supported currencies — only show those with amount > 0
    const allCurrencies = ["USD", "GBP", "CHF", "AUD", "NZD", "SGD", "INR", "CAD", "JPY", "EUR"];

    const activeCurrencies = allCurrencies
        .map((currency) => {
            const total = sortedDeposits
                .filter((d) => d.currencyType === currency)
                .reduce((sum, d) => sum + d.amount, 0);
            return { currency, total };
        })
        .filter((item) => item.total > 0);

    // Also catch any currencies in deposits not in the standard list
    const extraCurrencies = Object.keys(
        sortedDeposits.reduce((acc, d) => {
            if (!allCurrencies.includes(d.currencyType)) {
                acc[d.currencyType] = (acc[d.currencyType] || 0) + d.amount;
            }
            return acc;
        }, {} as Record<string, number>)
    ).map((currency) => ({
        currency,
        total: sortedDeposits
            .filter((d) => d.currencyType === currency)
            .reduce((sum, d) => sum + d.amount, 0),
    })).filter((item) => item.total > 0);

    const summaryItems = [...activeCurrencies, ...extraCurrencies];

    if (summaryItems.length > 0) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.text("Currency Summary", margin, summaryY);
        summaryY += 5;

        const tableUsable = pageWidth - margin * 2;
        const colW = tableUsable / summaryItems.length;

        const colStyles: Record<number, object> = {};
        summaryItems.forEach((_, i) => {
            colStyles[i] = { cellWidth: colW, halign: "center" as const };
        });

        autoTable(doc, {
            startY: summaryY,
            head: [summaryItems.map((item) => item.currency)],
            body: [
                summaryItems.map((item) =>
                    item.total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                ),
            ],
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
    }

    // ── Signature lines (AFTER CURRENCY SUMMARY) ──────────
    const sigY = Math.min(summaryY + 12, pageHeight - 12);
    const sigLineLen = 65;

    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    doc.line(margin, sigY, margin + sigLineLen, sigY);
    doc.line(pageWidth - margin - sigLineLen, sigY, pageWidth - margin, sigY);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.text("Prepared By", margin + 5, sigY + 4);
    doc.text("Authorized Signatory & Stamp", pageWidth - margin - sigLineLen + 2, sigY + 4);

    // ── Save ──────────────────────────────────────────────
    const filename = `Deposit-History-${fromDate || "start"}-to-${toDate || "end"}.pdf`;
    doc.save(filename);
    toast({ title: "PDF Downloaded", description: `Saved: ${filename}` });
};
