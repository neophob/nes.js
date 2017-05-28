'use strict';

import test from 'ava';
import * as path from 'path';
import asyncFileRead from '../../../lib/file/read';

test('should fail to read file, no parameter', async t => {
  await t.throws(asyncFileRead.readFileAsArrayBuffer(), /path must be a/);
});

test('should fail to read file, invalid file', async t => {
  await t.throws(asyncFileRead.readFileAsArrayBuffer('foo.bar'), /ENOENT/);
});

test('should read file, read rom', t => {
  t.plan(4);
  return asyncFileRead.readFileAsArrayBuffer('./rom/croom.nes')
    .then((result) => {
      t.is(typeof result, 'object');
      const resultBuffer = Buffer.from(result);
      t.is(resultBuffer[0], 78);
      t.is(resultBuffer[1], 69);
      t.is(resultBuffer[2], 83);
    });
});

test('should read binary file, file.bin', t => {
  t.plan(5);
  return asyncFileRead.readFileAsArrayBuffer('./test/lib/file/file.bin')
    .then((result) => {
      t.is(typeof result, 'object');
      const resultBuffer = Buffer.from(result);
      t.is(resultBuffer[0], 49);
      t.is(resultBuffer[1], 50);
      t.is(resultBuffer[2], 51);
      t.is(resultBuffer[3], 52);
    });
});
