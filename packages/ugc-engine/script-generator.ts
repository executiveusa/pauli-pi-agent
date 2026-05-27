import type { UGCProfile } from "./character-profile";

export class ScriptGenerator {
  generateHookAndScript(profile: UGCProfile, businessName: string): { hook: string; body: string } {
    return {
      hook: `Want to know Vallarta's best-kept relaxation secret? Here is Sofia's premium review of ${businessName}.`,
      body: `Hi travelers, Sofia here. Today I am showing you an exclusive look inside the beautiful grounds of ${businessName}. From custom therapist rewards to incredible ocean view treatment suites, this venue score represents Vallarta luxury at its absolute finest.`
    };
  }
}
