/**
 * StudyVerse - Syllabus Upload
 * =============================
 * 
 * Purpose: Handle PDF syllabus upload for AI context
 * 
 * FEATURES:
 * --------
 * 1. **PDF Upload**: Custom styled file input
 * 2. **File Validation**: Ensures only PDF files accepted
 * 3. **Loading State**: Disabled button during upload
 * 4. **AI Integration**: Uploaded syllabus used as context for AI chat
 * 
 * FLOW:
 * -----
 * 1. User clicks "Upload PDF" button
 * 2. Hidden file input triggered
 * 3. User selects PDF file
 * 4. File type validated (must be application/pdf)
 * 5. Form submitted to /syllabus/upload endpoint
 * 6. Backend extracts text from PDF
 * 7. Text stored in database for AI context
 * 8. Success message displayed
 * 
 * BACKEND PROCESSING:
 * ------------------
 * - PDF text extraction using PyPDF2 or pdfplumber
 * - Text stored in Syllabus model
 * - Associated with current user
 * - Used as context for AI chat responses
 * 
 * FILE VALIDATION:
 * ---------------
 * - Client-side: Check MIME type (application/pdf)
 * - Server-side: Verify file extension and content
 * - Size limit: Enforced by Flask config
 */

// ============================================================================
// SYLLABUS UPLOAD FUNCTIONALITY
// ============================================================================

// Syllabus JavaScript

document.addEventListener('DOMContentLoaded', () => {
    const uploadPdf = document.getElementById('uploadPdf');
    const pdfInput = document.getElementById('pdfInput');
    const form = document.getElementById('syllabusUploadForm');


    if (uploadPdf) {
        uploadPdf.addEventListener('click', () => {
            pdfInput.click();
        });
    }

    if (pdfInput) {
        pdfInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file && file.type === 'application/pdf') {
                // Real upload: submit the form to Flask route (/syllabus/upload)
                if (uploadPdf) {
                    uploadPdf.disabled = true;
                    uploadPdf.textContent = 'Uploading...';
                }
                form?.submit();
            }
        });
    }
});