sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/ui/comp/valuehelpdialog/ValueHelpDialog",
    "sap/m/Table",
    "sap/m/Column",
    "sap/m/Label",
    "sap/m/Text",
    "sap/m/ColumnListItem",
    "sap/ui/model/json/JSONModel"
], function (Controller, MessageToast, ValueHelpDialog, Table, Column, Label, Text, ColumnListItem, JSONModel) {
    "use strict";

    return Controller.extend("project2.controller.View1", {
        onInit: function () {},

        // === SEARCH & RESET ===
        onGo: function () {
            MessageToast.show("Search triggered!");
        },

        // onResetFilters: function () {
        //     const oPage = this.getView().byId("page");
        //     oPage.findAggregatedObjects(true, oControl =>
        //         oControl instanceof sap.m.Input ||
        //         oControl instanceof sap.m.MultiInput ||
        //         oControl instanceof sap.m.DateRangeSelection
        //     ).forEach(oControl => {
        //         if (oControl instanceof sap.m.Input || oControl instanceof sap.m.MultiInput) {
        //             oControl.setValue("");
        //             oControl.destroyTokens();
        //         } else if (oControl instanceof sap.m.DateRangeSelection) {
        //             oControl.setDateValue(null);
        //             oControl.setSecondDateValue(null);
        //         }
        //     });
        //     MessageToast.show("Filters reset!");
        // },


        onResetFilters: function () {
    const oView = this.getView();

    // Reset all Inputs, MultiInputs, and Date controls
    oView.findAggregatedObjects(true, function (oControl) {
        return (
            oControl instanceof sap.m.Input ||
            oControl instanceof sap.m.MultiInput ||
            oControl instanceof sap.m.DatePicker ||
            oControl instanceof sap.m.DateRangeSelection
        );
    }).forEach(function (oControl) {
        if (oControl instanceof sap.m.Input) {
            oControl.setValue("");
        } else if (oControl instanceof sap.m.MultiInput) {
            oControl.destroyTokens();
            oControl.setValue("");
        } else if (oControl instanceof sap.m.DatePicker) {
            oControl.setValue("");
            oControl.setDateValue(null);
        } else if (oControl instanceof sap.m.DateRangeSelection) {
            oControl.setValue("");
            oControl.setDateValue(null);
            oControl.setSecondDateValue(null);
        }
    });

    MessageToast.show("All filters have been reset!");
}
,

        // === GENERIC VALUE HELP DIALOG ===
        _openValueHelpDialog: function (title, fieldId, data) {
            const oView = this.getView();
            const oInput = oView.byId(fieldId);

            const oDialog = new ValueHelpDialog({
                title: title,
                supportMultiselect: true,
                key: "name",
                descriptionKey: "desc",
                contentWidth: "40%",
                contentHeight: "50%",
                stretch: false,
                ok: function (oEvent) {
                    const aTokens = oEvent.getParameter("tokens");
                    oInput.setTokens(aTokens);
                    oDialog.close();
                },
                cancel: function () {
                    oDialog.close();
                },
                afterClose: function () {
                    oDialog.destroy();
                }
            });

            const oModel = new JSONModel({ items: data });
            const oTable = new Table({
                mode: "SingleSelectLeft",
                columns: [
                    new Column({ header: new Label({ text: "Code" }) }),
                    new Column({ header: new Label({ text: "Description" }) })
                ]
            });

            const oTemplate = new ColumnListItem({
                cells: [
                    new Text({ text: "{name}" }),
                    new Text({ text: "{desc}" })
                ]
            });

            oTable.setModel(oModel);
            oTable.bindItems("/items", oTemplate);

            oDialog.setTable(oTable);
            oDialog.open();
        },

       
        //  DATE MODE SWITCH HANDLERS 
        onBillingDateModeChange(oEvent) {
            const sKey = oEvent.getParameter("item").getKey();
            const oSingle = this.byId("billingDateSingle");
            const oRange = this.byId("billingDateRange");

            if (sKey === "single") {
                oSingle.setVisible(true);
                oRange.setVisible(false);
                if (oRange.getDateValue()) oSingle.setDateValue(oRange.getDateValue());
            } else {
                oSingle.setVisible(false);
                oRange.setVisible(true);
                if (oSingle.getDateValue()) {
                    oRange.setDateValue(oSingle.getDateValue());
                    oRange.setSecondDateValue(oSingle.getDateValue());
                }
            }
        },

        onDeliveryDateModeChange(oEvent) {
            const sKey = oEvent.getParameter("item").getKey();
            const oSingle = this.byId("deliveryDateSingle");
            const oRange = this.byId("deliveryDateRange");

            if (sKey === "single") {
                oSingle.setVisible(true);
                oRange.setVisible(false);
                if (oRange.getDateValue()) oSingle.setDateValue(oRange.getDateValue());
            } else {
                oSingle.setVisible(false);
                oRange.setVisible(true);
                if (oSingle.getDateValue()) {
                    oRange.setDateValue(oSingle.getDateValue());
                    oRange.setSecondDateValue(oSingle.getDateValue());
                }
            }
        }
    });
});
