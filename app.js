const Wechat = require('yochat')
var request = require('request')
var fs = require('fs')
var fakeDb = require('./fake')
// 全局配置
Wechat.config({
    autoLogin: true, // 是否保存cookie 以便自动登录
    openBrowser: false, // 是否在浏览器中打开二维码链接 (默认在terminal中显示)
    // cookie: 'cookie string' // 自定义设置cookie字符串
})

var fetch = function (url, options) {
    return new Promise(function (resolve, reject) {
        request(url, options, (err, httpResponse, body) => {
            resolve(httpResponse)
        })
    });
}

var lasttime = new Date().getTime();

// 初始化程序
Wechat.run(async () => {
    // 获取联系人列表
    let memberList = await Wechat.getContact()
    // 获取账户信息
    let ownerInfo = await Wechat.getOwnerInfo()
    // 给指定用户发送消息(这里测试自己给自己发)
    var ownUserName = ownerInfo.User.UserName;
    // let sendStatus = await Wechat.sendMsg(ownUserName, ownUserName, `hello word! 现在的时间是:${new Date()}`)
    // if (sendStatus) {
    //     console.log('消息发送成功!')
    // }
    var Admin = null;
    memberList.map(item => {
        if (item.NickName === 'KamiSama') {
            return Admin = item
        }
    })
    if (!Admin) {
        Admin = ownerInfo.User
    }


    setInterval(async () => {
        var config = JSON.parse(fs.readFileSync('./config.json'))
        var now = new Date().getTime()
        if (now - lasttime > config.time) {
            lasttime = now;
            let huilvRes = await fetch('http://api.fixer.io/latest?base=USD')
            var huilvBody = JSON.parse(huilvRes.body)
            var rate = huilvBody.rates.CNY;
            let tickerRes = await fetch('https://www.bit-z.com/api_v1/tickerall')
            var tickerBody = JSON.parse(tickerRes.body)

            // pok_eth
            var time = tickerBody.data.pok_eth.date * 1000 + 8 * 1000 * 60 * 60
            var pok_eth_rate = Number(tickerBody.data.pok_eth.sell);
            var eth_usdt = Number(tickerBody.data.eth_usdt.sell);
            Wechat.sendMsg(ownUserName, Admin.UserName, `\r\n\r\n当前时间: ${new Date(time)} \r\n\r\n币价: ${pok_eth_rate * eth_usdt * rate}\r\n\r\n持有数量: ${config.number}\r\n\r\n大概价格(RMB): ≈${pok_eth_rate * eth_usdt * rate * config.number}`)
        }
    }, 1)

    // 自动回复消息
    Wechat.listener.on('message', async data => {
        // 群聊消息
        if (data.type === 'Group') {
        }
        // 普通消息
        else {
            //data.fromUser.NickName === 'KamiSama' &&`
            if (/^time:\d+$/.test(data.msg)) {
                var config = JSON.parse(fs.readFileSync('./config.json'))
                config.time = Number(data.msg.substring(data.msg.lastIndexOf(':') + 1))
                fs.writeFileSync('./config.json', JSON.stringify(config))
                Wechat.sendMsg(ownUserName, Admin.UserName, `設置提醒間隔成功!`)
            }

            if (/^number:\d+$/.test(data.msg)) {
                var config = JSON.parse(fs.readFileSync('./config.json'))
                config.number = Number(data.msg.substring(data.msg.lastIndexOf(':') + 1))
                fs.writeFileSync('./config.json', JSON.stringify(config))
                Wechat.sendMsg(ownUserName, Admin.UserName, `設置虛擬幣數量成功!`)
            }
        }
    })
})