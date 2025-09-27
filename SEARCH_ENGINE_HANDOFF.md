# Search Engine Handoff: Content Verification Task

## What You Need to Do

**Goal**: Check if our user-facing content matches what's actually in our source documents.

**Input**: You'll get content that we show to users on the platform.

**Output**: Tell us if it's accurate, wrong, or missing important details.

## Simple Verification Process

1. **Search your corpus** for documents related to the content
2. **Compare what we say** vs. what the documents actually say
3. **Flag any problems**:
   - Wrong facts
   - Missing context
   - Outdated information
   - Made-up claims

## Content Types You'll See

- **Assessment questions** ("What is the policy regarding exclusion for companies...")
- **Strategic guidance** ("Lead with these points to translate your demand...")
- **Opening angles** ("Start by establishing...")
- **Policy statements** ("We employ binary, non-negotiable exclusionary screens...")
- **Implementation steps** ("Divest gradually over several months...")

## What to Return

For each piece of content:

```
CONTENT: [the text we're checking]
STATUS: ✅ ACCURATE | ⚠️ NEEDS REVIEW | ❌ INCORRECT
SOURCES: [documents that support/contradict this]
ISSUES: [specific problems if any]
SUGGESTED FIX: [what to change if needed]
```

## Critical: Avoid False Certainty

**NEVER claim certainty when you're not certain.**

- If you can't find sources → **SAY SO**
- If sources are ambiguous → **SAY SO**
- If you're only partially confident → **SAY SO**
- If papers contradict each other → **SAY SO**

**Better to say "I'm not sure" than to be wrong.**

## Keep It Simple

- Don't overthink it
- Be honest about confidence levels
- If something seems off, flag it
- If it's definitely good, say it's good
- **When in doubt, express doubt**

**Remember**: We show this stuff to real people making real decisions. False certainty is worse than no answer.

## Corpus Context

Your documents contain thousands of words from academic papers, policy documents, and research. Use that knowledge to fact-check what we're telling users.

**Start Here**: Look for content in `/src/components/` and `/public/data/` that gets shown to end users.