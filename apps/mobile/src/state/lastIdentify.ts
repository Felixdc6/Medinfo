import type { IdentifyResponse } from '@medinfo/shared';

/** Holds the most recent /identify result so the camera screen can hand it to the
 *  result screen without serialising a large object through navigation params. */
let last: IdentifyResponse | null = null;

export function setLastIdentify(result: IdentifyResponse): void {
  last = result;
}

export function getLastIdentify(): IdentifyResponse | null {
  return last;
}
