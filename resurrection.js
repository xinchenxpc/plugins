var deathPos = {};

mc.listen("onPlayerDie",(pl,_en)=>{
    //log(String(pl));
    //log(pl.pos);
    deathPos[pl.name] = pl.pos;
    //log(deathPos);
});

mc.listen("onRespawn",(pl)=>{
    pl.sendModalForm('返回死亡点','是否返回上次死亡坐标','是','否',(pl,re)=>{
        if(re == true){
            //log('die');
            //log(String(deathPos[pl.name]));
        pl.teleport(deathPos[pl.name]);
        }
    });
});