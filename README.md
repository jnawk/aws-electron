# aws-electron
Access the AWS Console using Access Keys and assumed roles.

## Development notes:
### Old dependency versions
1. `electron` can't be upgraded higher than 11.x without a bunch of work, to
   replaced the webView tag.  BrowserView looks promising.

1. `proxy-agent` can't be upgraded beyond 4.x as 5.x introduces `vm2` which webpack
   doesn't seem to be able to handle.
