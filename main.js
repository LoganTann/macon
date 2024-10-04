/// <reference types="jquery" />
//@ts-check
"use strict";

/** @typedef {JQuery<HTMLElement>} JqueryElement */

/** @typedef {JqueryElement & {refresh: () => void}} JqueryComponent */

/**
 * @summary Maçon - Light utility to create Jquery components using a JSX-like syntax
 *
 * @description ES6 tagged template litteral that converts a string into a Jquery object.
 * The string's content must be valid HTML and have only one root element.
 *
 * Interpolated values are concatenated to the HTML code, like how a template litteral would behave.
 * However, if the interpolated value is a Jquery object, or an array of Jquery/DOM elements, the value is appended to the component's object model.
 * You can define reactive behaviors by passing functions as interpolated values. Calling component.refresh() function will re-execute these callbacks and update the component.
 * Do not put objects as interpolated values.
 *
 * @returns {JqueryComponent}
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
     * Please keep in mind that this will clear the element's children and attributes to replace them with interpolated values again.
     * This mimics reactivity in a naive way and some features that relies on dom change, like css transitions and external event listeners assignment, won't apply.
     */
    function refresh() {
        const updatedComponent = buildComponent();
        const updatedChildren = updatedComponent.contents().detach();
        componentInstance.empty().append(updatedChildren);
        copyAttributes(updatedComponent.get(0), componentInstance.get(0));
    }

    return Object.assign(componentInstance, { refresh });
}
