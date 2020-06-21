import { promises as fs } from 'fs'
import arg from 'arg'
import inquirer from 'inquirer'
import chalk from 'chalk'
import path from 'path'

const CATEGORIES = ['Tutorial', 'JavaScript', 'Career', 'Education']
const DEFAULTS = {
  TITLE: 'New Blog Post',
  CATEGORY: CATEGORIES[0],
  DESCRIPTION: 'A brief tutorial on some of the inner workings and tricks of JavaScript',
}

const getPostTemplate = options => {
  const postTemplate = // eslint-disable-line
`---
title:  "${options.title}"
date: "${(new Date()).toISOString()}"
layout: post
draft: true
path: "/posts/${options.path}/"
category: "${options.category}"
tags:
- "Tutorial"
description: "${options.description}"
---

This is where the content of the post should go
`
  return postTemplate
}

const getDefaultPath = title => title.toLowerCase().replace(/\s/g, '-')
const getDefaultDirName = title => `${(new Date()).toISOString().split('T')[0]}---${title.replace(/\s/g, '-')}`

async function createPost(options) {
  const postTemplate = getPostTemplate(options)

  const postDirName = getDefaultDirName(options.title)
  const postDir = path.join('src/pages/articles', postDirName)

  await fs.mkdir(postDir)
  await fs.writeFile(path.join(postDir, 'index.md'), postTemplate)

  console.log(`${chalk.green.bold('POST CREATED')} ${postDir}`)
  return true
}

function parseArgumentsIntoOptions(rawArgs) {
  const args = arg(
    {
      '--yes': Boolean,
      '--title': String,
      '--description': String,
      '--category': String,
      '--path': String,
      '-y': '--yes',
      '-t': '--title',
      '-d': '--description',
      '-c': '--category',
      '-p': '--path',
    },
    {
      argv: rawArgs.slice(2),
    }
  )

  return {
    skipPrompts: args['--yes'] || false,
    title: args['--title'],
    description: args['--description'],
    category: args['--category'],
    path: args['--path'],
  }
}

async function promptForMissingOptions(options) {
  if (options.skipPrompts) {
    return {
      ...options,
      ...DEFAULTS,
    }
  }

  const questions = []
  if (!options.title) {
    questions.push({
      type: 'input',
      name: 'title',
      message: 'What is the title of your blog post?',
      default: DEFAULTS.TITLE,
    })
  }

  if (!options.description) {
    questions.push({
      type: 'input',
      name: 'description',
      message: 'What is the description for this post?',
      default: DEFAULTS.DESCRIPTION,
    })
  }

  if (!options.category) {
    questions.push({
      type: 'list',
      name: 'category',
      choices: CATEGORIES,
      message: 'What is the category for this post?',
      default: DEFAULTS.CATEGORY,
    })
  }

  if (!options.path) {
    questions.push({
      type: 'input',
      name: 'path',
      validate: input => !/\s/.test(input) || 'URL paths cannot contain spaces',
      message: answers => `Enter the URL path for this post (e.g. myblog.com/posts/${getDefaultPath(answers.title || DEFAULTS.TITLE)})`,
      default: answers => getDefaultPath(answers.title || DEFAULTS.TITLE),
    })
  }

  const answers = await inquirer.prompt(questions)
  return {
    ...options,
    title: options.title || answers.title,
    description: options.description || answers.description,
    category: options.category || answers.category,
    path: options.path || answers.path,
  }
}

export async function cli(args) { // eslint-disable-line
  const initialOptions = parseArgumentsIntoOptions(args)
  const options = await promptForMissingOptions(initialOptions)
  await createPost(options)
}
