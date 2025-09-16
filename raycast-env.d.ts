/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {
  /** clipaste binary - Path to the clipaste executable (or just 'clipaste' if it's on PATH). */
  "clipastePath": string,
  /** Default Output Directory - Used when 'Paste' has empty Output dir. */
  "defaultOutputDir"?: string,
  /** Enable pngpaste fallback (macOS) - If clipboard contains an image (not a file), try to dump it via pngpaste for preview. */
  "enablePngpaste": boolean,
  /** pngpaste binary - Path to pngpaste (e.g., 'pngpaste'). Install with: brew install pngpaste */
  "pngpastePath": string
}

/** Preferences accessible in all the extension's commands */
declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Preferences accessible in the `launcher` command */
  export type Launcher = ExtensionPreferences & {}
}

declare namespace Arguments {
  /** Arguments passed to the `launcher` command */
  export type Launcher = {}
}

