export interface CropOption {
  id: string;
  name: string;
  hindi: string;
  emoji: string;
}

export const CROP_OPTIONS: CropOption[] = [
  { id: "all", name: "Auto-Detect", hindi: "सभी फसलें (अनुशंसित)", emoji: "🔍" },
  { id: "Tomato", name: "Tomato", hindi: "टमाटर", emoji: "🍅" },
  { id: "Potato", name: "Potato", hindi: "आलू", emoji: "🥔" },
  { id: "Corn", name: "Corn / Maize", hindi: "मक्का", emoji: "🌽" },
  { id: "Apple", name: "Apple", hindi: "सेब", emoji: "🍎" },
  { id: "Grape", name: "Grape", hindi: "अंगूर", emoji: "🍇" },
  { id: "Pepper_bell", name: "Pepper Bell", hindi: "शिमला मिर्च", emoji: "🫑" },
  { id: "Squash", name: "Squash", hindi: "कद्दू / तोरी", emoji: "🎃" },
  { id: "Strawberry", name: "Strawberry", hindi: "स्ट्रॉबेरी", emoji: "🍓" },
  { id: "Cherry", name: "Cherry", hindi: "चेरी", emoji: "🍒" },
  { id: "Peach", name: "Peach", hindi: "आड़ू", emoji: "🍑" },
  { id: "Orange", name: "Orange", hindi: "संतरा", emoji: "🍊" },
  { id: "Blueberry", name: "Blueberry", hindi: "ब्लूबेरी", emoji: "🫐" },
  { id: "Soybean", name: "Soybean", hindi: "सोयाबीन", emoji: "🌱" },
];

export interface PathogenDetail {
  pathogen: string;
  diagnosis: string;
  farmersAdvice: string;
}

