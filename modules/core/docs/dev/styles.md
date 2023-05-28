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