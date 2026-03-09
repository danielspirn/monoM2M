import * as matchers from '@testing-library/jest-dom/matchers';
import { expect } from 'vitest';

expect.extend(matchers);

Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: () => ({
    measureText: (value: string) => ({
      width: value.length * 7,
    }),
  }),
});
