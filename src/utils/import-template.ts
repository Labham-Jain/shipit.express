import * as fs from 'fs';
import * as path from 'path';
import yaml from 'yaml';

const importTemplate = (template: string) => {
  const src = fs.readFileSync(path.join(__dirname, '../templates', `${template}.yaml`), 'utf8');

  const parsedYaml = yaml.parse(src);

  console.log(JSON.stringify(parsedYaml, null, 2));
  return src
}

export default importTemplate