export const PATHOGEN_DETAILS: Record<string, PathogenDetail> = {
  "Tomato___Bacterial_spot": {
    pathogen: "Xanthomonas vesicatoria",
    diagnosis:
      "Tomato Bacterial Spot is caused by Xanthomonas vesicatoria. It creates small, water-soaked spots that turn dark brown with yellow halos on leaves. On fruit, it produces raised, scabby, dark spots that reduce quality and marketability. The bacteria spread rapidly through rain, irrigation splash, and infected tools.",
    farmersAdvice:
      "Bacterial spot spreads fastest during rainy weather. Start copper sprays now and your tomato crop can still produce a good yield this season!",
  },
  "Tomato___Early_blight": {
    pathogen: "Alternaria solani",
    diagnosis:
      "Early Blight is caused by the fungal pathogen Alternaria solani. It produces characteristic dark brown circular spots with concentric target-board rings, typically beginning on older lower foliage before spreading upward.",
    farmersAdvice:
      "Early blight starts on the lower leaves touching wet soil. Prune the bottom 10-12 inches of infected leaves and apply organic mulch to block rain splash!",
  },
  "Tomato___Late_blight": {
    pathogen: "Phytophthora infestans",
    diagnosis:
      "Late Blight is caused by the oomycete Phytophthora infestans. It rapidly produces large, dark, water-soaked lesions on leaves and stems with white fungal mold under humid conditions, destroying crops in days.",
    farmersAdvice:
      "Late blight is aggressive in cool, foggy or wet weather. Remove severely struck plants immediately and apply protectant copper fungicide before rain!",
  },
  "Tomato___Leaf_Mold": {
    pathogen: "Passalora fulva",
    diagnosis:
      "Leaf Mold creates pale greenish-yellow spots on upper leaf surfaces accompanied by olive-green to brownish velvety mold beneath. It flourishes in high humidity environments.",
    farmersAdvice:
      "Leaf mold loves stagnant moist air. Improve greenhouse or tunnel ventilation to keep humidity below 85% to halt spore spread.",
  },
  "Tomato___Septoria_leaf_spot": {
    pathogen: "Septoria lycopersici",
    diagnosis:
      "Septoria leaf spot produces numerous small, circular lesions with dark brown borders and grayish-white sunken centers containing tiny dark pycnidia spore bodies.",
    farmersAdvice:
      "Never harvest or work in your tomato plot while leaves are wet. Spores easily hitch a ride on clothing and hands to healthy plants.",
  },
  "Tomato___Spider_mites": {
    pathogen: "Tetranychus urticae",
    diagnosis:
      "Two-spotted spider mites pierce leaf cells to suck plant sap, creating fine pale yellow stippling and webbing under hot, dry conditions.",
    farmersAdvice:
      "Spider mites multiply rapidly in dusty, dry weather. Spray leaf undersides with cold water or neem oil emulsion every 3-4 days to break their cycle.",
  },
  "Tomato___Target_Spot": {
    pathogen: "Corynespora cassiicola",
    diagnosis:
      "Target Spot causes brown circular lesions with distinct concentric rings and yellow halos on leaves, stems, and ripening fruit.",
    farmersAdvice:
      "Space plants generously to promote rapid morning drying, and avoid wetting foliage during irrigation.",
  },
  "Tomato___Yellow_Leaf_Curl_Virus": {
    pathogen: "Begomovirus (TYLCV)",
    diagnosis:
      "Tomato Yellow Leaf Curl is a viral pathology transmitted by sweetpotato whiteflies (Bemisia tabaci). It causes severe upward cupping, stunted bushy growth, and flower drop.",
    farmersAdvice:
      "Control whiteflies using yellow sticky cards and insect netting. Rogue out (destroy) heavily infected stunted plants to prevent infecting neighbors.",
  },
  "Tomato___Mosaic_virus": {
    pathogen: "Tobacco Mosaic Virus (TMV)",
    diagnosis:
      "Tomato Mosaic Virus causes mottled light and dark green mosaic patterns, blistering, and distortion on foliage, stunting plant development.",
    farmersAdvice:
      "TMV spreads through touch. Wash hands with soapy water before pruning and do not smoke near tomato plants.",
  },
  "Tomato___healthy": {
    pathogen: "None (Healthy Foliage)",
    diagnosis:
      "Your tomato plant exhibits vibrant green foliage, healthy cell turgor, and no signs of bacterial, fungal, or viral infection.",
    farmersAdvice:
      "Excellent job! Your tomato plant is in great condition. Continue balanced watering at root level and monitor weekly for early pests.",
  },
  "Potato___Early_blight": {
    pathogen: "Alternaria solani",
    diagnosis:
      "Potato Early Blight produces dark brown concentric ringed lesions surrounded by yellow chlorosis on mature leaves, reducing tuber yield.",
    farmersAdvice:
      "Ensure adequate nitrogen and potassium fertility; stressed plants are far more susceptible to early blight attack.",
  },
  "Potato___Late_blight": {
    pathogen: "Phytophthora infestans",
    diagnosis:
      "Late Blight causes rapidly expanding blackish-brown lesions with pale chlorotic borders. Tubers become infected from spores washed into soil.",
    farmersAdvice:
      "Hill soil generously around potato bases to protect growing tubers beneath from fungal spores washed down by rains.",
  },
  "Potato___healthy": {
    pathogen: "None (Healthy Foliage)",
    diagnosis:
      "Potato leaves show strong canopy growth, healthy chlorophyll synthesis, and complete freedom from blight or pest feeding.",
    farmersAdvice:
      "Your potato crop is thriving! Keep soil moisture consistent as tubers form to prevent hollow heart and scab.",
  },
  "Corn___Common_rust": {
    pathogen: "Puccinia sorghi",
    diagnosis:
      "Common Rust produces oval cinnamon-brown pustules on both upper and lower leaf surfaces that rupture to release powdery reddish-brown urediniospores.",
    farmersAdvice:
      "Rust develops rapidly in moderate temps (16-25°C) and high humidity. If lower canopy is infected before tasseling, treat with registered fungicide.",
  },
  "Corn___Gray_leaf_spot": {
    pathogen: "Cercospora zeae-maydis",
    diagnosis:
      "Gray Leaf Spot causes narrow rectangular lesions restricted by leaf veins that turn grayish-tan, severely limiting photosynthetic leaf area.",
    farmersAdvice:
      "Rotate with non-host crops like soybean or legumes for at least one full season to starve residue-borne fungal spores.",
  },
  "Corn___Northern_Leaf_Blight": {
    pathogen: "Exserohilum turcicum",
    diagnosis:
      "Northern Corn Leaf Blight creates long, cigar-shaped grayish-green to tan lesions that can coalesce and burn entire leaf sections.",
    farmersAdvice:
      "Plant hybrid varieties with high NCLB genetic resistance and bury crop residue after harvest.",
  },
  "Corn___healthy": {
    pathogen: "None (Healthy Foliage)",
    diagnosis:
      "Corn leaves show clean linear venation, uniform dark green color, and complete absence of rust pustules or blight lesions.",
    farmersAdvice:
      "Your corn crop looks vigorous! Ensure adequate nitrogen side-dressing during knee-high to tasseling stages.",
  },
  "Apple___Apple_scab": {
    pathogen: "Venturia inaequalis",
    diagnosis:
      "Apple Scab produces olive-green to dark velvety spots on leaves that turn brown and corky, causing premature leaf drop and fruit deformity.",
    farmersAdvice:
      "Rake and destroy fallen apple leaves in late autumn. Overwintered leaves on the ground are the primary source of next year's spring spores!",
  },
  "Apple___Black_rot": {
    pathogen: "Botryosphaeria obtusa",
    diagnosis:
      "Black rot causes 'frog-eye' leaf spots with purple margins and brown centers, branch cankers, and dark mummified fruit on the tree.",
    farmersAdvice:
      "Prune out dead wood, fire blight cankers, and mummified fruit during winter dormancy to eliminate the fungal reservoir.",
  },
  "Apple___Cedar_apple_rust": {
    pathogen: "Gymnosporangium juniperi-virginianae",
    diagnosis:
      "Cedar Apple Rust creates bright orange-yellow circular lesions with tiny black fungal dots on the upper surface and tube-like spore horns underneath.",
    farmersAdvice:
      "This disease requires nearby cedar or juniper trees to complete its life cycle. Apply protectant fungicide in spring when cedar galls form gelatinous horns.",
  },
  "Apple___healthy": {
    pathogen: "None (Healthy Foliage)",
    diagnosis:
      "Apple leaves display bright green foliage, clean leaf margins, and zero scab or rust lesions.",
    farmersAdvice:
      "Your apple orchard canopy looks great! Prune annually for good sunlight and spray neem or dormant oil before bud break.",
  },
  "Grape___Black_rot": {
    pathogen: "Guignardia bidwellii",
    diagnosis:
      "Grape Black Rot produces small reddish-brown circular spots with dark borders on foliage, later turning fruit clusters into hard, black, shriveled mummies.",
    farmersAdvice:
      "Remove all mummified grape clusters during winter pruning and maintain open vine canopies for rapid airflow.",
  },
  "Grape___Esca_Black_Measles": {
    pathogen: "Phaeomoniella chlamydospora complex",
    diagnosis:
      "Esca causes 'tiger-stripe' interveinal chlorosis and necrosis on grape leaves and speckled dark spots on berries.",
    farmersAdvice:
      "Disinfect pruning shears between vines and protect large pruning wounds with wound sealant paste.",
  },
  "Grape___Leaf_blight": {
    pathogen: "Pseudocercospora cladosporioides",
    diagnosis:
      "Grape leaf blight creates angular brown necrotic lesions that cause premature leaf yellowing and defoliation late in the season.",
    farmersAdvice:
      "Ensure proper vineyard drainage and apply copper-based fungicides after bloom if humid conditions persist.",
  },
  "Grape___healthy": {
    pathogen: "None (Healthy Foliage)",
    diagnosis:
      "Grapevine foliage shows lush green leaves with healthy tendril growth and clean leaf surfaces.",
    farmersAdvice:
      "Your grapevines are healthy! Maintain trellis training and monitor canopy density for maximum sun exposure.",
  },
  "Pepper_bell___Bacterial_spot": {
    pathogen: "Xanthomonas campestris pv. vesicatoria",
    diagnosis:
      "Pepper Bacterial Spot causes small, water-soaked, dark brown circular to irregular lesions that blister on leaf undersides, resulting in severe leaf drop.",
    farmersAdvice:
      "Apply fixed copper mixed with mancozeb at first sign of spotting. Avoid sprinkler irrigation and rotate out of nightshades for 2 years.",
  },
  "Pepper_bell___healthy": {
    pathogen: "None (Healthy Foliage)",
    diagnosis:
      "Bell pepper plant exhibits glossy dark green leaves, sturdy stems, and no bacterial spotting or chlorosis.",
    farmersAdvice:
      "Healthy pepper plants! Keep soil evenly moist to avoid blossom end rot and provide light staking as fruit develops.",
  },
  "Squash___Powdery_mildew": {
    pathogen: "Podosphaera xanthii",
    diagnosis:
      "Powdery mildew coats upper and lower leaf surfaces with a talcum powder-like white fungal growth, leading to premature yellowing and leaf dieback.",
    farmersAdvice:
      "Powdery mildew thrives in shade and dense growth. Spray organic potassium bicarbonate or neem oil on both upper and lower leaf surfaces!",
  },
  "Orange___Citrus_greening": {
    pathogen: "Candidatus Liberibacter asiaticus",
    diagnosis:
      "Citrus greening (Huanglongbing) is a devastating phloem-limited bacterial disease spread by the Asian citrus psyllid, causing blotchy yellow mottle on leaves and bitter lopsided fruit.",
    farmersAdvice:
      "Control citrus psyllids with approved insecticides or systemic drenches. Provide foliar micronutrients (zinc, iron, manganese) to support affected trees.",
  },
};

