/**
 * Comprehensive Clinical Triage Test Suite & Unknown-Dataset Evaluation
 * MediNexus AI — Healthcare Urgency & Generalization Validation
 * 
 * Includes:
 * 1. Section 24: Critical Scorpion Envenomation Test Suite (11 cases)
 * 2. Sections 28-31: Clinical Regression Test Suite (38 cases)
 * 3. Section 25: 100+ Synthetic Unseen Clinical Cases across 20 medical domains
 */

import { triageEngine } from './triageEngine';
import { ClinicalEventType, TriageSeverity, TriageNextStep, ConsultationMode } from './types';

interface TestCase {
  id: number;
  domain: string;
  input: string;
  expectedEventType?: ClinicalEventType | string;
  expectedSpecificEvent?: string;
  expectedSeverity?: TriageSeverity;
  expectedEmergency?: boolean;
  expectedNextStep?: TriageNextStep;
  expectedConsultationMode?: ConsultationMode;
  forbidLow?: boolean;
  forbidVideo?: boolean;
  description: string;
}

export const testCases: TestCase[] = [
  // =========================================================================
  // PART 1: SECTION 24 — CRITICAL SCORPION SUITE (11 CASES)
  // =========================================================================
  {
    id: 1,
    domain: 'Scorpion Suite',
    input: 'I got scorpion bite',
    expectedEventType: 'VENOMOUS_STING',
    expectedSpecificEvent: 'SCORPION_STING',
    expectedSeverity: 'HIGH',
    expectedEmergency: false,
    expectedNextStep: 'URGENT_IN_PERSON',
    forbidLow: true,
    forbidVideo: true,
    description: 'Scorpion sting unrecognized severity adult -> HIGH, urgent in-person (NOT MODERATE/LOW/VIDEO)'
  },
  {
    id: 2,
    domain: 'Scorpion Suite',
    input: 'A scorpion stung me',
    expectedEventType: 'VENOMOUS_STING',
    expectedSpecificEvent: 'SCORPION_STING',
    expectedSeverity: 'HIGH',
    expectedEmergency: false,
    expectedNextStep: 'URGENT_IN_PERSON',
    forbidLow: true,
    forbidVideo: true,
    description: 'A scorpion stung me -> VENOMOUS_STING, HIGH'
  },
  {
    id: 3,
    domain: 'Scorpion Suite',
    input: 'Scorpion bit my child',
    expectedEventType: 'VENOMOUS_STING',
    expectedSpecificEvent: 'SCORPION_STING',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    expectedNextStep: 'EMERGENCY',
    forbidLow: true,
    forbidVideo: true,
    description: 'Scorpion sting in child -> EMERGENCY'
  },
  {
    id: 4,
    domain: 'Scorpion Suite',
    input: 'My 4 year old was stung by a scorpion',
    expectedEventType: 'VENOMOUS_STING',
    expectedSpecificEvent: 'SCORPION_STING',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    expectedNextStep: 'EMERGENCY',
    forbidLow: true,
    forbidVideo: true,
    description: '4yo child stung by scorpion -> EMERGENCY'
  },
  {
    id: 5,
    domain: 'Scorpion Suite',
    input: 'I got stung by a scorpion and now I have severe pain',
    expectedEventType: 'VENOMOUS_STING',
    expectedSpecificEvent: 'SCORPION_STING',
    expectedSeverity: 'HIGH',
    expectedEmergency: false,
    expectedNextStep: 'URGENT_IN_PERSON',
    forbidLow: true,
    forbidVideo: true,
    description: 'Scorpion sting with severe pain -> HIGH, urgent in-person'
  },
  {
    id: 6,
    domain: 'Scorpion Suite',
    input: 'Scorpion stung me and I am vomiting',
    expectedEventType: 'VENOMOUS_STING',
    expectedSpecificEvent: 'SCORPION_STING',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    expectedNextStep: 'EMERGENCY',
    forbidLow: true,
    forbidVideo: true,
    description: 'Scorpion sting + vomiting (systemic envenomation) -> EMERGENCY'
  },
  {
    id: 7,
    domain: 'Scorpion Suite',
    input: 'Scorpion stung me and I cannot breathe properly',
    expectedEventType: 'VENOMOUS_STING',
    expectedSpecificEvent: 'SCORPION_STING',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    expectedNextStep: 'EMERGENCY',
    forbidLow: true,
    forbidVideo: true,
    description: 'Scorpion sting + respiratory compromise -> EMERGENCY'
  },
  {
    id: 71,
    domain: 'Scorpion Suite',
    input: "I got scorpion bite and now I can't breathe.",
    expectedEventType: 'VENOMOUS_STING',
    expectedSpecificEvent: 'SCORPION_STING',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    expectedNextStep: 'EMERGENCY',
    forbidLow: true,
    forbidVideo: true,
    description: "Scorpion bite + can't breathe -> VENOMOUS_STING, EMERGENCY"
  },
  {
    id: 8,
    domain: 'Scorpion Suite',
    input: 'Scorpion stung me but I feel completely normal',
    expectedEventType: 'VENOMOUS_STING',
    expectedSpecificEvent: 'SCORPION_STING',
    expectedSeverity: 'HIGH',
    expectedEmergency: false,
    expectedNextStep: 'URGENT_IN_PERSON',
    forbidLow: true,
    forbidVideo: true,
    description: 'Recent scorpion sting asymptomatic -> HIGH (urgent in-person observation for delayed toxicity)'
  },
  {
    id: 9,
    domain: 'Scorpion Suite',
    input: 'I think something like a scorpion stung me',
    expectedEventType: 'VENOMOUS_STING',
    expectedSpecificEvent: 'SCORPION_STING',
    expectedSeverity: 'HIGH',
    expectedEmergency: false,
    expectedNextStep: 'URGENT_IN_PERSON',
    forbidLow: true,
    forbidVideo: true,
    description: 'Suspected scorpion sting -> VENOMOUS_STING, HIGH'
  },
  {
    id: 10,
    domain: 'Scorpion Suite',
    input: 'Bichhu ne kaat liya',
    expectedEventType: 'VENOMOUS_STING',
    expectedSpecificEvent: 'SCORPION_STING',
    expectedSeverity: 'HIGH',
    expectedEmergency: false,
    expectedNextStep: 'URGENT_IN_PERSON',
    forbidLow: true,
    forbidVideo: true,
    description: 'Hinglish: Bichhu ne kaat liya -> VENOMOUS_STING, HIGH'
  },
  {
    id: 11,
    domain: 'Scorpion Suite',
    input: 'Bichhu ne mere bachche ko kaat liya',
    expectedEventType: 'VENOMOUS_STING',
    expectedSpecificEvent: 'SCORPION_STING',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    expectedNextStep: 'EMERGENCY',
    forbidLow: true,
    forbidVideo: true,
    description: 'Hinglish: Bichhu child sting -> EMERGENCY'
  },

  // =========================================================================
  // PART 2: 38 REGRESSION CASES FROM PREVIOUS MILESTONE
  // =========================================================================
  {
    id: 12,
    domain: 'Regression / Unconsciousness',
    input: 'My father is unconscious.',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    expectedNextStep: 'EMERGENCY',
    forbidLow: true,
    forbidVideo: true,
    description: 'Unconsciousness in parent'
  },
  {
    id: 13,
    domain: 'Regression / Unresponsiveness',
    input: "My dad isn't responding.",
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    expectedNextStep: 'EMERGENCY',
    forbidLow: true,
    forbidVideo: true,
    description: 'Unresponsiveness paraphrase'
  },
  {
    id: 14,
    domain: 'Regression / Toxic Ingestion',
    input: 'My child drank phenyl.',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    expectedNextStep: 'EMERGENCY',
    forbidLow: true,
    forbidVideo: true,
    description: 'Child drank phenyl'
  },
  {
    id: 15,
    domain: 'Regression / Toxic Ingestion',
    input: 'My toddler swallowed cleaning liquid.',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    expectedNextStep: 'EMERGENCY',
    forbidLow: true,
    forbidVideo: true,
    description: 'Toddler swallowed cleaning liquid'
  },
  {
    id: 16,
    domain: 'Regression / Snakebite',
    input: 'I got bitten by a snake.',
    expectedEventType: 'VENOMOUS_BITE',
    expectedSeverity: 'HIGH',
    expectedNextStep: 'URGENT_IN_PERSON',
    forbidLow: true,
    forbidVideo: true,
    description: 'Adult snakebite'
  },
  {
    id: 17,
    domain: 'Regression / Snakebite Child',
    input: 'A snake just bit my child.',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    expectedNextStep: 'EMERGENCY',
    forbidLow: true,
    forbidVideo: true,
    description: 'Child snakebite'
  },
  {
    id: 18,
    domain: 'Regression / Chest Pain',
    input: 'I am having severe chest pain.',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    expectedNextStep: 'EMERGENCY',
    forbidLow: true,
    forbidVideo: true,
    description: 'Severe acute chest pain'
  },
  {
    id: 19,
    domain: 'Regression / Heart Attack',
    input: 'My father is having a heart attack.',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    expectedNextStep: 'EMERGENCY',
    forbidLow: true,
    forbidVideo: true,
    description: 'Active heart attack'
  },
  {
    id: 20,
    domain: 'Regression / Pregnancy',
    input: 'My pregnant wife has severe abdominal pain.',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    expectedNextStep: 'EMERGENCY',
    forbidLow: true,
    forbidVideo: true,
    description: 'Pregnancy acute abdominal pain'
  },
  {
    id: 21,
    domain: 'Regression / Neurological',
    input: 'I suddenly cannot move my right arm.',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    expectedNextStep: 'EMERGENCY',
    forbidLow: true,
    forbidVideo: true,
    description: 'Sudden unilateral motor deficit'
  },
  {
    id: 22,
    domain: 'Regression / Respiratory',
    input: 'I am having severe difficulty breathing.',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    expectedNextStep: 'EMERGENCY',
    forbidLow: true,
    forbidVideo: true,
    description: 'Severe respiratory distress'
  },
  {
    id: 23,
    domain: 'Regression / Bleeding',
    input: 'I am bleeding heavily.',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    expectedNextStep: 'EMERGENCY',
    forbidLow: true,
    forbidVideo: true,
    description: 'Heavy uncontrolled bleeding'
  },
  {
    id: 24,
    domain: 'Regression / Historical',
    input: 'My father had a heart attack five years ago.',
    expectedSeverity: 'LOW',
    expectedEmergency: false,
    expectedNextStep: 'ROUTINE_CONSULTATION',
    description: 'Historical heart attack'
  },
  {
    id: 25,
    domain: 'Regression / Historical',
    input: 'My mother had a stroke last year.',
    expectedSeverity: 'LOW',
    expectedEmergency: false,
    expectedNextStep: 'ROUTINE_CONSULTATION',
    description: 'Historical stroke'
  },
  {
    id: 26,
    domain: 'Regression / Insufficient Info',
    input: "I don't feel well.",
    expectedSeverity: 'MORE_INFORMATION',
    expectedEmergency: false,
    expectedNextStep: 'MORE_INFORMATION',
    forbidLow: true,
    description: 'Vague malaise'
  },
  {
    id: 27,
    domain: 'Regression / Insufficient Info Child',
    input: 'Something is wrong with my child.',
    expectedSeverity: 'MORE_INFORMATION',
    expectedEmergency: false,
    expectedNextStep: 'MORE_INFORMATION',
    forbidLow: true,
    description: 'Vague child concern'
  },
  {
    id: 28,
    domain: 'Regression / Toxic Ingestion',
    input: 'I drank something poisonous.',
    expectedSeverity: 'HIGH',
    expectedEmergency: false,
    expectedNextStep: 'URGENT_IN_PERSON',
    forbidLow: true,
    forbidVideo: true,
    description: 'Drank unknown poison'
  },
  {
    id: 29,
    domain: 'Regression / Toxic Exposure',
    input: 'I drank a venomous tea',
    expectedSeverity: 'HIGH',
    expectedEmergency: false,
    expectedNextStep: 'URGENT_IN_PERSON',
    forbidLow: true,
    forbidVideo: true,
    description: 'Drank toxic tea'
  },
  {
    id: 30,
    domain: 'Regression / Routine',
    input: 'I have a mild headache since this morning and no other symptoms.',
    expectedSeverity: 'LOW',
    expectedEmergency: false,
    expectedNextStep: 'ROUTINE_CONSULTATION',
    description: 'Mild headache'
  },
  {
    id: 31,
    domain: 'Regression / Routine',
    input: 'I have mild seasonal allergy symptoms.',
    expectedSeverity: 'LOW',
    expectedEmergency: false,
    expectedNextStep: 'ROUTINE_CONSULTATION',
    description: 'Seasonal allergies'
  },
  {
    id: 32,
    domain: 'Regression / Unconsciousness Paraphrase',
    input: "My dad isn't waking up.",
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    expectedNextStep: 'EMERGENCY',
    forbidLow: true,
    forbidVideo: true,
    description: 'Dad not waking up'
  },
  {
    id: 33,
    domain: 'Regression / Unconsciousness Paraphrase',
    input: 'He suddenly collapsed and won’t respond.',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    expectedNextStep: 'EMERGENCY',
    forbidLow: true,
    forbidVideo: true,
    description: 'Collapsed and wont respond'
  },
  {
    id: 34,
    domain: 'Regression / Unconsciousness Paraphrase',
    input: "My dad has passed out and I can't wake him.",
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    expectedNextStep: 'EMERGENCY',
    forbidLow: true,
    forbidVideo: true,
    description: 'Passed out cannot wake him'
  },
  {
    id: 35,
    domain: 'Regression / Toxic Ingestion Paraphrase',
    input: 'My toddler accidentally drank floor cleaner.',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    expectedNextStep: 'EMERGENCY',
    forbidLow: true,
    forbidVideo: true,
    description: 'Toddler drank floor cleaner'
  },
  {
    id: 36,
    domain: 'Regression / Toxic Ingestion Paraphrase',
    input: 'My baby drank the cleaning liquid.',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    expectedNextStep: 'EMERGENCY',
    forbidLow: true,
    forbidVideo: true,
    description: 'Baby drank cleaning liquid'
  },
  {
    id: 37,
    domain: 'Regression / Toxic Ingestion Paraphrase',
    input: 'He accidentally consumed household cleaner.',
    expectedSeverity: 'HIGH',
    expectedEmergency: false,
    expectedNextStep: 'URGENT_IN_PERSON',
    forbidLow: true,
    forbidVideo: true,
    description: 'Consumed household cleaner'
  },
  {
    id: 38,
    domain: 'Regression / Snakebite Paraphrase',
    input: 'Something that looked like a snake bit my son.',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    expectedNextStep: 'EMERGENCY',
    forbidLow: true,
    forbidVideo: true,
    description: 'Snake bit son'
  },
  {
    id: 39,
    domain: 'Regression / Historical Paraphrase',
    input: 'My dad suffered a heart attack in 2020.',
    expectedSeverity: 'LOW',
    expectedEmergency: false,
    expectedNextStep: 'ROUTINE_CONSULTATION',
    description: 'Heart attack in 2020'
  },
  {
    id: 40,
    domain: 'Regression / Historical Paraphrase',
    input: 'My father is a heart attack survivor.',
    expectedSeverity: 'LOW',
    expectedEmergency: false,
    expectedNextStep: 'ROUTINE_CONSULTATION',
    description: 'Heart attack survivor'
  },
  {
    id: 41,
    domain: 'Regression / Negation',
    input: 'My father is not unconscious.',
    expectedEmergency: false,
    description: 'Negation of unconsciousness'
  },
  {
    id: 42,
    domain: 'Regression / Negation',
    input: 'My child did not drink the phenyl.',
    expectedEmergency: false,
    description: 'Negation of phenyl ingestion'
  },
  {
    id: 43,
    domain: 'Regression / Negation',
    input: 'I am not having chest pain.',
    expectedEmergency: false,
    description: 'Negation of chest pain'
  },
  {
    id: 44,
    domain: 'Regression / Negation',
    input: 'My wife is not pregnant.',
    expectedEmergency: false,
    description: 'Negation of pregnancy'
  },
  {
    id: 45,
    domain: 'Regression / Hinglish',
    input: 'mere papa hosh mein nahi hain',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    expectedNextStep: 'EMERGENCY',
    forbidLow: true,
    forbidVideo: true,
    description: 'Hinglish: father not conscious'
  },
  {
    id: 46,
    domain: 'Regression / Hinglish',
    input: 'mere bachche ne phenyl pee liya',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    expectedNextStep: 'EMERGENCY',
    forbidLow: true,
    forbidVideo: true,
    description: 'Hinglish: child drank phenyl'
  },
  {
    id: 47,
    domain: 'Regression / Hinglish',
    input: 'saanp ne kaat liya',
    expectedEventType: 'VENOMOUS_BITE',
    expectedSeverity: 'HIGH',
    expectedNextStep: 'URGENT_IN_PERSON',
    forbidLow: true,
    forbidVideo: true,
    description: 'Hinglish: snake bite'
  },
  {
    id: 48,
    domain: 'Regression / Hinglish',
    input: 'meri wife ko bahut tez chest pain ho raha hai',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    expectedNextStep: 'EMERGENCY',
    forbidLow: true,
    forbidVideo: true,
    description: 'Hinglish: spouse severe chest pain'
  },
  {
    id: 49,
    domain: 'Regression / Hinglish',
    input: 'bachche ne cleaner pee liya',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    expectedNextStep: 'EMERGENCY',
    forbidLow: true,
    forbidVideo: true,
    description: 'Hinglish: child drank cleaner'
  },

  // =========================================================================
  // PART 3: 101 SYNTHETIC UNSEEN CLINICAL CASES (ACROSS 20 MEDICAL DOMAINS)
  // =========================================================================

  // Domain 1: Poisoning & Toxic Ingestion
  {
    id: 50,
    domain: 'Poisoning / Ingestion',
    input: 'I accidentally swallowed toilet cleaner.',
    expectedEventType: 'TOXIC_INGESTION',
    expectedSeverity: 'HIGH',
    forbidLow: true,
    forbidVideo: true,
    description: 'Swallowed toilet cleaner'
  },
  {
    id: 51,
    domain: 'Poisoning / Ingestion',
    input: 'My baby drank some unknown liquid from under the sink.',
    expectedEventType: 'TOXIC_INGESTION',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Baby drank unknown chemical liquid'
  },
  {
    id: 52,
    domain: 'Poisoning / Ingestion',
    input: 'A worker accidentally gulped agricultural pesticide.',
    expectedEventType: 'TOXIC_INGESTION',
    expectedSeverity: 'HIGH',
    forbidLow: true,
    forbidVideo: true,
    description: 'Ingested pesticide'
  },
  {
    id: 53,
    domain: 'Poisoning / Ingestion',
    input: 'My 3-year-old drank rat poison granules dissolved in water.',
    expectedEventType: 'TOXIC_INGESTION',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Child ingested rat poison'
  },
  {
    id: 54,
    domain: 'Poisoning / Ingestion',
    input: 'He drank paint thinner by mistake.',
    expectedEventType: 'TOXIC_INGESTION',
    expectedSeverity: 'HIGH',
    forbidLow: true,
    forbidVideo: true,
    description: 'Drank paint thinner'
  },

  // Domain 2: Venomous Stings (Non-Scorpion & Exotic)
  {
    id: 55,
    domain: 'Venomous Stings',
    input: 'I was stung by a jellyfish while swimming.',
    expectedEventType: 'VENOMOUS_STING',
    expectedSeverity: 'HIGH',
    forbidLow: true,
    forbidVideo: true,
    description: 'Jellyfish marine envenomation'
  },
  {
    id: 56,
    domain: 'Venomous Stings',
    input: 'A stingray stung my ankle at the beach.',
    expectedEventType: 'VENOMOUS_STING',
    expectedSeverity: 'HIGH',
    forbidLow: true,
    forbidVideo: true,
    description: 'Stingray venomous spine puncture'
  },
  {
    id: 57,
    domain: 'Venomous Stings',
    input: 'A giant centipede stung my foot.',
    expectedEventType: 'VENOMOUS_STING',
    expectedSeverity: 'HIGH',
    forbidLow: true,
    forbidVideo: true,
    description: 'Centipede sting envenomation'
  },
  {
    id: 58,
    domain: 'Venomous Stings',
    input: 'A swam of yellowjackets stung my daughter multiple times.',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Multiple wasp stings on child'
  },

  // Domain 3: Venomous Bites
  {
    id: 59,
    domain: 'Venomous Bites',
    input: 'A black widow spider bit my finger.',
    expectedEventType: 'VENOMOUS_BITE',
    expectedSeverity: 'HIGH',
    forbidLow: true,
    forbidVideo: true,
    description: 'Black widow spider envenomation'
  },
  {
    id: 60,
    domain: 'Venomous Bites',
    input: 'A venomous viper struck my leg while walking in tall grass.',
    expectedEventType: 'VENOMOUS_BITE',
    expectedSeverity: 'HIGH',
    forbidLow: true,
    forbidVideo: true,
    description: 'Viper snakebite'
  },
  {
    id: 61,
    domain: 'Venomous Bites',
    input: 'A brown recluse spider bit my arm.',
    expectedEventType: 'VENOMOUS_BITE',
    expectedSeverity: 'HIGH',
    forbidLow: true,
    forbidVideo: true,
    description: 'Brown recluse bite'
  },
  {
    id: 62,
    domain: 'Venomous Bites',
    input: 'A cobra bit my grandfather in the garden.',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Cobra bite on elderly parent'
  },

  // Domain 4: Animal Bites (Rabies vectors)
  {
    id: 63,
    domain: 'Animal Bites',
    input: 'A feral monkey bit my hand at the temple.',
    expectedEventType: 'ANIMAL_BITE',
    expectedSeverity: 'MODERATE',
    forbidVideo: true,
    description: 'Monkey bite rabies hazard'
  },
  {
    id: 64,
    domain: 'Animal Bites',
    input: 'A stray street dog bit deeply into my calf.',
    expectedEventType: 'ANIMAL_BITE',
    forbidVideo: true,
    description: 'Dog bite wound'
  },
  {
    id: 65,
    domain: 'Animal Bites',
    input: 'A bat bit my neck while sleeping in the cabin.',
    expectedEventType: 'ANIMAL_BITE',
    expectedSeverity: 'HIGH',
    forbidVideo: true,
    description: 'Bat bite rabies emergency prophylaxis'
  },

  // Domain 5: Chemical Exposures (Non-Ingestion)
  {
    id: 66,
    domain: 'Chemical Exposure',
    input: 'Battery acid splashed directly into my eyes.',
    expectedEventType: 'CHEMICAL_EXPOSURE',
    expectedSeverity: 'HIGH',
    forbidLow: true,
    forbidVideo: true,
    description: 'Ocular acid chemical splash'
  },
  {
    id: 67,
    domain: 'Chemical Exposure',
    input: 'I inhaled heavy chlorine gas fumes while mixing bleach.',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Toxic chlorine gas inhalation'
  },
  {
    id: 68,
    domain: 'Chemical Exposure',
    input: 'Industrial caustic soda spilled over my bare arms.',
    expectedEventType: 'CHEMICAL_EXPOSURE',
    expectedSeverity: 'HIGH',
    forbidLow: true,
    forbidVideo: true,
    description: 'Dermal caustic alkali chemical exposure'
  },

  // Domain 6: Medication Overdose
  {
    id: 69,
    domain: 'Medication Overdose',
    input: 'My child swallowed an unknown tablet.',
    expectedEventType: 'MEDICATION_OVERDOSE',
    expectedSeverity: 'HIGH',
    forbidLow: true,
    forbidVideo: true,
    description: 'Child ingested unknown medication tablet'
  },
  {
    id: 70,
    domain: 'Medication Overdose',
    input: 'He took an entire bottle of sleeping pills.',
    expectedEventType: 'MEDICATION_OVERDOSE',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Sleeping pills overdose'
  },
  {
    id: 71,
    domain: 'Medication Overdose',
    input: 'My toddler ate a strip of blood pressure medicine.',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Toddler swallowed cardiovascular medication'
  },

  // Domain 7: Allergic Reactions & Anaphylaxis
  {
    id: 72,
    domain: 'Allergic Reaction',
    input: 'Something bit me and now my face is swelling.',
    expectedEventType: 'ALLERGIC_REACTION',
    expectedSeverity: 'HIGH',
    forbidLow: true,
    forbidVideo: true,
    description: 'Facial angioedema after sting'
  },
  {
    id: 73,
    domain: 'Allergic Reaction',
    input: 'I ate peanuts and my throat is closing and lips are swollen.',
    expectedEventType: 'ANAPHYLAXIS',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Anaphylaxis airway compromise'
  },
  {
    id: 74,
    domain: 'Allergic Reaction',
    input: 'Full body hives and wheezing after taking amoxicillin.',
    expectedEventType: 'ANAPHYLAXIS',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Drug anaphylaxis with wheezing'
  },

  // Domain 8: Neurological Emergencies & Stroke
  {
    id: 75,
    domain: 'Neurological',
    input: "I suddenly can't move my left side.",
    expectedEventType: 'NEUROLOGICAL_EVENT',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Acute hemiparesis / stroke'
  },
  {
    id: 76,
    domain: 'Neurological',
    input: 'My mother suddenly became confused and cannot speak words properly.',
    expectedEventType: 'NEUROLOGICAL_EVENT',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Acute aphasia and acute confusion'
  },
  {
    id: 77,
    domain: 'Neurological',
    input: 'Right side of her face is drooping and speech is slurred.',
    expectedEventType: 'NEUROLOGICAL_EVENT',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Facial droop + slurred speech'
  },
  {
    id: 78,
    domain: 'Neurological',
    input: 'He is having active continuous full body convulsions and seizure.',
    expectedEventType: 'NEUROLOGICAL_EVENT',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Status epilepticus / convulsion'
  },

  // Domain 9: Cardiovascular Emergencies
  {
    id: 79,
    domain: 'Cardiovascular',
    input: 'Crushing heavy chest pain radiating down my left arm.',
    expectedEventType: 'CARDIAC_EVENT',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Classic acute coronary syndrome'
  },
  {
    id: 80,
    domain: 'Cardiovascular',
    input: 'Sudden immense chest tightness with cold sweating and nausea.',
    expectedEventType: 'CARDIAC_EVENT',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Severe cardiac pain with diaphoresis'
  },
  {
    id: 81,
    domain: 'Cardiovascular',
    input: 'It feels like an elephant is sitting on my chest.',
    expectedEventType: 'CARDIAC_EVENT',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Elephant on chest metaphor'
  },

  // Domain 10: Respiratory Emergencies
  {
    id: 82,
    domain: 'Respiratory',
    input: 'My brother is having difficulty breathing.',
    expectedEventType: 'RESPIRATORY_EVENT',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Acute breathing difficulty'
  },
  {
    id: 83,
    domain: 'Respiratory',
    input: 'My daughter is gasping for air and her lips are turning blue.',
    expectedEventType: 'RESPIRATORY_EVENT',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Pediatric cyanosis and respiratory failure'
  },
  {
    id: 84,
    domain: 'Respiratory',
    input: 'Choking on food and cannot speak or breathe.',
    expectedEventType: 'RESPIRATORY_EVENT',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Foreign body airway obstruction'
  },

  // Domain 11: Unconsciousness & Syncope
  {
    id: 85,
    domain: 'Unconsciousness',
    input: 'My grandfather collapsed on the kitchen floor and will not wake up.',
    expectedEventType: 'LOSS_OF_CONSCIOUSNESS',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Elderly collapse unresponsiveness'
  },
  {
    id: 86,
    domain: 'Unconsciousness',
    input: 'She suddenly fainted and remains completely unresponsive.',
    expectedEventType: 'LOSS_OF_CONSCIOUSNESS',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Syncope with prolonged unresponsiveness'
  },

  // Domain 12: Pregnancy Emergencies
  {
    id: 87,
    domain: 'Pregnancy',
    input: 'My wife is pregnant and suddenly fainted.',
    expectedEventType: 'PREGNANCY_RELATED',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Pregnancy syncope emergency'
  },
  {
    id: 88,
    domain: 'Pregnancy',
    input: 'I am 7 months pregnant and having heavy vaginal bleeding with severe cramps.',
    expectedEventType: 'PREGNANCY_RELATED',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Third trimester bleeding and cramps'
  },
  {
    id: 89,
    domain: 'Pregnancy',
    input: 'Pregnant woman with excruciating pelvic pain.',
    expectedEventType: 'PREGNANCY_RELATED',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Excruciating pelvic pain in pregnancy'
  },

  // Domain 13: Severe Bleeding & Hemorrhage
  {
    id: 90,
    domain: 'Hemorrhage',
    input: 'Arterial blood spurting from a deep forearm wound.',
    expectedEventType: 'SEVERE_BLEEDING',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Arterial spurting hemorrhage'
  },
  {
    id: 91,
    domain: 'Hemorrhage',
    input: 'Coughing up large mouthfuls of bright red blood.',
    expectedEventType: 'SEVERE_BLEEDING',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Massive hemoptysis'
  },

  // Domain 14: Major Trauma & Burns
  {
    id: 92,
    domain: 'Trauma',
    input: 'He fell from the second floor balcony and cannot move his legs.',
    expectedEventType: 'TRAUMA',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidVideo: true,
    description: 'Fall from height spinal injury emergency'
  },
  {
    id: 93,
    domain: 'Burns',
    input: 'Boiling hot oil splashed across my chest with severe blistering.',
    expectedEventType: 'BURN',
    expectedSeverity: 'MODERATE',
    forbidVideo: true,
    description: 'Severe scald burn'
  },

  // Domain 15: Historical Medical Events (Must be LOW, NOT Emergency)
  {
    id: 94,
    domain: 'Historical',
    input: 'I was bitten by a scorpion as a child twenty years ago.',
    expectedEventType: 'HISTORICAL_MEDICAL_EVENT',
    expectedSeverity: 'LOW',
    expectedEmergency: false,
    expectedNextStep: 'ROUTINE_CONSULTATION',
    description: 'Scorpion sting 20 years ago'
  },
  {
    id: 95,
    domain: 'Historical',
    input: 'My dad had an ischemic stroke in 2018.',
    expectedEventType: 'HISTORICAL_MEDICAL_EVENT',
    expectedSeverity: 'LOW',
    expectedEmergency: false,
    expectedNextStep: 'ROUTINE_CONSULTATION',
    description: 'Stroke in 2018'
  },
  {
    id: 96,
    domain: 'Historical',
    input: 'I had a mild heart attack three years ago and am currently asymptomatic.',
    expectedEventType: 'HISTORICAL_MEDICAL_EVENT',
    expectedSeverity: 'LOW',
    expectedEmergency: false,
    expectedNextStep: 'ROUTINE_CONSULTATION',
    description: 'Heart attack 3 years ago asymptomatic'
  },
  {
    id: 97,
    domain: 'Historical',
    input: 'When I was little I drank cleaning liquid and had my stomach pumped.',
    expectedEventType: 'HISTORICAL_MEDICAL_EVENT',
    expectedSeverity: 'LOW',
    expectedEmergency: false,
    expectedNextStep: 'ROUTINE_CONSULTATION',
    description: 'Childhood ingestion history'
  },

  // Domain 16: Negated Events (Must NOT trigger false emergencies)
  {
    id: 98,
    domain: 'Negation',
    input: 'I was NOT bitten by a scorpion.',
    expectedEmergency: false,
    description: 'Negated scorpion bite'
  },
  {
    id: 99,
    domain: 'Negation',
    input: 'My child did NOT drink the cleaner.',
    expectedEmergency: false,
    description: 'Negated chemical ingestion'
  },
  {
    id: 100,
    domain: 'Negation',
    input: 'I am not having breathing difficulty or chest pain.',
    expectedEmergency: false,
    description: 'Negated dyspnea and angina'
  },
  {
    id: 101,
    domain: 'Negation',
    input: 'Patient denies shortness of breath and denies chest pain.',
    expectedEmergency: false,
    description: 'Clinical negation language (denies)'
  },

  // Domain 17: Ambiguous / Insufficient Information (Must NEVER default to LOW!)
  {
    id: 102,
    domain: 'Insufficient Info',
    input: 'I am feeling sick today.',
    expectedEventType: 'INSUFFICIENT_INFORMATION',
    expectedSeverity: 'MORE_INFORMATION',
    expectedEmergency: false,
    forbidLow: true,
    description: 'Feeling sick without specifics'
  },
  {
    id: 103,
    domain: 'Insufficient Info',
    input: 'Something is wrong with me.',
    expectedEventType: 'INSUFFICIENT_INFORMATION',
    expectedSeverity: 'MORE_INFORMATION',
    expectedEmergency: false,
    forbidLow: true,
    description: 'Vague complaint'
  },
  {
    id: 104,
    domain: 'Insufficient Info',
    input: 'Help me please.',
    expectedEventType: 'INSUFFICIENT_INFORMATION',
    expectedSeverity: 'MORE_INFORMATION',
    expectedEmergency: false,
    forbidLow: true,
    description: 'Unspecified distress'
  },

  // Domain 18: Multilingual / Hinglish Unseen Cases
  {
    id: 105,
    domain: 'Hinglish',
    input: 'meri mummy ko dil ka daura pada hai',
    expectedEventType: 'CARDIAC_EVENT',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Hinglish: heart attack in mother'
  },
  {
    id: 106,
    domain: 'Hinglish',
    input: 'unka aadha shareer kaam nahi kar raha aur muh tedha ho gaya',
    expectedEventType: 'NEUROLOGICAL_EVENT',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Hinglish: hemiplegia and facial droop'
  },
  {
    id: 107,
    domain: 'Hinglish',
    input: 'chote bacche ne bathroom cleaner pee liya',
    expectedEventType: 'TOXIC_INGESTION',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Hinglish: small child drank bathroom cleaner'
  },
  {
    id: 108,
    domain: 'Hinglish',
    input: 'kisi zehreelay keedey ne kaat liya aur saans lene me dikkat ho rahi hai',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Hinglish: toxic creature sting + dyspnea'
  },
  {
    id: 109,
    domain: 'Hinglish',
    input: 'tabiyat theek nahi hai',
    expectedEventType: 'INSUFFICIENT_INFORMATION',
    expectedSeverity: 'MORE_INFORMATION',
    expectedEmergency: false,
    forbidLow: true,
    description: 'Hinglish: not feeling well'
  },
  {
    id: 110,
    domain: 'Hinglish',
    input: 'kutta kaat gaya per me',
    expectedEventType: 'ANIMAL_BITE',
    forbidVideo: true,
    description: 'Hinglish: dog bite in leg'
  },

  // Domain 19: Pediatric Vulnerability Suite
  {
    id: 111,
    domain: 'Pediatric',
    input: 'My 6-month-old infant was stung by a wasp and is wheezing.',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Infant wasp sting with wheezing'
  },
  {
    id: 112,
    domain: 'Pediatric',
    input: 'My 1-year-old child swallowed bleach from the laundry room.',
    expectedEventType: 'TOXIC_INGESTION',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: '1yo swallowed bleach'
  },
  {
    id: 113,
    domain: 'Pediatric',
    input: 'My toddler fell and hit his head and will not wake up.',
    expectedEventType: 'LOSS_OF_CONSCIOUSNESS',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Toddler head trauma unresponsiveness'
  },

  // Domain 20: Additional Diverse Unseen Clinical Presentations
  {
    id: 114,
    domain: 'Unseen Diverse',
    input: 'A venomous adder bit my foot in the woods.',
    expectedEventType: 'VENOMOUS_BITE',
    expectedSeverity: 'HIGH',
    forbidLow: true,
    forbidVideo: true,
    description: 'Adder bite'
  },
  {
    id: 115,
    domain: 'Unseen Diverse',
    input: 'I swallowed a mouthful of liquid drain cleaner.',
    expectedEventType: 'TOXIC_INGESTION',
    expectedSeverity: 'HIGH',
    forbidLow: true,
    forbidVideo: true,
    description: 'Drain cleaner ingestion'
  },
  {
    id: 116,
    domain: 'Unseen Diverse',
    input: 'A venomous sea snake bit my toe while scuba diving.',
    expectedEventType: 'VENOMOUS_BITE',
    expectedSeverity: 'HIGH',
    forbidLow: true,
    forbidVideo: true,
    description: 'Sea snake bite'
  },
  {
    id: 117,
    domain: 'Unseen Diverse',
    input: 'My toddler chewed on a packet of rat poison.',
    expectedEventType: 'TOXIC_INGESTION',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Toddler chewed rat poison'
  },
  {
    id: 118,
    domain: 'Unseen Diverse',
    input: 'He drank pesticide intended for crops.',
    expectedEventType: 'TOXIC_INGESTION',
    expectedSeverity: 'HIGH',
    forbidLow: true,
    forbidVideo: true,
    description: 'Drank crop pesticide'
  },
  {
    id: 119,
    domain: 'Unseen Diverse',
    input: 'Sudden complete loss of vision in my left eye with severe head pain.',
    expectedEventType: 'NEUROLOGICAL_EVENT',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Sudden monocular visual loss'
  },
  {
    id: 120,
    domain: 'Unseen Diverse',
    input: 'Stuck in a fire, inhaled thick smoke, struggling to breathe.',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Smoke inhalation respiratory distress'
  },
  // =========================================================================
  // ACUTE ABDOMEN & SURGICAL ABDOMEN (Cases 121 - 135)
  // =========================================================================
  {
    id: 121,
    domain: 'Acute Abdomen',
    input: 'i have appendix and now getting very much pain',
    expectedEventType: 'ACUTE_ABDOMEN',
    expectedSpecificEvent: 'ACUTE_APPENDICITIS',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'User screenshot case: appendix with very much pain'
  },
  {
    id: 122,
    domain: 'Acute Abdomen',
    input: 'Lower right abdomen pain severe and tender to touch',
    expectedEventType: 'ACUTE_ABDOMEN',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Lower right abdomen pain severe and tender'
  },
  {
    id: 123,
    domain: 'Acute Abdomen',
    input: 'Sharp pain in right lower quadrant with fever and vomiting',
    expectedEventType: 'ACUTE_ABDOMEN',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Right lower quadrant pain with fever and vomiting'
  },
  {
    id: 124,
    domain: 'Acute Abdomen',
    input: 'Severe acute stomach pain and belly feels like a hard board',
    expectedEventType: 'ACUTE_ABDOMEN',
    expectedSpecificEvent: 'ACUTE_PERITONITIS',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Board like abdominal rigidity peritonitis'
  },
  {
    id: 125,
    domain: 'Acute Abdomen',
    input: 'Suspected appendicitis with unbearable right lower abdominal pain',
    expectedEventType: 'ACUTE_ABDOMEN',
    expectedSpecificEvent: 'ACUTE_APPENDICITIS',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Suspected appendicitis unbearable pain'
  },
  {
    id: 126,
    domain: 'Acute Abdomen',
    input: 'Excruciating abdominal pain cannot stand upright',
    expectedEventType: 'ACUTE_ABDOMEN',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Excruciating abdominal pain'
  },
  {
    id: 127,
    domain: 'Acute Abdomen',
    input: 'Severe vomiting with complete bowel obstruction and belly swelling',
    expectedEventType: 'ACUTE_ABDOMEN',
    expectedSpecificEvent: 'ACUTE_BOWEL_OBSTRUCTION',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Bowel obstruction with vomiting'
  },
  {
    id: 128,
    domain: 'Acute Abdomen',
    input: 'Severe abdominal pain radiating to the back with acute pancreatitis',
    expectedEventType: 'ACUTE_ABDOMEN',
    expectedSpecificEvent: 'ACUTE_PANCREATITIS',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Acute pancreatitis'
  },
  {
    id: 129,
    domain: 'Acute Abdomen',
    input: 'Gallbladder attack with severe right upper quadrant pain and high fever',
    expectedEventType: 'ACUTE_ABDOMEN',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Gallbladder attack acute cholecystitis'
  },
  {
    id: 130,
    domain: 'Acute Abdomen',
    input: 'Acute peritonitis with rebound tenderness and severe fever',
    expectedEventType: 'ACUTE_ABDOMEN',
    expectedSpecificEvent: 'ACUTE_PERITONITIS',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Acute peritonitis with rebound tenderness'
  },
  {
    id: 131,
    domain: 'Acute Abdomen',
    input: 'Pet me bahut tez dard ho raha hai appendix lag raha hai',
    expectedEventType: 'ACUTE_ABDOMEN',
    expectedSpecificEvent: 'ACUTE_APPENDICITIS',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Hinglish appendicitis severe abdominal pain'
  },
  {
    id: 132,
    domain: 'Acute Abdomen',
    input: 'Severely tender lower right stomach getting worse every hour',
    expectedEventType: 'ACUTE_ABDOMEN',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Progressive right lower quadrant tenderness'
  },
  {
    id: 133,
    domain: 'Acute Abdomen',
    input: 'Bowel obstruction with persistent vomiting and excruciating cramps',
    expectedEventType: 'ACUTE_ABDOMEN',
    expectedSpecificEvent: 'ACUTE_BOWEL_OBSTRUCTION',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Mechanical bowel obstruction'
  },
  {
    id: 134,
    domain: 'Acute Abdomen',
    input: 'Kidney stone with unbearable flank pain and nausea',
    expectedEventType: 'ACUTE_ABDOMEN',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Acute renal colic / kidney stone severe agony'
  },
  {
    id: 135,
    domain: 'Acute Abdomen',
    input: 'Excruciating stomach cramps and rigid abdominal wall',
    expectedEventType: 'ACUTE_ABDOMEN',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Acute surgical abdomen rigidity'
  },

  // =========================================================================
  // SURGICAL EMERGENCIES (Cases 136 - 150)
  // =========================================================================
  {
    id: 136,
    domain: 'Surgical Emergency',
    input: 'Sudden severe testicular pain in teenage son started 2 hours ago',
    expectedEventType: 'SURGICAL_EMERGENCY',
    expectedSpecificEvent: 'TESTICULAR_TORSION',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Acute testicular torsion window'
  },
  {
    id: 137,
    domain: 'Surgical Emergency',
    input: 'Acute severe groin pain in teen boy radiating to scrotum',
    expectedEventType: 'SURGICAL_EMERGENCY',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Acute testicular groin pain in teen'
  },
  {
    id: 138,
    domain: 'Surgical Emergency',
    input: 'Severe testicular torsion symptoms with acute swelling',
    expectedEventType: 'SURGICAL_EMERGENCY',
    expectedSpecificEvent: 'TESTICULAR_TORSION',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Testicular torsion with swelling'
  },
  {
    id: 139,
    domain: 'Surgical Emergency',
    input: 'Acute ovarian torsion severe lower pelvic pain with nausea',
    expectedEventType: 'SURGICAL_EMERGENCY',
    expectedSpecificEvent: 'OVARIAN_TORSION',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Ovarian torsion severe pain'
  },
  {
    id: 140,
    domain: 'Surgical Emergency',
    input: 'Sudden saddle anesthesia and loss of bowel control',
    expectedEventType: 'SURGICAL_EMERGENCY',
    expectedSpecificEvent: 'CAUDA_EQUINA_SYNDROME',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Cauda equina syndrome saddle anesthesia'
  },
  {
    id: 141,
    domain: 'Surgical Emergency',
    input: 'Severe low back pain with loss of bladder control and numbness between legs',
    expectedEventType: 'SURGICAL_EMERGENCY',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Cauda equina incontinence'
  },
  {
    id: 142,
    domain: 'Surgical Emergency',
    input: 'Rapidly spreading dark rash on leg with intense pain and fever flesh eating',
    expectedEventType: 'SURGICAL_EMERGENCY',
    expectedSpecificEvent: 'NECROTIZING_SOFT_TISSUE_INFECTION',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Flesh eating necrotizing fasciitis'
  },
  {
    id: 143,
    domain: 'Surgical Emergency',
    input: 'Cauda equina syndrome red flags with numbness and urinary retention',
    expectedEventType: 'SURGICAL_EMERGENCY',
    expectedSpecificEvent: 'CAUDA_EQUINA_SYNDROME',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Cauda equina red flags'
  },
  {
    id: 144,
    domain: 'Surgical Emergency',
    input: 'Necrotizing soft tissue infection with crepitus and severe pain',
    expectedEventType: 'SURGICAL_EMERGENCY',
    expectedSpecificEvent: 'NECROTIZING_SOFT_TISSUE_INFECTION',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Necrotizing soft tissue infection'
  },
  {
    id: 145,
    domain: 'Surgical Emergency',
    input: 'Acute testicular pain and high-riding testicle',
    expectedEventType: 'SURGICAL_EMERGENCY',
    expectedSpecificEvent: 'TESTICULAR_TORSION',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Testicular torsion high riding'
  },
  {
    id: 146,
    domain: 'Surgical Emergency',
    input: 'Sudden excruciating pelvic pain suspected ovarian torsion',
    expectedEventType: 'SURGICAL_EMERGENCY',
    expectedSpecificEvent: 'OVARIAN_TORSION',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Suspected ovarian torsion'
  },
  {
    id: 147,
    domain: 'Surgical Emergency',
    input: 'Teenager with sudden one-sided severe testicular swelling and agony',
    expectedEventType: 'SURGICAL_EMERGENCY',
    expectedSpecificEvent: 'TESTICULAR_TORSION',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Teen testicular swelling and agony'
  },
  {
    id: 148,
    domain: 'Surgical Emergency',
    input: 'Loss of bowel and bladder sensation with progressive leg weakness',
    expectedEventType: 'SURGICAL_EMERGENCY',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Bowel/bladder sensation loss cauda equina'
  },
  {
    id: 149,
    domain: 'Surgical Emergency',
    input: 'Saddle anesthesia with inability to feel toilet paper',
    expectedEventType: 'SURGICAL_EMERGENCY',
    expectedSpecificEvent: 'CAUDA_EQUINA_SYNDROME',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Saddle anesthesia perianal numbness'
  },
  {
    id: 150,
    domain: 'Surgical Emergency',
    input: 'Flesh eating bacteria suspected rapid skin discoloration',
    expectedEventType: 'SURGICAL_EMERGENCY',
    expectedSpecificEvent: 'NECROTIZING_SOFT_TISSUE_INFECTION',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Flesh eating infection'
  },

  // =========================================================================
  // SEPSIS & CRITICAL INFECTIONS (Cases 151 - 165)
  // =========================================================================
  {
    id: 151,
    domain: 'Sepsis',
    input: 'High fever, violent shivering, and mottled purple spots rash on skin',
    expectedEventType: 'SEPSIS',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Sepsis with violent shivering and purple rash'
  },
  {
    id: 152,
    domain: 'Sepsis',
    input: 'Septic shock with dangerously low blood pressure and rapid breathing',
    expectedEventType: 'SEPSIS',
    expectedSpecificEvent: 'SEVERE_SEPSIS_SEPTIC_SHOCK',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Septic shock hypotension'
  },
  {
    id: 153,
    domain: 'Sepsis',
    input: 'Severe sepsis with confusion and hypothermia after urinary infection',
    expectedEventType: 'SEPSIS',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Urosepsis with confusion'
  },
  {
    id: 154,
    domain: 'Sepsis',
    input: 'Stiff neck and fever with sensitivity to bright light and confusion',
    expectedEventType: 'SEPSIS',
    expectedSpecificEvent: 'ACUTE_BACTERIAL_MENINGITIS',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Meningitis stiff neck and fever'
  },
  {
    id: 155,
    domain: 'Sepsis',
    input: 'Acute bacterial meningitis symptoms with high fever and neck stiffness',
    expectedEventType: 'SEPSIS',
    expectedSpecificEvent: 'ACUTE_BACTERIAL_MENINGITIS',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Acute bacterial meningitis'
  },
  {
    id: 156,
    domain: 'Sepsis',
    input: 'Patient shivering violently and fever with cold clammy extremities',
    expectedEventType: 'SEPSIS',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Violent shivering and fever sepsis'
  },
  {
    id: 157,
    domain: 'Sepsis',
    input: 'Severe sepsis red flags following recent abdominal surgery',
    expectedEventType: 'SEPSIS',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Postoperative severe sepsis'
  },
  {
    id: 158,
    domain: 'Sepsis',
    input: 'Child with high fever and purpuric purple spots non blanching rash',
    expectedEventType: 'SEPSIS',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Meningococcal purpura in child'
  },
  {
    id: 159,
    domain: 'Sepsis',
    input: 'Extreme shivering, delirium, and fever in elderly patient',
    expectedEventType: 'SEPSIS',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Elderly sepsis delirium'
  },
  {
    id: 160,
    domain: 'Sepsis',
    input: 'Septic shock patient cold and clammy with gasping breath',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Septic shock decompensation'
  },
  {
    id: 161,
    domain: 'Sepsis',
    input: 'Stiff neck and fever unable to touch chin to chest',
    expectedEventType: 'SEPSIS',
    expectedSpecificEvent: 'ACUTE_BACTERIAL_MENINGITIS',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Nuchal rigidity fever meningitis'
  },
  {
    id: 162,
    domain: 'Sepsis',
    input: 'Systemic sepsis presentation with rapid heart rate and low oxygen',
    expectedEventType: 'SEPSIS',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Systemic sepsis'
  },
  {
    id: 163,
    domain: 'Sepsis',
    input: 'Severe infection with violent chills and purple rash',
    expectedEventType: 'SEPSIS',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Severe infection purple rash'
  },
  {
    id: 164,
    domain: 'Sepsis',
    input: 'Fever and altered mental state with petechial rash',
    expectedEventType: 'SEPSIS',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Petechial rash fever sepsis'
  },
  {
    id: 165,
    domain: 'Sepsis',
    input: 'Bacterial meningitis suspected with sudden headache and rigid neck',
    expectedEventType: 'SEPSIS',
    expectedSpecificEvent: 'ACUTE_BACTERIAL_MENINGITIS',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Bacterial meningitis rigid neck'
  },

  // =========================================================================
  // OPHTHALMIC EMERGENCIES (Cases 166 - 175)
  // =========================================================================
  {
    id: 166,
    domain: 'Ophthalmic Emergency',
    input: 'Severe acute eye pain with halos around lights and nausea',
    expectedEventType: 'OPHTHALMIC_EMERGENCY',
    expectedSpecificEvent: 'ACUTE_ANGLE_CLOSURE_GLAUCOMA',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Acute angle closure glaucoma'
  },
  {
    id: 167,
    domain: 'Ophthalmic Emergency',
    input: 'Sudden curtain falling over vision with dark floaters',
    expectedEventType: 'OPHTHALMIC_EMERGENCY',
    expectedSpecificEvent: 'ACUTE_RETINAL_DETACHMENT',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Retinal detachment curtain falling'
  },
  {
    id: 168,
    domain: 'Ophthalmic Emergency',
    input: 'Bleach splashed directly into eye, intense burning',
    expectedEventType: 'CHEMICAL_EXPOSURE',
    expectedSpecificEvent: 'OCULAR_CHEMICAL_SPLASH',
    expectedSeverity: 'HIGH',
    expectedEmergency: false,
    forbidLow: true,
    forbidVideo: true,
    description: 'Bleach ocular chemical burn'
  },
  {
    id: 169,
    domain: 'Ophthalmic Emergency',
    input: 'Caustic toilet cleaner chemical splash in eye',
    expectedEventType: 'CHEMICAL_EXPOSURE',
    expectedSpecificEvent: 'OCULAR_CHEMICAL_SPLASH',
    expectedSeverity: 'HIGH',
    expectedEmergency: false,
    forbidLow: true,
    forbidVideo: true,
    description: 'Chemical splash in eye'
  },
  {
    id: 170,
    domain: 'Ophthalmic Emergency',
    input: 'Acid splashed into eyes while working with car battery',
    expectedEventType: 'CHEMICAL_EXPOSURE',
    expectedSpecificEvent: 'OCULAR_CHEMICAL_SPLASH',
    expectedSeverity: 'HIGH',
    expectedEmergency: false,
    forbidLow: true,
    forbidVideo: true,
    description: 'Acid in eyes battery'
  },
  {
    id: 171,
    domain: 'Ophthalmic Emergency',
    input: 'Acute angle closure glaucoma with severe eye headache and clouded vision',
    expectedEventType: 'OPHTHALMIC_EMERGENCY',
    expectedSpecificEvent: 'ACUTE_ANGLE_CLOSURE_GLAUCOMA',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Glaucoma with cloudy vision'
  },
  {
    id: 172,
    domain: 'Ophthalmic Emergency',
    input: 'Retinal detachment suspected with sudden painless shadow covering field of vision',
    expectedEventType: 'OPHTHALMIC_EMERGENCY',
    expectedSpecificEvent: 'ACUTE_RETINAL_DETACHMENT',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Retinal detachment shadow'
  },
  {
    id: 173,
    domain: 'Ophthalmic Emergency',
    input: 'Curtain falling over eye vision completely blacking out half the view',
    expectedEventType: 'OPHTHALMIC_EMERGENCY',
    expectedSpecificEvent: 'ACUTE_RETINAL_DETACHMENT',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Curtain falling retinal detachment'
  },
  {
    id: 174,
    domain: 'Ophthalmic Emergency',
    input: 'Industrial chemical solvent sprayed into both eyes',
    expectedEventType: 'CHEMICAL_EXPOSURE',
    expectedSpecificEvent: 'OCULAR_CHEMICAL_SPLASH',
    expectedSeverity: 'HIGH',
    expectedEmergency: false,
    forbidLow: true,
    forbidVideo: true,
    description: 'Industrial solvent in eyes'
  },
  {
    id: 175,
    domain: 'Ophthalmic Emergency',
    input: 'Sudden painful red eye with rainbow halos around lights and vomiting',
    expectedEventType: 'OPHTHALMIC_EMERGENCY',
    expectedSpecificEvent: 'ACUTE_ANGLE_CLOSURE_GLAUCOMA',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Halos around lights acute glaucoma'
  },

  // =========================================================================
  // ENDOCRINE & METABOLIC EMERGENCIES (Cases 176 - 185)
  // =========================================================================
  {
    id: 176,
    domain: 'Endocrine Emergency',
    input: 'Diabetic patient breathing rapidly with fruity breath odor',
    expectedEventType: 'ENDOCRINE_METABOLIC',
    expectedSpecificEvent: 'DIABETIC_KETOACIDOSIS',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'DKA with fruity breath'
  },
  {
    id: 177,
    domain: 'Endocrine Emergency',
    input: 'Diabetic ketoacidosis with deep rapid Kussmaul breathing and vomiting',
    expectedEventType: 'ENDOCRINE_METABOLIC',
    expectedSpecificEvent: 'DIABETIC_KETOACIDOSIS',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Diabetic ketoacidosis Kussmaul'
  },
  {
    id: 178,
    domain: 'Endocrine Emergency',
    input: 'Type 1 diabetic acting confused, sweating profusely, severe hypoglycemia',
    expectedEventType: 'ENDOCRINE_METABOLIC',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Severe hypoglycemia diaphoresis'
  },
  {
    id: 179,
    domain: 'Endocrine Emergency',
    input: 'Severe hypoglycemic shock, unresponsive diabetic family member',
    expectedEventType: 'LOSS_OF_CONSCIOUSNESS',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Hypoglycemic shock'
  },
  {
    id: 180,
    domain: 'Endocrine Emergency',
    input: 'Diabetic ketoacidosis suspected with extreme thirst and abdominal pain',
    expectedEventType: 'ENDOCRINE_METABOLIC',
    expectedSpecificEvent: 'DIABETIC_KETOACIDOSIS',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Suspected DKA crisis'
  },
  {
    id: 181,
    domain: 'Endocrine Emergency',
    input: 'Known diabetic lethargic with sweet acetone breath smell',
    expectedEventType: 'ENDOCRINE_METABOLIC',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Acetone breath ketoacidosis'
  },
  {
    id: 182,
    domain: 'Endocrine Emergency',
    input: 'Insulin shock, patient shaking violently and barely conscious',
    expectedEventType: 'ENDOCRINE_METABOLIC',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Insulin shock violent shaking'
  },
  {
    id: 183,
    domain: 'Endocrine Emergency',
    input: 'Profound hypoglycemia with diaphoresis and unresponsiveness',
    expectedEventType: 'ENDOCRINE_METABOLIC',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Profound hypoglycemia'
  },
  {
    id: 184,
    domain: 'Endocrine Emergency',
    input: 'Diabetic acting strange and confused with clammy cold sweat',
    expectedEventType: 'ENDOCRINE_METABOLIC',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Diabetic acting strange hypoglycemia'
  },
  {
    id: 185,
    domain: 'Endocrine Emergency',
    input: 'DKA crisis with heavy labored breathing and lethargy',
    expectedEventType: 'ENDOCRINE_METABOLIC',
    expectedSpecificEvent: 'DIABETIC_KETOACIDOSIS',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'DKA crisis labored breathing'
  },

  // =========================================================================
  // ENVIRONMENTAL EMERGENCIES (Cases 186 - 195)
  // =========================================================================
  {
    id: 186,
    domain: 'Environmental Emergency',
    input: 'Elderly person collapsed in hot sun, core temp 105, stopped sweating',
    expectedEventType: 'LOSS_OF_CONSCIOUSNESS',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Heatstroke core temp 105 anhidrosis'
  },
  {
    id: 187,
    domain: 'Environmental Emergency',
    input: 'Severe heatstroke, hot dry flushed skin and altered consciousness',
    expectedEventType: 'ENVIRONMENTAL_EMERGENCY',
    expectedSpecificEvent: 'ACUTE_HEATSTROKE',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Severe heatstroke collapse'
  },
  {
    id: 188,
    domain: 'Environmental Emergency',
    input: 'Near drowning victim pulled from swimming pool, coughing water',
    expectedEventType: 'ENVIRONMENTAL_EMERGENCY',
    expectedSpecificEvent: 'NEAR_DROWNING_SUBMERSION',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Near drowning submersion'
  },
  {
    id: 189,
    domain: 'Environmental Emergency',
    input: 'Submersion near drowning incident with shallow irregular breathing',
    expectedEventType: 'ENVIRONMENTAL_EMERGENCY',
    expectedSpecificEvent: 'NEAR_DROWNING_SUBMERSION',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Near drowning irregular breathing'
  },
  {
    id: 190,
    domain: 'Environmental Emergency',
    input: 'Family found dizzy and nauseous with carbon monoxide alarm beeping',
    expectedEventType: 'ENVIRONMENTAL_EMERGENCY',
    expectedSpecificEvent: 'CARBON_MONOXIDE_POISONING',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Carbon monoxide exposure alarm'
  },
  {
    id: 191,
    domain: 'Environmental Emergency',
    input: 'Severe hypothermia with slurred speech and violent shivering cessation',
    expectedEventType: 'NEUROLOGICAL_EVENT',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Severe hypothermia'
  },
  {
    id: 192,
    domain: 'Environmental Emergency',
    input: 'Carbon monoxide poisoning suspected after running generator indoors',
    expectedEventType: 'ENVIRONMENTAL_EMERGENCY',
    expectedSpecificEvent: 'CARBON_MONOXIDE_POISONING',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Indoor generator CO poisoning'
  },
  {
    id: 193,
    domain: 'Environmental Emergency',
    input: 'Heat stroke collapse after marathon with confused delirium',
    expectedEventType: 'NEUROLOGICAL_EVENT',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Exertional heat stroke'
  },
  {
    id: 194,
    domain: 'Environmental Emergency',
    input: 'Child rescued from lake, near drowning, cyanotic lips',
    expectedEventType: 'ENVIRONMENTAL_EMERGENCY',
    expectedSpecificEvent: 'NEAR_DROWNING_SUBMERSION',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Pediatric submersion near drowning'
  },
  {
    id: 195,
    domain: 'Environmental Emergency',
    input: 'Accidental carbon monoxide exposure, family members passing out',
    expectedEventType: 'ENVIRONMENTAL_EMERGENCY',
    expectedSpecificEvent: 'CARBON_MONOXIDE_POISONING',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Carbon monoxide syncope'
  },

  // =========================================================================
  // CARDIOVASCULAR & CHEST PAIN (Cases 196 - 210)
  // =========================================================================
  {
    id: 196,
    domain: 'Cardiovascular',
    input: 'Crushing central chest tightness radiating to the left jaw',
    expectedEventType: 'CARDIAC_EVENT',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Crushing chest pain radiating to jaw'
  },
  {
    id: 197,
    domain: 'Cardiovascular',
    input: 'My father is clutching his chest and sweating heavily',
    expectedEventType: 'CARDIAC_EVENT',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Father clutching chest diaphoresis'
  },
  {
    id: 198,
    domain: 'Cardiovascular',
    input: 'Feels like an elephant is sitting on my chest, cold sweat',
    expectedEventType: 'CARDIAC_EVENT',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Elephant on chest sensation'
  },
  {
    id: 199,
    domain: 'Cardiovascular',
    input: 'Severe chest pain radiating to back and left shoulder',
    expectedEventType: 'CARDIAC_EVENT',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Severe chest pain radiating to shoulder'
  },
  {
    id: 200,
    domain: 'Cardiovascular',
    input: 'Acute myocardial infarction suspected with chest pressure and nausea',
    expectedEventType: 'CARDIAC_EVENT',
    expectedSpecificEvent: 'ACUTE_MYOCARDIAL_INFARCTION',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Acute myocardial infarction'
  },
  {
    id: 201,
    domain: 'Cardiovascular',
    input: 'Heart attack symptoms: chest squeezing, breathless, pale',
    expectedEventType: 'CARDIAC_EVENT',
    expectedSpecificEvent: 'ACUTE_MYOCARDIAL_INFARCTION',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Heart attack squeezing breathlessness'
  },
  {
    id: 202,
    domain: 'Cardiovascular',
    input: 'Dil ka daura pada hai seene me bahut tej dard hai',
    expectedEventType: 'CARDIAC_EVENT',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Hinglish heart attack dil ka daura'
  },
  {
    id: 203,
    domain: 'Cardiovascular',
    input: 'Crushing chest pain radiating down both arms',
    expectedEventType: 'CARDIAC_EVENT',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Crushing chest pain both arms'
  },
  {
    id: 204,
    domain: 'Cardiovascular',
    input: 'Severe chest discomfort with diaphoresis and gray complexion',
    expectedEventType: 'CARDIAC_EVENT',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Chest discomfort diaphoresis'
  },
  {
    id: 205,
    domain: 'Cardiovascular',
    input: 'Chest tightness and shortness of breath while resting',
    expectedEventType: 'CARDIAC_EVENT',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Rest angina chest tightness'
  },
  {
    id: 206,
    domain: 'Cardiovascular',
    input: 'Sudden retrosternal pressure radiating into lower jaw',
    expectedEventType: 'CARDIAC_EVENT',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Retrosternal pressure jaw'
  },
  {
    id: 207,
    domain: 'Cardiovascular',
    input: 'Severe chest heaviness with impending sense of doom',
    expectedEventType: 'CARDIAC_EVENT',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Chest heaviness sense of doom'
  },
  {
    id: 208,
    domain: 'Cardiovascular',
    input: 'Patient gasping and clutching chest with cold sweats',
    expectedEventType: 'CARDIAC_EVENT',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Clutching chest cold sweats'
  },
  {
    id: 209,
    domain: 'Cardiovascular',
    input: 'Severe chest pressure radiating into neck and throat',
    expectedEventType: 'CARDIAC_EVENT',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Chest pressure radiating to neck'
  },
  {
    id: 210,
    domain: 'Cardiovascular',
    input: 'Sudden crushing chest pain during moderate exertion',
    expectedEventType: 'CARDIAC_EVENT',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Crushing chest pain exertional'
  },

  // =========================================================================
  // NEUROLOGICAL & STROKE (Cases 211 - 225)
  // =========================================================================
  {
    id: 211,
    domain: 'Neurological',
    input: 'Sudden weakness on right side of body, cannot raise arm',
    expectedEventType: 'NEUROLOGICAL_EVENT',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Acute unilateral weakness stroke'
  },
  {
    id: 212,
    domain: 'Neurological',
    input: 'Grandmother face is drooping on one side and speech is slurred',
    expectedEventType: 'NEUROLOGICAL_EVENT',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Facial droop and slurred speech'
  },
  {
    id: 213,
    domain: 'Neurological',
    input: 'Sudden inability to speak or comprehend words',
    expectedEventType: 'NEUROLOGICAL_EVENT',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Aphasia sudden onset stroke'
  },
  {
    id: 214,
    domain: 'Neurological',
    input: 'Father is having a continuous grand mal seizure for over 5 minutes',
    expectedEventType: 'NEUROLOGICAL_EVENT',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Status epilepticus continuous seizure'
  },
  {
    id: 215,
    domain: 'Neurological',
    input: 'Acute stroke symptoms: arm weakness and facial droop',
    expectedEventType: 'NEUROLOGICAL_EVENT',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Acute stroke FAST signs'
  },
  {
    id: 216,
    domain: 'Neurological',
    input: 'Lakwa mar gaya hai aadha shareer kaam nahi kar raha',
    expectedEventType: 'NEUROLOGICAL_EVENT',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Hinglish hemiplegia stroke'
  },
  {
    id: 217,
    domain: 'Neurological',
    input: 'Muh tedha ho gaya hai aur bol nahi pa rahe',
    expectedEventType: 'NEUROLOGICAL_EVENT',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Hinglish facial droop aphasia'
  },
  {
    id: 218,
    domain: 'Neurological',
    input: 'Sudden thunderclap headache, worst headache of my life',
    expectedEventType: 'NEUROLOGICAL_EVENT',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Subarachnoid hemorrhage thunderclap'
  },
  {
    id: 219,
    domain: 'Neurological',
    input: 'Active seizure ongoing, jerking uncontrollably',
    expectedEventType: 'NEUROLOGICAL_EVENT',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Active convulsion'
  },
  {
    id: 220,
    domain: 'Neurological',
    input: 'Acute hemiparesis and inability to smile symmetrically',
    expectedEventType: 'NEUROLOGICAL_EVENT',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Hemiparesis facial asymmetry'
  },
  {
    id: 221,
    domain: 'Neurological',
    input: 'Sudden confusion and cannot speak coherently',
    expectedEventType: 'NEUROLOGICAL_EVENT',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Acute confusion aphasia'
  },
  {
    id: 222,
    domain: 'Neurological',
    input: 'Cannot move left arm or leg after waking up',
    expectedEventType: 'NEUROLOGICAL_EVENT',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Wake up stroke hemiplegia'
  },
  {
    id: 223,
    domain: 'Neurological',
    input: 'Patient had a seizure and is not waking up',
    expectedEventType: 'LOSS_OF_CONSCIOUSNESS',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Post ictal coma unresponsiveness'
  },
  {
    id: 224,
    domain: 'Neurological',
    input: 'Acute focal neurological deficit in elderly man',
    expectedEventType: 'NEUROLOGICAL_EVENT',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Focal neurological deficit'
  },
  {
    id: 225,
    domain: 'Neurological',
    input: 'Sudden loss of vision in right eye and arm numbness',
    expectedEventType: 'NEUROLOGICAL_EVENT',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Amaurosis fugax stroke syndrome'
  },

  // =========================================================================
  // TOXIC INGESTIONS & CHEMICAL POISONING (Cases 226 - 240)
  // =========================================================================
  {
    id: 226,
    domain: 'Toxic Ingestion',
    input: 'Toddler swallowed a mouthful of caustic toilet cleaner',
    expectedEventType: 'TOXIC_INGESTION',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Toddler caustic toilet cleaner'
  },
  {
    id: 227,
    domain: 'Toxic Ingestion',
    input: 'Drank pesticide chemical from unlabeled bottle',
    expectedEventType: 'TOXIC_INGESTION',
    expectedSeverity: 'HIGH',
    expectedEmergency: false,
    forbidLow: true,
    forbidVideo: true,
    description: 'Drank pesticide bottle'
  },
  {
    id: 228,
    domain: 'Toxic Ingestion',
    input: 'Child drank phenyl kept in bathroom',
    expectedEventType: 'TOXIC_INGESTION',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Child drank phenyl'
  },
  {
    id: 229,
    domain: 'Toxic Ingestion',
    input: 'Ingested rat poison pellets accidentally',
    expectedEventType: 'TOXIC_INGESTION',
    expectedSeverity: 'HIGH',
    forbidLow: true,
    forbidVideo: true,
    description: 'Rat poison ingestion'
  },
  {
    id: 230,
    domain: 'Toxic Ingestion',
    input: 'Someone drank battery acid and is vomiting',
    expectedEventType: 'TOXIC_INGESTION',
    expectedSeverity: 'HIGH',
    expectedEmergency: false,
    forbidLow: true,
    forbidVideo: true,
    description: 'Battery acid ingestion vomiting'
  },
  {
    id: 231,
    domain: 'Toxic Ingestion',
    input: 'Swallowed entire bottle of sleeping pills in overdose',
    expectedEventType: 'MEDICATION_OVERDOSE',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Sleeping pills overdose'
  },
  {
    id: 232,
    domain: 'Toxic Ingestion',
    input: 'Child swallowed laundry detergent liquid pod',
    expectedEventType: 'TOXIC_INGESTION',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Child detergent pod ingestion'
  },
  {
    id: 233,
    domain: 'Toxic Ingestion',
    input: 'Baby drank floor disinfectant cleaner',
    expectedEventType: 'TOXIC_INGESTION',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Baby disinfectant cleaner ingestion'
  },
  {
    id: 234,
    domain: 'Toxic Ingestion',
    input: 'Ingested weed killer herbicide by accident',
    expectedEventType: 'TOXIC_INGESTION',
    expectedSeverity: 'HIGH',
    forbidLow: true,
    forbidVideo: true,
    description: 'Herbicide weed killer'
  },
  {
    id: 235,
    domain: 'Toxic Ingestion',
    input: 'Took 30 tablets of paracetamol all at once',
    expectedEventType: 'MEDICATION_OVERDOSE',
    expectedSeverity: 'HIGH',
    forbidLow: true,
    forbidVideo: true,
    description: 'Massive paracetamol overdose'
  },
  {
    id: 236,
    domain: 'Toxic Ingestion',
    input: 'Child chewed rat poison cakes found under cabinet',
    expectedEventType: 'TOXIC_INGESTION',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Child chewed rat poison'
  },
  {
    id: 237,
    domain: 'Toxic Ingestion',
    input: 'Accidental ingestion of toxic chemical solvent',
    expectedEventType: 'TOXIC_INGESTION',
    expectedSeverity: 'HIGH',
    forbidLow: true,
    forbidVideo: true,
    description: 'Chemical solvent ingestion'
  },
  {
    id: 238,
    domain: 'Toxic Ingestion',
    input: 'Bachhe ne finael pee liya hai',
    expectedEventType: 'TOXIC_INGESTION',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Hinglish child phenyl finael ingestion'
  },
  {
    id: 239,
    domain: 'Toxic Ingestion',
    input: 'Swallowed drain cleaner lye and has burning mouth pain',
    expectedEventType: 'TOXIC_INGESTION',
    expectedSeverity: 'HIGH',
    forbidLow: true,
    forbidVideo: true,
    description: 'Drain cleaner lye caustic burns'
  },
  {
    id: 240,
    domain: 'Toxic Ingestion',
    input: 'Infant swallowed bleach cleaning liquid from bucket',
    expectedEventType: 'TOXIC_INGESTION',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Infant bleach ingestion'
  },

  // =========================================================================
  // VENOMOUS BITES & STINGS (Cases 241 - 255)
  // =========================================================================
  {
    id: 241,
    domain: 'Venomous Bites',
    input: 'Bitten on the ankle by a cobra snake in the garden',
    expectedEventType: 'VENOMOUS_BITE',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Cobra snake bite'
  },
  {
    id: 242,
    domain: 'Venomous Bites',
    input: 'Black widow spider bit me, intense abdominal cramping',
    expectedEventType: 'VENOMOUS_BITE',
    expectedSeverity: 'HIGH',
    forbidLow: true,
    forbidVideo: true,
    description: 'Black widow spider bite'
  },
  {
    id: 243,
    domain: 'Venomous Bites',
    input: 'Russell viper snake bite with swelling and oozing blood',
    expectedEventType: 'VENOMOUS_BITE',
    expectedSeverity: 'HIGH',
    expectedEmergency: false,
    forbidLow: true,
    forbidVideo: true,
    description: 'Viper bite oozing blood'
  },
  {
    id: 244,
    domain: 'Venomous Bites',
    input: 'Saanp ne kaat liya hai pair par',
    expectedEventType: 'VENOMOUS_BITE',
    expectedSeverity: 'HIGH',
    expectedEmergency: false,
    forbidLow: true,
    forbidVideo: true,
    description: 'Hinglish snake bite saanp ne kaat liya'
  },
  {
    id: 245,
    domain: 'Venomous Bites',
    input: 'Stung by a box jellyfish, intense searing pain and hives',
    expectedEventType: 'VENOMOUS_STING',
    expectedSeverity: 'HIGH',
    forbidLow: true,
    forbidVideo: true,
    description: 'Jellyfish marine sting'
  },
  {
    id: 246,
    domain: 'Venomous Bites',
    input: 'Scorpion stung my 2 year old baby on foot',
    expectedEventType: 'VENOMOUS_STING',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Scorpion stung infant baby'
  },
  {
    id: 247,
    domain: 'Venomous Bites',
    input: 'Krait snake bit hand while sleeping',
    expectedEventType: 'VENOMOUS_BITE',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Krait snake bite'
  },
  {
    id: 248,
    domain: 'Venomous Bites',
    input: 'Multiple yellowjacket stings all over neck and face',
    expectedEventType: 'INSECT_BITE_OR_STING',
    expectedSeverity: 'HIGH',
    forbidLow: true,
    forbidVideo: true,
    description: 'Multiple yellowjacket stings'
  },
  {
    id: 249,
    domain: 'Venomous Bites',
    input: 'Brown recluse spider bite with dark center spreading',
    expectedEventType: 'VENOMOUS_BITE',
    expectedSeverity: 'HIGH',
    forbidLow: true,
    forbidVideo: true,
    description: 'Brown recluse necrotic spider bite'
  },
  {
    id: 250,
    domain: 'Venomous Bites',
    input: 'Stray dog bit leg and tore skin deeply',
    expectedEventType: 'ANIMAL_BITE',
    expectedSeverity: 'MODERATE',
    forbidLow: true,
    forbidVideo: true,
    description: 'Stray dog bite deep tear'
  },
  {
    id: 251,
    domain: 'Venomous Bites',
    input: 'Monkey bit tourist on arm at temple',
    expectedEventType: 'ANIMAL_BITE',
    expectedSeverity: 'MODERATE',
    forbidLow: true,
    forbidVideo: true,
    description: 'Monkey bite rabies risk'
  },
  {
    id: 252,
    domain: 'Venomous Bites',
    input: 'Bat bite on finger while sleeping in cabin',
    expectedEventType: 'ANIMAL_BITE',
    expectedSeverity: 'HIGH',
    forbidLow: true,
    forbidVideo: true,
    description: 'Bat bite rabies exposure'
  },
  {
    id: 253,
    domain: 'Venomous Bites',
    input: 'Kutte ne kaat liya khoon nikal raha hai',
    expectedEventType: 'ANIMAL_BITE',
    expectedSeverity: 'MODERATE',
    forbidLow: true,
    forbidVideo: true,
    description: 'Hinglish kutte ne kaat liya'
  },
  {
    id: 254,
    domain: 'Venomous Bites',
    input: 'Centipede bite with throbbing pain and red streak',
    expectedEventType: 'VENOMOUS_STING',
    expectedSeverity: 'HIGH',
    forbidLow: true,
    forbidVideo: true,
    description: 'Centipede venomous bite'
  },
  {
    id: 255,
    domain: 'Venomous Bites',
    input: 'Stonefish marine sting on bottom of foot',
    expectedEventType: 'VENOMOUS_STING',
    expectedSeverity: 'HIGH',
    forbidLow: true,
    forbidVideo: true,
    description: 'Stonefish sting envenomation'
  },

  // =========================================================================
  // OBSTETRIC & PREGNANCY (Cases 256 - 270)
  // =========================================================================
  {
    id: 256,
    domain: 'Pregnancy',
    input: 'Pregnant woman in third trimester having heavy vaginal bleeding',
    expectedEventType: 'PREGNANCY_RELATED',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Third trimester vaginal bleeding'
  },
  {
    id: 257,
    domain: 'Pregnancy',
    input: 'Pregnant wife having sudden excruciating pelvic pain',
    expectedEventType: 'PREGNANCY_RELATED',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Pregnant wife excruciating pain'
  },
  {
    id: 258,
    domain: 'Pregnancy',
    input: '32 weeks pregnant with severe headache, blurry vision, and epigastric pain',
    expectedEventType: 'PREGNANCY_RELATED',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Severe pre-eclampsia triad'
  },
  {
    id: 259,
    domain: 'Pregnancy',
    input: 'Pregnant patient collapsed and lost consciousness',
    expectedEventType: 'PREGNANCY_RELATED',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Syncope in pregnancy'
  },
  {
    id: 260,
    domain: 'Pregnancy',
    input: 'Ectopic pregnancy suspected, severe unilateral lower abdominal cramps',
    expectedEventType: 'PREGNANCY_RELATED',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Suspected ectopic pregnancy'
  },
  {
    id: 261,
    domain: 'Pregnancy',
    input: 'Placental abruption suspected with dark vaginal hemorrhage',
    expectedEventType: 'PREGNANCY_RELATED',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Suspected placental abruption'
  },
  {
    id: 262,
    domain: 'Pregnancy',
    input: 'Pregnant woman with heavy bleeding soaking pads',
    expectedEventType: 'PREGNANCY_RELATED',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Vaginal bleeding soaking pads'
  },
  {
    id: 263,
    domain: 'Pregnancy',
    input: 'Pregnant woman with high fever and sudden severe abdominal pain',
    expectedEventType: 'PREGNANCY_RELATED',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Pregnancy chorioamnionitis severe pain'
  },
  {
    id: 264,
    domain: 'Pregnancy',
    input: 'Severe abdominal pain at 7 months pregnant',
    expectedEventType: 'PREGNANCY_RELATED',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Third trimester severe abdominal pain'
  },
  {
    id: 265,
    domain: 'Pregnancy',
    input: 'Pregnant with sudden bright red vaginal bleeding',
    expectedEventType: 'PREGNANCY_RELATED',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Bright red antepartum hemorrhage'
  },
  {
    id: 266,
    domain: 'Pregnancy',
    input: 'Pre-eclampsia red flags with swelling, severe headache and high blood pressure',
    expectedEventType: 'PREGNANCY_RELATED',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Pre-eclampsia headache'
  },
  {
    id: 267,
    domain: 'Pregnancy',
    input: 'Heavy bleeding during first trimester with severe cramping',
    expectedEventType: 'PREGNANCY_RELATED',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Threatened/inevitable miscarriage bleeding'
  },
  {
    id: 268,
    domain: 'Pregnancy',
    input: 'Pregnant mother fell down stairs and has acute abdominal pain',
    expectedEventType: 'PREGNANCY_RELATED',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Maternal trauma fall with acute pain'
  },
  {
    id: 269,
    domain: 'Pregnancy',
    input: 'Third trimester bleeding and rigid contracted uterus',
    expectedEventType: 'PREGNANCY_RELATED',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Uterine rigidity third trimester bleeding'
  },
  {
    id: 270,
    domain: 'Pregnancy',
    input: 'Unconscious pregnant woman found on bedroom floor',
    expectedEventType: 'PREGNANCY_RELATED',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Unconscious pregnant patient'
  },

  // =========================================================================
  // SEVERE BLEEDING, BURNS & TRAUMA (Cases 271 - 280)
  // =========================================================================
  {
    id: 271,
    domain: 'Trauma & Bleeding',
    input: 'Arterial blood spurting from arm laceration after glass shatter',
    expectedEventType: 'SEVERE_BLEEDING',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Arterial spurting blood'
  },
  {
    id: 272,
    domain: 'Trauma & Bleeding',
    input: 'Coughing up large amounts of bright red blood',
    expectedEventType: 'SEVERE_BLEEDING',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Massive hemoptysis'
  },
  {
    id: 273,
    domain: 'Trauma & Bleeding',
    input: 'Fell from second floor balcony, severe back pain, cannot move feet',
    expectedEventType: 'TRAUMA',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Spinal trauma fall cannot move'
  },
  {
    id: 274,
    domain: 'Trauma & Bleeding',
    input: 'Pedestrian struck by high-speed car, leg deformed and bleeding heavily',
    expectedEventType: 'SEVERE_BLEEDING',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Pedestrian hit bleeding heavily'
  },
  {
    id: 275,
    domain: 'Trauma & Bleeding',
    input: 'Deep stab wound to upper abdomen, bleeding heavily',
    expectedEventType: 'SEVERE_BLEEDING',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Stab wound heavy bleeding'
  },
  {
    id: 276,
    domain: 'Trauma & Bleeding',
    input: 'Severe burns covering entire chest and both arms from hot cooking oil',
    expectedEventType: 'BURN',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Major hot oil burns'
  },
  {
    id: 277,
    domain: 'Trauma & Bleeding',
    input: 'Deep open fracture with broken bone visible through skin',
    expectedEventType: 'TRAUMA',
    expectedSeverity: 'MODERATE',
    forbidLow: true,
    forbidVideo: true,
    description: 'Compound fracture'
  },
  {
    id: 278,
    domain: 'Trauma & Bleeding',
    input: 'High velocity motor vehicle crash, driver pinned and cannot move',
    expectedEventType: 'TRAUMA',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'MVA pinned driver'
  },
  {
    id: 279,
    domain: 'Trauma & Bleeding',
    input: 'Severe burns from gas stove explosion, fire burn',
    expectedEventType: 'BURN',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Gas explosion burn'
  },
  {
    id: 280,
    domain: 'Trauma & Bleeding',
    input: 'Khoon beh raha hai bahut zyada haath se',
    expectedEventType: 'SEVERE_BLEEDING',
    expectedSeverity: 'EMERGENCY',
    expectedEmergency: true,
    forbidLow: true,
    forbidVideo: true,
    description: 'Hinglish heavy bleeding khoon beh raha hai'
  },

  // =========================================================================
  // HISTORICAL, NEGATED & ROUTINE OUTPATIENT (Cases 281 - 311)
  // =========================================================================
  {
    id: 281,
    domain: 'Historical',
    input: 'I had an appendix removal 5 years ago, checking on old scar',
    expectedEventType: 'HISTORICAL_MEDICAL_EVENT',
    expectedSeverity: 'LOW',
    expectedEmergency: false,
    description: 'Past appendectomy historical'
  },
  {
    id: 282,
    domain: 'Historical',
    input: 'My father had a heart attack in 2019, he is healthy now',
    expectedEventType: 'HISTORICAL_MEDICAL_EVENT',
    expectedSeverity: 'LOW',
    expectedEmergency: false,
    description: 'Past heart attack 2019'
  },
  {
    id: 283,
    domain: 'Negation',
    input: 'I do not have any chest pain, just asking about routine vitamins',
    expectedSeverity: 'LOW',
    expectedEmergency: false,
    description: 'Negated chest pain asking about vitamins'
  },
  {
    id: 284,
    domain: 'Negation',
    input: 'No stomach pain today, just wondering about healthy diet tips',
    expectedSeverity: 'LOW',
    expectedEmergency: false,
    description: 'Negated stomach pain routine diet'
  },
  {
    id: 285,
    domain: 'Historical',
    input: 'I had a stroke 8 years ago and fully recovered',
    expectedEventType: 'HISTORICAL_MEDICAL_EVENT',
    expectedSeverity: 'LOW',
    expectedEmergency: false,
    description: 'Past stroke fully recovered'
  },
  {
    id: 286,
    domain: 'Historical',
    input: 'I was bitten by a dog last year and completed all rabies shots',
    expectedEventType: 'HISTORICAL_MEDICAL_EVENT',
    expectedSeverity: 'LOW',
    expectedEmergency: false,
    description: 'Past dog bite last year'
  },
  {
    id: 287,
    domain: 'Routine Outpatient',
    input: 'Mild headache after working 10 hours in front of computer',
    expectedSeverity: 'LOW',
    expectedEmergency: false,
    description: 'Mild screen strain headache'
  },
  {
    id: 288,
    domain: 'Routine Outpatient',
    input: 'Seasonal allergy with mild sneezing and clear runny nose',
    expectedSeverity: 'LOW',
    expectedEmergency: false,
    description: 'Seasonal allergy mild sneezing'
  },
  {
    id: 289,
    domain: 'Routine Outpatient',
    input: 'Mild sore throat since this morning, no fever, drinking warm water',
    expectedSeverity: 'LOW',
    expectedEmergency: false,
    description: 'Mild sore throat no fever'
  },
  {
    id: 290,
    domain: 'Routine Outpatient',
    input: 'Small paper cut on my index finger, barely bled',
    expectedSeverity: 'LOW',
    expectedEmergency: false,
    description: 'Minor superficial paper cut'
  },
  {
    id: 291,
    domain: 'Routine Outpatient',
    input: 'Dry itchy skin on elbows during winter weather',
    expectedSeverity: 'LOW',
    expectedEmergency: false,
    description: 'Dry winter skin xerosis'
  },
  {
    id: 292,
    domain: 'Routine Outpatient',
    input: 'Mild dandruff and itchy scalp for past few weeks',
    expectedSeverity: 'LOW',
    expectedEmergency: false,
    description: 'Mild dandruff scalp'
  },
  {
    id: 293,
    domain: 'Routine Outpatient',
    input: 'Mild runny nose and occasional sneezing from pollen',
    expectedSeverity: 'LOW',
    expectedEmergency: false,
    description: 'Mild pollen allergic rhinitis'
  },
  {
    id: 294,
    domain: 'Routine Outpatient',
    input: 'Superficial tiny scrape on knee from jogging',
    expectedSeverity: 'LOW',
    expectedEmergency: false,
    description: 'Minor superficial scrape'
  },
  {
    id: 295,
    domain: 'Routine Outpatient',
    input: 'Routine consultation for annual health checkup',
    expectedSeverity: 'LOW',
    expectedEmergency: false,
    description: 'Annual wellness checkup'
  },
  {
    id: 296,
    domain: 'Routine Outpatient',
    input: 'Asking for advice on low-sodium dietary habits',
    expectedSeverity: 'LOW',
    expectedEmergency: false,
    description: 'Dietary counseling request'
  },
  {
    id: 297,
    domain: 'Routine Outpatient',
    input: 'Mild chheenk aur naak beh rahi hai mausam badalne par',
    expectedSeverity: 'LOW',
    expectedEmergency: false,
    description: 'Hinglish mild seasonal rhinitis'
  },
  {
    id: 298,
    domain: 'Routine Outpatient',
    input: 'Slight muscle ache after first gym workout yesterday',
    expectedSeverity: 'LOW',
    expectedEmergency: false,
    description: 'Mild post workout DOMS'
  },
  {
    id: 299,
    domain: 'Routine Outpatient',
    input: 'Dry lips and chapped skin in cold weather',
    expectedSeverity: 'LOW',
    expectedEmergency: false,
    description: 'Chapped lips weather'
  },
  {
    id: 300,
    domain: 'Routine Outpatient',
    input: 'Mild tension headache relieved by rest',
    expectedSeverity: 'LOW',
    expectedEmergency: false,
    description: 'Mild tension headache'
  },
  {
    id: 301,
    domain: 'Negation',
    input: 'No fever, no pain, just want to check vaccination schedule',
    expectedSeverity: 'LOW',
    expectedEmergency: false,
    description: 'Vaccination inquiry'
  },
  {
    id: 302,
    domain: 'Historical',
    input: 'I had appendicitis when I was a child 15 years ago',
    expectedEventType: 'HISTORICAL_MEDICAL_EVENT',
    expectedSeverity: 'LOW',
    expectedEmergency: false,
    description: 'Childhood appendicitis history'
  },
  {
    id: 303,
    domain: 'Historical',
    input: 'Past history of kidney stone passed smoothly 3 years back',
    expectedEventType: 'HISTORICAL_MEDICAL_EVENT',
    expectedSeverity: 'LOW',
    expectedEmergency: false,
    description: 'Past kidney stone history'
  },
  {
    id: 304,
    domain: 'Negation',
    input: 'I am not having any heart attack, just inquiring about treadmill exercise',
    expectedSeverity: 'LOW',
    expectedEmergency: false,
    description: 'Negated heart attack fitness query'
  },
  {
    id: 305,
    domain: 'Negation',
    input: 'I am not pregnant, just routine wellness query',
    expectedSeverity: 'LOW',
    expectedEmergency: false,
    description: 'Negated pregnancy'
  },
  {
    id: 306,
    domain: 'Routine Outpatient',
    input: 'Minor bruise on shin from bumping into coffee table yesterday',
    expectedSeverity: 'LOW',
    expectedEmergency: false,
    description: 'Minor superficial bruise'
  },
  {
    id: 307,
    domain: 'Routine Outpatient',
    input: 'Mild occasional sneeze, no difficulty breathing, feels like spring allergy',
    expectedSeverity: 'LOW',
    expectedEmergency: false,
    description: 'Mild seasonal allergy sneeze'
  },
  {
    id: 308,
    domain: 'Routine Outpatient',
    input: 'Routine consultation for renewal of multivitamin prescription',
    expectedSeverity: 'LOW',
    expectedEmergency: false,
    description: 'Multivitamin renewal'
  },
  {
    id: 309,
    domain: 'Routine Outpatient',
    input: 'Slight fatigue after a long transatlantic flight',
    expectedSeverity: 'LOW',
    expectedEmergency: false,
    description: 'Jetlag fatigue'
  },
  {
    id: 310,
    domain: 'Routine Outpatient',
    input: 'Mild sore throat after singing at concert last night',
    expectedSeverity: 'LOW',
    expectedEmergency: false,
    description: 'Vocal strain sore throat'
  },
  {
    id: 311,
    domain: 'Negation',
    input: 'I do not have appendix pain, just routine inquiry',
    expectedSeverity: 'LOW',
    expectedEmergency: false,
    description: 'Negated appendix pain routine'
  }
];

