import { extractText, getDocumentProxy } from "unpdf";

export async function extractTextFromPdf(buffer: ArrayBuffer): Promise<{
  text: string;
  totalPages: number;
}> {
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const result = await extractText(pdf, { mergePages: true });
  return {
    text: result.text,
    totalPages: result.totalPages,
  };
}
