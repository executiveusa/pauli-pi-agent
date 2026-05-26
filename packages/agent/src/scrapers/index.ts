/**
 * Document Scraper Module
 * Exports: web scraper, PDF extractor, and document parsers
 */

export { WebScraper, createWebScraper } from "./web.js";
export type { WebScrapingResult, ScrapedPage, LinkInfo } from "./web.js";

export { PdfExtractor, createPdfExtractor } from "./pdf.js";
export type { PdfExtractionResult, PdfPage } from "./pdf.js";

export { DocumentParser, createDocumentParser } from "./parser.js";
export type { ParsedDocument, DocumentMetadata } from "./parser.js";

export { SourceIngestor, createSourceIngestor } from "./ingestor.js";
export type { IngestionResult, ProcessedSource } from "./ingestor.js";
