// source/provider/src/utils/externalAgent.ts
import { HttpAgent, HttpAgentOptions, Identity, ApiQueryResponse, SubmitResponse, ReadStateResponse } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";
import { Buffer } from "buffer";
import { rpcClient } from "../Provider";

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
    const commandDetails = {
      canisterId: canisterId.toString(),
      methodName: fields.methodName,
      arg: Buffer.from(fields.arg).toString("base64"),
    };
    console.log("Query command to execute externally:", commandDetails);

    // Request signing via RPC
    const signedResponse = await rpcClient.call("signQuery", [commandDetails]);

    // Assume signedResponse is a base64-encoded Candid buffer
    const responseArg = Buffer.from(signedResponse, "base64");
    return {
      status: "replied" as any,
      reply: { arg: responseArg },
      httpDetails: {
        ok: true,
        status: 200,
        statusText: "OK",
        headers: [],
      },
      requestId: Buffer.from("dummy-request-id") as any,
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