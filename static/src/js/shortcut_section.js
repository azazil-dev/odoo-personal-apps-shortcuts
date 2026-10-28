/** @odoo-module **/
// Part of NIITS Inovasi Teknologi. See LICENSE file for full copyright and licensing details.

import { Component, useState, useRef, useEffect } from "@odoo/owl";
import { useService } from "@web/core/utils/hooks";
import { AppPickerDialog } from "./app_picker_dialog";
import { ShortcutDialog } from "./shortcut_dialog";

/**
 * ShortcutSection
 * ----------------
 * Renders personal shortcut tiles with drag-and-drop support (native HTML5 DnD),
 * and provides a "+" tile that opens the AppPickerDialog for instant 1-click app selection.
 */
export class ShortcutSection extends Component {
    static template = "personal_apps_shortcuts.ShortcutSection";
    static props = {};

    setup() {
        this.shortcutService = useState(useService("shortcut_service"));
        this.dialogService = useService("dialog");
        this.actionService = useService("action");

        this.state = useState({
            editMode: false,
            dragOverId: null,
            draggingId: null,
        });

        this.longPressTimer = null;
        this.containerRef = useRef("container");
    }

    get shortcuts() {
        return this.shortcutService.shortcuts;
    }

    get minimalMode() {
        try {
            return this.env.services?.user?.settings?.pas_minimal_mode || false;
        } catch (_) {
            return false;
        }
    }

    get hasShortcuts() {
        return this.shortcuts.length > 0;
    }

    get showSection() {
        return this.hasShortcuts || !this.minimalMode;
    }

    get showDivider() {
        return this.hasShortcuts;
    }

    tileColor(name) {
        const PALETTE = [
            "#E57373", "#F06292", "#BA68C8", "#7986CB",
            "#4FC3F7", "#4DB6AC", "#81C784", "#FFD54F",
            "#FF8A65", "#A1887F",
        ];
        let hash = 0;
        for (let i = 0; i < (name || "").length; i++) {
            hash = (hash * 31 + name.charCodeAt(i)) & 0xffffffff;
        }
        return PALETTE[Math.abs(hash) % PALETTE.length];
    }

    // ------------------------------------------------------------------
    // Modal Openers
    // ------------------------------------------------------------------
    openPicker() {
        this.dialogService.add(AppPickerDialog, {
            onSelected: () => {},
        });
    }

    openEditDialog(shortcut) {
        this.dialogService.add(ShortcutDialog, {
            shortcut,
            onSaved: () => {},
        });
    }

    toggleEditMode() {
        this.state.editMode = !this.state.editMode;
    }

    async removeShortcut(scId) {
        await this.shortcutService.remove(scId);
    }

    // ------------------------------------------------------------------
    // Drag and Drop
    // ------------------------------------------------------------------
    onDragStart(ev, id) {
        this.state.draggingId = id;
        ev.dataTransfer.effectAllowed = "move";
        ev.dataTransfer.setData("text/plain", String(id));
    }

    onDragOver(ev, id) {
        ev.preventDefault();
        ev.dataTransfer.dropEffect = "move";
        if (this.state.dragOverId !== id) {
            this.state.dragOverId = id;
        }
    }

    onDragLeave() {
        this.state.dragOverId = null;
    }

    onDrop(ev, targetId) {
        ev.preventDefault();
        const sourceId = this.state.draggingId;
        if (sourceId === null || sourceId === targetId) {
            this.state.dragOverId = null;
            this.state.draggingId = null;
            return;
        }

        const items = [...this.shortcuts];
        const fromIdx = items.findIndex((s) => s.id === sourceId);
        const toIdx = items.findIndex((s) => s.id === targetId);
        if (fromIdx === -1 || toIdx === -1) return;

        const [moved] = items.splice(fromIdx, 1);
        items.splice(toIdx, 0, moved);
        const newIds = items.map((s) => s.id);

        items.forEach((item, idx) => {
            item.sequence = idx + 1;
        });
        this.shortcuts.splice(0, this.shortcuts.length, ...items);

        this.shortcutService.reorder(newIds);
        this.state.dragOverId = null;
        this.state.draggingId = null;
    }

    onDragEnd() {
        this.state.dragOverId = null;
        this.state.draggingId = null;
    }

    // ------------------------------------------------------------------
    // Touch Events
    // ------------------------------------------------------------------
    onTouchStart() {
        this.longPressTimer = setTimeout(() => {
            this.state.editMode = true;
        }, 500);
    }

    onTouchEnd() {
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }
    }

    // ------------------------------------------------------------------
    // Navigation Handling
    // ------------------------------------------------------------------
    onTileClick(ev, shortcut) {
        if (this.state.editMode) {
            ev.preventDefault();
            ev.stopPropagation();
            return;
        }

        if (shortcut.new_tab) {
            ev.preventDefault();
            window.open(shortcut.url, "_blank", "noopener,noreferrer");
            return;
        }

        // Close fullscreen menu if open
        this.env.bus.trigger("APPS_MENU:CLOSE");

        // Internal hash route
        if (shortcut.url.startsWith("#")) {
            ev.preventDefault();
            const params = new URLSearchParams(shortcut.url.slice(1));
            const actionId = params.get("action");
            const menuId = params.get("menu_id");
            if (actionId) {
                this.actionService.doAction(actionId, { clearBreadcrumbs: true });
            } else if (menuId && this.env.services.menu) {
                this.env.services.menu.selectMenu(Number(menuId));
            }
        }
    }
}
