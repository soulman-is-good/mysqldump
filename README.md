mysqldump
============

Node.js implementation of `mysqldump` utility based on `Readable` stream.

Install
---------

```sh
npm install mysqldump
```

Usage
-------

```javascript
var Mysqldump = require('mysqldump');
var mysqldump = new Mysqldump('mydatabase', {
  gzip: true, //default: false
  host: 'localhost', //default
  port: 3306, //default
  user: 'root', //default: process.env.USER || 'root'
  password: 'mypassword' //default: false
});
var fs = require('fs');
mysqldump.start();
mysqldump.pipe(fs.createWriteStream('./mydatabase.sql.gz'));
```
