---
title: 'Browser Devtools Workshop'
layout: page
path: '/browser-devtools-workshop'
---

> “If debugging is the process of removing bugs, then programming must be the process of putting them in.”
- Edsger W. Dijkstra

## Debugging in code

Log statements:
- `console.log;`
- `console.time;`
- `console.error;`
- `console.warn;`
- `if (someBoolean) console.log;`

Debugger statements:
- `debugger;`
- `if (someBoolean) debugger;`

## Debugging in devtools (or IDE debugger)

### HTML
Inspector

### JavaScript
Logs:
- Inserting logs
- Inserting conditional logs

Breakpoints:
- Set breakpoint
- Set conditional breakpoint
**Challenge:** There’s some code to display the birthday for an array of users. They’re all fine besides this one. I know the user’s name is “Mark” but we have thousands of users and the API returns them in a different order each time. Set a conditional breakpoint in the code that iterates over the users and then find the bug. Is it an issue with the code or with the data?

While Debugging:
- Watch expressions
- Scope
- Console/debug terminal
**Challenge:** There’s some function that doesn’t work correctly. We’re pretty sure we have a fix for it (include the fix here). Place a breakpoint near that code than run the code that could fix it in the console to see if it returns what we’re expecting.

### CSS
Styles editor
**Challenge:** Which styles rule do you have to disable in order for 
