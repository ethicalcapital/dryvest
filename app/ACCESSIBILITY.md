# Accessibility Testing Guide

## Overview

This project includes comprehensive accessibility testing tools to ensure WCAG 2.1 AA compliance and provide an inclusive user experience.

## Tools Installed

### 1. **ESLint JSX A11y Plugin**
- **Purpose**: Catch accessibility issues during development
- **Usage**: Runs automatically with `npm run lint`
- **Rules**: WCAG 2.1 AA compliance rules

### 2. **PA11Y** - Automated Command Line Tool
- **Purpose**: Test against WCAG 2.1 AA standards
- **Usage**: `npm run a11y:pa11y`
- **Features**:
  - Tests live running application
  - Provides specific element selectors
  - Gives actionable remediation advice

### 3. **Axe-Core CLI** - Industry Standard Accessibility Engine
- **Purpose**: Comprehensive accessibility auditing
- **Usage**: `npm run a11y:axe`
- **Features**:
  - Used by major accessibility testing tools
  - Detailed violation reports with links to documentation
  - Tests 20-50% of all accessibility issues automatically

### 4. **Lighthouse CI** - Performance & Accessibility Auditing
- **Purpose**: Comprehensive site quality including accessibility
- **Usage**: `npm run a11y:lighthouse`
- **Features**:
  - Accessibility score with detailed breakdown
  - Performance impact analysis
  - SEO and best practices auditing

## Available Commands

```bash
# Individual tools
npm run a11y:pa11y        # PA11Y accessibility audit
npm run a11y:axe          # Axe-core accessibility audit
npm run a11y:lighthouse   # Lighthouse comprehensive audit

# Combined testing
npm run a11y:all          # Run PA11Y + Axe together
npm run test:a11y         # Alias for a11y:all

# Development workflow
npm run lint              # Includes accessibility linting
npm run check-all         # All quality checks including a11y linting
```

## Current Issues Found

### Color Contrast Issues ⚠️
1. **ECIC Teal Logo** - Contrast ratio 2.49:1 (needs 4.5:1)
   - **Location**: Header logo "E" on teal background
   - **Fix**: Use darker teal (#008577) or add border/shadow

2. **ECIC Teal CTA Button** - Contrast ratio 2.49:1 (needs 4.5:1)
   - **Location**: Header "Book Consultation" button
   - **Fix**: Use darker teal background

3. **Amber CTA Button** - Contrast ratio 3.19:1 (needs 4.5:1)
   - **Location**: Main content amber consultation button
   - **Fix**: Use darker amber (#b46100)

### Structural Issues 🏗️
1. **Non-unique Landmarks**
   - Multiple sections without unique labels
   - **Fix**: Add `aria-label` or use different landmark types

2. **Content Outside Landmarks**
   - Some content not wrapped in semantic landmarks
   - **Fix**: Wrap content in `<main>`, `<section>`, or `<aside>`

## Accessibility Development Workflow

### 1. Development Phase
- ESLint catches basic accessibility issues as you code
- Fix accessibility warnings before committing

### 2. Testing Phase
```bash
# Quick accessibility check
npm run a11y:all

# Comprehensive audit
npm run a11y:lighthouse
```

### 3. Before Deployment
```bash
# Full quality check including accessibility
npm run check-all && npm run test:a11y
```

## Manual Testing Checklist

While automated tools catch 20-50% of accessibility issues, manual testing is essential:

- [ ] **Keyboard Navigation**: Tab through entire interface
- [ ] **Screen Reader**: Test with NVDA/JAWS/VoiceOver
- [ ] **Focus Management**: Ensure visible focus indicators
- [ ] **Alt Text**: Verify meaningful image descriptions
- [ ] **Form Labels**: All inputs properly labeled
- [ ] **Heading Structure**: Logical H1-H6 hierarchy
- [ ] **Color Dependence**: Information not conveyed by color alone
- [ ] **Zoom Testing**: Usable at 200% zoom level

## Configuration Files

- **`.pa11yrc`** - PA11Y configuration with WCAG2AA standard
- **`lighthouserc.js`** - Lighthouse CI thresholds (90% accessibility target)
- **`eslint.config.js`** - Includes jsx-a11y recommended rules

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Axe Rules Documentation](https://dequeuniversity.com/rules/axe/)
- [PA11Y Documentation](https://pa11y.org/)
- [WebAIM Color Contrast Checker](https://webaim.org/resources/contrastchecker/)

## Notes

- **Automated testing is not sufficient** - Manual testing required
- **Focus on user impact** - Fix high-impact issues first
- **Test with real users** - Include users with disabilities in testing
- **Continuous monitoring** - Run accessibility tests regularly