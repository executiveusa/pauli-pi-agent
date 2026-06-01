# ArchonX Mercury Voice Agent — Activation Checklist

## Pre-Activation

- [ ] INCEPTION_API_KEY is set in server environment (never client-side)
- [ ] MERCURY_MODEL=mercury-2
- [ ] MERCURY_BASE_URL=https://api.inceptionlabs.ai/v1
- [ ] ARCHONX_TENANT_CONFIG_MODE=local (for dev) or remote (for production)
- [ ] ARCHONX_DEFAULT_TENANT_ID=client_demo

## Mode Verification

### Clean Mode
- [ ] Text chat renders correctly
- [ ] No VoiceOrb visible
- [ ] No diffusion bubble visible
- [ ] No tool dock visible
- [ ] Existing chat artifacts still work

### Voice Mode
- [ ] VoiceOrb renders in footer
- [ ] Push-to-talk button activates listening state
- [ ] TTS output fires via stability gate only
- [ ] Interruption (new speech) cancels current TTS and clears queue
- [ ] Keyboard/text input still works as fallback

### Mercury Diffusion Mode
- [ ] Mercury diffusion bubble appears above input
- [ ] Text replaces in-place (not appended like typewriter)
- [ ] Content locks visually at stream completion (state=final)
- [ ] Noise/scanline overlay visible during diffusing state
- [ ] TTS NEVER speaks raw diffusion fragments
- [ ] Tool dock visible with permitted tools only
- [ ] Asset panel visible when assets are present
- [ ] Usage meter shows client-safe data only

## Security Checks

- [ ] INCEPTION_API_KEY does NOT appear in browser network requests
- [ ] INCEPTION_API_KEY does NOT appear in any client-rendered HTML/JS
- [ ] Tool calls are rejected if tenant permission is not set
- [ ] Money movement tools require explicit approval
- [ ] Internal logs do not render to end users

## Disabling the Skill

To disable without deleting: set `ARCHONX_TENANT_CONFIG_MODE=disabled` and
handle `getActiveTenant()` to throw/redirect. All tenant-gated routes will
return appropriate errors.

## Adding a New Client

1. Create `.agents/tenants/<client_id>.json` using the schema in `tenant.schema.json`
2. Set `INCEPTION_API_KEY=<client_key>` in the client's environment
3. Set `ARCHONX_DEFAULT_TENANT_ID=<client_id>`
4. Restart the agent
5. Verify with the activation checklist above
