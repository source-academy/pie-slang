# Pie-Slang UI Usability Study
## 20-30 Minute Interface Evaluation (AI-Visual Branch)

---

## Overview

**Goal:** Evaluate the playground UI/UX from the ai-visual branch, not the language itself.

**Duration:** 20-30 minutes (one session)  
**Participants:** 15-25 students  
**Format:** Hands-on interaction testing

**Test URL:** https://source-academy.github.io/pie-slang/tree/ai-visual (or deployed preview link)

---

## The Study (30 Minutes Max)

### Part 1: First Impressions (5 minutes)

**Open the ai-visual branch playground**

**Don't touch anything yet. Just look.**

**Answer these:**
1. What do you think this tool does? (guess before reading anything)
2. Describe the layout - what sections do you see?
3. Where would you type code?
4. Where would you expect to see output?
5. Do you notice anything AI-related or visual aids?
6. First impression: Modern / Cluttered / Minimalist / Overwhelming? (pick one or more)

---

### Part 2: Basic Interactions (10 minutes)

**Now try these UI actions:**

#### Action 1: Run Code
- Click in the editor area
- Type: `(add1 zero)`
- Find and click the "Run" button
- **Questions:**
  - Was it easy to find the run button? (1-5)
  - What color/icon is it?
  - Where did the output appear?
  - Is output visually distinct from the editor?
  - Overall ease: 1-5

#### Action 2: Load an Example
- Find the "Examples" dropdown/selector
- Select any example (e.g., "Hello World" or "Addition")
- Observe what happens
- **Questions:**
  - Was it easy to find the examples selector? (1-5)
  - What format is it? (dropdown, sidebar, buttons?)
  - Did the code replace or append?
  - Is there a preview of what the example does?
  - Overall ease: 1-5

#### Action 3: Observe AI/Visual Features
- Look for any AI assistance features
- Look for any visual aids (diagrams, trees, visualizations)
- **Questions:**
  - Do you see any AI-related UI elements?
  - Are there any code visualizations (e.g., type trees, execution traces)?
  - Do you see proof state visualizations?
  - Where are these located on the screen?
  - Are they helpful or distracting?
  - Rate usefulness: 1-5

#### Action 4: Create an Error
- Type: `(+ 1 "hello")`
- Run it
- **Questions:**
  - Where did the error message appear?
  - Is there visual highlighting of the error location?
  - Does the AI suggest a fix?
  - Are there multiple error display areas?
  - Can you tell what went wrong from the UI alone?
  - Rate error message clarity: 1-5

#### Action 5: Use Visual Tools
- Look for any buttons related to visualization or AI
- Try clicking them if found
- **Questions:**
  - Is there a "Visualize" or "Show proof tree" button?
  - Is there an "AI help" or "Suggest fix" button?
  - What happens when you click these?
  - Are the visualizations clear?
  - Rate usefulness: 1-5

---

### Part 3: AI & Visualization Features (10 minutes)

#### AI Assistance (if available)
- Try to trigger AI help (look for buttons/panels)
- Type incomplete code and see if AI offers suggestions
- Generate a proof or function with AI
- **Questions:**
  - How do you access AI features? (describe)
  - Is it clear when AI is "thinking" or working?
  - Are AI suggestions clearly labeled?
  - Can you accept/reject AI suggestions easily?
  - Does AI explain its suggestions?
  - Rate AI integration: 1-5

#### Proof Visualization (if available)
- Load an example with a proof (e.g., equality proof, induction)
- Look for visual representation of proof state
- **Questions:**
  - Is there a visual proof tree or goal display?
  - Can you see the current proof state?
  - Does it update as you type?
  - Is the visualization helpful or confusing?
  - Can you interact with the visualization?
  - Rate visualization clarity: 1-5

#### Type Information Display
- Hover over variables, functions, or types
- Look for type annotations or signatures
- **Questions:**
  - How is type information displayed?
  - Are there inline type hints?
  - Is there a dedicated type info panel?
  - Can you see dependent type details visually?
  - Rate type info display: 1-5

#### Execution Trace/Debugger (if available)
- Look for step-through or trace features
- Try running code with visualization
- **Questions:**
  - Is there a step-by-step execution view?
  - Can you see how values are computed?
  - Is there a call stack or evaluation tree?
  - Rate usefulness: 1-5

---

### Part 4: Layout & Organization (5 minutes)

**Examine the overall interface:**

