
/**
 * @summary Maçon - Utility to create Jquery components with a JSX-like syntax
 *
 * @description ES6 tagged template litteral that converts a string into a Jquery object.
 * The string's content must be valid HTML and have only one root element.
 * Obviously, this code requires jquery. If you want similar features for vanilla JS, use {@link https://github.com/terkelg/facon}.
 * This code can be very useful if you're working on a legacy jquery codebase and you want to use a component-based approach.
 *
 * Interpolated values are concatenated to the HTML code, like how a template litteral would behave.
 * However, if the interpolated value is a Jquery object, or an array of Jquery/DOM elements, the value is appended to the component's object model.
 * You can define reactive behaviors by passing functions as interpolated values. Calling component.refresh() function will re-execute these callbacks and update the component.
 * Do not put objects as interpolated values.
 *
 * @example // == Simple example ==
 *  $("body").append(HelloComponent({ name: "World" }));
 *
 *  // Gives :
 *  // <body><button type="button">Hello, World !</button></body>
 *
 *  function HelloComponent({name}) {
 *      const component = template`<button type="button">Hello, ${name} !</button>`;
 *      component.on("click", function(event){
 *           event.preventDefault()
 *           console.log("clicked !");
 *      });
 *      return component;
 *  }
 *
 * @example // == Advanced use ==
 * $("body").append(PageComponent());
 *
 * // Gives (when clicked two times):
 * // <main>
 * //     <h1>Static Items</h1>
 * //     <ul>
 * //         <li>Wheat</li><li>Eggs</li><li>Milk</li>
 * //     </ul>
 * //     <h1>Reactive Items</h1>
 * //     <ul>
 * //         <li>Wheat</li><li>Eggs</li><li>Milk</li><li>new item !</li><li>new item !</li>
 * //     </ul>
 * //     <h1>Child to parent communication</h1>
 * //         <button type="button" id="addBtn">add</button>
 * //     <h1>Parent to child communication</h1>
 * //         <button type="button" id="parentChild">I'm a button</button>
 * // </main>
 *
 * function PageComponent() {
 *     const items = ["Wheat", "Eggs", "Milk"];
 *     const component = template`
 *         <main>
 *             <h1>Static Items</h1>
 *             <ul>
 *                 ${items.map((item) => template`<li>${item}</li>`)}
 *             </ul>
 *             <h1>Reactive Items</h1>
 *             <ul>
 *                 ${() => {
 *                     if (items.length > 0) {
 *                         return items.map((item) => template`<li>${item}</li>`);
 *                     }
 *                     return "No items";
 *                 }}
 *             </ul>
 *             <h1>Child to parent communication</h1>
 *                 ${ButtonComponent({ text: "add", onclick: handleClick, id: "addBtn" })}
 *             <h1>Parent to child communication</h1>
 *                 ${ButtonComponent({ text: "will be changed", id: "parentChild" })}
 *         </main>
 *     `;
 *     component.find("#parentChild").trigger("custom:changeText", ["I'm a button"]);
 *     function handleClick() {
 *         items.push("new item !");
 *         component.refresh();
 *     }
 *     return component;
 * }
 * function ButtonComponent({ text, onclick, id }) {
 *     const component = template`<button type="button" ${id ? `id="${id}"` : ""}>${text}</button>`;
 *     // Child to parent
 *     component.on("click", (event) => {
 *         event.preventDefault();
 *         if (onclick) {
 *             onclick();
 *         }
 *     });
 *     // Parent to child (not recommanded)
 *     component.on("custom:changeText", (_event, data) => {
 *         component.text(data);
 *     });
 *     return component;
 * }
 *
 * @author LoganTann
 * @returns {jQuery & {refresh: () => void}}
 */
function template(strings, ...args) {
    const references = new Map();
    const componentInstance = buildComponent();

    function buildComponent() {
        const html = args.reduce((prev, value, i) => prev + createReference(value, i) + strings[i + 1], strings[0]);
        const component = $(html);
        component.find(`b[data-slot-index]`).each(function () {
            const index = $(this).data("slotIndex");
            const value = getReferenceValue(args[index], index);
            $(this).replaceWith(value);
        });
        references.clear();
        return component;
    }
    function createReference(value, index) {
        if (typeof value == "function") {
            const evaluated = value();
            if (typeof evaluated == "string") {
                return evaluated;
            }
            references.set(index, evaluated);
            return `<b data-slot-index=${index}></b>`;
        }
        if (value instanceof jQuery || Array.isArray(value)) {
            return `<b data-slot-index=${index}></b>`;
        }
        return value;
    }
    function getReferenceValue(value, index) {
        if (references.has(index)) {
            return references.get(index);
        }
        return value;
    }
    function copyAttributes(sourceDOM, destinationDOM) {
        for (const { name } of destinationDOM.attributes) {
            destinationDOM.removeAttribute(name);
        }
        for (const { name, value } of sourceDOM.attributes) {
            destinationDOM.setAttribute(name, value);
        }
    }
    /**
     * Refreshs the component.
     * Warning : Does not keep the current state.
     */
    function refresh() {
        const updatedComponent = buildComponent();
        const updatedChildren = updatedComponent.contents().detach();
        componentInstance.empty().append(updatedChildren);
        copyAttributes(updatedComponent.get(0), componentInstance.get(0));
    }
    componentInstance.refresh = refresh;

    return componentInstance;
}
