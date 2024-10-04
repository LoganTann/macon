<h1 align="center">Maçon</h1>
<p align="center"><b>Tiny utility to create reactive jQuery components using a JSX-like syntax</b></p>

<span>&nbsp;</span>

> Yet another javascript framework ?

People hate working with large jQuery codebase, because it scales very badly. Using a component-based approach is the solution.

But integrating declarative MVVM frameworks like vue.js, preact or LWC may be impossible for your project, since it will require you to nuke your codebase and rebuild everything using that framework.

Maçon aims to **incrementally refactor your website into reactive components**, while staying integrated with your jQuery codebase.

## Install

Copy-paste the `template` function located in [main.js](./main.js).

The framwework stands in a single function, as it is an ES6 tagged template processor.

## Usage

### Just add `template` before your string, and the magic happens

Create nested DOM element, enhanced with jquery. Append other elements by interpolating them, just like JSX. Call jquery methods like you're used to.

```javascript
import { template } from "./macon.js";

const component = template`<button id="nextBtn" type="button">Next</button>`;
component.on("click", function(event) {
    event.preventDefault();
    console.log("Button clicked !");
});

$("#anywhere").append(template`
    <main>
        <div class="button-container">
            ${component}
        </div>
    </main>
`);
```

### Loops and conditions

We've seen that the template utility supports strings and jquery objects as interpolated values. It can also accept arrays.

Therefore, conditionnals and loops can be created like how we do in React, using ternaries and the `Array.map` method :

```js
import { template } from "./macon.js";

$("#anywhere").append(ShoppingListComponent());

function ShoppingListComponent() {
    const items = [["Wheat", true], ["Eggs", false], ["Milk", false]];
    return template`
        <div>
            ${items.map(([name, checked], index) => listItem({name, checked, index}))}
        </div>
    `;
}

function listItem({name, checked, index}) {
    return template`
        <div class="custom-checkbox">
            <input type="checkbox" id="checkbox-${index}" ${checked ? "checked" : ""}/>
            <label for="checkbox-${index}">${name}</label>
        </div>
    `
}
```

When a callback is passed as interpolated value, the template utility will execute it. 

```js
/**
 * Shows a recipe
 * @param {object} props
 * @param {boolean} props.isLoaded Set to false if the recipe is still loading.
 * @param {string|JqueryComponent} props.value Recipe html content
 * @return {JqueryComponent}
 */
function RecipeLoaderComponent({isLoaded, value}) {
    const component = template`
        <div>
            ${() => {
                if (isLoaded) {
                    return `<div>${value}</div>`;
                }
                return `Loading...`;
            }}
        </div>
    `;
    return component;
}
```

### Adding reactive state

While it's possible to edit the component's content using regular jquery methods, and event edit other components state, you should write them in a declarative manner. Like Vue.js 2, it's advised to keep the component's own state inside the state variable, or into a model that is passed as parameter. 

The template utility does not have a built-in variable watcher, so to update it when a variable changes, you need to manually call the `component.refresh()` function. This will re-execute all callbacks passed in interpolated values. Therefore, to make a variable reactive, you should add it to a lambda function.
```js
function chronoComponent() {
    const state = {
        mutableValue: 0,
        get computedValue() {
            return new Date().toLocaleTimeString();
        }
    };
    const component = template`
        <div>
            <div>Created time (won't be refreshed, this is not a callback !!): ${state.computedValue}</div>
            <div>Current time (reactive value since it's inside a callback) : ${() => state.computedValue}</div>
            <div>Elapsed seconds since created : ${() => state.mutableValue}</div>
        </div>
    `;
    setInterval(() => {
        state.mutableValue += 1;
        component.refresh();
    }, 1000);
    return component;
}
```

> ⚠️ Note: Although you can include multiple root elements, the HTML code for the component should contain only one root element to be properly reactive.

### Event and reactive state management

For child to parent communication, pass callback as parameters like in React.

You can use jquery's custom event system for global or parent-to-child communication. 

Since the template function returns a jquery node, you can use the `component.find("selector").on( )` method to add an event to a nested item in the component's template.
However, please keep in mind that calling refresh() will delete the component's children, and so the targeted element. This is much better to create a separate component that will send an event to the parent.

At work, I created a component called `SubscribeEvent(name, handler)` and a function `sendEvent(name)` to abstract this job and detect changes.

You can also use javascript proxies to detect mutations and call refresh() at the correct time.

## Contributing 

The name "Maçon" (which means "mason" or "builder" in French) is derived from the [façon library](https://github.com/terkelg/facon), which served as a source of inspiration for this project.

This is an utility I created for my internship and I don't plan use my free time to add new features.

Still, contributions are very welcome and I'll do my best to answer pull requests, especially if it's about adding CJS+ESM support, unit tests, CI and npm release.

## API

### JqueryComponent type definition

Return value of the template() function. Aliases to `JQuery<HTMLElement> & {refresh: () => void}`;

### template(string)

Returns: `JqueryComponent`

Construct and returns a Jquery DOM element.

The returned element has a special refresh method that is used to process again interpolated values. 

Strings, Arrays, DOM Elements, jQuery elements and callback can be composed together/appended like this :

```js
// Concatenated
let htmlString = `<p>Some HTML</p>;
let node = template`<div>${htmlString}</div>`;

// Appended
let myNode = document.createElement('div');
let node = template`<div>${myNode}</div>`;
```

### jQueryComponent.refresh()

Method to refresh a component's state. 

Be aware that there is no Virtual DOM nor smart updates when calling `refresh()`.

The utility will naively delete the node's content, re-build the HTML and insert it. So using reactivity to use CSS transitions is not possible.

