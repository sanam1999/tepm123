"use client";

import { toast } from "../../hooks/use-toast";
import { useState, useEffect } from "react";
import { Button } from "./button";

interface CurrencyRow {
    id: string;
    currencyType: string;
    amountFcy: string;
    rate: string;
    amountIssuedLkr: string;
}

interface PreviewData {
    customerName: string;
    nicPassport: string;
    date: string;
    sources: string[];
    remarks?: string;
    rows: CurrencyRow[];
}

interface CurrencyEditModalProps {
    open: boolean;
    previewData: PreviewData | null;
    onClose: () => void;
    onSave: (updatedRows: CurrencyRow[], customerName: string, nicPassport: string, date: string) => void;
}

const currencies = ["USD", "GBP", "EUR", "CHF", "AUD", "NZD", "SGD", "INR", "CAD"];

export function CurrencyEditModal({ open, previewData, onClose, onSave }: CurrencyEditModalProps) {
    const [rows, setRows] = useState<CurrencyRow[]>([]);
    const [customerName, setCustomerName] = useState("");
    const [nicPassport, setNicPassport] = useState("");
    const [date, setDate] = useState("");

    // Must be declared before useEffect
    const formatDateForInput = (dateStr: string) => {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return "";
        return d.toISOString().split("T")[0];
    };

    useEffect(() => {
        if (previewData) {
            setRows(previewData.rows);
            setCustomerName(previewData.customerName);
            setNicPassport(previewData.nicPassport);
            setDate(formatDateForInput(previewData.date));
        }
    }, [previewData]);

    if (!open || !previewData) return null;

    const handleChange = (idx: number, field: keyof CurrencyRow, value: string) => {
        const newRows = [...rows];
        newRows[idx] = {
            ...newRows[idx],
            [field]: value,
            amountIssuedLkr:
                field === "amountFcy"
                    ? String(parseFloat(value || "0") * parseFloat(newRows[idx].rate || "0"))
                    : field === "rate"
                        ? String(parseFloat(newRows[idx].amountFcy || "0") * parseFloat(value || "0"))
                        : newRows[idx].amountIssuedLkr,
        };
        setRows(newRows);
    };

    const handleSave = async () => {
        if (!rows.length) return;

        try {
            await Promise.all(
                rows.map(async (row) => {
                    if (!row.id) return;

                    const res = await fetch(`/api/balance-statement/balance-edit?id=${row.id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            currencyType: row.currencyType,
                            amountFcy: Number(row.amountFcy),
                            rateOffered: Number(row.rate),
                            customerName,
                            nicPassport,
                            date,
                        }),
                    });

                    const data = await res.json();

                    if (!res.ok) {
                        throw new Error(data.error || `Update failed for row ${row.id}`);
                    }
                })
            );

            onSave(rows, customerName, nicPassport, date);
            toast({ title: "Success", description: "Record updated" });
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl p-6 sm:p-8 max-w-7xl w-full shadow-xl mx-4">
                <h3 className="text-2xl font-semibold text-gray-900 mb-6">Edit Transaction</h3>

                <div className="mb-6">
                    <h4 className="font-semibold mb-2 text-sm">Currency Details</h4>
                    <div className="overflow-x-auto border rounded-lg">
                        <table className="min-w-full text-left text-sm">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="px-4 py-2">Type</th>
                                    <th className="px-4 py-2">Customer</th>
                                    <th className="px-4 py-2">NIC/PP No</th>
                                    <th className="px-4 py-2">Received (FCY)</th>
                                    <th className="px-4 py-2">Rate</th>
                                    <th className="px-4 py-2">Issued (LKR)</th>
                                    <th className="px-4 py-2">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((row, idx) => (
                                    <tr key={row.id || idx} className="hover:bg-gray-50">
                                        <td className="px-4 py-2">
                                            <select
                                                className="border px-2 py-1 rounded w-full"
                                                value={row.currencyType}
                                                onChange={(e) => handleChange(idx, "currencyType", e.target.value)}
                                            >
                                                <option value="">Select</option>
                                                {currencies.map((c) => (
                                                    <option key={c} value={c}>
                                                        {c}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="px-4 py-2">
                                            {idx === 0 ? (
                                                <input
                                                    className="border px-2 py-1 rounded w-full"
                                                    value={customerName}
                                                    onChange={(e) => setCustomerName(e.target.value)}
                                                />
                                            ) : (
                                                <span className="text-gray-400 text-xs px-2">—</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-2">
                                            {idx === 0 ? (
                                                <input
                                                    className="border px-2 py-1 rounded w-full"
                                                    value={nicPassport}
                                                    onChange={(e) => setNicPassport(e.target.value)}
                                                />
                                            ) : (
                                                <span className="text-gray-400 text-xs px-2">—</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-2">
                                            <input
                                                className="border px-2 py-1 rounded w-full"
                                                value={row.amountFcy}
                                                onChange={(e) => handleChange(idx, "amountFcy", e.target.value)}
                                            />
                                        </td>
                                        <td className="px-4 py-2">
                                            <input
                                                className="border px-2 py-1 rounded w-full"
                                                value={row.rate}
                                                onChange={(e) => handleChange(idx, "rate", e.target.value)}
                                            />
                                        </td>
                                        <td className="px-4 py-2">
                                            <input
                                                className="border px-2 py-1 rounded w-full bg-gray-100"
                                                value={(parseFloat(row.amountFcy) || 0) * (parseFloat(row.rate) || 0)}
                                                readOnly
                                            />
                                        </td>
                                        <td className="px-4 py-2">
                                            {idx === 0 ? (
                                                <input
                                                    className="border px-2 py-1 rounded w-full"
                                                    type="date"
                                                    value={date}
                                                    onChange={(e) => setDate(e.target.value)}
                                                />
                                            ) : (
                                                <span className="text-gray-400 text-xs px-2">—</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSave}>
                        Save
                    </Button>
                </div>
            </div>
        </div>
    );
}