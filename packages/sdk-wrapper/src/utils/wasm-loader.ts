/**
 * WASM Loader Utility
 *
 * Provides dynamic loading of WASM modules for browser environment.
 * Handles Poseidon hasher and ZK circuit files.
 */

import type BN from "bn.js";

// ============================================
// Types
// ============================================

export interface WasmLoadResult<T = unknown> {
  module: T;
  loadTimeMs: number;
}

export interface CircuitFiles {
  wasmBuffer: ArrayBuffer;
  zkeyBuffer: ArrayBuffer;
}

/**
 * Light hasher interface matching @lightprotocol/hasher.rs LightWasm
 */
export interface HasherModule {
  blakeHash(input: string | Uint8Array, hashLength: number): Uint8Array;
  poseidonHash(input: string[] | BN[]): Uint8Array;
  poseidonHashString(input: string[] | BN[]): string;
  poseidonHashBN(input: string[] | BN[]): BN;
}

export type WasmLoadStatus = "idle" | "loading" | "loaded" | "error";

export interface WasmLoaderState {
  hasher: WasmLoadStatus;
  circuit: WasmLoadStatus;
  error: Error | null;
}

// ============================================
// Configuration
// ============================================

export interface WasmLoaderConfig {
  /** Base path for WASM files (default: "/wasm") */
  wasmBasePath?: string;
  /** Base path for circuit files (default: "/circuit2") */
  circuitBasePath?: string;
  /** Timeout for loading in milliseconds (default: 30000) */
  timeout?: number;
  /** Whether to use SIMD-optimized hasher if available (default: true) */
  preferSimd?: boolean;
  /** Custom fetch function for loading files */
  customFetch?: typeof fetch;
}

const DEFAULT_CONFIG: Required<WasmLoaderConfig> = {
  wasmBasePath: "/wasm",
  circuitBasePath: "/circuit2",
  timeout: 30000,
  preferSimd: true,
  customFetch: typeof fetch !== "undefined" ? fetch : ((() => {
    throw new Error("fetch is not available");
  }) as unknown as typeof fetch),
};

// ============================================
// Error Classes
// ============================================

export class WasmLoadError extends Error {
  constructor(
    message: string,
    public readonly cause?: Error,
    public readonly filePath?: string
  ) {
    super(message);
    this.name = "WasmLoadError";
  }
}

export class WasmTimeoutError extends WasmLoadError {
  constructor(filePath: string, timeoutMs: number) {
    super(`WASM loading timed out after ${timeoutMs}ms: ${filePath}`);
    this.name = "WasmTimeoutError";
  }
}

export class WasmNetworkError extends WasmLoadError {
  constructor(filePath: string, status?: number) {
    super(
      status
        ? `Failed to fetch WASM file (HTTP ${status}): ${filePath}`
        : `Network error loading WASM file: ${filePath}`
    );
    this.name = "WasmNetworkError";
  }
}

// ============================================
// Feature Detection
// ============================================

/**
 * Check if the browser supports WASM SIMD
 */
export function supportsWasmSimd(): boolean {
  if (typeof WebAssembly === "undefined") return false;

  try {
    // SIMD feature detection using a minimal SIMD module
    const simdTest = new Uint8Array([
      0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00, 0x01, 0x05, 0x01, 0x60,
      0x00, 0x01, 0x7b, 0x03, 0x02, 0x01, 0x00, 0x0a, 0x0a, 0x01, 0x08, 0x00,
      0xfd, 0x0c, 0x00, 0x00, 0x00, 0x00, 0x0b,
    ]);
    return WebAssembly.validate(simdTest);
  } catch {
    return false;
  }
}

/**
 * Check if WebAssembly is supported
 */
export function supportsWasm(): boolean {
  try {
    if (typeof WebAssembly === "object" && typeof WebAssembly.instantiate === "function") {
      const module = new WebAssembly.Module(
        new Uint8Array([0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00])
      );
      return module instanceof WebAssembly.Module;
    }
  } catch {
    // WebAssembly not supported
  }
  return false;
}

// ============================================
// Loader Implementation
// ============================================

/**
 * Creates a promise that rejects after a timeout
 */
function createTimeout<T>(ms: number, message: string): Promise<T> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new WasmTimeoutError(message, ms)), ms);
  });
}

/**
 * Fetch a file as ArrayBuffer with timeout and error handling
 */
async function fetchWithTimeout(
  url: string,
  config: Required<WasmLoaderConfig>
): Promise<ArrayBuffer> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.timeout);

  try {
    const response = await Promise.race([
      config.customFetch(url, { signal: controller.signal }),
      createTimeout<Response>(config.timeout, url),
    ]);

    if (!response.ok) {
      throw new WasmNetworkError(url, response.status);
    }

    return await response.arrayBuffer();
  } catch (error) {
    if (error instanceof WasmLoadError) {
      throw error;
    }
    if (error instanceof Error && error.name === "AbortError") {
      throw new WasmTimeoutError(url, config.timeout);
    }
    throw new WasmNetworkError(url);
  } finally {
    clearTimeout(timeoutId);
  }
}

// ============================================
// Module Cache
// ============================================

interface LoaderCache {
  hasherModule: HasherModule | null;
  circuitFiles: CircuitFiles | null;
  hasherPromise: Promise<HasherModule> | null;
  circuitPromise: Promise<CircuitFiles> | null;
}

const cache: LoaderCache = {
  hasherModule: null,
  circuitFiles: null,
  hasherPromise: null,
  circuitPromise: null,
};

// ============================================
// Public API
// ============================================

