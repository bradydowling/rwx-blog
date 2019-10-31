---
title: How to Ace a Take Home Coding Project
date: "2019-10-31T16:51:00.000Z"
layout: post
draft: false
path: "/posts/how-to-ace-a-take-home-coding-project/"
category: "Interviewing"
tags:
  - "Interviewing"
  - "Career"
description: "There are a couple of keys to take care of when working on a take home project from a company you're interviewing with. These tips will help you get to the next round of the interview."
---

These days lots of companies include a take home project in their interviewing process, whether for frontend, backend, or full-stack engineers. This can be a good change of pace to interviews since it gives you a chance to show what you know without someone watching you write code on a whiteboard. But it's a challenge because the expectations are much higher than an in-person or over-the-phone coding test. Some companies request that you take 8 hours or longer to work on a project and of course they're not paying you for this. Recently I've had several take home projects and I've learned a thing or two about what works well for me to succeed on these projects.

## Set Aside Time
The first thing I've learned is to block off time to complete the project rather than doing here a little and there a little. With a recent project I was given, the task seemed relatively simple: fix some existing code and point out some security issues in it. I didn't think it would take long but I wanted to be sure to brush up on my security knowledge so I started doing some research. I was also thinking of different ways I could fix some of the code I'd been given. Between this research and trying some of my hypotheses from time to time, I spent a lot of mental energy on this project without actually _dedicating_ much time. Before I knew it, I exhausted myself. I ended up submitting something that didn't even meet requirements because I was drained.

Though it was too late for this project, I realized that I have to block off time to work on a take home project. Here and there won't work, just like it doesn't work in my normal day job. If I don't block off time I'll end up spending a lot of time doing a poor job.

### Take aways
- Dedicate and track time to work on a project
- Set a hard cap on how much time you spend researching (or just include research in your project work time)

## Scaffolding
Getting the groundwork for a project can take a ton of time if you let it. Minimizing the effort you spend scaffolding your project will give you more time to show your skills to your potential employer. I once had a project where I spent a couple hours setting up Webpack, Babel, Eslint, and Prettier. On a take home project a couple hours is a big deal. And since I'd spent so much time scaffolding this stuff, I felt it wasn't worth it for me to add a fronted framework, like React. When I got feedback on my project, one of their main bits of feedback was that I should have used a framework. Of course, I didn't have to set all these tools up myself, I could have used some boilerplate from GitHub or a CLI like create-react-app to get going quickly. Most interviews won't be about how well you can scaffold an app so time you spend there doesn't directly add to the value of your project. Use frameworks you're familiar with liberally to automate away the mundane and let you showcase the skills you need to showcase.

### Take aways
- Know your frameworks and libraries beforehand
- Reduce setup and scaffolding time as much as possible
- Use any frameworks, libraries, or tools that will speed up your development process
- Make sure your project showcases skills that the company cares about

## Requirements
When all is said and done, requirements are the end goal of the project and they must be met. In another one of my take home projects, I started building a solution to the problem I was given. The project involved data being passed from a backend to a frontend on a regular basis. It seemed like a good opportunity for me to use web sockets. After I had coded up a proof of concept, I took another look at the requirements and noticed one major issue. Right there in the requirements, I was asked to initiate data transfer _from the frontend_ while my proof of concept had done so from the backend via web sockets. In this case, initiating data transfer from the frontend meant I could just make API calls on an interval and eliminate usage of web sockets entirely. I sunk an hour or two into an overcomplicated approach based on an incorrect understanding of the requirements.

In a different case, I turned in a project that I felt showcased my skills but didn't even meet all the requirements and the company passed on me for that reason alone. A take home project has limited time but that's not an excuse to skimp on requirements. Unless otherwise stated, you should assume that not meeting requirements means you fail this part of the interview. Before working on the project, make sure you know the requirements well so you can properly allocate time. Read them through a couple times and poke holes in them. Emailing questions to someone might seem like you're bothering them during their day job but you have to put that mentality aside and just go for it.

### Take aways
- Read the requirements
- Resolve ambiguities
- Read them over again
- Meet all requirements

## Clean It Up

Depending on your coding approach, you may have some code that just works but could be cleaned up. It meets requirements but it's just a take home project that won't be worked on again or maintained so who cares? Well, someone definitely cares and it's the person grading this project. For take home projects you don't have any chances to pay off tech debt in the future so it has to be cleaned up _now_. The easier your code is to understand, the more pleasant the grading process is for your potential employer. I generally don't leave a lot of comments in my production code but I try to be liberal with comments in my take home projects because this might be the only chance I have to clarify my thinking or justify my approach.

### Take aways
- Write clean code, don't repeat yourself
- Adhere to best practices for naming, spacing, etc. (if you don't know these, now is a great time to learn them)
- Leave comments, more than you would in your normal code
- Use a linter or code formatter (preferably the same rules as the company, you may be able to find them on an GitHub repo)
- Include a README with detailed instructions

Just like the rest of the interviewing process, a take home project is something you can prepare for by establishing processes and rules for yourself. And similarly, the more practice you get with take home projects, the more you'll understand what works best for you and the better you'll get at executing. Different interviewers from different companies look for different things so you won't ace them all but with practice and a prefer approach you can put your best foot forward.