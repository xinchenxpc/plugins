//LiteLoaderScript Dev Helper
/// <reference path="d:\project/dts/llaids/src/index.d.ts"/> 

ll.registerPlugin(
    /* name */ "CTF",
    /* introduction */ "CTF 夺旗 跨年小游戏项目",
    /* version */[0, 0, 1],
    /* otherInformation */ {}
);

//导入函数
try {
    var PlayerTeamData = ll.import('playerTeamData');
    var TeamData = ll.import('TeamData');
}
catch (e) {
    logger.warn('缺少前置队伍插件，这可能会带来一些错误！');
}

//conf = new KVDatabase('./plugins/game');
var version = '6';//这个还要用
var playerBag = {};//玩家背包

var game_start = false;
var RedGameTime = 0;
var BlueGameTime = 0;
var loop_red = false;
var loop_blue = false;

const gameData = {
    game_start: false,//游戏是否开始
    game_prepare: false,//游戏是否准备
    RedGameTime: 0,
    BlueGameTime: 0,
    loop_red: false,
    loop_blue: false,
    setIntervalList: [],
    Health: false,
    RespawnTime: 8
}
/**
 * 重置
 * @constructor function
 */
gameData.reload = function () {
    gameData.game_start = false,
        gameData.game_prepare = false,
        gameData.RedGameTime = 0,
        gameData.BlueGameTime = 0,
        gameData.loop_red = false,
        gameData.loop_blue = false,
        gameData.setIntervalList = [],
        gameData.Health = false,
        gameData.RespawnTime = 8
}

if (mc.getServerProtocolVersion() > 545) {//判断版本以兼容1.19.30
    version = 'spectator';
}


/**
 * 范围时间内只执行一次
 */
class Tools {
    /**
     * 好像有点bug
     *  */
    static exeOnceAtTime(func, during_time) {
        let lastFlag = {
            last_timer: null,
            need_exe: true,
        }
        let exeFunc = (...arg) => {
            //if (lastFlag.last_timer != null) {
            try {
                clearInterval(lastFlag.last_timer);
                lastFlag.need_exe = false;
            }
            catch (err) { }
            //}
            let flag = {
                need_exe: true,
                last_timer: setTimeout(() => {
                    if (flag.need_exe == true) {
                        func(...arg)
                    }
                }, during_time)
            }
            lastFlag = flag
        }
        return exeFunc
    }
}
/**
 * 计分板类
 */
class Score {
    constructor(name) {
        this.name = name;
        let conf = new KVDatabase('./plugins/game');
        let score = conf.get('score');
        log(score, typeof (score));
        score[this.name] = {};
        conf.set('score', score);
        conf.close();
    }
    /**
     * 设置分数
     * @param {Player} pl
     * @param {Number} kay
     */
    setScore(pl, kay) {
        let conf = new KVDatabase('./plugins/game');
        let score = conf.get('score');
        //log(typeof pl);
        if (typeof pl == 'string') {//判断类型
            log(pl, kay, this.name, score);
            score[this.name][pl] = kay;
            conf.set('score', score);
        }
        else {
            score[this.name][pl.name] = kay;
            conf.set('score', score);
        }
        conf.close();
    }

    /**
     * 增加分数
     * @param {Player} pl
     * @param {Number} Number
     */
    addScore(pl, Num) {
        let conf = new KVDatabase('./plugins/game');
        let score = conf.get('score');
        //log(typeof pl);
        if (typeof pl == 'string') {//判断类型
            if (score[this.name].hasOwnProperty(pl) == false) {//判断是否有该键
                score[this.name][pl] = 1;
                conf.set('score', score);
            }
            else {
                score[this.name][pl] += Num;
                conf.set('score', score);
            }
        }
        else {
            if (score[this.name].hasOwnProperty(pl.name) == false) {
                score[this.name][pl.name] = 1;
                conf.set('score', score);
            }
            else {
                score[this.name][pl.name] += Num;
                conf.set('score', score);
            }
        }
        conf.close();
    }
    /**
     * 获取分数
     * @param {Player} pl
     * @return {Number}
     */
    getScore(pl) {
        let conf = new KVDatabase('./plugins/game');
        let score = conf.get('score');
        //log(typeof pl);
        if (typeof pl == 'string') {//判断类型
            if (score[this.name].hasOwnProperty(pl)) {
                conf.close();
                return score[this.name][pl];
            }
        }
        else {
            if (score[this.name].hasOwnProperty(pl.name)) {
                conf.close();
                return score[this.name][pl.name];
            }
            else {

            }
        }
    }
}