/**
 * Load the Poseidon hasher WASM module
 */
export async function loadHasher(
  config: WasmLoaderConfig = {}
): Promise<WasmLoadResult<HasherModule>> {
  const startTime = performance.now();
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  // Return cached module if available
  if (cache.hasherModule) {
    return {
      module: cache.hasherModule,
      loadTimeMs: 0,
    };
  }

  // Return pending promise if loading is in progress
  if (cache.hasherPromise) {
    const module = await cache.hasherPromise;
    return {
      module,
      loadTimeMs: performance.now() - startTime,
    };
  }

  // Start loading
  cache.hasherPromise = (async (): Promise<HasherModule> => {
    const useSimd = mergedConfig.preferSimd && supportsWasmSimd();
    const wasmFile = useSimd ? "hasher_wasm_simd_bg.wasm" : "light_wasm_hasher_bg.wasm";
    const wasmPath = `${mergedConfig.wasmBasePath}/${wasmFile}`;

    try {
      // Dynamic import of the hasher module using WasmFactory
      const { WasmFactory } = await import("@lightprotocol/hasher.rs");

      // Fetch WASM file and load hasher
      const wasmBuffer = await fetchWithTimeout(wasmPath, mergedConfig);

      // Load the hasher with custom WASM input
      const hasherInstance = await WasmFactory.loadHasher({
        simd: useSimd,
        wasm: wasmBuffer,
      });

      cache.hasherModule = hasherInstance;
      return hasherInstance;
    } catch (error) {
      cache.hasherPromise = null;
      throw new WasmLoadError(
        `Failed to load hasher module: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error : undefined,
        wasmPath
      );
    }
  })();

  const module = await cache.hasherPromise;
  return {
    module,
    loadTimeMs: performance.now() - startTime,
  };
}

/**
 * Load ZK circuit files (WASM and zkey)
 */
export async function loadCircuitFiles(
  config: WasmLoaderConfig = {}
): Promise<WasmLoadResult<CircuitFiles>> {
  const startTime = performance.now();
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  // Return cached files if available
  if (cache.circuitFiles) {
    return {
      module: cache.circuitFiles,
      loadTimeMs: 0,
    };
  }

  // Return pending promise if loading is in progress
  if (cache.circuitPromise) {
    const files = await cache.circuitPromise;
    return {
      module: files,
      loadTimeMs: performance.now() - startTime,
    };
  }

  // Start loading
  cache.circuitPromise = (async (): Promise<CircuitFiles> => {
    const wasmPath = `${mergedConfig.circuitBasePath}/transaction2.wasm`;
    const zkeyPath = `${mergedConfig.circuitBasePath}/transaction2.zkey`;

    try {
      // Load both files in parallel
      const [wasmBuffer, zkeyBuffer] = await Promise.all([
        fetchWithTimeout(wasmPath, mergedConfig),
        fetchWithTimeout(zkeyPath, mergedConfig),
      ]);

      const circuitFiles: CircuitFiles = {
        wasmBuffer,
        zkeyBuffer,
      };

      cache.circuitFiles = circuitFiles;
      return circuitFiles;
    } catch (error) {
      cache.circuitPromise = null;
      throw new WasmLoadError(
        `Failed to load circuit files: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error : undefined
      );
    }
  })();

  const files = await cache.circuitPromise;
  return {
    module: files,
    loadTimeMs: performance.now() - startTime,
  };
}

/**
 * Preload all WASM modules and circuit files
 */
export async function preloadAll(
  config: WasmLoaderConfig = {}
): Promise<{
  hasher: WasmLoadResult<HasherModule>;
  circuit: WasmLoadResult<CircuitFiles>;
  totalTimeMs: number;
}> {
  const startTime = performance.now();

  const [hasher, circuit] = await Promise.all([
    loadHasher(config),
    loadCircuitFiles(config),
  ]);

  return {
    hasher,
    circuit,
    totalTimeMs: performance.now() - startTime,
  };
}

/**
 * Clear the module cache
 */
export function clearWasmCache(): void {
  cache.hasherModule = null;
  cache.circuitFiles = null;
  cache.hasherPromise = null;
  cache.circuitPromise = null;
}

/**
 * Get current cache status
 */
export function getWasmCacheStatus(): {
  hasherLoaded: boolean;
  circuitLoaded: boolean;
  hasherLoading: boolean;
  circuitLoading: boolean;
} {
  return {
    hasherLoaded: cache.hasherModule !== null,
    circuitLoaded: cache.circuitFiles !== null,
    hasherLoading: cache.hasherPromise !== null && cache.hasherModule === null,
    circuitLoading: cache.circuitPromise !== null && cache.circuitFiles === null,
  };
}

/**
 * Estimate file sizes for preload progress
 */
export const ESTIMATED_FILE_SIZES = {
  hasherSimd: 1.3 * 1024 * 1024, // ~1.3 MB
  hasherStandard: 2.0 * 1024 * 1024, // ~2.0 MB
  circuitWasm: 3.2 * 1024 * 1024, // ~3.2 MB
  circuitZkey: 16.5 * 1024 * 1024, // ~16.5 MB
} as const;

/**
 * Get total estimated download size
 */
export function getEstimatedDownloadSize(preferSimd = true): number {
  const hasherSize = preferSimd && supportsWasmSimd()
    ? ESTIMATED_FILE_SIZES.hasherSimd
    : ESTIMATED_FILE_SIZES.hasherStandard;

  return hasherSize + ESTIMATED_FILE_SIZES.circuitWasm + ESTIMATED_FILE_SIZES.circuitZkey;
}
