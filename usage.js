import { connect } from "./src/connect"

const {getModel, createTable} = connect()

await createTable('user', {
  name: 'string',
  age: 'number',
  posts: 'post[]'  
})

await createTable('post', {
  title: 'string',
  content: 'string',
  creator: 'user'
})

const users = getModel('users')