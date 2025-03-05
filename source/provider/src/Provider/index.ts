// source/provider/src/Provider/index.ts
import { HttpAgent, Actor, ActorSubclass, Identity, Agent, QueryFields } from "@dfinity/agent";
import { IDL } from "@dfinity/candid";
import { Principal } from "@dfinity/principal";
import { Buffer } from "buffer";
import { AccountIdentifier } from "@dfinity/ledger-icp";
import { CreateAgentParams } from "./interfaces";

import {
  managementCanisterIdlFactory,
  managementCanisterPrincipal,
  transformOverrideHandler,
} from "../utils/ic-management-api";
import { versions } from "../constants";
import {
  getArgTypes,
  ArgsTypesOfCanister,
  parseMessageToString,
} from "../utils/sign";
import { createExternalAgent } from "../utils/externalAgent"; // Import new agent utility
import {
  CreateActor,
  ICNSInfo,
  ProviderInterface,
  ProviderInterfaceVersions,
  RequestBurnXTCParams,
  RequestConnectParams,
  RequestImportTokenParams,
  RequestTransferParams,
  SimplifiedRPC,
  Transaction,
  WalletConnectOptions,
} from "./interfaces";
import RPCManager from "../modules/RPCManager";
import SessionManager from "../modules/SessionManager";
import { validateCanisterId } from "../utils/account";
import WalletConnectRPC from "../utils/wallet-connect-rpc";
import { BrowserRPC } from "@fleekhq/browser-rpc";

export const rpcClient = new BrowserRPC(window, {
  name: "computr-provider",
  target: "computr-content-script",
  timeout: 0,
});

rpcClient.start();

export default class Provider implements ProviderInterface {
  public agent?: HttpAgent;
  public versions: ProviderInterfaceVersions = versions;
  private _principalId?: string;
  private _accountId?: string;
  public isWalletLocked: boolean = false;
  private clientRPC: RPCManager;
  private sessionManager: SessionManager;
  private idls: ArgsTypesOfCanister = {};

  // Getters
  public get principalId(): string | undefined {
    return this._principalId;
  }

  public get accountId(): string | undefined {
    return this._accountId;
  }

  static createWithWalletConnect(walletConnectOptions: WalletConnectOptions): Provider {
    const walletConnectRPC = new WalletConnectRPC(walletConnectOptions);
    walletConnectRPC.resetSession();
    return new Provider(walletConnectRPC);
  }

  static async exposeProviderWithWalletConnect(walletConnectOptions: WalletConnectOptions) {
    const provider = this.createWithWalletConnect(walletConnectOptions);

    try {
      const isConnected = await provider.isConnected();
      console.log("Domain connected during init:", isConnected);
      if (isConnected) {
        await provider.getPrincipal({ asString: true });
        console.log("Initialized principalId:", provider.principalId, "accountId:", provider.accountId);
      } else {
        console.log("Domain not connected, principalId and accountId remain undefined");
      }
    } catch (error) {
      console.error("Failed to initialize principalId and accountId:", error);
    }

    const ic = (window as any).ic || {};
    window.ic = {
      ...ic,
      plug: provider, // Match Plug's namespace
    };
  }

  constructor(clientRPC: SimplifiedRPC) {
    this.clientRPC = new RPCManager({ instance: clientRPC });
    this.sessionManager = new SessionManager({ rpc: this.clientRPC });
    this.versions = versions;
  }

  public async init() {
    const connectionData = await this.sessionManager.init();
    const { sessionData } = connectionData || {};
    this.isWalletLocked = false;
    if (sessionData) {
      this.agent = sessionData?.agent;
      this._principalId = sessionData?.principalId || "aaaaa-aa"; // Dummy principal
      if (this._principalId) {
        this._accountId = AccountIdentifier.fromPrincipal({ principal: Principal.fromText(this._principalId) }).toHex();
      }
      this._accountId = sessionData?.accountId || this._accountId;
    }
    this.hookToWindowEvents();
  }

  public async getPrincipal({ asString } = { asString: false }): Promise<Principal | string | null> {
    if (this._principalId) {
      const isConnected = await this.isConnected();
      if (!isConnected) {
        console.log("Domain not connected, returning null for principalId");
        return null;
      }
      if (!this._accountId && this._principalId) {
        this._accountId = AccountIdentifier.fromPrincipal({ principal: Principal.fromText(this._principalId) }).toHex();
      }
      return asString ? this._principalId : Principal.from(this._principalId);
    }

    const origin = window.location.origin;
    const isConnected = await this.isConnected();
    if (!isConnected) {
      console.log("Domain not connected, returning null for principalId");
      return null;
    }

    const response = await rpcClient.call("getPrincipal", [{ origin }]);
    if (!response) {
      console.log("No principalId found in storage, using dummy value");
      this._principalId = "aaaaa-aa"; // Dummy principal
      this._accountId = AccountIdentifier.fromPrincipal({ principal: Principal.fromText(this._principalId) }).toHex();
      return asString ? this._principalId : Principal.from(this._principalId);
    }

    this._principalId = response;
    this._accountId = AccountIdentifier.fromPrincipal({ principal: Principal.fromText(response) }).toHex();
    console.log("Fetched and cached principalId:", this._principalId, "accountId:", this._accountId);
    return asString ? response : Principal.from(response);
  }

  public async isConnected(): Promise<boolean> {
    const origin = window.location.origin;
    const response = await rpcClient.call("isConnected", [{ origin }]);
    return !!response;
  }

