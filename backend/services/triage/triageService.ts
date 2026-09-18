/**
 * Triage Service Implementation Layer
 * MediNexus AI — Pluggable Service Architecture
 * 
 * Supports LocalTriageService (for standalone frontend development)
 * and BackendTriageService (for FastAPI/NVIDIA backend integration).
 */

import { TriageInput, TriageResult, TriageService } from './types';
import { triageEngine } from './triageEngine';

/**
 * Local Frontend Triage Service
 * Provides instant, reliable, offline-capable clinical urgency classification.
 */
export class LocalTriageService implements TriageService {
  public async assess(input: string | TriageInput): Promise<TriageResult> {
    const triageInput: TriageInput = typeof input === 'string' ? { symptoms: input } : input;
    const result = triageEngine.assess(triageInput);
    return Promise.resolve(result);
  }

  public async assessSymptoms(input: TriageInput): Promise<TriageResult> {
    return this.assess(input);
  }
}

/**
 * Backend API Triage Service
 * Prepared for real FastAPI / NVIDIA backend integration.
 */
export class BackendTriageService implements TriageService {
  private apiBaseUrl: string;

  constructor(apiBaseUrl: string = 'http://127.0.0.1:8080') {
    this.apiBaseUrl = apiBaseUrl;
  }

  public async assess(input: string | TriageInput): Promise<TriageResult> {
    const triageInput: TriageInput = typeof input === 'string' ? { symptoms: input } : input;
    return this.assessSymptoms(triageInput);
  }

  public async assessSymptoms(input: TriageInput): Promise<TriageResult> {
    const payload = {
      symptomText: input.symptoms,
      patient_latitude: input.latitude ?? 23.2599,
      patient_longitude: input.longitude ?? 77.4126,
      request_id: input.requestId || `TRIAGE-${Date.now()}`,
      patient_context: input.patientContext
    };

    const response = await fetch(`${this.apiBaseUrl}/api/assess`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || `Backend error: ${response.status}`);
    }

    const data = await response.json();
    const assessment = data.assessment || {};
    const pathway = data.pathway || {};

    let level: 'Routine' | 'Moderate' | 'Urgent' | 'Emergency' = 'Routine';
    if (assessment.severity === 'EMERGENCY' || assessment.emergency) {
      level = 'Emergency';
    } else if (assessment.severity === 'HIGH') {
      level = 'Urgent';
    } else if (assessment.severity === 'MODERATE') {
      level = 'Moderate';
    }

    return {
      event_type: assessment.event_type || 'GENERAL_SYMPTOM',
      event_family: assessment.event_family || 'GENERAL_SYSTEMIC',
      specific_event: assessment.specific_event || 'NON_SPECIFIC_SYMPTOM',
      assessment_status: assessment.assessment_status || (assessment.emergency ? 'EMERGENCY' : 'ASSESSED'),
      severity: assessment.severity || 'MODERATE',
      emergency: Boolean(assessment.emergency),
      department: assessment.department || 'General Medicine',
      next_step: pathway.next_step || (assessment.emergency ? 'EMERGENCY' : 'ROUTINE_CONSULTATION'),
      consultation_mode: pathway.consultation_mode || 'IN_PERSON',
      recommended_action: assessment.recommended_action || 'Consult a medical professional.',
      reason: assessment.reason || 'Symptom evaluation completed.',
      immediate_guidance: assessment.immediate_guidance || [],
      confidence: assessment.confidence || 'HIGH',
      risk_factors: assessment.risk_factors || [],
      red_flags: assessment.red_flags || [],
      clinical_situation: assessment.clinical_situation || {
        subject_relation: 'SELF',
        event_type: 'SYMPTOM',
        temporal_context: 'CURRENT'
      },
      missing_information: assessment.missing_information || [],
      level,
      rec: assessment.rec || assessment.recommended_action
    };
  }
}

/**
 * Active Triage Service Instance
 * When the real backend is ready, this single line can be updated to:
 * export const activeTriageService: TriageService = new BackendTriageService();
 */
export const activeTriageService: TriageService = new BackendTriageService();
