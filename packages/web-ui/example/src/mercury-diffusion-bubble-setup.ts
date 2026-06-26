/**
 * Side-effect import: registers <mercury-diffusion-bubble> as a custom element.
 *
 * The component lives in the pi-web-ui package and is re-exported from its
 * main entry. Importing it once ensures `customElements.define` runs and the
 * element is available in the page.
 */
import { MercuryDiffusionBubble } from "@mariozechner/pi-web-ui";

// Reference the class so the import isn't tree-shaken (it registers itself
// via @customElement decorator on definition).
void MercuryDiffusionBubble;

// Safety net: if the package build didn't register the element, define a
// minimal inline fallback so the renderer never throws.
if (!customElements.get("mercury-diffusion-bubble")) {
	customElements.define(
		"mercury-diffusion-bubble",
		class extends HTMLElement {
			static get observedAttributes() {
				return ["state"];
			}
			_text = "";
			_state = "idle";
			set text(v: string) {
				this._text = v;
				this._render();
			}
			set state(v: string) {
				this._state = v;
				this._render();
			}
			connectedCallback() {
				this._render();
			}
			attributeChangedCallback() {
				this._render();
			}
			_render() {
				const glow =
					this._state === "diffusing"
						? "box-shadow: 0 0 20px rgba(103,247,200,0.15); border-color: rgba(103,247,200,0.4);"
						: this._state === "final"
							? "border-color: rgba(103,247,200,0.12);"
							: "";
				this.innerHTML = `<div style="background: rgba(11,15,20,0.8); border: 1px solid rgba(103,247,200,0.15); border-radius: 12px; padding: 16px 20px; backdrop-filter: blur(8px); transition: all 0.3s ease; ${glow} white-space: pre-wrap; font-family: inherit;">${this._text || ""}</div>`;
			}
		},
	);
}
