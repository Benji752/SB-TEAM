import type * as React from 'react';

declare module 'react' {
  interface HTMLAttributes<T> {
    class?: string | undefined;
  }
}

declare global {
  namespace JSX {
    interface IntrinsicAttributes {
      class?: string | undefined;
    }
  }
}
