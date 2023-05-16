# Styles
There are four basic treshold values of document width, based on target device screen (model values):
- 360px — The minimal supported value. Devices with screens narrower than 360px are not supported.
- 720px — Treshold between mobile and tablet users
- 1080px — Treshold between tablet and laptop users
- ~~1920px — Treshold between laptop and full hd monitor users~~

## Paths
### `std`
`/core/frontend/styles/std` contains CSS rules for standard elements (*eg* `a`, `div` or `h1`).

### `app`
`/core/frontend/styles/app` contains CSS rules for custom elements (`app-` prefixed, *eg* `app-cards`).

## Layers
Bacon utilizies the following cascade layers, in the order of importance:
- `core_base` — base definitions from `core` module
- `mods_base` — base definitions from other modules
- `core_elements` — definitions of `app-` prefixed elements from `core` module
- `mods_elements` — definitions of `app-` prefixed elements from other modules
- `core_utils` — utilities that style individual elements, *eg* `.small` from `core` module
- `core_utils` — utilities that style individual elements, *eg* `.big` from other modules
- `core_overrides` — overriding element definitions from `core` module, *eg* for plugins
- `mods_overrides` — overriding element definitions from other modules, *eg* for plugins

## Properties
Style properties are grouped and appear in the following order:
- Meta — Meta properties, *eg*: source, identity, mode. <br>
Tells nothing about the element styling itself, *ia*:
	- `all`
	- `src`
	- `grid-area`
	- `grid-template-areas`
	- `box-sizing`
- Layout <br>
Tells where and how to render the element, *ia*:
	- `content`
	- `display`
	- `position`
	- `left`, `right`, `top`, `bottom`
	- `visibility`
- Size <br>
Tells how big the element should be, *ia*:
	- `width`
	- `min-width`
	- `max-width`
	- `height`
	- `min-height`
	- `max-height`
	- `grid-template-columns`
	- `grid-template-rows`
	- `flex-shrink`
- Direction <br>
Tells in which direction to render element's content, *ia*:
	- `flex-direction`
	- `justify-content`
	- `align-items`
	- `vertical-align`
- Spacing — Space around the element, outer to inner. <br>
Tells how much space to preserve around the element, *ia*:
	- `margin`
	- `border`
	- `border-radius`
	- `padding`
	- `grid-gap`
	- `gap`
	- `tab-size`
- Overflow <br>
Tells what to do when there is no enough space, *ia*:
	- `overflow`
	- `white-space`
	- `text-overflow`
- Text <br>
Tells how to render the text, *ia*:
	- `font-family`
	- `font-size`
	- `font-weight`
	- `line-height`
	- `word-break`
	- `text-align`
- Appearance <br>
Tells how to actually style elements, *ia*:
	- `color-scheme`
	- `background`
	- `color`
	- `fill`
	- `outline`
	- `outline-offset`
	- `text-decoration`
	- `transform`
	- `user-select`
	- `cursor`
	- `transition`

Example:

```css
/* Meta */
box-sizing: border-box;

/* Overflow */
overflow: hidden;
```

# DOM
## `body`
The `body` element is a 2×2 grid that contains the following elements:

```css
grid-template-areas: "aside header" "nav main";
```

The body has the valueless attribute `data-menu-visible` if and only if its left column is shown.

### `body`'s left column
The `body`'s left column, *ie* `aside` and `nav` elements can be:
- shown by clicking the following button:
	- `#nav-open-menu`
- hidden by clicking any of the following buttons:
	- `#nav-close-menu`
	- `menu-group[data-name="menu"] > menu-entry[data-name="hide"]`

Initially, the `body`'s left column is shown if and only if `document.body.offsetWidth >= 720`.

The `body`'s left column's width equals:
- `0px` when hidden
- `326px` when shown and `document.body.offsetWidth <= 720`
- the sum of `326` and 1/32th of the difference between `1080` and `document.body.offsetWidth`, in pixels when shown and `document.body.offsetWidth > 720 && document.body.offsetWidth < 1080`
- `360px` when shown and `document.body.offsetWidth >= 1080`

### `body`'s top row
The `body`'s top row, *ie* `aside` and `header` elements's height equals:
- `0px` when `document.body.offsetWidth <= 720` and the `body`'s left column is visible
- `48px` otherwise

### `body > aside`
The top-left `aside` element with the following elements:
- one `app-icon` element
- one `app-name` element

There are no focusable elements in the `body > aside` element.

Area:

```css
grid-area: aside;
```

### `body > header`
The top-right `header` element with `button`s.
- `#nav-open-menu` — open the menu.
- `#nav-close-menu` — closes the menu.

Focusable elements in the `body > header` have `tabindex="2"`.

Area:

```css
grid-area: header;
```

### `body > nav`
The bottom-left `nav` element that is the application's **menu**. <br>
Contains multiple `menu-group` elements with the following attributes:
- `data-name` — Menu group name used for reference, *eg* `main`.

Each `menu-group` element contains the following elements:
- one heading `menu-header` element¹
- at least one `menu-entry` element <br>
	`menu-entry` element contains the following attributes:
	- `data-name` — Menu entry name used for reference, *eg* `dashboard`.
	- `data-goto` — Page to load on entry click (*eg* `main`) xor `null` for no target.

1. Except for the firts `menu-group` element with `[data-name="menu"]`, which contains only the single `menu-entry[data-name="hide"]`, that hides the menu on click and is visible only when the menu is visible and `document.body.offsetWidth < 720`.

Focusable elements in the `body > nav` have `tabindex="1"`.

Area:

```css
grid-area: nav;
```

### `body > main`
The bottom-right `main` element into which are loaded other pages.

Focusable elements in the `body > main` shoud have no `tabindex` attribute.

The `main` element's immediate childs should be `section` elements only.

Area:

```css
grid-area: main;
```