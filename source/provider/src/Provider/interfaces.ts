// source/provider/src/Provider/interfaces.ts
import { Agent, HttpAgent, ActorSubclass } from "@dfinity/agent";
import { IDL } from "@dfinity/candid";
import { Principal } from "@dfinity/principal";
import { ConnectionData } from "../modules/SessionManager";

export interface CreateAgentParams {
  whitelist?: string[];
  host?: string;
}

export interface TransactionPrevResponse {
  transactionIndex: number;
  response: any;
}

export interface Transaction<SuccessResponse = unknown[]> {
  idl: IDL.InterfaceFactory;
  canisterId: string;
  methodName: string;
  args: (responses?: TransactionPrevResponse[]) => any[] | any[];
  onSuccess: (res: SuccessResponse) => Promise<any>;
  onFail: (err: any, responses?: TransactionPrevResponse[]) => Promise<void>;
}

export interface RequestConnectInput {
  canisters?: Principal[];
  timeout?: number;
}

export interface TimeStamp {
  timestamp_nanos: bigint;
}

export interface SendOpts {
  fee?: bigint;
  memo?: bigint;
  from_subaccount?: number;
  created_at_time?: TimeStamp;
}

export interface RequestTransferParams {
  to: string;
  amount: bigint;
  opts?: SendOpts;
}

export interface SendOptsToken {
  fee?: string;
  memo?: string;
  from_subaccount?: number;
  created_at_time?: TimeStamp;
}

export interface RequestTransTokenferParams {
  to: string;
  strAmount: string;
  opts?: SendOpts;
  token?: string;
}

export interface CreateActor<T> {
  agent: HttpAgent;
  actor: ActorSubclass<ActorSubclass<T>>;
  canisterId: string;
  interfaceFactory: IDL.InterfaceFactory;
  host?: string;
}

export interface RequestBurnXTCParams {
  to: string;
  amount: bigint;
}

export interface RequestConnectParams extends CreateAgentParams {
  timeout?: number;
  onConnectionUpdate?: (data: ConnectionData) => any;
}

export interface RequestImportTokenParams {
  canisterId: string;
  standard: string;
}

export interface ProviderInterfaceVersions {
  provider: string;
  extension: string;
}

export interface ICNSInfo {
  names: Array<string>;
  reverseResolvedName?: string;
}

export interface ProviderInterface {
  isConnected(): Promise<boolean>;
  disconnect(): Promise<void>;
  batchTransactions(transactions: Transaction[]): Promise<boolean>;
  requestBalance(accountId?: number | null): Promise<bigint>;
  requestTransfer(params: RequestTransferParams): Promise<bigint>;
  requestConnect(params: RequestConnectParams): Promise<any>;
  createActor<T>({
    canisterId,
    interfaceFactory,
  }: CreateActor<T>): Promise<ActorSubclass<T>>;
  createAgent(params: CreateAgentParams): Promise<boolean>;
  requestBurnXTC(params: RequestBurnXTCParams): Promise<any>;
  requestImportToken(params: RequestImportTokenParams): Promise<any>;
  getPrincipal({ asString }?: { asString?: boolean }): Promise<Principal | string | null>;
  versions: ProviderInterfaceVersions;
  agent?: Agent | null;
  principalId: string | undefined;
  accountId: string | undefined; // Added as property
  getICNSInfo: () => Promise<ICNSInfo>;
  signMessage: (message: ArrayBuffer | Buffer | ArrayBuffer) => Promise<ArrayBuffer>;
}

export interface SerializedPublicKey {
  rawKey: {
    type: string;
    data: Uint8Array;
  };
  derKey: {
    type: string;
    data: any;
  };
}

export interface SimplifiedRPC {
  start(): void;
  call(handler: string, args: any, options: any): Promise<any>;
}

export interface WalletConnectOptions {
  window: Window;
  debug?: boolean;
}