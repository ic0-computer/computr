// source/bridge/inpage.ts
import { BrowserRPC } from '@fleekhq/browser-rpc';
import { Provider } from '../provider/src/index';

declare global {
  interface Window {
    ic: any;
  }
}

const clientRPC = new BrowserRPC(window, {
  name: 'computr-provider',
  target: 'computr-content-script',
  timeout: 0,
});
clientRPC.start();

async function setupProvider() {
  const provider = new Provider(clientRPC);
  await provider.init();

  try {
    const isConnected = await provider.isConnected();
    if (isConnected) {
      await provider.getPrincipal({ asString: true });
      console.log('✅ Principal ID and Account ID fetched on initialization:', {
        principalId: provider.principalId,
        accountId: provider.accountId,
      });
    } else {
      console.log('Domain not yet connected, principalId and accountId remain undefined');
    }
  } catch (error) {
    console.error('Error fetching principalId and accountId on initialization:', error);
  }

  const ic = window.ic || {};
  window.ic = {
    ...ic,
    computr: provider,
  };

  console.log('✅ inpage.js injected and initialized!', window.ic);
  return provider;
}

const providerPromise = setupProvider();
export default providerPromise;