  public async requestConnect(args: RequestConnectParams = {}): Promise<any> {
    const origin = window.location.origin;
    const response = await rpcClient.call("requestConnect", [{ origin }]);
    if (response === "Successfully connected!") {
      try {
        const principal = await this.getPrincipal({ asString: true });
        console.log("Fetched principalId after requestConnect:", principal, "accountId:", this._accountId);
      } catch (error) {
        console.error("Failed to fetch principalId after requestConnect:", error);
      }
    }
    return response;
  }

  public async principalFromText(text: string): Promise<Principal> {
    return Principal.fromText(text);
  }
  public async argsToString(
    interfaceFactory: IDL.InterfaceFactory,
    methodName: string,
    args: any[]
  ): Promise<string> {
    const service = interfaceFactory({ IDL }); // Get the service with IDL context
    const method = service._fields.find(([name]) => name === methodName);
    if (!method) {
      throw new Error(`Method '${methodName}' not found in interface`);
    }

    const [_, funcType] = method;
    const argTypes = funcType.argTypes;

    if (argTypes.length !== args.length) {
      throw new Error('Arity mismatch: argument types and values must have the same length');
    }

    return IDL.FuncClass.argsToString(argTypes, args);
  }

  public async disconnect(): Promise<void> {
    const origin = window.location.origin;
    await rpcClient.call("disconnect", [{ origin }]);
    this._principalId = undefined;
    this._accountId = undefined;
    this.agent = undefined;
    console.log("Disconnected, principalId, accountId, and agent cleared");
  }

  public async createAgent({ whitelist = [], host = "https://ic0.app" }: CreateAgentParams = {}): Promise<boolean> {
    if (!this._principalId) {
      throw Error("Call requestConnect first");
    }
    this.agent = createExternalAgent({ host });
    console.log("Created agent with whitelist:", whitelist, "host:", host);
    return !!this.agent;
  }

  public async createActor<T>({ canisterId, interfaceFactory }: CreateActor<T>): Promise<ActorSubclass<T>> {
    if (!canisterId || !validateCanisterId(canisterId)) {
      throw Error("A valid canisterId is required");
    }
    if (!interfaceFactory) {
      throw Error("An interfaceFactory is required");
    }
    this.idls[canisterId] = getArgTypes(interfaceFactory);
    const baseAgent = this.agent || createExternalAgent({ host: "https://ic0.app" });

    // Enhance the agent to pass interfaceFactory while maintaining Agent interface
    const enhancedAgent: Agent = {
      ...baseAgent,
      query: async (
        canisterId: string | Principal,
        fields: QueryFields,
        identity?: Identity | Promise<Identity>
      ): Promise<any> => {
        return (baseAgent as any).query(canisterId, fields, identity, interfaceFactory);
      },
      call: async (
        canisterId: string | Principal,
        options: { methodName: string; arg: ArrayBuffer; effectiveCanisterId?: Principal | string; callSync?: boolean },
        identity?: Identity | Promise<Identity>
      ): Promise<any> => {
        return (baseAgent as any).call(canisterId, options, identity, interfaceFactory);
      },
      // Include required Agent methods to satisfy the interface
      getPrincipal: baseAgent.getPrincipal.bind(baseAgent),
      readState: baseAgent.readState.bind(baseAgent),
      status: baseAgent.status.bind(baseAgent),
      fetchRootKey: baseAgent.fetchRootKey.bind(baseAgent),
    };

    return Actor.createActor<T>(interfaceFactory, { agent: enhancedAgent, canisterId });
  }

  public async requestBalance(accountId = null): Promise<bigint> {
    console.log("Request balance command to execute externally:", { accountId });
    return BigInt(100000000); // Dummy balance (1 ICP in e8s)
  }

  public async requestTransfer(params: RequestTransferParams): Promise<bigint> {
    console.log("Request transfer command to execute externally:", params);
    return BigInt(123456); // Dummy transaction ID
  }

  public async batchTransactions(transactions: Transaction[]): Promise<boolean> {
    console.log("Batch transactions command to execute externally:", transactions);
    return true; // Dummy success
  }

  public async getICNSInfo(): Promise<ICNSInfo> {
    console.log("Get ICNS info command to execute externally");
    return { names: ["dummy.icp"], reverseResolvedName: "dummy" }; // Dummy ICNS info
  }

  public async requestBurnXTC(params: RequestBurnXTCParams): Promise<any> {
    console.log("Request burn XTC command to execute externally:", params);
    return { success: true }; // Dummy response
  }

  public async requestImportToken(params: RequestImportTokenParams): Promise<any> {
    console.log("Request import token command to execute externally:", params);
    return { success: true }; // Dummy response
  }

  public async getManagementCanister(): Promise<ActorSubclass<any>> {
    if (!this.agent) {
      throw Error("Oops! Agent initialization required.");
    }
    return Actor.createActor(managementCanisterIdlFactory, {
      agent: this.agent,
      canisterId: managementCanisterPrincipal,
      callTransform: transformOverrideHandler,
      queryTransform: transformOverrideHandler,
    });
  }

  private hookToWindowEvents = () => {
    window.addEventListener(
      "updateConnection",
      async () => {
        const connectionData = await this.sessionManager.updateConnection();
        const { sessionData } = connectionData || {};
        if (sessionData) {
          this.agent = sessionData?.agent;
          this._principalId = sessionData?.principalId || "aaaaa-aa";
          if (this._principalId) {
            this._accountId = AccountIdentifier.fromPrincipal({ principal: Principal.fromText(this._principalId) }).toHex();
          }
          this._accountId = sessionData?.accountId || this._accountId;
        }
      },
      false
    );
  };

  public async signMessage(message: ArrayBuffer | Buffer | ArrayBuffer): Promise<ArrayBuffer> {
    const messageToSign = parseMessageToString(message);
    console.log("Sign message command to execute externally:", messageToSign);
    return Buffer.from("dummy-signature"); // Dummy signed blob
  }
}