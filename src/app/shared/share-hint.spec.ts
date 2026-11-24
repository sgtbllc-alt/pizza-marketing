import { DeviceInfo, shareHint } from './share-hint';

// Real-world user agent shapes.
const SAFARI_17 =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const SAFARI_26 =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1';
const CHROME_IOS =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/126.0.6478.54 Mobile/15E148 Safari/604.1';
const FIREFOX_IOS =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/127.0 Mobile/15E148 Safari/605.1.15';
const IPAD_DESKTOP_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15';

const iphone = (userAgent: string, landscape = false): DeviceInfo => ({ userAgent, platform: 'iPhone', maxTouchPoints: 5, landscape });

describe('shareHint', () => {
  it('older Safari, upright: Share in the bottom toolbar, middle', () => {
    expect(shareHint(iphone(SAFARI_17))).toEqual(expect.objectContaining({ position: 'bottom-center', menu: null }));
  });

  it('older Safari, sideways: toolbar moves to the top', () => {
    expect(shareHint(iphone(SAFARI_17, true)).position).toBe('top-right');
  });

  it('Safari 26: Share is inside the ••• button, bottom right', () => {
    expect(shareHint(iphone(SAFARI_26))).toEqual(expect.objectContaining({ position: 'bottom-right', menu: '•••' }));
  });

  it('Chrome on iPhone: Share in the address bar, top right', () => {
    expect(shareHint(iphone(CHROME_IOS))).toEqual(expect.objectContaining({ position: 'top-right', menu: null }));
  });

  it('Firefox on iPhone: ☰ menu, bottom right', () => {
    expect(shareHint(iphone(FIREFOX_IOS))).toEqual(expect.objectContaining({ position: 'bottom-right', menu: '☰' }));
  });

  it('iPad (reports a Mac user agent with touch): top right', () => {
    expect(shareHint({ userAgent: IPAD_DESKTOP_UA, platform: 'MacIntel', maxTouchPoints: 5, landscape: true }).position).toBe('top-right');
  });
});
