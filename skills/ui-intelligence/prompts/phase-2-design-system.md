# Phase 2 — Design System Extraction Prompt

Use this prompt when extracting design tokens from a live page.

---

You are extracting a complete design system from a web application. Your output must be a valid JSON file called `design-system.json`.

For every value you extract, use the computed style from the browser — not guesses.

Structure your output exactly as follows:

```json
{
  "source": {
    "url": "",
    "extracted_at": "",
    "page": "home"
  },
  "colors": {
    "primary": "",
    "secondary": "",
    "background": {
      "page": "",
      "card": "",
      "input": "",
      "overlay": ""
    },
    "text": {
      "default": "",
      "muted": "",
      "disabled": "",
      "inverse": "",
      "link": ""
    },
    "border": {
      "default": "",
      "focus": "",
      "error": ""
    },
    "status": {
      "error": "",
      "success": "",
      "warning": "",
      "info": ""
    }
  },
  "typography": {
    "fonts": {
      "heading": "",
      "body": "",
      "mono": ""
    },
    "sizes": {
      "h1": "",
      "h2": "",
      "h3": "",
      "h4": "",
      "body": "",
      "small": "",
      "label": "",
      "caption": ""
    },
    "weights": {
      "regular": 400,
      "medium": 500,
      "semibold": 600,
      "bold": 700
    },
    "lineHeights": {
      "tight": "",
      "normal": "",
      "relaxed": ""
    },
    "letterSpacing": {
      "tight": "",
      "normal": "",
      "wide": ""
    }
  },
  "spacing": {
    "base": "4px",
    "scale": {
      "0": "0px",
      "1": "4px",
      "2": "8px",
      "3": "12px",
      "4": "16px",
      "5": "20px",
      "6": "24px",
      "8": "32px",
      "10": "40px",
      "12": "48px",
      "16": "64px",
      "20": "80px",
      "24": "96px"
    }
  },
  "radii": {
    "none": "0px",
    "sm": "",
    "md": "",
    "lg": "",
    "xl": "",
    "full": "9999px"
  },
  "shadows": {
    "sm": "",
    "md": "",
    "lg": "",
    "xl": ""
  },
  "components": {
    "button": {
      "primary": {
        "background": "",
        "text": "",
        "border": "",
        "borderRadius": "",
        "paddingX": "",
        "paddingY": "",
        "height": "",
        "fontSize": "",
        "fontWeight": "",
        "hover": {
          "background": "",
          "transitionDuration": ""
        },
        "active": {
          "background": ""
        },
        "disabled": {
          "background": "",
          "text": "",
          "opacity": ""
        },
        "loading": {
          "spinnerColor": "",
          "textVisible": true
        }
      },
      "secondary": {},
      "ghost": {},
      "destructive": {}
    },
    "input": {
      "background": "",
      "text": "",
      "placeholder": "",
      "border": "",
      "borderRadius": "",
      "padding": "",
      "height": "",
      "fontSize": "",
      "focus": {
        "border": "",
        "shadow": ""
      },
      "error": {
        "border": "",
        "text": "",
        "messagePosition": "below"
      }
    },
    "card": {
      "background": "",
      "border": "",
      "borderRadius": "",
      "shadow": "",
      "padding": ""
    },
    "badge": {
      "borderRadius": "",
      "paddingX": "",
      "paddingY": "",
      "fontSize": "",
      "fontWeight": ""
    },
    "modal": {
      "backdropColor": "",
      "backdropOpacity": "",
      "background": "",
      "borderRadius": "",
      "shadow": "",
      "padding": ""
    }
  }
}
```

If a value cannot be determined, use `null`. Do not guess. Document every null with a note.
