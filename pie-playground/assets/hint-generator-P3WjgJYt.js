import{hasGeneralLlm as g,callDeepSeek as x}from"./deepseek-client-92-6cHRR.js";import{P,a as S}from"./parser-2_AebncB.js";import"./proof-worker-2810n3vB.js";import"./location-BYWTt2JB.js";import"./locations-CaMUgunz.js";const v={introduction:"You need to introduce something into the context or provide a direct value.",elimination:"Consider eliminating (using) a value from your context to make progress.",constructor:"You need to construct a compound value like a pair or choose a side of a sum type.",application:"Try applying a function or lemma from your context."},w=new Error("DEEPSEEK_API_KEY is not set. Please provide an API key to use the hint system.");async function A(a,e,i,o){if(!g(a))throw w;const t=i.length>0?i.join(`
`):"No context available",c=o.length>0?o.join(`
`):"No definitions available yet",h=`You are a Socratic tutor for Pie, a dependently-typed programming language from "The Little Typer" book.

A student has a TODO expression that needs to have type: ${e}

Available definitions in scope:
${c}

Context (hypotheses):
${t}

Provide a HINT (not a solution) to help the student think about what to use.

Guidelines:
- Do NOT write the solution directly
- Suggest what KIND of value they need (constructor, function application, eliminator, etc.)
- Mention relevant definitions they could use, but don't say exactly how
- Ask guiding questions when appropriate
- Keep it to 1-2 sentences

Example hints:
- "Think about what constructor makes a value of type Nat. What are the two constructors?"
- "You have a function 'double' in scope that might be relevant here. How could it help?"
- "Consider what eliminator you could use for a List to build this value."
- "Since this is a Pi type, you'll need a lambda. What should the body be?"

Your hint (1-2 sentences):`;try{return await x(a,h)}catch(u){const m=u instanceof Error?u.message:String(u);throw new Error(`Failed to generate hint: ${m}`)}}async function C(a,e,i,o){if(!g(a))throw w;const t=i.length>0?i.join(`
`):"No hypotheses available",c=o.length>0?o.join(`
`):"No definitions available",h=`You are a proof assistant tutor for Pie tactical proofs.

Current Goal:
${e}

Available Hypotheses:
${t}

Definitions in Scope:
${c}

The student is stuck on this proof goal. Provide a HINT about what tactic might help.

Guidelines:
- Suggest tactic categories (intro, elim, exact, exists) not exact syntax
- If elimination is relevant, mention WHAT to eliminate, not the full tactic
- Reference the goal structure to guide thinking
- Use blurred language: "Consider your hypothesis about..." not "Use elim-Nat n"
- Keep it to 1-2 sentences

Example hints:
- "Since your goal is a Pi type, you probably need to introduce a variable first."
- "Look at your hypothesis 'n : Nat'. What eliminator works with natural numbers?"
- "Your goal is a Sigma type - think about what two values you need to provide."
- "You have a hypothesis that looks like what you're trying to prove. Maybe you can use it directly?"
- "Consider eliminating one of your hypotheses to reveal more structure."

Your hint (1-2 sentences):`;try{return await x(a,h)}catch(u){const m=u instanceof Error?u.message:String(u);throw new Error(`Failed to generate hint: ${m}`)}}async function J(a,e){if(e.type==="todo"){if(!e.expectedType)throw new Error("TODO hint requires expectedType");const i=Array.isArray(e.context)?e.context:k(e.context);return A(a,e.expectedType,i,e.availableDefinitions)}else if(e.type==="tactic"){if(!e.goalInfo)throw new Error("Tactic hint requires goalInfo");return C(a,e.goalInfo,e.hypotheses||[],e.availableDefinitions)}else throw new Error(`Unknown hint type: ${e.type}`)}function k(a){const e=[];for(const[i,o]of a.entries())if(!i.startsWith("_")&&Array.isArray(o)){const[t,...c]=o;t==="free"&&c.length>0?e.push(`${i} : ${c[0]}`):t==="def"&&c.length>=2?e.push(`${i} : ${c[0]} = ${c[1]}`):t==="claim"&&c.length>0&&e.push(`${i} : ${c[0]}`)}return e}async function V(a,e){if(!g(a))throw w;const i=e.context.length>0?e.context.map(h=>`${h.name} : ${h.type}`).join(`
`):"No context variables",o=e.availableTactics.join(", ");let t;switch(e.currentLevel){case"category":t=L(e.goalType,i,o);break;case"tactic":t=I(e.goalType,i,o,e.previousHint?.category);break;case"full":t=O(e.goalType,i,e.context,e.previousHint?.tacticType);break}const c=await x(a,t);return Y(c,e.currentLevel)}function L(a,e,i){return`You are a proof assistant for Pie, a dependently-typed language.

Goal type: ${a}
Context: ${e}
Available tactics: ${i}

Choose ONE category that would help prove this goal:
- introduction: For Pi types or when you have a direct value
- elimination: For using values from context (Nat, List, Either, etc.)
- constructor: For Pair/Sigma types or Either (left/right)
- application: For applying functions/lemmas

Respond with JSON only:
{"category": "<category>", "explanation": "<1 sentence why>", "confidence": <0.0-1.0>}`}function I(a,e,i,o){const t=o?`Focus on ${o} tactics.`:"";return`You are a proof assistant for Pie.

Goal type: ${a}
Context: ${e}
Available tactics: ${i}
${t}

Choose ONE specific tactic that would help.
Respond with JSON only:
{"tacticType": "<tactic>", "explanation": "<1 sentence why>", "confidence": <0.0-1.0>}`}function O(a,e,i,o){const t=o?`The suggested tactic is: ${o}`:"";return`You are a proof assistant for Pie.

Goal type: ${a}
Context: ${e}
${t}

Provide the complete tactic application with parameters.
For intro: specify the variable name to introduce
For elimNat/elimList/etc: specify which context variable to eliminate
For exact: specify the expression

Respond with JSON only:
{"tacticType": "<tactic>", "parameters": {"variableName": "<name>"} or {"expression": "<expr>"}, "explanation": "<how to apply>", "confidence": <0.0-1.0>}`}function Y(a,e,i){try{const o=a.match(/\{[\s\S]*\}/);if(!o)throw new Error("No JSON found in response");const t=JSON.parse(o[0]);return{level:e,category:t.category,tacticType:t.tacticType,parameters:t.parameters,explanation:t.explanation||"Consider this approach.",confidence:typeof t.confidence=="number"?t.confidence:.7}}catch{return{level:e,explanation:a.slice(0,200),confidence:.5}}}function D(a){const{goalType:e,context:i,currentLevel:o,previousHint:t}=a,c=e.startsWith("(Π")||e.startsWith("(Pi")||e.includes("→"),h=e.startsWith("(Σ")||e.startsWith("(Sigma"),u=e.startsWith("(Pair"),m=e.startsWith("(Either"),f=i.some(s=>s.type==="Nat"||s.type.includes("Nat")),N=i.some(s=>s.type.startsWith("(List")),T=i.some(s=>s.type.startsWith("(Either")),E=i.some(s=>s.type==="Absurd"),y=i.find(s=>s.type===e);switch(o){case"category":{let s,n,r=.8;return c?(s="introduction",n=v.introduction):u||h?(s="constructor",n="Your goal is a pair/sigma type. You need to provide both components."):m?(s="constructor",n="Your goal is an Either type. Choose left or right."):E?(s="elimination",n="You have Absurd in context - you can prove anything!",r=.95):y?(s="introduction",n=`You have "${y.name}" in context with the exact type you need.`,r=.9):f||N||T?(s="elimination",n=v.elimination):(s="introduction",n="Try introducing a value or using exact.",r=.6),{level:"category",category:s,explanation:n,confidence:r}}case"tactic":{const s=t?.category;let n,r,l=.75;return s==="introduction"||!s?c?(n="intro",r="Use intro to introduce the function parameter into context."):y?(n="exact",r=`Use exact with "${y.name}" from your context.`,l=.9):(n="exact",r="Provide the exact term that has this type.",l=.6):s==="elimination"?E?(n="elimAbsurd",r="Eliminate Absurd to prove your goal.",l=.95):f?(n="elimNat",r="Use induction on a Nat variable."):N?(n="elimList",r="Use induction on a List variable."):T?(n="elimEither",r="Case split on an Either variable."):(n="elimNat",r="Consider elimination on a context variable.",l=.5):s==="constructor"?u||h?(n="split",r="Split the pair goal into two subgoals."):m?(n="left",r="Choose left or right for the Either type.",l=.5):(n="split",r="Use a constructor tactic.",l=.5):(n="apply",r="Apply a function from context.",l=.5),{level:"tactic",category:s,tacticType:n,explanation:r,confidence:l}}case"full":{const s=t?.tacticType||"intro";let n={},r,l=.7;switch(s){case"intro":{let p="x";try{const d=P.parsePie(e);d instanceof S&&d.binders.length>0&&(p=d.binders[0].binder.varName)}catch{}n={variableName:p},r=`Introduce "${p}" into the context.`;break}case"exact":{y?(n={expression:y.name},r=`Use ${y.name} directly.`,l=.9):(n={expression:""},r="Provide the expression that has this type.",l=.4);break}case"elimNat":{const p=i.find(d=>d.type==="Nat");p?(n={variableName:p.name},r=`Perform induction on ${p.name}.`,l=.85):(n={variableName:"n"},r="Choose which Nat to eliminate.",l=.4);break}case"elimList":{const p=i.find(d=>d.type.startsWith("(List"));p?(n={variableName:p.name},r=`Perform induction on ${p.name}.`,l=.85):(n={variableName:"xs"},r="Choose which List to eliminate.",l=.4);break}case"elimEither":{const p=i.find(d=>d.type.startsWith("(Either"));p?(n={variableName:p.name},r=`Case split on ${p.name}.`,l=.85):(n={variableName:"e"},r="Choose which Either to eliminate.",l=.4);break}case"elimAbsurd":{const p=i.find(d=>d.type==="Absurd");p?(n={variableName:p.name},r=`Eliminate ${p.name} to prove anything.`,l=.95):(n={variableName:"abs"},r="Eliminate Absurd.",l=.4);break}case"split":n={},r="Split into two subgoals.";break;case"left":n={},r="Choose the left case.",l=.5;break;case"right":n={},r="Choose the right case.",l=.5;break;default:n={},r=`Apply ${s}.`,l=.5}return{level:"full",category:t?.category,tacticType:s,parameters:n,explanation:r,confidence:l}}}}function M(a){switch(a){case"category":return"tactic";case"tactic":return"full";case"full":return"full"}}const W={"elim-Nat":"elimNat","elim-List":"elimList","elim-Vec":"elimVec","elim-Either":"elimEither","elim-Equal":"elimEqual","elim-Absurd":"elimAbsurd","ind-Nat":"elimNat","ind-nat":"elimNat","ind-List":"elimList","ind-list":"elimList","ind-Vec":"elimVec","ind-Either":"elimEither","ind-equal":"elimEqual","ind-Equal":"elimEqual","ind-Absurd":"elimAbsurd","go-Left":"left","go-Right":"right"};function $(a){return W[a]||a}async function z(a,e){if(!g(a))return b(e);const i=e.context.length>0?e.context.map(t=>`${t.name} : ${t.type}`).join(`
`):"No context variables",o=R(e,i);try{const t=await x(a,o,"explanation");return H(t,e)}catch{return b(e)}}function R(a,e){const{predictedTactic:i,tacticCategory:o,goalType:t,level:c,proofStateText:h}=a,u=h?`Current proof state:
${h}`:`Goal type: ${t}
Context variables:
${e}`,m=`You are an educational proof assistant for Pie (from "The Little Typer").
A student who is NEW to type theory is working on a proof and needs a hint.
The correct next tactic is: ${i}

${u}

IMPORTANT: The student may not know Pie syntax or type theory jargon.
Always explain in PLAIN ENGLISH first, then connect to Pie syntax.
Use phrases like "for all", "there exists", "either...or", "equals"
instead of "Pi type", "Sigma type", "Either type", "equality type".

`;switch(c){case"category":return m+`Your job: explain only the CATEGORY of approach needed.
Do NOT reveal the specific tactic name or its parameters.

Categories:
- introduction: we need to assume a variable or provide a direct value
- elimination: we need to analyze or break down something we already know
- constructor: we need to build a compound value (a pair, or choose left/right)
- application: we need to use a known fact or function

Start by saying what the goal means in plain English, then suggest the approach.
Example: "This goal says 'for all natural numbers n, ...' — it makes a universal
claim. To prove a universal claim, we assume we have an arbitrary n and prove the
rest. In Pie, this is an introduction step."

Respond with JSON only:
{"category": "${o}", "explanation": "<1-2 sentences, plain English first>", "confidence": <0.0-1.0>}`;case"tactic":{const f=i.trim().split(/\s+/)[0];return m+`The student already knows the category is "${o}".
Now reveal the specific tactic "${f}" (but do NOT reveal its parameters).

Explain the concept in plain English FIRST, then name the Pie tactic. Examples:
- "We need to prove this by induction on n — handling the base case (n = 0) and the
  step case separately. In Pie, this is the elim-Nat tactic."
- "Since this is a universal statement ('for all n...'), we introduce n as a given.
  In Pie, this is the intro tactic."
- "We have a value that is 'either A or B', so we consider both cases.
  In Pie, this is elim-Either."

Respond with JSON only:
{"tacticType": "${f}", "explanation": "<1-2 sentences, concept first then Pie syntax>", "confidence": <0.0-1.0>}`}case"full":return m+`Now reveal the complete tactic with parameters: ${i}

Explain what each part means in plain English. Reference the proof state to
explain WHY specific arguments are used. Examples:
- "exact (add1-even->odd n-1 x)": "We already proved that adding 1 to an even
  number gives an odd number (add1-even->odd). We apply it to n-1 (our natural
  number) and x (our proof that n-1 is even). In Pie: exact (add1-even->odd n-1 x)."
- "elim-Nat n": "We prove this by induction on n. The base case handles n = 0,
  and the step case assumes the result for n-1 and proves it for n + 1.
  In Pie: elim-Nat n."

Respond with JSON only:
{"tacticType": "<name>", "parameters": {<params as key-value>}, "explanation": "<2-3 sentences: plain English meaning, then Pie syntax>", "confidence": <0.0-1.0>}`}}function H(a,e){try{const i=a.match(/\{[\s\S]*\}/);if(!i)throw new Error("No JSON found in response");const o=JSON.parse(i[0]),t=e.predictedTactic.trim().split(/\s+/)[0],c=e.predictedTactic.trim().split(/\s+/).slice(1).join(" "),h={level:e.level,explanation:o.explanation||"Consider this approach.",explanationSource:typeof o.explanation=="string"&&o.explanation.trim()?"deepseek":"template",confidence:typeof o.confidence=="number"?o.confidence:.9};return h.category=e.tacticCategory,(e.level==="tactic"||e.level==="full")&&(h.tacticType=$(t)),e.level==="full"&&c&&(t==="exact"||t==="exists"?h.parameters={expression:c}:(t==="intro"||t==="elimNat"||t==="elim-Nat"||t==="elimList"||t==="elim-List"||t==="elimEither"||t==="elim-Either"||t==="elimAbsurd"||t==="elim-Absurd")&&(h.parameters={variableName:c})),h}catch{return b(e)}}function b(a){const e=a.predictedTactic.trim().split(/\s+/)[0],i=$(e),o=a.predictedTactic.trim().split(/\s+/).slice(1).join(" "),t=a.tacticCategory;switch(a.level){case"category":return{level:"category",category:t,explanation:v[t]||`Consider a ${t} approach.`,explanationSource:"template",confidence:.9};case"tactic":return{level:"tactic",category:t,tacticType:i,explanation:`Use the ${i} tactic for this goal.`,explanationSource:"template",confidence:.9};case"full":{const c={};return o&&(i==="exact"||i==="exists"?c.expression=o:c.variableName=o),{level:"full",category:t,tacticType:i,parameters:c,explanation:`Apply ${a.predictedTactic}.`,explanationSource:"template",confidence:.9}}}}export{z as explainTactic,J as generateHint,V as generateProgressiveHint,D as generateRuleBasedHint,C as generateTacticHint,A as generateTodoHint,M as getNextHintLevel};
//# sourceMappingURL=hint-generator-P3WjgJYt.js.map
