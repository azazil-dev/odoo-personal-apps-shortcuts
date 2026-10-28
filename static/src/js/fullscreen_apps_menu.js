/** @odoo-module **/
// Part of NIITS Inovasi Teknologi. See LICENSE file for full copyright and licensing details.

import { Component, useState } from "@odoo/owl";
import { useService, useBus } from "@web/core/utils/hooks";
import { useHotkey } from "@web/core/hotkeys/hotkey_hook";
import { NavBar } from "@web/webclient/navbar/navbar";
import { ShortcutSection } from "./shortcut_section";
import { getAppIconUrl } from "./app_picker_dialog";

export class FullscreenAppsMenu extends Component {
    static template = "personal_apps_shortcuts.FullscreenAppsMenu";
    static components = { ShortcutSection };
    static props = {
        apps: { type: Array, optional: true },
        getMenuItemHref: { type: Function, optional: true },
        onNavBarDropdownItemSelection: { type: Function, optional: true },
    };

    setup() {
        super.setup();
        this.menuService = useService("menu");
        this.actionService = useService("action");

        this.state = useState({
            open: false,
            search: "",
        });

        // Close on action manager update or custom bus event
        useBus(this.env.bus, "ACTION_MANAGER:UI-UPDATED", () => {
            this.close();
        });
        useBus(this.env.bus, "APPS_MENU:CLOSE", () => {
            this.close();
        });

        // Keyboard hotkeys
        useHotkey("h", () => this.toggle());
        useHotkey("Escape", () => this.close());
    }

    get apps() {
        return this.props.apps || this.menuService.getApps();
    }

    get filteredApps() {
        const query = this.state.search.trim().toLowerCase();
        if (!query) {
            return this.apps;
        }
        return this.apps.filter((app) =>
            (app.name || "").toLowerCase().includes(query)
        );
    }

    getAppIconUrl(app) {
        return getAppIconUrl(app);
    }

    getAppHref(app) {
        if (this.props.getMenuItemHref) {
            return this.props.getMenuItemHref(app);
        }
        const parts = [`menu_id=${app.id}`];
        if (app.actionID) {
            parts.push(`action=${app.actionID}`);
        }
        return "#" + parts.join("&");
    }

    toggle() {
        if (this.state.open) {
            this.close();
        } else {
            this.open();
        }
    }

    open() {
        this.state.open = true;
        this.state.search = "";
        document.body.classList.add("o_pas_apps_menu_opened");
        setTimeout(() => {
            const input = document.querySelector(".o_pas_search_input");
            if (input) {
                input.focus();
            }
        }, 50);
    }

    close() {
        if (this.state.open) {
            this.state.open = false;
            this.state.search = "";
            document.body.classList.remove("o_pas_apps_menu_opened");
        }
    }

    onAppClick(app, ev) {
        this.close();
        if (this.props.onNavBarDropdownItemSelection) {
            this.props.onNavBarDropdownItemSelection(app);
        } else {
            this.menuService.selectMenu(app);
        }
    }

    onSearchInput(ev) {
        this.state.search = ev.target.value;
    }

    clearSearch() {
        this.state.search = "";
        const input = document.querySelector(".o_pas_search_input");
        if (input) {
            input.focus();
        }
    }

    onSearchKeydown(ev) {
        if (ev.key === "Enter" && this.filteredApps.length === 1) {
            ev.preventDefault();
            this.onAppClick(this.filteredApps[0], ev);
        } else if (ev.key === "Escape") {
            ev.preventDefault();
            this.close();
        }
    }
}

// Patch NavBar components to register FullscreenAppsMenu
Object.assign(NavBar.components, { FullscreenAppsMenu });

