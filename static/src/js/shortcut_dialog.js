/** @odoo-module **/
// Part of NIITS Inovasi Teknologi. See LICENSE file for full copyright and licensing details.

import { Component, useState, useRef } from "@odoo/owl";
import { Dialog } from "@web/core/dialog/dialog";
import { _t } from "@web/core/l10n/translation";
import { useService } from "@web/core/utils/hooks";
import { ConfirmationDialog } from "@web/core/confirmation_dialog/confirmation_dialog";

/**
 * ShortcutDialog
 * ---------------
 * Modal dialog for creating and editing personal shortcuts.
 *
 * Props:
 *  - shortcut (object|null)  existing record for edit mode; null for create
 *  - onSaved (function)      called with the saved record data
 *  - close   (function)      injected by Dialog/DialogContainer to close itself
 */
export class ShortcutDialog extends Component {
    static template = "personal_apps_shortcuts.ShortcutDialog";
    static components = { Dialog };
    static props = {
        shortcut: { optional: true, type: Object },
        onSaved: { type: Function },
        close: { type: Function },
    };

    setup() {
        this.shortcutService = useService("shortcut_service");
        this.dialogService = useService("dialog");
        this.fileInputRef = useRef("fileInput");

        const sc = this.props.shortcut || {};
        this.state = useState({
            name: sc.name || "",
            url: sc.url || "",
            new_tab: sc.new_tab !== undefined ? sc.new_tab : false,
            iconPreview: sc.icon_url || null,  // data-URL or server URL
            iconData: null,                     // base64 string to upload
            removeIcon: false,
            errors: {},
            saving: false,
        });
    }

    get isEdit() {
        return !!this.props.shortcut;
    }

    get title() {
        return this.isEdit ? _t("Edit Shortcut") : _t("Add Shortcut");
    }

    get isValid() {
        return this.state.name.trim().length > 0 && this.state.url.trim().length > 0;
    }

    // ------------------------------------------------------------------
    // Handlers
    // ------------------------------------------------------------------
    onChangeName(ev) {
        this.state.name = ev.target.value;
        this._clearError("name");
    }

    onChangeUrl(ev) {
        this.state.url = ev.target.value;
        this._clearError("url");
    }

    onChangeNewTab(ev) {
        this.state.new_tab = ev.target.checked;
    }

    onClickBrowseIcon() {
        this.fileInputRef.el.click();
    }

    onIconFileChange(ev) {
        const file = ev.target.files[0];
        if (!file) return;
        if (file.size > 1 * 1024 * 1024) {
            this.state.errors.icon = _t("Icon must be smaller than 1 MB.");
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = e.target.result; // data:image/png;base64,...
            this.state.iconPreview = data;
            // Strip the data-URL prefix; server expects raw base64
            this.state.iconData = data.split(",")[1];
            this.state.removeIcon = false;
            this._clearError("icon");
        };
        reader.readAsDataURL(file);
    }

    onRemoveIcon() {
        this.state.iconPreview = null;
        this.state.iconData = null;
        this.state.removeIcon = true;
    }

    async onSave() {
        if (!this.isValid || this.state.saving) return;
        this.state.saving = true;
        this.state.errors = {};

        let iconPayload = undefined;
        if (this.state.iconData) {
            iconPayload = this.state.iconData;
        } else if (this.state.removeIcon) {
            iconPayload = false;
        }

        let result;
        if (this.isEdit) {
            result = await this.shortcutService.update({
                id: this.props.shortcut.id,
                name: this.state.name.trim(),
                url: this.state.url.trim(),
                new_tab: this.state.new_tab,
                icon: iconPayload,
            });
        } else {
            result = await this.shortcutService.create({
                name: this.state.name.trim(),
                url: this.state.url.trim(),
                new_tab: this.state.new_tab,
                icon: iconPayload,
            });
        }

        this.state.saving = false;
        if (result) {
            this.props.onSaved(result);
            this.props.close();
        }
    }

    onCancel() {
        this.props.close();
    }

    onDelete() {
        this.dialogService.add(ConfirmationDialog, {
            title: _t("Delete Shortcut"),
            body: _t("Delete this shortcut?"),
            confirm: async () => {
                await this.shortcutService.remove(this.props.shortcut.id);
                this.props.onSaved(null);
                this.props.close();
            },
        });
    }

    // ------------------------------------------------------------------
    _clearError(field) {
        if (this.state.errors[field]) {
            delete this.state.errors[field];
        }
    }
}
