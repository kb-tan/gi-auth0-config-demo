#!/usr/bin/env ts-node
/// <reference path="declarations.d.ts"/>
import { dump } from 'auth0-deploy-cli';
import * as FS from 'fs';
import * as YAML from 'yaml';
import {
  copy_config,
  removeFolder,
  createFolder
} from './util';

const AUTH0_DOMAIN="auth0_domain";
const AUTH0_CLIENT_ID="auth0_client_id";
const TENANT="gi";
const PROJECTS ="projects";
const folder = "./cli-dump";
const tenants = YAML.parse(
  FS.readFileSync('tenants.yml', { encoding: 'utf8' })
);

const moveAuth0ConfigToProject = (
  sourceDir: string,
  destRootDir: string,
  project: string,
  config: any
) => {
  for(const item in config) {
    const serviceNames = config[item];
    serviceNames.forEach((name: string) => {
      copy_config(`${sourceDir}/${item}/${name}`, `${destRootDir}/${project}/${item}/${name}`);
    });
  }
}

const env = process.argv[2] ?? "dev";
const configInEnv = tenants[env][TENANT];
const init = async () => {
  const errors: any[] = [];
  const projects = configInEnv[PROJECTS];
  await Promise.all([
    new Promise((resolve, reject) => {
      let auth0Items:string[] = [];
      Object.keys(projects).forEach((name:string) => {
        Object.keys(projects[name]).forEach((item) => {
          auth0Items = auth0Items.concat(projects[name][item]);
        });
      });
      const duplicates = auth0Items.filter((item, index) => auth0Items.indexOf(item) !== index);
      if(duplicates.length > 0) {
        reject(`duplicated entry found [${duplicates.join(",")}]`)
      }
      resolve("");

    }), 
    new Promise(async (resolve, reject) => {
       // tslint:disable-next-line: one-variable-per-declaration
       const deploySecrets = {
         AUTH0_DOMAIN: configInEnv[AUTH0_DOMAIN],
         AUTH0_CLIENT_ID: configInEnv[AUTH0_CLIENT_ID],
         AUTH0_CLIENT_SECRET: process.env.AUTH0_CLIENT_SECRET
       };

      try {
        await createFolder(folder);
        await dump({
          output_folder: folder,
          config: {
            AUTH0_EXPORT_IDENTIFIERS: false,
            EXCLUDED_PROPS: {
              clientGrants: ['id'],
              rules: ['id'],
              hooks: ['id'],
              databases: ['id'],
              resourceServers: ['id'],
              connections: ['id', 'options.client_secret'],
            },
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
            AUTH0_ALLOW_DELETE: true,
            // ...tenants[tenant],
            ...deploySecrets,
            // AUTH0_KEYWORD_REPLACE_MAPPINGS: {
            //   ...tenants[tenant].AUTH0_KEYWORD_REPLACE_MAPPINGS,
            //   ...tenantSecrets,
            // },
          },
        });
        Object.keys(projects).forEach((project: string) => {
          moveAuth0ConfigToProject(folder, `tenants/${env}/${TENANT}/${PROJECTS}`, project, projects[project])
        });

        ['attack-protection', 'triggers'].forEach((config: string) => {
          copy_config(`${folder}/${config}`, `tenants/common/${TENANT}/${config}`);
        });

        removeFolder(folder);
        resolve("");
      } catch (e: any) {
        console.error(e);
        reject(`auth0-deploy-cli returned errors , ${e.message}`);
      }
    })
  ]);
};
// tslint:disable-next-line: no-floating-promises
init();
