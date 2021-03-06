
// APP
const Koa = require('koa');
const koaStatic = require('koa-static')

const app = new Koa();
var db = require('./server/database')


// DATABASE
var students = require('./students')
var Student = require('./server/database/schema/student')

// API
var api = require('./server/api')


updateStudent = true
// OTHER
const process = require('process')
const config = require('./bot/config/config')
var grap = require('./grap')


var lastGrap = 0
var interval = 30 * 60 * 1000

function getInterval() {
    var now = new Date()
    if (now.getHours() <= 3 || now.getHours() >= 23) return 40 * 60 * 1000
    if (now.getHours() <= 6) return 60 * 60 * 1000
    if (now.getHours() < 12) return 30 * 60 * 1000
    if (now.getHours() < 13) return 60 * 60 * 1000
    if (now.getHours() <= 18) return 30 * 60 * 1000
    if (now.getHours() < 20) return 40 * 60 * 1000
    return 30 * 60 * 1000
}


async function main() {
    var now = Date.now()
    var delta = now - lastGrap;

    if (delta > interval) {
        console.log('START GRAP')
        lastGrap = Date.now()
        interval = getInterval()
        await grap.graps()
        var end = Date.now()
        var pass = end - now
        console.log('GRAP SUCCESS, took', pass)
    } else {
        console.log('NEXT GRAP:', interval - delta)
    }
    await new Promise(done => setTimeout(done, 10000))
    await main()
}


module.exports = function ({
    grapper = false,
    useApi = false
}) {

    if (useApi) {
        app.use(api.routes())
        app.listen(80);
        app.use(koaStatic('./server/public/'))
    }

    if (grapper) {
        db.db.once('open', async function () {
            console.log('database connected')

            if (updateStudent) {
                console.log('update students')
                for (var i in students) {
                    await Student.findOneAndUpdate({ id: i }, {
                        id: i,
                        name: students[i].name,
                        github: students[i].github
                    }, { upsert: true }).then()
                    process.stdout.write('  updated:' + i + '\r')
                }
                console.log('done               ')
            }
            //app.use(grap.router.routes())
            main()
        })
    }

    db.connect()
}