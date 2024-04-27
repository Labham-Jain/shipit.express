import * as fs from 'fs';
import * as path from 'path';
import yaml from 'yaml';
import { TemplateSource } from './template-source';
import { CONDITION_REGEX } from '../utils/regex';
import flattenKeys from '../utils/flattenKeys';

interface ListenerMap {
  steps: StepListener;
}

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
      const {title, name, ...options} = step;

      for(let i = 0; i < Object.keys(options).length; i++) {
        const conditionOrKey = Object.keys(options)[i];
        if(!(CONDITION_REGEX.test(conditionOrKey))) {
          await this.prompt('steps', {
            message: title,
            name: name,
            choices: (step[conditionOrKey] as {option: string}[]).map(({option}) => option),
          })
  
        } else {
          const condition = conditionOrKey;
          const matches = condition.match(CONDITION_REGEX);
          const optionName = matches![1];
          const optionValue = matches![2];
          const choices = this.getChoices(step[conditionOrKey] as any);
  
          if(this.store[optionName] === optionValue) {
            await this.prompt('steps', {
              message: title,
              name: name,
              choices: choices
            })
          }
        }
      }
    }

    this.executeSteps()
  }

  private async prompt(event: keyof ListenerMap, data: any) {
    for(const listener of this.listeners[event]!) {
      const result = await listener(data);
      this.store = {...this.store, ...result}
    }
  }

  private getChoices(obj: any) {

    const nextKey = Object.keys(obj)[0];
    if(nextKey !== 'options'){
      this.getChoices(obj[nextKey] as any);
    }
    return obj.options.map(({option} : any) => option)
  }

  executeSteps() {  
    if(!this.src?.execute) return;
    for (const execute of this.src.execute) {
      this.validateCondition(execute, (conditions) => {
        const command = this.getCommand(conditions);
        if(command) {
          console.log(command);
        }
      });
    }
  }

  private validateCondition(obj: any, onMatch?: (conditions: string[]) => void) {
    const commands = flattenKeys(obj); // get the second last key list

    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      const isConditionMatched = command.map((condition) => {
        const match = condition.match(CONDITION_REGEX)
        if(!match) return true;
  
        if(this.store[match[1]] === match[2]) {
          return true
        }
        return false
      }).every(Boolean);

      if(isConditionMatched){
        return onMatch?.(command);
      }
    }
    return false
  }

  private getCommand = (conditions: string[]) => {
    if(!this.src?.execute) return;

    for (const execute of this.src.execute) {
      const value = getValueFromPath(execute, conditions);
      if(value){
        return value
      }
    }
  }
}

function getValueFromPath(obj: any, path: any) {
  let value = obj;
  for (const key of path) {
    value = value[key];
    if (!value) return undefined; // If any key doesn't exist, return undefined
  }
  return value;
}