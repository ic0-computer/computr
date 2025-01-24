<script lang="ts">
  import { IDL } from "@dfinity/candid";
  export let message: string;
  export let idl: any[];
  export let call: IDL.Type;
</script>

<div>
  <h1>Computr</h1>
  <p>Message: {message}</p>
  <p>IDL: {JSON.stringify(idl)}</p>
  <p>
    Call: 
    {call && typeof call.display === 'function' 
      ? call.display() 
      : "Invalid or undefined call"}
  </p>
  <p>
    Args To String: 
    {idl.length > 0 && call && typeof IDL.FuncClass.argsToString === 'function'
      ? IDL.FuncClass.argsToString([call], idl)
      : "N/A"}
  </p>
  <button>Click</button>
</div>

<style>
  div {
    display: flex;
    justify-content: center;
    flex-direction: column;
    align-items: center;
  }
</style>
