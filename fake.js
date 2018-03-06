var fs = require('fs')
var config = JSON.parse(fs.readFileSync('./config.json'))
var fakeDb = {
    struct: config,
    save: function () {
        fs.writeFileSync('./config.json', JSON.stringify(this.struct))
    }
}
module.exports = fakeDb