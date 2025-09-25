# AI Agent Configuration for Dryvest

## Project Overview
Dryvest is an educational investment brief builder developed by Ethical Capital. This application provides two modes for exploring investment screening approaches:

- **Quick Brief**: Schema-driven approach with pre-selected playlists
- **Custom Brief**: Identity-first builder with modular key point selection

## Specialized Agents for This Project

### Primary Development Agents

#### **`tailwind-frontend-expert`**
- **Usage**: UI/UX development, component styling, responsive design
- **Triggers**: Frontend components, Tailwind CSS styling, responsive layouts
- **Context**: Handles all UI components in `/src/components/` with Ethical Capital brand integration

#### **`django-backend-expert`**
- **Usage**: Not applicable (this is a frontend-only React application)
- **Alternative**: Use `tailwind-frontend-expert` for React components

#### **`documentation-specialist`**
- **Usage**: README updates, API documentation, user guides
- **Triggers**: Documentation requests, onboarding materials
- **Context**: Maintains educational focus and Ethical Capital branding

### Brand & Design Agents

#### **`ethical-capital-context-provider`**
- **Usage**: Ensuring brand compliance, investment philosophy alignment
- **Triggers**: Brand guidelines, ethical screening content, compliance
- **Context**: Maintains Ethical Capital brand identity and educational purpose

#### **`prompt-engineer`**
- **Usage**: Optimizing educational content, user guidance prompts
- **Triggers**: Educational disclaimers, user instructions, clarification prompts
- **Context**: Ensures educational-only messaging throughout application

### Quality & Deployment Agents

#### **`code-quality-analyst`**
- **Usage**: React/TypeScript code review, component architecture
- **Triggers**: Code reviews, refactoring, best practices
- **Context**: Focuses on React patterns, TypeScript safety, accessibility

#### **`performance-optimizer`**
- **Usage**: Build optimization, bundle size, loading performance
- **Triggers**: Slow builds, large bundles, performance issues
- **Context**: Vite build optimization, Cloudflare Pages deployment

#### **`deployment-sentinel`**
- **Usage**: Cloudflare Pages deployment monitoring
- **Triggers**: Deployment processes, environment variable setup
- **Context**: Handles Cloudflare Functions, Wrangler CLI operations

### Security & Compliance Agents

#### **`security-auditor`**
- **Usage**: Frontend security, data handling, API security
- **Triggers**: Security reviews, vulnerability assessments
- **Context**: Educational data handling, PDF generation security

#### **`financial-compliance-specialist`**
- **Usage**: Educational disclaimers, regulatory compliance
- **Triggers**: Investment-related content, educational disclaimers
- **Context**: Ensures all content maintains "educational purposes only" framing

## Project-Specific Routing Rules

### Technology Stack Detection
- **React + TypeScript + Tailwind**: → `tailwind-frontend-expert`
- **Vite Build Issues**: → `performance-optimizer`
- **Cloudflare Deployment**: → `deployment-sentinel`

### Content Type Routing
- **Brand Guidelines**: → `ethical-capital-context-provider`
- **Educational Content**: → `prompt-engineer`
- **Component Development**: → `tailwind-frontend-expert`
- **Security Reviews**: → `security-auditor`

### File Pattern Routing
- `src/components/*.tsx` → `tailwind-frontend-expert`
- `src/lib/exporters.ts` → `code-quality-analyst`
- `functions/api/*.ts` → `security-auditor`
- Brand-related updates → `ethical-capital-context-provider`

## Brand Integration Requirements

### Design System
- **Colors**: ECIC Purple (#581c87), ECIC Teal (#14b8a6)
- **Typography**: Outfit (headings), Raleway (body)
- **Components**: Consistent purple focus states, brand gradients

### Educational Compliance
- All content must include educational disclaimers
- "For educational purposes only" messaging required
- Palestine solidarity statement in header
- Clear attribution to Ethical Capital

### User Experience
- Senior-friendly design (larger buttons, clear text)
- Dual-mode approach (Quick vs Custom)
- Modular content selection in Custom mode
- Clear call-to-action for clarification questions

## Key Integration Points

1. **Brand Colors**: CSS custom properties in `src/App.css`
2. **Typography**: Google Fonts integration in `index.html`
3. **Components**: Consistent `font-heading` class usage
4. **Educational Focus**: Disclaimers in headers and export flows
5. **Accessibility**: Focus states, contrast ratios, semantic HTML

This configuration ensures all AI agents maintain the educational mission and Ethical Capital brand identity while building high-quality, accessible investment screening tools.