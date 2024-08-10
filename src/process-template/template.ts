import * as fs from 'fs';
import * as path from 'path';
import yaml from 'yaml';
import { TemplateSource } from './template-source';
import { CONDITION_REGEX } from '../utils/regex';
import flattenKeys from '../utils/flattenKeys';
import getValueFromPath from '../utils/getValueFromPath';
import { spawnSync } from 'child_process';
import * as child_process from 'child_process';

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

type TemplateExecuteOptions = {
  directories: {
    target: string;
    current: string;
    project: string;
  }
}


export class Template {
  src: TemplateSource | undefined = undefined;
  srcString: string | undefined = undefined;
  listeners: {
    [K in keyof ListenerMap]?: ListenerMap[K][]
  } = {};
  store: Record<any, any> = {}


  async execute(template: string, {directories}: TemplateExecuteOptions) {

    const cwd = path.join(directories.current, directories.target);
    fs.existsSync(cwd) || fs.mkdirSync(cwd);

    process.chdir(cwd);

    this.srcString = fs.readFileSync(path.join(__dirname, '../templates', `${template}.yaml`), 'utf8');
    this.src = yaml.parse(this.srcString);

    await this.processSteps();

    process.chdir(directories.current);
    return this;
  }

  forEach<T extends keyof ListenerMap>(event: T, listener: ListenerMap[T]) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event]!.push(listener);
  }

  private async processSteps() {
    if (!this.src?.steps) return;
    for (const step of this.src.steps) {
      const { title, name, ...options } = step;
  
      for (const [conditionOrKey, value] of Object.entries(options)) {
        if (!(CONDITION_REGEX.test(conditionOrKey))) {
          await this.prompt('steps', {
            message: title,
            name: name,
            choices: Array.isArray(value) ? value.map(({ option }: { option: string }) => option) : [],
          });
        } else {
          const [condition, optionValue] = this.parseCondition(conditionOrKey);
          const choices = this.getChoices(value);
  
          if (this.store[condition] === optionValue) {
            await this.prompt('steps', {
              message: title,
              name: name,
              choices: choices,
            });
          }
        }
      }
    }
  
    this.executeSteps();
  }

  private parseCondition(conditionOrKey: string): [string, string] {
    const matches = conditionOrKey.match(CONDITION_REGEX) || [];
    const [_, condition, optionValue] = matches;
    return [condition, optionValue];
  }

  private async prompt(event: keyof ListenerMap, data: any) {
    for (const listener of this.listeners[event]!) {
      const result = await listener(data);
      this.store = { ...this.store, ...result };
    }
  }

  private getChoices(obj: any): string[] {
    const nextKey = Object.keys(obj)[0];
    return nextKey === 'options' ? obj.options.map(({ option }: { option: string }) => option) : this.getChoices(obj[nextKey]);
  }

  private executeSteps() {
    if (!this.src?.execute) return;
    for (const execute of this.src.execute) {
      this.validateCondition(execute, (conditions) => {
        const executeConfig = this.getCommandConfig(conditions);
        if (executeConfig) {
          this.verifyRequiredScripts(executeConfig)
          spawnSync(executeConfig.command, { shell: true, stdio: 'inherit', cwd: process.cwd() });
        }
      });
    }
  }

  private validateCondition(obj: any, onMatch?: (conditions: string[]) => void) {
    const commands = flattenKeys(obj);

    for (const command of commands) {
      const isConditionMatched = command.every((condition: string) => {
        const match = condition.match(CONDITION_REGEX);
        if (!match) return true;
        return this.store[match[1]] === match[2];
      });

      if (isConditionMatched) {
        onMatch?.(command);
        return;
      }
    }
  }

  private getCommandConfig = (conditions: string[]) => {
    if (!this.src?.execute) return;
    for (const execute of this.src.execute) {
      const executeConfig = getValueFromPath(execute, conditions);
      if (executeConfig) {
        return executeConfig;
      }
    }
  }

  private verifyRequiredScripts(executeConfig: { command: string, requires: string [] }) {
    for (const requiredScript of executeConfig.requires) {
      try {
        const result = child_process.execSync(`which ${requiredScript}`);
        console.log('Script exists', result);
      } catch (error) {
        // try to download the script from installable scripts 
      }
    }
    return true
  }
}
