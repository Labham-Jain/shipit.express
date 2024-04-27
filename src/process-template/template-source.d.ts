type NestedValue<T> = {
  [x: string]: NestedValue<T> | T
}
type Step = {
  title: string;
  name: string;
} & NestedValue<{option: string}[]>

type Execute = {
  [x: string]: Execute | string
}

export type TemplateSource = {
  name: string;
  steps: Step[];
  execute: Execute[]
}