import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

const resources = {
  en: {
    translation: {
      app: {
        title: "Crop Disease & Pest Classifier",
        subtitle: "Instant diagnosis, Grad-CAM attention heatmap, and agronomic advice",
      },
      nav: {
        history: "History",
        clearHistory: "Clear History",
        darkMode: "Toggle dark mode",
        language: "Language",
      },
      upload: {
        dropzoneText: "Drag and drop leaf or pest photo here",
        orBrowse: "or browse from your device",
        cameraBtn: "Take photo",
        browseBtn: "Browse file",
        fileHint: "JPEG, PNG, WebP or BMP up to 10 MB",
        analyzing: "Analyzing with deep learning model...",
      },
      result: {
        diagnosisTitle: "Diagnosis Result",
        confidence: "Confidence",
        top3Title: "Top-3 Candidates",
        heatmapToggle: "Grad-CAM Heatmap",
        heatmapOpacity: "Heatmap Opacity",
        uncertainBanner: "Low confidence / unsure result. Inspect closer or consult extension officer.",
        oodBanner: "This does not look like a recognised crop disease or pest. Please upload a clear photo of plant foliage or fruit.",
        healthyTag: "Healthy",
        processingTime: "Inference time",
      },
      advice: {
        title: "Agronomic Advice",
        symptoms: "Symptoms",
        organic: "Organic Treatment",
        chemical: "Chemical Treatment",
        prevention: "Prevention",
        healthyNote: "Plant appears healthy. Continue regular field maintenance and crop rotation.",
        disclaimer: "Disclaimer: Recommendations are informational. Always verify with local agricultural extension before spraying chemicals.",
      },
      feedback: {
        question: "Was this diagnosis correct?",
        yes: "Yes, looks correct",
        no: "No, incorrect",
        submitCorrection: "Submit correction",
        correctClassPlaceholder: "Select actual condition...",
        commentPlaceholder: "Optional notes for model retraining...",
        thankYou: "Thank you for helping improve the model!",
      },
      history: {
        title: "Scan History",
        empty: "No past scans yet. Upload an image to start.",
      },
      errors: {
        uploadFailed: "Upload failed. Please check network connection and try again.",
        unsupportedFile: "Unsupported file type. Please upload a valid image.",
      },
    },
  },
  hi: {
    translation: {
      app: {
        title: "फसल रोग एवं कीट पहचानकर्ता",
        subtitle: "त्वरित पहचान, ग्रैड-कैम हीटमैप और कृषि उपचार सलाह",
      },
      nav: {
        history: "इतिहास",
        clearHistory: "इतिहास साफ़ करें",
        darkMode: "डार्क मोड",
        language: "भाषा",
      },
      upload: {
        dropzoneText: "पत्ती या कीट की फोटो यहाँ खींचें",
        orBrowse: "या डिवाइस से चुनें",
        cameraBtn: "फोटो लें",
        browseBtn: "फ़ाइल चुनें",
        fileHint: "JPEG, PNG, WebP या BMP अधिकतम 10 MB",
        analyzing: "विश्लेषण किया जा रहा है...",
      },
      result: {
        diagnosisTitle: "निदान परिणाम",
        confidence: "विश्वास स्तर",
        top3Title: "शीर्ष 3 संभावनाएं",
        heatmapToggle: "ग्रैड-कैम हीटमैप",
        heatmapOpacity: "हीटमैप पारदर्शिता",
        uncertainBanner: "कम विश्वास। कृपया कृषि विशेषज्ञ से सलाह लें।",
        oodBanner: "यह पौधे का ज्ञात रोग नहीं लगता। कृपया स्पष्ट पत्ती की फोटो अपलोड करें।",
        healthyTag: "स्वस्थ",
        processingTime: "समय",
      },
      advice: {
        title: "कृषि उपचार सलाह",
        symptoms: "लक्षण",
        organic: "जैविक उपचार",
        chemical: "रासायनिक उपचार",
        prevention: "रोकथाम",
        healthyNote: "फसल स्वस्थ दिख रही है। नियमित देखभाल जारी रखें।",
        disclaimer: "अस्वीकरण: रासायनिक छिड़काव से पहले स्थानीय कृषि अधिकारी से पुष्टि करें।",
      },
      feedback: {
        question: "क्या यह पहचान सही थी?",
        yes: "हाँ, सही है",
        no: "नहीं, गलत है",
        submitCorrection: "सुधार सबमिट करें",
        correctClassPlaceholder: "सही स्थिति चुनें...",
        commentPlaceholder: "वैकल्पिक टिप्पणी...",
        thankYou: "मॉडल को बेहतर बनाने में मदद के लिए धन्यवाद!",
      },
      history: {
        title: "स्कैन इतिहास",
        empty: "अभी तक कोई स्कैन नहीं।",
      },
      errors: {
        uploadFailed: "अपलोड विफल रहा। कृपया पुनः प्रयास करें।",
        unsupportedFile: "अमान्य फ़ाइल प्रकार।",
      },
    },
  },
  es: {
    translation: {
      app: {
        title: "Clasificador de Enfermedades y Plagas",
        subtitle: "Diagnóstico instantáneo, mapa de calor Grad-CAM y asesoramiento agronómico",
      },
      nav: {
        history: "Historial",
        clearHistory: "Borrar Historial",
        darkMode: "Modo oscuro",
        language: "Idioma",
      },
      upload: {
        dropzoneText: "Arrastra y suelta la foto de la hoja o plaga",
        orBrowse: "o busca en tu dispositivo",
        cameraBtn: "Tomar foto",
        browseBtn: "Buscar archivo",
        fileHint: "JPEG, PNG, WebP o BMP hasta 10 MB",
        analyzing: "Analizando con modelo de aprendizaje profundo...",
      },
      result: {
        diagnosisTitle: "Resultado del Diagnóstico",
        confidence: "Confianza",
        top3Title: "Top-3 Candidatos",
        heatmapToggle: "Mapa de Calor Grad-CAM",
        heatmapOpacity: "Opacidad",
        uncertainBanner: "Baja confianza. Inspeccione más de cerca o consulte a un agrónomo.",
        oodBanner: "No parece ser una enfermedad o plaga vegetal reconocida.",
        healthyTag: "Saludable",
        processingTime: "Tiempo de inferencia",
      },
      advice: {
        title: "Consejo Agronómico",
        symptoms: "Síntomas",
        organic: "Tratamiento Orgánico",
        chemical: "Tratamiento Químico",
        prevention: "Prevención",
        healthyNote: "La planta parece sana. Continúe con el mantenimiento habitual.",
        disclaimer: "Descargo de responsabilidad: Verifique siempre con el asesor agrícola local.",
      },
      feedback: {
        question: "¿Fue correcto este diagnóstico?",
        yes: "Sí, es correcto",
        no: "No, incorrecto",
        submitCorrection: "Enviar corrección",
        correctClassPlaceholder: "Seleccionar condición real...",
        commentPlaceholder: "Notas opcionales...",
        thankYou: "¡Gracias por ayudarnos a mejorar el modelo!",
      },
      history: {
        title: "Historial de Escaneos",
        empty: "No hay escaneos anteriores.",
      },
      errors: {
        uploadFailed: "Error al subir. Revise su conexión.",
        unsupportedFile: "Tipo de archivo no compatible.",
      },
    },
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
    },
  });

export default i18n;

