let outmsg = '这里设置到达指定时间后的提示信息';
let money0 = 0;  //这里设置奖励金额
let givemsg = '这里设置领取后的输出消息';
let time = 1800; //这里设置玩家游玩的时间 单位：秒
let plmsg = '这里设置玩家需回复的消息'

mc.listen("onServerStarted", () => {
    setInterval(() => {
        let conf = new JsonConfigFile("./plugins/playeronlinetime")
        let pl = mc.getOnlinePlayers();
        //log('a');
        for (let i = 0; i < pl.length; i++) {
            let num = conf.init(pl[i].name, 0);
            num++;
            conf.set(pl[i].name, num);
            if (conf.get(pl[i].name) >= time) {
                if (!pl[i].hasTag('timemax')) {
                    pl[i].tell(outmsg);
                    pl[i].addTag('timemax');
                }
            }
            conf.close();
        }
    }, 1000);
});
mc.listen("onChat", (pl, msg) => {
    if (pl.hasTag('timemax')) {
        if (!pl.hasTag('utimemax')) {
            if (msg = plmsg) {
                money.add(pl.xuid, money0);
                pl.addTag('utimemax');
                pl.tell(givemsg);
                return false;
            }
        }
    }

});