export function runClinicalEvaluation(): void {
  console.log('========================================================================================');
  console.log(`MEDINEXUS AI — COMPREHENSIVE CLINICAL EVALUATION SUITE (${testCases.length} CASES)`);
  console.log('========================================================================================\n');

  let eventAccuracyCount = 0;
  let severityAccuracyCount = 0;
  let emergencyRecallSuccess = 0;
  let emergencyTotal = 0;
  let falseLowCount = 0;
  let wrongPathwayCount = 0;
  let videoSafetyViolations = 0;
  let unknownHandledCorrectly = 0;
  let unknownTotal = 0;

  const failedTests: string[] = [];

  for (const tc of testCases) {
    const result = triageEngine.assess(tc.input);
    let pass = true;
    const errors: string[] = [];

    // 1. Event Classification Accuracy
    if (tc.expectedEventType) {
      if (result.event_type === tc.expectedEventType) {
        eventAccuracyCount++;
      } else {
        pass = false;
        errors.push(`Event mismatch: expected ${tc.expectedEventType}, got ${result.event_type}`);
      }
    } else {
      eventAccuracyCount++;
    }

    // 2. Specific Event Check
    if (tc.expectedSpecificEvent && result.specific_event !== tc.expectedSpecificEvent) {
      pass = false;
      errors.push(`Specific event mismatch: expected ${tc.expectedSpecificEvent}, got ${result.specific_event}`);
    }

    // 3. Severity Accuracy
    if (tc.expectedSeverity) {
      if (result.severity === tc.expectedSeverity) {
        severityAccuracyCount++;
      } else {
        pass = false;
        errors.push(`Severity mismatch: expected ${tc.expectedSeverity}, got ${result.severity}`);
      }
    } else {
      severityAccuracyCount++;
    }

    // 4. Emergency Recall
    if (tc.expectedEmergency !== undefined) {
      emergencyTotal++;
      if (result.emergency === tc.expectedEmergency) {
        emergencyRecallSuccess++;
      } else {
        pass = false;
        errors.push(`Emergency mismatch: expected ${tc.expectedEmergency}, got ${result.emergency}`);
      }
    }

    // 5. False-LOW Rate Guard (Zero tolerance)
    if (tc.forbidLow && result.severity === 'LOW') {
      falseLowCount++;
      pass = false;
      errors.push(`CRITICAL SAFETY VIOLATION: Dangerous case classified as LOW!`);
    }

    // 6. Video Safety Violations Guard (Zero tolerance)
    if (tc.forbidVideo && (result.consultation_mode === 'VIDEO' || result.next_step === 'VIDEO_PREFERRED')) {
      videoSafetyViolations++;
      pass = false;
      errors.push(`VIDEO SAFETY VIOLATION: Inappropriate video consultation mode offered!`);
    }

    // 7. Care Pathway Check
    if (tc.expectedNextStep && result.next_step !== tc.expectedNextStep) {
      wrongPathwayCount++;
      pass = false;
      errors.push(`Next step mismatch: expected ${tc.expectedNextStep}, got ${result.next_step}`);
    }

    // 8. Unknown / Insufficient Info Handling
    if (tc.expectedSeverity === 'MORE_INFORMATION') {
      unknownTotal++;
      if (result.severity === 'MORE_INFORMATION' && result.assessment_status === 'MORE_INFORMATION_REQUIRED') {
        unknownHandledCorrectly++;
      }
    }

    if (!pass) {
      failedTests.push(`[TEST ${tc.id}] ${tc.input} (${errors.join('; ')})`);
    }
  }

  // Compute Metrics
  const eventAccuracy = (eventAccuracyCount / testCases.length) * 100;
  const severityAccuracy = (severityAccuracyCount / testCases.length) * 100;
  const emergencyRecall = emergencyTotal > 0 ? (emergencyRecallSuccess / emergencyTotal) * 100 : 100;
  const falseLowRate = (falseLowCount / testCases.length) * 100;
  const wrongPathwayRate = (wrongPathwayCount / testCases.length) * 100;
  const unknownHandling = unknownTotal > 0 ? (unknownHandledCorrectly / unknownTotal) * 100 : 100;

  console.log('========================================================================================');
  console.log('CLINICAL EVALUATION METRICS REPORT (SECTION 25)');
  console.log('========================================================================================');
  console.log(`TOTAL CLINICAL TEST CASES EVALUATED : ${testCases.length}`);
  console.log(`EVENT CLASSIFICATION ACCURACY       : ${eventAccuracy.toFixed(2)}%`);
  console.log(`SEVERITY ACCURACY                   : ${severityAccuracy.toFixed(2)}%`);
  console.log(`EMERGENCY RECALL                    : ${emergencyRecall.toFixed(2)}%`);
  console.log(`FALSE-LOW RATE (CRITICAL)           : ${falseLowRate.toFixed(2)}%  ${falseLowRate === 0 ? '✅ (PERFECT ZERO FALSE-LOWS)' : '❌'}`);
  console.log(`WRONG-PATHWAY RATE                  : ${wrongPathwayRate.toFixed(2)}%`);
  console.log(`VIDEO-SAFETY VIOLATIONS             : ${videoSafetyViolations}  ${videoSafetyViolations === 0 ? '✅ (PERFECT ZERO VIOLATIONS)' : '❌'}`);
  console.log(`UNKNOWN/INSUFFICIENT-INFO HANDLING  : ${unknownHandling.toFixed(2)}%`);
  console.log('========================================================================================\n');

  if (failedTests.length > 0) {
    console.error(`FAILED TESTS (${failedTests.length}):`);
    failedTests.forEach(f => console.error('  ❌', f));
    process.exit(1);
  } else {
    console.log(`ALL ${testCases.length} CLINICAL TEST CASES PASSED CLEANLY! ✅`);
  }
}

runClinicalEvaluation();
