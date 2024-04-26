import inquirer from 'inquirer';
import {Template} from './process-template';
import yargs from 'yargs';

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

  template.execute(args[0].toString());
}

main()