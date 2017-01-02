declare module "sinon" {
  declare var assert: any;
  declare function spy(a: any): any;
  declare function mock<T>(a: T): T & {
    expects: (funcName: string) => any;
    verify: () => void;
  };
}
