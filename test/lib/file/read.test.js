'use strict';

import test from 'ava';
import * as path from 'path';
import asyncFileRead from '../../../lib/file/read';

test('should fail to read file, no parameter', async t => {
  await t.throws(asyncFileRead.readFileAsBuffer(), /path must be a/);
});

test('should fail to read file, invalid file', async t => {
  await t.throws(asyncFileRead.readFileAsBuffer('foo.bar'), /ENOENT/);
});

test('should read file, package.json', t => {
  t.plan(3);
  return asyncFileRead.readFileAsBuffer('package.json')
    .then((result) => {
      t.regex(result, /nes/);
      t.regex(result, /devDependencies/);
      t.is(typeof(result), 'string')
    });
});

test('should read file, read rom', t => {
  t.plan(3);
  return asyncFileRead.readFileAsBuffer('./rom/croom.nes')
    .then((result) => {
      t.is(result[0], 'N');
      t.is(result[1], 'E');
      t.is(result[2], 'S');
    });
});
