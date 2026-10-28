/** @odoo-module **/
// Part of NIITS Inovasi Teknologi. See LICENSE file for full copyright and licensing details.

import { registry } from "@web/core/registry";
import { reactive } from "@odoo/owl";

/**
 * ShortcutService
 * ---------------
 * Loads the current user's shortcuts once per session, exposes a reactive
 * list, and provides create / update / remove / reorder helpers.
 *
 * Other components read `shortcutService.shortcuts` (a reactive array) and
 * call the action methods; the service keeps the local state in sync without
 * requiring a full page reload.
 */
class ShortcutService {
    /**
     * @param {object} env
     * @param {object} rpc  – the `rpc` service
     * @param {object} notification – the `notification` service
     */
    constructor(env, { rpc, notification }) {
        this.env = env;
        this.rpc = rpc;
        this.notification = notification;

        /** @type {Array<{id, name, url, new_tab, icon_url, sequence}>} */
        this.shortcuts = reactive([]);
        this._loaded = false;
    }

    /** Load shortcuts from the server (called once at start). */
    async load() {
        if (this._loaded) return;
        try {
            const data = await this.rpc("/personal_apps_shortcuts/list", {});
            this.shortcuts.length = 0;
            this.shortcuts.push(...(data || []));
            this._loaded = true;
        } catch (e) {
            console.error("[personal_apps_shortcuts] Failed to load shortcuts", e);
        }
    }

    /** Create a new shortcut and add it to the local list. */
    async create({ name, url, new_tab = false, icon = null }) {
        const result = await this.rpc("/personal_apps_shortcuts/create", {
            name,
            url,
            new_tab,
            icon,
        });
        if (result.error) {
            this.notification.add(result.error, { type: "danger" });
            return null;
        }
        this.shortcuts.push(result);
        return result;
    }

    /** Update an existing shortcut in place. */
    async update({ id, name, url, new_tab, icon }) {
        const result = await this.rpc("/personal_apps_shortcuts/write", {
            shortcut_id: id,
            name,
            url,
            new_tab,
            icon,
        });
        if (result.error) {
            this.notification.add(result.error, { type: "danger" });
            return null;
        }
        const idx = this.shortcuts.findIndex((s) => s.id === id);
        if (idx !== -1) Object.assign(this.shortcuts[idx], result);
        return result;
    }

    /** Delete a shortcut. */
    async remove(id) {
        const result = await this.rpc("/personal_apps_shortcuts/delete", {
            shortcut_id: id,
        });
        if (result.error) {
            this.notification.add(result.error, { type: "danger" });
            return false;
        }
        const idx = this.shortcuts.findIndex((s) => s.id === id);
        if (idx !== -1) this.shortcuts.splice(idx, 1);
        return true;
    }

    /** Persist a new display order (array of IDs). */
    async reorder(ids) {
        const result = await this.rpc("/personal_apps_shortcuts/reorder", { ids });
        if (result && result.error) {
            this.notification.add(result.error, { type: "warning" });
        }
        // Update local sequences optimistically
        ids.forEach((id, idx) => {
            const item = this.shortcuts.find((s) => s.id === id);
            if (item) item.sequence = idx + 1;
        });
        this.shortcuts.sort((a, b) => a.sequence - b.sequence);
    }
}

// Register as a lazy service so it is available to all backend components
registry.category("services").add("shortcut_service", {
    dependencies: ["rpc", "notification"],
    start(env, deps) {
        const service = new ShortcutService(env, deps);
        service.load(); // fire-and-forget; reactive list updates asynchronously
        return service;
    },
});
