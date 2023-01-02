let conf = new JsonConfigFile('./plugins/noticeListConfig/config.json');
let noticeList = conf.init('noticeList', []);
conf.close();

mc.listen("onServerStarted", () => {
    const cmd = mc.newCommand('notice', '公告相关', PermType.Any);
    cmd.setEnum('ls', ['list', 'set']);
    cmd.setEnum('st', ['set']);
    cmd.mandatory("list", ParamType.Enum, "ls", 1);
    cmd.mandatory("list", ParamType.Enum, 'st', 1);
    cmd.optional('timeOut', ParamType.Int);
    cmd.optional('title', ParamType.String);
    cmd.optional('notice', ParamType.String);
    cmd.overload(['list', 'timeOut', 'title', 'notice']);
    cmd.overload(['list']);
    cmd.setCallback((cmd, ori, output, res) => {
        switch (res['list']) {
            case 'list':
                ori.player.sendForm(form(), formRt);
                break;
            case 'set':
                if (ori.player.isOP()) {
                    if (res['title'] != undefined && res['timeOut'] != undefined && res['notice'] != undefined) {
                        let conf = new JsonConfigFile('./plugins/noticeListConfig/config.json');
                        let noticeList = conf.get('noticeList');
                        let noticeListObj = {};
                        noticeListObj['title'] = res['title'];
                        noticeListObj['notice'] = res['notice'];
                        noticeListObj['timeOut'] = res['timeOut'];
                        noticeListObj['readPl'] = [];
                        noticeList.push(noticeListObj);
                        conf.set('noticeList', noticeList);
                        conf.close();
                    }
                    else {
                        if (res['title'] == undefined && res['timeOut'] == undefined && res['notice'] == undefined) {
                            ori.player.sendForm(setForm(), setFormRt);
                        }
                        else {
                            ori.player.tell('缺少参数！')
                        }
                    }

                }
                else {
                    ori.player.tell('您没有权限');
                }
                break;
        }
    });
    cmd.setup();
});

/**
 * set表单
 */
function setForm() {
    let fm = mc.newCustomForm();
    fm = fm.setTitle('公告设置');
    fm = fm.addInput('标题');
    fm = fm.addInput('内容');
    fm = fm.addInput('阅读时间', '单位 秒');
    return fm;
}
/**
 * set回调
 */
function setFormRt(_pl, data) {
    if (data != undefined) {
        let conf = new JsonConfigFile('./plugins/noticeListConfig/config.json');
        let noticeList = conf.get('noticeList');
        let noticeListObj = {};
        noticeListObj['title'] = data[0];
        noticeListObj['notice'] = data[1];
        noticeListObj['timeOut'] = Number(data[2]);
        noticeListObj['readPl'] = [];
        noticeList.push(noticeListObj);
        conf.set('noticeList', noticeList);
        conf.close();
    }
}

/**
 * 表单
 */
function form() {
    let conf = new JsonConfigFile('./plugins/noticeListConfig/config.json');
    let noticeList = conf.get('noticeList');
    conf.close();
    let fm = mc.newSimpleForm();
    fm = fm.setTitle('公告列表');
    if (noticeList.length == 0) {
        fm = fm.setContent('还没有任何公告');
    }
    else {
        fm = fm.setContent(`有${noticeList.length}条公告`);
        for (let i = 0; i < noticeList.length; i++) {
            fm = fm.addButton(noticeList[i]['title']);
        }
    }
    return fm;
}
/**
 * 回调
 */
function formRt(pl, id) {
    let conf = new JsonConfigFile('./plugins/noticeListConfig/config.json');
    let noticeList = conf.get('noticeList');
    conf.close();
    let isOver = false;
    //log('out');
    pl.sendSimpleForm(noticeList[id]['title'], noticeList[id]['notice'], ['确定', '取消'], ['', ''], (pl1, id1) => { });
}

mc.listen("onJoin", (pl) => {
    notice(pl);
});

/**
 * 公告
 */
function notice(pl) {
    let conf = new JsonConfigFile('./plugins/noticeListConfig/config.json');
    let noticeList = conf.get('noticeList');
    conf.close();
    let newNotice = noticeList[noticeList.length - 1];
    if (newNotice['readPl'].indexOf(pl.name) == -1) {
        let isOver = false;
        pl.sendSimpleForm(newNotice['title'], newNotice['notice'], ['确定', '取消'], ['', ''], (pl1, id1) => {

            if (id1 == 1 || id1 == undefined) {
                pl1.kick('您取消了公告');
            }
            else if (id1 == 0, !isOver) {
                pl1.sendModalForm('提示', '您读的太快了！', '好的', '确定', (pl2, _re) => {
                    notice(pl2);
                });
            }
            else {
                let conf = new JsonConfigFile('./plugins/noticeListConfig/config.json');
                let noticeList = conf.get('noticeList');
                noticeList[noticeList.length - 1]['readPl'].push(pl.name);
                conf.set('noticeList', noticeList);
                conf.close();
            }
        });

        let timeid = setTimeout(() => {
            isOver = true;
        }, (newNotice['timeOut'] * 1000));
    }
}
