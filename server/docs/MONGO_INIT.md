# 数据库初始化

mongo shell or mongo-init.js

```js
use cine-stream
db.createUser({
 user: "root",
 pwd: "Wxf1234321!",
 roles: [
    { role: "readWrite", db: "cine-stream" },
    { role: "dbAdmin", db: "cine-stream" }
  ]
})
```
