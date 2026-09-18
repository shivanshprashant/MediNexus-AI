import { evaluateClinicalSituation, extractClinicalSituation } from './triageRules';
import { PatientContextInput, TriageResult } from './types';

const testCases = [
  // Trauma / Gunshot
  "a sniper shot my leg", "i caught a bullet in my shoulder", "stray bullet hit my friend", "someone shot at me and missed but I fell and broke my arm",
  "impaled by a metal rod", "a rebar went through my chest", "stabbed with a kitchen knife", "I fell on a pitchfork",
  "got into a horrific car accident", "hit by a truck while walking", "a tree fell on my leg", "my arm was severed by a saw",
  "I cut off my finger while chopping", "finger got amputated in a machine", "dropped a 100lb weight on my foot", "I think my ribs are broken",
  "slipped on ice and my bone is sticking out", "fell from the roof", "jumped out of a 2nd story window", "fell off a balcony",
  
  // Burns
  "spilled boiling water all over my torso", "my face caught on fire", "chemical acid splashed in my eyes", "touched a red hot stove",
  
  // Poisoning / Overdose
  "i swallowed rat poison", "my baby drank bleach", "toddler ate tide pods", "accidentally drank antifreeze", 
  "took 20 tylenol pills", "I think I overdosed on heroin", "drank a bottle of unknown pills", "my friend took too much fentanyl",
  
  // Venomous / Bites
  "rattlesnake bit my ankle", "bitten by an unknown spider and I feel dizzy", "black widow bite", "was stung by a swarm of bees and my throat is closing",
  "a dog mauled my arm", "bitten by a stray dog", "cat bit me deeply", "a bat bit me in my sleep",
  
  // Breathing
  "I'm choking", "I can't catch my breath", "asthma attack and inhaler isn't working", "gasping for air",
  "my lips are turning blue", "throat feels like it's swelling shut",
  
  // Cardiac
  "crushing pain in the center of my chest", "chest feels tight and pain radiating down left arm", "heart is beating out of my chest and I'm dizzy",
  
  // Neurological
  "my face is drooping on one side", "I can't speak properly, words are slurred", "sudden worst headache of my life", 
  "I can't see out of my right eye suddenly", "my grandfather just collapsed and isn't moving", "my dad fainted and won't wake up",
  "my friend is having a seizure", "shaking uncontrollably and foaming at the mouth",
  
  // Pregnancy
  "I am 8 months pregnant and my water broke with blood", "pregnant and having contractions every 2 minutes",
  "pregnant and dizzy with spots in vision",
  
  // Pediatric / Infant
  "my 2 week old baby has a high fever", "infant won't stop crying and is very hot", "my newborn is lethargic",
  
  // Non-medical / Conversational
  "can you tell me a story", "what is the meaning of life", "i am so happy right now", "i hate my boss", 
  "who won the cricket match", "my favorite color is blue", "i want to eat pizza", "how do I cook pasta",
  "i am feeling romantic", "do you believe in aliens", "sing a song for me", "what is your name",
  "i love watching movies", "my boyfriend is annoying", "i got a new job", "let's go to the beach",
  
  // Vague / Insufficient
  "I feel weird", "something is off", "I don't know what's happening", "my body feels strange",
  
  // Psychiatric
  "my friend jumped from balcony of 3rd floor", "I want to end my life", "suicide", "I'm going to slit my wrists",
  
  // Historical
  "I had a stroke 10 years ago", "I survived a heart attack in 2015", "I broke my leg when I was a kid",
  
  // Negation
  "I don't have chest pain", "I'm not bleeding", "I haven't taken any poison", "My father is not unconscious"
];

const patientContext: PatientContextInput = { age: 30, gender: 'MALE' };

let passed = 0;
let failed = 0;

console.log('--- STARTING UNSEEN TEST SUITE (' + testCases.length + ' cases) ---');

testCases.forEach((input, i) => {
  const situation = extractClinicalSituation(input, patientContext);
  const result = evaluateClinicalSituation(situation);
  
  // Define safety rules for evaluation
  let isSafe = true;
  let reason = '';
  
  if (input.includes('shot') || input.includes('bullet') || input.includes('stabbed') || input.includes('amputat') || input.includes('severed')) {
    if (result.severity !== 'EMERGENCY' || result.event_family !== 'TRAUMA_AND_INJURY') {
      isSafe = false; reason = 'Severe trauma not flagged as EMERGENCY or TRAUMA_AND_INJURY';
    }
  } else if (input.includes('jumped from balcony') || input.includes('end my life') || input.includes('suicide') || input.includes('slit my wrists')) {
    if (result.severity !== 'EMERGENCY' || result.event_type !== 'PSYCHIATRIC_CRISIS') {
      isSafe = false; reason = 'Psychiatric crisis not flagged as EMERGENCY or PSYCHIATRIC_CRISIS';
    }
  } else if (input.includes('love') || input.includes('tell me a story') || input.includes('pizza') || input.includes('alien')) {
    if (result.event_type !== 'NON_MEDICAL_QUERY') {
      isSafe = false; reason = 'Non-medical query not flagged as NON_MEDICAL_QUERY';
    }
  } else if (input.includes('poison') || input.includes('bleach') || input.includes('antifreeze') || input.includes('overdose') || input.includes('pills')) {
    if (result.event_type === 'GENERAL_SYMPTOM' || result.severity === 'LOW') {
      isSafe = false; reason = 'Poisoning wrongly classified as GENERAL_SYMPTOM or LOW';
    }
  }
  
  if (isSafe) {
    passed++;
  } else {
    failed++;
    console.log(`[FAIL] "${input}"`);
    console.log(`       REASON: ${reason}`);
    console.log(`       GOT: ${result.event_type} - ${result.severity}`);
  }
});

console.log('--- SUMMARY ---');
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Total:  ${passed + failed}`);
