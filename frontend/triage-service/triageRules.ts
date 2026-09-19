/**
 * Clinical Urgency Triage Rules & Semantic Event Classifier
 * MediNexus AI — Healthcare Safety Architecture
 * 
 * Pipeline Stage 1: Semantic Clinical Event Understanding
 * Pipeline Stage 2: Structured Clinical Situation Extraction
 * Pipeline Stage 3: Event-Specific Risk Assessment
 * Pipeline Stage 4: Healthcare Safety Invariant Enforcement
 */

import {
  ClinicalEventType,
  AssessmentStatus,
  ClinicalSituation,
  SubjectRelation,
  AgeGroup,
  TemporalContext,
  ExposureDetails,
  TriageResult,
  TriageSeverity,
  TriageNextStep,
  ConsultationMode,
  PatientContextInput
} from './types';

/**
 * Normalizes input text for multi-lingual and semantic matching
 */
export function normalizeClinicalInput(text: string): string {
  return (text || '')
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/[.,\/#!$%\^&\*;:{}=\-_~()?"']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Checks if a specific concept or phrase in the text is negated.
 * Understands both English and Hindi/Hinglish negation patterns:
 * - English: "not", "did not", "didn't", "isn't", "is not", "no", "never", "without", "denies", "negative for"
 * - Hindi/Hinglish: "nahi", "nhi", "nahin", "na", "mat", "bina"
 */
export function isConceptNegated(rawText: string, targetConcept: string): boolean {
  const norm = normalizeClinicalInput(rawText);
  const target = normalizeClinicalInput(targetConcept);

  if (!norm.includes(target)) {
    return false;
  }

  const negationWords = [
    'not', 'did not', 'didnt', 'is not', 'isnt', 'are not', 'arent',
    'was not', 'wasnt', 'no', 'never', 'without', 'denies', 'denied', 'negative for',
    'nahi', 'nhi', 'nahin', 'na', 'mat', 'bina'
  ];

  const words = norm.split(' ');
  const targetWords = target.split(' ');
  const targetIndex = words.findIndex((_, idx) =>
    words.slice(idx, idx + targetWords.length).join(' ') === target
  );

  if (targetIndex === -1) return false;

  // Check 5 words preceding target for negation
  const windowStart = Math.max(0, targetIndex - 5);
  const precedingPhrase = words.slice(windowStart, targetIndex).join(' ');

  // Check 3 words following target (e.g. Hinglish "chest pain nahi hai")
  const windowEnd = Math.min(words.length, targetIndex + targetWords.length + 3);
  const followingPhrase = words.slice(targetIndex + targetWords.length, windowEnd).join(' ');

  for (const neg of negationWords) {
    const negRegex = new RegExp(`(^|\\s)${neg}(\\s|$)`, 'i');
    if (negRegex.test(precedingPhrase) || negRegex.test(followingPhrase)) {
      return true;
    }
  }

  return false;
}

/**
 * Extracts demographic and relation context from input and patient context.
 */
function extractSubject(norm: string, patientContext?: PatientContextInput): {
  relation: SubjectRelation;
  age?: number;
  ageGroup: AgeGroup;
} {
  let relation: SubjectRelation = 'SELF';
  let age: number | undefined = patientContext?.age;
  let ageGroup: AgeGroup = 'UNKNOWN';

  // Explicit age mentions in text
  const ageYearMatch = norm.match(/(\d{1,2})\s*(?:years?\s*old|yo|yr|saal)/i);
  const ageMonthMatch = norm.match(/(\d{1,2})\s*(?:months?\s*old|month|mahine)/i);

  if (ageYearMatch) {
    age = parseInt(ageYearMatch[1], 10);
  } else if (ageMonthMatch) {
    const months = parseInt(ageMonthMatch[1], 10);
    age = Math.round((months / 12) * 10) / 10;
  }

  // Relation detection
  if (/\b(my\s+child|child|children|kid|kids|my\s+son|my\s+daughter|my\s+kid|my\s+toddler|my\s+baby|my\s+infant|daughter|son|toddler|baby|infant|bachche|bacche|bachcha|baccha|bachhe|beta|beti|chote\s+bacche)\b/i.test(norm)) {
    relation = 'CHILD';
    if (/\b(toddler|baby|infant|month|mahine|1\s*year|2\s*year|6\s*month)\b/i.test(norm)) {
      relation = 'INFANT';
      ageGroup = 'INFANT';
    } else {
      ageGroup = 'CHILD';
    }
  } else if (/\b(my\s+father|my\s+dad|my\s+mother|my\s+mom|my\s+parent|grandfather|grandmother|dada|dadi|nana|nani|papa|pitaji|mummy|maa)\b/i.test(norm)) {
    relation = 'PARENT';
    ageGroup = 'OLDER_ADULT';
  } else if (/\b(my\s+wife|my\s+husband|my\s+spouse|pati|patni)\b/i.test(norm)) {
    relation = 'SPOUSE';
    ageGroup = 'ADULT';
  } else if (/\b(my\s+brother|my\s+sister|my\s+friend|my\s+colleague|bhai|behen|dost|worker|colleague)\b/i.test(norm)) {
    relation = 'OTHER';
  }

  // Derive ageGroup if age is known
  if (age !== undefined) {
    if (age <= 2) ageGroup = 'INFANT';
    else if (age <= 12) ageGroup = 'CHILD';
    else if (age <= 19) ageGroup = 'ADOLESCENT';
    else if (age <= 60) ageGroup = 'ADULT';
    else ageGroup = 'OLDER_ADULT';
  }

  return { relation, age, ageGroup };
}

/**
 * Extracts temporal context (Current, Recent, Historical, Unclear)
 */
function extractTemporalContext(norm: string): TemporalContext {
  const historicalPatterns = [
    /\b(\d+|two|three|four|five|six|seven|eight|nine|ten|twenty)\s+years?\s+ago\b/i,
    /\bin\s+(19\d\d|200\d|201\d|202[0-4])\b/i,
    /\blast\s+(year|month|decade)\b/i,
    /\bpast\s+history\b/i,
    /\bhistorical\b/i,
    /\bsurvivor\b/i,
    /\bdiagnosed\s+in\b/i,
    /\bas\s+a\s+child\b/i,
    /\bwhen\s+i\s+was\s+(little|young|a\s+child|a\s+kid)\b/i,
    /\bpehle\s+(hua\s+tha|hote\s+the|tha)\b/i,
    /\bsaalon\s+pehle\b/i
  ];

  for (const pattern of historicalPatterns) {
    if (pattern.test(norm)) {
      return 'HISTORICAL';
    }
  }

  if (/\b(yesterday|kal|a\s+few\s+days\s+ago|last\s+week)\b/i.test(norm)) {
    return 'RECENT';
  }

  return 'CURRENT';
}

/**
 * Pipeline Stage 1 & 2: Semantic Clinical Event Understanding & Structured Situation
 */
export function extractClinicalSituation(
  rawInput: string,
  patientContext?: PatientContextInput
): ClinicalSituation {
  const norm = normalizeClinicalInput(rawInput);
  const subject = extractSubject(norm, patientContext);
  const temporalContext = extractTemporalContext(norm);

  const symptoms: string[] = [];
  const redFlags: string[] = [];
  const riskFactors: string[] = [];
  const negatedItems: string[] = [];
  const severityIndicators: string[] = [];

  // Severity modifiers in language
  if (/\b(severe|immense|excruciating|unbearable|extreme|crushing|worst|uncontrollable|very\s+much\s+pain|lot\s+of\s+pain|too\s+much\s+pain|intense\s+pain|bahut\s+tez|tez|asahania)\b/i.test(norm)) {
    severityIndicators.push('severe_intensity');
  }

  // -------------------------------------------------------------------
  // 1. CONSCIOUSNESS & UNRESPONSIVENESS
  // -------------------------------------------------------------------
  let consciousness: ClinicalSituation['consciousness'] = 'NORMAL';
  const unrespRegex = /\b(unconscious|passed\s+out|not\s+waking\s+up|isn\s*t\s+waking\s+up|isnt\s+waking\s+up|won\s*t\s+wake\s+up|wont\s+wake\s+up|will\s+not\s+wake\s+up|unresponsive|not\s+responding|isn\s*t\s+responding|isnt\s+responding|cannot\s+be\s+awakened|cant\s+wake\s+him|can\s*t\s+wake\s+him|fainted|syncope|collapsed|behosh|hosh\s+mein\s+nahi|hosh\s+nahi|hosh\s+nhi|gir\s+gaya)\b/i;

  const hasUnresp = unrespRegex.test(norm);
  const isUnrespNegated = isConceptNegated(rawInput, 'unconscious') ||
    isConceptNegated(rawInput, 'behosh') ||
    isConceptNegated(rawInput, 'passed out') ||
    isConceptNegated(rawInput, 'fainted') ||
    isConceptNegated(rawInput, 'responding');

  if (isUnrespNegated) {
    negatedItems.push('unconsciousness');
  } else if (hasUnresp) {
    consciousness = 'UNCONSCIOUS';
    redFlags.push('Loss of consciousness / unresponsiveness');
    symptoms.push('unconsciousness');
  }

  // -------------------------------------------------------------------
  // 2. BREATHING & RESPIRATORY COMPROMISE / AIRWAY
  // -------------------------------------------------------------------
  let breathing: ClinicalSituation['breathing'] = 'NORMAL';
  const respRegex = /\b(difficulty\s+breathing|shortness\s+of\s+breath|cannot\s+breathe|can\s*t\s+breathe|cant\s+breathe|struggling\s+to\s+breathe|gasping|blue\s+lips|breathless|suffocating|choking|wheezing|saans\s+lene\s+me|saans\s+nahi|dum\s+ghut|smoke\s+inhal|fumes|chlorine\s+gas)\b/i;

  const hasRespDistress = respRegex.test(norm);
  const isRespNegated = isConceptNegated(rawInput, 'difficulty breathing') ||
    isConceptNegated(rawInput, 'shortness of breath') ||
    isConceptNegated(rawInput, 'breathe') ||
    isConceptNegated(rawInput, 'breathing difficulty') ||
    isConceptNegated(rawInput, 'saans');

  if (isRespNegated) {
    negatedItems.push('respiratory_distress');
  } else if (hasRespDistress) {
    breathing = (severityIndicators.length > 0 || norm.includes('gasping') || norm.includes('blue lips') || norm.includes('choking') || norm.includes('cannot breathe')) ? 'SEVERELY_DIFFICULT' : 'DIFFICULT';
    redFlags.push('Acute respiratory distress / airway compromise');
    symptoms.push('respiratory distress');
  }

  // -------------------------------------------------------------------
  // 3. PREGNANCY COMPLICATION
  // -------------------------------------------------------------------
  const hasPregnancy = /\b(pregnant|pregnancy|expecting|trimester|7\s*months?\s*pregnant|pre\s*eclampsia|preeclampsia|placental\s+abruption|garbhavati|hamila)\b/i.test(norm) ||
    patientContext?.medicalConditions?.some(c => /pregnant/i.test(c)) || false;
  const isPregnancyNegated = isConceptNegated(rawInput, 'pregnant') || isConceptNegated(rawInput, 'pregnancy');
  const activePregnancy = hasPregnancy && !isPregnancyNegated;

  if (isPregnancyNegated) {
    negatedItems.push('pregnancy');
  }

  // -------------------------------------------------------------------
  // 4. VENOMOUS STINGS & BITES
  // -------------------------------------------------------------------
  const scorpionRegex = /\b(scorpion|scorpian|scorpean|scorpin|bichhu|bicho|bichhoo|bichu|centipede)\b/i;
  const marineStingRegex = /\b(jellyfish|stingray|man\s+o\s+war|lionfish|stonefish)\b/i;
  const insectStingRegex = /\b(wasp|bee|hornet|yellowjacket|yellowjackets|fire\s+ant|tatayya|madhumakkhi|zehreelay\s+keedey|keeda)\b/i;
  const snakeRegex = /\b(snake|viper|cobra|krait|adder|rattlesnake|copperhead|mamba|saanp|saamp|nag|sea\s+snake)\b/i;
  const spiderRegex = /\b(spider|black\s+widow|brown\s+recluse|funnel\s+web|makdi)\b/i;
  const animalBiteRegex = /\b(dog|puppy|cat|kitten|monkey|bat|fox|raccoon|kutta|kutte|bandar)\b/i;

  const stingActionRegex = /\b(stung|sting|stings|dank|kaat\s+liya|kaata|pricked)\b/i;
  const biteActionRegex = /\b(bit|bite|bitten|bites|struck|strike|chewed|kaat\s+liya|kaata|kaat\s+gaya|dass\s+liya|dassa)\b/i;

  const hasScorpion = scorpionRegex.test(norm);
  const hasMarineSting = marineStingRegex.test(norm);
  const hasInsectSting = insectStingRegex.test(norm);
  const hasSnake = snakeRegex.test(norm);
  const hasSpider = spiderRegex.test(norm);
  // Animal bite check excludes rat poison and battery!
  const hasAnimal = animalBiteRegex.test(norm) && !norm.includes('rat poison') && !norm.includes('battery');

  const hasStingAction = stingActionRegex.test(norm);
  const hasBiteAction = biteActionRegex.test(norm);

  // -------------------------------------------------------------------
  // 5. CHEMICALS, POISONS & MEDICATIONS
  // -------------------------------------------------------------------
  const ingestionVerbs = [
    'drank', 'drink', 'drinking', 'swallowed', 'swallow', 'swallowing',
    'consumed', 'consume', 'ingested', 'ingest', 'gulped', 'gulp', 'took', 'take',
    'sipped', 'ate', 'eaten', 'eat', 'chewed', 'chew',
    'pee liya', 'pi liya', 'pee lia', 'pi lia', 'kha liya', 'nigal liya', 'gatak'
  ];
  const hasIngestionVerb = ingestionVerbs.some(v => norm.includes(v));

  const toxicSubstanceRegex = /\b(cleaner|cleaning\s+(?:liquid|fluid|solution|agent)|floor\s+(?:cleaner|wash)|toilet\s+(?:cleaner|wash)|bathroom\s+(?:cleaner|wash)|tile\s+(?:cleaner|wash)|drain\s+cleaner|carpet\s+cleaner|window\s+cleaner|glass\s+cleaner|surface\s+cleaner|dish\s*wash|soap\s*liquid|liquid\s*soap|washing\s*powder|washing\s*liquid|phenyl|phenol|finael|bleach|detergent|disinfectant|ammonia|acid|battery\s+acid|battery\s+water|inverter\s+water|caustic|caustic\s+soda|lye|potassium\s+permanganate|solvent|paint\s+thinner|turpentine|varnish|acetone|nail\s+polish\s+remover|rubbing\s+alcohol|isopropyl|isopropanol|methanol|spirit|denatured\s+alcohol|pesticide|insecticide|rat\s+poison|rodenticide|weed\s+killer|weedicide|herbicide|fungicide|keetnashak|zeher|poisonous|poison|poisons|poisoning|venomous|venemous|venom|toxin|toxins|toxic|toxic\s+(?:chemical|liquid|substance|fluid|fumes|gas)|chemical|chemicals|sanitizer|harpic|colin|lysol|lizol|lyzol|dettol|savlon|domex|pril|vim|surf\s+excel|ariel|tide|mortein|baygon|hit\s+spray|good\s*knight|all\s*out|kerosene|petrol|gasoline|diesel|engine\s+oil|motor\s+oil|brake\s+fluid|antifreeze|coolant|camphor|kapoor|naphthalene|mothballs?|button\s+battery|unlabeled\s+bottle|unknown\s+(?:liquid|chemical|substance|fluid|powder))\b/i;
  const hasToxicSubstance = toxicSubstanceRegex.test(norm);

  const medicationRegex = /\b(pills?|tablets?|capsules?|sleeping\s+pills?|overdose|overdosed|painkillers?|swallowed\s+medicine|swallowed\s+an\s+unknown\s+tablet|medicine\s+accidentally|blood\s+pressure\s+medicine|strip\s+of|goli|dawa|dawai|heroin|fentanyl|cocaine|meth|drugs?)\b/i;
  const hasMedication = medicationRegex.test(norm);

  // -------------------------------------------------------------------
  // 6. CARDIOVASCULAR & NEUROLOGICAL CONCEPTS
  // -------------------------------------------------------------------
  const cardiacRegex = /\b(chest\s+(?:pain|tightness|pressure|heaviness|discomfort|crushing|squeezing|pressure\s+radiating)|retrosternal|clutching\s+(?:his\s+|her\s+|my\s+)?chest|heart\s+attack|cardiac|myocardial|dil\s+ka\s+daura|seene\s+me(?:in)?\s+dard|elephant\s+(?:is\s+sitting\s+)?on\s+(?:my\s+)?chest)\b/i;
  const hasCardiac = cardiacRegex.test(norm);

  const neuroRegex = /\b(stroke|cannot\s+move|cant\s+move|can\s*t\s+move|unable\s+to\s+move|cannot\s+raise\s+arm|weakness\s+on\s+(?:one|right|left)\s+side|hemiparesis|paraly|droop|drooping|slur|slurred|cannot\s+speak|cant\s+speak|can\s*t\s+speak|unable\s+to\s+speak|inability\s+to\s+speak|cannot\s+comprehend|speech|loss\s+of\s+vision|lost\s+vision|amaurosis|thunderclap\s+headache|worst\s+headache\s+of\s+my\s+life|focal\s+neurological|seizure|convulsion|fits|mirgi|lakwa|aadha\s+shareer|muh\s+tedha|confused\s+and\s+cannot\s+speak)\b/i;
  const hasNeuro = neuroRegex.test(norm);

  const bleedingRegex = /\b(bleeding\s+heavily|heavy\s+bleeding|blood\s+spurting|blood\s+pouring|hemorrhage|hemorrhaging|soaked\s+in\s+blood|coughing\s+up\s+(?:.*?\s+)?blood|bright\s+red\s+blood|khoon\s+beh\s+raha)\b/i;
  const hasHeavyBleeding = bleedingRegex.test(norm);

  const traumaRegex = /\b(fell\s+from|fall\s+from|accident|crash|broken\s+bone|fracture|broke\s+my|broke\s+a|hit\s+on\s+head|head\s+injury|stab|stabbed|gunshot|got\s+shot|was\s+shot|shot\s+in|shot\s+my|shot\s+me|shot\s+at|sniper|bullet|nail\s+got\s+into|nail\s+in|impaled|pierced|amputated|cut\s+off|severed|trauma)\b/i;
  const hasTrauma = traumaRegex.test(norm);

  const burnRegex = /\b(burns?|burned|burning|scalding|hot\s+oil|boiling\s+water|fire\s+burn|chemical\s+burn|jal\s+gaya)\b/i;
  const hasBurn = burnRegex.test(norm);

  const allergyRegex = /\b(allergic|allergy|hives|peanuts?|amoxicillin|throat\s+is\s+closing|throat\s+closing|lips\s+are\s+swollen|face\s+is\s+swelling|face\s+swelling|anaphylaxis)\b/i;
  const hasAllergy = allergyRegex.test(norm);

  const acuteAbdomenRegex = /\b(appendix|appendicitis|(?:lower\s+right|right\s+lower)\s+(?:quadrant|belly|abdomen|side|stomach)|acute\s+abdomen|surgical\s+abdomen|mcburney|peritonitis|board\s*like|hard\s+board|rebound\s+tenderness|bowel\s+obstruction|twisted\s+bowel|cholecystitis|gallbladder|pancreatitis|perforated\s+ulcer|renal\s+colic|kidney\s+stones?|severe\s+(?:acute\s+)?(?:stomach|abdominal)\s+pain|excruciating\s+(?:stomach|abdominal)\s+(?:pain|cramps)|pet\s+(?:me|mein)\s+(?:bahut\s+tez|tez|asahania)\s+dard)\b/i;
  const hasAcuteAbdomen = acuteAbdomenRegex.test(norm);

  const surgicalEmergencyRegex = /\b(testicular\s+(?:torsion|pain|swelling)|severe\s+testicular|groin\s+pain\s+in\s+teen|ovarian\s+torsion|saddle\s+anesthesia|cauda\s+equina|loss\s+of\s+(?:bowel|bladder|bowel\s+and\s+bladder)\s+(?:control|sensation)|necrotizing|flesh\s+eating)\b/i;
  const hasSurgicalEmergency = surgicalEmergencyRegex.test(norm);

  const sepsisRegex = /\b(sepsis|septic\s+shock|shivering\s+violently|violently\s+shivering|extreme\s+shivering|violent\s+chills|purple\s+spots|purple\s+rash|petechial|purpuric|meningitis|stiff\s+neck)\b/i;
  const hasSepsis = sepsisRegex.test(norm);

  const ophthalmicRegex = /\b(glaucoma|halos\s+around\s+lights|curtain\s+falling|retinal\s+detachment|(?:chemical|acid|alkali|bleach|solvent)\s+(?:splash|splashed|sprayed|in)\s+(?:the\s+|both\s+)?eyes?)\b/i;
  const hasOphthalmic = ophthalmicRegex.test(norm);

  const endocrineRegex = /\b(diabetic\s+ketoacidosis|ketoacidosis|dka|kussmaul|fruity\s+breath|acetone\s+breath|diabetic\s+acting\s+(?:strange|confused)|(?:severe|profound)\s+hypoglycemia|hypoglycemic\s+(?:shock|coma)|insulin\s+shock)\b/i;
  const hasEndocrine = endocrineRegex.test(norm);

  const environmentalRegex = /\b(heatstroke|heat\s+stroke|core\s+temp\s+105|stopped\s+sweating|drowning|near\s+drowning|submersion|carbon\s+monoxide|co\s+poisoning|hypothermia)\b/i;
  const hasEnvironmental = environmentalRegex.test(norm);

  const psychiatricRegex = /\b(suicide|suicidal|kill\s+(?:myself|himself|herself|themselves)|end\s+my\s+life|jumped\s+from\s+balcony|jump\s+from\s+balcony|jumped\s+off|jump\s+off\s+a\s+building|overdose\s+intentionally|want\s+to\s+die|harm\s+myself|cut\s+myself|slit\s+my\s+wrists|slit\s+wrists|hang\s+myself|hanged\s+himself|hanged\s+herself)\b/i;
  const hasPsychiatricCrisis = psychiatricRegex.test(norm);

  // -------------------------------------------------------------------
  // 7. HIERARCHICAL EVENT CLASSIFICATION
  // -------------------------------------------------------------------
  let eventType: ClinicalEventType = 'GENERAL_SYMPTOM';
  let eventFamily = 'GENERAL_SYSTEMIC';
  let specificEvent = 'NON_SPECIFIC_SYMPTOM';
  let mechanism: string | undefined = undefined;
  let exposure: ExposureDetails | undefined = undefined;

  // A. VENOMOUS STING (Scorpion, Marine, Arthropod)
  const isScorpionNegated = isConceptNegated(rawInput, 'scorpion') || isConceptNegated(rawInput, 'scorpian') || isConceptNegated(rawInput, 'bichhu');
  if (isScorpionNegated) {
    negatedItems.push('scorpion_sting');
  } else if (hasScorpion && (hasBiteAction || hasStingAction || norm.includes('scorpion') || norm.includes('scorpian') || norm.includes('bichhu'))) {
    eventType = 'VENOMOUS_STING';
    eventFamily = 'VENOMOUS_EXPOSURE';
    specificEvent = 'SCORPION_STING';
    mechanism = 'STING';
    exposure = { type: 'VENOM', substance: 'Scorpion venom', route: 'STING', knownOrSuspected: 'KNOWN' };
    redFlags.push('Suspected venomous scorpion envenomation');
  } else if (hasMarineSting && (hasStingAction || hasBiteAction || norm.includes('stung'))) {
    eventType = 'VENOMOUS_STING';
    eventFamily = 'VENOMOUS_EXPOSURE';
    specificEvent = 'MARINE_ENVENOMATION';
    mechanism = 'STING';
    exposure = { type: 'VENOM', substance: 'Marine venom', route: 'STING' };
  } else if (hasInsectSting && (hasStingAction || norm.includes('stung') || norm.includes('kaat'))) {
    eventType = 'INSECT_BITE_OR_STING';
    eventFamily = 'ARTHROPOD_EXPOSURE';
    specificEvent = norm.includes('yellowjacket') ? 'YELLOWJACKET_STING' : 'HYMENOPTERA_STING';
    mechanism = 'STING';
    exposure = { type: 'VENOM', substance: 'Insect venom', route: 'STING' };
  }

  // B. VENOMOUS BITE (Snake, Venomous Spider)
  const isSnakeNegated = isConceptNegated(rawInput, 'snake') || isConceptNegated(rawInput, 'saanp');
  if (isSnakeNegated) {
    negatedItems.push('snake_bite');
  } else if (hasSnake && (hasBiteAction || hasStingAction || norm.includes('struck') || norm.includes('snake') || norm.includes('saanp') || norm.includes('viper') || norm.includes('cobra') || norm.includes('adder'))) {
    eventType = 'VENOMOUS_BITE';
    eventFamily = 'VENOMOUS_EXPOSURE';
    specificEvent = norm.includes('cobra') ? 'COBRA_SNAKEBITE' : norm.includes('viper') ? 'VIPER_SNAKEBITE' : 'SNAKE_BITE';
    mechanism = 'BITE';
    exposure = { type: 'VENOM', substance: 'Snake venom', route: 'BITE', knownOrSuspected: 'KNOWN' };
    redFlags.push('Suspected venomous snakebite envenomation');
  } else if (hasSpider && (hasBiteAction || norm.includes('spider'))) {
    eventType = 'VENOMOUS_BITE';
    eventFamily = 'VENOMOUS_EXPOSURE';
    specificEvent = norm.includes('black widow') ? 'BLACK_WIDOW_BITE' : norm.includes('brown recluse') ? 'BROWN_RECLUSE_BITE' : 'SPIDER_BITE';
    mechanism = 'BITE';
    exposure = { type: 'VENOM', substance: 'Spider venom', route: 'BITE' };
  }

  // C. TOXIC INGESTION & CHEMICAL EXPOSURE (Evaluated before animal bites to avoid rat poison false bite)
  const isDrinkNegated = isConceptNegated(rawInput, 'drink') ||
    isConceptNegated(rawInput, 'swallowed') ||
    isConceptNegated(rawInput, 'cleaner') ||
    isConceptNegated(rawInput, 'phenyl') ||
    isConceptNegated(rawInput, 'poison');

  if (isDrinkNegated) {
    negatedItems.push('toxic_ingestion');
  } else if (eventType === 'GENERAL_SYMPTOM' && !hasEndocrine && !hasEnvironmental && (hasToxicSubstance || norm.includes('rat poison') || norm.includes('pesticide'))) {
    if (hasIngestionVerb || norm.includes('swallowed') || norm.includes('drank') || norm.includes('gulped') || norm.includes('ate') || norm.includes('chewed') || norm.includes('pee liya')) {
      eventType = 'TOXIC_INGESTION';
      eventFamily = 'TOXIC_EXPOSURE';
      specificEvent = norm.includes('clean') ? 'HOUSEHOLD_CLEANER_INGESTION' :
        norm.includes('phenyl') ? 'PHENOLIC_DISINFECTANT_INGESTION' :
        norm.includes('pesticide') || norm.includes('rat poison') ? 'PESTICIDE_INGESTION' :
        'CHEMICAL_TOXIC_INGESTION';
      mechanism = 'INGESTION';
      exposure = { type: 'CHEMICAL', substance: specificEvent.replace(/_/g, ' ').toLowerCase(), route: 'INGESTED', knownOrSuspected: 'KNOWN' };
      redFlags.push('Acute toxic substance ingestion');
    } else if (norm.includes('fumes') || norm.includes('gas') || norm.includes('inhaled')) {
      eventType = 'CHEMICAL_EXPOSURE';
      eventFamily = 'TOXIC_EXPOSURE';
      specificEvent = 'TOXIC_GAS_INHALATION';
      mechanism = 'INHALATION';
      redFlags.push('Toxic chemical vapor / gas inhalation');
    } else {
      eventType = 'CHEMICAL_EXPOSURE';
      eventFamily = 'TOXIC_EXPOSURE';
      specificEvent = norm.includes('eye') ? 'OCULAR_CHEMICAL_SPLASH' : 'CHEMICAL_SUBSTANCE_CONTACT';
      mechanism = 'CONTACT';
    }
  } else if (eventType === 'GENERAL_SYMPTOM' && hasMedication && (hasIngestionVerb || norm.includes('swallowed') || norm.includes('took') || norm.includes('ate') || norm.includes('overdose') || norm.includes('overdosed'))) {
    eventType = 'MEDICATION_OVERDOSE';
    eventFamily = 'TOXIC_EXPOSURE';
    specificEvent = norm.includes('sleeping pills') ? 'SEDATIVE_OVERDOSE' : 'PHARMACEUTICAL_INGESTION';
    mechanism = 'INGESTION';
    exposure = { type: 'MEDICATION', substance: 'Pharmaceutical medication', route: 'INGESTED' };
    redFlags.push('Acute medication ingestion / overdose');
  }

  // D. ANIMAL BITE
  if (eventType === 'GENERAL_SYMPTOM' && hasAnimal && (hasBiteAction || norm.includes('bit') || norm.includes('kaat'))) {
    eventType = 'ANIMAL_BITE';
    eventFamily = 'TRAUMA_AND_EXPOSURE';
    specificEvent = norm.includes('bat') ? 'BAT_BITE_RABIES_RISK' : norm.includes('monkey') ? 'MONKEY_BITE_RABIES_RISK' : 'DOG_OR_MAMMAL_BITE';
    mechanism = 'BITE';
    exposure = { type: 'ANIMAL_SALIVA', substance: 'Animal bite puncture', route: 'BITE' };
    riskFactors.push('Rabies virus transmission and bacterial wound infection');
  }

  // E. ALLERGIC REACTION & ANAPHYLAXIS
  if (hasAllergy && eventType === 'GENERAL_SYMPTOM') {
    const hasAirwayOrWheeze = breathing !== 'NORMAL' || norm.includes('throat is closing') || norm.includes('throat closing') || norm.includes('wheezing');
    if (hasAirwayOrWheeze) {
      eventType = 'ANAPHYLAXIS';
      eventFamily = 'ALLERGIC_IMMUNOLOGIC';
      specificEvent = 'ACUTE_ANAPHYLAXIS';
      redFlags.push('Anaphylaxis airway / respiratory compromise');
    } else {
      eventType = 'ALLERGIC_REACTION';
      eventFamily = 'ALLERGIC_IMMUNOLOGIC';
      specificEvent = norm.includes('face') || norm.includes('lips') ? 'ANGIOEDEMA_FACIAL_SWELLING' : 'ALLERGIC_REACTION';
    }
  }

  // F. SEVERE BLEEDING
  if (hasHeavyBleeding && eventType === 'GENERAL_SYMPTOM') {
    eventType = 'SEVERE_BLEEDING';
    eventFamily = 'VASCULAR_TRAUMA';
    specificEvent = norm.includes('coughing') ? 'MASSIVE_HEMOPTYSIS' : 'MAJOR_EXTERNAL_HEMORRHAGE';
    redFlags.push('Heavy or uncontrolled active bleeding');
    symptoms.push('severe bleeding');
  }

  // G. LOSS OF CONSCIOUSNESS
  if (consciousness === 'UNCONSCIOUS' && eventType === 'GENERAL_SYMPTOM') {
    eventType = 'LOSS_OF_CONSCIOUSNESS';
    eventFamily = 'NEUROLOGICAL';
    specificEvent = 'ACUTE_UNRESPONSIVENESS_OR_COLLAPSE';
    mechanism = 'SYNCOPE_COLLAPSE';
  }

  // H. CARDIAC EVENT (Prioritized over generic dyspnea)
  const isCardiacNegated = isConceptNegated(rawInput, 'chest pain') || isConceptNegated(rawInput, 'heart attack') || isConceptNegated(rawInput, 'cardiac');
  if (isCardiacNegated) {
    negatedItems.push('cardiac_event');
  } else if (hasCardiac && eventType === 'GENERAL_SYMPTOM') {
    eventType = 'CARDIAC_EVENT';
    eventFamily = 'CARDIOVASCULAR';
    specificEvent = (norm.includes('heart attack') || norm.includes('myocardial') || norm.includes('infarction')) ? 'ACUTE_MYOCARDIAL_INFARCTION' : 'ACUTE_CHEST_PAIN';
    symptoms.push('chest pain');
    if (temporalContext === 'CURRENT') {
      redFlags.push('Suspected acute coronary syndrome / myocardial infarction');
    }
  }

  // I. CHOKING & RESPIRATORY EVENT
  if (norm.includes('choking') || norm.includes('smoke inhalation') || (breathing !== 'NORMAL' && eventType === 'GENERAL_SYMPTOM')) {
    eventType = 'RESPIRATORY_EVENT';
    eventFamily = 'RESPIRATORY';
    specificEvent = norm.includes('choking') ? 'FOREIGN_BODY_AIRWAY_OBSTRUCTION' : 'ACUTE_RESPIRATORY_DISTRESS';
    symptoms.push('dyspnea');
  }

  // J. TRAUMA & BURNS
  if (hasBurn && eventType === 'GENERAL_SYMPTOM') {
    eventType = 'BURN';
    eventFamily = 'TRAUMA_AND_INJURY';
    specificEvent = 'ACUTE_BURN_INJURY';
  } else if (hasTrauma && eventType === 'GENERAL_SYMPTOM') {
    eventType = 'TRAUMA';
    eventFamily = 'TRAUMA_AND_INJURY';
    
    if (/\b(stab|stabbed|gunshot|got\s+shot|was\s+shot|shot\s+in|shot\s+my|shot\s+me|shot\s+at|sniper|bullet|nail\s+got\s+into|nail\s+in|impaled|pierced)\b/i.test(norm)) {
      specificEvent = 'PENETRATING_TRAUMA';
      redFlags.push('Penetrating trauma / Impalement / Gunshot wound');
    } else if (/\b(amputated|cut\s+off|severed)\b/i.test(norm)) {
      specificEvent = 'AMPUTATION';
      redFlags.push('Traumatic amputation / Severed limb');
    } else if (norm.includes('balcony') || norm.includes('fell')) {
      specificEvent = 'BLUNT_SPINAL_FALL_TRAUMA';
    } else {
      specificEvent = 'ACUTE_PHYSICAL_TRAUMA';
    }

    if (hasNeuro || norm.includes('head')) {
      redFlags.push('High-impact physical trauma with associated neurological motor deficit or head injury');
    }
  }

  // K. NEUROLOGICAL EVENT
  if (hasNeuro && eventType === 'GENERAL_SYMPTOM') {
    eventType = 'NEUROLOGICAL_EVENT';
    eventFamily = 'NEUROLOGICAL';
    specificEvent = norm.includes('vision') ? 'ACUTE_MONOCULAR_VISION_LOSS' :
      norm.includes('face') && norm.includes('speech') ? 'ACUTE_STROKE_SYMPTOMS' :
      norm.includes('cannot move') || norm.includes('cant move') || norm.includes('can t move') ? 'ACUTE_FOCAL_MOTOR_DEFICIT_STROKE' :
      norm.includes('confused') ? 'ACUTE_CONFUSION_OR_APHASIA' :
      norm.includes('seizure') || norm.includes('convulsion') ? 'ACTIVE_CONVULSION_SEIZURE' :
      'ACUTE_NEUROLOGICAL_DEFICIT';
    redFlags.push('Sudden focal neurological deficit (Code Stroke pathway)');
    symptoms.push('focal neurological deficit');
  }

  // L. PREGNANCY RELATED
  if (activePregnancy) {
    if (hasHeavyBleeding || norm.includes('bleeding') || norm.includes('khoon')) {
      eventType = 'PREGNANCY_RELATED';
      eventFamily = 'OBSTETRIC_GYNECOLOGIC';
      specificEvent = 'PREGNANCY_VAGINAL_BLEEDING';
      redFlags.push('Vaginal bleeding during pregnancy');
    } else if (norm.includes('pain') || norm.includes('cramps') || norm.includes('pelvic pain') || norm.includes('pet me dard')) {
      eventType = 'PREGNANCY_RELATED';
      eventFamily = 'OBSTETRIC_GYNECOLOGIC';
      specificEvent = 'PREGNANCY_ACUTE_ABDOMEN';
      redFlags.push('Severe acute abdominal/pelvic pain in pregnancy');
    } else if (consciousness === 'UNCONSCIOUS') {
      eventType = 'PREGNANCY_RELATED';
      eventFamily = 'OBSTETRIC_GYNECOLOGIC';
      specificEvent = 'PREGNANCY_SYNCOPE';
      redFlags.push('Syncope or collapse in pregnancy');
    } else if (norm.includes('pre eclampsia') || norm.includes('preeclampsia') || norm.includes('headache')) {
      eventType = 'PREGNANCY_RELATED';
      eventFamily = 'OBSTETRIC_GYNECOLOGIC';
      specificEvent = 'PREECLAMPSIA_RED_FLAGS';
      redFlags.push('Pre-eclampsia red flags (severe headache, hypertension, visual changes)');
    }
  }

  // M. ACUTE ABDOMEN (Appendicitis, Peritonitis, Bowel Obstruction, Pancreatitis)
  const isAppendixNegated = isConceptNegated(rawInput, 'appendix') ||
    isConceptNegated(rawInput, 'appendicitis') ||
    isConceptNegated(rawInput, 'stomach pain') ||
    isConceptNegated(rawInput, 'abdominal pain');

  if (isAppendixNegated) {
    negatedItems.push('acute_abdomen');
  } else if (hasAcuteAbdomen && eventType === 'GENERAL_SYMPTOM') {
    eventType = 'ACUTE_ABDOMEN';
    eventFamily = 'GASTROINTESTINAL_AND_SURGICAL';
    specificEvent = norm.includes('appendix') || norm.includes('appendicitis') || norm.includes('lower right') || norm.includes('right lower') ? 'ACUTE_APPENDICITIS' :
      norm.includes('peritonitis') || norm.includes('board') ? 'ACUTE_PERITONITIS' :
      norm.includes('bowel') || norm.includes('obstruction') ? 'ACUTE_BOWEL_OBSTRUCTION' :
      norm.includes('pancreatitis') ? 'ACUTE_PANCREATITIS' :
      norm.includes('gallbladder') || norm.includes('cholecystitis') ? 'ACUTE_CHOLECYSTITIS' :
      norm.includes('kidney stone') || norm.includes('renal colic') ? 'ACUTE_RENAL_COLIC' :
      'ACUTE_SURGICAL_ABDOMEN';
    if (severityIndicators.length > 0 || norm.includes('very much pain') || norm.includes('appendix') || norm.includes('severe') || norm.includes('unbearable')) {
      redFlags.push('Severe acute abdominal pain / suspected acute abdomen / surgical emergency');
    }
  }

  // N. SURGICAL EMERGENCY (Torsion, Cauda Equina, Necrotizing)
  if (hasSurgicalEmergency && eventType === 'GENERAL_SYMPTOM') {
    eventType = 'SURGICAL_EMERGENCY';
    eventFamily = 'SURGICAL_CRITICAL_CARE';
    specificEvent = norm.includes('testicular') ? 'TESTICULAR_TORSION' :
      norm.includes('ovarian') ? 'OVARIAN_TORSION' :
      norm.includes('cauda') || norm.includes('saddle') ? 'CAUDA_EQUINA_SYNDROME' :
      'NECROTIZING_SOFT_TISSUE_INFECTION';
    redFlags.push('Time-critical surgical emergency (organ salvage / decompression window)');
  }

  // O. PSYCHIATRIC CRISIS
  if (hasPsychiatricCrisis && eventType === 'GENERAL_SYMPTOM') {
    eventType = 'PSYCHIATRIC_CRISIS';
    eventFamily = 'BEHAVIORAL_HEALTH';
    specificEvent = 'ACUTE_SUICIDAL_IDEATION_OR_ATTEMPT';
    redFlags.push('High risk of self-harm / suicidal ideation or active attempt');
  }

  // O. SEPSIS
  if (hasSepsis && eventType === 'GENERAL_SYMPTOM') {
    eventType = 'SEPSIS';
    eventFamily = 'INFECTIOUS_CRITICAL_CARE';
    specificEvent = norm.includes('meningitis') || norm.includes('stiff neck') ? 'ACUTE_BACTERIAL_MENINGITIS' : 'SEVERE_SEPSIS_SEPTIC_SHOCK';
    redFlags.push('Systemic inflammatory response / suspected sepsis / hemodynamic collapse');
  }

  // P. OPHTHALMIC EMERGENCY
  if (hasOphthalmic && eventType === 'GENERAL_SYMPTOM') {
    eventType = 'OPHTHALMIC_EMERGENCY';
    eventFamily = 'OPHTHALMOLOGY';
    specificEvent = norm.includes('glaucoma') || norm.includes('halos') ? 'ACUTE_ANGLE_CLOSURE_GLAUCOMA' :
      norm.includes('retinal') || norm.includes('curtain') ? 'ACUTE_RETINAL_DETACHMENT' :
      'OCULAR_CHEMICAL_INJURY';
    redFlags.push('Ophthalmic emergency with acute threat to vision');
  }

  // Q. ENDOCRINE METABOLIC
  if (hasEndocrine && eventType === 'GENERAL_SYMPTOM') {
    eventType = 'ENDOCRINE_METABOLIC';
    eventFamily = 'ENDOCRINOLOGY_AND_METABOLIC';
    specificEvent = (norm.includes('dka') || norm.includes('ketoacidosis') || norm.includes('fruity') || norm.includes('kussmaul')) ? 'DIABETIC_KETOACIDOSIS' : 'SEVERE_HYPOGLYCEMIC_COMA';
    redFlags.push('Acute metabolic decompensation / diabetic crisis');
  }

  // R. ENVIRONMENTAL EMERGENCY
  if (hasEnvironmental && eventType === 'GENERAL_SYMPTOM') {
    eventType = 'ENVIRONMENTAL_EMERGENCY';
    eventFamily = 'ENVIRONMENTAL_AND_TOXICOLOGY';
    specificEvent = norm.includes('heat') ? 'ACUTE_HEATSTROKE' :
      norm.includes('drowning') ? 'NEAR_DROWNING_SUBMERSION' :
      'CARBON_MONOXIDE_POISONING';
    redFlags.push('Critical environmental / toxic exposure life threat');
  }

  // S. HISTORICAL MEDICAL EVENT
  if (temporalContext === 'HISTORICAL') {
    eventType = 'HISTORICAL_MEDICAL_EVENT';
    eventFamily = 'HISTORICAL_OBSERVATION';
    specificEvent = specificEvent.startsWith('ACUTE_') ? specificEvent.replace('ACUTE_', 'PAST_') : `PAST_${specificEvent}`;
    redFlags.length = 0; // Clear acute red flags for purely historical events
  }

  // T. NON-MEDICAL / SOCIAL
  const socialRegex = /\b(love|like|hate|hello|hi|good\s+morning|good\s+evening|how\s+are\s+you|marry|married|friendship|breakup|girlfriend|boyfriend|job|money|weather|movie|joke|president|who\s+is|tell\s+me|sing|dance|sports|cricket|football|politics|pizza|aliens?)\b/i;
  if (socialRegex.test(norm) && eventType === 'GENERAL_SYMPTOM' && redFlags.length === 0 && symptoms.length === 0) {
    eventType = 'NON_MEDICAL_QUERY';
    eventFamily = 'NON_MEDICAL';
    specificEvent = 'NON_CLINICAL_STATEMENT';
  }

  // N. INSUFFICIENT INFORMATION
  const vagueRegex = /\b(i\s+don\s*t\s+feel\s+well|i\s+dont\s+feel\s+well|not\s+feeling\s+well|dont\s+feel\s+well|feeling\s+sick|unwell|tabiyat\s+kharab|tabiyat\s+theek\s+nahi|help\s+me|something\s+is\s+wrong\s+with\s+my\s+child|something\s+is\s+wrong|sick|not\s+well)\b/i;
  const isVague = vagueRegex.test(norm);

  if (isVague && eventType === 'GENERAL_SYMPTOM' && redFlags.length === 0 && symptoms.length === 0) {
    eventType = 'INSUFFICIENT_INFORMATION';
    eventFamily = 'INSUFFICIENT_DATA';
    specificEvent = 'UNDIFFERENTIATED_CHIEF_COMPLAINT';
  }

  // Determine Information Completeness
  let informationCompleteness: ClinicalSituation['informationCompleteness'] = 'SUFFICIENT';
  if (eventType === 'INSUFFICIENT_INFORMATION') {
    informationCompleteness = 'INSUFFICIENT';
  } else if (
    (eventType === 'VENOMOUS_STING' || eventType === 'VENOMOUS_BITE' || eventType === 'TOXIC_INGESTION') &&
    symptoms.length === 0 && subject.ageGroup === 'UNKNOWN'
  ) {
    informationCompleteness = 'PARTIAL';
  }

  // Determine Interpretation Confidence
  let interpretationConfidence: ClinicalSituation['interpretationConfidence'] = 'HIGH';
  if (eventType === 'INSUFFICIENT_INFORMATION') {
    interpretationConfidence = 'LOW';
  } else if (eventType === 'GENERAL_SYMPTOM' || informationCompleteness === 'PARTIAL') {
    interpretationConfidence = 'MEDIUM';
  }

  return {
    eventType,
    eventFamily,
    specificEvent,
    subject,
    temporalContext,
    mechanism,
    exposure,
    symptoms,
    redFlags,
    riskFactors,
    pregnancy: activePregnancy,
    consciousness,
    breathing,
    informationCompleteness,
    interpretationConfidence,
    rawText: rawInput,
    negatedItems,
    severityIndicators,
    informationSufficient: informationCompleteness === 'SUFFICIENT'
  };
}

// -------------------------------------------------------------------
// Pipeline Stage 3: Event-Specific Risk Assessment Models
// -------------------------------------------------------------------

/**
 * Event-Specific Risk Assessment for VENOMOUS_STING (e.g. Scorpion, Marine)
 */
function assessVenomousSting(situation: ClinicalSituation): Partial<TriageResult> {
  const isChild = situation.subject.ageGroup === 'INFANT' ||
    situation.subject.ageGroup === 'CHILD' ||
    situation.subject.relation === 'CHILD' ||
    situation.subject.relation === 'INFANT';

  const hasSystemicSigns = situation.rawText &&
    /\b(vomit|vomiting|sweat|sweating|breath|salivat|drool|shiver|spasm|tremor|faint|dizzy|nausea)\b/i.test(situation.rawText);

  const missingInfo = [
    'Patient age or vulnerability (child vs adult)',
    'Time elapsed since sting',
    'Local findings: spreading swelling, numbness, intense pain',
    'Systemic signs: sweating, vomiting, excessive drooling/salivation',
    'Neuromuscular symptoms: muscle twitching, restlessness',
    'Respiratory status: difficulty breathing or swallowing'
  ];

  const targetedQuestions = [
    'Who was stung (a young child, infant, or an adult)?',
    'How long ago did the sting happen?',
    'Are you experiencing severe local burning pain, numbness, or spreading swelling?',
    'Do you have any sweating, vomiting, excessive salivation, or involuntary muscle movements?',
    'Is there any difficulty breathing, wheezing, or difficulty swallowing?'
  ];

  if (isChild) {
    return {
      severity: 'EMERGENCY',
      emergency: true,
      assessment_status: 'EMERGENCY',
      department: 'Emergency Medicine',
      next_step: 'EMERGENCY',
      consultation_mode: 'NONE',
      recommended_action: 'Immediate emergency transport to the nearest hospital emergency department with pediatric envenomation capabilities.',
      reason: 'Venomous scorpion sting in a pediatric patient carries a high risk of rapid severe autonomic and cardiovascular envenomation (myocarditis, pulmonary edema) requiring immediate emergency monitoring and antivenom evaluation.',
      immediate_guidance: [
        'Call emergency medical services immediately (Dial 108/112).',
        'Keep the child calm and immobilize the affected limb below heart level.',
        'Do NOT cut, suck, apply ice directly, or apply tight tourniquets to the sting site.',
        'Monitor airway, breathing, and alertness continuously.'
      ],
      missing_information: missingInfo,
      targeted_questions: targetedQuestions
    };
  }

  if (hasSystemicSigns || situation.breathing !== 'NORMAL') {
    return {
      severity: 'EMERGENCY',
      emergency: true,
      assessment_status: 'EMERGENCY',
      department: 'Emergency Medicine',
      next_step: 'EMERGENCY',
      consultation_mode: 'NONE',
      recommended_action: 'Seek emergency department care immediately for systemic envenomation management.',
      reason: 'The presence of systemic manifestations (vomiting, sweating, respiratory distress, or autonomic signs) following a venomous sting indicates active systemic envenomation requiring immediate emergency clinical intervention.',
      immediate_guidance: [
        'Proceed immediately to the nearest emergency facility.',
        'Keep the affected body part rested and still.',
        'Do NOT attempt home remedies, incisions, or tourniquets.',
        'If vomiting, turn patient on their side to maintain open airway.'
      ],
      missing_information: missingInfo,
      targeted_questions: targetedQuestions
    };
  }

  return {
    severity: 'HIGH',
    emergency: false,
    assessment_status: 'URGENT_EVALUATION_RECOMMENDED',
    department: 'Emergency Medicine',
    next_step: 'URGENT_IN_PERSON',
    consultation_mode: 'IN_PERSON',
    recommended_action: 'Seek prompt in-person medical assessment at an urgent care or emergency facility. Video consultation is not appropriate.',
    reason: 'The reported event involves a scorpion sting. The urgency depends on the person\'s age, timing, local symptoms and any systemic symptoms, which should be assessed promptly by a healthcare professional in person.',
    immediate_guidance: [
      'Clean the sting site gently with soap and clean water.',
      'Immobilize the affected limb and remain calm to reduce venom circulation.',
      'Seek prompt in-person medical evaluation to monitor for delayed envenomation.',
      'CRITICAL: Video consultation is contraindicated; an in-person physical assessment is required.'
    ],
    missing_information: missingInfo,
    targeted_questions: targetedQuestions
  };
}

/**
 * Event-Specific Risk Assessment for VENOMOUS_BITE (Snake, Spider)
 */
function assessVenomousBite(situation: ClinicalSituation): Partial<TriageResult> {
  const isChild = situation.subject.ageGroup === 'INFANT' ||
    situation.subject.ageGroup === 'CHILD' ||
    situation.subject.relation === 'CHILD' ||
    situation.subject.relation === 'INFANT';

  const isElderly = situation.subject.ageGroup === 'OLDER_ADULT' || situation.subject.relation === 'PARENT';
  const isHighRiskSpecies = situation.rawText && /\b(cobra|krait)\b/i.test(situation.rawText);

  if (isChild || isElderly || isHighRiskSpecies) {
    return {
      severity: 'EMERGENCY',
      emergency: true,
      assessment_status: 'EMERGENCY',
      department: 'Emergency Medicine',
      next_step: 'EMERGENCY',
      consultation_mode: 'NONE',
      recommended_action: 'Call emergency medical services immediately for suspected venomous envenomation.',
      reason: 'Venomous snake envenomation (especially cobra, krait, or in vulnerable elderly/pediatric patients) is a life-threatening clinical emergency requiring urgent emergency transport and antivenom (ASV) staging.',
      immediate_guidance: [
        'Immobilize the bitten limb with a broad splint below heart level.',
        'Keep the patient completely calm and still.',
        'CRITICAL: Do NOT cut, suck the venom, apply electric shock, or tie arterial tourniquets.',
        'Proceed immediately to an emergency facility equipped with polyvalent antivenom.'
      ],
      missing_information: ['Exact species if safe to photograph', 'Time elapsed', 'Bite site swelling', 'Bleeding or neuro signs']
    };
  }

  return {
    severity: 'HIGH',
    emergency: false,
    assessment_status: 'URGENT_EVALUATION_RECOMMENDED',
    department: 'Emergency Medicine',
    next_step: 'URGENT_IN_PERSON',
    consultation_mode: 'IN_PERSON',
    recommended_action: 'Proceed immediately to an acute healthcare facility or emergency department equipped with polyvalent antivenom.',
    reason: 'All suspected venomous snakebites require urgent in-person medical observation and serial coagulation/neurological testing. Video consultation is strictly contraindicated.',
    immediate_guidance: [
      'Immobilize the bitten limb immediately using a splint or sling.',
      'Remove rings, watches, and tight clothing from the bitten limb before swelling starts.',
      'Do NOT make incisions, suck venom, or use tight tourniquets.',
      'Travel immediately by vehicle to the nearest hospital; avoid physical exertion.'
    ],
    missing_information: ['Time since bite', 'Local signs (swelling, blistering)', 'Systemic signs (ptosis, bleeding, hematuria)']
  };
}

/**
 * Event-Specific Risk Assessment for TOXIC_INGESTION & CHEMICAL_EXPOSURE
 */
function assessToxicIngestion(situation: ClinicalSituation): Partial<TriageResult> {
  const isChild = situation.subject.ageGroup === 'INFANT' ||
    situation.subject.ageGroup === 'CHILD' ||
    situation.subject.relation === 'CHILD' ||
    situation.subject.relation === 'INFANT';

  const substanceName = situation.exposure?.substance || 'toxic chemical';
  const hasInhalation = situation.mechanism === 'INHALATION' || (situation.rawText && /\b(inhaled|gas|fumes|chlorine)\b/i.test(situation.rawText));

  if (isChild || hasInhalation) {
    return {
      severity: 'EMERGENCY',
      emergency: true,
      assessment_status: 'EMERGENCY',
      department: 'Emergency Medicine',
      next_step: 'EMERGENCY',
      consultation_mode: 'NONE',
      recommended_action: 'Seek urgent emergency medical care or call the National Poisons Information Centre (AIIMS NPIC: 1800 116 117).',
      reason: `Toxic exposure (${substanceName}) in a child or via toxic vapor inhalation carries immediate risk of corrosive airway compromise or acute systemic poisoning.`,
      immediate_guidance: [
        'Seek urgent professional emergency care immediately.',
        'CRITICAL: Do NOT induce vomiting, and do NOT administer milk, salt water, or home remedies.',
        'Keep the chemical container, bottle, or packaging for toxicological identification by medical staff.',
        'Check that the patient is breathing and responsive.'
      ],
      missing_information: ['Exact quantity', 'Time elapsed', 'Container label active ingredients', 'Breathing difficulty']
    };
  }

  return {
    severity: 'HIGH',
    emergency: false,
    assessment_status: 'URGENT_EVALUATION_RECOMMENDED',
    department: 'Emergency Medicine',
    next_step: 'URGENT_IN_PERSON',
    consultation_mode: 'NONE',
    recommended_action: 'Seek immediate in-person emergency evaluation or consult the National Poisons Information Centre.',
    reason: `Ingestion of potentially toxic substance (${substanceName}) requires urgent professional toxicology evaluation.`,
    immediate_guidance: [
      'Do NOT induce vomiting under any circumstances.',
      'Preserve the product packaging or bottle label.',
      'Proceed immediately to an emergency facility for gastric protection and systemic monitoring.'
    ],
    missing_information: ['Quantity ingested', 'Estimated time of ingestion', 'Presence of oral burns or nausea']
  };
}

/**
 * Event-Specific Risk Assessment for MEDICATION_OVERDOSE
 */
function assessMedicationOverdose(situation: ClinicalSituation): Partial<TriageResult> {
  const isChild = situation.subject.ageGroup === 'INFANT' ||
    situation.subject.ageGroup === 'CHILD' ||
    situation.subject.relation === 'CHILD' ||
    situation.subject.relation === 'INFANT';

  const isMassiveOrSedative = situation.rawText && /\b(entire bottle|sleeping pills|blood pressure|overdose)\b/i.test(situation.rawText);

  if (isChild && isMassiveOrSedative) {
    return {
      severity: 'EMERGENCY',
      emergency: true,
      assessment_status: 'EMERGENCY',
      department: 'Emergency Medicine / Pediatrics',
      next_step: 'EMERGENCY',
      consultation_mode: 'NONE',
      recommended_action: 'Seek emergency medical evaluation immediately.',
      reason: 'Accidental ingestion of cardiovascular medication or sedative overdose in a young child is a critical clinical emergency.',
      immediate_guidance: [
        'Call emergency services immediately.',
        'Keep the medication strip or bottle ready for doctors.',
        'Do NOT induce vomiting.'
      ]
    };
  }

  if (isMassiveOrSedative) {
    return {
      severity: 'EMERGENCY',
      emergency: true,
      assessment_status: 'EMERGENCY',
      department: 'Emergency Medicine',
      next_step: 'EMERGENCY',
      consultation_mode: 'NONE',
      recommended_action: 'Call emergency medical services immediately for acute pharmaceutical overdose.',
      reason: 'Large-volume or sedative medication overdose carries immediate risk of respiratory depression, coma, or fatal arrhythmia.',
      immediate_guidance: ['Call emergency medical services immediately.']
    };
  }

  return {
    severity: 'HIGH',
    emergency: false,
    assessment_status: 'URGENT_EVALUATION_RECOMMENDED',
    department: 'Emergency Medicine',
    next_step: 'URGENT_IN_PERSON',
    consultation_mode: 'NONE',
    recommended_action: 'Seek prompt in-person emergency evaluation or contact a poison control center.',
    reason: 'Ingestion of an unidentified pharmaceutical tablet requires prompt clinical monitoring for delayed systemic toxicity.',
    immediate_guidance: ['Bring any loose tablets or blister packs for identification.']
  };
}

/**
 * Event-Specific Risk Assessment for ANIMAL_BITE
 */
function assessAnimalBite(situation: ClinicalSituation): Partial<TriageResult> {
  const isHighRiskRabies = situation.rawText && /\b(bat|raccoon|fox)\b/i.test(situation.rawText);

  return {
    severity: isHighRiskRabies ? 'HIGH' : 'MODERATE',
    emergency: false,
    assessment_status: isHighRiskRabies ? 'URGENT_EVALUATION_RECOMMENDED' : 'ASSESSED',
    department: 'Emergency Medicine / Infectious Disease',
    next_step: 'URGENT_IN_PERSON',
    consultation_mode: 'IN_PERSON',
    recommended_action: isHighRiskRabies ?
      'Seek urgent in-person medical evaluation within 24 hours for rabies post-exposure prophylaxis (PEP).' :
      'Consult a doctor in-person for wound cleaning, tetanus, and rabies evaluation.',
    reason: isHighRiskRabies ?
      'High-risk mammalian animal bite (e.g. bat/monkey) carries a lethal risk of rabies transmission requiring urgent vaccine and immunoglobulin administration.' :
      'Animal bites carry significant risk of polymicrobial bacterial wound infection and rabies.',
    immediate_guidance: [
      'Wash the bite wound immediately under running tap water with soap for at least 15 minutes.',
      'Apply an antiseptic (povidone-iodine) if available.',
      'CRITICAL: Do NOT cauterize or seal the wound with tight dressings.',
      'Seek urgent in-person medical care for rabies vaccination and tetanus booster.'
    ]
  };
}

/**
 * Event-Specific Risk Assessment for INSECT_BITE_OR_STING
 */
function assessInsectBiteOrSting(situation: ClinicalSituation): Partial<TriageResult> {
  const isChild = situation.subject.ageGroup === 'INFANT' ||
    situation.subject.ageGroup === 'CHILD' ||
    situation.subject.relation === 'CHILD';

  const isMultipleOrSevere = situation.rawText && /\b(swarm|multiple|wheez|lips|throat|face)\b/i.test(situation.rawText);

  if (isChild && isMultipleOrSevere) {
    return {
      severity: 'EMERGENCY',
      emergency: true,
      assessment_status: 'EMERGENCY',
      department: 'Emergency Medicine',
      next_step: 'EMERGENCY',
      consultation_mode: 'NONE',
      recommended_action: 'Proceed immediately to the emergency department for multiple envenomation monitoring.',
      reason: 'Multiple hymenoptera stings in a child carry high risks of systemic toxic reaction, acute hemolysis, or delayed anaphylaxis.',
      immediate_guidance: ['Seek immediate emergency medical care.']
    };
  }

  return {
    severity: 'HIGH',
    emergency: false,
    assessment_status: 'URGENT_EVALUATION_RECOMMENDED',
    department: 'Emergency Medicine / Urgent Care',
    next_step: 'URGENT_IN_PERSON',
    consultation_mode: 'IN_PERSON',
    recommended_action: 'Seek prompt in-person medical assessment.',
    reason: 'Insect or venomous arthropod sting evaluation.'
  };
}

/**
 * Event-Specific Risk Assessment for CARDIAC_EVENT
 */
function assessCardiacEvent(situation: ClinicalSituation): Partial<TriageResult> {
  if (situation.temporalContext === 'HISTORICAL') {
    return {
      severity: 'LOW',
      emergency: false,
      assessment_status: 'ASSESSED',
      department: 'Cardiology',
      next_step: 'ROUTINE_CONSULTATION',
      consultation_mode: 'CHOICE',
      recommended_action: 'Schedule a routine consultation with a cardiologist for preventive cardiac follow-up.',
      reason: 'The reported cardiac event occurred historically with no current acute chest pain or hemodynamic compromise reported.',
      immediate_guidance: [
        'Maintain routine cardiology follow-up and lipid/blood pressure tracking.',
        'Take prescribed maintenance medications as directed.',
        'Seek immediate emergency care if acute chest pain or pressure ever recurs.'
      ],
      missing_information: []
    };
  }

  return {
    severity: 'EMERGENCY',
    emergency: true,
    assessment_status: 'EMERGENCY',
    department: 'Emergency Medicine / Cardiology',
    next_step: 'EMERGENCY',
    consultation_mode: 'NONE',
    recommended_action: 'Call emergency medical services immediately (Dial 108/112) for acute cardiac evaluation.',
    reason: 'Active severe chest pain, crushing tightness, or suspected acute myocardial infarction is a time-critical cardiovascular emergency requiring urgent 12-lead ECG and emergency reperfusion assessment.',
    immediate_guidance: [
      'Call emergency medical services immediately.',
      'Sit comfortably and rest; avoid physical exertion.',
      'Loosen any tight clothing around the neck and chest.',
      'If recommended by an emergency physician and not allergic, chew one adult aspirin (300mg).'
    ],
    missing_information: ['Duration of chest pain', 'Radiation to arm or jaw', 'Associated shortness of breath or diaphoresis']
  };
}

/**
 * Event-Specific Risk Assessment for NEUROLOGICAL_EVENT
 */
function assessNeurologicalEvent(situation: ClinicalSituation): Partial<TriageResult> {
  if (situation.temporalContext === 'HISTORICAL') {
    return {
      severity: 'LOW',
      emergency: false,
      assessment_status: 'ASSESSED',
      department: 'Neurology',
      next_step: 'ROUTINE_CONSULTATION',
      consultation_mode: 'CHOICE',
      recommended_action: 'Schedule a routine follow-up with a neurologist for chronic care management.',
      reason: 'The reported stroke or neurological event occurred in the past with no acute new deficits reported.',
      immediate_guidance: ['Continue prescribed secondary stroke prevention therapies.'],
      missing_information: []
    };
  }

  return {
    severity: 'EMERGENCY',
    emergency: true,
    assessment_status: 'EMERGENCY',
    department: 'Emergency Medicine / Neurology',
    next_step: 'EMERGENCY',
    consultation_mode: 'NONE',
    recommended_action: 'Activate emergency services immediately for suspected acute stroke (Code Stroke Protocol).',
    reason: 'Sudden focal motor loss, unilateral weakness, acute vision loss, or acute speech deficits represent suspected acute cerebrovascular ischemia requiring hyperacute CT neuroimaging and thrombolytic evaluation within the therapeutic window.',
    immediate_guidance: [
      'Call emergency services immediately (Dial 108/112).',
      'Note the EXACT time when symptoms were first observed.',
      'Do NOT give food, drink, or medications (aspiration risk).',
      'Keep patient lying flat on their side if vomiting.'
    ],
    missing_information: ['Time when patient was last known well', 'Facial asymmetry', 'Arm drift ability']
  };
}

/**
 * Event-Specific Risk Assessment for LOSS_OF_CONSCIOUSNESS
 */
function assessLossOfConsciousness(): Partial<TriageResult> {
  return {
    severity: 'EMERGENCY',
    emergency: true,
    assessment_status: 'EMERGENCY',
    department: 'Emergency Medicine',
    next_step: 'EMERGENCY',
    consultation_mode: 'NONE',
    recommended_action: 'Call emergency medical services immediately (Dial 108/112).',
    reason: 'Acute unresponsiveness, collapse, or failure to regain consciousness is a critical emergency requiring immediate airway, breathing, and circulatory intervention.',
    immediate_guidance: [
      'Call emergency services immediately.',
      'Check breathing: if breathing normally, place in the recovery position (on their side).',
      'If not breathing or only gasping, immediately start CPR.',
      'Do not attempt to feed or pour water into the mouth of an unresponsive person.'
    ],
    missing_information: ['Presence of normal breathing or pulse', 'Duration of unresponsiveness', 'Head trauma history']
  };
}

/**
 * Event-Specific Risk Assessment for PREGNANCY_RELATED
 */
function assessPregnancyRelated(situation: ClinicalSituation): Partial<TriageResult> {
  return {
    severity: 'EMERGENCY',
    emergency: true,
    assessment_status: 'EMERGENCY',
    department: 'Obstetrics & Gynecology / Emergency',
    next_step: 'EMERGENCY',
    consultation_mode: 'NONE',
    recommended_action: 'Seek emergency obstetric and gynecologic care immediately.',
    reason: 'Severe abdominal pain, vaginal bleeding, or syncope in pregnancy are critical obstetric red flags indicating possible placental abruption, ectopic pregnancy, preterm labor, or fetal compromise.',
    immediate_guidance: [
      'Proceed immediately to an obstetric emergency facility.',
      'Lie on the left side to maximize uteroplacental blood flow.',
      'Do not take medications without direct obstetrician guidance.'
    ],
    missing_information: ['Gestational age (weeks/trimester)', 'Character and severity of bleeding', 'Presence of fetal movements']
  };
}

/**
 * Event-Specific Risk Assessment for INSUFFICIENT_INFORMATION
 */
function assessInsufficientInformation(situation: ClinicalSituation): Partial<TriageResult> {
  const isChild = situation.subject.relation === 'CHILD' || situation.subject.relation === 'INFANT';

  return {
    severity: 'MORE_INFORMATION',
    emergency: false,
    assessment_status: 'MORE_INFORMATION_REQUIRED',
    department: isChild ? 'Pediatrics' : 'General Medicine',
    next_step: 'MORE_INFORMATION',
    consultation_mode: 'NONE',
    recommended_action: 'Please provide more details regarding the specific symptoms or situation so an accurate assessment can be made.',
    reason: 'The provided description lacks specific clinical details regarding symptoms, onset, or severity.',
    immediate_guidance: [
      'Please describe what symptoms are present (e.g. fever, pain, cough, rash, nausea).',
      'Mention how long the symptoms have been present.',
      'If there are any sudden or severe signs (chest pain, breathing difficulty, unresponsiveness), seek emergency care immediately.'
    ],
    missing_information: ['Chief complaint / specific symptom', 'Onset and duration', 'Severity rating', 'Associated symptoms'],
    targeted_questions: [
      'What specific symptom is causing the most discomfort?',
      'When did this start, and has it gotten progressively worse?',
      'Are there any acute red flags such as chest pain, breathing difficulty, or fainting?'
    ]
  };
}

/**
 * Event-Specific Risk Assessment for ACUTE_ABDOMEN (Appendicitis, Peritonitis, Bowel Obstruction)
 */
function assessAcuteAbdomen(situation: ClinicalSituation): Partial<TriageResult> {
  const isEmergency = situation.specificEvent === 'ACUTE_APPENDICITIS' ||
    situation.specificEvent === 'ACUTE_PERITONITIS' ||
    situation.specificEvent === 'ACUTE_BOWEL_OBSTRUCTION' ||
    situation.specificEvent === 'ACUTE_PANCREATITIS' ||
    situation.redFlags.length > 0 ||
    situation.severityIndicators.length > 0;

  return {
    severity: isEmergency ? 'EMERGENCY' : 'HIGH',
    emergency: isEmergency,
    assessment_status: isEmergency ? 'EMERGENCY' : 'URGENT_EVALUATION_RECOMMENDED',
    department: 'General Surgery / Emergency Medicine',
    next_step: isEmergency ? 'EMERGENCY' : 'URGENT_IN_PERSON',
    consultation_mode: isEmergency ? 'NONE' : 'IN_PERSON',
    recommended_action: isEmergency
      ? 'Seek immediate emergency medical and surgical evaluation at the nearest hospital emergency department. Do not delay.'
      : 'Seek prompt in-person surgical evaluation for acute abdominal pain. Video consultation is not appropriate.',
    reason: situation.specificEvent === 'ACUTE_APPENDICITIS'
      ? 'Suspected acute appendicitis presenting with acute severe abdominal pain. This is a surgical emergency with high risk of perforation, peritonitis, and intra-abdominal sepsis.'
      : 'Acute abdominal presentation requiring prompt in-person surgical assessment to rule out acute surgical abdomen, peritonitis, or bowel obstruction.',
    immediate_guidance: [
      'Proceed immediately to the nearest hospital with general surgical capabilities (Dial 108/112).',
      'Do NOT eat or drink anything (remain strictly NPO / fasting) in case urgent surgery or anesthesia is required.',
      'Do NOT apply heating pads, hot water bottles, or take laxatives/enemas, as these significantly increase the risk of appendix rupture.',
      'Do NOT take heavy pain suppressants before surgical examination to avoid masking clinical signs of acute peritonitis.'
    ],
    missing_information: [
      'Exact localization of pain (e.g. right lower quadrant / McBurney point)',
      'Fever, chills, nausea, vomiting, or inability to pass gas',
      'Rebound tenderness or abdominal wall rigidity',
      'Duration and progression of pain'
    ],
    targeted_questions: [
      'Is the pain sharpest in the lower right quadrant of your abdomen?',
      'Have you experienced any fever, chills, nausea, or vomiting?',
      'Does the pain worsen significantly when coughing, walking, or releasing abdominal pressure?'
    ]
  };
}

/**
 * Event-Specific Risk Assessment for SURGICAL_EMERGENCY (Torsion, Cauda Equina, Necrotizing)
 */
function assessSurgicalEmergency(situation: ClinicalSituation): Partial<TriageResult> {
  return {
    severity: 'EMERGENCY',
    emergency: true,
    assessment_status: 'EMERGENCY',
    department: situation.specificEvent === 'TESTICULAR_TORSION' ? 'Urology / Emergency Medicine' : 'General Surgery / Emergency Medicine',
    next_step: 'EMERGENCY',
    consultation_mode: 'NONE',
    recommended_action: 'Immediate emergency transport to the nearest hospital for urgent surgical intervention. Time is critical to preserve tissue viability.',
    reason: `Time-critical surgical emergency (${situation.specificEvent}). Rapid surgical decompression or intervention is necessary to prevent permanent necrosis or irreversible disability.`,
    immediate_guidance: [
      'Call emergency medical services or proceed immediately to the nearest emergency department (Dial 108/112).',
      'Do NOT eat or drink anything (remain strictly fasting) in preparation for possible emergency surgery.',
      'Avoid home remedies or applying local heat.'
    ],
    missing_information: ['Exact onset time (hours elapsed)', 'Associated swelling or skin discoloration'],
    targeted_questions: ['How many hours ago did the acute pain begin?']
  };
}

/**
 * Event-Specific Risk Assessment for SEPSIS (Severe Sepsis, Septic Shock, Meningitis)
 */
function assessSepsis(situation: ClinicalSituation): Partial<TriageResult> {
  return {
    severity: 'EMERGENCY',
    emergency: true,
    assessment_status: 'EMERGENCY',
    department: 'Emergency Medicine / Critical Care',
    next_step: 'EMERGENCY',
    consultation_mode: 'NONE',
    recommended_action: 'Immediate emergency medical transport (Dial 108/112). Sepsis and central nervous system infections are life-threatening medical emergencies.',
    reason: 'Clinical presentation concerning for systemic inflammatory response, severe sepsis, septic shock, or acute bacterial meningitis requiring emergent IV resuscitation and antimicrobial therapy.',
    immediate_guidance: [
      'Call emergency services immediately (Dial 108/112).',
      'Keep patient resting flat, maintain open airway, and monitor breathing continuously.',
      'Do NOT delay emergency transport for oral home remedies.'
    ]
  };
}

/**
 * Event-Specific Risk Assessment for OPHTHALMIC_EMERGENCY (Glaucoma, Retinal Detachment, Chemical Splash)
 */
function assessOphthalmicEmergency(situation: ClinicalSituation): Partial<TriageResult> {
  const isChemical = situation.specificEvent === 'OCULAR_CHEMICAL_INJURY';
  return {
    severity: 'EMERGENCY',
    emergency: true,
    assessment_status: 'EMERGENCY',
    department: 'Ophthalmology / Emergency Medicine',
    next_step: 'EMERGENCY',
    consultation_mode: 'NONE',
    recommended_action: isChemical
      ? 'Immediately flush the eye with copious clean water for 15-20 minutes, then proceed to the nearest emergency room immediately.'
      : 'Immediate emergency evaluation by an ophthalmologist or emergency physician to preserve vision.',
    reason: 'Acute sight-threatening ophthalmic emergency requiring emergent clinical assessment to prevent permanent blindness.',
    immediate_guidance: isChemical ? [
      'Flush the affected eye immediately with lukewarm tap water or saline for at least 15 minutes without delay.',
      'Do NOT rub the eye or apply any eye drops/ointments.',
      'Proceed immediately to the nearest emergency room while continuing irrigation if possible.'
    ] : [
      'Proceed immediately to an eye hospital or emergency department.',
      'Do NOT rub or apply pressure to the eye.',
      'Keep head still and avoid bending over.'
    ]
  };
}

/**
 * Event-Specific Risk Assessment for ENDOCRINE_METABOLIC (DKA, Severe Hypoglycemia)
 */
function assessEndocrineMetabolic(situation: ClinicalSituation): Partial<TriageResult> {
  return {
    severity: 'EMERGENCY',
    emergency: true,
    assessment_status: 'EMERGENCY',
    department: 'Endocrinology / Emergency Medicine',
    next_step: 'EMERGENCY',
    consultation_mode: 'NONE',
    recommended_action: 'Immediate emergency department transport. Diabetic ketoacidosis and profound hypoglycemia carry severe risk of coma and metabolic collapse.',
    reason: 'Acute metabolic crisis (suspected DKA or severe hypoglycemia) requiring urgent intravenous resuscitation, glucose correction, and ICU/ED monitoring.',
    immediate_guidance: [
      'Call emergency services immediately (Dial 108/112).',
      'If conscious and hypoglycemia is suspected, administer fast-acting oral glucose (fruit juice or sugar). If unalert, do NOT give fluids by mouth.',
      'Place patient in recovery position if consciousness fluctuates.'
    ]
  };
}

/**
 * Event-Specific Risk Assessment for ENVIRONMENTAL_EMERGENCY (Heatstroke, Drowning, Hypothermia, CO)
 */
function assessEnvironmentalEmergency(situation: ClinicalSituation): Partial<TriageResult> {
  return {
    severity: 'EMERGENCY',
    emergency: true,
    assessment_status: 'EMERGENCY',
    department: 'Emergency Medicine / Critical Care',
    next_step: 'EMERGENCY',
    consultation_mode: 'NONE',
    recommended_action: 'Immediate emergency medical transport (Dial 108/112). Severe environmental exposure requires urgent active stabilization.',
    reason: 'Life-threatening environmental emergency (heatstroke, submersion, carbon monoxide poisoning, or hypothermia) requiring immediate hospital-level resuscitation.',
    immediate_guidance: [
      'Call emergency services immediately (Dial 108/112).',
      'Move patient immediately to fresh air, shade, or safe environment.',
      'If heatstroke: actively cool with wet cloths, fan, or ice packs in armpits/groin while awaiting EMS.',
      'Check breathing continuously and be prepared to initiate CPR if pulse/breathing stops.'
    ]
  };
}

/**
 * Pipeline Stage 4: Safety Validation & Safety Invariant Enforcement
 * Section 22: Enforces deterministic healthcare safety rules
 */
export function enforceSafetyInvariants(
  situation: ClinicalSituation,
  initialResult: Partial<TriageResult>
): TriageResult {
  const res: TriageResult = {
    event_type: situation.eventType,
    event_family: situation.eventFamily,
    specific_event: situation.specificEvent,
    severity: initialResult.severity || 'MODERATE',
    emergency: initialResult.emergency ?? false,
    assessment_status: initialResult.assessment_status || 'ASSESSED',
    department: initialResult.department || 'General Medicine',
    next_step: initialResult.next_step || 'VIDEO_OR_IN_PERSON',
    consultation_mode: initialResult.consultation_mode || 'CHOICE',
    recommended_action: initialResult.recommended_action || 'Consult a healthcare professional for clinical evaluation.',
    reason: initialResult.reason || 'Clinical evaluation recommended based on reported details.',
    immediate_guidance: initialResult.immediate_guidance || [],
    confidence: initialResult.confidence || 'HIGH',
    risk_factors: [...situation.riskFactors, ...(initialResult.risk_factors || [])],
    red_flags: [...situation.redFlags, ...(initialResult.red_flags || [])],
    missing_information: initialResult.missing_information || [],
    targeted_questions: initialResult.targeted_questions,
    clinical_situation: {
      subject_relation: situation.subject.relation,
      event_type: situation.eventType,
      temporal_context: situation.temporalContext,
      route: situation.exposure?.route,
      substance: situation.exposure?.substance,
      event_family: situation.eventFamily,
      specific_event: situation.specificEvent
    }
  };

  // -------------------------------------------------------------
  // RULE 1: LOSS_OF_CONSCIOUSNESS -> never LOW, always EMERGENCY
  // -------------------------------------------------------------
  if (situation.consciousness === 'UNCONSCIOUS' || situation.eventType === 'LOSS_OF_CONSCIOUSNESS') {
    res.severity = 'EMERGENCY';
    res.emergency = true;
    res.assessment_status = 'EMERGENCY';
    res.next_step = 'EMERGENCY';
    res.consultation_mode = 'NONE';
  }

  // -------------------------------------------------------------
  // RULE 2: SEVERE_BREATHING_DIFFICULTY -> EMERGENCY
  // -------------------------------------------------------------
  if (situation.breathing === 'SEVERELY_DIFFICULT' || situation.breathing === 'DIFFICULT') {
    res.severity = 'EMERGENCY';
    res.emergency = true;
    res.assessment_status = 'EMERGENCY';
    res.next_step = 'EMERGENCY';
    res.consultation_mode = 'NONE';
  }

  // -------------------------------------------------------------
  // RULE 3: ANAPHYLAXIS -> EMERGENCY
  // -------------------------------------------------------------
  if (situation.eventType === 'ANAPHYLAXIS') {
    res.severity = 'EMERGENCY';
    res.emergency = true;
    res.assessment_status = 'EMERGENCY';
    res.next_step = 'EMERGENCY';
    res.consultation_mode = 'NONE';
  }

  // -------------------------------------------------------------
  // RULE 4: MAJOR_UNCONTROLLED_BLEEDING -> EMERGENCY
  // -------------------------------------------------------------
  if (situation.eventType === 'SEVERE_BLEEDING') {
    res.severity = 'EMERGENCY';
    res.emergency = true;
    res.assessment_status = 'EMERGENCY';
    res.next_step = 'EMERGENCY';
    res.consultation_mode = 'NONE';
  }

  // -------------------------------------------------------------
  // RULE 5: CURRENT_SUSPECTED_HEART_ATTACK -> EMERGENCY
  // -------------------------------------------------------------
  if (situation.eventType === 'CARDIAC_EVENT' && situation.temporalContext === 'CURRENT') {
    res.severity = 'EMERGENCY';
    res.emergency = true;
    res.assessment_status = 'EMERGENCY';
    res.next_step = 'EMERGENCY';
    res.consultation_mode = 'NONE';
  }

  // -------------------------------------------------------------
  // RULE 6: CHILD + TOXIC_INGESTION -> EMERGENCY, NEVER GENERIC LOW
  // -------------------------------------------------------------
  if (
    (situation.eventType === 'TOXIC_INGESTION' || situation.eventType === 'POISONING') &&
    (situation.subject.relation === 'CHILD' || situation.subject.relation === 'INFANT' || situation.subject.ageGroup === 'CHILD' || situation.subject.ageGroup === 'INFANT')
  ) {
    res.severity = 'EMERGENCY';
    res.emergency = true;
    res.assessment_status = 'EMERGENCY';
    res.next_step = 'EMERGENCY';
    res.consultation_mode = 'NONE';
  }

  // -------------------------------------------------------------
  // RULE 7: CHILD + VENOMOUS_BITE / STING -> EMERGENCY
  // -------------------------------------------------------------
  if (
    (situation.eventType === 'VENOMOUS_BITE' || situation.eventType === 'VENOMOUS_STING' || situation.eventType === 'INSECT_BITE_OR_STING') &&
    (situation.subject.relation === 'CHILD' || situation.subject.relation === 'INFANT' || situation.subject.ageGroup === 'CHILD' || situation.subject.ageGroup === 'INFANT') &&
    (situation.eventType !== 'INSECT_BITE_OR_STING' || (situation.rawText && /multiple|swarm/i.test(situation.rawText)))
  ) {
    res.severity = 'EMERGENCY';
    res.emergency = true;
    res.assessment_status = 'EMERGENCY';
    res.next_step = 'EMERGENCY';
    res.consultation_mode = 'NONE';
  }

  // -------------------------------------------------------------
  // RULE 8: VENOMOUS_BITE -> NEVER AUTOMATICALLY VIDEO
  // -------------------------------------------------------------
  if (situation.eventType === 'VENOMOUS_BITE') {
    if (res.consultation_mode === 'VIDEO' || res.consultation_mode === 'CHOICE') {
      res.consultation_mode = 'IN_PERSON';
    }
    if (res.severity === 'LOW' || res.severity === 'MODERATE') {
      res.severity = 'HIGH';
      res.next_step = 'URGENT_IN_PERSON';
    }
  }

  // -------------------------------------------------------------
  // RULE 9: VENOMOUS_STING -> NEVER AUTOMATICALLY VIDEO
  // -------------------------------------------------------------
  if (situation.eventType === 'VENOMOUS_STING') {
    if (res.consultation_mode === 'VIDEO' || res.consultation_mode === 'CHOICE') {
      res.consultation_mode = 'IN_PERSON';
    }
    if (res.severity === 'LOW' || res.severity === 'MODERATE') {
      res.severity = 'HIGH';
      res.assessment_status = 'URGENT_EVALUATION_RECOMMENDED';
      res.next_step = 'URGENT_IN_PERSON';
    }
  }

  // -------------------------------------------------------------
  // RULE 10: POSSIBLE_POISONING -> NEVER AUTOMATICALLY LOW
  // -------------------------------------------------------------
  if (situation.eventType === 'POISONING' || situation.eventType === 'TOXIC_INGESTION' || situation.eventType === 'CHEMICAL_EXPOSURE' || situation.eventType === 'MEDICATION_OVERDOSE') {
    if (res.severity === 'LOW' || res.severity === 'MODERATE') {
      res.severity = 'HIGH';
      res.next_step = 'URGENT_IN_PERSON';
    }
    if (res.consultation_mode === 'VIDEO') {
      res.consultation_mode = 'NONE';
    }
  }

  // -------------------------------------------------------------
  // RULE 11: PREGNANCY ACUTE COMPLICATION -> EMERGENCY
  // -------------------------------------------------------------
  if (situation.eventType === 'PREGNANCY_RELATED' && situation.redFlags.length > 0) {
    res.severity = 'EMERGENCY';
    res.emergency = true;
    res.assessment_status = 'EMERGENCY';
    res.next_step = 'EMERGENCY';
    res.consultation_mode = 'NONE';
  }

  // -------------------------------------------------------------
  // RULE 12: NEUROLOGICAL_EVENT ACUTE -> EMERGENCY
  // -------------------------------------------------------------
  if (situation.eventType === 'NEUROLOGICAL_EVENT' && situation.temporalContext === 'CURRENT') {
    res.severity = 'EMERGENCY';
    res.emergency = true;
    res.assessment_status = 'EMERGENCY';
    res.next_step = 'EMERGENCY';
    res.consultation_mode = 'NONE';
  }

  // -------------------------------------------------------------
  // RULE 14: ACUTE_ABDOMEN -> NEVER LOW; IF APPENDICITIS/SEVERE -> EMERGENCY
  // -------------------------------------------------------------
  if (situation.eventType === 'ACUTE_ABDOMEN') {
    if (situation.specificEvent === 'ACUTE_APPENDICITIS' || situation.severityIndicators.length > 0 || situation.redFlags.length > 0) {
      res.severity = 'EMERGENCY';
      res.emergency = true;
      res.assessment_status = 'EMERGENCY';
      res.next_step = 'EMERGENCY';
      res.consultation_mode = 'NONE';
      res.department = 'General Surgery / Emergency Medicine';
    } else if (res.severity === 'LOW') {
      res.severity = 'HIGH';
      res.next_step = 'URGENT_IN_PERSON';
      res.consultation_mode = 'IN_PERSON';
      res.department = 'General Surgery / Emergency Medicine';
    }
  }

  // -------------------------------------------------------------
  // RULE 15: SURGICAL_EMERGENCY, SEPSIS, OPHTHALMIC, ENDOCRINE, ENVIRONMENTAL -> EMERGENCY
  // -------------------------------------------------------------
  if (
    situation.eventType === 'SURGICAL_EMERGENCY' ||
    situation.eventType === 'SEPSIS' ||
    situation.eventType === 'OPHTHALMIC_EMERGENCY' ||
    situation.eventType === 'ENDOCRINE_METABOLIC' ||
    situation.eventType === 'ENVIRONMENTAL_EMERGENCY' ||
    situation.eventType === 'PSYCHIATRIC_CRISIS'
  ) {
    res.severity = 'EMERGENCY';
    res.emergency = true;
    res.assessment_status = 'EMERGENCY';
    res.next_step = 'EMERGENCY';
    res.consultation_mode = 'NONE';
  }

  // -------------------------------------------------------------
  // RULE 16: VIDEO SAFETY GATE
  // -------------------------------------------------------------
  if (
    res.emergency ||
    res.severity === 'EMERGENCY' ||
    res.severity === 'HIGH' ||
    situation.eventType === 'ANIMAL_BITE' ||
    situation.eventType === 'TRAUMA' ||
    situation.eventType === 'BURN' ||
    situation.eventType === 'ACUTE_ABDOMEN' ||
    situation.eventType === 'SURGICAL_EMERGENCY' ||
    situation.eventType === 'SEPSIS' ||
    situation.eventType === 'OPHTHALMIC_EMERGENCY' ||
    situation.eventType === 'ENDOCRINE_METABOLIC' ||
    situation.eventType === 'ENVIRONMENTAL_EMERGENCY' ||
    situation.eventType === 'PSYCHIATRIC_CRISIS'
  ) {
    if (res.consultation_mode === 'VIDEO') {
      res.consultation_mode = res.emergency ? 'NONE' : 'IN_PERSON';
    }
    if (res.next_step === 'VIDEO_PREFERRED') {
      res.next_step = res.emergency ? 'EMERGENCY' : 'URGENT_IN_PERSON';
    }
  }

  // -------------------------------------------------------------
  // RULE 17: GUARANTEE IMMEDIATE GUIDANCE
  // -------------------------------------------------------------
  if (!res.immediate_guidance || res.immediate_guidance.length === 0) {
    if (situation.eventType !== 'NON_MEDICAL_QUERY') {
      if (res.severity === 'EMERGENCY') {
        res.immediate_guidance = [
          'Do not eat or drink anything.',
          'Stay calm and remain seated or lying down until help arrives.'
        ];
      } else if (res.severity === 'HIGH') {
        res.immediate_guidance = [
          'Avoid strenuous activity.',
          'Have someone monitor your condition while waiting for medical care.'
        ];
      } else if (res.severity === 'MODERATE') {
        res.immediate_guidance = [
          'Rest and monitor your symptoms closely.',
          'Seek urgent care if symptoms suddenly worsen.'
        ];
      } else {
        res.immediate_guidance = [
          'Maintain normal hydration and rest.',
          'Monitor for any new or worsening symptoms.'
        ];
      }
    } else {
      res.immediate_guidance = [];
    }
  }

  return res;
}

/**
 * Master Clinical Evaluation Function:
 * Dispatches to the appropriate event-specific assessment strategy.
 */
export function evaluateClinicalSituation(situation: ClinicalSituation): TriageResult {
  let partialResult: Partial<TriageResult>;

  switch (situation.eventType) {
    case 'VENOMOUS_STING':
      partialResult = assessVenomousSting(situation);
      break;
    case 'VENOMOUS_BITE':
      partialResult = assessVenomousBite(situation);
      break;
    case 'INSECT_BITE_OR_STING':
      partialResult = assessInsectBiteOrSting(situation);
      break;
    case 'ACUTE_ABDOMEN':
      partialResult = assessAcuteAbdomen(situation);
      break;
    case 'SURGICAL_EMERGENCY':
      partialResult = assessSurgicalEmergency(situation);
      break;
    case 'SEPSIS':
      partialResult = assessSepsis(situation);
      break;
    case 'OPHTHALMIC_EMERGENCY':
      partialResult = assessOphthalmicEmergency(situation);
      break;
    case 'ENDOCRINE_METABOLIC':
      partialResult = assessEndocrineMetabolic(situation);
      break;
    case 'ENVIRONMENTAL_EMERGENCY':
      partialResult = assessEnvironmentalEmergency(situation);
      break;
    case 'ALLERGIC_REACTION':
      if (situation.rawText && /\b(seasonal|mild\s+allergy|hay\s*fever|sneezing|sneeze|spring\s+allergy)\b/i.test(situation.rawText)) {
        partialResult = {
          severity: 'LOW',
          emergency: false,
          assessment_status: 'ASSESSED',
          department: 'General Medicine / Allergy',
          next_step: 'ROUTINE_CONSULTATION',
          consultation_mode: 'VIDEO',
          recommended_action: 'Schedule a routine consultation or video visit for seasonal allergy management.',
          reason: 'Reported symptoms are consistent with mild seasonal allergies, appropriate for outpatient or telemedicine care.',
          immediate_guidance: ['Avoid known seasonal triggers and pollen exposure.']
        };
      } else {
        partialResult = {
          severity: 'HIGH',
          emergency: false,
          assessment_status: 'URGENT_EVALUATION_RECOMMENDED',
          department: 'Emergency Medicine / Allergy',
          next_step: 'URGENT_IN_PERSON',
          consultation_mode: 'IN_PERSON',
          recommended_action: 'Seek prompt in-person medical evaluation for acute allergic reaction / facial swelling.',
          reason: 'Acute facial or local angioedema requires in-person medical assessment to prevent progression to airway compromise.',
          immediate_guidance: [
            'Monitor airway and breathing continuously.',
            'Seek emergency care immediately if voice changes, throat tightness, or breathing difficulty develops.'
          ]
        };
      }
      break;
    case 'TRAUMA':
      partialResult = {
        severity: situation.redFlags.length > 0 ? 'EMERGENCY' : 'MODERATE',
        emergency: situation.redFlags.length > 0,
        assessment_status: situation.redFlags.length > 0 ? 'EMERGENCY' : 'ASSESSED',
        department: 'Emergency Medicine / Orthopedics / Trauma',
        next_step: situation.redFlags.length > 0 ? 'EMERGENCY' : 'URGENT_IN_PERSON',
        consultation_mode: situation.redFlags.length > 0 ? 'NONE' : 'IN_PERSON',
        recommended_action: situation.redFlags.length > 0 ?
          'Call emergency services immediately for high-impact trauma with neurological compromise.' :
          'Seek in-person trauma / physical evaluation at an urgent care or orthopedic clinic.',
        reason: 'Physical trauma evaluation.'
      };
      break;
    case 'BURN': {
      const isMajorBurn = situation.redFlags.length > 0 ||
        (situation.rawText && /\b(explosion|fire\s+burn|third\s+degree|charred|entire\s+chest\s+and\s+both\s+arms)\b/i.test(situation.rawText));
      partialResult = {
        severity: isMajorBurn ? 'EMERGENCY' : 'MODERATE',
        emergency: isMajorBurn,
        assessment_status: isMajorBurn ? 'EMERGENCY' : 'ASSESSED',
        department: isMajorBurn ? 'Emergency Medicine / Burn Center' : 'Emergency Medicine / Urgent Care',
        next_step: isMajorBurn ? 'EMERGENCY' : 'URGENT_IN_PERSON',
        consultation_mode: isMajorBurn ? 'NONE' : 'IN_PERSON',
        recommended_action: isMajorBurn ?
          'Proceed immediately to an emergency department or specialized burn center (Dial 108/112).' :
          'Seek prompt in-person medical evaluation for burn assessment and sterile dressing.',
        reason: 'Acute thermal or chemical burn injury requiring urgent in-person medical evaluation and sterile wound care.',
        immediate_guidance: [
          'Cool the burn immediately under cool running water for 10-20 minutes.',
          'Do NOT apply ice, butter, oil, or home ointments to the burn.',
          'Cover loosely with a clean, dry, sterile cloth.'
        ]
      };
      break;
    }
    case 'ANIMAL_BITE':
      partialResult = assessAnimalBite(situation);
      break;
    case 'TOXIC_INGESTION':
    case 'POISONING':
    case 'CHEMICAL_EXPOSURE':
      partialResult = assessToxicIngestion(situation);
      break;
    case 'MEDICATION_OVERDOSE':
      partialResult = assessMedicationOverdose(situation);
      break;
    case 'CARDIAC_EVENT':
      partialResult = assessCardiacEvent(situation);
      break;
    case 'NEUROLOGICAL_EVENT':
      partialResult = assessNeurologicalEvent(situation);
      break;
    case 'LOSS_OF_CONSCIOUSNESS':
      partialResult = assessLossOfConsciousness();
      break;
    case 'PSYCHIATRIC_CRISIS':
      partialResult = {
        severity: 'EMERGENCY',
        emergency: true,
        assessment_status: 'EMERGENCY',
        department: 'Emergency Medicine / Psychiatry',
        next_step: 'EMERGENCY',
        consultation_mode: 'NONE',
        recommended_action: 'Please call an ambulance (108/112) or a suicide prevention hotline immediately.',
        reason: 'The input indicates a severe risk of self-harm or a psychiatric emergency requiring immediate intervention.',
        immediate_guidance: [
          'Stay with the person if they are physically present.',
          'Do not leave them alone.',
          'Remove any potentially harmful items from the vicinity.',
          'Contact emergency services or a crisis helpline immediately.'
        ]
      };
      break;
    case 'PREGNANCY_RELATED':
      partialResult = assessPregnancyRelated(situation);
      break;
    case 'INSUFFICIENT_INFORMATION':
      partialResult = assessInsufficientInformation(situation);
      break;
    case 'HISTORICAL_MEDICAL_EVENT':
      partialResult = {
        severity: 'LOW',
        emergency: false,
        assessment_status: 'ASSESSED',
        department: 'General Medicine',
        next_step: 'ROUTINE_CONSULTATION',
        consultation_mode: 'CHOICE',
        recommended_action: 'Consult a primary care physician for routine medical follow-up.',
        reason: 'Reported condition is a past or historical medical event with no active acute symptoms described.'
      };
      break;
    case 'NON_MEDICAL_QUERY':
      partialResult = {
        severity: 'LOW',
        emergency: false,
        assessment_status: 'ASSESSED',
        department: 'General Support',
        next_step: 'MORE_INFORMATION',
        consultation_mode: 'NONE',
        recommended_action: 'Please provide clinical symptoms if you require medical assistance.',
        reason: 'The input appears to be conversational or non-medical in nature. No clinical triage required.',
        immediate_guidance: ['State your symptoms clearly if you need medical triage.']
      };
      break;
    default:
      if (situation.temporalContext === 'CURRENT') {
        const isRoutineMild = situation.rawText &&
          (/\b(mild\s+headache|seasonal\s+allergy|runny\s+nose|sore\s+throat|sneezing|chheenk|paper\s+cut|dry\s+(?:itchy\s+)?skin|dandruff|minor\s+bruise|scrape|fatigue\s+after|muscle\s+ache|tension\s+headache|chapped\s+skin|routine|vitamins|checkup|diet(?:ary)?|vaccination|exercise)\b/i.test(situation.rawText) ||
           situation.negatedItems.length > 0) &&
          situation.redFlags.length === 0;

        if (isRoutineMild) {
          partialResult = {
            severity: 'LOW',
            emergency: false,
            assessment_status: 'ASSESSED',
            department: 'General Medicine',
            next_step: 'ROUTINE_CONSULTATION',
            consultation_mode: 'VIDEO',
            recommended_action: 'Schedule a routine consultation with a general practitioner or clinic.',
            reason: 'Symptoms appear mild, non-critical, preventative, or routine, suitable for outpatient evaluation or video consultation.'
          };
        } else {
          partialResult = {
            severity: 'MODERATE',
            emergency: false,
            assessment_status: 'ASSESSED',
            department: 'General Medicine',
            next_step: 'VIDEO_OR_IN_PERSON',
            consultation_mode: 'CHOICE',
            recommended_action: 'Consult a healthcare professional for clinical evaluation of reported symptoms.',
            reason: 'Reported symptoms warrant clinical assessment to determine an accurate diagnosis.'
          };
        }
      } else {
        partialResult = {
          severity: 'LOW',
          emergency: false,
          assessment_status: 'ASSESSED',
          department: 'General Medicine',
          next_step: 'ROUTINE_CONSULTATION',
          consultation_mode: 'CHOICE',
          recommended_action: 'Schedule a routine medical check-up.',
          reason: 'Routine outpatient consultation recommended.'
        };
      }
      break;
  }

  // Safety Invariants layer enforces zero false-low and strict video safety
  return enforceSafetyInvariants(situation, partialResult);
}
