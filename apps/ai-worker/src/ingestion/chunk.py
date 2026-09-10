from dataclasses import dataclass

from .extract_pdf import ExtractedPage

MAX_CHUNK_CHARACTERS = 1_200
OVERLAP_WORDS = 30


@dataclass(frozen=True)
class ExtractedChunk:
    page_number: int
    chunk_index: int
    content: str


def chunk_pages(pages: list[ExtractedPage]) -> list[ExtractedChunk]:
    chunks: list[ExtractedChunk] = []
    chunk_index = 0

    for page in pages:
        words = page.text.split()
        start = 0

        while start < len(words):
            end = start
            length = 0

            while end < len(words):
                word = words[end]
                next_length = length + len(word) + (1 if length else 0)

                if length and next_length > MAX_CHUNK_CHARACTERS:
                    break

                length = next_length
                end += 1

            content = " ".join(words[start:end]).strip()

            if content:
                chunks.append(
                    ExtractedChunk(
                        page_number=page.page_number,
                        chunk_index=chunk_index,
                        content=content,
                    )
                )
                chunk_index += 1

            if end >= len(words):
                break

            start = max(start + 1, end - OVERLAP_WORDS)

    return chunks
