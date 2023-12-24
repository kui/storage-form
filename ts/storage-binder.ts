import { FacadeAreaBinderIO } from "./area-handler.js";
import { SerialTaskExecutor } from "./promises.js";

export interface ValueChange {
  oldValue?: string;
  newValue?: string;
}

export type ValueChanges = Map<string, ValueChange>;

export type StoredValues = Map<string, string>;

export type WroteValues = Map<string, string | undefined>;

interface BinderIO {
  write(items: WroteValues): Promise<void> | void;
  onChange(callback: (changes: ValueChanges) => void | Promise<void>): {
    stop: () => void;
  };
}

export interface AreaBinderIO extends BinderIO {
  read(names: string[]): Promise<StoredValues> | StoredValues;
  readAll(): Promise<StoredValues> | StoredValues;
}

export interface DOMBinderIO extends BinderIO {
  getArea(): string | null;
  onAreaChange(callback: (changes: ValueChange) => void): { stop: () => void };
}

export class StorageBinder {
  private readonly executor = new SerialTaskExecutor();
  private readonly areaIO = new FacadeAreaBinderIO();
  private isInitialized = false;
  private stopListening: (() => void) | null = null;

  constructor(private readonly domIO: DOMBinderIO) {}

  async start() {
    if (this.isInitialized) throw Error("Already initialized");
    this.isInitialized = true;

    const domListening = this.domIO.onChange((c) =>
      this.writeChanges(this.areaIO, c),
    );
    const storageListening = this.areaIO.onChange((c) =>
      this.writeChanges(this.domIO, c),
    );
    const domAreaListening = this.domIO.onAreaChange((c) => {
      this.updateArea(c.newValue ?? null).catch(console.error);
    });
    this.stopListening = () => {
      domListening.stop();
      storageListening.stop();
      domAreaListening.stop();
    };

    await this.updateArea(this.domIO.getArea());
  }

  stop() {
    if (!this.isInitialized) throw Error("Not initialized");
    this.isInitialized = false;

    this.stopListening?.();
    this.stopListening = null;
  }

  private async writeChanges(to: BinderIO, changes: ValueChanges) {
    const newValues = new Map<string, string | undefined>();
    for (const [name, change] of changes) newValues.set(name, change.newValue);
    if (newValues.size > 0) {
      await this.executor.enqueue(async () => {
        await to.write(newValues);
      });
    }
  }

  private async updateArea(area: string | null) {
    await this.executor.enqueue(async () => {
      this.areaIO.updateArea(area);
      await this.domIO.write(await this.areaIO.readAll());
    });
  }
}
