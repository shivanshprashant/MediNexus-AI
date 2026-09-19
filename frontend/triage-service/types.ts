/**
 * Clinical Triage Engine Types & Interfaces
 * MediNexus AI — Healthcare Architecture
 * Controlled Medical Event Taxonomy & Hierarchical Clinical Models
 */

export type TriageSeverity =
  | 'LOW'
  | 'MODERATE'
  | 'HIGH'
  | 'EMERGENCY'
  | 'MORE_INFORMATION'
  | 'ASSESSMENT_UNAVAILABLE';

export type AssessmentStatus =
  | 'ASSESSED'
  | 'MORE_INFORMATION_REQUIRED'
  | 'URGENT_EVALUATION_RECOMMENDED'
  | 'EMERGENCY';

export type TriageNextStep =
  | 'EMERGENCY'
  | 'URGENT_IN_PERSON'
  | 'ROUTINE_CONSULTATION'
  | 'VIDEO_PREFERRED'
  | 'VIDEO_OR_IN_PERSON'
  | 'MORE_INFORMATION';

export type ConsultationMode = 'NONE' | 'IN_PERSON' | 'VIDEO' | 'CHOICE';

export type SubjectRelation =
  | 'SELF'
  | 'CHILD'
  | 'INFANT'
  | 'PARENT'
  | 'SPOUSE'
  | 'OTHER'
  | 'OTHER_PERSON'
  | 'UNKNOWN';

export type AgeGroup =
  | 'INFANT'
  | 'CHILD'
  | 'ADOLESCENT'
  | 'ADULT'
  | 'OLDER_ADULT'
  | 'UNKNOWN';

/**
 * Section 2: Standardized Clinical Event Type Taxonomy
 */
export type ClinicalEventType =
  | 'GENERAL_SYMPTOM'
  | 'CARDIAC_EVENT'
  | 'RESPIRATORY_EVENT'
  | 'NEUROLOGICAL_EVENT'
  | 'LOSS_OF_CONSCIOUSNESS'
  | 'SEVERE_BLEEDING'
  | 'TRAUMA'
  | 'BURN'
  | 'POISONING'
  | 'TOXIC_INGESTION'
  | 'CHEMICAL_EXPOSURE'
  | 'MEDICATION_OVERDOSE'
  | 'FOOD_OR_SUBSTANCE_EXPOSURE'
  | 'VENOMOUS_BITE'
  | 'VENOMOUS_STING'
  | 'ANIMAL_BITE'
  | 'INSECT_BITE_OR_STING'
  | 'ALLERGIC_REACTION'
  | 'ANAPHYLAXIS'
  | 'PREGNANCY_RELATED'
  | 'ACUTE_ABDOMEN'
  | 'SEPSIS'
  | 'SURGICAL_EMERGENCY'
  | 'OPHTHALMIC_EMERGENCY'
  | 'ENVIRONMENTAL_EMERGENCY'
  | 'ENDOCRINE_METABOLIC'
  | 'CHILD_EMERGENCY'
  | 'INFANT_EMERGENCY'
  | 'INFECTIOUS_ILLNESS'
  | 'PSYCHIATRIC_CRISIS'
  | 'OTHER_ACUTE_EVENT'
  | 'HISTORICAL_MEDICAL_EVENT'
  | 'NON_MEDICAL_QUERY'
  | 'INSUFFICIENT_INFORMATION';

// Backward-compatible alias for existing code
export type EventType = ClinicalEventType | string;

export type TemporalContext =
  | 'CURRENT'
  | 'RECENT'
  | 'HISTORICAL'
  | 'UNCLEAR';

export type SubstanceType =
  | 'HOUSEHOLD_CHEMICAL'
  | 'DISINFECTANT'
  | 'CLEANING_PRODUCT'
  | 'MEDICATION'
  | 'PESTICIDE'
  | 'PLANT'
  | 'FOOD'
  | 'UNKNOWN';

export type ExposureRoute =
  | 'INGESTED'
  | 'INHALED'
  | 'SKIN'
  | 'EYE'
  | 'BITE'
  | 'STING'
  | 'UNKNOWN';

export interface ExposureDetails {
  type?: string;
  substance?: string;
  substanceName?: string;
  substanceType?: SubstanceType;
  route?: ExposureRoute | string;
  amount?: string;
  timeSinceExposure?: string;
  knownOrSuspected?: 'KNOWN' | 'SUSPECTED' | 'UNKNOWN';
}

/**
 * Section 6: Hierarchical Clinical Situation Object
 */
export interface ClinicalSituation {
  eventType: ClinicalEventType;
  eventFamily: string;
  specificEvent: string;

  subject: {
    relation: SubjectRelation;
    age?: number;
    ageGroup: 'INFANT' | 'CHILD' | 'ADOLESCENT' | 'ADULT' | 'OLDER_ADULT' | 'UNKNOWN';
  };

  temporalContext: 'CURRENT' | 'RECENT' | 'HISTORICAL' | 'UNCLEAR';

  mechanism?: string;

  exposure?: {
    type?: string;
    substance?: string;
    route?: string;
    amount?: string;
    timeSinceExposure?: string;
  };

  symptoms: string[];
  redFlags: string[];
  riskFactors: string[];

  pregnancy: boolean;

  consciousness: 'NORMAL' | 'ALTERED' | 'UNCONSCIOUS' | 'UNKNOWN';
  breathing: 'NORMAL' | 'DIFFICULT' | 'SEVERELY_DIFFICULT' | 'UNKNOWN';

  informationCompleteness: 'SUFFICIENT' | 'PARTIAL' | 'INSUFFICIENT';
  interpretationConfidence: 'LOW' | 'MEDIUM' | 'HIGH';

  // Internal helper fields
  rawText?: string;
  negatedItems?: string[];
  severityIndicators?: string[];
  informationSufficient?: boolean;
}

export interface PatientContextInput {
  age?: number;
  gender?: string;
  medicalConditions?: string[];
  medications?: string[];
  allergies?: string[];
  previousConditions?: string[];
}

export interface TriageInput {
  symptoms: string;
  language?: string;
  patientContext?: PatientContextInput;
  latitude?: number;
  longitude?: number;
  requestId?: string;
}

/**
 * Section 21: Final Clinical Output Contract
 */
export interface TriageResult {
  // Hierarchical Event Taxonomy
  event_type: ClinicalEventType;
  event_family: string;
  specific_event: string;

  severity: TriageSeverity;
  emergency: boolean;
  assessment_status: AssessmentStatus;

  department: string;
  next_step: TriageNextStep;
  consultation_mode: ConsultationMode;

  recommended_action: string;
  reason: string;
  immediate_guidance: string[];

  confidence: 'LOW' | 'MEDIUM' | 'HIGH' | number;
  risk_factors: string[];
  red_flags: string[];
  missing_information: string[];
  targeted_questions?: string[];

  // Backward compatibility for UI badges and components
  clinical_situation?: {
    subject_relation: string;
    event_type: string;
    temporal_context: string;
    route?: string;
    substance?: string;
    event_family?: string;
    specific_event?: string;
    [key: string]: any;
  };

  level?: 'Routine' | 'Moderate' | 'Urgent' | 'Emergency' | 'Information Needed';
  rec?: string;
  topHospital?: any;
  needsMoreInfo?: boolean;
}

/**
 * Pluggable Triage Service Contract
 */
export interface TriageService {
  assess(input: string | TriageInput): Promise<TriageResult>;
  assessSymptoms(input: TriageInput): Promise<TriageResult>;
}