#### Panel Layout
- How many main sections/panels are there?
- Are they resizable or fixed?
- Can you hide/show panels?
- **Questions:**
  - Is the layout flexible or rigid?
  - Can you focus on just the editor?
  - Are visualization panels collapsible?
  - Does the layout adapt to your workflow?
  - Rate layout flexibility: 1-5

#### Visual Hierarchy
- What draws your eye first?
- Which elements are most prominent?
- **Questions:**
  - Is the editor the main focus?
  - Are visualizations too dominant or too subtle?
  - Do AI features distract from coding?
  - Is there good visual separation between sections?
  - Rate visual hierarchy: 1-5

#### Color & Styling
- Observe the color scheme
- Note any visual themes
- **Questions:**
  - Are colors used effectively for different element types?
  - Is syntax highlighting distinct?
  - Are error/success states clearly color-coded?
  - Is the overall aesthetic pleasing?
  - Rate visual design: 1-5

---

### Part 5: Overall Experience (5 minutes)

**Rate the UI (1-7 scale):**
1. "The layout makes sense"
2. "Buttons and controls are easy to find"
3. "Output is clearly separated from input"
4. "AI features are well-integrated"
5. "Visualizations enhance understanding"
6. "The interface doesn't feel overwhelming"
7. "Error messages are easy to understand"
8. "This feels modern and polished"

**Open-ended:**
9. Most confusing UI element?
10. Most helpful visual feature?
11. How do AI features compare to expectations?
12. What visualization would you add?
13. If you could change one thing, what would it be?
14. Compare to other AI coding tools (GitHub Copilot, Cursor, etc.)?

**AI-specific questions:**
15. Did AI assistance feel intrusive or helpful?
16. Were AI suggestions trustworthy/accurate?
17. Would you use AI features regularly?

---


## Data Collection Sheet

**Participant ID:** _____ **Date:** _____ **Browser:** _____ **Branch:** ai-visual

### Feature Discovery
| Feature | Found? | Used? | Helpful? | Comments |
|---------|--------|-------|----------|----------|
| AI suggestions | Y/N | Y/N | 1-5 | |
| Proof visualization | Y/N | Y/N | 1-5 | |
| Type info display | Y/N | Y/N | 1-5 | |
| Execution trace | Y/N | Y/N | 1-5 | |
| Visual debugging | Y/N | Y/N | 1-5 | |

### Ease of Use (1-5 scale)
| Action | Rating | Comments |
|--------|--------|----------|
| Find run button | ___/5 | |
| Load example | ___/5 | |
| Trigger AI help | ___/5 | |
| View visualization | ___/5 | |
| Understand error | ___/5 | |

### Feature Ratings (1-5 scale)
| Feature | Rating | Comments |
|---------|--------|----------|
| AI integration | ___/5 | |
| Visualization clarity | ___/5 | |
| Error visualization | ___/5 | |
| Type info display | ___/5 | |
| Layout flexibility | ___/5 | |
| Visual hierarchy | ___/5 | |

### Overall UI (1-7 scale)
| Aspect | Rating |
|--------|--------|
| Layout clarity | ___/7 |
| Control findability | ___/7 |
| AI integration | ___/7 |
| Visualization usefulness | ___/7 |
| Visual design | ___/7 |
| Not overwhelming | ___/7 |
| Error feedback | ___/7 |
| Modern/polished | ___/7 |

### AI-Specific Feedback
**AI features discovered:** _______________

**Most helpful AI feature:** _______________

**AI intrusiveness (1-7, 1=invisible, 7=annoying):** ___/7

**Would use AI features:** Yes / No / Sometimes

### Open-Ended
**Most confusing:** _______________

**Most helpful visual:** _______________

**Missing visualization:** _______________

**One change:** _______________

**Comparison to other AI tools:** _______________

---

## What We Learn (AI-Visual Specific)

### AI Integration Metrics
- **Discoverability:** Do users find AI features?
- **Usability:** Can users trigger and use AI help?
- **Trust:** Do users trust AI suggestions?
- **Adoption:** Do users choose to use AI features?

### Visualization Effectiveness
- **Clarity:** Are visualizations understandable?
- **Usefulness:** Do they aid comprehension?
- **Performance:** Do they load/update quickly?
- **Preference:** Do users want more/less visualization?

### UI Complexity
- **Information overload:** Too many panels/features?
- **Cognitive load:** Easy to understand what's happening?
- **Learning curve:** Can users figure out the interface quickly?

---

