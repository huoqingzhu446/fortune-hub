export function trackEvent(
  eventName: string,
  payload: Record<string, unknown> = {},
) {
  if (!eventName) {
    return;
  }

  try {
    console.info('[analytics]', eventName, payload);
  } catch {
    // Analytics must never block the primary home-page interaction.
  }
}
