---
title: Function Declarations vs Function Expressions
date: "2014-12-25T22:40:32.169Z"
layout: post
draft: false
path: "/posts/javascript-function-declarations-vs-function-expressions"
category: "JavaScript"
tags:
  - "JavaScript"
  - "Tutorial"
description: "A brief explanation of the difference between a function declaration and a function expression in JavaScript."
---

Debugging an AngularJS app the other day, I was frustrated because I could not step through a function expression. After researching JavaScript function declarations and expressions, the difference was clear but the reason to use one or the other was not.

Function declaration is standard in other languages so I set out to find the benefits of function expressions. Here are 3 points to shed light on the situation, from least convincing to most convincing.

1. **Function expressions avoid confusion**. Because function declarations are hoisted and their values are actually always declared at the top of the code, it can be confusing when you put a declaration at the bottom of your code and it turns out it’s declared at run time. Having programmed in several other languages, hoisting is such standard behavior that this point did not satisfy me.

2. **It looks cleaner because it’s a variable**. Because a function is a variable and represents a value, it looks much better when it’s shown as “myVar;” rather than “myVar();” This is true but the function declaration itself looks cleaner and more standard to me than a function expression so I was still unsatisfied. (See update at bottom)

3. **Use in conditional statements**. Because we can treat a function like a variable, we want to be able to assign values to it conditionally. If you try to do this with a function declaration, your second condition will always win out because those are hoisted and defined unconditionally (despite being in a conditional statement).

`gist:bradydowling/07b2cc2c1f35778c8a66#file-gistfile1-txt`

With expressions, you can appropriately assign different functions to a variable depending on other conditions.

`gist:bradydowling/ea419dcf149726244a10#file-gistfile1-txt`

The first source below says this is the only reason you should use function expressions and every other function should be declared. While I agree with this, it seems people are leaning toward expressions so the predominant use of declarations may be a dated practice. What are some other reasons you might use function expressions or function declarations?

### Sources
- [Functions: declarations and expressions](http://javascript.info/tutorial/functions-declarations-and-expressions)
- [Function Smackdown: Statement vs. Expression](http://www.unicodegirl.com/function-statement-versus-function-expression.html)

---

**Update (12/27/14):** My second point is incorrect. If you don’t call the function (whether instantiated by declaration or expression) with a set of parens after it then it will just return the function body.