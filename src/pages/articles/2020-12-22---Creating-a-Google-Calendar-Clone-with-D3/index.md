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
npm install --save d3
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

// We'll use this one for making our yScale later on
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

A lot of times you'd put time on the x-scale but for our calendar application time is plotted vertically so we'll make it on the y-scale. And for simplicity, we'll just build a single-day calendar so we don't actually need an x-scale.

```
const yScale = d3
  .scaleTime()
  .domain([d3.min(dates), d3.max(dates)])
  .range([margin.top, height - margin.bottom]);
```

Notice that we pass in our _data_ range to `domain` and our _pixel_ range to `range`. We'll use this scale mapping later on but first, let's draw the y-axis:

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

Now that we have our axis and gridlines showing up we can use the data object we created to add in some calendar events:

```
  const bar = svg
    .selectAll('g')
    .data(data, 0)
    .join('g');

  bar
    .append('rect')
    .attr('fill', d =>
      d.isSleep ? barStyle.background.sleep : barStyle.background.wake
    )
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

  bar
    .append('rect')
    .attr('fill', '#EA4335')
    .attr('x', margin.left)
    .attr('y', yScale(currentTimeDate) + barStyle.startPadding)
    .attr('height', 2)
    .attr('width', barStyle.width);
```

Then let's add some labels for the events we have on our calendar. We'll again use the `append` method, but this time we'll add a `text` element to our `bar` variable:

```
  bar
    .append('text')
    .attr('font-family', 'Roboto')
    .attr('font-size', 12)
    .attr('font-weight', 500)
    .attr('text-anchor', 'start')
    .attr('fill', d =>
      d.isSleep ? barStyle.textColor.sleep : barStyle.textColor.wake
    )
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

And now we have the beginnings of a Google Calendar clone, created using D3.js. You can make a lot of different improvements from here, like making it a weekly or monthly calendar or allowing dynamic event creation. While you typically wouldn't reach for D3 to build a calendar app, this exercise has given us some insight into how scales, axes, and shapes can be drawn using D3. While we didn't discuss every single line of code in detail, you can now change and play around with any code you're unsure of or curious about and see how it breaks or changes what we've built.