import inquirer from 'inquirer';
import {Template} from './process-template';
import yargs from 'yargs';
import path from 'path';

const main = async () => {
  const argv = (await yargs.parse(process.argv));
  const {_} = argv;
  const args = _.slice(2);

  const template = new Template()
  
  template.forEach('steps', (step) => {
    return new Promise<{[step: string]: any}>((resolve) => {
      inquirer
        .prompt([
          {
            choices: step.choices,
            type: 'list',
            name: step.name,
            message: step.message
          }
        ])
        .then((answers) => {
          resolve(answers)
        })
    })
  })

  template.execute(args[0].toString(), {directories: {current: process.cwd(), target: args[1]?.toString(), project: path.join(__dirname, '../')}});
}

main()