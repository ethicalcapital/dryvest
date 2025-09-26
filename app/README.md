# Dryvest v.0.0.1

**A Decoder Ring for the World of Finance**

For activists who need to speak finance. Dryvest decodes how institutional investors actually work, what they care about, and how to translate your demands into their language.

## 🌟 Features

### 📋 **Interactive Brief Builder**
- **Context-Aware Content**: Select your identity (individual, endowment, pension, etc.) and venue to get tailored content
- **Smart Filtering**: Content automatically adjusts based on audience (board members, investment committee, etc.) and experience level
- **Progressive Disclosure**: Start with key points, expand to see detailed counters, policy alignment, and implementation steps

### 🎯 **Three Engagement Modes**

#### 1. **Quick Builder** - Pre-configured Content Packages
- Select from curated playlists optimized for different institutional contexts
- Instant briefs with opener, key points, counters, and next steps
- Perfect for time-sensitive presentations

#### 2. **Custom Builder** - Granular Control
- Mix and match from 350+ content nodes
- Custom key point selection with citation tracking
- Build specialized briefs for unique situations

#### 3. **Entity Comparison** - Educational Analysis
- Side-by-side comparison of how content differs across institutional types
- Understanding stakeholder priorities, withdrawal rates, and decision-making contexts
- Institutional literacy flashcards and assessment frameworks

### 🏛️ **Institutional Intelligence**
- **Deep Context Cards**: Understand the unique pressures facing endowments vs. pensions vs. sovereign wealth funds
- **Stakeholder Mapping**: Know who really makes decisions and what they care about
- **Risk Assessment**: "Taking You Literally vs Seriously" framework for evaluating engagement strategies

### 📊 **Content Management**
- **Versioned Dataset**: All content is version-controlled and citable
- **Citation Tracking**: Every claim links to primary sources
- **GitHub Integration**: Suggest edits and improvements directly from the interface
- **Structured Metadata**: Front matter for completion tracking and audience targeting

### 📄 **Export & Sharing**
- **Multiple Formats**: Markdown, PDF (via Cloudflare Workers)
- **Professional Templates**: Ready for board presentations
- **One-Pager Library**: Quick reference documents for specific topics
- **Mobile-Responsive**: Works on all devices

### 🔍 **Quality Assurance**
- **Accessibility Testing**: PA11Y, Axe-core, and Lighthouse CI integration
- **WCAG 2.1 AA Compliance**: Proper color contrast and keyboard navigation
- **Comprehensive Linting**: ESLint with accessibility rules, Prettier formatting
- **TypeScript**: Full type safety throughout the application

## 🎨 **Design System**
- **Ethical Capital Branding**: Official ECIC purple and teal color scheme
- **Professional Typography**: Outfit (headings) and Raleway (body) fonts
- **Responsive Layout**: Optimized for desktop, tablet, and mobile
- **Palestine Solidarity**: Prominent statement of values

## ⚡ **Technical Stack**
- **React 19** with TypeScript for type safety
- **Vite** for fast development and building
- **Tailwind CSS** with custom design system
- **Zod** for runtime schema validation
- **Cloudflare Pages** deployment with Functions for PDF generation

## 🧠 **Why This Matters**
> "When activists don't speak finance, institutional investors dismiss them as naive. When institutions don't explain their constraints, activists assume they're just greedy."

**Dryvest decodes the finance world for activists:**
- **Understand the players**: Why pension trustees think differently than endowment boards
- **Learn the language**: Fiduciary duty, risk management, asset allocation - what do they actually mean?
- **Crack the code**: How to frame divestment demands so they land with institutional decision-makers
- **Know the pressure points**: What really motivates different types of investors

## 🚧 **Development Status**
- **Current Version**: v.0.0.1 (Beta)
- **Status**: Educational prototype in active development
- **Purpose**: Learning and research tool - not investment advice
- **Feedback**: [GitHub Issues](https://github.com/ethicalcapital/dryvest/issues) for suggestions and improvements

## 🛠️ **Development**

### Getting Started
```bash
npm install
npm run dev
```

### Quality Checks
```bash
npm run check-all      # TypeScript, linting, formatting
npm run test:a11y      # Accessibility testing
npm run a11y:lighthouse # Comprehensive audit
```

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - ESLint with accessibility rules
- `npm run format` - Prettier formatting
- `npm run type-check` - TypeScript compilation check

## 📚 **Content Architecture**
- **350+ Content Nodes**: Key points, counters, policy statements, guides
- **Structured Targeting**: Content tagged by identity, venue, audience, and level
- **Citation Network**: Every claim supported by primary sources
- **Version Control**: Git-based content management with edit suggestions

## 🎯 **Use Cases**
1. **Campaign Preparation**: Understand your target institution before making demands
2. **Shareholder Proposals**: Frame proposals in language that resonates with fiduciaries
3. **Activist Training**: Teach organizers how institutional investors actually work
4. **Media Strategy**: Explain complex institutional dynamics to journalists
5. **Coalition Building**: Help diverse groups understand shared financial interests

---

**Built by [Ethical Capital](https://ethicic.com) • Educational Tool • Not Investment Advice**