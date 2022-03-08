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

  autoApproveOptions: {
    allowedUsernames: ['flyingImer'],
  },

  autoApproveUpgrades: true,

  codeCov: true,

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
    'all-contributors-cli', // for contributors
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

project.tsconfigDev.addInclude('example/**/*.ts');
// project.gitignore.exclude('.env');
project.gitignore.exclude('example/**/*.js', 'example/**/*.d.ts', 'example/cdk.out');

// for contributors
project.addTask('contributors:update', {
  exec: 'all-contributors check | grep "Missing contributors" -A 1 | tail -n1 | sed -e "s/,//g" | xargs -n1 | grep -v "[bot]" | xargs -n1 -I{} all-contributors add {} code',
});
project.npmignore.exclude('/.all-contributorsrc');

project.synth();