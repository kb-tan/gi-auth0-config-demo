#!/usr/bin/env ts-node
/// <reference path="declarations.d.ts"/>
import { deploy } from 'auth0-deploy-cli';
import * as FS from 'fs';
import * as YAML from 'yaml';
import {
  copy_config,
  clear_common_config,
  exclude_pages,
} from './util';
const fsSync= require('node:fs/promises');

const stage = process.env.STAGE ? process.env.STAGE : 'dev'; // Default to dev if STAGE unset
const deployFolderStr = './.deploy-temp';

const init = async () => {
  const errors: any[] = [];
  const env = process.argv[2] ?? "dev";
  const project = process.argv[3] ?? "all";
  const AUTH0_DOMAIN="auth0_domain";
  const AUTH0_CLIENT_ID="auth0_client_id";
  const TENANT="gi";
  const PROJECTS ="projects";
  const tenants = YAML.parse(
    FS.readFileSync('tenants.yml', { encoding: 'utf8' })
  );
  const configInEnv = tenants[env][TENANT];
  await Promise.all([
    new Promise(() => {
      copy_config(`tenants/common/gi`, deployFolderStr);
    }),
    new Promise((_, reject) => {
      if(process.argv.length === 2) {
        console.log("push args not provide, deploy all project under dev environment");
      }
      const projects = configInEnv[PROJECTS];
      const proccessedConfigs = Object.keys(projects)
        .filter((_project) => {
          return (_project === project || project === "all")
        }).map(async (project) => {
          const deploySecrets = {
            AUTH0_DOMAIN: configInEnv[AUTH0_DOMAIN],
            AUTH0_CLIENT_ID: configInEnv[AUTH0_CLIENT_ID],
            AUTH0_CLIENT_SECRET: process.env.AUTH0_CLIENT_SECRET
          };
          try {
            const deployFolder = FS.realpathSync(deployFolderStr);
            copy_config(`tenants/${stage}/gi/projects/${project}`, deployFolderStr);
            // if (tenants[tenant].SEEK_EXCLUDED_PAGES) {
            //   exclude_pages(tenants[tenant].SEEK_EXCLUDED_PAGES, folder);
            // }

            // if (tenants[tenant].SEEK_COMMON_CONFIG) {
            //   tenants[tenant].SEEK_COMMON_CONFIG.forEach(
            //     (commonConfigFolder: any) => {
            //       console.log(
            //         `Applying common config from: ${commonConfigFolder}`
            //       );
            //       apply_common_config(tenant, folder);
            //     }
            //   );
            // }
            // if (tenants[tenant]) {
            // } 
            await deploy({
              input_file: deployFolder,
              config: {
                AUTH0_INCLUDED_ONLY: [
                  "attackProtection",
                  "triggers",
                  "actions",
                  "clients",
                  "connections",
                  "customDomains",
                  "resourceServers",
                  "databases",
                ],
                AUTH0_ALLOW_DELETE: env === "prod" ? false : true,
                ...deploySecrets,
              }
            });
          } catch (e: any) {
            console.error(e);
            errors.push(
              `auth0-deploy-cli returned errors for ${stage}, ${e?.message}`
            );
          } finally {
            // if (tenants[tenant].SEEK_COMMON_CONFIG) {
            //   tenants[tenant].SEEK_COMMON_CONFIG.forEach(() => {
            //     if (folder !== '') {
            //       console.log(`Clearing common config`);
            //       // clear_common_config(tenant, region, folder);
            //     }
            //   });
            // }
          }
        });
        if(proccessedConfigs.length === 0) {
          reject("Not processed any project config");
        }
    })
  ]);
  if (errors.length > 0) {
    errors.forEach((e: any) => console.error(e));
    process.exit(1);
  }
};
// tslint:disable-next-line: no-floating-promises
init();
