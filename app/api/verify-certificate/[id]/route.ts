import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const supabase = supabaseAdmin;

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const certificateId = params.id;

    if (!certificateId) {
      return NextResponse.json(
        { valid: false, error: "Certificate ID is required" },
        { status: 400 }
      );
    }

    // Query certificate by certificate_number (the public ID like IR-2025-000001)
    // or by UUID if that's what was passed
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(certificateId);

    const query = supabase
      .from("ceu_certificates")
      .select(`
        id,
        certificate_number,
        activity_code,
        title,
        description,
        ceu_value,
        rid_category,
        learning_objectives_achieved,
        assessment_score,
        assessment_passed,
        completed_at,
        issued_at,
        issued_by,
        sponsor_number,
        status,
        user_id
      `)
      .eq(isUUID ? "id" : "certificate_number", certificateId)
      .single();

    const { data: certificate, error } = await query;

    if (error || !certificate) {
      return NextResponse.json(
        {
          valid: false,
          error: "Certificate not found",
          message: "No certificate found with the provided ID. Please check the certificate number and try again."
        },
        { status: 404 }
      );
    }

    // Check certificate status
    if (certificate.status !== "active") {
      return NextResponse.json({
        valid: false,
        status: certificate.status,
        certificate_number: certificate.certificate_number,
        message: certificate.status === "revoked"
          ? "This certificate has been revoked."
          : "This certificate is no longer active."
      });
    }

    // Get the user's name for display (limited info for privacy)
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, rid_member_number")
      .eq("id", certificate.user_id)
      .single();

    // Format learning objectives for display
    const learningObjectives = certificate.learning_objectives_achieved || [];
    const formattedObjectives = Array.isArray(learningObjectives)
      ? learningObjectives.map((obj: any) => obj.objective || obj)
      : [];

    // Return verified certificate info (public data only)
    return NextResponse.json({
      valid: true,
      verified: true,
      certificate: {
        certificate_number: certificate.certificate_number,
        activity_code: (certificate as any).activity_code || null,
        title: certificate.title,
        description: certificate.description,
        ceu_value: certificate.ceu_value,
        rid_category: certificate.rid_category,
        learning_objectives: formattedObjectives,
        assessment_passed: certificate.assessment_passed,
        completed_at: certificate.completed_at,
        issued_at: certificate.issued_at,
        issued_by: certificate.issued_by,
        sponsor_number: certificate.sponsor_number,
        status: certificate.status
      },
      holder: {
        name: profile?.full_name || "Certificate Holder",
        rid_member_number: profile?.rid_member_number || null
      },
      verification: {
        verified_at: new Date().toISOString(),
        verification_url: `https://interpretreflect.com/verify/${certificate.certificate_number}`,
        message: "This certificate is valid and was issued by InterpretReflect (RID Sponsor #2309)."
      }
    });

  } catch (error: any) {
    console.error("Certificate verification error:", error);
    return NextResponse.json(
      {
        valid: false,
        error: "Verification failed",
        message: "An error occurred while verifying the certificate. Please try again."
      },
      { status: 500 }
    );
  }
}
