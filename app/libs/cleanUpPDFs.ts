import { prisma } from "./prisma";
import { supabaseAdmin, PDF_BUCKET } from "./supabase";

/**
 * Cleanup PDFs older than `daysToKeep` from Supabase Storage + DB
 * @param daysToKeep Number of days to keep PDFs
 */
export async function cleanupOldPDFs(daysToKeep: number = 7) {
  try {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);

    // Get old PDFs from DB
    const oldPDFs = await prisma.receiptPDF.findMany({
      where: { createdAt: { lt: cutoffDate } },
    });

    if (oldPDFs.length === 0) {
      console.log("No old PDFs to clean up.");
      return { deletedFiles: 0, deletedDBRecords: 0 };
    }

    // Extract storage paths from the public URLs stored in filePath
    // filePath is stored as the full Supabase public URL, e.g.:
    // https://xxx.supabase.co/storage/v1/object/public/receipt-pdfs/receipts/file.pdf
    const storagePaths = oldPDFs.map((pdf) => {
      // Extract path after the bucket name
      const url = pdf.filePath;
      const bucketMarker = `/${PDF_BUCKET}/`;
      const idx = url.indexOf(bucketMarker);
      return idx !== -1 ? url.slice(idx + bucketMarker.length) : pdf.fileName;
    });

    // Delete files from Supabase Storage
    const { error: storageError } = await supabaseAdmin.storage
      .from(PDF_BUCKET)
      .remove(storagePaths);

    if (storageError) {
      console.warn("Supabase Storage deletion error:", storageError);
    } else {
      console.log(`Deleted ${storagePaths.length} files from Supabase Storage.`);
    }

    // Delete DB records
    const deletedCount = await prisma.receiptPDF.deleteMany({
      where: { createdAt: { lt: cutoffDate } },
    });

    console.log(`Cleanup complete. Deleted ${deletedCount.count} PDF records from DB.`);

    return { deletedFiles: storagePaths.length, deletedDBRecords: deletedCount.count };
  } catch (err) {
    console.error("Error cleaning up PDFs:", err);
    throw err;
  }
}

