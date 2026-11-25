import { TextEncoder } from "node:util";

// jest-environment-jsdom does not expose TextEncoder.
Object.assign(globalThis, { TextEncoder });
