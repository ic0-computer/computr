import {
  SignIdentity,
  PublicKey,
  ReadRequest,
  CallRequest,
} from "@dfinity/agent";
import { Principal } from "@dfinity/principal";
import { SerializedPublicKey } from "./Provider/interfaces";

type RequestType = ReadRequest | CallRequest;


export class PlugIdentity extends SignIdentity {
  /**
   * Transform a request into a signed version of the request. This is done last
   * after the transforms on the body of a request. The returned object can be
   * anything, but must be serializable to CBOR.
   * @param request - internet computer request to transform
   */
  public transformRequest;
  private publicKey: PublicKey;
  private whitelist: string[];
  constructor(publicKey: SerializedPublicKey, whitelist: string[]) {
    super();
    //@ts-ignore
    this.publicKey = {
      ...publicKey,
      toDer: () => publicKey.derKey?.data ?? publicKey.derKey,
    };
    this.whitelist = whitelist || [];
  }

  getPublicKey(): PublicKey {
    return this.publicKey;
  }

  //@ts-ignore
  async sign(_blob: ArrayBuffer, _signInfo?: RequestType): Promise<ArrayBuffer> {
    throw "DONT USE SIGN FROM IDENTITY";
  }

  getPrincipal(): Principal {
    if (!this._principal) {
      //@ts-ignore
      this._principal = Principal.selfAuthenticating(this.publicKey.toDer());
    }
    return this._principal;
  }
}
