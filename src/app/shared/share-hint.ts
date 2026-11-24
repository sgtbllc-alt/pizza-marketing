/**
 * Where the Share button (needed for "Add to Home Screen") usually is on this iPhone/iPad browser.
 *
 * Websites cannot see the browser's toolbar, so this is a best guess from the user agent and
 * orientation:
 * - Safari on iOS 15–18, iPhone upright: Share is in the bottom toolbar, centre.
 * - Safari on iOS 26+ (reports "Version/26" in the user agent): Share moved into the "•••" button,
 *   bottom right. (If the user chose the top address-bar layout in Settings we cannot tell.)
 * - iPhone held sideways on iOS 15–18: the toolbar moves to the top; Share is top right.
 * - Chrome (CriOS): Share icon in the address bar, top right.
 * - Firefox (FxiOS): "☰" menu, bottom right. Edge (EdgiOS): "•••" menu, bottom centre.
 * - iPad: Share is in the top toolbar, right side.
 */
export type ShareHintPosition = 'bottom-center' | 'bottom-right' | 'top-right';

export interface ShareHint {
  position: ShareHintPosition;
  /** What to tap first, if Share is inside a menu (e.g. '•••' or '☰'). */
  menu: string | null;
  /** Short location text for step 1. */
  where: string;
}

export interface DeviceInfo {
  userAgent: string;
  platform: string;
  maxTouchPoints: number;
  landscape: boolean;
}

export function isIPadDevice(d: Pick<DeviceInfo, 'userAgent' | 'platform' | 'maxTouchPoints'>): boolean {
  return /iPad/.test(d.userAgent) || (d.platform === 'MacIntel' && d.maxTouchPoints > 1);
}

export function shareHint(d: DeviceInfo): ShareHint {
  const ua = d.userAgent;

  if (/CriOS/.test(ua)) {
    return { position: 'top-right', menu: null, where: 'In the address bar, top right.' };
  }
  if (/FxiOS/.test(ua)) {
    return { position: 'bottom-right', menu: '☰', where: 'Bottom right of Firefox.' };
  }
  if (/EdgiOS/.test(ua)) {
    return { position: 'bottom-center', menu: '•••', where: 'Bottom of Edge.' };
  }

  // Safari (and other WebKit browsers that look like Safari)
  const safariMajor = Number(ua.match(/Version\/(\d+)/)?.[1] ?? 0);
  const newSafari = safariMajor >= 26;

  if (isIPadDevice(d)) {
    return { position: 'top-right', menu: newSafari ? '•••' : null, where: 'Top right of Safari.' };
  }
  if (newSafari) {
    return { position: 'bottom-right', menu: '•••', where: 'Bottom right of Safari.' };
  }
  if (d.landscape) {
    return { position: 'top-right', menu: null, where: 'Top right of Safari.' };
  }
  return { position: 'bottom-center', menu: null, where: 'Bottom of Safari, in the middle.' };
}

/** Reads the current device. Browser only. */
export function currentDevice(): DeviceInfo {
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    maxTouchPoints: navigator.maxTouchPoints,
    landscape: window.innerWidth > window.innerHeight,
  };
}
