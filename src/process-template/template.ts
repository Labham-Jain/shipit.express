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

    await this.executeCommands();
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
      if(!(this.validateCondition(conditionOrKey))) {

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
        const matches = this.validateCondition(condition);

        if(matches === true){
          console.log(`failed to retrieve values from the condition!\n${condition}`);
          return;
        }

        if(!matches) {
          console.log(`failed to parse the condition!\n${condition}`);
          return;
        }

        const optionName = matches![1];
        const optionValue = matches![2];
        if(this.store[optionName] === optionValue) {

          const nextKey = Object.keys(step[conditionOrKey])[0];

          for(const listener of this.listeners.steps!) {
            const answer = await listener({
              message: title,
              name: nextKey,
              choices: ((step[conditionOrKey] as {[name: string]: ({name: string})[]})[nextKey]).map(({name}) => name),
            });
  
            this.store = {...this.store, ...answer}
          }
        }
      }
    }
  }

  private async executeCommands() {
  }

  private validateCondition(condition: string) {
    if(/^\$([a-z]+(?:-[a-z]+)*)\((\w+)\)?$/.test(condition)){
      const match = condition.match(/\$([a-z]+(?:-[a-z]+)*)\((\w+)\)/)
      if(match) {
        const optionName = match[1];
        const optionValue = match[2];

        if(this.store[optionName] !== optionValue) {
          return false
        } else {
          return [optionName, optionValue]
        }
      }
      return true
    }

    return false
  }
}
