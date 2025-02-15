import {
  QueryFields,
  Identity,
  QueryResponse,
  SubmitResponse,
  ReadStateOptions,
  ReadStateResponse,
} from "@dfinity/agent";
import {
  BinaryBlob,
  IDL,
} from "@dfinity/candid";
import { Principal } from "@dfinity/principal";
import { Buffer } from "buffer";

import RPCManager from "../../modules/RPCManager";
import { recursiveParseBigint } from "../bigint";
import { base64ToBuffer, bufferToBase64 } from "../communication";

// Define locally the missing QueryResponseStatus
const QueryResponseStatus = {
  Replied: "replied",
  Rejected: "rejected",
};

export const callMethodFactory =
  (clientRPC: RPCManager, batchTxId = "", idl: null | { [key: string]: any }) =>
  async (
    canisterId: Principal | string,
    options: {
      methodName: string;
      arg: BinaryBlob;
      effectiveCanisterId?: Principal | string;
    },
    identity?: Identity | Promise<Identity>
  ): Promise<SubmitResponse> => {
    let decodedArgs = null;
    if (idl) {
      decodedArgs = recursiveParseBigint(
        IDL.decode(idl[options.methodName], options.arg)
      );
    }
    const arg = bufferToBase64(Buffer.from(options.arg));
    const result = await clientRPC.call({
      handler: "requestCall",
      args: [
        {
          canisterId: canisterId.toString(),
          methodName: options.methodName,
          arg,
          effectiveCanisterId: options.effectiveCanisterId?.toString(),
        },
        batchTxId,
        decodedArgs,
      ],
    });

    if (result.error) throw result.error.message;

    return {
      ...result,
      requestId: Buffer.from(
        new Uint8Array(base64ToBuffer(result.requestId))
      ),
    };
  };

export const queryMethodFactory =
  (clientRPC: RPCManager, batchTxId = "") =>
  async (
    canisterId: Principal | string,
    fields: QueryFields,
    identity?: Identity | Promise<Identity>
  ): Promise<QueryResponse> => {

    const result = await clientRPC.call({
      handler: "requestQuery",
      args: [
        {
          canisterId: canisterId.toString(),
          methodName: fields.methodName,
          arg: bufferToBase64(Buffer.from(fields.arg)),
        },
        batchTxId,
      ],
    });

    if (result.error) throw result.error.message;

    return result.status === QueryResponseStatus.Replied
      ? {
          ...result,
          reply: {
            arg: Buffer.from(
              new Uint8Array(base64ToBuffer(result.reply.arg))
            ),
          },
        }
      : {
          ...result,
        };
  };

export const readStateMethodFactory =
  (clientRPC: RPCManager, batchTxId = "") =>
  async (
    canisterId: Principal | string,
    fields: ReadStateOptions,
    identity?: Identity | Promise<Identity>
  ): Promise<ReadStateResponse> => {
    const paths = fields.paths[0].map((path) =>
      bufferToBase64(Buffer.from(path))
    );

    try {
      const result = await clientRPC.call({
        handler: "requestReadState",
        args: [
          {
            canisterId: canisterId.toString(),
            paths,
          },
          batchTxId,
        ],
      });

      if (result.error) throw result.error.message;

      return {
        certificate: Buffer.from(
          new Uint8Array(base64ToBuffer(result.certificate))
        ),
      };
    } catch (e) {
      throw e;
    }
  };
