from dataclasses import dataclass
from pathlib import Path

import pymupdf


@dataclass(frozen=True)
class ExtractedPage:
    page_number: int
    text: str


def extract_pdf_pages(path: Path) -> list[ExtractedPage]:
    pages: list[ExtractedPage] = []

    with pymupdf.open(path) as document:
        for page_number, page in enumerate(document, start=1):
            pages.append(
                ExtractedPage(
                    page_number=page_number,
                    text=page.get_text("text").strip(),
                )
            )

    if not any(page.text for page in pages):
        raise ValueError("PDF has no extractable text; OCR-only PDFs are not supported")

    return pages
