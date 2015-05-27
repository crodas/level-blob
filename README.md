# level-blob

Store blobs of data in streams in LevelUp.

How to install?
---------------

It can be installed with `npm`

```bash
npm install level-blob --save
```

How does it work?
-----------------

It's pretty simple to store data in:

```js
var storage = require('level-blob')('./storage');
var fs = require('fs');

var w = storage.createWriteStream('name.txt', function(metadata) {
  console.log("Wrote file", metadata);
});

fs.createReadStream('./long-blob.txt').pipe(w);
```

And it's also simple to read:

```js
var storage = require('level-blob')('./storage');
var fs = require('fs');

storage.createReadStream('name.txt').pipe( fs.createWriteStream('local-file.txt') );
```
