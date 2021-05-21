"use strict"

/**
 * @author Yufenyuy Veyeh Didier <https://yveyeh.github.io>
 * @copyright © 2021. Tenshnova (https://www.tenshnova.com)
 * @license - See the link (https://github.com/yveyeh/yveyeh.github.io/blob/master/LICENSE)
 * @version 2.0
 */

/**
 * Navigates to the provided url.
 * @param {string} _url - The url to navigate to.
 * @param {string} [_target] - Where to display the linked url.
 * @param {string} [_rel] - The relationship of the target to the linked url.
 * @return void
 */
let navigate = (_url, _target, _rel) => {
    // if no target, use location... else call the target function.
    !_target ? location.href = _url : target(_url, _target, _rel)
}

/**
 * Specifies where to display the linked url.
 * @param {string} _url - The linked url.
 * @param {string} _target - The target value.
 * @param {string} [_rel] - Specifies the relationship of the target object to the link object.
 * @return void
 */
let target = (_url, _target, _rel) => {
    // create an anchor element
    let a = document.createElement('a')
    // set all necessary attributes
    setAttributes(a, {
        'href': _url, 
        'target': _target, 
        'rel': _rel
    })
    // trigger a click event on the achor element
    a.click()
    // remove the achor element from the DOM
    a.remove()
}

/**
 * Sets specified attributes.
 * @param {HTMLElement} _elm - The element to set it's attributes.
 * @param {Object} _attrs - The attributes and attribute values object.
 * @return void
 */
let setAttributes = (_elm, _attrs) => {
    // loop through all keys in a given attributes object
    for (const key in _attrs) {
        if (Object.hasOwnProperty.call(_attrs, key)) {
            // set each attribute and it's value on the given element.
            _elm.setAttribute(key, _attrs[key])
        }
    }
}