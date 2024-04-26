type NestedValue<T> = {
  [x: string]: NestedValue<T> | T
}
type Step = {
  title: string;
} & NestedValue<{name: string, title: string}[]>

type Execute = {
  [x: string]: Execute | string
}

export type TemplateSource = {
  name: string;
  steps: Step[];
  execute: Execute[]
}