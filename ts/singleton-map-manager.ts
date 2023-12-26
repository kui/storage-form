import { SetMap } from "./maps.js";

export interface BorrowContainer<V, ReleaseReturn extends void | Promise<void>> {
  instance: V;
  release: () => ReleaseReturn | undefined;
}

export class SingletonMapManager<
  K,
  V extends NonNullable<unknown>,
  FactoryParameter extends unknown[] = [],
  ReleaseReturn extends void | Promise<void> = void,
> {
  private readonly instanceMap = new Map<K, V>();
  private readonly borrowingListMap = new SetMap();

  constructor(
    private readonly valueFactory: (key: K, ...args: FactoryParameter) => V,
    private readonly releaseCallback: (instance: V) => ReleaseReturn,
  ) {}

  get(key: K, ...args: FactoryParameter): BorrowContainer<V, ReleaseReturn> {
    let instance = this.instanceMap.get(key);
    if (!instance) {
      instance = this.valueFactory(key, ...args);
      this.instanceMap.set(key, instance);
    }
    const container: BorrowContainer<V, ReleaseReturn> = {
      get instance() {
        if (instance) {
          return instance;
        } else {
          throw Error("Already released");
        }
      },
      release: () => {
        const r = this.release(key, container);
        instance = undefined;
        return r;
      },
    };
    this.borrowingListMap.add(key, container);
    return container;
  }

  private release(
    key: K,
    container: BorrowContainer<V, ReleaseReturn>,
  ): ReleaseReturn | undefined {
    const containers = this.borrowingListMap.get(key);
    if (!containers) return;
    containers.delete(container);
    if (containers.size > 0) return;
    this.instanceMap.delete(key);
    return this.releaseCallback(container.instance);
  }
}
