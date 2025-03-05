// In utils/externalAgent.ts
import { HttpAgent, HttpAgentOptions, Identity, ReadStateResponse } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";
import { IDL } from "@dfinity/candid";
import { Buffer } from "buffer";
import { rpcClient } from "../Provider";

export class ExternalSignAgent extends HttpAgent {
  constructor(...args: any[]) {
    super(...args);
  }

  // Helper to generate Candid string from args
  private async getCandidArgs(
    methodName: string,
    arg: ArrayBuffer,
    interfaceFactory?: IDL.InterfaceFactory
  ): Promise<string> {
    if (!interfaceFactory) return "()";

    const service = interfaceFactory({ IDL });
    const method = service._fields.find(([name]) => name === methodName);
    if (!method) return "()";

    const [_, funcType] = method;
    const argTypes = funcType.argTypes;

    // Decode the binary arg into JavaScript values
    const decodedArgs = IDL.decode(argTypes, Buffer.from(arg));

    // Generate Candid string
    return this.argsToString(interfaceFactory, methodName, decodedArgs);
  }

  // Helper to convert decoded args to Candid string
  private async argsToString(
    interfaceFactory: IDL.InterfaceFactory,
    methodName: string,
    decodedArgs: any[]
  ): Promise<string> {
    const service = interfaceFactory({ IDL });
    const method = service._fields.find(([name]) => name === methodName);
    if (!method) throw new Error(`Method '${methodName}' not found`);

    const [_, funcType] = method;
    const argTypes = funcType.argTypes;

    if (argTypes.length !== decodedArgs.length) {
      throw new Error("Argument length mismatch");
    }

    return IDL.FuncClass.argsToString(argTypes, decodedArgs);
  }

  async query(
    canisterId: string | Principal,
    fields: { methodName: string; arg: ArrayBuffer },
    identity?: Identity | Promise<Identity>,
    interfaceFactory?: IDL.InterfaceFactory
  ): Promise<any> {
    const candidArgs = await this.getCandidArgs(fields.methodName, fields.arg, interfaceFactory);
    const commandDetails = {
      canisterId: canisterId.toString(),
      methodName: fields.methodName,
      arg: Buffer.from(fields.arg).toString("base64"),
      candidArgs,
    };
    console.log("Query command:", commandDetails);

    // Trigger signing popup via RPC
    const signedResponse = await rpcClient.call("signQuery", [commandDetails]);
    const responseArg = Buffer.from(signedResponse, "base64");

    return {
      status: "replied",
      reply: { arg: responseArg },
      httpDetails: { ok: true, status: 200, statusText: "OK", headers: [] },
      requestId: Buffer.from("dummy-request-id"),
    };
  }

  async call(
    canisterId: string | Principal,
    options: {
      methodName: string;
      arg: ArrayBuffer;
      effectiveCanisterId?: Principal | string;
      callSync?: boolean;
    },
    identity?: Identity | Promise<Identity>,
    interfaceFactory?: IDL.InterfaceFactory
  ): Promise<any> {
    const candidArgs = await this.getCandidArgs(options.methodName, options.arg, interfaceFactory);
    const commandDetails = {
      canisterId: canisterId.toString(),
      methodName: options.methodName,
      arg: Buffer.from(options.arg).toString("base64"),
      candidArgs,
      effectiveCanisterId: options.effectiveCanisterId?.toString(),
    };
    console.log("Call command:", commandDetails);

    // Trigger signing popup via RPC
    const signedResponse = await rpcClient.call("signQuery", [commandDetails]);
    return {
      requestId: Buffer.from(signedResponse, "base64"),
      response: { ok: true, status: 200, statusText: "OK", body: null, headers: [] },
    };
  }

  async readState(
    canisterId: string | Principal,
    fields: { paths: ArrayBuffer[][] },
    identity?: Identity | Promise<Identity>,
    request?: any
  ): Promise<ReadStateResponse> {
    console.log("Read state command:", {
      canisterId: canisterId.toString(),
      paths: fields.paths.map((path) => path.map((p) => Buffer.from(p).toString("base64"))),
    });
    return {
      certificate: Buffer.from([4, 5, 6]),
    };
  }
}

export const createExternalAgent = (options: HttpAgentOptions = {}): ExternalSignAgent => {
  return new ExternalSignAgent(options);
};