mc.listen('onServerStarted', () => {
    /*ob_flag = mc.newScoreObjective('flag', 'flag次数');
    ob_die = mc.newScoreObjective('die', '死亡次数');
    ob_kill = mc.newScoreObjective('kill', '击杀次数');
    if (mc.getScoreObjective('kill') == null) {
        var ob_kill = mc.newScoreObjective('kill', '击杀次数');
        //ob_kill = mc.newScoreObjective('kill', '击杀次数');
    }
    else {
        var ob_kill = mc.getScoreObjective('kill');
    }
    if (mc.getScoreObjective('die') == null) {
        var ob_die = mc.newScoreObjective('die', '死亡次数');
        //ob_die = mc.newScoreObjective('die', '死亡次数');
    }
    else {
        var ob_die = mc.getScoreObjective('die');
    }
    var ob_flag;
    if (mc.getScoreObjective('flag') == null) {
        ob_flag = mc.newScoreObjective('flag', 'flag');
        log('计分板不存在,已创建');
        log(ob_flag);
    }
    else {
        ob_flag = mc.getScoreObjective('flag');
        log(ob_flag);
    }
    /*
    ob_flag.setScore("red", 0);
    ob_flag.setScore("blue", 0);*/



    let conf = new KVDatabase('./plugins/game');
    if (conf.get('inspect') != true) {
        conf.set('pos1', []);
        conf.set('pos2', []);
        conf.set('rad_flag', '');
        conf.set('blue_flag', '');
        conf.set('red_clothes', []);
        conf.set('blue_clothes', []);
        conf.set('inspect', true);
        conf.set('score', {}); //计分板
    }
    conf.set('score', {}); //计分板需要重置
    conf.close();

    mc.runcmdEx('gamerule doimmediaterespawn true');//立即重生

    //初始化计分板
    var ob_flag = new Score('flag');
    var ob_kill = new Score('kill');
    var ob_die = new Score('die');

    Array.prototype.indexOf = function (val) {
        for (var i = 0; i < this.length; i++) {
            if (this[i] == val) return i;
        }
        return -1;
    };
    Array.prototype.remove = function (val) {
        var index = this.indexOf(val);
        if (index > -1) {
            this.splice(index, 1);
        }
    };


    //pos1 = mc.newIntPos(pos1[0], pos1[1], pos1[2], 0);//xyz转pos
    //pos2 = mc.newIntPos(pos2[0], pos2[1], pos2[2], 0);
    let cmd = mc.newCommand("game", "生成", PermType.GameMasters);
    cmd.setEnum('a', ['prepare']);
    cmd.setEnum('e', ['start']);
    cmd.setEnum('f', ['stop']);
    cmd.setEnum('b', ['set']);
    cmd.setEnum('d', ['xyz']);
    cmd.setEnum('c', ['blue', 'red']);
    cmd.setEnum('g', ['debug']);
    cmd.setEnum('h', ['get']);
    cmd.setEnum('i', ['clothes']);
    cmd.setEnum('j', ['round']);
    cmd.mandatory("action", ParamType.Enum, "a", 1);
    cmd.mandatory("op", ParamType.Enum, "b", 1);
    cmd.mandatory("flag", ParamType.Enum, "c", 1);
    cmd.mandatory("xyz", ParamType.Enum, "d", 1);
    cmd.mandatory("start", ParamType.Enum, "e", 1);
    cmd.mandatory("stop", ParamType.Enum, "f", 1);
    cmd.mandatory("debug", ParamType.Enum, "g", 1);
    cmd.mandatory("get", ParamType.Enum, "h", 1);
    cmd.mandatory('clothes', ParamType.Enum, "i", 1);
    cmd.mandatory('round', ParamType.Enum, "j", 1);
    cmd.mandatory('radius', ParamType.Int);
    cmd.overload(['debug', 'get', 'flag']);
    cmd.overload(['debug', 'op', 'round', 'radius']);
    cmd.overload(['action']);
    cmd.overload(['start']);
    cmd.overload(['stop']);
    cmd.overload(['op', 'flag']);
    cmd.overload(['op', 'xyz', 'flag']);
    cmd.overload(['op', 'clothes', 'flag']);
    cmd.setup();
    cmd.setCallback((_cmd, ori, out, res) => {

        if (res['debug'] == 'debug') {
            if (res['get'] == 'get') {
                if (res['flag'] == 'red') {//获取两队衣服NBTjson字符串
                    let conf = new KVDatabase('./plugins/game');
                    var itemlist = ori.player.getArmor().getAllItems();
                    var itemListNew = [];
                    for (let i = 0; i < itemlist.length; i++) {
                        itemListNew.push(itemlist[i].getNbt().toSNBT());
                    }
                    conf.set('red_clothes', itemListNew);
                    conf.close();
                    out.success(`设置成功 ${String(itemListNew)}`);
                }
                if (res['flag'] == 'blue') {
                    let conf = new KVDatabase('./plugins/game');
                    var itemlist = ori.player.getArmor().getAllItems();
                    var itemListNew = [];
                    for (let i = 0; i < itemlist.length; i++) {
                        itemListNew.push(itemlist[i].getNbt().toSNBT());
                    }
                    conf.set('blue_clothes', itemListNew);
                    conf.close();
                    out.success(`设置成功 ${String(itemListNew)}`);
                }
            }
            if (res['op'] == 'set') {
                if (res['round'] == 'round') {
                    log(res);
                    sphericalFill(ori.player.blockPos, res['radius']);//调用自定义函数
                    out.success(`完成`);
                }
            }
        }
        if (res['op'] == 'set') {
            if (res['xyz'] == 'xyz') {
                if (res['flag'] == 'red') {//设置两队旗帜生成坐标
                    let conf = new KVDatabase('./plugins/game');
                    conf.set('pos1', [ori.player.blockPos.x, ori.player.blockPos.y, ori.player.blockPos.z]);
                    out.success(`设置成功 ${String(ori.player.blockPos.x)} ${String(ori.player.blockPos.y)} ${String(ori.player.blockPos.z)}`);
                    conf.close();
                }
                else {
                    let conf = new KVDatabase('./plugins/game');
                    conf.set('pos2', [ori.player.blockPos.x, ori.player.blockPos.y, ori.player.blockPos.z]);
                    out.success(`设置成功 ${String(ori.player.blockPos.x)} ${String(ori.player.blockPos.y)} ${String(ori.player.blockPos.z)}`);
                    conf.close();
                }
            }
            else if (res['flag'] == 'clothes') {//获取两队衣服NBTjson字符串
                if (res['flag'] == 'red') {//获取两队衣服NBTjson字符串
                    let conf = new KVDatabase('./plugins/game');
                    var itemlist = ori.player.getArmor().getAllItems();
                    var itemListNew = [];
                    for (let i = 0; i < itemlist.length; i++) {
                        itemListNew.push(itemlist[i].getNbt().toSNBT());
                    }
                    conf.set('red_clothes', itemListNew);
                    conf.close();
                    out.success(`设置成功 ${String(itemListNew)}`);
                }
                if (res['flag'] == 'blue') {
                    let conf = new KVDatabase('./plugins/game');
                    var itemlist = ori.player.getArmor().getAllItems();
                    var itemListNew = [];
                    for (let i = 0; i < itemlist.length; i++) {
                        itemListNew.push(itemlist[i].getNbt().toSNBT());
                    }
                    conf.set('blue_clothes', itemListNew);
                    conf.close();
                    out.success(`设置成功 ${String(itemListNew)}`);
                }
            }
            else if (res['flag'] == 'blue') {//设置两队旗帜样式 NBTjson
                let conf = new KVDatabase('./plugins/game');
                log(ori.player.getHand().getNbt().toSNBT());
                data = 'aa';
                conf.set('blue_flag', ori.player.getHand().getNbt().toSNBT());
                out.success(`设置成功 ${ori.player.getHand().getNbt().toSNBT()}`);
                conf.close();
            }
            else if (res['flag'] == 'red') {
                let conf = new KVDatabase('./plugins/game');
                conf.set('red_flag', ori.player.getHand().getNbt().toSNBT());
                out.success(`设置成功 ${ori.player.getHand().getNbt().toSNBT()}`);
                conf.close();
            }
        }
        if (res['action'] == 'prepare') {//准备游戏
            if (!gameData.game_prepare) {
                game_prepare();
                gameData.game_prepare = true;
            }
            else {
                out.success('你不能在游戏结束前重复执行此命令')
            }
        }
        if (res['start'] == 'start') {//开始游戏
            gameData.game_start = true;

        }
        if (res['stop'] == 'stop') {//强制停止游戏
            gameEnd()
        }
        //conf.close();
    });


    //监听器
    mc.listen('onPlayerDie', (pl, en) => {
        if (gameData.game_start) {
            //pl.teleport(pl.pos.x, (pl.pos.y + 5), pl.pos.z, 0);
            //玩家死亡后清除相关的标签
            pl.addScore('die', 1);
            pl.addTag('die');
            if (pl.hasTag('red_carry')) {
                pl.removeTag('red_carry');
            }
            if (pl.hasTag('blue_carry')) {
                pl.removeTag('blue_carry');
            }
            pl.refreshItems();//刷新物品栏
            pl.refreshChunks();//刷新区块
            if (en != null) {
                if (en.isPlayer()) {
                    player = en.toPlayer();
                    log(player.name);
                    player.addScore('kill', 1);//给杀死该玩家的人增加分数
                }
            }
            let id2 = setTimeout(() => {//给死亡的玩家更改游戏模式 并显示文字
                mc.runcmdEx(`title ${pl.name} title §c§l你死了`);
                mc.runcmdEx(`gamemode c ${pl.name}`);
                mc.runcmdEx(`gamemode ${version} ${pl.name}`);//version是旁观模式的名字
            }, 500);
        }
        return true;
    });
    mc.listen('onRespawn', (pl) => {//复活
        if (gameData.game_start) {
            mc.runcmdEx(`tp ${pl.name} ${pl.lastDeathPos.x} ${pl.lastDeathPos.y} ${pl.lastDeathPos.z} ~`);//传送到死亡位置
            let id, id2, restime = gameData.RespawnTime;//复活时间 秒
            id = setTimeout(() => {
                mc.runcmdEx(`gamemode s ${pl.name}`);
                pl.removeTag('die');
                pl.tell('§a重生！', 5);
            }, (gameData.RespawnTime * 1000));
            id2 = setInterval(() => {//复活倒计时
                if (restime > 0) {
                    pl.tell(`§a${restime}§r秒后复活`, 5);
                    restime--;
                }
                else {
                    clearInterval(id2);
                }
            }, 1000);
        }
    });
    mc.listen('onAttackEntity', (pl, en) => {
        if (en.hasTag('shop')) {//道具商店
            if (gameData.game_start) {
                pl.sendForm(form(), (pl, id) => {
                    formRt(pl, id);
                });
            }
            else {
                pl.tell('游戏未开始');
            }
            return false;
        }
        if(en.hasTag('shop2')){//增益商店
            if (gameData.game_start) {
                pl.sendForm(form2(), (pl, id) => {
                    form2Rt(pl, id);
                });
            }
            else {
                pl.tell('游戏未开始');
            }
            return false;
        }
    });
    mc.listen("onAte", (pl, it) => {//吃完东西事件
        if (gameData.game_start) {
            if (it.type == 'minecraft:sweet_berries') {//如果吃的是 甜浆果 就给予速度二效果
                //funEat(pl, it);//吃东西给予效果
                mc.runcmdEx(`effect "${pl.name}" speed 15 1 false`);
            }
        }
    });
    mc.listen("onMobHurt", (mob, _s, _d, _c) => {
        fun(mob);//回血实现
        gameData.Health = true;
    });

    //tnt爆炸
    mc.listen("onBlockChanged", (bl, bl2) => {//方块被爆炸破坏保护
        if (gameData.game_prepare) {
            if (bl.type != 'minecraft:wool' || bl.type != 'minecraft:tnt') {
                if (bl2.type == 'minecraft:air') {
                    mc.setBlock(bl.pos, bl);
                    return false;
                }
            }
        }
    });
    mc.listen("onEntityExplode", (_en, pos, _ra, _a, _b, _c) => {
        if (gameData.game_prepare) {

            mc.runcmdEx(`execute positioned ${pos.x} ${pos.y} ${pos.z} run kill @e[r=8},type=item]`);
        }
    });
    mc.listen("onDestroyBlock", (pl, bl) => {
        if (gameData.game_prepare) {
            return false;
        }
    });
    
    //tnt自动点燃实现
    mc.listen("afterPlaceBlock", (pl, bl) => {//玩家放置方块
        if (gameData.game_start) {
            if (bl.type == 'minecraft:tnt') {
                bl.destroy(false);//破坏改方块
                /*log(String(bl.pos));//API有问题
                var en = mc.spawnMob('minecraft:tnt',mc.newIntPos(bl.pos.x,bl.pos.y,bl.pos.z,0));
                log(String(en));
                */

                if (pl.hasTag('red_ranks')) {
                    mc.runcmdEx(`summon minecraft:tnt ${bl.pos.x} ${bl.pos.y} ${bl.pos.z} a red_tnt`)
                }
                if (pl.hasTag('blue_ranks')) {
                    mc.runcmdEx(`summon minecraft:tnt ${bl.pos.x} ${bl.pos.y} ${bl.pos.z} a blue_tnt`)
                }
            }
        }
    });
    mc.listen('onMobHurt', (m, s, d, c) => {//实体受伤
        if (m.isPlayer()) {
            //防止被自己队伍的tnt炸到
            if(m.hasTag('red_ranks' && s.name=='red_tnt'){
                return false;
            }
            if(m.hasTag('blue_ranks' && s.name=='blue_tnt'){
                return false;
            }
        }
    });
    
    mc.listen("onProjectileHitBlock",(bl,en)=>{//方块被弹射物击中
        if(bl.type=='minecraft:wool'){//只能破坏羊毛
        if(en.hasTag('red_arrow')){
            if(shopRed.arrowEnhance==false){
                bl.destroy(false);//破坏改方块
                en.kill();
            }
            else{
                
            }
        }
        if(en.hasTag('blue_arrow')){
            if(shopBlue.arrowEnhance==false){
                bl.destroy(false);//破坏改方块
                en.kill();
            }
            else{
                
            }
        }
        }
    });
    mc.listen("onProjectileCreated",(shooter,en)=>{//弹射物创建完毕
        //给弹射物依据玩家标签增加标签
        if(shooter.hasTag('red_ranks')){
            en.addTag('red_arrow');
        }
        if(shooter.hasTag('blue_ranks')){
            en.addTag('blue_arrow');
        }
    });

    /**弃用 被玩家吃东西玩成事件代替*/
    let funEat = Tools.exeOnceAtTime((pl, it) => {//吃东西
        //减少物品
        if (it.count == 1) {
            it.setNull();
        }
        else {
            let itnew = mc.newItem(it.type, (it.count - 1));
            it.set(itnew);
            pl.refreshItems();
            mc.runcmdEx(`effect "${pl.name}" speed 15 1 false`);
        }
    }, 2000);

    let fun = Tools.exeOnceAtTime((pl) => {//回血
        gameData.Health = false;
        let id = setInterval(() => {
            if (pl.maxHealth != pl.health) {
                /*log('a ', pl.maxHealth, ' ', pl.health);
                log(pl.name, pl.name);
                log(mc.runcmdEx(`effect "${pl.name}" regeneration 1 3 true`).output);
                */
                if (gameData.Health) {//实现回血可以打断
                    clearInterval(id);
                    gameData.Health = false;
                }
            }
        }, 200);
    }, 8000);//回血延迟时间
    /**
     * 准备
     */
    function game_prepare() {
        //conf.close();
        let conf = new KVDatabase('./plugins/game');
        pos1 = conf.get('pos1');
        pos2 = conf.get('pos2');
        pos1 = mc.newIntPos(pos1[0], pos1[1], pos1[2], 0);
        pos2 = mc.newIntPos(pos2[0], pos2[1], pos2[2], 0);
        conf.close();
        let red = entity_s(0);
        let blue = entity_s(1);
        data = true;
        //end_red = [];
        //end_blue = [];
        player_list = mc.getOnlinePlayers();
        let all_ranks = {}, start_num = 1;
        //let id1 = tp_start(red, pos1);
        //let id2 = tp_start(blue, pos2);

        for (let i = 0; i < player_list.length; i++) {//清空玩家背包
            player_list[i].getInventory().removeAllItems();
            player_list[i].getArmor().removeAllItems();
            player_list[i].refreshItems();
        }


        try {
            red = TeamData('绿队').teamPl
            blue = TeamData('蓝队').teamPl
            for (let i = 0; i < player_list.length; i++) {
                player_list[i].removeTag('red_ranks');
                player_list[i].removeTag('blue_ranks');
            }
            for (let i = 0; i < red.length; i++) {
                red.addTag('red_ranks');
            }
            for (let i = 0; i < blue.length; i++) {
                blue.addTag('blue_ranks');
            }
        }
        catch (e) {
            for (let j = 0; j < player_list.length; j++) {
                player_list[j].tell('§e使用队伍插件分配队伍时出现问题，请使用/tag进行队伍分配,错误信息已输出至控制台');
                colorLog('red', e);
            }
        }
        let id = setInterval(() => {
            let red_ranks = {}, blue_ranks = {}//实时显示队伍
            for (let j = 0; j < player_list.length; j++) {//分别筛选出两个队伍
                if (player_list[j].hasTag('red_ranks')) {
                    red_ranks[player_list[j].name] = 1;
                }
                if (player_list[j].hasTag('blue_ranks')) {
                    blue_ranks[player_list[j].name] = 3;
                }
            }
            for (let key in blue_ranks) {//合并字典
                all_ranks[key] = blue_ranks[key];
            }
            for (let key in red_ranks) {
                all_ranks[key] = red_ranks[key];
            }
            all_ranks[`§4§2--绿队--`] = 0;
            all_ranks[`§1§l--蓝队--`] = 2;
            for (let i = 0; i < player_list.length; i++) {
                player_list[i].removeSidebar();
                player_list[i].setSidebar('§l§6夺旗', all_ranks, 0);
            }
            //log(game_start);
            if (gameData.game_start) {//游戏开始判断
                clearInterval(id);
                //clearInterval(id1);
                //clearInterval(id2);
                gameStart();
                log('close');
            }

        }, 1000);
        //conf.close();
    }

    /**
     * game_start
     */
    function gameStart() {
        //conf.close();
        conf = new KVDatabase('./plugins/game');
        gameData.game_start = true;
        //let ob_flag = mc.getScoreObjective('flag');
        //let ob_kill = mc.getScoreObjective('kill');
        //let ob_die = mc.getScoreObjective('die');
        log('game_start');
        pos3 = conf.get('pos1');
        pos4 = conf.get('pos2');
        let red_clothes = conf.get('red_clothes');
        let blue_clothes = conf.get('blue_clothes');
        conf.close();
        log(pos4[0], pos4[1], pos4[2]);
        const pos1 = mc.newIntPos(pos3[0], pos3[1], pos3[2], 0);
        const pos2 = mc.newIntPos(pos4[0], pos4[1], pos4[2], 0);
        log(pos2);
        log(pos2.x);
        let player_list = mc.getOnlinePlayers();
        let blue_flag_player = mc.getPlayer('blue');
        let red_flag_player = mc.getPlayer('red');
        let data = {};
        ob_flag.setScore("red", 0);
        ob_flag.setScore("blue", 0);

        //--已弃用--//
        //适配新版1.19.50 execute
        /*var execute_cmd_blue = 'execute @a[name=blue] ~ ~ ~ tag @a[r=0.5,tag=red_ranks] add red_carry';
        if (mc.getServerProtocolVersion() >= 560) {//判断版本以兼容1.19.50 blue
            execute_cmd_blue = 'execute as @a[name=blue] positioned ~ ~ ~ run tag @a[r=0.5,tag=red_ranks] add red_carry';
            log('使用新版execute');
        }
        var execute_cmd_red = 'execute @a[name=red] ~ ~ ~ tag @a[r=0.5,tag=blue_ranks] add blue_carry';
        if (mc.getServerProtocolVersion() >= 560) {//判断版本以兼容1.19.50 red
            execute_cmd_red = 'execute as @a[name=red] positioned ~ ~ ~ run tag @a[r=0.5,tag=blue_ranks] add blue_carry';
        }*/

        for (let j = 0; j < player_list.length; j++) {//初始化队伍信息
            let pl_ct = player_list[j].getArmor();
            player_list[j].removeSidebar();
            player_list[j].removeTag('die');
            player_list[j].removeTag('red_carry');
            player_list[j].removeTag('blue_carry');
            money.set(player_list[j].xuid, 0);
            ob_kill.setScore(player_list[j], 0);
            ob_die.setScore(player_list[j], 0);

            //设置衣服
            if (player_list[j].hasTag('red_ranks')) {
                for (let i = 0; i < red_clothes.length; i++) {
                    pl_ct.setItem(i, mc.newItem(NBT.parseSNBT(red_clothes[i])));
                }
            }
            if (player_list[j].hasTag('blue_ranks')) {
                for (let i = 0; i < blue_clothes.length; i++) {
                    pl_ct.setItem(i, mc.newItem(NBT.parseSNBT(blue_clothes[i])));
                }
            }
            player_list[j].refreshItems();
        }

        let playerXuidList = [];
        for (let j = 0; j < player_list.length; j++) {//获取玩家xuid列表
            playerXuidList.push(player_list[j].xuid)
        }

        //let id1 = tp_start(red, pos1);
        //let id2 = tp_start(blue, pos2)
        var id = setInterval(() => {
            for (let j = 0; j < player_list.length; j++) {
                if (player_list[j].hasTag('red_ranks')) {
                    //log(data);
                    data = {};
                    data[`§o§7时间： ${system.getTimeStr()}`] = 0;
                    data[`您的队伍： §2绿队`] = 1;
                    data[`击杀： §a§l${String(ob_kill.getScore(player_list[j]))}`] = 2;
                    data[`死亡： §a§l${String(ob_die.getScore(player_list[j]))}`] = 3;
                    data[`经济： §a§l${String(money.get(playerXuidList[j]))}`] = 4;
                    data[`§6§l完成进度§r(§oN/§c3§r)：`] = 5;
                    data[`§2绿队§r(${getFlagState('red')})： §a§l${String(ob_flag.getScore('red'))}`] = 6;
                    data[`§1蓝队§r(${getFlagState('blue')})： §a§l${String(ob_flag.getScore('blue'))}`] = 7;
                    //log(data);
                    player_list[j].removeSidebar();
                    player_list[j].setSidebar('§l§6夺旗', data, 0);
                }
                if (player_list[j].hasTag('blue_ranks')) {
                    data = {};
                    data[`§o§7时间： ${system.getTimeStr()}`] = 0;
                    data[`您的队伍： §1蓝队`] = 1;
                    data[`击杀： §a§l${String(ob_kill.getScore(player_list[j]))}`] = 2;
                    data[`死亡： §a§l${String(ob_die.getScore(player_list[j]))}`] = 3;
                    data[`经济： §a§l${String(money.get(playerXuidList[j]))}`] = 4;
                    data[`§6§l完成进度§r(§oN/§c3§r)：`] = 5;
                    data[`§2绿队§r(${getFlagState('red')})： §a§l${String(ob_flag.getScore('red'))}`] = 6;
                    data[`§1蓝队§r(${getFlagState('blue')})： §a§l${String(ob_flag.getScore('blue'))}`] = 7;
                    player_list[j].removeSidebar();
                    player_list[j].setSidebar('§l§6夺旗', data, 0);
                }
                money.add(playerXuidList[j], 1);//每秒基础经济
                /*if (player_list[j].isHungry) {//让玩家可以吃东西
                    mc.runcmdEx(`effect "${player_list[j].name}" saturation 1 0 true`);
                }*/
            }

            isVictory();//胜利判断
        }, 1000);


        var blue = mc.getPlayer('blue');
        var red = mc.getPlayer('red');

        var id3 = setInterval(() => {
            for (let k = 0; k < player_list.length; k++) {
                if (!hasTagAll('red_carry')/*player_list[k].hasTag('red_carry')*/) {//蓝队丢失
                    if (!hasTagAll('die')) {
                        if (isSameBlockPos(blue_flag_player, player_list[k])) {
                            if (player_list[k].hasTag('red_ranks')) {
                                player_list[k].addTag('red_carry');
                            }
                        }
                        //log(mc.runcmdEx(execute_cmd_blue));//用适配过的指令
                        loop_red = true;
                        for (let j = 0; j < player_list.length; j++) {
                            player_list[j].removeBossBar(1);
                        }
                    }
                }

                else if (player_list[k].hasTag('red_carry')) {
                    loop_red = false;
                    mc.runcmdEx(`effect "${player_list[k].name}" slowness 1 1 true`);//给获得旗帜的玩家缓慢效果
                    blue.teleport(player_list[k].pos.x, (player_list[k].pos.y + 0.8), player_list[k].pos.z, 0);//将旗帜假人传送到玩家头顶
                    if (loop_red) {
                        //clearInterval(id2);

                    }


                }
                if (!hasTagAll('blue_carry')) {//绿队丢失
                    if (!hasTagAll('die')) {
                        if (isSameBlockPos(red_flag_player, player_list[k])) {
                            if (player_list[k].hasTag('blue_ranks')) {
                                player_list[k].addTag('blue_carry');
                            }
                        }
                        //mc.runcmdEx(execute_cmd_red);//用适配过的命令
                        loop_blue = true;
                        for (let j = 0; j < player_list.length; j++) {
                            player_list[j].removeBossBar(0);
                        }
                    }
                }
                else if (player_list[k].hasTag('blue_carry')) {
                    loop_blue = false;
                    mc.runcmdEx(`effect "${player_list[k].name}" slowness 1 1 true`);
                    red.teleport(player_list[k].pos.x, (player_list[k].pos.y + 0.8), player_list[k].pos.z, 0);
                    if (loop_blue) {
                        //clearInterval(id1);
                    }

                }
            }

            number3 = blue.blockPos.x - pos2.x;
            number2 = blue.blockPos.z - pos2.z;
            number1 = blue.blockPos.y - pos2.y;
            //number = number1 + number2 + number3;
            //log(number1,number2,number3);
            //log(number1 != 0&&number2 != 0&&number3!=0);
            //log(String(loop_red));

            //让满足条件的旗帜假人回到旗帜生成点 
            if (loop_red) {
                if (number1 != 0 || number2 != 0 || number3 != 0/*blue.blockPos.x,blue.blockPos.y,blue.blockPos.z != pos2.x,pos2.y,pos2.z*/) {
                    //boss条修好了在这加
                    BlueGameTime += 0.5;
                    if (BlueGameTime >= 100) {
                        blue.teleport(pos2);
                        BlueGameTime = 0;
                    }
                }
            }
            if (loop_blue) {
                //debug的时候验证可用
                if (red.blockPos.x != pos1.x || red.blockPos.y != pos1.y || red.blockPos.z != pos1.z) {
                    RedGameTime += 0.5;
                    if (RedGameTime >= 100) {
                        red.teleport(pos1);
                        RedGameTime = 0;
                    }
                }
            }

            for (let i = 0; i < player_list.length; i++) {
                if (player_list[i].hasTag('red_carry')) {//绿队交付
                    //log(player_list[i].blockPos.x,' ',conf.get('pos1')[0],' ',RedGameTime);
                    if (!loop_red && player_list[i].blockPos.x == pos1.x && player_list[i].blockPos.y == pos1.y && player_list[i].blockPos.z == pos1.z) {
                        player_list[i].removeTag('red_carry');
                        blue.teleport(pos2);
                        ob_flag.addScore('red', 1);
                        for (let j = 0; j < player_list.length; j++) {
                            if (player_list[j].hasTag('red_ranks')) {
                                money.add(playerXuidList[j], 50);
                                player_list[j].tell('§e交付奖励： §r§a§l50 §e§l§o金钱');
                            }
                        }
                        player_list[i].tell('§e额外奖励： §r§a§l100 §e§l§o金钱');
                        money.add(player_list[i].xuid, 100);
                    }
                }
                if (player_list[i].hasTag('blue_carry')) {//蓝队交付
                    if (!loop_blue && player_list[i].blockPos.x == pos2.x && player_list[i].blockPos.y == pos2.y && player_list[i].blockPos.z == pos2.z) {
                        player_list[i].removeTag('blue_carry');
                        red.teleport(pos1);
                        ob_flag.addScore('blue', 1);
                        for (let j = 0; j < player_list.length; j++) {
                            if (player_list[j].hasTag('blue_ranks')) {
                                money.add(playerXuidList[j], 50);
                                player_list[j].tell('§e交付奖励： §r§a§l50 §e§l§o金钱');
                            }
                        }
                        player_list[i].tell('§e额外奖励： §r§a§l100 §e§l§o金钱');
                        money.add(player_list[i].xuid, 100);
                    }
                }
            }
        }, 50);
        gameData.setIntervalList.push(id);
        gameData.setIntervalList.push(id3);
    }

    /**
     * 生成实体
     * @param {Number} num 
     * @return 玩家对象
     */
    function entity_s(num) {
        //conf.close();
        conf = new KVDatabase('./plugins/game');
        pos1 = conf.get('pos1');
        pos2 = conf.get('pos2');
        pos1 = mc.newIntPos(pos1[0], pos1[1], pos1[2], 0);
        pos2 = mc.newIntPos(pos2[0], pos2[1], pos2[2], 0);
        if (num == 0) {
            en = mc.spawnSimulatedPlayer('red', pos1);
            en.addTag('game_red');
            en.setGameMode(1);
            ct = en.getArmor();
            ct.setItem(1, mc.newItem(NBT.parseSNBT(conf.get('red_flag'))));//通过string生成物品
            en.refreshItems();
        }
        else {
            en = mc.spawnSimulatedPlayer('blue', pos2);
            en.addTag('game_blue');
            en.setGameMode(1);
            ct = en.getArmor();
            ct.setItem(1, mc.newItem(NBT.parseSNBT(conf.get('blue_flag'))));
            en.refreshItems();
        }
        conf.close();
        return en;
    }
    /**
     * 检查玩家中是否有tag
     * @param {String} tag
     * @return {boolean}
     */
    function hasTagAll(tag) {
        let list = [];
        let player = mc.getOnlinePlayers();
        for (let z = 0; z < player.length; z++) {
            //log('tag');
            if (player[z].hasTag(tag)) {
                list.push('t');
            }
            else {
                list.push('f');
            }
        }
        //log(list,player);
        if (list.indexOf('t') == -1) {
            return false;
        }
        else {
            return true;
        }
    }
    /**
     * 获取flag状态
     * @param {string} ranks
     * @return {String}
     */
    function getFlagState(ranks) {
        if (ranks == 'blue') {
            //log(String(loop_red),' ',BlueGameTime);
            if (loop_red && BlueGameTime != 0) {
                return '§l恢复剩余： §a§l' + String(10 - (Math.round(BlueGameTime / 10))) + '§r§o§7秒§r';
            }
            else if (hasTagAll('red_carry')) {
                return '§e§l丢失§r';
            }
            else {
                return '§b§l完好§r';
            }
        }
        if (ranks == 'red') {
            if (loop_blue && RedGameTime != 0) {
                return '§l恢复剩余： §a§l' + String(10 - (Math.round(RedGameTime / 10))) + '§r§o§7秒§r';
            }
            else if (hasTagAll('blue_carry')) {
                return '§e§l丢失§r';
            }
            else {
                return '§b§l完好§r';
            }
        }
    }

    /**
     * 胜利判断
     */
    function isVictory() {
        if (ob_flag.getScore('red') >= 3 || ob_flag.getScore('blue') >= 3) {
            gameEnd();
            gameData.game_prepare = true;
            setTimeout(game_prepare, 800);
            game_prepare();
            
    }

    /**
     * 玩家是否有某物品
     * @param {Player} pl 玩家对象
     * @param {String} item 物品标标准类型名
     * @return {Number} 有时返回位置，没有返回-1
     */
    function hasItem(pl, item) {
        let plBag = pl.getInventory();
        let plBagItemType = plBag.getAllItems();
        for (let i = 0; i < plBagItemType.length; i++) {//转为标准类型名列表
            plBagItemType[i] = plBagItemType[i].type;
        }
        return plBagItemType.indexOf(item);
    }

    /**
     * 实体是否在同一位置上
     * @param {Entity} en1
     * @param {Entity} en2
     * @return {boolean}
     */
    function isSameBlockPos(en1, en2) {
        try {
            if (en1.blockPos.x == en2.blockPos.x && en1.blockPos.y == en2.blockPos.y && en1.blockPos.z == en2.blockPos.z) {
                return true;
            }

            else {
                return false;
            }
        }
        catch (e) {
            return false;
        }
    }

    /**
     * 获取圆形的边的坐标
     * @param {Number} a 横坐标
     * @param {Number} b 纵坐标
     * @param {Number} r 半径
     * @returns {Object} XY坐标键值对
     */
    function getRoundPosList(a, b, r) {
        let list = {};
        let startX = a - r;
        let endX = a + r;
        let Y1 = null, Y2 = null;
        for (let i = 0; i <= (endX - startX); i++) {
            let c = ((((startX + i) - a) ** 2) - (r ** 2) + (b ** 2));
            let delta = ((2 * b) ** 2) - (4 * c);
            if (delta > 0) {
                Y1 = (-1 * (2 * b) + Math.sqrt(delta)) / 2;
                Y2 = (-1 * (2 * b) - Math.sqrt(delta)) / 2;
            }
            if (delta === 0) {
                Y1 = (-1 * (2 * b) + Math.sqrt(delta)) / 2;
                Y2 = Y1;
            }
            log(Y1, ' ', Y2);
            list[startX + i] = [Math.round(Y1), Math.round(Y2)];
        }
        return list;
    }
    /**
     * 球形填充
     * @param {IntPos} intPos 坐标对象
     * @param {Number} r 半径
     */
    function sphericalFill(intPos, r, typeStr = 'minecraft:stone') {
        //水平面
        prototypePlaneFill(intPos.x, intPos.y, intPos.z, r, typeStr);
        //竖直平面
        let list = prototypePlaneFill(intPos.x, intPos.z, intPos.y, r, typeStr);
        //完整填充
        for (let i = 0; i < list.length; i++) {
            prototypePlaneFill(intPos.y, intPos.x, intPos.z, list[i], typeStr);
        }
    }
    /**
     * 实心圆形平面填充
     * @param {number} x x坐标
     * @param {number} y y坐标
     * @param {number} z z坐标
     * @param {number} r 半径
     * @param {String} typeStr 方块类型：标准类型名
     */
    function prototypePlaneFill(x, y, z, r, typeStr = 'minecraft:stone') {
        let list = getRoundPosList(x, z, r);//获取坐标键值对
        let keys = Object.keys(list);//获取键
        let values = Object.values(list);//获取值
        let lengthList = [];//两点的距离列表
        log(list);
        for (let i = 0; i < keys.length; i++) {
            //log(typeof String(keys[i]),typeof y,typeof values[i][0], 0,typeof typeStr, 0)
            mc.setBlock(Number(keys[i]), y, values[i][0], 0, typeStr, 0);
            mc.setBlock(Number(keys[i]), y, values[i][1], 0, typeStr, 0);
            for (let j = 0; j < Math.abs(values[i][0] - values[i][1]); j++) {
                mc.setBlock(Number(keys[i]), y, (values[i][0] + j), 0, typeStr, 0);
            }
            lengthList.push(Math.round(Math.abs(values[i][0] - values[i][1]) / 2));//计算出列表的值
        }
        return lengthList;
    }

    /**
     * 游戏结束并清理
     */
    function gameEnd() {
        //conf.close();
        let pl = mc.getOnlinePlayers();
        let list = gameData.setIntervalList;
        for (let i = 0; i < list.length; i++) {
            clearInterval(list[i]);
            delete gameData.setIntervalList[i];
        }
        for (let i = 0; i < pl.length; i++) {
            pl[i].removeSidebar();
        }
        mc.getPlayer('red').simulateDisconnect();//模拟玩家退出游戏
        mc.getPlayer('blue').simulateDisconnect();
        for (let i = 0; i < pl.length; i++) {//清空玩家背包
            pl[i].getInventory().removeAllItems();
            //pl[i].getArmor().removeAllItems();
            pl[i].refreshItems();
        }
        gameData.reload();//重置游戏变量
        shop.reload();//重置增益商店变量
    }
    
    //增益商店变量
    var shopRed = {
        arrowEnhance = false;
        blockEnhance = false;
        absorption = false;//伤害吸收
        rapidRebirth = false;//快速重生
        flagCurse = false;//旗帜诅咒
    }
    var shopBlue = {
        arrowEnhance = false;
        blockEnhance = false;
        absorption = false;//伤害吸收
        rapidRebirth = false;//快速重生
        flagCurse = false;//旗帜诅咒
    }
    //重置变量函数
    var shop.reload = function (){
        shopBlue = {
        arrowEnhance = false;
        blockEnhance = false;
        absorption = false;//伤害吸收
        rapidRebirth = false;//快速重生
        flagCurse = false;//旗帜诅咒
    }
    shopRed = {
        arrowEnhance = false;
        blockEnhance = false;
        absorption = false;//伤害吸收
        rapidRebirth = false;//快速重生
        flagCurse = false;//旗帜诅咒
    }
    }
    
    /**
     * 增益商店表单
     */
    function form2() {
        let fm = mc.newSimpleForm();
        fm = fm.setTitle('增益商店');
        fm = fm.setContent('在这里购买增益');
        fm = fm.addButton('§l§a箭升级\n§l§e125经济');
        fm = fm.addButton('§l§a方块升级\n§l§e200经济');
        fm = fm.addButton('§l§a伤害吸收\n§l§e250经济');
        fm = fm.addButton('§l§a快速重生\n§l§e350经济');
        fm = fm.addButton('§l§a旗帜诅咒\n§l§e200经济');
        return fm;
    }
    function form2Rt(pl,id){
        let playerList = mc.getOnlinePlayers();//获取在线玩家

        if (id != null) {
            pl.sendForm(form(), formRt);
        }
        switch (id) {
            case 0:
                if (money.get(pl.xuid) >= 125) {
                    if(
                    pl.tell('§o§7已购买§l§a箭升级');
                    money.reduce(pl.xuid, 125);
                    break;
                }
        }
    }

    /**
     * 表单
     */
    function form() {
        let fm = mc.newSimpleForm();
        fm = fm.setTitle('商店');
        fm = fm.setContent('在这里购买装备或道具');
        fm = fm.addButton('§l§a方块*16\n§l§e15经济');
        fm = fm.addButton('§l§a箭*16\n§l§e25经济');
        fm = fm.addButton('§l§a速度浆果*1\n§l§e40经济');
        fm = fm.addButton('§l§aTNT*1\n§l§e75经济');
        fm = fm.addButton('§l§a铁剑*1\n§l§e100经济');
        fm = fm.addButton('§l§a钻石剑*1\n§l§e200经济');
        fm = fm.addButton('§l§a铁套*1\n§l§e100经济');
        return fm;
    }
    function formRt(pl, id) {
        let plBag = pl.getInventory();//获取玩家背包对象
        let plArmor = pl.getArmor();//获取盔甲栏容器对象

        if (id != null) {
            pl.sendForm(form(), formRt);
        }
        switch (id) {
            case 0:
                if (money.get(pl.xuid) >= 15) {
                    let item = mc.newItem('minecraft:wool', 16);
                    if (pl.hasTag('red_ranks')) {//设置数据值API不能用
                        //item.setAux(1);
                        mc.runcmdEx(`give ${pl.name} wool 16 13`);
                    }
                    if (pl.hasTag('blue_ranks')) {
                        //item.setAux(2);
                        mc.runcmdEx(`give ${pl.name} wool 16 11`);
                    }
                    //pl.giveItem(item);
                    pl.tell('§o§7已购买§l§a方块*16');
                    money.reduce(pl.xuid, 15);
                    break;
                }
            case 1:
                if (money.get(pl.xuid) >= 25) {
                    pl.giveItem(mc.newItem('minecraft:arrow', 16));
                    pl.tell('§o§7已购买§l§a箭*16');
                    money.reduce(pl.xuid, 25);
                    break;
                }
            case 2:
                if (money.get(pl.xuid) >= 40) {
                    pl.giveItem(mc.newItem('minecraft:sweet_berries', 1)).setLore(['速度Ⅲ']);
                    pl.tell('§o§7已购买§l§a速度浆果*1');
                    money.reduce(pl.xuid, 40);
                    break;
                }
            case 3:
                if (money.get(pl.xuid) >= 75) {
                    pl.giveItem(mc.newItem('minecraft:tnt', 1));
                    pl.tell('§o§7已购买§l§aTNT*1');
                    money.reduce(pl.xuid, 75);
                    break;
                }
            case 4:
                if (money.get(pl.xuid) >= 100) {
                    if (hasItem(pl, 'minecraft:iron_sword') == -1 && hasItem(pl, 'minecraft:diamond_sword') == -1) {//判断是否已有
                        if (hasItem(pl, 'minecraft:stone_sword') != -1) {//将石剑替换为铁剑
                            plBag.setItem(hasItem(pl, 'minecraft:stone_sword'), mc.newItem('minecraft:iron_sword', 1));
                        }
                        else {
                            pl.giveItem(mc.newItem('minecraft:iron_sword', 1));
                        }
                        pl.refreshItems();
                        pl.tell('§o§7已购买§l§a铁剑*1');
                        money.reduce(pl.xuid, 100);
                    }
                    break;
                }
            case 5:
                if (money.get(pl.xuid) >= 200) {
                    if (hasItem(pl, 'minecraft:diamond_sword') == -1) {//判断是否已有
                        if (hasItem(pl, 'minecraft:stone_sword') != -1) {//将石剑替换为铁剑
                            plBag.setItem(hasItem(pl, 'minecraft:stone_sword'), mc.newItem('minecraft:iron_sword', 1));
                        }
                        else if (hasItem(pl, 'minecraft:iron_sword') != -1) {
                            plBag.setItem(hasItem(pl, 'minecraft:iron_sword'), mc.newItem('minecraft:diamond_sword', 1));
                        }
                        else {
                            pl.giveItem(mc.newItem('minecraft:diamond_sword', 1));
                        }
                        pl.tell('§o§7已购买§l§a钻石剑*1');
                        money.reduce(pl.xuid, 200);
                    }
                    break;
                }
            case 6:
                if (money.get(pl.xuid) >= 100) {
                    if (plArmor.getItem(2).type != 'minecraft:iron_leggings' && plArmor.getItem(3).type != 'minecraft:iron_boots') {
                        plArmor.setItem(2, mc.newItem('minecraft:iron_leggings', 1));
                        plArmor.setItem(3, mc.newItem('minecraft:iron_boots', 1));
                    }
                    pl.tell('§o§7已购买§l§a铁制套装*1');
                    money.reduce(pl.xuid, 100);
                    break;
                }


        }
        pl.refreshItems();//刷新物品栏
    }
    /* let id = setInterval(() => {
         for (let z = 0; z < mc.getOnlinePlayers().length; z++) {
             mc.getOnlinePlayers()[z].setBossBar(1, `§1§l蓝队 §r旗帜正在恢复 §l剩余时间： §r§o秒`, 50, 2);
         }
     },1000);*/
    conf.close();
});