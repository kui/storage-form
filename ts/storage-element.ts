export interface StorageElementMixin extends HTMLElement {
  storageArea: string;
}

/**
 * To prevent the element from being treated as a storage control.
 */
export interface StorageFormLikeElement extends HTMLElement {
  isNotStorageControl: boolean;
}
