import { FacadeAreaHandler } from "./area-handler.js";
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
}

export interface ComponentChangeEvent {
  area?: string;
  names: string[];
}
export type ComponentChangeCallback = (event: ComponentChangeEvent) => void;
export interface DOMBinderIO extends BinderIO {
  getArea(): string | null;
  getNames(): string[];
  onComponentChange(callback: ComponentChangeCallback): {
    stop: () => void;
  };
  clearWrite(items: WroteValues): Promise<void> | void;
}

export class StorageBinder {
  private readonly executor = new SerialTaskExecutor();
  private readonly areaIO = new FacadeAreaHandler();
  private isStarted = false;
  private stopListening: (() => void) | null = null;

  constructor(private readonly domIO: DOMBinderIO) {}

  async start() {
    if (this.isStarted) throw Error("Already started");
    this.isStarted = true;

    const domListening = this.domIO.onChange((c) =>
      this.writeChanges(this.areaIO, c),
    );
    const storageListening = this.areaIO.onChange((c) =>
      this.writeChanges(this.domIO, c),
    );
    const domAreaListening = this.domIO.onComponentChange((event) => {
      const { area, names } = event;
      this.updateComponents(area, names).catch(console.error);
    });
    this.stopListening = () => {
      domListening.stop();
      storageListening.stop();
      domAreaListening.stop();
    };

    await this.updateComponents(
      this.domIO.getArea() ?? "",
      this.domIO.getNames(),
    );
  }

  stop() {
    if (!this.isStarted) throw Error("Not started");
    this.isStarted = false;

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

  private async updateComponents(area: string | undefined, names: string[]) {
    await this.executor.enqueue(async () => {
      if (area !== undefined) this.areaIO.updateArea(area);
      await this.domIO.clearWrite(await this.areaIO.read(names));
    });
  }
}
