import { test as base, expect } from '@playwright/test';
import { ApiHooks } from '../hooks/ApiHooks';

const test = base;
ApiHooks.register(test);

export { test, expect };
