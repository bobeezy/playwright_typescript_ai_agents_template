import { test as base, expect } from '@playwright/test';
import { WebHooks } from '../hooks/WebHooks';

const test = base;
WebHooks.register(test);

export { test, expect };
