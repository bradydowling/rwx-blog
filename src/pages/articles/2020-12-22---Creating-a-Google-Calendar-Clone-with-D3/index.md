---
title:  "Creating a Google Calendar Clone with D3"
date: "2020-12-22T20:03:48.744Z"
layout: post
draft: true
path: "/posts/google-calendar-clone-d3/"
category: "Tutorial"
tags:
- "Tutorial"
description: "D3 might not be the best tool for the job but we'll learn a lot about D3 as we use it to make a Google Calendar clone"
---

Building a clone of a well-known application or site is a great way to learn a new technology or level up knowledge you already have. So while D3 might not be the first tool you'd reach for to build a calendar app, let's dig in and see what we can learn about it by building a Google Calendar clone.

For simplicity, we'll create a directory then scaffold our app using Snowpack. From the command line, run the following (you can also run the `yarn` equivalents if that's your thing):

```
mkdir calendar-clone
cd calendar-clone
npm install --save-dev snowpack
npx snowpack
```

One of the most common pieces of using D3 is pulling in and parsing data. For this tutorial, we can just make our own JSON object, which means we bypass the data manipulation that would take place in most data visualization projects. So let's start by creating an `index.js` file (where we'll be doing the rest of our work), importing D3, and declaring some calendar events.

```
// index.js

import * as d3 from 'd3';

const calendarEvents = [
  {
    timeFrom: '2020-11-11T1:00:00.000Z',
    timeTo: '2020-11-11T12:00:00.000Z',
    title: 'Food eating',
    background: '#fff'
  },
  {
    timeFrom: '2020-11-11T16:00:00.000Z',
    timeTo: '2020-11-11T17:30:00.000Z',
    title: 'Business meeting'
  },
  {
    timeFrom: '2020-11-11T19:30:00.000Z',
    timeTo: '2020-11-11T21:00:00.000Z',
    title: 'Birthday party',
    background: '#fff'
  }
];

// Make an array of dates to use for our yScale later on
const dates = [
  ...data.map(d => new Date(d.timeFrom)),
  ...data.map(d => new Date(d.timeTo))
];
```

We can declare a few variables that are typically part of D3 projects:

```
const margin = { top: 30, right: 30, bottom: 30, left: 50 }; // Gives space for axes and other margins
const height = 1500;
const width = 900;
const barWidth = 600;
const nowColor = '#EA4335';
```

Now let's get something to display on the page so we can see that stuff is working.

```
const svg = d3
    .create('svg')
    .attr('width', width)
    .attr('height', height);
```

When we open up the browser, we won't notice anything at first but there will be a big SVG element on the page. You can confirm this by opening your browser devtools and inspecting the elements on the page. This is a great way of debugging issues with D3 as your code will change what SVG elements are on the page and what properties they have.

Now let's add in our scale functions, which are often called `x` or `xScale` and `y` or `yScale`. These functions are used to map points in our data to a pixel value on our visualization. So if we had data points for 1 through 100 mapped along the y-axis then this function would map 82 to be toward the top of our SVG object (82% the way up, to be exact).

A lot of times you'd put time on the x-scale, but for our calendar application time is plotted vertically so we'll make it on the y-scale. And for simplicity, we'll just build a single-day calendar so we don't actually need an x-scale.

```
const yScale = d3
  .scaleTime()
  .domain([d3.min(dates), d3.max(dates)])
  .range([margin.top, height - margin.bottom]);
```

Notice that we pass in our _data_ range to `domain` and our _pixel_ range to `range`. Also notice that to the  `range` function we first pass the `margin.top`, rather than the bottom. This is because SVG are drawn from top to bottom, so the 0 y-coordinate will be at the top.

We'll use the scale mapping we just created later on but first, let's draw the actual y-axis itself:

```
const yAxis = d3
  .axisLeft()
  .ticks(24)
  .scale(yScale);

// We'll be using this svg variable throughout to append other elements to it
svg
  .append('g')
  .attr('transform', `translate(${margin.left},0)`)
  .attr('opacity', 0.5)
  .call(yAxis);
```

