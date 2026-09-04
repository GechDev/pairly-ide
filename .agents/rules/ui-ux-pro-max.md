---
description: "Mandatory UI/UX Standards and Anti-AI-Slop Rules for Frontend Development"
trigger: always_on
---

# UI/UX Pro Max Rules & Standards

## Mandatory UI/UX Standards
1. Consult UI/UX Pro Max first via `.agents/skills/ui-ux-pro-max/scripts/search.py`.
2. Define a coherent visual identity suited to Pairly: Technical Dark Mode (OLED), high-contrast Slate/Zinc, Emerald/Cyan accents, crisp borders.
3. Prioritize visual hierarchy: Make navigation, primary call-to-actions, code editors, and presence indicators immediately obvious.
4. Professional typography: Inter for UI sans, JetBrains Mono / monospace for code and gutters.
5. Consistent design tokens: Rely on Tailwind design tokens, avoid random arbitrary pixel paddings.
6. Responsive design: Full responsiveness across 375px (mobile), 768px (tablet), 1024px (laptop), and 1440px (desktop).
7. Real functionality & feedback: All interactive elements must have genuine click/keyboard actions with feedback.
8. Complete interactive states: Loading, disabled, active, hover (150-250ms smooth transition), and accessible focus rings.
9. No generic AI slop:
   - NO emojis as icons (use Lucide SVG icons).
   - NO gratuitous glowing purple gradients or blurry background blobs.
   - NO nonfunctional dummy controls or fake placeholder stats.
   - Clean, functional, developer-grade tools designed for real programming workflows.