## Success Criteria

**Good signs:**
- >70% discover and use AI features successfully
- >60% find visualizations helpful (rate 4+/5)
- Average "not overwhelming" rating >5/7
- Users say "intuitive", "helpful", "clear"
- AI suggestions are accepted >50% of the time

**Red flags:**
- Can't find AI features or visualizations
- Visualizations are confusing or ignored
- Layout feels cluttered or chaotic
- AI features are intrusive or distracting
- Users say "too much", "overwhelming", "confusing"

---

## Branch-Specific Test Scenarios

### Scenario 1: AI-Assisted Proof Writing
1. Load a proof example with incomplete parts
2. Look for AI suggestions to complete the proof
3. Observe proof state visualization
4. Accept/modify AI suggestions
5. **Evaluate:** AI suggestion quality, visualization clarity, workflow smoothness

### Scenario 2: Visual Type Exploration
1. Type a function definition
2. Observe type inference visualization
3. Hover over different parts to see type details
4. Introduce a type error and see visual feedback
5. **Evaluate:** Type visualization clarity, error visualization usefulness

### Scenario 3: Interactive Proof Tree
1. Load an inductive proof example
2. Find and open proof tree visualization
3. Try interacting with the tree (if possible)
4. Observe how it updates as code changes
5. **Evaluate:** Tree clarity, interactivity, real-time updates

### Scenario 4: AI Error Fixing
1. Create a type error deliberately
2. Look for AI-suggested fixes
3. Try applying a suggested fix
4. Observe before/after visualization
5. **Evaluate:** Fix quality, application ease, visual feedback

---

## Recruitment Email

> **Subject:** Quick 30-min study - Test AI-powered code playground UI
>
> We're testing a NEW version of our coding playground with AI assistance and visual features.
>
> **What:** Try an experimental web interface with AI and visualization tools  
> **Time:** 30 minutes  
> **Compensation:** $X [or snacks/coffee]  
> **No coding expertise required** - we're testing the interface, not you!
>
> You'll be:
> - Exploring AI-assisted coding features
> - Trying out code visualizations
> - Rating how intuitive the interface is
> - Giving feedback on what works and what doesn't
>
> **Perfect for:** Anyone interested in AI tools, visual programming, or UX design
>
> Sign up: [link]

---

## Analysis Plan

### Quantitative
**Calculate:**
- AI feature discovery rate (% who found each feature)
- Visualization usage rate (% who used visualizations)
- Average ratings for AI integration, visualizations, layout
- Success rates for each action

**Output:** 
- Feature discovery matrix
- Effectiveness ratings table
- Comparison to main branch (if available)

### Qualitative
**Categorize feedback by theme:**
- **AI integration:** Helpful / Intrusive / Invisible / Confusing
- **Visualization quality:** Clear / Cluttered / Helpful / Distracting
- **Layout concerns:** Overwhelming / Balanced / Sparse
- **Missing features:** Expected X, wanted Y

**Output:** 
- Top 5 AI/visual wins
- Top 5 AI/visual issues
- Feature priority list

### Comparative Analysis (if testing both branches)
- Which version has better success rates?
- Which version gets higher satisfaction ratings?
- Do AI/visual features justify added complexity?

---

## Quick Deliverable (3 hours after study)

### One-Page Summary

**AI-Visual Branch UI Evaluation - Pie-Slang Playground**

**Participants:** N students, [browser/device breakdown]

**AI Feature Adoption:**
- Discovered AI help: X%
- Used AI suggestions: Y%
- Accepted AI suggestions: Z%
- AI helpfulness rating: X.X/5

**Visualization Usage:**
- Found proof visualization: X%
- Found type visualization: Y%
- Used visualizations: Z%
- Visualization clarity: X.X/5

**Overall UI (1-7):**
- Layout clarity: X.X/7
- Not overwhelming: X.X/7
- AI integration: X.X/7
- Visual design: X.X/7

**Top 3 AI/Visual Wins:**
1. [Feature + user quote]
2. [Feature + user quote]
3. [Feature + user quote]

**Top 3 Issues:**
1. [Issue + frequency + severity]
2. [Issue + frequency + severity]
3. [Issue + frequency + severity]

**Comparison to Main Branch (if tested):**
- Preferred version: [ai-visual / main / mixed]
- Trade-off: [complexity vs features]

**Recommendations:**
- 🔴 Critical
- 🟡 Important
- 🟢 Enhancement
- ✨ Keep

