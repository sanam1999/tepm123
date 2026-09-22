import { NextResponse } from "next/server";
import { prisma } from "../../../libs/prisma";

export async function GET() {
  try {
    // Fetch all serial numbers and find the true numeric maximum
    // (string sort can give wrong results e.g. "9" > "308")
    const allReceipts = await prisma.customerReceipt.findMany({
      select: { serialNumber: true },
    });

    let maxNumber = 0;

    for (const receipt of allReceipts) {
      const num = parseInt(receipt.serialNumber, 10);
      if (!isNaN(num) && num > maxNumber) {
        maxNumber = num;
      }
    }

    const nextNumber = maxNumber + 1;
    const formatted = String(nextNumber).padStart(3, "0");

    return NextResponse.json({ nextSerial: formatted });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch next serial" },
      { status: 500 }
    );
  }
}