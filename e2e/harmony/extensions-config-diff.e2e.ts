import chai, { expect } from 'chai';

import Helper from '../../src/e2e-helper/e2e-helper';

chai.use(require('chai-fs'));

const assertArrays = require('chai-arrays');

chai.use(assertArrays);

describe('extensions config diff', function () {
  this.timeout(0);
  let helper: Helper;
  let beforeEject: string;
  before(() => {
    helper = new Helper();
    helper.scopeHelper.reInitLocalScope({ addRemoteScopeAsDefaultScope: false });
    helper.bitJsonc.disablePreview();
    helper.fixtures.populateExtensions(4);
    helper.fixtures.createComponentBarFoo();
    helper.fixtures.addComponentBarFooAsDir();
    helper.extensions.addExtensionToVariant('bar', 'my-scope/ext1', { key: 'val-variant' });
    helper.extensions.addExtensionToVariant('bar', 'my-scope/ext2', { key: 'val-variant' });
    helper.extensions.addExtensionToVariant('bar', 'my-scope/ext3', { key: 'val-variant' });
    helper.extensions.addExtensionToVariant('extensions', 'teambit.harmony/aspect');
    helper.command.install();
    helper.command.compile();
    helper.command.tagAllComponents();
    beforeEject = helper.scopeHelper.cloneLocalScope();
  });
  after(() => {
    helper.scopeHelper.destroy();
  });
  describe('component status and diff', () => {
    let output;
    describe('add new extension', () => {
      before(() => {
        reEjectAndCheckStatusBefore(helper, 'bar/foo@0.0.1');
        helper.componentJson.setExtension('my-scope/ext4', { key: 'val-component-json' });
      });
      it('should make the component modified', () => {
        output = helper.command.statusComponentIsModified('my-scope/bar/foo@0.0.1');
        expect(output).to.be.true;
      });
      it('should show it in bit diff', () => {
        output = helper.command.diff();
        expect(output).to.have.string('--- Extensions (0.0.1 original)');
        expect(output).to.have.string('+++ Extensions (0.0.1 modified)');
        expect(output).to.have.string('- [ ext1@0.0.1, ext2@0.0.1, ext3@0.0.1 ]');
        expect(output).to.have.string('+ [ ext1@0.0.1, ext2@0.0.1, ext3@0.0.1, ext4@0.0.1 ]');
        expect(output).to.have.string('--- Ext4@0.0.1 configuration (0.0.1 original)');
        expect(output).to.have.string('+++ Ext4@0.0.1 configuration (0.0.1 modified)');
        expect(output).to.have.string('+ "key": "val-component-json"');
      });
      it('bit diff should not show internal config fields', () => {
        output = helper.command.diff();
        expect(output).to.not.have.string('__specific');
      });
    });
    describe('remove extension', () => {
      before(() => {
        helper.scopeHelper.getClonedLocalScope(beforeEject);
        reEjectAndCheckStatusBefore(helper);
        helper.componentJson.removeExtension('my-scope/ext3@0.0.1');
      });
      it('should make the component modified', () => {
        output = helper.command.statusComponentIsModified('my-scope/bar/foo@0.0.1');
        expect(output).to.be.true;
      });
      it('should show it in bit diff', () => {
        output = helper.command.diff();
        expect(output).to.have.string('--- Extensions (0.0.1 original)');
        expect(output).to.have.string('+++ Extensions (0.0.1 modified)');
        expect(output).to.have.string('- [ ext1@0.0.1, ext2@0.0.1, ext3@0.0.1 ]');
        expect(output).to.have.string('+ [ ext1@0.0.1, ext2@0.0.1 ]');
        expect(output).to.have.string('--- Ext3@0.0.1 configuration (0.0.1 original)');
        expect(output).to.have.string('+++ Ext3@0.0.1 configuration (0.0.1 modified)');
        expect(output).to.have.string('- "key": "val-variant"');
      });
    });
    describe('change extension config', () => {
      before(() => {
        reEjectAndCheckStatusBefore(helper);
        helper.componentJson.setExtension('my-scope/ext2@0.0.1', { newKey: 'newVal' });
      });
      it('should make the component modified', () => {
        output = helper.command.statusComponentIsModified('my-scope/bar/foo@0.0.1');
        expect(output).to.be.true;
      });
      it('should show it in bit diff', () => {
        output = helper.command.diff();
        expect(output).to.have.string('--- Ext2@0.0.1 configuration (0.0.1 original)');
        expect(output).to.have.string('+++ Ext2@0.0.1 configuration (0.0.1 modified)');
        expect(output).to.have.string('- "key": "val-variant"');
        expect(output).to.have.string('+ "newKey": "newVal"');
      });
    });
    // Skipped for now, because of a bug will be unskipped after bug fix
    // TODO: make sure it works
    describe.skip('change extension version', () => {
      before(() => {
        reEjectAndCheckStatusBefore(helper);
        helper.command.tagComponent('ext1', 'sss', '-f');
        helper.componentJson.removeExtension('my-scope/ext1@0.0.21');
        helper.componentJson.setExtension('my-scope/ext1@0.0.2', { key: 'val' });
      });
      it('should make the component modified', () => {
        output = helper.command.statusComponentIsModified('my-scope/bar/foo@0.0.1');
        expect(output).to.be.true;
      });
      it('should show it in bit diff', () => {
        output = helper.command.diff();
        // TODO: add proper string here
        expect(output).to.have.string('aaaaaa');
      });
    });
  });
});

function reEjectAndCheckStatusBefore(helper, fullId = 'bar/foo') {
  helper.command.ejectConf('bar/foo', { override: '' });
  const output = helper.command.statusComponentIsModified(fullId);
  expect(output).to.be.false;
}
