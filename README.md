# SolidStart

Everything you need to build a Solid project, powered by [`solid-start`](https://start.solidjs.com);

## Creating a project

```bash
# create a new project in the current directory
npm init solid@latest

# create a new project in my-app
npm init solid@latest my-app
```

## Developing

```bash
# install dependencies
npm install

# start the development server and open the app in a new browser tab
npm run dev -- --open

# install prisma for the databases
npm  install prisma --save-dev

# setup prisma with sqlite
npx prisma init --datasource-provider sqlite

# create SQL migration file
npx prisma migrate dev --name init
```

## Building

Solid apps are built with _presets_, which optimise your project for deployment to different environments.

By default, `npm run build` will generate a Node app that you can run with `npm start`. To use a different preset, add it to the `devDependencies` in `package.json` and specify in your `app.config.js`.

## This project was created with the [Solid CLI](https://solid-cli.netlify.app)
