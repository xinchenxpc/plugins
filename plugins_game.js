//LiteLoaderScript Dev Helper
/// <reference path="d:\project/dts/llaids/src/index.d.ts"/> 

ll.registerPlugin(
    /* name */ "CTF",
    /* introduction */ "CTF 夺旗 跨年小游戏项目",
    /* version */ [0,0,1],
    /* otherInformation */ {}
); 



//导入函数
try {
    var PlayerTeamData = ll.import('playerTeamData');
    var TeamData = ll.import('TeamData');
}
catch (e) {
    colorLog('yellow', '缺少前置队伍插件，这可能会带来一些错误！');
}

//conf = new KVDatabase('./plugins/game');
var version = '6';//这个还要用
var game_start = false;
var RedGameTime = 0;
var BlueGameTime = 0;
var loop_red = false;
var loop_blue = false;
const gameData = {
    game_start: false,
    game_prepare: false,
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
    static exeOnceAtTime(func, during_time) {
        let lastFlag = {
            last_timer: null,
            need_exe: true,
        }
        let exeFunc = (...arg) => {
            if (lastFlag.last_timer != null) {
                clearInterval(lastFlag.last_timer)
            }
            lastFlag.need_exe = false

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
    cmd.mandatory("action", ParamType.Enum, "a", 1);
    cmd.mandatory("op", ParamType.Enum, "b", 1);
    cmd.mandatory("flag", ParamType.Enum, "c", 1);
    cmd.mandatory("xyz", ParamType.Enum, "d", 1);
    cmd.mandatory("start", ParamType.Enum, "e", 1);
    cmd.mandatory("stop", ParamType.Enum, "f", 1);
    cmd.mandatory("debug", ParamType.Enum, "g", 1);
    cmd.mandatory("get", ParamType.Enum, "h", 1);
    cmd.overload(['debug','get','flag']);
    cmd.overload(['action']);
    cmd.overload(['start']);
    cmd.overload(['stop']);
    cmd.overload(['op', 'flag']);
    cmd.overload(['op', 'xyz', 'flag']);
    cmd.setup();
    cmd.setCallback((_cmd, ori, out, res) => {

        if(res['debug'] == 'debug'){
            if(res['get'] == 'get'){
                if(res['flag'] == 'red'){//获取两队衣服NBTjson字符串
                    let conf = new KVDatabase('./plugins/game');
                    let itemlist =ori.player.getArmor().getAllItems();
                    let itemListNew = [];
                    for(let i = 0; i < itemlist.length; i++){
                        itemListNew.push(itemlist[i].getNbt().toSNBT());
                    }
                    conf.set('red_clothes', itemListNew);
                    conf.close();
                }
                if(res['flag'] == 'blue'){
                    let conf = new KVDatabase('./plugins/game');
                    let itemlist =ori.player.getArmor().getAllItems();
                    let itemListNew = [];
                    for(let i = 0; i < itemlist.length; i++){
                        itemListNew.push(itemlist[i].getNbt().toSNBT());
                    }
                    conf.set('blue_clothes', itemListNew);
                    conf.close();
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
            pl.addScore('die', 1);
            pl.addTag('die');
            if (pl.hasTag('red_carry')) {
                pl.removeTag('red_carry');
            }
            if (pl.hasTag('blue_carry')) {
                pl.removeTag('blue_carry');
            }
            pl.refreshItems();
            pl.refreshChunks();
            if (en != null) {
                if (en.isPlayer()) {
                    player = en.toPlayer();
                    log(player.name);
                    player.addScore('kill', 1);
                }
            }
            let id2 = setTimeout(() => {
                mc.runcmdEx(`tp ${pl.name} ${pl.pos.x} ${pl.pos.y} ${pl.pos.z} ~`);
                mc.runcmdEx(`title ${pl.name} title §c§l你死了`);
                mc.runcmdEx(`gamemode c ${pl.name}`);
                mc.runcmdEx(`gamemode ${version} ${pl.name}`);//version是旁观模式
            }, 500);
        }
        return true;
    });
    mc.listen('onRespawn', (pl) => {
        let id, id2, restime = gameData.RespawnTime;
        id = setTimeout(() => {
            mc.runcmdEx(`gamemode s ${pl.name}`);
            pl.removeTag('die');
        }, gameData.RespawnTime);
        id2 = setInterval(() => {
            if (restime > 0) {
                pl.tell(`§a${restime}§r秒后复活`,5);
                restime--;
            }
            else{
                clearInterval(id2);
            }
        }, 1000);
    });
    mc.listen('onAttackEntity', (pl, en) => {
        if (en.hasTag('shop')) {
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
    });
    mc.listen("onUseItem", (pl, it) => {//代替吃东西事件
        if (it.type == 'minecraft:sweet_berries') {
            funEat(pl, it);
        }
    });
    mc.listen("onMobHurt", (mob, _s, _d, _c) => {
        fun(mob);
        gameData.Health = true;
    });
    mc.listen("onBlockExploded", (bl, _en) => {//方块被爆炸破坏
        if (gameData.game_prepare) {
            if (bl.type != 'minecraft:wool') {
                mc.setBlock(bl.pos, bl);
            }
        }
    });
    mc.listen("onDestroyBlock", (pl, bl) => {
        if (gameData.game_prepare) {
            return false;
        }
    });

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
                log('a ', pl.maxHealth, ' ', pl.health);
                log(pl.name, pl.name);
                log(mc.runcmdEx(`effect "${pl.name}" regeneration 1 3 true`).output);
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
                player_list[j].tell('§e使用队伍插件分配队伍时出现错误，错误信息已输出至控制台');
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
        let data = {};
        ob_flag.setScore("red", 0);
        ob_flag.setScore("blue", 0);

        //适配新版1.19.50 execute
        var execute_cmd_blue = 'execute @a[name=blue] ~ ~ ~ tag @a[r=0.5,tag=red_ranks] add red_carry';
        if (mc.getServerProtocolVersion() >= 560) {//判断版本以兼容1.19.50
            execute_cmd_blue = 'execute as @a[name=blue] positioned ~ ~ ~ run tag @a[r=0.5,tag=red_ranks] add red_carry';
        }

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
            if(player_list[j].hasTag('red_ranks')){
                for(let i = 0; i < red_clothes.length; i++){
                    pl_ct.setItem(i,mc.newItem(NBT.parseSNBT(red_clothes[i])));
                }
            }
            if(player_list[j].hasTag('blue_ranks')){
                for(let i = 0; i < blue_clothes.length; i++){
                    pl_ct.setItem(i,mc.newItem(NBT.parseSNBT(blue_clothes[i])));
                }
            }
            player_list[j].refreshItems();
        }
        let playerXuidList = [];
        for (let j = 0; j < player_list.length; j++) {
            playerXuidList.push(player_list[j].xuid)
        }

        //分配队伍衣服

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

                        mc.runcmdEx('execute @a[name=blue] ~ ~ ~ tag @a[r=0.5,tag=red_ranks] add red_carry');
                        loop_red = true;
                        for (let j = 0; j < player_list.length; j++) {
                            player_list[j].removeBossBar(1);
                        }
                    }
                }

                else if (player_list[k].hasTag('red_carry')) {
                    loop_red = false;
                    mc.runcmdEx(`effect "${player_list[k].name}" slowness 1 1 true`);
                    blue.teleport(player_list[k].pos.x, (player_list[k].pos.y + 0.8), player_list[k].pos.z, 0);
                    if (loop_red) {
                        //clearInterval(id2);

                    }


                }
                if (!hasTagAll('blue_carry')) {//绿队丢失
                    if (!hasTagAll('die')) {
                        mc.runcmdEx('execute @a[name=red] ~ ~ ~ tag @a[r=0.5,tag=blue_ranks] add blue_carry');
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
        if (ob_flag.getScore('red') >= 3) {
            gameEnd();
            gameData.game_prepare = true;
            setTimeout(game_prepare, 800);
        }
        if (ob_flag.getScore('blue') >= 3) {
            gameEnd();
            setTimeout(game_prepare, 800);
            gameData.game_prepare = true;
            game_prepare();
        }
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
        gameData.reload();
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
        fm = fm.addButton('§l§a钻石剑*16\n§l§e200经济');
        fm = fm.addButton('§l§a铁套*1\n§l§e100经济');
        return fm;
    }
    function formRt(pl, id) {
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

                    break;
                }
        }
    }
    /* let id = setInterval(() => {
         for (let z = 0; z < mc.getOnlinePlayers().length; z++) {
             mc.getOnlinePlayers()[z].setBossBar(1, `§1§l蓝队 §r旗帜正在恢复 §l剩余时间： §r§o秒`, 50, 2);
         }
     },1000);*/
    conf.close();
});