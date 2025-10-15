// Google API TypeScript declarations
declare global {
  interface Window {
    gapi: {
      load: (api: string, callback: () => void) => void;
      auth2: {
        init: (config: { client_id: string }) => Promise<void>;
        getAuthInstance: () => {
          signIn: () => Promise<any>;
          signOut: () => Promise<void>;
          isSignedIn: {
            get: () => boolean;
          };
          currentUser: {
            get: () => any;
          };
        };
      };
    };
  }
}

export {};
