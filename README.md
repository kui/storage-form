Storage Elements
===================

Custom elements to manipulate `localStorage`/`sessionStorage`/`chrome.storage.{sync,local}` as `<input>` elements. This make you to build easily configuration pages of your Google Chrome extention or web application.

* [Demo](https://kui.github.io/storage-elements/)
* [Demo source](https://github.com/kui/storage-elements/blob/master/docs/index.html)


Example1
-----------------

Manually saving and store to `localStorage`

```html
<form is="storage-form" area="local-storage">
  <input name="foo"><br>
  <input type="submit">
</form>
```

1. Input the text like "bar".
2. Press the submit button.
3. You can confirm an entry `foo=bar` in `localStorage`.


Example2
-----------------

Auto saving, storing to `chrome.storage.local` and using `type=checkbox`.

In your Google Chrome extention option page (require `chrome.storage`):

```html
<form is="storage-form" area="chrome-local" autosync>
  <input type="checkbox" name="foo" value="bar">
</form>
```

1. Check the checkbox.
2. You can confirm an entry `foo=bar` in `chrome.storage.local`.
3. Uncheck the checkbox.
4. You can confirm that the entry `foo=bar` disappear from `chrome.storage.local`.


Example3
--------------

Storing to `sessionStorage` and using other elements.

```html
<form is="storage-form" area="session-storage" autosync>
  <textarea name="ta">ba</textarea><br>
  <select name="ss">
    <option checked>111</option>
    <option>222</option>
  </select>
</form>
```

1. Input some text like "bar" to the `<textarea>`.
2. You can confirm two entries `ta=bar` and `ss=111` in `sessionStorage`.


Example4
-------------

Dynamic storage `area`. You can change the storage area using `<area-select>`.

```html
<form is="storage-form">
  area: <select is="area-select" name="_area">
    <option>local-storage
    <option>session-storage
  </select><br>
  foo: <input name="foo"><br>
  <input type="submit">
</form>
```
