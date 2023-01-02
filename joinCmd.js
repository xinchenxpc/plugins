let conf = new JsonConfigFile('./plugins/joinCmdConfig/config.json');
let _cmd = conf.init('cmd', '');
let _time = conf.init('time', 0);
conf.close();

mc.listen("onJoin", (pl) => {
    let conf = new JsonConfigFile('./plugins/joinCmdConfig/config.json');
    let cmd = conf.init('cmd', '');
    let time = conf.init('time', '');
    conf.close();
    setInterval(() => {
        pl.runcmd(cmd);
    }, (time * 1000));
});
