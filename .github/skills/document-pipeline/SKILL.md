---
name: document-pipeline
description: "Use when implementing upload, file validation, page counting, previews, DOCX/PPTX/XLSX conversion, malware scanning, storage, retention, or document deletion for Ping & Print."
argument-hint: "Describe the document format or upload behavior"
---

# Document Pipeline

1. Enforce a documented size limit, currently 20 MB, on both client and server.
2. Validate extension, declared MIME type, and file signature; never trust the filename alone.
3. Allow PDF, DOC/DOCX, PPT/PPTX, XLS/XLSX, JPG/JPEG, PNG, and optionally TXT only when a converter exists.
4. Generate page count and a first-page preview in a worker or bounded server process.
5. Store files privately and issue short-lived signed URLs only when needed.
6. Scan or sandbox office documents before conversion, and reject malformed or encrypted files with a useful message.
7. Delete temporary and source files after printing or a short retention expiry; retain metadata without document contents.
8. Test large files, invalid signatures, unsupported formats, conversion failures, and interrupted uploads.
