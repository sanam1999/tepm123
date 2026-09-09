// app/components/depositHistory/DepositHistory.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Button } from "../ui/button";
import { Trash2, Save } from "lucide-react";
import { DateRangeFilter } from "../ui/DateRangeFilter";
import { toast } from "../../hooks/use-toast";
import { generateDepositPDF, type Deposit } from "./Generatedepositpdf";

export default function DepositHistory() {
    const [deposits, setDeposits] = useState<Deposit[]>([]);
    const [fromDate, setFromDate] = useState<string>("");
    const [toDate, setToDate] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const today = new Date();
        const from = new Date();
        from.setDate(today.getDate() - 30);
        setFromDate(from.toISOString().split("T")[0]);
        setToDate(today.toISOString().split("T")[0]);
    }, []);

    const fetchDeposits = async () => {
        if (!fromDate || !toDate) return;
        try {
            setLoading(true);
            const res = await fetch(`/api/deposit-history?fromDate=${fromDate}&toDate=${toDate}`);
            if (!res.ok) throw new Error("Failed to fetch");
            const data = await res.json();
            setDeposits(data);
        } catch {
            toast({ title: "Error", description: "Failed to load deposits", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (fromDate && toDate) fetchDeposits();
    }, [fromDate, toDate]);

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this deposit?")) return;
        try {
            const res = await fetch(`/api/balance-statement/deposits?id=${id}`, { method: "DELETE" });
            if (res.ok) {
                toast({ title: "Success", description: "Deposit deleted" });
                fetchDeposits();
            } else {
                toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
            }
        } catch {
            toast({ title: "Error", description: "Something went wrong", variant: "destructive" });
        }
    };

    // Downloads Deposit History PDF only
    const handleInitiateSave = () => {
        setIsSaving(true);
        try {
            generateDepositPDF(deposits, fromDate, toDate);
        } finally {
            setIsSaving(false);
        }
    };

    const totalAmount = deposits.reduce((sum, d) => sum + d.amount, 0);
    const currencyTotals = deposits.reduce<Record<string, number>>((acc, d) => {
        acc[d.currencyType] = (acc[d.currencyType] || 0) + d.amount;
        return acc;
    }, {});

    return (
        <Card className="shadow-[var(--shadow-medium)]">
            <CardHeader className="bg-gradient-to-r from-primary to-primary/90 text-primary-foreground">
                <CardTitle className="text-2xl">Deposit History</CardTitle>
                <p className="text-sm opacity-90">All deposit transactions</p>
            </CardHeader>

            <CardContent className="pt-6 space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border border-primary/20">
                        <p className="text-sm text-muted-foreground">Total Deposits</p>
                        <p className="text-2xl font-bold text-primary">{deposits.length}</p>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-accent/10 to-accent/5 rounded-lg border border-accent/20">
                        <p className="text-sm text-muted-foreground">Total Amount (LKR)</p>
                        <p className="text-2xl font-bold text-accent">
                            {totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-lg border border-green-500/20">
                        <p className="text-sm text-muted-foreground">Currencies</p>
                        <p className="text-lg font-bold">{Object.keys(currencyTotals).join(", ") || "—"}</p>
                    </div>
                </div>

                {/* Date Range Filter */}
                <DateRangeFilter
                    fromDate={fromDate}
                    toDate={toDate}
                    loading={loading}
                    onFromChange={setFromDate}
                    onToChange={setToDate}
                    onFilter={fetchDeposits}
                />

                {/* Table */}
                <div className="border rounded-lg overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50">
                                <TableHead>Currency</TableHead>
                                <TableHead className="text-right">Amount (LKR)</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-center">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {deposits.length > 0 ? (
                                deposits.map((deposit) => (
                                    <TableRow key={deposit.id}>
                                        <TableCell>
                                            <span className="px-2 py-1 bg-primary/10 text-primary rounded text-sm font-semibold">
                                                {deposit.currencyType}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right font-mono">
                                            {deposit.amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </TableCell>
                                        <TableCell>{new Date(deposit.date).toLocaleDateString()}</TableCell>
                                        <TableCell className="text-center">
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => handleDelete(deposit.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8">
                                        No deposits found
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>

                    <div className="flex justify-end pt-4 pb-3 pr-3">
                        <Button
                            onClick={handleInitiateSave}
                            disabled={isSaving}
                            size="lg"
                            className="gap-2 bg-gradient-to-r from-accent to-accent/90"
                        >
                            <Save className="h-4 w-4" />
                            {isSaving ? "Generating PDF…" : "Save & Download PDF"}
                        </Button>
                    </div>
                </div>

                {/* Per-currency breakdown */}
                {Object.keys(currencyTotals).length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {Object.entries(currencyTotals).map(([currency, total]) => (
                            <div key={currency} className="p-3 bg-muted/40 rounded-lg border text-center">
                                <p className="text-xs text-muted-foreground uppercase tracking-wide">{currency}</p>
                                <p className="text-base font-bold font-mono">
                                    {total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}