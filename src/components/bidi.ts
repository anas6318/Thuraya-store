/**
 * Splits localized copy into alternating [native, Latin, native, …] runs so
 * Latin model names (Polaris, Nova, Vega, Zenith, VVS1 …) can be isolated with
 * <bdi dir="ltr"> inside Arabic/Hebrew text. Odd indexes are Latin runs.
 */
const latinRun=/([A-Za-z][A-Za-z0-9.'’&-]*(?:\s+[A-Za-z0-9][A-Za-z0-9.'’&-]*)*)/;
export const splitLatinRuns=(text:string)=>text.split(latinRun);
