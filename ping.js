mc.listen("onServerStarted", () => {
    const cmd = mc.newCommand("manager", "检查网络状态", PermType.GameMasters);
    cmd.setEnum("ChangeAction", ['']);
    cmd.mandatory("action", ParamType.Enum, "ChangeAction", 1);
    cmd.overload(["action"]);
    cmd.setCallback((_cmd, ori, out, _res) => {
        let device = ori.getDevice();
        out.success(`Ip: §l§a${device.ip}§r\n平均延迟: §l§a${device.avgPing}§r\n平均丢包率: §l§a${device.avgPacketLoss}§r\n延迟: §l§a${device.lastPing}§r\n丢包率: §l§a${device.lastPacketLoss}§r`);
    });
    cmd.setup();
});
