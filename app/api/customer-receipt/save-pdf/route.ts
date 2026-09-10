import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/app/libs/prisma";
import { supabaseAdmin, PDF_BUCKET } from "@/app/libs/supabase";

/** Convert current time to Sri Lanka local time (UTC+5:30) */
function getSriLankaTime(): Date {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + 5.5 * 60 * 60 * 1000);
}

export async function POST(req: NextRequest) {
  try {
    const { receiptId, fileName, pdfBase64 } = await req.json();

    if (!receiptId || !fileName || !pdfBase64) {
      return NextResponse.json(
        { error: "Missing required fields (receiptId, fileName, pdfBase64)" },
        { status: 400 }
      );
    }

    // ---- Convert base64 to buffer ----
    const buffer = Buffer.from(pdfBase64, "base64");

    // ---- Upload PDF to Supabase Storage ----
    const storagePath = `receipts/${fileName}`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from(PDF_BUCKET)
      .upload(storagePath, buffer, {
        contentType: "application/pdf",
        upsert: true, // overwrite if same filename exists
      });

    if (uploadError) {
      console.error("Supabase Storage upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload PDF to storage" },
        { status: 500 }
      );
    }

    // ---- Get the public URL ----
    const { data: urlData } = supabaseAdmin.storage
      .from(PDF_BUCKET)
      .getPublicUrl(storagePath);

    const publicUrl = urlData.publicUrl;

    // ---- Save record in DB with Sri Lanka Time ----
    await prisma.receiptPDF.create({
      data: {
        receiptId: BigInt(receiptId),
        fileName,
        filePath: publicUrl, // store the full Supabase public URL
        createdAt: getSriLankaTime(),
      },
    });

    return NextResponse.json({
      message: "PDF saved successfully",
      filePath: publicUrl,
    });
  } catch (err) {
    console.error("Error saving PDF:", err);
    return NextResponse.json(
      { error: "Server error occurred while saving the PDF" },
      { status: 500 }
    );
  }
}
