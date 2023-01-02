mc.listen("onServerStarted", () => {
    const cmd = mc.newCommand("server", "跨服", PermType.GameMasters);
    cmd.mandatory("ip", ParamType.RawText);
    cmd.mandatory('port', ParamType.Int);
    cmd.mandatory('player',ParamType.Player);
    cmd.overload(["player", "ip",'port']);
    cmd.setCallback((_cmd, _ori, out, res) => {
        for(let i = 0; i < res['player'].length; i++){
            res['player'][i].transServer(res['ip'], res['port']);
        }
    });
    cmd.setup();
});
