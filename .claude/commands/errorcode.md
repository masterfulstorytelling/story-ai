---
description: MANDATORY error investigation process - forces systematic root cause analysis before any fixes
---

## User Input

```text
$ARGUMENTS
```

**MANDATORY PROCESS ACTIVATED**: Error investigation checklist must be completed before any fixes.

## Critical Rule

**DO NOT MAKE ANY CHANGES UNTIL ALL STEPS IN `.cursor/rules/error-investigation.mdc` ARE COMPLETE.**

## AI Bias Acknowledgment

**You have these tendencies - you MUST actively fight them:**

1. **Grab easy solutions**: You will see the first issue and want to fix it immediately. **STOP. Investigate deeper.**
2. **Overly complex solutions**: You will create elaborate fixes when simple ones exist. **STOP. Look for the simplest solution that addresses root cause.**
3. **Quick fixes over root causes**: You will want to add timeouts, delays, workarounds. **STOP. These are prohibited. Find the real problem.**

## Mandatory Checklist Execution

You MUST complete ALL steps in `.cursor/rules/error-investigation.mdc`:

### Step 1: Read Error Logs Carefully
- [ ] What exactly is failing? (specific error message, line number, test name)
- [ ] What is the failure type? (timeout, assertion failure, exception, etc.)
- [ ] Are there patterns? (multiple similar failures, specific conditions)
- [ ] What is the execution context? (browser, environment, timing)

**Document findings**: Write down what you found in each sub-step.

### Step 2: Trace Execution Path
- [ ] Where does the code get stuck? (specific function, line, condition)
- [ ] What is the call stack? (what calls what, in what order)
- [ ] What conditions must be met for success? (what should be true/false)
- [ ] What prevents those conditions? (why aren't they met)

**Document findings**: Write down the execution path, conditions, and what prevents success.

### Step 3: Ask "Why" (Not "What")
- [ ] Why would this condition fail? (not "what fails" but "why does it fail")
- [ ] Why would this code path be taken? (what triggers it)
- [ ] Why would this timing occur? (race condition, async issue)
- [ ] Why would this state exist? (how did it get here)

**Document findings**: Write down the "why" for each issue, not just the "what".

### Step 4: Investigate Recent Changes
- [ ] What changed recently? (review git history)
- [ ] What was the last successful commit?
- [ ] What changed between success and failure?
- [ ] Could MY recent changes have caused this?

**Document findings**: Write down recent changes and how they might relate.

### Step 5: Recognize Bias and Force Deep Investigation
- [ ] Am I jumping to the first issue I see?
- [ ] Have I looked systematically and thoroughly?
- [ ] Am I treating symptoms or root causes?
- [ ] Am I creating unnecessary complexity?

**Document findings**: Write down your bias checks and how you're avoiding them.

### Step 6: Propose Fix (ONLY AFTER ALL ABOVE)
- [ ] What is the root cause? (not symptom, but actual root cause)
- [ ] How does this fix address the root cause?
- [ ] What evidence supports this hypothesis?
- [ ] What are alternative explanations?

**Document findings**: Write down root cause, fix rationale, evidence, and alternatives.

## Prohibited Actions

**These are NEVER allowed:**
- ❌ Adding timeouts, delays, or `waitForTimeout` to "fix" timing issues **WITHOUT investigating root cause**
- ❌ Increasing timeouts because tests are timing out **due to bugs** (without fixing the bug)
- ❌ Adding `Promise.race` with timeout promises **to mask bugs**
- ❌ Adding workarounds to mask symptoms **instead of investigating root causes**
- ❌ Skipping investigation steps
- ❌ Making changes before completing all steps

**Important Distinction:**
- ✅ **LEGITIMATE**: After root cause investigation, if an operation legitimately takes time (e.g., network request, file operation), setting an appropriate timeout is fine
- ✅ **LEGITIMATE**: Using Playwright's built-in wait strategies (`waitForLoadState`, `waitForFunction`) for operations that SHOULD complete
- ❌ **PROHIBITED**: Adding timeouts to mask bugs or avoid investigating why something is slow/hanging
- ❌ **PROHIBITED**: Increasing timeouts because tests fail due to bugs, without fixing the underlying bug

**Key Question**: "Am I setting a timeout because this operation legitimately takes time, or because there's a bug causing it to take too long and I'm masking it?"

## Execution

1. **Acknowledge**: State that you're following the mandatory error investigation process
2. **Load**: Read `.cursor/rules/error-investigation.mdc` for full checklist details
3. **Execute**: Complete ALL 6 steps systematically, documenting findings at each step
4. **Verify**: Before proposing any fix, verify all steps are complete
5. **Propose**: Only then propose a fix that addresses the root cause

## Output Format

For each step, output:
```
### Step X: [Step Name]

**Findings:**
- Finding 1: [description]
- Finding 2: [description]
...

**Documentation:** [What you documented]
```

**DO NOT PROCEED TO NEXT STEP UNTIL CURRENT STEP IS COMPLETE AND DOCUMENTED.**

