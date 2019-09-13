const app = require('./app/app')
const server = require('http').createServer(app)

server.listen(3000, () => {
  console.log(`Server running at 3000`)
})