import path from "path";
import directoryState from "../../stores/directory.store"
import { copyFileSync, existsSync, lstatSync, mkdirSync, readdir } from "fs";

const copyResources = (resourceName: string) => {
  const {project, target, current} = directoryState.getState();
  const resourceFolder = path.join(project, 'dist/resources', resourceName);
  if (!existsSync(resourceFolder)) {
    throw new Error(`Resource folder does not exist!\n${resourceFolder}`);
  }
  readdir(resourceFolder, {recursive: true}, (err, files) => {
    if (err) {
      throw err;
    }
    for (const file of files) {
      const src = path.join(resourceFolder, file as string);
      const dest = path.join(current, target, file as string);
      const destFolder = path.dirname(dest);
      
      if(lstatSync(src).isDirectory()) {
        continue;
      }

      if (!existsSync(destFolder)) {
        mkdirSync(destFolder, {recursive: true});
      }
      
      copyFileSync(src, dest);
    }
  });
}

export default copyResources