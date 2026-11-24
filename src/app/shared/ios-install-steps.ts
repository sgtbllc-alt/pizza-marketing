import { Component, input } from '@angular/core';

import { ShareHint } from './share-hint';

/**
 * The three Add to Home Screen steps for iPhone/iPad Safari, with pictures (Share icon,
 * menu row, app icon). Used by the notification pop-up and the notification card.
 */
@Component({
  selector: 'app-ios-install-steps',
  template: `
    <ol class="steps">
      <li>
        <span>
          @if (hint().menu; as menu) { Tap <strong>{{ menu }}</strong> then <strong>Share</strong> } @else { Tap <strong>Share</strong> }
        </span>
        <span class="chip"><svg class="share-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12M7.5 7.5 12 3l4.5 4.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 10H6a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9a1 1 0 0 0-1-1h-2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></span>
        <small>{{ hint().where }}</small>
      </li>
      <li>
        <span>Tap</span>
        <span class="menu-row" aria-hidden="true"><span>Add to Home Screen</span><span class="plus-box">+</span></span>
        <small>Scroll down in the Share menu if you don't see it. Then tap <strong>Add</strong>.</small>
      </li>
      <li>
        <span>Open the new <strong>pizza icon</strong></span>
        <img class="app-icon" src="icons/icon-96x96.png" alt="" width="40" height="40" />
        <small>Then tap <strong>Turn on notifications</strong>.</small>
      </li>
    </ol>
  `,
  styles: `
  :host {
    display: block;
  }
  .steps {
    display: grid;
    margin: 0 0 12px;
    gap: 12px;
    padding: 0;
    list-style: none;
    counter-reset: step;
  }
  .steps li {
    display: grid;
    grid-template-columns: 28px 1fr auto;
    grid-template-areas: 'num text pic' 'num note note';
    align-items: center;
    column-gap: 10px;
    row-gap: 2px;
    padding: 10px;
    border-radius: 10px;
    background: var(--step-bg, #fff8ed);
    text-align: left;
    counter-increment: step;
  }
  .steps li::before {
    content: counter(step);
    grid-area: num;
    display: grid;
    place-items: center;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: #004438;
    color: #fff;
    font-size: 0.85rem;
    font-weight: 900;
  }
  .steps li > span:first-of-type {
    grid-area: text;
    color: #1f1814;
  }
  .steps small {
    grid-area: note;
    color: #7b6b63;
    font-size: 0.8rem;
  }
  .chip,
  .menu-row,
  .app-icon {
    grid-area: pic;
  }
  .chip {
    display: grid;
    place-items: center;
    width: 38px;
    height: 38px;
    border-radius: 9px;
    background: #fff;
    color: #007aff;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
  }
  .share-icon {
    width: 22px;
    height: 22px;
  }
  .menu-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 8px 6px 10px;
    border-radius: 8px;
    background: #fff;
    color: #1f1814;
    font-size: 0.78rem;
    white-space: nowrap;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
  }
  .plus-box {
    display: grid;
    place-items: center;
    width: 18px;
    height: 18px;
    border: 1.5px solid #1f1814;
    border-radius: 4px;
    font-weight: 700;
    line-height: 1;
  }
  .app-icon {
    border-radius: 9px;
  }  `,
})
export class IosInstallSteps {
  /** Where Share is on this browser (see share-hint.ts). */
  readonly hint = input<ShareHint>({ position: 'bottom-center', menu: null, where: 'Bottom of Safari, in the middle.' });
}
