import { evaluateClinicalSituation, extractClinicalSituation } from './triageRules';
import { PatientContextInput, TriageResult } from './types';

interface TestCase {
  group: string;
  input: string;
  expectedKeywords: string[];
}

const testCases: TestCase[] = [
  // A - Trauma
  { group: 'A - TRAUMA', input: "I got shot in the leg.", expectedKeywords: ['GUNSHOT', 'EMERGENCY'] },
  { group: 'A - TRAUMA', input: "My friend got shot in the head.", expectedKeywords: ['GUNSHOT', 'HEAD', 'EMERGENCY'] },
  { group: 'A - TRAUMA', input: "I have a bullet wound in my arm.", expectedKeywords: ['GUNSHOT'] },
  { group: 'A - TRAUMA', input: "My friend was hit by a bullet.", expectedKeywords: ['GUNSHOT'] },
  // B - Scorpion
  { group: 'B - SCORPION', input: "I got scorpion bite.", expectedKeywords: ['SCORPION'] },
  { group: 'B - SCORPION', input: "A scorpion stung my child.", expectedKeywords: ['SCORPION', 'CHILD'] },
  { group: 'B - SCORPION', input: "Scorpion stung me and now I cannot breathe.", expectedKeywords: ['SCORPION', 'EMERGENCY'] },
  { group: 'B - SCORPION', input: "Bichhu ne kaat liya.", expectedKeywords: ['SCORPION'] },
  // C - Poisoning
  { group: 'C - POISONING', input: "My child drank phenyl.", expectedKeywords: ['TOXIC', 'CHILD'] },
  { group: 'C - POISONING', input: "My toddler swallowed floor cleaner.", expectedKeywords: ['TOXIC', 'CHILD'] },
  { group: 'C - POISONING', input: "I accidentally drank an unknown chemical.", expectedKeywords: ['TOXIC'] },
  // D - Cardiac
  { group: 'D - CARDIAC', input: "My father is having a heart attack.", expectedKeywords: ['CARDIAC', 'EMERGENCY'] },
  { group: 'D - CARDIAC', input: "My father had a heart attack five years ago.", expectedKeywords: ['HISTORICAL'] },
  { group: 'D - CARDIAC', input: "I have severe chest pain and I am sweating.", expectedKeywords: ['CHEST_PAIN', 'EMERGENCY'] },
  // E - Neurological
  { group: 'E - NEUROLOGICAL', input: "My father is unconscious.", expectedKeywords: ['LOSS_OF_CONSCIOUSNESS', 'EMERGENCY'] },
  { group: 'E - NEUROLOGICAL', input: "My dad isn't waking up.", expectedKeywords: ['LOSS_OF_CONSCIOUSNESS', 'EMERGENCY'] },
  { group: 'E - NEUROLOGICAL', input: "I suddenly cannot move my right arm.", expectedKeywords: ['NEUROLOGICAL', 'EMERGENCY'] },
  // F - Respiratory
  { group: 'F - RESPIRATORY', input: "I cannot breathe properly.", expectedKeywords: ['RESPIRATORY'] },
  { group: 'F - RESPIRATORY', input: "My wife is struggling to breathe.", expectedKeywords: ['RESPIRATORY'] },
  // G - Pregnancy
  { group: 'G - PREGNANCY', input: "My pregnant wife has severe abdominal pain.", expectedKeywords: ['PREGNANCY'] },
  { group: 'G - PREGNANCY', input: "My pregnant wife is bleeding heavily.", expectedKeywords: ['PREGNANCY', 'EMERGENCY'] },
  // H - Non-medical
  { group: 'H - NON-MEDICAL', input: "I'm in love with a girl.", expectedKeywords: ['NON_MEDICAL'] },
  { group: 'H - NON-MEDICAL', input: "What's the weather today?", expectedKeywords: ['NON_MEDICAL'] },
  { group: 'H - NON-MEDICAL', input: "Tell me a joke.", expectedKeywords: ['NON_MEDICAL'] },
  { group: 'H - NON-MEDICAL', input: "Who is the president of the USA?", expectedKeywords: ['NON_MEDICAL'] },
  // I - Insufficient Info
  { group: 'I - INSUFFICIENT', input: "I don't feel well.", expectedKeywords: ['INSUFFICIENT'] },
  { group: 'I - INSUFFICIENT', input: "Something is wrong with my child.", expectedKeywords: ['INSUFFICIENT'] },
  // J - Negation
  { group: 'J - NEGATION', input: "I was not bitten by a scorpion.", expectedKeywords: [] }, // Specific negation check needed
  { group: 'J - NEGATION', input: "My child did not drink the cleaner.", expectedKeywords: [] },
  { group: 'J - NEGATION', input: "My father is not unconscious.", expectedKeywords: [] },
  // K - Temporal
  { group: 'K - TEMPORAL', input: "I was shot five years ago and recovered.", expectedKeywords: ['HISTORICAL'] },
  { group: 'K - TEMPORAL', input: "I was bitten by a scorpion five minutes ago.", expectedKeywords: ['CURRENT', 'SCORPION'] },
  { group: 'K - TEMPORAL', input: "My father had a heart attack in 2020.", expectedKeywords: ['HISTORICAL'] },
  { group: 'K - TEMPORAL', input: "My father is having a heart attack now.", expectedKeywords: ['CURRENT', 'EMERGENCY'] },
];

const patientContext: PatientContextInput = { age: 30, gender: 'MALE' };

let passed = 0;
let failed = 0;

console.log('--- STARTING MEDINEXUS AI TRIAGE TEST SUITE ---');

testCases.forEach((tc, i) => {
  const situation = extractClinicalSituation(tc.input, patientContext);
  const result = evaluateClinicalSituation(situation);
  
  const resultString = JSON.stringify(result).toUpperCase();
  const situationString = JSON.stringify(situation).toUpperCase();
  
  const allKeywordsFound = tc.expectedKeywords.every(k => resultString.includes(k) || situationString.includes(k));
  
  if (allKeywordsFound) {
    passed++;
    console.log(`[PASS] ${tc.group} - "${tc.input}"`);
  } else {
    failed++;
    console.log(`[FAIL] ${tc.group} - "${tc.input}"`);
    console.log(`       EXPECTED: ${tc.expectedKeywords.join(', ')}`);
    console.log(`       GOT EVENT: ${result.event_type} (${result.severity})`);
    console.log(`       SITUATION: ${JSON.stringify(situation)}`);
    console.log(`       RESULT: ${JSON.stringify(result)}\n`);
  }
});

console.log('--- SUMMARY ---');
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Total:  ${passed + failed}`);
