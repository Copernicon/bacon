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

## `tabindex`
Focusable elements have the following tabindexes:

> element           | `tabindex`
> --------------    | ----------
> `body > nav    *` | `1`
> `body > header *` | `2`
> `body > main   *` | implicit `0`