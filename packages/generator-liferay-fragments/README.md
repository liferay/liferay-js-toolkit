[![NPM Publish Version][5]][6]

# generator-liferay-fragments

Yeoman generator for creating and maintaining Liferay Fragment projects

## Requirements

- [NodeJS][3] 8+
- [NPM][2] 6+
- [Yeoman][1] 2+

## Installation

First, install _Yeoman_ and _generator-liferay-fragments_ using _npm_
(we assume you have pre-installed _node.js_).

```bash
npm install -g yo
npm install -g generator-liferay-fragments
```

Then generate your new project:

```bash
yo liferay-fragments
```

This command will guide you through a project creation and will
ask you some simple questions. Then you can just cd to this new project
and start working.

```bash
cd my-new-fragments-project
```

## Usage

Once you've created your project, there is a bunch of npm scripts that
will allow you perform many actions with your existing fragments. Fragments
are organized inside collections, and keep an extremely simple structure:

```
src/
  collection-a/
    collection.json
    fragment-1/
      fragment.json
      index.html
      styles.css
      main.js
    fragment-2/
      ...
  collection-b/
    ...
```

Each collection's and fragment's information is stored inside `JSON` files,
and you can change them manually, there is no magic in here. But we provide
some extra scripts to do these modifications easily.

- `add-collection`
- `add-fragment`
- `export`
- `compress`
- `import`
- `import:watch`

[1]: https://yeoman.io
[2]: https://www.npmjs.com
[3]: https://nodejs.org
[4]: https://github.com/lerna
[5]: https://badge.fury.io/js/generator-liferay-fragments.svg?style=flat
[6]: https://www.npmjs.com/package/generator-liferay-fragments