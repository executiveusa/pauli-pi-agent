/**
 * Document Scraper Module
 * Exports: web scraper, PDF extractor, and document parsers
 */

export type { IngestionResult, ProcessedSource } from "./ingestor.js";
export { createSourceIngestor, SourceIngestor } from "./ingestor.js";
export type { DocumentMetadata, ParsedDocument } from "./parser.js";
export { createDocumentParser, DocumentParser } from "./parser.js";
export type { PdfExtractionResult, PdfPage } from "./pdf.js";
export { createPdfExtractor, PdfExtractor } from "./pdf.js";
export type { LinkInfo, ScrapedPage, WebScrapingResult } from "./web.js";
export { createWebScraper, WebScraper } from "./web.js";
