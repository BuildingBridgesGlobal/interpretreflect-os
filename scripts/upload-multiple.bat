@echo off
REM Batch script to upload multiple PDFs at once
REM Edit the file paths and titles below, then run: npm run upload-books

echo Starting PDF uploads...
echo.

REM Example uploads - edit these with your actual book paths and titles
npx tsx scripts/upload-pdf.ts "C:\Users\maddo\Desktop\interpreter_books\medical-interpreting.pdf" "Medical Interpreting Guide" "medical_terminology"

npx tsx scripts/upload-pdf.ts "C:\Users\maddo\Desktop\interpreter_books\asl-linguistics.pdf" "ASL Linguistics" "sign_language"

npx tsx scripts/upload-pdf.ts "C:\Users\maddo\Desktop\interpreter_books\interpreter-ethics.pdf" "Professional Ethics for Interpreters" "interpreter_theory"

echo.
echo All uploads complete!
pause
