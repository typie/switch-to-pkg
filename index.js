const { AbstractTypiePackage, TypieCore } = require('typie-sdk');

class SwitchTo extends AbstractTypiePackage {

    constructor(win, config, pkgPath){
        super(win, config, pkgPath);
        this.win         = win;
        this.packageName = 'SwitchTo';
        this.db          = 'global';
        this.typie       = new TypieCore(this.packageName, this.db);
    }

    activate(pkgList, item, cb) {
        this.typie.remove(item).go()
            .then(() => {
                setTimeout(() => {
                    this.win.hide();
                }, 100);
            });
    }

    enterPkg(pkgList, item, cb) {
        this.typie.getRows(10).orderBy('unixTime').desc().go()
            .then(res => {
                this.win.send('resultList', res);
                this.win.show();
            })
            .catch(err => console.log(err));
    }
}
module.exports = SwitchTo;
