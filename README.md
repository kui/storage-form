Storage Element
===================

Custom elements to manipulate `localStorage`/`sessionStorage`/`chrome.storage.{sync,local}` as `<input>` elements. This make you to build easily configuration pages of your Google Chrome extention or web application.


Example1
-----------------

```html
<h1>Manually store</h1>

<form is="storage-form" area="local-storage">
  <input is="storage-input" name="foo"><br>
  <input type="submit">
</form>
```

1. Input the text form like "bar".
2. Press the submit button.
3. You can confirm the entry `foo=bar` in `localStorage`.


Example2
-----------------

In your Google Chrome extention option page (require `chrome.storage`):

```html
<h1>Auto save</h1>

<form is="storage-form"
      area="chrome-local"
      sync
      sync-delay="500">
  <input is="storage-input" type="checkbox" name="foo" value="bar"><br>
</form>
```

1. Check the checkbox.
2. You can confirm the entry `foo=bar` in `chrome.storage.local`.
3. Uncheck the checkbox.
4. You can confirm that the entry `foo=bar` disappear from `chrome.storage.local`.
