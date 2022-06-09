# aws-electron
Access the AWS Console using Access Keys and assumed roles.

## Development notes:
### Old dependency versions
1. `proxy-agent` can't be upgraded beyond 4.x as 5.x introduces `vm2` which
    webpack doesn't seem to be able to handle.
1. `copy-webpack-plugin` newer than 9.x segfaults
1. `react`, `react-dom`, `@types/react` and `@types/react-dom` don't seem to
    want to go newer than 17.x

