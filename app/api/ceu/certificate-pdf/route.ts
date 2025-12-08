import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import jsPDF from "jspdf";

/**
 * POST /api/ceu/certificate-pdf
 * Generate and store a certificate PDF to Supabase storage
 *
 * Body: { certificate_id: string }
 *
 * Returns: { success: boolean, pdf_url?: string, pdf_storage_path?: string }
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: "Invalid session" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { certificate_id } = body;

    if (!certificate_id) {
      return NextResponse.json(
        { error: "certificate_id is required" },
        { status: 400 }
      );
    }

    // Fetch certificate with user profile and module instructor info
    const { data: certificate, error: certError } = await supabaseAdmin
      .from("ceu_certificates")
      .select(`
        *,
        profiles!inner (
          full_name,
          email,
          rid_member_number
        ),
        skill_modules:module_id (
          instructor_name,
          instructor_credentials
        )
      `)
      .eq("id", certificate_id)
      .single();

    if (certError || !certificate) {
      console.error("Certificate fetch error:", certError);
      return NextResponse.json(
        { error: "Certificate not found" },
        { status: 404 }
      );
    }

    // Check access - user can only generate their own certificate
    if ((certificate as any).user_id !== user.id) {
      // Check if admin
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      const isAdmin = (profile as any)?.role === "admin" || (profile as any)?.role === "super_admin";
      if (!isAdmin) {
        return NextResponse.json(
          { error: "Access denied" },
          { status: 403 }
        );
      }
    }

    // Check if PDF already exists
    if ((certificate as any).pdf_storage_path) {
      // Generate signed URL for existing PDF
      const { data: signedUrl } = await supabaseAdmin.storage
        .from("certificates")
        .createSignedUrl((certificate as any).pdf_storage_path, 3600);

      return NextResponse.json({
        success: true,
        pdf_url: signedUrl?.signedUrl,
        pdf_storage_path: (certificate as any).pdf_storage_path,
        already_exists: true,
      });
    }

    // Generate PDF
    const pdfBuffer = await generateCertificatePDF(certificate as any);

    // Upload to Supabase Storage
    const storagePath = `${user.id}/${certificate_id}.pdf`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from("certificates")
      .upload(storagePath, pdfBuffer, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload PDF" },
        { status: 500 }
      );
    }

    // Update certificate record with storage path
    await supabaseAdmin
      .from("ceu_certificates")
      .update({
        pdf_storage_path: storagePath,
        pdf_generated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", certificate_id);

    // Generate signed URL
    const { data: signedUrl } = await supabaseAdmin.storage
      .from("certificates")
      .createSignedUrl(storagePath, 3600);

    return NextResponse.json({
      success: true,
      pdf_url: signedUrl?.signedUrl,
      pdf_storage_path: storagePath,
    });
  } catch (error: any) {
    console.error("Certificate PDF generation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ceu/certificate-pdf?certificate_id=xxx
 * Get a signed URL for an existing certificate PDF
 */
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: "Invalid session" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const certificateId = searchParams.get("certificate_id");

    if (!certificateId) {
      return NextResponse.json(
        { error: "certificate_id is required" },
        { status: 400 }
      );
    }

    // Fetch certificate
    const { data: certificate, error: certError } = await supabaseAdmin
      .from("ceu_certificates")
      .select("user_id, pdf_storage_path")
      .eq("id", certificateId)
      .single();

    if (certError || !certificate) {
      return NextResponse.json(
        { error: "Certificate not found" },
        { status: 404 }
      );
    }

    // Check access
    if ((certificate as any).user_id !== user.id) {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      const isAdmin = (profile as any)?.role === "admin" || (profile as any)?.role === "super_admin";
      if (!isAdmin) {
        return NextResponse.json(
          { error: "Access denied" },
          { status: 403 }
        );
      }
    }

    if (!(certificate as any).pdf_storage_path) {
      return NextResponse.json(
        { error: "PDF not generated yet", should_generate: true },
        { status: 404 }
      );
    }

    // Generate signed URL
    const { data: signedUrl, error: signedUrlError } = await supabaseAdmin.storage
      .from("certificates")
      .createSignedUrl((certificate as any).pdf_storage_path, 3600);

    if (signedUrlError) {
      console.error("Signed URL error:", signedUrlError);
      return NextResponse.json(
        { error: "Failed to generate download URL" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      pdf_url: signedUrl?.signedUrl,
    });
  } catch (error: any) {
    console.error("Certificate PDF fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Generate a certificate PDF using jsPDF
 */
async function generateCertificatePDF(certificate: any): Promise<Buffer> {
  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const width = pdf.internal.pageSize.getWidth();
  const height = pdf.internal.pageSize.getHeight();
  const profile = certificate.profiles;
  const userName = profile?.full_name || "Participant";
  const ridNumber = profile?.rid_member_number || "";

  // Colors
  const tealColor = [13, 148, 136] as [number, number, number]; // #0d9488
  const darkText = [24, 24, 27] as [number, number, number]; // #18181b
  const grayText = [113, 113, 122] as [number, number, number]; // #71717a

  // Draw border
  pdf.setDrawColor(...tealColor);
  pdf.setLineWidth(1);
  pdf.rect(10, 10, width - 20, height - 20);

  // Inner decorative border
  pdf.setLineWidth(0.3);
  pdf.rect(15, 15, width - 30, height - 30);

  // Decorative corners
  const cornerSize = 15;
  pdf.setLineWidth(0.5);
  // Top left
  pdf.line(20, 20, 20 + cornerSize, 20);
  pdf.line(20, 20, 20, 20 + cornerSize);
  // Top right
  pdf.line(width - 20 - cornerSize, 20, width - 20, 20);
  pdf.line(width - 20, 20, width - 20, 20 + cornerSize);
  // Bottom left
  pdf.line(20, height - 20 - cornerSize, 20, height - 20);
  pdf.line(20, height - 20, 20 + cornerSize, height - 20);
  // Bottom right
  pdf.line(width - 20 - cornerSize, height - 20, width - 20, height - 20);
  pdf.line(width - 20, height - 20 - cornerSize, width - 20, height - 20);

  // Header
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  pdf.setTextColor(...tealColor);
  const headerText = "INTERPRET REFLECT";
  pdf.text(headerText, width / 2, 32, { align: "center" });

  // Title
  pdf.setFont("times", "normal");
  pdf.setFontSize(28);
  pdf.setTextColor(...darkText);
  pdf.text("Certificate of Completion", width / 2, 48, { align: "center" });

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(11);
  pdf.setTextColor(...grayText);
  pdf.text("Continuing Education Units (CEUs)", width / 2, 56, { align: "center" });

  // Recipient section
  pdf.setFontSize(10);
  pdf.text("This is to certify that", width / 2, 72, { align: "center" });

  pdf.setFont("times", "bold");
  pdf.setFontSize(22);
  pdf.setTextColor(...darkText);
  pdf.text(userName, width / 2, 84, { align: "center" });

  // Underline under name
  const nameWidth = pdf.getTextWidth(userName);
  pdf.setDrawColor(...grayText);
  pdf.setLineWidth(0.3);
  pdf.line(width / 2 - nameWidth / 2 - 10, 87, width / 2 + nameWidth / 2 + 10, 87);

  if (ridNumber) {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.setTextColor(...grayText);
    pdf.text(`RID Member #${ridNumber}`, width / 2, 94, { align: "center" });
  }

  // Achievement section
  const achieveY = ridNumber ? 106 : 100;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(...grayText);
  pdf.text("has successfully completed", width / 2, achieveY, { align: "center" });

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  pdf.setTextColor(...darkText);
  const moduleTitle = certificate.title || "CEU Workshop";
  pdf.text(moduleTitle, width / 2, achieveY + 10, { align: "center" });

  // CEU Details boxes
  const boxY = achieveY + 24;
  const boxWidth = 50;
  const boxHeight = 22;
  const boxSpacing = 8;

  // Calculate box positions for centering
  const numBoxes = certificate.activity_code ? 4 : 3;
  const totalWidth = numBoxes * boxWidth + (numBoxes - 1) * boxSpacing;
  let boxX = (width - totalWidth) / 2;

  // CEU Value box
  pdf.setFillColor(240, 253, 250); // Light teal background
  pdf.setDrawColor(...tealColor);
  pdf.setLineWidth(0.3);
  pdf.roundedRect(boxX, boxY, boxWidth, boxHeight, 2, 2, "FD");

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(20);
  pdf.setTextColor(...tealColor);
  pdf.text(String(certificate.ceu_value || "0.1"), boxX + boxWidth / 2, boxY + 12, { align: "center" });

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(...grayText);
  pdf.text("CEU Earned", boxX + boxWidth / 2, boxY + 18, { align: "center" });

  // Category box
  boxX += boxWidth + boxSpacing;
  pdf.setFillColor(255, 255, 255);
  pdf.roundedRect(boxX, boxY, boxWidth, boxHeight, 2, 2, "FD");

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.setTextColor(...darkText);
  const category = certificate.rid_category || "Professional Studies";
  pdf.text(category.length > 15 ? category.substring(0, 15) + "..." : category, boxX + boxWidth / 2, boxY + 10, { align: "center" });

  if (certificate.rid_subcategory) {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    const subcat = certificate.rid_subcategory;
    pdf.text(subcat.length > 20 ? subcat.substring(0, 20) + "..." : subcat, boxX + boxWidth / 2, boxY + 15, { align: "center" });
  }

  pdf.setFontSize(8);
  pdf.setTextColor(...grayText);
  pdf.text("Content Area", boxX + boxWidth / 2, boxY + 18, { align: "center" });

  // Activity Code box (if exists)
  if (certificate.activity_code) {
    boxX += boxWidth + boxSpacing;
    pdf.roundedRect(boxX, boxY, boxWidth, boxHeight, 2, 2, "FD");

    pdf.setFont("courier", "bold");
    pdf.setFontSize(11);
    pdf.setTextColor(...darkText);
    pdf.text(certificate.activity_code, boxX + boxWidth / 2, boxY + 12, { align: "center" });

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(...grayText);
    pdf.text("Activity Code", boxX + boxWidth / 2, boxY + 18, { align: "center" });
  }

  // Assessment Score box (if exists)
  if (certificate.assessment_score) {
    boxX += boxWidth + boxSpacing;
    pdf.roundedRect(boxX, boxY, boxWidth, boxHeight, 2, 2, "FD");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    pdf.setTextColor(...darkText);
    pdf.text(`${certificate.assessment_score}%`, boxX + boxWidth / 2, boxY + 12, { align: "center" });

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(...grayText);
    pdf.text("Assessment Score", boxX + boxWidth / 2, boxY + 18, { align: "center" });
  }

  // Presenter section
  const presenterY = boxY + boxHeight + 14;
  pdf.setDrawColor(229, 231, 235); // Light gray
  pdf.setLineWidth(0.2);
  pdf.line(40, presenterY, width - 40, presenterY);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(...grayText);
  pdf.text("Presenter", width / 2, presenterY + 8, { align: "center" });

  // Use instructor name from certificate or module, fallback to default
  const instructorName = certificate.instructor_name
    || certificate.skill_modules?.instructor_name
    || "Sarah Wheeler, MA";
  const instructorCredentials = certificate.skill_modules?.instructor_credentials;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.setTextColor(...darkText);
  pdf.text(instructorName, width / 2, presenterY + 16, { align: "center" });

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(...grayText);
  const presenterSubtitle = instructorCredentials || "Founder, Building Bridges Global LLC";
  pdf.text(presenterSubtitle, width / 2, presenterY + 22, { align: "center" });

  // Footer section
  const footerY = height - 38;
  pdf.setDrawColor(229, 231, 235);
  pdf.line(40, footerY - 4, width - 40, footerY - 4);

  // Footer columns
  const colWidth = (width - 80) / 3;

  // Date column
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.setTextColor(...darkText);
  const completionDate = certificate.issued_at
    ? new Date(certificate.issued_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
  pdf.text(completionDate, 40 + colWidth / 2, footerY + 4, { align: "center" });

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(...grayText);
  pdf.text("Date of Completion", 40 + colWidth / 2, footerY + 10, { align: "center" });

  // Certificate number column
  pdf.setFont("courier", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(...darkText);
  pdf.text(certificate.certificate_number || "IR-0000-000000", width / 2, footerY + 4, { align: "center" });

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(...grayText);
  pdf.text("Certificate ID", width / 2, footerY + 10, { align: "center" });

  // Sponsor column
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.setTextColor(...darkText);
  pdf.text("RID CMP Sponsor #2309", width - 40 - colWidth / 2, footerY + 4, { align: "center" });

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(...grayText);
  pdf.text("Approved Provider", width - 40 - colWidth / 2, footerY + 10, { align: "center" });

  // Verification URL
  pdf.setFontSize(7);
  pdf.setTextColor(...grayText);
  pdf.text(
    `Verify at: interpretreflect.com/verify/${certificate.certificate_number}`,
    width / 2,
    footerY + 18,
    { align: "center" }
  );

  pdf.setFontSize(6);
  pdf.text(
    "Building Bridges Global LLC • InterpretReflect Platform • www.interpretreflect.com",
    width / 2,
    footerY + 23,
    { align: "center" }
  );

  // Convert to buffer
  const pdfOutput = pdf.output("arraybuffer");
  return Buffer.from(pdfOutput);
}
