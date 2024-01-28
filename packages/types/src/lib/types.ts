export type NonNullableProperties<T> = {
  [K in keyof T]-?: Exclude<T[K], null | undefined>
};
