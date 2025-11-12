sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/Column",
    "sap/m/ColumnListItem",
    "sap/m/Text",
    "sap/m/Input",
    "sap/m/Button",
    "sap/m/MessageToast",
    "sap/m/HBox",
    "sap/m/MessageBox"
], (Controller, JSONModel, Column, ColumnListItem, Text, Input, Button, MessageToast, HBox, MessageBox) => {
    "use strict";

    return Controller.extend("project1.controller.View1", {

        onInit: function () {
            // Create JSON model for books
            this.oModel = new JSONModel();
            this.getView().setModel(this.oModel, "books");

            // Load books initially
            this.loadBooks();
        },

        
        loadBooks: function () {
    const oTable = this.getView().byId("bookTable");

    $.ajax({
        url: "/odata/v4/catalog/Books",
        method: "GET",
        success: (data) => {
            const books = data.value;
            if (!books || books.length === 0) {
                MessageToast.show("No books found!");
                return;
            }

            // Set JSON model
            this.oModel.setData(books);

            // Add columns only if table is empty
            if (oTable.getColumns().length === 0) {
                const keys = Object.keys(books[0]);

                keys.forEach(key => {
                    oTable.addColumn(new sap.ui.table.Column({
                        label: new sap.m.Text({ text: key }),
                        template: new sap.m.Text({ text: "{books>" + key + "}" }),
                        width: "165px"
                    }));
                });

                // Actions column
                oTable.addColumn(new sap.ui.table.Column({
                    label: new sap.m.Text({ text: "Actions" }),
                    template: new sap.m.HBox({
                        items: [
                            new sap.m.Button({
                                icon: "sap-icon://edit",
                                type: "Transparent",
                                press: (oEvent) => {
                                    const context = oEvent.getSource().getBindingContext("books");
                                    this.onEdit(context.getObject());
                                }
                            }),
                            new sap.m.Button({
                                icon: "sap-icon://delete",
                                type: "Transparent",
                                press: (oEvent) => {
                                    const context = oEvent.getSource().getBindingContext("books");
                                    this.onDelete(context.getObject());
                                }
                            })
                        ],
                        justifyContent: "SpaceAround"
                    }),
                    width: "100px"
                }));
            }
        },
        error: (xhr) => {
            MessageToast.show("Error loading books: " + xhr.responseText);
        }
    });
},


        
    onEdit: function (record) {
    // Create a JSON model for the dialog
    const oDialogModel = new JSONModel({ ...record });

    // Dialog with SimpleForm
    const oDialog = new sap.m.Dialog({
        title: "Edit Book",
        type: "Message",
        contentWidth: "500px",
        contentHeight: "auto",
        content: [
            new sap.ui.layout.form.SimpleForm({
                layout: "ResponsiveGridLayout",
                editable: true,
                maxContainerCols: 2,
                content: Object.keys(record).map(key => {
                    // Special validation for Batch No.
                    if (key === "Batch No.") {
                        return [
                            new sap.m.Label({ text: key }),
                            new sap.m.Input({
                                value: `{edit>/` + key + `}`,
                                required: true,
                                maxLength: 500,
                                liveChange: function (oEvt) {
                                    const inp = oEvt.getSource();
                                    const val = inp.getValue();
                                    const cleaned = val.replace(/[^A-Za-z0-9]/g, "");
                                    if (cleaned !== val) {
                                        inp.setValue(cleaned);
                                        inp.setValueState("Warning");
                                        inp.setValueStateText("Only letters and digits are allowed.");
                                    } else {
                                        inp.setValueState("None");
                                        inp.setValueStateText("");
                                    }
                                }
                            })
                        ];
                    } 
                    // Special validation for Price field
                    else if (key.toLowerCase() === "price") {
                        return [
                            new sap.m.Label({ text: key }),
                            new sap.m.Input({
                                value: `{edit>/` + key + `}`,
                                required: true,
                                liveChange: function (oEvt) {
                                    const inp = oEvt.getSource();
                                    const val = inp.getValue();
                                    // Allow only numbers and decimal
                                    const cleaned = val.replace(/[^0-9.]/g, "");
                                    if (cleaned !== val) {
                                        inp.setValue(cleaned);
                                        inp.setValueState("Warning");
                                        inp.setValueStateText("Only numeric values allowed.");
                                    } else {
                                        inp.setValueState("None");
                                        inp.setValueStateText("");
                                    }
                                }
                            })
                        ];
                    } 
                    // Default mandatory input for other fields
                    else {
                        return [
                            new sap.m.Label({ text: key }),
                            new sap.m.Input({
                                value: `{edit>/` + key + `}`,
                                editable: key !== "ID", // ID not editable
                                required: true
                            })
                        ];
                    }
                }).flat()
            })
        ],
      beginButton: new sap.m.Button({
    text: "Save",
    type: "Emphasized",
    press: () => {
        const inputs = oDialog.getContent()[0].getContent().filter(ctrl => ctrl instanceof sap.m.Input);
        let invalid = false;

        inputs.forEach(inp => {
            // Check empty required fields
            if (inp.getRequired() && !inp.getValue()) {
                inp.setValueState("Error");
                inp.setValueStateText("This field is mandatory.");
                invalid = true;
            } 
            // Keep existing warning validation (Batch No / Price)
            else if (inp.getValueState() === "Warning") {
                invalid = true;
            } else {
                inp.setValueState("None");
                inp.setValueStateText("");
            }
        });

        if (invalid) {
            MessageToast.show("Please fix all validation errors before saving.");
            return;
        }

        const updatedData = oDialogModel.getData();
        delete updatedData.ID; // remove key field from payload

        // Send PATCH request to CAP service
        $.ajax({
            url: `/odata/v4/catalog/Books('${record.ID}')`,
            method: "PATCH",
            contentType: "application/json",
            data: JSON.stringify(updatedData),
            success: () => {
                sap.m.MessageBox.success("Record updated successfully!", {
                    title: "Success",
                    actions: [sap.m.MessageBox.Action.OK],
                    onClose: () => {
                        oDialog.close();
                        const books = this.oModel.getData();
                        const index = books.findIndex(b => b.ID === record.ID);
                        if (index > -1) {
                            books[index] = { ...books[index], ...updatedData };
                            this.oModel.setData(books);
                        }
                    }
                });
            },
            error: (xhr) => {
                sap.m.MessageBox.error("Error updating record: " + xhr.responseText, {
                    title: "Error",
                    actions: [sap.m.MessageBox.Action.OK]
                });
            }
        });
    }
}),

        endButton: new sap.m.Button({
            text: "Cancel",
            press: () => oDialog.close()
        }),
        afterClose: () => oDialog.destroy()
    });

    // Set model for dialog
    oDialog.setModel(oDialogModel, "edit");

    oDialog.open();
}
,



        onDelete: function (record) {
            if (!record.ID) {
                sap.m.MessageBox.error("Cannot delete: ID missing", {
                    title: "Error",
                    actions: [sap.m.MessageBox.Action.OK]
                });
                return;
            }

            // Confirm delete
            sap.m.MessageBox.confirm("Are you sure you want to delete this record?", {
                title: "Confirm Delete",
                actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
                onClose: (oAction) => {
                    if (oAction === sap.m.MessageBox.Action.YES) {
                        $.ajax({
                            url: `/odata/v4/catalog/Books('${record.ID}')`,
                            method: "DELETE",
                            success: () => {
                                sap.m.MessageBox.success("Record deleted successfully!", {
                                    title: "Success",
                                    actions: [sap.m.MessageBox.Action.OK],
                                    onClose: () => {
                                        this.loadBooks(); // reload table
                                    }
                                });
                            },
                            error: (xhr) => {
                                sap.m.MessageBox.error("Error deleting record: " + xhr.responseText, {
                                    title: "Error",
                                    actions: [sap.m.MessageBox.Action.OK]
                                });
                            }
                        });
                    }
                }
            });
        }
        ,
        /**
         * Optional: Load Books button handler
         */
        onLoadBooks: function () {
            this.loadBooks();
        },

        /**
         * Optional: Export Books (just example)
         */
        onExportBooks: function () {
            const data = this.oModel.getData();
            if (!data || data.length === 0) {
                MessageToast.show("No data to export!");
                return;
            }
            const csvContent = [Object.keys(data[0]).join(",")]
                .concat(data.map(r => Object.values(r).join(",")))
                .join("\n");

            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = "Books.csv";
            link.click();
        }

    });
});
