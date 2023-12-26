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

export type ComponentChangeCallback = (changes: { area?: ValueChange }) => void;
export interface DOMBinderIO extends BinderIO {
  getArea(): string | null;
  onComponentChange(callback: ComponentChangeCallback): {
    stop: () => void;
  };
  clearWrite(items: WroteValues): Promise<void> | void;
}

export class StorageBinder {
  private readonly executor = new SerialTaskExecutor();
  private readonly areaIO = new FacadeAreaBinderIO();
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
    const domAreaListening = this.domIO.onComponentChange((c) => {
      let area;
      if (c.area === undefined) area = null;
      else area = c.area.newValue ?? "";
      this.updateComponents(area).catch(console.error);
    });
    this.stopListening = () => {
      domListening.stop();
      storageListening.stop();
      domAreaListening.stop();
    };

    await this.updateComponents(this.domIO.getArea() ?? "");
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

  private async updateComponents(area: string | null) {
    await this.executor.enqueue(async () => {
      if (area !== null) this.areaIO.updateArea(area);
      await this.domIO.clearWrite(await this.areaIO.readAll());
    });
  }
}
