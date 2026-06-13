import { QDRANT_COLLECTIONS, type AskResponse, type SupportedLanguage } from '@medinfo/shared';
import { embeddings, qdrant, text } from '../context.js';

const LANG_NAMES: Record<SupportedLanguage, string> = {
  nl: 'Dutch', fr: 'French', de: 'German', en: 'English', ar: 'Arabic', tr: 'Turkish',
};

/**
 * Answer a question strictly from a medicine's leaflet chunks (RAG). The question
 * may be in any supported language; we embed it (cross-lingual model), retrieve
 * the most relevant chunks, and ask the text model to answer ONLY from them,
 * citing the sections used. Refuses to invent dosing/safety information.
 */
export async function askLeaflet(
  medicineId: string,
  question: string,
  lang: SupportedLanguage,
): Promise<AskResponse> {
  const [vector] = await embeddings.embed([question]);
  const hits = vector
    ? await qdrant.search(QDRANT_COLLECTIONS.leafletChunks, {
        vector,
        limit: 6,
        with_payload: true,
        filter: { must: [{ key: 'medicineId', match: { value: medicineId } }] },
      })
    : [];

  if (hits.length === 0) {
    return {
      answer: NO_INFO[lang],
      citations: [],
      language: lang,
    };
  }

  const context = hits
    .map((h, i) => `[${i + 1}] (${String(h.payload?.sectionKey ?? 'other')}) ${String(h.payload?.text ?? '')}`)
    .join('\n\n');

  const system = [
    `You are a careful assistant answering questions about a medicine, in ${LANG_NAMES[lang]}.`,
    'Answer ONLY using the numbered leaflet excerpts provided. If the answer is not in them,',
    'say you cannot find it in the leaflet and advise asking a pharmacist or doctor.',
    'Never invent dosing, interactions, or safety information. Be concise and plain.',
  ].join(' ');
  const answer = (
    await text.complete({
      system,
      prompt: `Question: ${question}\n\nLeaflet excerpts:\n${context}`,
      maxTokens: 700,
    })
  ).trim();

  // Cite the distinct sections the retrieved chunks came from.
  const citations = [...new Set(hits.map((h) => String(h.payload?.sectionKey ?? 'other')))].map((sectionKey) => ({
    sectionKey,
  }));

  return { answer, citations, language: lang };
}

const NO_INFO: Record<SupportedLanguage, string> = {
  nl: 'Ik vind hierover geen informatie in de bijsluiter. Vraag het aan uw apotheker of arts.',
  fr: 'Je ne trouve pas cette information dans la notice. Demandez à votre pharmacien ou médecin.',
  de: 'Ich finde dazu keine Information im Beipackzettel. Fragen Sie Ihren Apotheker oder Arzt.',
  en: 'I cannot find this in the leaflet. Please ask your pharmacist or doctor.',
  ar: 'لا أجد هذه المعلومة في النشرة. اسأل الصيدلي أو الطبيب.',
  tr: 'Bunu prospektüste bulamıyorum. Lütfen eczacınıza veya doktorunuza sorun.',
};
