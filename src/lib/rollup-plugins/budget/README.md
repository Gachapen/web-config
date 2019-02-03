# rollup-plugin-budget

A Rollup plugin that compares the sizes of the files to a specified budget.

<img src="https://raw.githubusercontent.com/andreasbm/web-config/master/src/lib/rollup-plugins/budget/example.png" width="300">

## Usage

### Configuration

Option   |   Type        |    Description     |    Default
---------| --------------| ------------------ | ---------------------------------
`sizes` | `{[key: String / RegExp]: Number}` | A map mapping each extension or regex to a size in bytes (eg. sizes: { ".js": 1024 * 170, "cat.jpg": 1024 * 400}) | `{}`
`render` | `(({gzippedSize, max, name}) => String)` | A function that takes the information about the budget status for a file and returns a string which is printed to the console. | `defaultRender`
`timeout` | `Number` | Timeout in ms that specifies the amount of time we wait until all of the files has been bundled after building. | `2000`

### Example

```js
import {budget} from "@appnest/web-config";

export default {
  entry: "src/index.js"
  output: {
    dest: "dist/bundle.js"
  },
  plugins: [
    budget({
      sizes: {
        ".js": 1024 * 170, // Max file size in bytes (170kb)
        "cat.jpg": 1024 * 400
      }
    })
  ]
};
```

## 🎉 License

Licensed under [MIT](https://opensource.org/licenses/MIT).
