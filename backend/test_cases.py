import asyncio
from app.services.llm_interface import _score_symptoms

test_cases = [
    'My eyes are red and burning.',
    'Cleaning chemical splashed into my eye.',
    'Hot oil splashed into my eye.',
    'My eyes feel tired after using my laptop all day.',
    'My throat is burning.',
    'I have burning while urinating.',
    'My stomach feels like it is burning.',
    'My skin is burning after I spilled boiling water on it.',
    'I burned my hand on a stove.',
    'My chest feels tight.',
    'My shoes feel tight.',
    'I got shot in the leg.',
    'I got a vaccine shot.',
    'I took a screenshot.',
    'My father is having a heart attack.',
    'My computer is under attack.',
    'I had a panic attack last year.',
    'A scorpion stung me.',
    'My eyes sting when I use these drops.',
    'My father is unconscious.',
    'My father was unconscious five years ago.',
    'I have chest pain and difficulty breathing.',
    'I have mild chest discomfort but no difficulty breathing.',
    'My eyes are burning but nothing burned me.',
    'My chest is burning after eating spicy food.',
    'My friend said that movie was fire.',
    'My computer has a virus.',
    'I think I caught a virus.',
    'My heart is broken because my girlfriend left.',
    'My chest feels like it is being crushed.'
]

print('==============================')
print('CONTRAST TESTS & REGRESSIONS')
print('==============================')

for tc in test_cases:
    score = _score_symptoms(tc)
    print(f'\nINPUT: {tc}')
    print(f'DEPARTMENT: {score.get("department")}')
    print(f'SEVERITY: {score.get("severity")}')
    print(f'GUIDANCE: {score.get("guidance")}')
    if score.get("emergency"):
        print('EMERGENCY: TRUE')
