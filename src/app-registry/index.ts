import type { ComponentType } from 'react';

export interface AppModule {
  default: ComponentType;
}

/**
 * Registry of interactive apps. Each entry is a dynamic import, so an app's code
 * (and its CSS) is only downloaded when its page is opened.
 * To add an app: create src/app-registry/<key>/, add a loader here, then add src/content/apps/<key>.md.
 */
export const appRegistry = {
  'rule-explorer': () => import('./rule-explorer/RuleExplorer'),
  'bulletin-board': () => import('./bulletin-board/BulletinBoard'),
} satisfies Record<string, () => Promise<AppModule>>;

export type AppKey = keyof typeof appRegistry;

export const appKeys = Object.keys(appRegistry) as [AppKey, ...AppKey[]];
