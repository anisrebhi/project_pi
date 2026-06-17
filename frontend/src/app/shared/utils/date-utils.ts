/**
 * Converts an ISO date string (as returned by the API) into the
 * `YYYY-MM-DDTHH:mm` format expected by `<input type="datetime-local">`,
 * expressed in the user's local timezone.
 */
export const toDatetimeLocalValue = (isoString: string | null | undefined): string => {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '';

  const pad = (n: number) => String(n).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());

  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

/**
 * Converts a `datetime-local` input value back into an ISO string suitable
 * for the API.
 */
export const fromDatetimeLocalValue = (value: string): string => {
  return new Date(value).toISOString();
};

/**
 * Returns the current local date/time formatted for `datetime-local`,
 * useful as a `min` attribute so the date picker itself discourages past dates.
 */
export const nowAsDatetimeLocal = (): string => {
  return toDatetimeLocalValue(new Date().toISOString());
};
