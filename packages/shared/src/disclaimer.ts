import type { SupportedLanguage } from './languages.js';

/**
 * Regulatory disclaimer. Rendered pinned to the bottom of the app at all times,
 * in the user's selected language. The text states the app is informational only,
 * reformats official leaflets, and does not replace professional medical advice.
 */
export const DISCLAIMER: Record<SupportedLanguage, string> = {
  en: 'This app reformats official package leaflets to make them easier to read. It is for information only and does not replace advice from your doctor or pharmacist. Always read the original leaflet and consult a healthcare professional before taking any medicine.',
  nl: 'Deze app herschrijft officiële bijsluiters voor een betere leesbaarheid. Ze dient alleen ter informatie en vervangt geen advies van uw arts of apotheker. Lees altijd de originele bijsluiter en raadpleeg een zorgverlener voordat u een geneesmiddel inneemt.',
  fr: 'Cette application reformule les notices officielles pour en faciliter la lecture. Elle est fournie à titre informatif uniquement et ne remplace pas l’avis de votre médecin ou pharmacien. Lisez toujours la notice originale et consultez un professionnel de santé avant de prendre un médicament.',
  de: 'Diese App formatiert offizielle Beipackzettel für eine bessere Lesbarkeit. Sie dient nur zur Information und ersetzt nicht den Rat Ihres Arztes oder Apothekers. Lesen Sie immer den Originaltext und konsultieren Sie eine medizinische Fachkraft, bevor Sie ein Arzneimittel einnehmen.',
  ar: 'يعيد هذا التطبيق صياغة النشرات الدوائية الرسمية لتسهيل قراءتها. وهو لأغراض المعلومات فقط ولا يغني عن استشارة طبيبك أو الصيدلي. اقرأ دائمًا النشرة الأصلية واستشر مختصًا في الرعاية الصحية قبل تناول أي دواء.',
  tr: 'Bu uygulama resmi prospektüsleri daha okunabilir hale getirmek için yeniden biçimlendirir. Yalnızca bilgilendirme amaçlıdır ve doktorunuzun veya eczacınızın tavsiyesinin yerini tutmaz. Herhangi bir ilacı almadan önce daima orijinal prospektüsü okuyun ve bir sağlık uzmanına danışın.',
};
