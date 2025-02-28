// source/provider/src/utils/externalAgent.ts
import { HttpAgent, HttpAgentOptions, Identity, ApiQueryResponse, SubmitResponse, ReadStateResponse } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";
import { Buffer } from "buffer";

export class ExternalSignAgent extends HttpAgent {
  constructor(options: HttpAgentOptions = {}) {
    super(options);
  }

  // Override query to match HttpAgent's signature
  async query(
    canisterId: string | Principal,
    fields: { methodName: string; arg: ArrayBuffer },
    identity?: Identity | Promise<Identity>
  ): Promise<ApiQueryResponse> {
    console.log("Query command to execute externally:", {
      canisterId: canisterId.toString(),
      methodName: fields.methodName,
      arg: Buffer.from(fields.arg).toString("base64"),
    });
    // Dummy Candid-encoded response for icrc1_symbol returning "ICP"
    // DIDL (magic number) + type (text) + length (3) + "ICP" bytes
    const dummyArg = Buffer.from([
      0x44, 0x49, 0x44, 0x4C, // DIDL magic number
      0x00,                   // No additional types
      0x01,                   // One value
      0x71,                   // Text type (0x71)
      0x03,                   // Length of "ICP" (3 bytes)
      0x49, 0x43, 0x50,       // UTF-8 bytes for "ICP"
    ]);
    return {
      status: "replied" as any,
      reply: { arg: dummyArg },
      httpDetails: {
        ok: true,
        status: 200,
        statusText: "OK",
        headers: [],
      },
      requestId: Buffer.from("dummy-request-id") as any, // Cast for RequestId branding
    };
  }

  // Override call to match HttpAgent's signature
  async call(
    canisterId: string | Principal,
    options: { 
      methodName: string; 
      arg: ArrayBuffer; 
      effectiveCanisterId?: Principal | string; 
      callSync?: boolean 
    },
    identity?: Identity | Promise<Identity>
  ): Promise<SubmitResponse> {
    console.log("Call command to execute externally:", {
      canisterId: canisterId.toString(),
      methodName: options.methodName,
      arg: Buffer.from(options.arg).toString("base64"),
      effectiveCanisterId: options.effectiveCanisterId?.toString(),
    });
    return {
      requestId: Buffer.from("dummy-request-id") as any,
      response: {
        ok: true,
        status: 200,
        statusText: "OK",
        body: null,
        headers: [],
      },
    };
  }

  // Override readState to match HttpAgent's signature
  async readState(
    canisterId: string | Principal,
    fields: { paths: ArrayBuffer[][] },
    identity?: Identity | Promise<Identity>,
    request?: any
  ): Promise<ReadStateResponse> {
    console.log("Read state command to execute externally:", {
      canisterId: canisterId.toString(),
      paths: fields.paths.map((path) => path.map((p) => Buffer.from(p).toString("base64"))),
    });
    return {
      certificate: Buffer.from([4, 5, 6]),
    };
  }
}

// Utility to create an agent instance
export const createExternalAgent = (options: HttpAgentOptions = {}): ExternalSignAgent => {
  return new ExternalSignAgent(options);
};