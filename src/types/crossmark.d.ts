declare global {
  interface Window {
    xrpl?: {
      crossmark?: {
        methods: {
          signInAndWait: () => Promise<{
            response: { data: { address: string } };
          }>;
          signAndSubmitAndWait: (tx: Record<string, unknown>) => Promise<{
            response: { data: { resp: { result: { hash: string } } } };
          }>;
        };
      };
    };
  }
}

export {};
