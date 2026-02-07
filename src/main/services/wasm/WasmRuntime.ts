import fs from 'fs';

export interface WasmResult {
  data: Uint8Array;
  mimeType?: string;
}

interface WasmRuntimeOptions {
  memoryLimitBytes: number;
}

const WASM_PAGE_SIZE = 64 * 1024;
const HEAP_START = 0x10000;
const SHARED_BUFFER_PTR = 0x8000;
const SHARED_BUFFER_SIZE = 256;

export default class WasmRuntime {
  private instance: WebAssembly.Instance;
  private memory: WebAssembly.Memory;
  private heapOffset: number;
  private lastResult: WasmResult | null = null;
  private readonly encoder = new TextEncoder();
  private readonly decoder = new TextDecoder();

  private constructor(instance: WebAssembly.Instance, memory: WebAssembly.Memory) {
    this.instance = instance;
    this.memory = memory;
    this.heapOffset = HEAP_START;
  }

  static async create(wasmPath: string, options: WasmRuntimeOptions): Promise<WasmRuntime> {
    const bytes = await fs.promises.readFile(wasmPath);
    const module = await WebAssembly.compile(bytes);

    const maxPages = Math.max(1, Math.floor(options.memoryLimitBytes / WASM_PAGE_SIZE));
    const initialPages = Math.min(256, maxPages);
    const memory = new WebAssembly.Memory({ initial: initialPages, maximum: maxPages });
    const memoryRef = { current: memory as WebAssembly.Memory };

    const runtimePlaceholder = { current: null as WasmRuntime | null };

    const imports = {
      env: {
        memory,
        host_read_file: (pathPtr: number, pathLen: number) => {
          const runtime = runtimePlaceholder.current;
          if (!runtime) return 0;
          const filePath = runtime.readString(pathPtr, pathLen);
          const data = fs.readFileSync(filePath);
          const dataPtr = runtime.writeBytes(data);
          runtime.writeSharedBufferInt(data.length);
          return dataPtr;
        },
        host_file_size: (pathPtr: number, pathLen: number) => {
          const runtime = runtimePlaceholder.current;
          if (!runtime) return BigInt(0);
          const filePath = runtime.readString(pathPtr, pathLen);
          const stats = fs.statSync(filePath);
          return BigInt(stats.size);
        },
        host_return_result: (dataPtr: number, dataLen: number, mimePtr: number) => {
          const runtime = runtimePlaceholder.current;
          if (!runtime) return 0;
          const data = new Uint8Array(runtime.memory.buffer, dataPtr, dataLen);
          const copied = new Uint8Array(data);
          const mimeType = mimePtr ? runtime.readCString(mimePtr, 128) : undefined;
          runtime.lastResult = { data: copied, mimeType };
          return 0;
        },
        host_log: (level: number, msgPtr: number, msgLen: number) => {
          const runtime = runtimePlaceholder.current;
          if (!runtime) return 0;
          const message = runtime.readString(msgPtr, msgLen);
          const prefix = level === 2 ? 'error' : level === 1 ? 'warn' : 'info';
          console[prefix](`[plugin] ${message}`);
          return 0;
        },
        host_get_time: () => BigInt(Date.now()),
        host_random: () => BigInt(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)),
      },
    };

    const instance = await WebAssembly.instantiate(module, imports);
    const runtime = new WasmRuntime(instance, memoryRef.current);

    runtimePlaceholder.current = runtime;

    const exportedMemory = instance.exports.memory as WebAssembly.Memory | undefined;
    if (exportedMemory) {
      runtime.memory = exportedMemory;
      memoryRef.current = exportedMemory;
    }

    runtime.ensureCapacity(HEAP_START + SHARED_BUFFER_SIZE);
    return runtime;
  }

  dispose(): void {
    this.lastResult = null;
  }

  async execute(method: string, data?: Uint8Array, extraStrings: string[] = []): Promise<WasmResult | null> {
    const exportFn = this.instance.exports[method];
    if (typeof exportFn !== 'function') {
      throw new Error(`WASM export not found: ${method}`);
    }

    this.resetHeap();
    this.lastResult = null;

    const args: number[] = [];
    if (data) {
      const { ptr, len } = this.writePayload(data);
      args.push(ptr, len);
    }

    for (const value of extraStrings) {
      const { ptr, len } = this.writePayload(this.encoder.encode(value));
      args.push(ptr, len);
    }

    (exportFn as (...params: number[]) => number)(...args);
    return this.lastResult;
  }

  getSharedBufferPtr(): number {
    return SHARED_BUFFER_PTR;
  }

  private resetHeap(): void {
    this.heapOffset = HEAP_START;
  }

  private ensureCapacity(size: number): void {
    if (size <= this.memory.buffer.byteLength) return;
    const needed = size - this.memory.buffer.byteLength;
    const pages = Math.ceil(needed / WASM_PAGE_SIZE);
    this.memory.grow(pages);
  }

  private writeSharedBufferInt(value: number): void {
    this.ensureCapacity(SHARED_BUFFER_PTR + 4);
    const view = new DataView(this.memory.buffer);
    view.setInt32(SHARED_BUFFER_PTR, value, true);
  }

  private writePayload(bytes: Uint8Array): { ptr: number; len: number } {
    const ptr = this.writeBytes(bytes);
    return { ptr, len: bytes.length };
  }

  private writeBytes(bytes: Uint8Array): number {
    const ptr = this.heapOffset;
    const next = ptr + bytes.length;
    this.ensureCapacity(next);
    new Uint8Array(this.memory.buffer, ptr, bytes.length).set(bytes);
    this.heapOffset = next;
    return ptr;
  }

  private readString(ptr: number, len: number): string {
    if (ptr === 0 || len === 0) return '';
    const data = new Uint8Array(this.memory.buffer, ptr, len);
    return this.decoder.decode(data);
  }

  private readCString(ptr: number, maxLen: number): string {
    const data = new Uint8Array(this.memory.buffer);
    let end = ptr;
    const limit = Math.min(data.length, ptr + maxLen);
    while (end < limit && data[end] !== 0) {
      end += 1;
    }
    return this.decoder.decode(data.subarray(ptr, end));
  }
}
