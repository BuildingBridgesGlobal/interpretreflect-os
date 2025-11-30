/**
 * Batch upload script for all PDFs in the interpreter_books folder
 *
 * This will:
 * - Find all PDF files (skip EPUBs)
 * - Skip duplicates based on similar titles
 * - Auto-categorize books based on their titles
 * - Upload them all with progress tracking
 *
 * Usage:
 * npx tsx scripts/upload-all-books.ts
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

const BOOKS_FOLDER = "C:\\Users\\maddo\\Desktop\\interpreter_books";

// Helper to categorize based on filename
function categorizeBook(filename: string): string {
  const lower = filename.toLowerCase();

  if (lower.includes('legal') || lower.includes('court')) return 'legal_interpreting';
  if (lower.includes('conference')) return 'conference_interpreting';
  if (lower.includes('remote') || lower.includes('vrs')) return 'remote_interpreting';
  if (lower.includes('medical') || lower.includes('healthcare')) return 'medical_terminology';
  if (lower.includes('ethics') || lower.includes('ethical')) return 'ethics';
  if (lower.includes('technology') || lower.includes('ai') || lower.includes('machine')) return 'technology';
  if (lower.includes('research') || lower.includes('method')) return 'research_methods';
  if (lower.includes('teaching') || lower.includes('pedagogy')) return 'education';
  if (lower.includes('chinese') || lower.includes('korean') || lower.includes('language')) return 'language_specific';

  return 'interpreter_theory';
}

// Helper to clean up title
function cleanTitle(filename: string): string {
  // Remove file extension
  let title = filename.replace(/\.pdf$/i, '');

  // Remove author and publisher info (common patterns)
  title = title.replace(/--[^-]+--\d{4}--[^-]+$/i, ''); // Remove "-- Author -- Year -- Publisher"
  title = title.replace(/_/g, ' '); // Replace underscores with spaces
  title = title.replace(/\s+/g, ' ').trim(); // Clean up multiple spaces

  return title;
}

// Check if book is already uploaded
async function isAlreadyUploaded(title: string): Promise<boolean> {
  const { data } = await supabase
    .from('knowledge_documents')
    .select('id, title')
    .ilike('title', `%${title.substring(0, 30)}%`)
    .limit(1);

  return (data && data.length > 0) || false;
}

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

async function uploadPDF(filePath: string, title: string, category: string) {
  try {
    // Read PDF file
    const dataBuffer = fs.readFileSync(filePath);

    // Extract text from PDF
    const pdfData = await pdf(dataBuffer);
    const fullText = pdfData.text;
    const pageCount = pdfData.numpages;

    if (!fullText || fullText.trim().length === 0) {
      throw new Error("PDF contains no extractable text");
    }

    // Create document record
    const { data: document, error: docError } = await supabase
      .from("knowledge_documents")
      .insert({
        title,
        file_name: path.basename(filePath),
        file_type: "pdf",
        uploaded_by: null,
        category,
        page_count: pageCount,
        metadata: {
          uploadedAt: new Date().toISOString(),
          uploadedVia: "batch-script",
        },
      })
      .select()
      .single();

    if (docError || !document) {
      throw new Error(`Failed to create document: ${docError?.message}`);
    }

    // Chunk the text
    const chunks = chunkText(fullText, 1000, 200);

    // Process chunks in batches
    const batchSize = 10;

    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);

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

      await supabase.from("knowledge_chunks").insert(chunksWithEmbeddings);
    }

    return { success: true, chunks: chunks.length, pages: pageCount };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('📚 InterpretReflect Knowledge Base Batch Uploader\n');
  console.log(`Looking for PDFs in: ${BOOKS_FOLDER}\n`);

  // Get all files
  const allFiles = fs.readdirSync(BOOKS_FOLDER);

  // Filter to only PDFs
  const pdfFiles = allFiles.filter(f => f.toLowerCase().endsWith('.pdf'));

  console.log(`Found ${pdfFiles.length} PDF files (${allFiles.length - pdfFiles.length} non-PDFs skipped)\n`);

  // Track duplicates
  const seenTitles = new Set<string>();
  const toUpload: Array<{ file: string; title: string; category: string }> = [];

  // Process each file
  for (const file of pdfFiles) {
    const cleanedTitle = cleanTitle(file);
    const titleKey = cleanedTitle.toLowerCase().substring(0, 40);

    // Skip duplicates
    if (seenTitles.has(titleKey)) {
      console.log(`⏭️  Skipping duplicate: ${file}`);
      continue;
    }

    seenTitles.add(titleKey);

    // Check if already uploaded
    const alreadyExists = await isAlreadyUploaded(cleanedTitle);
    if (alreadyExists) {
      console.log(`✓ Already uploaded: ${cleanedTitle}`);
      continue;
    }

    const category = categorizeBook(file);
    toUpload.push({ file, title: cleanedTitle, category });
  }

  console.log(`\n📤 Will upload ${toUpload.length} new books\n`);

  if (toUpload.length === 0) {
    console.log('All books are already uploaded! ✅\n');
    return;
  }

  // Upload each book
  let successful = 0;
  let failed = 0;

  for (let i = 0; i < toUpload.length; i++) {
    const { file, title, category } = toUpload[i];
    const filePath = path.join(BOOKS_FOLDER, file);

    console.log(`\n[${i + 1}/${toUpload.length}] 📖 ${title}`);
    console.log(`   Category: ${category}`);

    const result = await uploadPDF(filePath, title, category);

    if (result.success) {
      console.log(`   ✅ Success! ${result.pages} pages, ${result.chunks} chunks`);
      successful++;
    } else {
      console.log(`   ❌ Failed: ${result.error}`);
      failed++;
    }
  }

  console.log(`\n\n📊 Summary:`);
  console.log(`   ✅ Successful: ${successful}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📚 Total books in knowledge base: ${successful + failed}`);
  console.log(`\nDone! Elya now has access to all this knowledge. 🎉\n`);
}

main().catch(console.error);
