const { AbstractTypiePackage, TypieCore, TypieRowItem } = require('typie-sdk');
const {globalShortcut} = require("electron");

class SwitchTo extends AbstractTypiePackage {

    constructor(win, config, pkgPath){
        super(win, config, pkgPath);
        this.win         = win;
        this.packageName = 'SwitchTo';
        this.db          = 'global';
        this.typie       = new TypieCore(this.packageName, this.db);
        this.intervalTime  = config.intervalTime; // milliseconds -> do not lower below 1000
        this.watchInterval = null;
        this.startWatch();

        this.sorted = {};
        this.lastHWND = "";
    }

    remove(pkgList, item, cb) {
        const resultList = [];
        for (let i = 0; i < 10; i++) {
            resultList.push(
                new TypieRowItem("Alt + " + i)
                    .setDB(this.db)
                    .setPackage(this.packageName)
                    .setDescription(`set alt+${i} to switch to ${item.title}`)
                    .setIcon(item.i)
                    .setPath(item.p)
                    .setActions([{type: "setShortcut", description: "Set"},
                        {type: "removeShortcut", description: "Remove shortcut"}]));
        }
        this.win.send("resultList", {data: resultList, length: resultList.length, err: 0});
    }
    activate(pkgList, item, cb) {
        const actions = item.getActions();
        if (actions) {
            const action = actions[0].type;
            const keys = item.getTitle();
            if (action === "setShortcut") {
                console.log(`set shortcut ${keys} to ${item.getPath()}`);
                globalShortcut.unregister(keys);
                globalShortcut.register(keys, () => this.switchByItem(item));
            } else if (action === "removeShortcut") {
                globalShortcut.unregister(keys);
            }
            return;
        }

        this.switchByItem(item);
    }

    switchByItem(item) {
        this.typie.switchTo(item).go()
            .then(() => {
                this.sorted[item.p] = (new Date()).getTime();
                this.lastHWND = item.p;
                setTimeout(() => {
                    this.win.hide();
                }, 100);
            });
    }

    search(obj, callback) {
        this.typie.fuzzySearch(obj.value).orderBy("score").desc().go()
            .then(res => callback(res))
            .catch(err => console.log(err));
    }

    enterPkg(pkgList, item, cb) {
        this.typie.getRows(10).orderBy('unixTime').desc().go()
            .then(res => {

                // existing hwnds
                const hwndsArr = res.data.map(x => x.p);
                res.data = [...new Set(res.data.filter(x => {
                    if (x.p === this.lastHWND) {
                        return false;
                    }
                    x._activated = this.sorted[x.p] ? this.sorted[x.p] : 1;
                    return hwndsArr.includes(x.p);
                }))];
                res.data.sort((a, b) => b._activated - a._activated);
                this.win.send('resultList', res);
                this.win.show();
            })
            .catch(err => console.log(err));
    }

    startWatch() {
        this.watchInterval = setInterval(() => {
            this.typie.generateSwitchList().go()
        }, this.intervalTime);
    }

    destroy() {
        super.destroy();
        clearInterval(this.watchInterval);
    }
}
module.exports = SwitchTo;