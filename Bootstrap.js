var include = function (host, files) {
    try {
        var url = host + "/gracie?sources=" + files.join(",") + "&" + Math.random();
        Logger.log("Loading: " + url);
        eval.call(null, UrlFetchApp.fetch(url).getContentText());
    }
    catch (e) {
        throw new Error("Cannot include files: " + files + ". Exception: " + e);
    }
};

var includeCode = function() {
    if (typeof SmartFilter === "undefined") {
        include("http://albert14.no-ip.org:9308", ["SmartFilter/SmartFilter.js", "SmartFilter/TestSmartFilter.js"]);
        this.included = true;
    }
}

var editHandlers = []
includeCode();

/********************************************************************************************
 *** Eventhandlers
 ********************************************************************************************/
var handleOpen = function (handlers) {
    handlers = handlers || openHandlers;
    var i, item;
    for (i = 0; i < handlers.length; i++) {
        item = handlers[i];
        if (item.constructor === Array) {
            item[1].apply(item[0]);
        } else {
            item();
        }
    }
};

var handleEdit = function (sheet, range, handlers) {
    includeCode();
    handlers = handlers || editHandlers;
    var row = range.getRow(),
        col = range.getColumn(),
        i,
        item;
    for (i = 0; i < handlers.length; i++) {
        item = handlers[i];
        if (item.constructor === Array) {
            item[1].apply(item[0], [sheet, row, col, range]);
        } else {
            item(sheet, row, col, range);
        }
    }
};

function onOpen() {
    handleOpen();
}

// debug mode (to have permission for fetching remote code we have to use onChange)
function onChange(e) {
  handleEdit(e.range.getSheet(), e.range);
}

// prod mode
function onEdit(e) {
  handleEdit(e.source.getActiveSheet(), e.source.getActiveRange());
}



/********************************************************************************************
 *** Manual test
 ********************************************************************************************/

function runOnEdit() {
    var sheet = SpreadsheetApp.getActiveSheet(),
        range = SpreadsheetApp.getActiveRange();
    handleEdit(sheet, range);
}

function test() {
    jsUnity.run(SmartFilterTestSuite);
}