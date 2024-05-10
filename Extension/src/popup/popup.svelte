<script lang="ts">
  import { IDL } from "@dfinity/candid";
  export let message: string;
  export let idl: any[];
  export let call: IDL.Type;
</script>

<div>
  <h1>Computr</h1>
  <p>Message: </p>
  <p>{message}</p>
  <p>{idl}</p>
  <p>{call}</p>
  <p>{IDL.FuncClass.argsToString([call], idl)}</p>
  <button>Click</button>
</div>

<style>
  div {
    display: flex;
    justify-content: center;
  }
</style>
