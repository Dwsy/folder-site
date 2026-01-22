import { beforeAll, afterEach, afterAll } from 'bun:test';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Setup DOM environment
import { Window } from 'happy-dom';

const window = new Window();
global.window = window as any;
global.document = window.document;
global.HTMLElement = window.HTMLElement;
global.HTMLButtonElement = window.HTMLButtonElement;
global.HTMLAnchorElement = window.HTMLAnchorElement;
global.HTMLDivElement = window.HTMLDivElement;
global.HTMLSpanElement = window.HTMLSpanElement;
global.HTMLInputElement = window.HTMLInputElement;
global.HTMLUListElement = window.HTMLUListElement;
global.HTMLLIElement = window.HTMLLIElement;
global.navigator = window.navigator;

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Global setup if needed
beforeAll(() => {
  // Setup global test environment
});

afterAll(() => {
  // Cleanup global test environment
});