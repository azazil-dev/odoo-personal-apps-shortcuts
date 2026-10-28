/** @odoo-module **/
// Part of NIITS Inovasi Teknologi. See LICENSE file for full copyright and licensing details.

import { Component, useState } from "@odoo/owl";
import { Dialog } from "@web/core/dialog/dialog";
import { _t } from "@web/core/l10n/translation";
import { useService } from "@web/core/utils/hooks";
import { ShortcutDialog } from "./shortcut_dialog";

/**
 * Helper to compute an app's icon source.
 */
export function getAppIconUrl(app) {
    if (app.webIconData) {
        const iconData = app.webIconData;
        if (iconData.startsWith("data:image")) {
            return iconData;
        }
        const prefix = iconData.startsWith("P")
            ? "data:image/svg+xml;base64,"
            : "data:image/png;base64,";
        return prefix + iconData.replace(/\s/g, "");
    }
    if (app.webIcon && app.webIcon.split(",").length === 2) {
        const path = app.webIcon.replace(",", "/");
        return path.startsWith("/") ? path : "/" + path;
    }
    return "/web/static/img/default_icon_app.png";
}

/**
 * AppPickerDialog
 * ---------------
 * Modal dialog that allows users to instantly pick an installed Odoo app
 * to create a shortcut without having to type URLs or upload icons manually.
 */
export class AppPickerDialog extends Component {
    static template = "personal_apps_shortcuts.AppPickerDialog";
    static components = { Dialog };
    static props = {
        close: { type: Function },
        onSelected: { type: Function, optional: true },
    };

    setup() {
        this.menuService = useService("menu");
        this.shortcutService = useService("shortcut_service");
        this.dialogService = useService("dialog");
        this.notification = useService("notification");

        const allApps = this.menuService.getApps() || [];
        // Map installed apps with icon url and formatted target url
        this.apps = allApps.map((app) => ({
            ...app,
            iconUrl: getAppIconUrl(app),
            targetUrl: `#menu_id=${app.id}${app.actionID ? `&action=${app.actionID}` : ""}`,
        }));

        this.state = useState({
            searchQuery: "",
            submittingAppId: null,
        });
    }

    get filteredApps() {
        const q = this.state.searchQuery.trim().toLowerCase();
        if (!q) {
            return this.apps;
        }
        return this.apps.filter((app) => app.name.toLowerCase().includes(q));
    }

    onSearchInput(ev) {
        this.state.searchQuery = ev.target.value;
    }

    async onSelectApp(app) {
        if (this.state.submittingAppId) return;
        this.state.submittingAppId = app.id;

        try {
            // Check if already in shortcuts
            const existing = this.shortcutService.shortcuts.find(
                (s) => s.url === app.targetUrl || s.name === app.name
            );
            if (existing) {
                this.notification.add(
                    _t("'%s' is already in your shortcuts.", app.name),
                    { type: "warning" }
                );
                this.state.submittingAppId = null;
                return;
            }

            // Create shortcut directly with app name and URL, and attach icon if available
            let iconData = null;
            if (app.webIconData && !app.webIconData.startsWith("data:")) {
                iconData = app.webIconData.replace(/\s/g, "");
            }

            await this.shortcutService.create({
                name: app.name,
                url: app.targetUrl,
                new_tab: false,
                icon: iconData,
            });

            this.notification.add(
                _t("Added '%s' to personal shortcuts.", app.name),
                { type: "success" }
            );

            if (this.props.onSelected) {
                this.props.onSelected(app);
            }
            this.props.close();
        } catch (err) {
            this.notification.add(_t("Could not add shortcut: ") + err.message, {
                type: "danger",
            });
        } finally {
            this.state.submittingAppId = null;
        }
    }

    onOpenCustomDialog() {
        this.props.close();
        this.dialogService.add(ShortcutDialog, {
            shortcut: null,
            onSaved: () => {},
        });
    }
}

