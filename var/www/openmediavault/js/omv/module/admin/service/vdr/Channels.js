/**
 * Copyright (C) 2013 OpenMediaVault Plugin Developers
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

// require("js/omv/WorkspaceManager.js")
// require("js/omv/workspace/grid/Panel.js")
// require("js/omv/Rpc.js")
// require("js/omv/data/Store.js")
// require("js/omv/data/Model.js")

/**
 * @class OMV.module.admin.service.vdr.Settings
 * @derived OMV.workspace.grid.Panel
 */
Ext.define("OMV.module.admin.service.vdr.Channels", {
    extend   : "OMV.workspace.grid.Panel",
    requires : [
        "OMV.Rpc",
        "OMV.data.Store",
        "OMV.data.Model",
        "OMV.data.proxy.Rpc",
        "Ext.grid.plugin.DragDrop",
        "Ext.grid.column.RowNumberer"
    ],
	uses: [
		"OMV.window.MessageBox"
	],

    viewConfig : {
        plugins : {
            ptype : "gridviewdragdrop"
        },
        listeners : {
            drop : function (node, data) {
                data.view.refresh();
            }
        }
    },

	hideAddButton       : true,
	hideEditButton      : true,
    hideUpButton        : false,
    hideDownButton      : false,
    hideApplyButton     : false,
    hideRefreshButton   : false,
    mode                : "local",

    columns         : [{
        xtype: "rownumberer"
    },{
        text      : _("Channel Name"),
        sortable  : false,
        dataIndex : "channelName"
    },{
        text      : _("Channel Company"),
        sortable  : false,
        dataIndex : "channelCompany"
    },{
        text      : _("Encrypted"),
        sortable  : false,
        dataIndex : "channelEncrypted",
        renderer  : function(value) {
            return value ? "Yes" : "No";
        }
    }],

    initComponent : function () {
        var me = this;

        Ext.apply(me, {
            store : Ext.create("OMV.data.Store", {
                autoLoad : true,
                model    : OMV.data.Model.createImplicit({
                    idProperty : "channel",
                    fields     : [{
                        name : "channel",
                        type : "string"
                    },{
                        name : "channelName",
                        type : "string"
                    },{
                        name : "channelCompany",
                        type : "string"
                    },{
                        name : "channelEncrypted",
                        type : "boolean"
                    }]

                }),
                proxy    : {
                    type    : "rpc",
                    rpcData : {
                        service : "VDR",
                        method  : "getChannels"
                    }
                }
            })
        });

        me.callParent(arguments);
    },

    afterDeletion : function() {
        var me = this;

        me.doReload();
    },

	afterMoveRows : function(records, index) {
        var me = this;
		var sm = me.getSelectionModel();

		sm.select(records);
        me.view.refresh();
	},

	doReload : function() {
	    var me = this;

	    me.store.reload();
	},

	onApplyButton : function() {
        var me = this;
        var msg = "Do you really want to apply the configuration?\nNote: VDR will be restarted to apply the configuration.\nActive recordings will be temporarily paused.";

        OMV.MessageBox.show({
			title   : _("Confirmation"),
			msg     : msg,
			buttons : Ext.Msg.YESNO,
			fn      : function(answer) {
    		    if (answer == "no") {
                    me.doReload();
    			    return;
                }

    		    me.startApply();
			},
			scope : me,
			icon  : Ext.Msg.QUESTION
		});
    },

    startApply : function() {
        var me = this;
        var rpcArr = [];
        var arr = me.store.data.getRange();

        for (var i = 0, j = arr.length; i < j; i++) {
            rpcArr[i] = arr[i].data.channel.toString();
        }

		var rpcOptions = {
			scope       : me,
			callback    : me.onApply,
			relayErrors : true,
			rpcData     : {
			    service : "VDR",
			    method  : "setChannels",
			    params  : {
			        channels : rpcArr
		        }
			}
		};

		// Display waiting dialog.
		OMV.MessageBox.wait(null, _("Saving ..."));

		// Execute RPC.
		OMV.Rpc.request(rpcOptions);
	},

	onApply: function(id, success, response) {
		var me = this;

		OMV.MessageBox.updateProgress(1);
		OMV.MessageBox.hide();

		if (!success) {
			OMV.MessageBox.error(null, response);
		} else {
			OMV.MessageBox.success(null, _("The changes have been applied successfully."));
			me.doReload();
		}
	}

});


OMV.WorkspaceManager.registerPanel({
    id        : "channels",
    path      : "/service/vdr",
    text      : _("Channels"),
    position  : 20,
    className : "OMV.module.admin.service.vdr.Channels"
});
