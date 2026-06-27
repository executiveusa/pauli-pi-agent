# Phase 6 — React Component Generation Prompt

Use this prompt when generating components from a captured design system.

---

You are generating a pixel-accurate TypeScript React component library from a design system JSON file.

Rules:
1. Every color value must come from `design-system.json`. No hardcoded hex values without a source comment.
2. Every spacing value must use the spacing scale from `design-system.json`.
3. Every transition timing must match what was documented in `microinteractions.md`.
4. Every component must support all states observed in the live app.
5. Props must be fully typed with TypeScript interfaces.
6. Each style value gets a one-line comment: `// design-system: [path]`

## Component Template

```tsx
import React from 'react';

// Source: design-system.json > components.button.primary
const BUTTON_STYLES = {
  primary: {
    background: '#000000', // design-system: components.button.primary.background
    color: '#ffffff',      // design-system: colors.text.inverse
    borderRadius: '6px',   // design-system: components.button.primary.borderRadius
    paddingX: '16px',      // design-system: components.button.primary.paddingX
    paddingY: '8px',       // design-system: components.button.primary.paddingY
    fontSize: '14px',      // design-system: typography.sizes.body
    fontWeight: 600,        // design-system: typography.weights.semibold
    transition: 'background 150ms ease', // microinteractions: button.hover.transitionDuration
  },
};

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  children,
}) => {
  // implementation
};
```

## Required Components

Generate each of the following. If a component was not observed in the live app, note that and generate a reasonable implementation using the design system tokens.

1. `Button` — variants: primary, secondary, ghost, destructive; sizes: sm, md, lg; states: default, hover, active, disabled, loading
2. `Input` — types: text, password, search; states: default, focus, error, disabled; with label, placeholder, helper text, error message
3. `Card` — variants: default, bordered, elevated; with optional header, body, footer
4. `Modal` — with backdrop, close button, title, body, footer; entry/exit animations
5. `Toast` — variants: default, success, error, warning; with auto-dismiss and manual dismiss
6. `Dropdown` — with trigger, option list, selected state, disabled state
7. `Tabs` — with active indicator, hover state, content panel
8. `Navigation` — with active page indicator, hover state, mobile collapse
9. `Badge` — variants: default, primary, success, error, warning; sizes: sm, md
10. `Spinner` — sizes: sm, md, lg; colors from design system
11. `Checkbox` — states: unchecked, checked, indeterminate, disabled; with label
12. `Link` — variants: default, muted, destructive; with hover underline and color transitions

## index.ts Template

```ts
export { Button } from './Button';
export { Input } from './Input';
export { Card } from './Card';
export { Modal } from './Modal';
export { Toast } from './Toast';
export { Dropdown } from './Dropdown';
export { Tabs } from './Tabs';
export { Navigation } from './Navigation';
export { Badge } from './Badge';
export { Spinner } from './Spinner';
export { Checkbox } from './Checkbox';
export { Link } from './Link';
```
