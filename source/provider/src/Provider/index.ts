// source/provider/src/Provider/index.ts
import { Agent, Actor, ActorSubclass, PublicKey } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";
import { Buffer } from "buffer";
import { AccountIdentifier } from "@dfinity/ledger-icp";

import {
  managementCanisterIdlFactory,
  managementCanisterPrincipal,
  transformOverrideHandler,
} from "../utils/ic-management-api";
import { versions } from "../constants";
import {
  getArgTypes,
  ArgsTypesOfCanister,
  getSignInfoFromTransaction,
  parseMessageToString,
} from "../utils/sign";
import { createActor, createAgent, CreateAgentParams } from "../utils/agent";
import { recursiveParseBigint } from "../utils/bigint";
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
  TransactionPrevResponse,
  WalletConnectOptions,
} from "./interfaces";
import RPCManager from "../modules/RPCManager";
import SessionManager from "../modules/SessionManager";
import { validateCanisterId } from "../utils/account";
import { bufferToBase64 } from "../utils/communication";
import WalletConnectRPC from "../utils/wallet-connect-rpc";
import { BrowserRPC } from "@fleekhq/browser-rpc";

const rpcClient = new BrowserRPC(window, {
  name: "computr-provider",
  target: "computr-content-script",
  timeout: 10000,
});

rpcClient.start();

export default class Provider implements ProviderInterface {
  public agent?: Agent;
  public versions: ProviderInterfaceVersions = versions;
  private _principalId?: string;
  private _accountId?: string; // Private backing field for accountId
  public isWalletLocked: boolean = false;
  private clientRPC: RPCManager;
  private sessionManager: SessionManager;
  private idls: ArgsTypesOfCanister = {};

  // Getter for principalId
  public get principalId(): string | undefined {
    return this._principalId;
  }

  // Getter for accountId
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

    // Fetch principalId and accountId early if domain is approved
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
    (window as any).ic = {
      ...ic,
      computr: provider,
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
      this._principalId = sessionData?.principalId;
      if (this._principalId) {
        this._accountId = AccountIdentifier.fromPrincipal({ principal: Principal.fromText(this._principalId) }).toHex();
      }
      // Use sessionData.accountId if provided, otherwise keep computed value
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
      console.log("No principalId found in storage, returning null");
      this._principalId = undefined;
      this._accountId = undefined;
      return null;
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

  public async requestConnect(args: RequestConnectParams = {}) {
    const origin = window.location.origin;
    const response = await rpcClient.call("requestConnect", [{ origin }]);
    if (response === "Successfully connected!") {
      // Fetch principalId and compute accountId after successful connection
      try {
        const principal = await this.getPrincipal({ asString: true });
        console.log("Fetched principalId after requestConnect:", principal, "accountId:", this._accountId);
      } catch (error) {
        console.error("Failed to fetch principalId after requestConnect:", error);
      }
    }
    return response;
  }

  public async disconnect(): Promise<void> {
    const origin = window.location.origin;
    await rpcClient.call("disconnect", [{ origin }]);
    this._principalId = undefined;
    this._accountId = undefined; // Clear accountId on disconnect
    console.log("Disconnected, principalId and accountId cleared");
  }

  public async createActor<T>({
    canisterId,
    interfaceFactory,
  }: CreateActor<T>): Promise<ActorSubclass<T>> {
    if (!canisterId || !validateCanisterId(canisterId))
      throw Error("a canisterId valid is a required argument");
    if (!interfaceFactory)
      throw Error("interfaceFactory is a required argument");
    this.idls[canisterId] = getArgTypes(interfaceFactory);
    const connectionData = await this.sessionManager.getConnectionData();
    const agent = await createAgent(
      this.clientRPC,
      { whitelist: [canisterId], host: connectionData?.connection?.host },
      getArgTypes(interfaceFactory)
    );
    return createActor<T>(agent, canisterId, interfaceFactory);
  }

  public async createAgent({ whitelist, host }: CreateAgentParams = {}): Promise<any> {
    this.agent = await createAgent(this.clientRPC, { whitelist, host }, null);
    return !!this.agent;
  }

  public async requestBalance(accountId = null): Promise<bigint> {
    const balances = await this.clientRPC.call({
      handler: "requestBalance",
      args: [accountId],
    });
    return balances.map((balance) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { value, ...rest } = balance;
      return rest;
    });
  }

