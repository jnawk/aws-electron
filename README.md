# aws-electron
Access the AWS Console using Access Keys and assumed roles.

## Development notes:
### Old dependency versions
1. `proxy-agent` can't be upgraded beyond 4.x as 5.x introduces `vm2` which
    webpack doesn't seem to be able to handle.
1. `copy-webpack-plugin` newer than 9.x segfaults
1. `react`, `react-dom`, `@types/react` and `@types/react-dom` don't seem to
    want to go newer than 17.x
1.  `urllib` doesn't seem to be able to go newer than 2.x (loses support for
    specifying a custom agent)
1.  `chai` doesn't want to be 4.3.6, that has bugs. 4.3.3 seems fine.

### TODOs
1.  `url.format` is depricated, but the alternative is rather shitty.  I'm
    thinking about reimplementing `url.format` to wrap the shittyness.
