type NestedValue<T> = {
  [x: string]: NestedValue<T> | T
}
type Step = {
  title: string;
} & NestedValue<{name: string, title: string}[]>

type Execute = {

}

export type TemplateSource = {
  name: string;
  steps: Step[];
  execute: Execute[]
}