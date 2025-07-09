declare module 'react' {
  import * as React from 'react';
  
  // Core React types
  export interface ReactElement<P = any, T extends string | React.JSXElementConstructor<any> = string | React.JSXElementConstructor<any>> {
    type: T;
    props: P;
    key: React.Key | null;
  }

  export interface ReactNode {
    children?: ReactNode;
  }

  export type FC<P = {}> = React.FunctionComponent<P>;
  export type FunctionComponent<P = {}> = (props: P) => ReactElement | null;

  // Hooks
  export function useState<S>(initialState: S | (() => S)): [S, React.Dispatch<React.SetStateAction<S>>];
  export function useState<S = undefined>(): [S | undefined, React.Dispatch<React.SetStateAction<S | undefined>>];
  
  export function useEffect(effect: React.EffectCallback, deps?: React.DependencyList): void;
  export function useCallback<T extends (...args: any[]) => any>(callback: T, deps: React.DependencyList): T;
  export function useMemo<T>(factory: () => T, deps: React.DependencyList): T;
  export function useRef<T>(initialValue: T): React.MutableRefObject<T>;
  export function useRef<T>(initialValue: T | null): React.RefObject<T>;
  export function useRef<T = undefined>(): React.MutableRefObject<T | undefined>;
  export function useContext<T>(context: React.Context<T>): T;
  export function createContext<T>(defaultValue: T): React.Context<T>;

  // Event types
  export interface SyntheticEvent<T = Element, E = Event> {
    target: T;
    preventDefault(): void;
    stopPropagation(): void;
  }

  export interface ChangeEvent<T = Element> extends SyntheticEvent<T> {
    target: T & {
      value: string;
      name?: string;
      checked?: boolean;
      type?: string;
    };
  }

  export interface MouseEvent<T = Element> extends SyntheticEvent<T> {
    shiftKey: boolean;
    clientX: number;
    clientY: number;
  }

  export interface FormEvent<T = Element> extends SyntheticEvent<T> {}

  // Context types
  export interface Context<T> {
    Provider: React.ComponentType<{ value: T; children?: ReactNode }>;
    Consumer: React.ComponentType<{ children: (value: T) => ReactNode }>;
  }

  // Ref types
  export interface MutableRefObject<T> {
    current: T;
  }

  export interface RefObject<T> {
    readonly current: T | null;
  }

  // Other types
  export type Key = string | number;
  export type ReactText = string | number;
  export type Dispatch<A> = (value: A) => void;
  export type SetStateAction<S> = S | ((prevState: S) => S);
  export type EffectCallback = () => (void | (() => void | undefined));
  export type DependencyList = ReadonlyArray<any>;
  export type JSXElementConstructor<P> = ((props: P) => ReactElement | null) | (new (props: P) => Component<P, any>);

  // Component class
  export class Component<P = {}, S = {}> {
    props: P;
    state: S;
    constructor(props: P);
    render(): ReactNode;
  }

  export default React;
}

declare module 'react/jsx-runtime' {
  export const jsx: any;
  export const jsxs: any;
  export const Fragment: any;
}

declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
  
  interface Element extends React.ReactElement<any, any> {}
}
