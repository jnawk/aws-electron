# aws-electron
Access the AWS Console using Access Keys and assumed roles.

## Development notes:
### Old dependency versions
1. `proxy-agent` can't be upgraded beyond 4.x as 5.x introduces `vm2` which
    webpack doesn't seem to be able to handle.
1. `copy-webpack-plugin` newer than 9.x segfaults
1. `react`, `react-dom`, `@types/react` and `@types/react-dom` don't seem to
    want to go newer than 17.x

### TODOs
1.  `url.format` is depricated, but the alternative is rather shitty.  I'm
    thinking about reimplementing `url.format` to wrap the shittyness.
1.  I'm thinking to move the session expiration time display into the window
    title, which doubles the number of permutations for window title, so I've
    determined that `sprintf-js` should be good to use instead - user supplies
    format string, which references the system supplied potential fields.

    `%(title)s - %(profile)s - %(timeLeft)s left` might yield
    `AWS Console - myProfile - 0:30:25 left`, or perhaps the time component
    could be split out too, for
    `%(title)s - %(profile)s - %(timeLeft.hours)s hours, %(timeLeft.minutes)s minutes left`
    to spit out `AWS Console - myProfile - 0 hours, 30 minutes left`.  Plenty
    of options to explore.
