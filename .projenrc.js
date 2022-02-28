const { awscdk, DependencyType } = require('projen');

const CDK_VERSION = '1.145.0';
const CONSTRUCT_VERSION = '3.3.69';

const project = new awscdk.AwsCdkConstructLibrary({
  author: 'Ej Wang',
  authorAddress: 'ej.wang.devs@gmail.com',

  // stick to monocdk for now
  cdkVersion: CDK_VERSION,
  cdkAssertions: false,
  cdkAssert: false,
  cdkDependenciesAsDeps: false,

  defaultReleaseBranch: 'main',
  name: 'cdk-concurrency-controller',
  repositoryUrl: 'https://github.com/flyingImer/cdk-concurrency-controller.git',
  stability: 'experimental',

  // deps: [],                /* Runtime dependencies of this module. */
  description: 'Controlling concurrency in your distributed systems.', /* The description is just a string that helps people understand the purpose of the package. */
  devDeps: [
    `monocdk@${CDK_VERSION}`,
    `@monocdk-experiment/assert@${CDK_VERSION}`,
    `constructs@${CONSTRUCT_VERSION}`,
  ], /* Build dependencies for this module. */
  peerDeps: [
    `monocdk@^${CDK_VERSION}`,
  ],
  // packageName: undefined,  /* The "name" in package.json. */
});
// remove all @aws-cdk deps to adopt monocdk
project.deps.all.filter(dep => dep.name.includes('@aws-cdk')).forEach(dep => project.deps.removeDependency(dep.name));
project.deps.removeDependency('constructs', DependencyType.PEER);
project.deps.addDependency(`constructs@^${CONSTRUCT_VERSION}`, DependencyType.PEER);

project.synth();