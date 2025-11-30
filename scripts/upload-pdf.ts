/**
 * Script to upload PDFs to Elya's knowledge base
 *
 * Usage:
 * npx tsx scripts/upload-pdf.ts "path/to/your/file.pdf" "Document Title" "category"
 *
 * Example:
 * npx tsx scripts/upload-pdf.ts "./books/medical-interpreting.pdf" "Medical Interpreting Guide" "medical_terminology"
 */

import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import pdf from "pdf-parse";
import fs from "fs";
import path from "path";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Helper function to chunk text
function chunkText(text: string, chunkSize: number = 1000, overlap: number = 200): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end));
    start += chunkSize - overlap;
  }

  return chunks;
}

// Helper function to create embeddings
async function createEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: text,
  });
  return response.data[0].embedding;
}

async function uploadPDF(filePath: string, title: string, category: string = "general") {
  try {
    console.log(`\n📄 Processing: ${filePath}`);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    // Read PDF file
    const dataBuffer = fs.readFileSync(filePath);

    // Extract text from PDF
    console.log("📖 Extracting text from PDF...");
    const pdfData = await pdf(dataBuffer);
    const fullText = pdfData.text;
    const pageCount = pdfData.numpages;

    if (!fullText || fullText.trim().length === 0) {
      throw new Error("PDF contains no extractable text");
    }

    console.log(`✓ Extracted ${fullText.length} characters from ${pageCount} pages`);

    // Create document record
    console.log("💾 Creating document record...");
    const { data: document, error: docError } = await supabase
      .from("knowledge_documents")
      .insert({
        title,
        file_name: path.basename(filePath),
        file_type: "pdf",
        uploaded_by: null, // System upload
        category,
        page_count: pageCount,
        metadata: {
          uploadedAt: new Date().toISOString(),
          uploadedVia: "script",
        },
      })
      .select()
      .single();

    if (docError || !document) {
      throw new Error(`Failed to create document: ${docError?.message}`);
    }

    console.log(`✓ Document created with ID: ${document.id}`);

    // Chunk the text
    const chunks = chunkText(fullText, 1000, 200);
    console.log(`✂️  Created ${chunks.length} chunks`);

    // Process chunks in batches
    const batchSize = 10;
    let processedChunks = 0;

    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);

      process.stdout.write(`\r🔄 Processing chunks: ${processedChunks}/${chunks.length}`);

      // Create embeddings for this batch
      const chunksWithEmbeddings = await Promise.all(
        batch.map(async (chunk, batchIndex) => {
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
        })
      );

      // Insert chunks into database
      const { error: chunkError } = await supabase
        .from("knowledge_chunks")
        .insert(chunksWithEmbeddings);

      if (chunkError) {
        console.error(`\n❌ Error inserting batch ${i}-${i + batch.length}:`, chunkError);
      }

      processedChunks += batch.length;
    }

    console.log(`\n✅ Successfully uploaded: ${title}`);
    console.log(`   • Document ID: ${document.id}`);
    console.log(`   • Pages: ${pageCount}`);
    console.log(`   • Chunks: ${chunks.length}`);
    console.log(`   • Category: ${category}`);

  } catch (error: any) {
    console.error("\n❌ Upload failed:", error.message);
    throw error;
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log(`
📚 Elya Knowledge Base PDF Upload Script

Usage:
  npx tsx scripts/upload-pdf.ts <file-path> <title> [category]

Arguments:
  file-path   Path to the PDF file
  title       Title of the document
  category    (Optional) Category: general, medical_terminology, legal_interpreting, interpreter_theory, etc.

Example:
  npx tsx scripts/upload-pdf.ts "./books/medical-interpreting.pdf" "Medical Interpreting Guide" "medical_terminology"
    `);
    process.exit(1);
  }

  const [filePath, title, category = "general"] = args;

  await uploadPDF(filePath, title, category);
}

main().catch(console.error);
