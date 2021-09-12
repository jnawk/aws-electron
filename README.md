# aws-electron
Access the AWS Console using Access Keys and assumed roles.

## Development notes:
### Old dependency versions
1. `node-fetch` can't be upgraded to 3.x as it is an ES Module, which can't be
  imported from a CommonJS Module.  Switching to `"type": "module"` in
  `package.json` just makes it impossible to use `webpack`.
1. `electron` can't be upgraded beyond 10.x because shit breaks, I forget what.