We created an axis, specified that it will be on the left side of our chart, specified that we want 24 tick marks on the axis, and applied the scale we created to it. Then we used our `append` function to actually put the axis into a `g` element within our `svg` element. Inspect the elements you have so far in your browser devtools to see how this is shaking out.

And since it's a calendar, let's add some grid lines. For our `yAxis`, we set the ticks to be `24`, one for each hour of the day. We'll do the same with our grid lines, which will now use `axisRight` so the "ticks" show on the right side:

```
const gridLines = d3
  .axisRight()
  .ticks(24)
  .tickSize(barStyle.width) // even though they're "ticks" we've set them to be full-width
  .tickFormat('')
  .scale(yScale);

svg
  .append('g')
  .attr('transform', `translate(${margin.left},0)`)
  .attr('opacity', 0.3)
  .call(gridLines);
```

Again, we've placed our axis within a `g` element and appended that to our `svg` element. Checkout our browser devtools now to see the DOM structure.

Now that we have our axis and gridlines showing up we can use the data object we created to add in some calendar events. As part of this, we use the [`join`](https://observablehq.com/@thetylerwolf/day-18-join-enter-update-exit) method to add `g` elements to our `svg` element. This means we'll select all existing `g` elements (none exist yet) and join a new `g` element for each `data` item that exists. So this is the code we add to make that happen:

```
  const barGroups = svg
    .selectAll('g')
    .data(data)
    .join('g');
```

Looking at the browser devtools you can now see that we've got 3 (the length of our events list) empty `g` items within our `svg` element.

Now that we have those `g` items and they each have a calendar event bound to them, we can append other elements to them. Let's do the `rect` elements now to show as colored rectangles for our calendar events:

```
  barGroups
    .append('rect')
    .attr('fill', d => d.background)
    .attr('opacity', barStyle.opacity.default)
    .attr('x', margin.left)
    .attr('y', d => yScale(new Date(d.timeFrom)) + barStyle.startPadding)
    .attr('height', d => {
      const startPoint = yScale(new Date(d.timeFrom));
      const endPoint = yScale(new Date(d.timeTo));
      return (
        endPoint - startPoint - barStyle.endPadding - barStyle.startPadding
      );
    })
    .attr('width', barStyle.width)
    .attr('rx', barStyle.radius);
```

We do some math and calculations to figure out where the rectangle should start vertically and how tall it should be. If you read the code for a minute, you can probably figure out why we're doing that but it may be just as helpful to change the math there to see how that affects the app. Change it back after you've played with it a bit.

Using a similar approach, let's add in a line for tracking the current time, so users can see where "now" is on the calendar.

```
  barGroups
    .append('rect')
    .attr('fill', nowColor)
    .attr('x', margin.left)
    .attr('y', yScale(currentTimeDate) + barStyle.startPadding)
    .attr('height', 2)
    .attr('width', barStyle.width);
```

Note that we've again used the `margin` variable we declared at the start to make sure our rectangles aren't going to overlap our axis.

Then let's add some labels for the events we have on our calendar. We'll again use the `append` method, but this time we'll add a `text` element to our `barGroups` variable:

```
  barGroups
    .append('text')
    .attr('font-family', 'Roboto')
    .attr('font-size', 12)
    .attr('font-weight', 500)
    .attr('text-anchor', 'start')
    .attr('fill', d => d.background)
    .attr('x', margin.left + 10)
    .attr('y', d => yScale(new Date(d.timeFrom)) + 20)
    .text(d => d.title);
```


And lastly, we can style the first and last ticks to just show as midnight, with the intention of displaying the actual date somewhere else in the app later.

```
  svg
    .selectAll('g.tick')
    .filter((d, i, ticks) => i === 0 || i === ticks.length - 1)
    .select('text')
    .text('12 AM');
```

And now we have the beginnings of a Google Calendar clone, created using D3.js. You can make a lot of different improvements from here, like making it a weekly or monthly calendar or allowing dynamic event creation. While you typically wouldn't reach for D3 to build a calendar app, this exercise has given us some insight into how scales, axes, and shapes can be drawn using D3. You can now change and play around with any code you're unsure of or curious about and see how it breaks or changes what we've built.