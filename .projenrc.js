const { awscdk } = require('projen');

const project = new awscdk.AwsCdkConstructLibrary({
  author: 'Ej Wang',
  authorAddress: 'ej.wang.devs@gmail.com',

  cdkVersion: '2.63.0',

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
    'all-contributors-cli', // for contributors
    '@aws-cdk/aws-lambda-python-alpha', // for example/
  ], /* Build dependencies for this module. */
  // packageName: undefined,  /* The "name" in package.json. */
});

project.tsconfigDev.addInclude('example/**/*.ts');
project.gitignore.exclude('example/**/*.js', 'example/**/*.d.ts', 'example/cdk.out');

// for contributors
project.addTask('contributors:update', {
  exec: 'all-contributors check | grep "Missing contributors" -A 1 | tail -n1 | sed -e "s/,//g" | xargs -n1 | grep -v "[bot]" | xargs -n1 -I{} all-contributors add {} code',
});
project.npmignore.exclude('/.all-contributorsrc');

project.synth();