import { WasmModule } from "../../../impl/modules";
import { TransportLayer } from "../../../protocol/protocol";
export declare function dosDirect(wasmModule: WasmModule, sessionId: string, canvas?: OffscreenCanvas): Promise<TransportLayer>;
