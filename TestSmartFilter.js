//require MotorCycle/jsUnityForGAS.js
//require SmartFilter/SmartFilter.js

RowVisibilityHandler.markVisibility = true;
SmartFilter.FilterConfig.filterRowsLast = 2;
SmartFilter.FilterConfig.complexFilterValues = [{
        columns: [4],
        filterValues: ["a", "active"],
        filteredValues: ["init", "in progress"]
    }];
SmartFilter.FilterConfig.reprocessFilterOnColumnChange = [4]

var SmartFilterTestSuite = {
    suiteName: "SmartFilterTestSuite",
    testSheetName: "SmartFilterTest",
    get testSheet () {
        if (!this._testSheet) {
            this._testSheet = this.createTestSheet();
        }
        return this._testSheet;
    },
    createTestSheet: function () {
        var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(this.testSheetName);
        if (!sheet) {
            sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet(this.testSheetName);
        }
        var values = [
            ["", "", "", ""],
            ["", "", "", ""],
            ["#", "Name", "Group", "Status"],
            ["1", "foo", "gr1", "init"],
            ["2", "bar", "gr1", "ready"],
            ["3", "baz", "gr1", "ready"],
            ["4", "xzy", "gr2", "in progress"],
            ["5", "asd", "gr2", "pending"],
            ["6", "qwe", "gr3", "in progress"],
            ["7", "hjk", "gr3", "in progress"],
            ["8", "aaa", "gr3", ""],
            ["9", "a123", "gr3", ""]
        ];
        sheet.getRange(1, 1, values.length, 4).setValues(values);
        sheet.setFrozenRows(3);
        
        return sheet;
    },
    firstDataRowIndex: 4,
    lastDataRowIndex: 12,
    lastColumnIndex: 4,
    statusColumnIndex: 4,
    setUp: function () {
        this.scope.clearFilters(this.scope.testSheet);
    },
    clearFilters: function (sheet) {
        sheet.getRange(SmartFilter.FilterConfig.filterRowsFirst, 1,
                                     SmartFilter.FilterConfig.filterRowsLast-SmartFilter.FilterConfig.filterRowsFirst+1,
                                     this.lastColumnIndex).clearContent();
    },
    testSimpleMatchFilter: function () {
        var row = SmartFilter.FilterConfig.filterRowsFirst;
        var col = 3;
        var filterValue = "gr1";
        this.testSheet.getRange(row, col).setValue(filterValue);
        SmartFilter.processFilterEdit(this.testSheet, row, col);
        var values = this.testSheet.
                getRange(this.firstDataRowIndex, 1, this.lastDataRowIndex-this.firstDataRowIndex+1, this.lastColumnIndex).getValues();
        var visibilities = RowVisibilityHandler.getVisibilities(this.testSheet, this.firstDataRowIndex, this.lastDataRowIndex);
        for (var r in visibilities) {
            assertEqual(values[r][col-1]==filterValue, visibilities[r], "row:" + r);
        }
    },
    testNonEmptyFilter: function () {
        var row = SmartFilter.FilterConfig.filterRowsFirst;
        var col = 4;
        var filterValue = "*";
        this.testSheet.getRange(row, col).setValue(filterValue);
        SmartFilter.processFilterEdit(this.testSheet, row, col);
        var values = this.testSheet.
                getRange(this.firstDataRowIndex, 1, this.lastDataRowIndex-this.firstDataRowIndex+1, this.lastColumnIndex).getValues();
        var visibilities = RowVisibilityHandler.getVisibilities(this.testSheet, this.firstDataRowIndex, this.lastDataRowIndex);
        for (var r in visibilities) {
            assertEqual(values[r][col-1] !== "", visibilities[r], "row:" + r);
        }
    },
    testEmptyFilter: function () {
        var row = SmartFilter.FilterConfig.filterRowsFirst;
        var col = 4;
        var filterValue = "-*";
        this.testSheet.getRange(row, col).setValue(filterValue);
        SmartFilter.processFilterEdit(this.testSheet, row, col);
        var values = this.testSheet.
                getRange(this.firstDataRowIndex, 1, this.lastDataRowIndex-this.firstDataRowIndex+1, this.lastColumnIndex).getValues();
        var visibilities = RowVisibilityHandler.getVisibilities(this.testSheet, this.firstDataRowIndex, this.lastDataRowIndex);
        for (var r in visibilities) {
            assertEqual(values[r][col-1] === "", visibilities[r], "row:" + r);
        }
    },
    testBlankFilter: function () {
        var row = SmartFilter.FilterConfig.filterRowsFirst;
        var col = 4;
        var filterValue = "";
        this.testSheet.getRange(row, col).setValue(filterValue);
        SmartFilter.processFilterEdit(this.testSheet, row, col);
        var visibilities = RowVisibilityHandler.getVisibilities(this.testSheet, this.firstDataRowIndex, this.lastDataRowIndex);
        for (var r in visibilities) {
            assertEqual(true, visibilities[r], "row:" + r);
        }
    },
    testNegatedFilter: function () {
        var row = SmartFilter.FilterConfig.filterRowsFirst;
        var col = 3;
        var value = "gr1"
        var filterValue = "-" + value;
        this.testSheet.getRange(row, col).setValue(filterValue);
        SmartFilter.processFilterEdit(this.testSheet, row, col);
        var values = this.testSheet.
                getRange(this.firstDataRowIndex, 1, this.lastDataRowIndex-this.firstDataRowIndex+1, this.lastColumnIndex).getValues();
        var visibilities = RowVisibilityHandler.getVisibilities(this.testSheet, this.firstDataRowIndex, this.lastDataRowIndex);
        for (var r in visibilities) {
            assertEqual(values[r][col-1] !== value, visibilities[r], "row:" + r);
        }
    },
    testWildcardFilter: function () {
        var row = SmartFilter.FilterConfig.filterRowsFirst;
        var col = 4;
        var value = "in";
        var filterValue = value + "*";
        this.testSheet.getRange(row, col).setValue(filterValue);
        SmartFilter.processFilterEdit(this.testSheet, row, col);    
        var values = this.testSheet.
                getRange(this.firstDataRowIndex, 1, this.lastDataRowIndex-this.firstDataRowIndex+1, this.lastColumnIndex).getValues();
        var visibilities = RowVisibilityHandler.getVisibilities(this.testSheet, this.firstDataRowIndex, this.lastDataRowIndex);
        for (var r in visibilities) {
            assertEqual(values[r][col-1].substring(0, 2) === value, visibilities[r], "row:" + r);
        }
    },
    testLessThanFilter: function () {
        var row = SmartFilter.FilterConfig.filterRowsFirst;
        var col = 1;
        var filterValue = "<3";
        this.testSheet.getRange(row, col).setValue(filterValue);
        SmartFilter.processFilterEdit(this.testSheet, row, col);
        var values = this.testSheet.
                getRange(this.firstDataRowIndex, 1, this.lastDataRowIndex-this.firstDataRowIndex+1, this.lastColumnIndex).getValues();
        var visibilities = RowVisibilityHandler.getVisibilities(this.testSheet, this.firstDataRowIndex, this.lastDataRowIndex);
        for (var r in visibilities) {
            assertEqual(values[r][col-1]<3, visibilities[r], "row:" + r);
        }
    },
    testIntervalFilter: function () {
        var row = SmartFilter.FilterConfig.filterRowsFirst;
        var col = 1;
        var filterValue = "<4";
        this.testSheet.getRange(row, col).setValue(filterValue);
        var row2 = SmartFilter.FilterConfig.filterRowsLast;
        var filterValue2 = ">=8";
        this.testSheet.getRange(row2, col).setValue(filterValue2);
        SmartFilter.processFilterEdit(this.testSheet, row, col);
        var values = this.testSheet.
                getRange(this.firstDataRowIndex, 1, this.lastDataRowIndex-this.firstDataRowIndex+1, this.lastColumnIndex).getValues();
        var visibilities = RowVisibilityHandler.getVisibilities(this.testSheet, this.firstDataRowIndex, this.lastDataRowIndex);
        for (var r in visibilities) {
            assertEqual(values[r][col-1]<4 || values[r][col-1]>=8, visibilities[r], "row:" + r);
        }
    },
    testIntersectFilter: function () {
        var row = SmartFilter.FilterConfig.filterRowsFirst;
        var col = 3;
        var filterValue = "gr3";
        this.testSheet.getRange(row, col).setValue(filterValue);
        var col2 = 4;
        var filterValue2 = "in progress";
        this.testSheet.getRange(row, col2).setValue(filterValue2);
        SmartFilter.processFilterEdit(this.testSheet, row, col);
        var values = this.testSheet.
                getRange(this.firstDataRowIndex, 1, this.lastDataRowIndex-this.firstDataRowIndex+1, this.lastColumnIndex).getValues();
        var visibilities = RowVisibilityHandler.getVisibilities(this.testSheet, this.firstDataRowIndex, this.lastDataRowIndex);
        for (var r in visibilities) {
            assertEqual(values[r][col-1]==filterValue && values[r][col2-1]==filterValue2, visibilities[r], "row:" + r);
        }
    },
    testComplexFilterValues: function () {
        var row = SmartFilter.FilterConfig.filterRowsFirst;
        var col = this.statusColumnIndex;
        var filterValue = "a";
        this.testSheet.getRange(row, col).setValue(filterValue);
        SmartFilter.processFilterEdit(this.testSheet, row, col);
        var values = this.testSheet.
                getRange(this.firstDataRowIndex, 1, this.lastDataRowIndex-this.firstDataRowIndex+1, this.lastColumnIndex).getValues();
        var visibilities = RowVisibilityHandler.getVisibilities(this.testSheet, this.firstDataRowIndex, this.lastDataRowIndex);
        for (var r in visibilities) {
            assertEqual(values[r][col-1] === "init" || values[r][col-1] === "in progress", visibilities[r], "row:" + r);
        }
    },
    testWildcard2Filter: function () {
        var row = SmartFilter.FilterConfig.filterRowsFirst;
        var col = this.statusColumnIndex;
        var filterValue = "in *";
        this.testSheet.getRange(row, col).setValue(filterValue);
        SmartFilter.processFilterEdit(this.testSheet, row, col);
        var values = this.testSheet.
                getRange(this.firstDataRowIndex, 1, this.lastDataRowIndex-this.firstDataRowIndex+1, this.lastColumnIndex).getValues();
        var visibilities = RowVisibilityHandler.getVisibilities(this.testSheet, this.firstDataRowIndex, this.lastDataRowIndex);
        for (var r in visibilities) {
            assertEqual(values[r][col-1] == "in progress", visibilities[r], "row:" + r);
        }
    },
    testReprocessFilterOnColumnChange: function () {
        var row = SmartFilter.FilterConfig.filterRowsFirst;
        var col = this.statusColumnIndex;
        var filterValue = "a";
        this.testSheet.getRange(row, col).setValue(filterValue);
        SmartFilter.processFilterEdit(this.testSheet, row, col);
        var row2 = this.firstDataRowIndex;
        var col2 = this.statusColumnIndex;
        var cell = this.testSheet.getRange(row2, col2);
        var value = "ready";
        var origValue = cell.getValue();
        cell.setValue(value);
        SmartFilter.processFilterEdit(this.testSheet, row2, col2);
        var visibility = RowVisibilityHandler.getVisibility(this.testSheet, row2);
        assertFalse(visibility);
        cell.setValue(origValue);
    },
    TODOtestFilterCurrentValue: function () {
        var row = this.firstDataRowIndex;
        var col = this.statusColumnIndex;
        var cell = this.testSheet.getRange(row, col);

        cell.setValue("init");
        cell.activate();
        this.testSheet.setActiveRange(cell);
        var value = cell.getValue();
        
        var row2 = SmartFilter.FilterConfig.filterRowsFirst;
        var filterRange = this.testSheet.getRange(row2, col);
        
        SmartFilter.filterCurrentValue();
        assertEqual(filterRange.getValue(), value, "#1 filter");

        cell.activate();
        this.testSheet.setActiveRange(cell);
        SmartFilter.filterCurrentValue();
        assertEqual(filterRange.getValue(), "-"+value, "#2 filter");

        cell.activate();
        this.testSheet.setActiveRange(cell);
        SmartFilter.deleteCurrentFilter();
        assertEqual(filterRange.getValue(), "", "#3 filter");
    }
};