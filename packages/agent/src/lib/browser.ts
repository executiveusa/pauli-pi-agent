export async function verifyPageLoads(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    return res.ok;
  } catch {
    return false;
  }
}

export const BROWSER_AGENT_INSTRUCTIONS = `
When verifying UI changes:
1. Start the dev server.
2. Use Chrome DevTools MCP to navigate to the local app URL.
3. Take a screenshot.
4. Check browser console errors.
5. Check network errors.
6. Verify visible UI state.
7. Stop the dev server.
`;
