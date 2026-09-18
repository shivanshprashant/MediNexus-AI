/**
 * Clinical Triage Engine Orchestrator
 * MediNexus AI — Healthcare Safety Architecture
 * 
 * Pipeline:
 * USER INPUT
 *   ↓ Language Understanding
 *   ↓ Clinical Event Classification
 *   ↓ Structured Clinical Situation Context Extraction
 *   ↓ Red Flag & Risk Extraction
 *   ↓ Event-Specific Risk Assessment Strategy
 *   ↓ Safety Invariant Validation Gate
 *   ↓ Severity & Safe Care Pathway
 */

import { TriageInput, TriageResult, ClinicalSituation } from './types';
import { extractClinicalSituation, evaluateClinicalSituation } from './triageRules';

export class TriageEngine {
  /**
   * Assesses patient input symptoms and generates structured clinical urgency assessment.
   * Answers: "What is happening here?" before "How urgent is it?"
   */
  public assess(input: TriageInput | string): TriageResult {
    const rawText = (typeof input === 'string' ? input : input.symptoms || '').trim();
    const patientContext = typeof input === 'string' ? undefined : input.patientContext;

    if (!rawText) {
      return {
        event_type: 'INSUFFICIENT_INFORMATION',
        event_family: 'INSUFFICIENT_DATA',
        specific_event: 'EMPTY_INPUT',
        severity: 'MORE_INFORMATION',
        emergency: false,
        assessment_status: 'MORE_INFORMATION_REQUIRED',
        department: 'General Medicine',
        next_step: 'MORE_INFORMATION',
        consultation_mode: 'NONE',
        recommended_action: 'Please provide a description of the symptoms or event.',
        reason: 'No clinical information or symptom description was provided.',
        immediate_guidance: [
          'Type or speak the health symptoms or event you or the patient are experiencing.'
        ],
        targeted_questions: [
          'What symptoms or medical event occurred?',
          'Who is affected and when did it begin?',
          'Are there any acute red flags like difficulty breathing, chest pain, or unresponsiveness?'
        ],
        confidence: 'HIGH',
        risk_factors: [],
        red_flags: [],
        missing_information: ['Symptom description', 'Person affected', 'Onset'],
        clinical_situation: {
          subject_relation: 'UNKNOWN',
          event_type: 'INSUFFICIENT_INFORMATION',
          temporal_context: 'UNCLEAR',
          event_family: 'INSUFFICIENT_DATA',
          specific_event: 'EMPTY_INPUT'
        },
        level: 'Information Needed',
        rec: 'Please provide symptom details.',
        needsMoreInfo: true
      };
    }

    try {
      // Stage 1 & 2: Semantic Clinical Event Understanding & Structured Situation
      const situation: ClinicalSituation = extractClinicalSituation(rawText, patientContext);

      // Stage 3 & 4: Event-Specific Risk Assessment & Safety Invariant Validation
      const result: TriageResult = evaluateClinicalSituation(situation);

      // Add UI-friendly level and rec labels for backward compatibility
      if (result.severity === 'EMERGENCY' || result.emergency) {
        result.level = 'Emergency';
        result.rec = result.recommended_action;
      } else if (result.severity === 'HIGH') {
        result.level = 'Urgent';
        result.rec = result.recommended_action;
      } else if (result.severity === 'MODERATE') {
        result.level = 'Moderate';
        result.rec = result.recommended_action;
      } else if (result.severity === 'MORE_INFORMATION') {
        result.level = 'Information Needed';
        result.rec = result.recommended_action;
        result.needsMoreInfo = true;
      } else {
        result.level = 'Routine';
        result.rec = result.recommended_action;
      }

      return result;
    } catch (err) {
      console.error('[TriageEngine] Evaluation error:', err);
      // Safe, cautious non-LOW fallback if parsing failed unexpectedly.
      // NEVER falsely reassure as LOW!
      return {
        event_type: 'INSUFFICIENT_INFORMATION',
        event_family: 'INSUFFICIENT_DATA',
        specific_event: 'SYSTEM_EVALUATION_ERROR',
        severity: 'MORE_INFORMATION',
        emergency: false,
        assessment_status: 'MORE_INFORMATION_REQUIRED',
        department: 'General Medicine',
        next_step: 'MORE_INFORMATION',
        consultation_mode: 'NONE',
        recommended_action: 'Automated urgency assessment could not be completed safely. Please seek professional clinical evaluation.',
        reason: 'Clinical analysis could not be computed safely. Direct clinical assessment is recommended.',
        immediate_guidance: [
          'If in immediate physical danger, severe pain, or difficulty breathing, contact local emergency services immediately (Dial 108/112).',
          'Consult a physician or visit the nearest clinic for in-person evaluation.'
        ],
        targeted_questions: [
          'Could you clarify the main symptom or event you are experiencing?',
          'How long has it been present and is it getting worse?'
        ],
        confidence: 'LOW',
        risk_factors: [],
        red_flags: [],
        missing_information: ['Complete symptom description'],
        clinical_situation: {
          subject_relation: 'UNKNOWN',
          event_type: 'INSUFFICIENT_INFORMATION',
          temporal_context: 'UNCLEAR',
          event_family: 'INSUFFICIENT_DATA',
          specific_event: 'SYSTEM_EVALUATION_ERROR'
        },
        level: 'Information Needed',
        rec: 'Consult a healthcare provider for clinical evaluation.',
        needsMoreInfo: true
      };
    }
  }
}

export const triageEngine = new TriageEngine();
