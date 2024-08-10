import inquirer from 'inquirer';
import {Template} from './process-template';
import yargs from 'yargs';
import path from 'path';

const main = async () => {
  const argv = (await yargs.parse(process.argv));
  const {_, $0, ...options} = argv;
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
  });


  const templateName = (options.template && typeof options.template === 'string' ? options.template : false) || args[0]?.toString();
  if (!templateName) {
    console.error('No template name provided');
    process.exit(1);
  }

  const targetPath = (options.dir && typeof options.dir === 'string' ? options.dir : false) || args[1]?.toString();

  if (!targetPath) {
    console.error('No target path provided');
    process.exit(1);
  }

  template.execute(templateName, {directories: {current: process.cwd(), target: targetPath, project: path.join(__dirname, '../')}});
}

main()