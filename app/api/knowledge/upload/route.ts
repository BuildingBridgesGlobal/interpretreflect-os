import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// pdf-parse doesn't have proper ESM exports, use dynamic require
const pdfParse = require("pdf-parse");

const supabase = supabaseAdmin;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Helper function to chunk text into smaller pieces
function chunkText(text: string, chunkSize: number = 1000, overlap: number = 200): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end));
    start += chunkSize - overlap; // Overlap for context continuity
  }

  return chunks;
}

// Helper function to create embeddings for a chunk
async function createEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: text,
  });
  return response.data[0].embedding;
}

export async function POST(req: NextRequest) {
  try {
    // Check if user is admin
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabase.auth.getUser(token);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    // Parse form data
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const title = formData.get("title") as string;
    const category = formData.get("category") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDF files are supported" }, { status: 400 });
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract text from PDF
    const pdfData = await pdfParse(buffer);
    const fullText = pdfData.text;
    const pageCount = pdfData.numpages;

    if (!fullText || fullText.trim().length === 0) {
      return NextResponse.json({ error: "PDF contains no extractable text" }, { status: 400 });
    }

    // Create document record
    const { data: document, error: docError } = await supabase
      .from("knowledge_documents")
      .insert({
        title: title || file.name,
        file_name: file.name,
        file_type: "pdf",
        uploaded_by: user.id,
        category: category || "general",
        page_count: pageCount,
        metadata: {
          size: file.size,
          uploadedAt: new Date().toISOString(),
        },
      })
      .select()
      .single();

    if (docError || !document) {
      console.error("Error creating document:", docError);
      return NextResponse.json({ error: "Failed to create document record" }, { status: 500 });
    }

    // Chunk the text
    const chunks = chunkText(fullText, 1000, 200);
    console.log(`Created ${chunks.length} chunks from PDF`);

    // Process chunks in batches to avoid rate limits
    const batchSize = 10;
    let processedChunks = 0;

    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);

      // Create embeddings for this batch
      const embeddingPromises = batch.map(async (chunk, batchIndex) => {
        const embedding = await createEmbedding(chunk);

        return {
          document_id: document.id,
          chunk_text: chunk,
          chunk_index: i + batchIndex,
          embedding: embedding,
          metadata: {
            length: chunk.length,
          },
        };
      });

      const chunksWithEmbeddings = await Promise.all(embeddingPromises);

      // Insert chunks into database
      const { error: chunkError } = await supabase
        .from("knowledge_chunks")
        .insert(chunksWithEmbeddings);

      if (chunkError) {
        console.error("Error inserting chunks:", chunkError);
        // Continue processing other chunks even if one batch fails
      }

      processedChunks += batch.length;
      console.log(`Processed ${processedChunks}/${chunks.length} chunks`);
    }

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        title: document.title,
        pageCount,
        chunkCount: chunks.length,
      },
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process PDF" },
      { status: 500 }
    );
  }
}

// GET endpoint to list all knowledge documents
export async function GET(req: NextRequest) {
  try {
    const { data: documents, error } = await supabase
      .from("knowledge_documents")
      .select(`
        id,
        title,
        file_name,
        category,
        upload_date,
        page_count,
        is_active
      `)
      .eq("is_active", true)
      .order("upload_date", { ascending: false });

    if (error) {
      throw error;
    }

    // Get chunk counts for each document
    const documentsWithCounts = await Promise.all(
      documents.map(async (doc) => {
        const { count } = await supabase
          .from("knowledge_chunks")
          .select("*", { count: "exact", head: true })
          .eq("document_id", doc.id);

        return {
          ...doc,
          chunkCount: count || 0,
        };
      })
    );

    return NextResponse.json({ documents: documentsWithCounts });
  } catch (error: any) {
    console.error("List error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to list documents" },
      { status: 500 }
    );
  }
}
