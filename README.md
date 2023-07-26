# db
Simple database ORM javascript library 

### Install NPM
```bash
$ npm install @ulibs/db
```


### connections
```bash
$ const db = connect({client: 'sqlite3', filename: 'db'})
```



### create table
```bash
$ await db.createTable('users',
  {
      username: 'string|reqired',
      email: 'string',
      age: 'number'
  })
```
