/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, brackets */

define(function (require, exports, module) {
    "use strict";

    // --- Required modules ---

    var CommandManager     = brackets.getModule("command/CommandManager");
    var EditorManager      = brackets.getModule("editor/EditorManager");
    var ExtensionUtils     = brackets.getModule("utils/ExtensionUtils");
    var Menus              = brackets.getModule("command/Menus");
    var PreferencesManager = brackets.getModule("preferences/PreferencesManager");

    // Support for Brackets Sprint 38+ : https://github.com/adobe/brackets/wiki/Brackets-CodeMirror-v4-Migration-Guide
    var CodeMirror = brackets.getModule("thirdparty/CodeMirror2/lib/codemirror");
    brackets.getModule(["thirdparty/CodeMirror2/addon/edit/trailingspace"]);

    // --- Settings ---

    var commandId          = "scientech-com-ua.brackets-trailingspaces.toggle";
    var preferencesId      = "scientech-com-ua.brackets-trailingspaces";
    var defaultPreferences = { checked: true };


    // --- State Variables ---

    var _preferences,
        _command,
        _styleTag;


    function updateEditors(includeEditor) {
        var fullEditor = EditorManager.getCurrentFullEditor();
        if (!fullEditor) { return; }

        var editors = [fullEditor].concat(EditorManager.getInlineEditors(fullEditor));

        // activeEditorChange fires before a just opened inline editor would be listed by getInlineEditors
        // So we include it manually
        if (includeEditor && editors.indexOf(includeEditor) === -1) {
            editors.push(includeEditor);
        }

        editors.forEach(function (instance) {
            instance._codeMirror.setOption("showTrailingSpace", _command.getChecked());
            instance._codeMirror.refresh();
        });
    }

    // --- Event Handlers ---

    function onCommandExecuted() {
        if (!_command.getChecked()) {
            _command.setChecked(true);
        } else {
            _command.setChecked(false);
        }
    }

    function onCheckedStateChange() {
        _preferences.set("checked", Boolean(_command.getChecked()));
        updateEditors();
    }

    function onActiveEditorChange(e, editor) {
        updateEditors(editor);
    }


    // --- Loaders and Unloaders ---

    function loadPreferences() {
        _preferences = PreferencesManager.getExtensionPrefs(preferencesId);
        _preferences.definePreference("checked", "boolean", defaultPreferences.checked);
    }


    function loadStyle() {
        ExtensionUtils.loadStyleSheet(module, "style.css").done(function (node) {
            _styleTag = node;
        });
    }

    function unloadStyle() {
        $(_styleTag).remove();
    }


    function loadCommand() {
        _command = CommandManager.get(commandId);

        if (!_command) {
            _command = CommandManager.register("Show Trailing Whitespace", commandId, onCommandExecuted);
        } else {
            _command._commandFn = onCommandExecuted;
        }

        $(_command).on("checkedStateChange", onCheckedStateChange);

        // Apply preferences
        _command.setChecked(_preferences.get("checked"));
    }

    function unloadCommand() {
        _command.setChecked(false);
        $(_command).off("checkedStateChange", onCheckedStateChange);
        _command._commandFn = null;
    }


    function loadMenuItem() {
        Menus.getMenu("view-menu").addMenuItem(commandId, "Ctrl-Alt-.");
    }

    function unloadMenuItem() {
        Menus.getMenu("view-menu").removeMenuItem(commandId);
    }


    function loadEditorSync() {
        $(EditorManager).on("activeEditorChange", onActiveEditorChange);
    }

    function unloadEditorSync() {
        $(EditorManager).off("activeEditorChange", onActiveEditorChange);
    }


    // Setup the UI
    function load() {
        loadPreferences();
        loadStyle();
        loadCommand();
        loadMenuItem();
        loadEditorSync();
    }

    // Tear down the UI
    function unload() {
        unloadEditorSync();
        unloadMenuItem();
        unloadCommand();
        unloadStyle();
    }


    // --- Exports ---

    exports.load = load;
    exports.unload = unload;


    // --- Initializiation ---

    load();
});
