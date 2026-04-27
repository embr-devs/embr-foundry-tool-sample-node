/**
 * Tool implementations shared by the OpenAPI (skill) routes and the MCP server.
 * Same code path runs regardless of which Foundry surface invokes it.
 */

const CONDITIONS = ['sunny', 'cloudy', 'rainy', 'windy', 'snowy'];

export function getWeather(location) {
  return {
    location,
    condition: CONDITIONS[Math.floor(Math.random() * CONDITIONS.length)],
    temperature_c: Math.floor(Math.random() * 41) - 5, // -5..35 inclusive
  };
}

export function getTime(timezone = 'UTC') {
  let formatter;
  try {
    formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric', month: 'long', day: '2-digit',
      weekday: 'long',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: false,
    });
  } catch (err) {
    throw new RangeError(`Unknown timezone: '${timezone}'`);
  }
  const now = new Date();
  // Build an ISO-ish string with the target zone's offset by computing the
  // shift between the formatted time and UTC.
  const zoneNow = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
  const offsetMs = zoneNow.getTime() - new Date(now.toLocaleString('en-US', { timeZone: 'UTC' })).getTime();
  const sign = offsetMs >= 0 ? '+' : '-';
  const absMin = Math.abs(offsetMs / 60000);
  const hh = String(Math.floor(absMin / 60)).padStart(2, '0');
  const mm = String(Math.floor(absMin % 60)).padStart(2, '0');
  const isoLocal = new Date(now.getTime() + offsetMs).toISOString().replace('Z', `${sign}${hh}:${mm}`);

  return {
    timezone,
    iso: isoLocal,
    pretty: formatter.format(now),
  };
}
