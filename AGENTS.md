# AGENTS.md — Development Rules, Guidelines & UI/UX Standards

This document establishes non-negotiable engineering rules, conventions, and design standards for all agentic and human developers working on Pairly.

---

## 1. Non-Negotiable Engineering Rules

1. **Shared Logic & Types First**:
   - Shared business logic, DTOs, interfaces, and contracts belong in `packages/contracts`.
   - Never duplicate contract schemas across applications.
2. **Strict Type Contracts**:
   - All WebSocket events, REST payloads, and state schemas must be validated via Zod schemas in `@pairly/contracts`.
3. **No Fallow Dependencies**:
   - Every dependency added to `package.json` must be actively used in the corresponding module.
4. **Enforce Server-Side Authorization**:
   - Always enforce RBAC guards on the server/coordinator. Never trust client-asserted permissions alone.
5. **Phase & Task Gates**:
   - Every completed task must pass typechecking (`tsc --noEmit`), linting, and automated unit/integration tests before committing.

---

## 2. Mandatory UI/UX Standards (UI/UX Pro Max)

Whenever building, redesigning, or modifying any frontend interface:

1. **Consult UI/UX Pro Max first**:
   - Apply its design intelligence via `.agents/skills/ui-ux-pro-max/scripts/search.py` before writing frontend UI code.
   - Run: `python .agents/skills/ui-ux-pro-max/scripts/search.py "<query>" --design-system -p "Pairly"`
2. **Define a coherent visual identity**:
   - Select typography, colors, spacing, borders, radii, shadows, iconography, and interaction patterns suited to an elite developer IDE.
   - Design system profile: High-contrast Dark Mode (OLED), Slate palette (`#0F172A`, `#020617`), Emerald accent (`#10B981`), Brand Indigo/Cyan highlights (`#3B82F6` / `#06B6D4`).
3. **Prioritize visual hierarchy**:
   - Make navigation, editor viewports, primary run actions, presence indicators, and supporting file trees immediately readable and scannable.
4. **Use professional typography**:
   - Clean, technical monospace and sans-serif pairings (Inter + JetBrains Mono / Monospace). Consistent weights, readable line heights, and deliberate sizing scales.
5. **Maintain precise consistency**:
   - Use reusable components, design tokens, and predictable spacing rather than ad-hoc inline styles.
6. **Design responsively**:
   - Ensure interfaces work seamlessly across desktop (1440px), laptop (1024px), tablet (768px), and mobile (375px).
7. **Implement real functionality**:
   - Buttons, modals, file trees, tabs, copy links, and run controls must behave with genuine feedback and state handling.
8. **Include complete states**:
   - Handle loading, empty, error, success, disabled, active, hover, and keyboard-focus states wherever relevant.
9. **Respect the existing architecture**:
   - Use Next.js 14 App Router, Tailwind CSS, Lucide icons, and Yjs CRDT bindings without adding superfluous UI frameworks.
10. **Test the rendered result**:
    - Inspect actual rendered UI at multiple viewport sizes, test interactive states, and eliminate visual/functional defects.

---

## 3. Anti-AI-Slop Rules

Never settle for generic, repetitive, template-like AI interfaces.

### Avoid:
- Unnecessary purple-blue gradients and glowing backgrounds.
- Excessive glassmorphism, blur, decorative floating blobs, and neon effects.
- Turning every content section into an identical rounded card.
- Arbitrary font sizes, inconsistent spacing, and excessive whitespace.
- Emojis as interface icons (always use Lucide/SVG icons).
- Unnecessary animations and decorative elements without a functional purpose.
- Repetitive generic SaaS layouts that could belong to any product.
- Fake metrics, placeholder copy, dead buttons, and nonfunctional controls.
- Overcomplicated layouts that sacrifice IDE usability for visual effects.

**Core Design Principle:** Every visual element must have a functional reason to exist. Favor clarity, restraint, strong typography, deliberate composition, useful interactions, and distinctive product identity.
