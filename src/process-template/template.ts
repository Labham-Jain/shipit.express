import * as fs from 'fs';
import * as path from 'path';
import yaml from 'yaml';
import { NestedValue, TemplateSource } from './template-source';

// Define a mapping between event names and their corresponding listener types
interface ListenerMap {
  steps: StepListener;
}

// Define listener types for each event
interface StepListener {
  (step: {
    message: string;
    name: string;
    choices: string[];
}): Promise<{[name: string]: string}>;
}

export class Template {
  src: TemplateSource | undefined = undefined;
  srcString: string | undefined = undefined;
  listeners: {
    [K in keyof ListenerMap]?: ListenerMap[K][]
  } = {};
  store: Record<any, any> = {}

  async execute(template: string) {
    this.srcString = fs.readFileSync(path.join(__dirname, '../templates', `${template}.yaml`), 'utf8');
    this.src = yaml.parse(this.srcString);

    await this.processSteps();

    return this;
  }

  forEach<T extends keyof ListenerMap>(event: T, listener: ListenerMap[T]) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event]!.push(listener);
  }

  private async processSteps() {
    if(!this.src?.steps) return ;
    for (const step of this.src.steps) {
      const {title, ...other} = step;

      const conditionOrKey = Object.keys(other)[0];
      if(!(/^\$([a-z]+(?:-[a-z]+)*)\((\w+)\)?$/.test(conditionOrKey))) {

        for(const listener of this.listeners.steps!) {
          const answer = await listener({
            message: title,
            name: conditionOrKey,
            choices: (step[conditionOrKey] as {name: string}[]).map(({name}) => name),
          });

          this.store = {...this.store, ...answer}
        }
      } else {
        const condition = conditionOrKey;
        const matches = condition.match(/\$([a-z]+(?:-[a-z]+)*)\((\w+)\)/);
        const optionName = matches![1];
        const optionValue = matches![2];
        if(this.store[optionName] === optionValue) {

          const nextKey = Object.keys(step[conditionOrKey])[0];

          for(const listener of this.listeners.steps!) {
            const answer = await listener({
              message: title,
              name: conditionOrKey,
              choices: ((step[conditionOrKey] as {[name: string]: ({name: string})[]})[nextKey]).map(({name}) => name),
            });
  
            this.store = {...this.store, ...answer}
          }
        }
      }
    }
  }
}
