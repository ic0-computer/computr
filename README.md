# Computr Wallet Interface

Computr is a wallet interface for the Internet Computer, designed to be the safest way to interact with IC dapps. Unlike traditional wallets, Computr does not store secret keys within the extension itself. Instead, it provides a secure and user-friendly way to interact with IC dApps by displaying commands for external signing, allowing users to execute transactions via an external program and even air-gapped machines, making it even safer than DFINITY's own Oisy wallet.

## Features

- Plug-Compatible API: Exposes endpoints matching Plug Wallet (e.g., requestConnect, createActor, requestTransfer), ensuring compatibility with existing IC dApps.
- External Signing Workflow: Displays Candid-encoded commands (e.g., dfx canister call) in a popup for users to execute externally, then accepts signed responses to complete transactions.
- No Secret Key Storage: Enhances security by delegating signing to external tools, avoiding key management within the extension.
- Browser RPC Architecture: Uses a robust communication system between in-page scripts, content scripts, and the background script for secure message passing.

## Installation

1. Clone the Repository:
   git clone <repository-url>
   cd computr-wallet

2. Install Dependencies:
   bun install

3. Build the Extension:
   bun run build

4. Load into Browser:
   - Open your browser (e.g., Chrome, Firefox).
   - Navigate to the extensions page (e.g., chrome://extensions/).
   - Enable "Developer mode".
   - Click "Load unpacked" and select the dist/ folder.

## Usage

### Connecting to a dApp
await window.ic.computr.requestConnect();
console.log(window.ic.computr.principalId);

### Creating an Actor and Calling a Method
const icrcTokenIdlFactory = ({ IDL }) => IDL.Service({
  icrc2_approve: IDL.Func([IDL.Record({
    amount: IDL.Nat,
    spender: IDL.Principal,
    expires_at: IDL.Opt(IDL.Nat64),
    expected_allowance: IDL.Opt(IDL.Nat),
    memo: IDL.Opt(IDL.Vec(IDL.Nat8)),
    fee: IDL.Opt(IDL.Nat),
    from_subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)),
    created_at_time: IDL.Opt(IDL.Nat64)
  })], [IDL.Variant({ Ok: IDL.Nat, Err: IDL.Text })], ['update'])
});

const actor = await window.ic.computr.createActor({
  canisterId: "ss2fx-dyaaa-aaaar-qacoq-cai",
  interfaceFactory: icrcTokenIdlFactory,
});

const principal = await window.ic.computr.principalFromText("aaaaa-aa");
const approveArgs = {
  amount: 1000n,
  spender: principal,
  expires_at: [],
  expected_allowance: [],
  memo: [],
  fee: [],
  from_subaccount: [],
  created_at_time: []
};

const result = await actor.icrc2_approve(approveArgs);
console.log(result);

- Popup Display: When calling icrc2_approve, a popup shows:
  dfx canister call ss2fx-dyaaa-aaaar-qacoq-cai icrc2_approve '(record { amount = 1000; spender = principal "aaaaa-aa"; expires_at = opt null; ... })'
- Workflow: Copy the command, execute it externally (e.g., via dfx), paste the signed response, and submit.

## How It Works

1. dApp Interaction: The dApp calls methods via window.ic.computr, which routes requests through the Provider.
2. Command Generation: ExternalSignAgent decodes arguments using IDL.decode and generates Candid strings with argsToString.
3. Popup Prompt: The background script triggers a signing popup displaying the dfx command.
4. External Signing: Users execute the command externally and return the signed response (base64-encoded).
5. Response Relay: The signed response is relayed back to the dApp via the actor.

## License

TBD

## Acknowledgments

- Built with inspiration from [Plug Wallet](https://plugwallet.ooo/).