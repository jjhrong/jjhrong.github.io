//共用function
function isInteger(num) {
    return (parseInt(num) ^ 0) === parseInt(num);
}
//Number.isInteger()
function isArray(obj) {
    return Object.prototype.toString.call(obj) === '[object Array]';
}

//elem相關

function newQ(type, id) {
    if (type.startsWith('ML#')) return newE('span', id).attr('ml', type.substr(3)).append(getML(type.substr(3)));
    //todo 判斷type
    if (!id && type.startsWith('#')) type = id.substr(1, 3);
    if (id && id.startsWith('#')) id = id.substr(1);
    return newE(type, id);
}
function newE(type, oAttr, oData) {
    var tmpE = $('<' + type + '/>');
    oAttr = (oAttr && oAttr.constructor === String) ? { id: oAttr } : (oAttr || {});
    oData = oData || {};
    tmpE.setAttr(oAttr).data(oData);
    return tmpE;
}

//DBData into JHData
function autoData(dataList) {
    if (!dataList || !dataList.length) return;
    if (dataList[0] && Object.keys(dataList[0]).indexOf('script') != -1) {
        var tmpJS = newQ('script', 'tmpJS').addClass('tmpJS');
        $.each(dataList, function (i, row) {
            if (row.funcName) {
                tmpJS.append('\nfunction ' + row.funcName + (row.funcName.indexOf('(') == -1 ? '(options) ' : ' ') + '{' + (row.script || '') + '};');
                if (row.funcID != '*') setJHData('pageData.funcListAtDB', (getJHData('pageData.funcListAtDB') || []).concat(row.funcName.split('(')[0]));
            }
        });
        //tmpJS.append('setJHData("pageData.isScriptLC", true);');
        $("body").append(tmpJS);
    }
    else {
        $.each(dataList, function (i, row) {
            if (row.kind && row.kind.split('.').length > 1 && row.kind.split('.')[0].endsWith('Data')) {
                var tmpDataSetKey = row.kind.split('.')[0];
                autoDataInit(tmpDataSetKey);
                if (row.orderSN == -1) window["set" + tmpDataSetKey](row.kind.substr(tmpDataSetKey.length - 3), (row.value || '').split(','));
                else if (row.orderSN || isArray(window["get" + tmpDataSetKey](row.kind.substr(tmpDataSetKey.length - 3)))) window["set" + tmpDataSetKey](row.kind.substr(tmpDataSetKey.length - 3), setInDataListByIdx(window["get" + tmpDataSetKey](row.kind.substr(tmpDataSetKey.length - 3)), row.value, row.orderSN || 0));
                else window["set" + tmpDataSetKey](row.kind.substr(tmpDataSetKey.length - 3), row.value);
            }
        });
    }
}
//自動產生新Data功能
function autoDataInit(dataSetKey) {
    if (window[dataSetKey]) return;
    window[dataSetKey] = {};
    window["get" + dataSetKey] = window["get" + dataSetKey] || function (path) { return getJHData(path, window[dataSetKey]); };
    window["set" + dataSetKey] = window["set" + dataSetKey] || function (path, data) { setJHData(path, data, window[dataSetKey]); };
}

//設定資料 data為保留字不可設定
function setJHData(path, data, target) {
    if (path.endsWith('.data')) return;
    var bFirst = !target
    if (bFirst) target = JHData;
    if (path.split('.')[0] && !target[path.split('.')[0]]) target[path.split('.')[0]] = {};
    if (path.split('.').length == 1) {
        target[path] = data;
    }
    else setJHData(path.substr(path.split('.')[0].length + 1), data, target[path.split('.')[0]]);
    if (bFirst) {
        //填入olu元件
        setOLUData(path);
        $("table[olu='" + path + "']").autoTable({});
    }
}

//取得資料
function getJHData(path, target) {
    if (!target) target = JHData;
    if (!path) return target;
    if (path.split('.').length == 1) return path == "data" ? target.data() : target[path];
    else if (!target[path.split('.')[0]]) return null;
    else return getJHData(path.substr(path.split('.')[0].length + 1), path.split('.')[0] == "data" ? target.data() : target[path.split('.')[0]]);
}

function openSetJH(jhPath) {
    var tmpQ = newQ('textarea').autoTextArea({ isAutogrow: 'Y' });
    tmpQ.change(function () { $('#winSetJH').data('jhValue', this.value); }).val(getJHData(jhPath));
    newWin('頁面說明', newQ('div', 'divSetJH').append(tmpQ), null, 600, 'winSetJH', null, 'closeSetJH');
    $('#winSetJH').data('jhPath', jhPath);
}
function closeSetJH(win) {
    if ($(win).data('jhValue') !== undefined) updateJHData($(win).data('jhPath'), $(win).data('jhValue'), 0);
}

//填入olu元件(僅適用JHData)
function setOLUData(path) {
    //path及所有下層
    $("[olu='" + path + ".'],[olu^='" + path + ".']").each(function () {
        var tmpV = getJHData($(this).attr('olu'));
        if (tmpV === null || tmpV.constructor === String || isInteger(tmpV))
            switch (this.tagName.toUpperCase()) {
                case 'LABEL':
                case 'BUTTON':
                    $(this).html(tmpV);
                    break;
                case 'INPUT':
                case 'TEXTAREA':
                case 'SELECT':
                    if ($(this).hasClass('adp')) $(this).datepicker('setDate', new Date(tmpV));
                    else $(this).val(tmpV);
                    if (this.tagName.toUpperCase() == 'TEXTAREA') $(this).keyup();
                    break;
                case 'OPTION':
                case 'SPAN':
                case 'DIV':
                    if ($(this).is('[ml]')) {
                        if ($(this).attr('codeKind')) tmpV = 'CODE#' + $(this).attr('codeKind') + '#' + tmpV;
                        $(this).attr('ml', tmpV);
                        tmpV = getML(tmpV);
                    }
                    tmpV = tmpV.replace(/\n/g, "<br>");
                    if ($(this).is("[aftertxt]")) $(this).attr('aftertxt', tmpV);
                    else if ($(this).is("[beforetxt]")) $(this).attr('beforetxt', tmpV);
                    else $(this).html(tmpV);
                    break;
                default:
                    break;
            }
    });
}
