import { sha256 as jsSha256 } from "js-sha256";
import borc from "borc";
import { Buffer } from "buffer";
import {
  BinaryBlob,
  blobFromBuffer,
  blobFromUint8Array,
  blobToHex,
  lebEncode,
} from "@dfinity/candid";
import { Principal } from "@dfinity/principal";
import { TextEncoder } from 'text-encoding-shim';


export type RequestId = BinaryBlob & { __requestId__: void };
/**
 * get RequestId as hex-encoded blob.
 * @param requestId - RequestId to hex
 */
export function toHex(requestId: RequestId): string {
  return blobToHex(requestId);
}

/**
 * sha256 hash the provided Buffer
 * @param data - input to hash function
 */
export function hash(data: Buffer): BinaryBlob {
  const hashed: ArrayBuffer = jsSha256.create().update(data).arrayBuffer();
  return blobFromUint8Array(new Uint8Array(hashed));
}

interface ToHashable {
  toHash(): unknown;
}

function hashValue(value: any): BinaryBlob {
  if (value instanceof borc.Tagged) {
    return hashValue((value as borc.Tagged).value);
  } else if (typeof value === "string") {
    return hashString(value);
  } else if (typeof value === "number") {
    return hash(lebEncode(value));
  } else if (Buffer.isBuffer(value)) {
    return hash(blobFromUint8Array(new Uint8Array(value)));
  } else if (value instanceof Uint8Array || value instanceof ArrayBuffer) {
    return hash(blobFromUint8Array(new Uint8Array(value)));
  } else if (Array.isArray(value)) {
    const vals = value.map(hashValue);
    return hash(Buffer.concat(vals) as BinaryBlob);
  } else if (value instanceof Principal) {
    return hash(blobFromUint8Array(value.toUint8Array()));
  } else if (value._isPrincipal) {
    return hash(blobFromUint8Array(value._arr));
  } else if (
    typeof value === "object" &&
    value !== null &&
    typeof (value as ToHashable).toHash === "function"
  ) {
    return hashValue((value as ToHashable).toHash());
    // TODO This should be move to a specific async method as the webauthn flow required
    // the flow to be synchronous to ensure Safari touch id works.
    // } else if (value instanceof Promise) {
    //   return value.then(x => hashValue(x));
  } else if (typeof value === "bigint") {
    // Do this check much later than the other bigint check because this one is much less
    // type-safe.
    // So we want to try all the high-assurance type guards before this 'probable' one.
    return hash(lebEncode(value) as BinaryBlob);
  }
  throw Object.assign(
    new Error(
      `Attempt to hash a value of unsupported type: ${value} of type ${typeof value}`
    ),
    {
      // include so logs/callers can understand the confusing value.
      // (when stringified in error message, prototype info is lost)
      value,
    }
  );
}

const hashString = (value: string): BinaryBlob => {
  const encoder = new TextEncoder('utf-8');
  const encoded = encoder.encode(value);
  return hash(Buffer.from(encoded));
};

/**
 * Concatenate many blobs.
 * @param bs - blobs to concatenate
 */
function concat(bs: BinaryBlob[]): BinaryBlob {
  return blobFromBuffer(Buffer.concat(bs));
}

/**
 * Get the RequestId of the provided ic-ref request.
 * RequestId is the result of the representation-independent-hash function.
 * https://sdk.dfinity.org/docs/interface-spec/index.html#hash-of-map
 * @param request - ic-ref request to hash into RequestId
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function requestIdOf(request: Record<string, any>): RequestId {
  const hashed: Array<[BinaryBlob, BinaryBlob]> = Object.entries(request)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]: [string, unknown]) => {
      const hashedKey = hashString(key);
      const hashedValue = hashValue(value);

      return [hashedKey, hashedValue] as [BinaryBlob, BinaryBlob];
    });

  const traversed: Array<[BinaryBlob, BinaryBlob]> = hashed;

  const sorted: Array<[BinaryBlob, BinaryBlob]> = traversed.sort(
    ([k1], [k2]) => {
      return Buffer.compare(Buffer.from(k1), Buffer.from(k2));
    }
  );

  const concatenated: BinaryBlob = concat(sorted.map(concat));
  const requestId = hash(concatenated) as RequestId;
  return requestId;
}
