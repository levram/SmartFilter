//require MotorCycle/DeveloperUtils.js
//require MotorCycle/RowVisibilityHandler.js
//require MotorCycle/Transliterate.js

var SmartFilter = {
    FilterConfig: {
        filterRowsFirst: 1,
        filterRowsLast: 1,
        reprocessFilterOnColumnChange: [],
        complexFilterValues: []
        /* example
        complexFilterValues: [{
                columns: [1, 2, 3],
                filterValues: ["a", "active"],
                filteredValues: ["init", "in progress"]
            }],
        */
    },
    isFilterableSheet: function (sheet) {
        return true;
    },
    processFilterEdit: function (sheet, row, col) {
        if (!this.isFilterableSheet(sheet) || (row < this.FilterConfig.filterRowsFirst || row > this.FilterConfig.filterRowsLast) &&
                this.FilterConfig.reprocessFilterOnColumnChange.indexOf(col) === -1) {
            Log.debug("SmartFilter.processFilterEdit is disabled here " + [this.isFilterableSheet(sheet), JSON.stringify(this.FilterConfig)]);
            return;
        }
        Log.info("SmartFilter.processFilterEdit " + JSON.stringify(this.FilterConfig));
        this.filter(sheet);
    },
    filter: function (sheet) {
        var headerRowCnt = parseInt(sheet.getFrozenRows());
        var lastRow = sheet.getLastRow();
        if (lastRow - headerRowCnt < 1) {
            return;
        }
        var lastColumn = sheet.getLastColumn();
        var filterRowsRange = sheet.getRange(this.FilterConfig.filterRowsFirst, 1,
                                                                                 this.FilterConfig.filterRowsLast - this.FilterConfig.filterRowsFirst + 1, lastColumn);
        var dataRange = sheet.getRange(headerRowCnt + 1, 1, lastRow - headerRowCnt, lastColumn);
        var filterRowsValues = filterRowsRange.getValues();
        var dataValues = dataRange.getValues();
            
        var visibilities = [];
        var allFilterIsEmpty = true;
        
        for (var filterValueRow = 0; filterValueRow <
                this.FilterConfig.filterRowsLast - this.FilterConfig.filterRowsFirst + 1; filterValueRow++) {
            var filterValues = filterRowsValues[filterValueRow];
            
            var filterIsEmpty = true;
            for (var col in filterValues) {
                if (filterValues[col] !== "") {
                    filterIsEmpty = false;
                }
            }
            allFilterIsEmpty = allFilterIsEmpty && filterIsEmpty;
            if (filterIsEmpty) {
                continue;
            }
            
            for (var valueRow = 0; valueRow < dataValues.length; valueRow++) {
                var showIt = true;
                for (var col in filterValues) {
                    if (filterValues[col] !== "") {
                        showIt = showIt && this.filterMatches(parseInt(col) + 1, filterValues[col], dataValues[valueRow][col]);
                    }
                }
                visibilities[valueRow] = visibilities[valueRow] || showIt;
            }
        }
        if (allFilterIsEmpty) {
            RowVisibilityHandler.unhideRow(sheet, dataRange);
        }
        else {
            RowVisibilityHandler.setVisibilities(sheet, headerRowCnt + 1, lastRow, visibilities);
        }
    },
    stringToDate: function (string) {
        string = string.trim();
        var thisYear = new Date().getFullYear();
        if (string.indexOf(thisYear)==-1) {
            string = thisYear + "." + string;
        }
        return new Date(Date.parse(string.replace(/\./g, "/")));
    },
    normalizeString: function (string) {
        string = string.toLowerCase();
        if (typeof transliterate === "function") {
            string = transliterate(string);
        }
        return string;
    },
    filterMatches: function (col, filterValue, dataValue) {
        for (var i in this.FilterConfig.complexFilterValues) {
            var complexFilterValue = this.FilterConfig.complexFilterValues[i];
            if (complexFilterValue.columns.indexOf(col)!=-1) {
                if (typeof filterValue == "string" &&
                    complexFilterValue.filterValues.indexOf(this.normalizeString(filterValue))!=-1) {
                    return complexFilterValue.filteredValues.indexOf(dataValue)!=-1;
                }
            }
        }
        return this.filterMatchesBase(filterValue, dataValue);
    },
    filterMatchesBase: function (filterValue, dataValue) {
        if (filterValue == "-") {
            return dataValue == "-";
        }
        if (filterValue == "-*") {
            return dataValue == "";
        }
        if (typeof dataValue == "string") {
            dataValue = this.normalizeString(dataValue);
        }
        var operators = ["<=", "<", ">=", ">", "-"];
        var operator;
        if (typeof filterValue == "string") {
            for (var i in operators) {
                if (filterValue.indexOf(operators[i])===0) {
                    operator = operators[i];
                    filterValue = filterValue.replace(operator, "");
                    break;
                }
            }
            filterValue = this.normalizeString(filterValue);
            if (filterValue.indexOf("*")!==-1) {
                var pattern = "^" + filterValue.replace(/\*/g, ".*");
                dataValue = new String(dataValue);
                return dataValue!="" && dataValue.match(pattern)!=null;
            }
        }
        if (dataValue instanceof Date && !(filterValue instanceof Date)) {
            filterValue = this.stringToDate(filterValue);
        }
        switch(operator)    {
            case "<":
                return dataValue<filterValue;
            case "<=":
                return dataValue<=filterValue;
            case ">":
                return dataValue>filterValue;
            case ">=":
                return dataValue>=filterValue;
            case "-":
                return dataValue!=filterValue;
            default:
                return dataValue===filterValue;
        }
    },
    filterCurrentValue: function () {
        var sheet = SpreadsheetApp.getActiveSheet();
        var range = sheet.getActiveRange();
        var value = range.getValue();
        var col = range.getColumn();
        var filterCell = sheet.getRange(this.FilterConfig.filterRowsFirst, col);
        var filterValue = filterCell.getValue();
        var nextFilterValue;
        
        if (value === "" && filterValue === "-*") {
            nextFilterValue = "*";
        }
        else if (value === "" && filterValue === "*") {
            nextFilterValue = "";
        }
        else if (value === "") {
            nextFilterValue = "-*";
        }
        else if (filterValue === value) {
            nextFilterValue = "-"+value;
        }
        else if (filterValue === "-"+value) {
            nextFilterValue = "";
        }
        else {
            nextFilterValue = value;
        }
        filterCell.setValue(nextFilterValue);
        this.processFilterEdit(sheet, this.FilterConfig.filterRowsFirst, col);
    },
    deleteCurrentFilter: function () {
        var sheet = SpreadsheetApp.getActiveSheet();
        var range = sheet.getActiveRange();
        var value = range.getValue();
        var col = range.getColumn();
        sheet.getRange(this.FilterConfig.filterRowsFirst, col,
                                     this.FilterConfig.filterRowsLast - this.FilterConfig.filterRowsFirst, 1).clearContent();
        this.processFilterEdit(sheet, this.FilterConfig.filterRowsFirst, col);
    }
}

function testProcessFilterEdit() {
    var sheet = SpreadsheetApp.getActiveSheet();
    SmartFilter.filter(sheet);
}

if (typeof editHandlers !== "undefined") {
    editHandlers.push([SmartFilter, SmartFilter.processFilterEdit]);
}
