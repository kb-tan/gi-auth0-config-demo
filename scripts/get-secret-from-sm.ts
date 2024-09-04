#!/usr/bin/env ts-node

import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';
import { basename } from 'path';

if (process.argv.length < 3) {
  console.error(
    `Usage: ${basename(__filename)} <aws-secret-name> [aws-secret-key-name]`
  );
  process.exit(1);
}

const secretsmanager = new SecretsManagerClient({ region: 'ap-southeast-2' });

secretsmanager
  .send(new GetSecretValueCommand({ SecretId: process.argv[2] }))
  .then(
    (data) => {
      let returnVal: string = '';
      switch (process.argv.length) {
        case 3:
          returnVal = `${data.SecretString}`;
          break;
        case 4:
          returnVal = `${JSON.parse(data.SecretString || '')[process.argv[3]]}`;
          break;
        default:
          break;
      }
      process.stdout.write(returnVal, console.error);
    },
    (err) => {
      console.log(err, err.stack);
    }
  );
