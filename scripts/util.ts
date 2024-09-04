#!/usr/bin/env node
import * as FS from 'fs-extra';

const exclude_pages = (listOfPages: any, folder: any) => {
  if (listOfPages) {
    listOfPages.map((page: any) => {
      if (FS.existsSync(`${folder}/pages/`)) {
        const list = FS.readdirSync(`${folder}/pages/`);
        list
          .filter((filename) => filename.includes(page))
          .map((filename) => {
            console.log(`removing: ${filename}`);
            FS.unlinkSync(`${folder}/pages/${filename}`);
          });
      }
    });
  }
};

const removeFolder = (dir: string) => {
  console.log('remove folder');
  FS.removeSync(dir);
}

const createFolder = async (dir: string) => {
  FS.mkdirp(dir);
}

const copy_config = (source: any, destination: any) => {
  console.log(`${source} --> ${destination}`);
  const sourceConfigFolder = FS.realpathSync(source);
  FS.copySync(sourceConfigFolder, destination);
};

const clear_common_config = (tenant: any, region: any, destination: any) => {
  const commonConfigFolder = FS.realpathSync(
    `tenants/common/${region}/${tenant}`
  );
  FS.copySync(commonConfigFolder, destination, {
    filter: (file: string) => {
      const destFile = file.replace(commonConfigFolder, destination);
      if (FS.existsSync(destFile)) {
        if (FS.lstatSync(destFile).isDirectory()) {
          return true;
        }
        console.log('Removing', destFile);
        try {
          FS.removeSync(destFile);
        } catch (e) {
          console.log(e);
        }
        return false;
      }
      return false;
    },
  });
};

export { exclude_pages, copy_config, clear_common_config, removeFolder, createFolder };