  public async requestTransfer(params: RequestTransferParams): Promise<bigint> {
    return await this.clientRPC.call({
      handler: "requestTransfer",
      args: [params],
    });
  }

  public async batchTransactions(transactions: Transaction[]): Promise<boolean> {
    const canisterList = transactions.map((transaction) => transaction.canisterId);
    const connectionData = await this.sessionManager.getConnectionData();

    const sender = (await this.getPrincipal({ asString: true })) as string;

    const signInfo = transactions
      .map((trx) => getSignInfoFromTransaction(trx, sender))
      .map((trx) =>
        recursiveParseBigint({
          ...trx,
          arguments: bufferToBase64(Buffer.from(trx.arguments)),
        })
      );

    const batchResponse = await this.clientRPC.call({
      handler: "batchTransactions",
      args: [signInfo],
    });

    if (!batchResponse.status) return false;

    const agent = await createAgent(
      this.clientRPC,
      {
        whitelist: canisterList,
        host: connectionData?.connection?.host,
      },
      null,
      batchResponse.txId
    );

    let transactionIndex = 0;
    let prevTransactionsData: TransactionPrevResponse[] = [];

    for await (const transaction of transactions) {
      const actor = await createActor(agent, transaction.canisterId, transaction.idl);
      const method = actor[transaction.methodName];
      try {
        let response: any;

        if (typeof transaction.args === "function") {
          if (prevTransactionsData) {
            response = await method(...transaction.args(prevTransactionsData));
          }

          if (!prevTransactionsData) {
            response = await method(...transaction.args());
          }
        } else if (Array.isArray(transaction.args)) {
          response = await method(...(transaction.args as unknown[]));
        } else {
          await transaction?.onFail(
            "Invalid transaction arguments, must be function or array",
            prevTransactionsData
          );
          break;
        }

        if (transaction?.onSuccess) {
          const chainedResponse = await transaction?.onSuccess(response);
          if (chainedResponse) {
            prevTransactionsData = [
              ...prevTransactionsData,
              { transactionIndex, response: chainedResponse },
            ];
          }
        }
      } catch (error) {
        if (transaction?.onFail) {
          await transaction.onFail(error, prevTransactionsData);
        }
        break;
      }
      transactionIndex++;
    }

    return true;
  }

  public async getICNSInfo(): Promise<ICNSInfo> {
    return await this.clientRPC.call({
      handler: "getICNSInfo",
      args: [],
    });
  }

  public async requestBurnXTC(params: RequestBurnXTCParams): Promise<any> {
    return await this.clientRPC.call({
      handler: "requestBurnXTC",
      args: [params],
    });
  }

  public async getManagementCanister() {
    if (!this.agent) {
      throw Error("Oops! Agent initialization required.");
    }

    return Actor.createActor(managementCanisterIdlFactory, {
      agent: this.agent,
      canisterId: managementCanisterPrincipal,
      ...{
        callTransform: transformOverrideHandler,
        queryTransform: transformOverrideHandler,
      },
    });
  }

  public async requestImportToken(params: RequestImportTokenParams): Promise<any> {
    return await this.clientRPC.call({
      handler: "requestImportToken",
      args: [params],
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
          this._principalId = sessionData?.principalId;
          if (this._principalId) {
            this._accountId = AccountIdentifier.fromPrincipal({ principal: Principal.fromText(this._principalId) }).toHex();
          }
          // Use sessionData.accountId if provided, otherwise keep computed value
          this._accountId = sessionData?.accountId || this._accountId;
        }
      },
      false
    );
  };

  public async signMessage(message: ArrayBuffer | Buffer | ArrayBuffer): Promise<ArrayBuffer> {
    const messageToSign = parseMessageToString(message);
    const response = await this.clientRPC.call({
      handler: "requestSignMessage",
      args: [messageToSign],
    });
    console.log(response);
    return response;
  }
}