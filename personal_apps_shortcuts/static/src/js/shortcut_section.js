/** @odoo-module **/
// Part of NIITS Inovasi Teknologi. See LICENSE file for full copyright and licensing details.

import { Component, useState, useRef, useEffect, onMounted } from "@odoo/owl";
import { _t } from "@web/core/l10n/translation";
import { useService } from "@web/core/utils/hooks";
import { ShortcutDialog } from "./shortcut_dialog";

/**
 * ShortcutSection
 * ----------------
 * Renders the personal shortcut tiles above the native app grid / dropdown.
 * Handles edit mode, drag-and-drop reorder (desktop), and long-press (touch).
 *
 * Props:
 *  - gridClass  (string)  CSS class to match native tile grid (EE only)
 *  - mode       (string)  'ee' | 'ce'
 */
export class ShortcutSection extends Component {
    static template = "personal_apps_shortcuts.ShortcutSection";
    static props = {
        gridClass: { type: String, optional: true, default: "" },
        mode: { type: String, optional: true, default: "ce" },
    };

    setup() {
        this.shortcutService = useService("shortcut_service");
        this.dialogService = useService("dialog");
        this.uiService = useService("ui");

        this.state = useState({
            editMode: false,
            dragOverId: null,
            draggingId: null,
        });

        this.longPressTimer = null;
        this.containerRef = useRef("container");
    }

    // ------------------------------------------------------------------
    // Computed
    // ------------------------------------------------------------------
    get shortcuts() {
        return this.shortcutService.shortcuts;
    }

    get minimalMode() {
        return this.env.services.user?.settings?.pas_minimal_mode || false;
    }

    get hasShortcuts() {
        return this.shortcuts.length > 0;
    }

    get showSection() {
        // Show if there are shortcuts OR if we can add one (not minimal mode)
        return this.hasShortcuts || !this.minimalMode;
    }

    get showDivider() {
        return this.hasShortcuts;
    }

    // ------------------------------------------------------------------
    // Fallback tile color from name hash
    // ------------------------------------------------------------------
    tileColor(name) {
        const PALETTE = [
            "#E57373", "#F06292", "#BA68C8", "#7986CB",
            "#4FC3F7", "#4DB6AC", "#81C784", "#FFD54F",
            "#FF8A65", "#A1887F",
        ];
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = (hash * 31 + name.charCodeAt(i)) & 0xffffffff;
        }
        return PALETTE[Math.abs(hash) % PALETTE.length];
    }

    // ------------------------------------------------------------------
    // Dialog helpers
    // ------------------------------------------------------------------
    openAddDialog() {
        this.dialogService.add(ShortcutDialog, {
            shortcut: null,
            onSaved: () => {},
        });
    }

    openEditDialog(shortcut) {
        this.dialogService.add(ShortcutDialog, {
            shortcut,
            onSaved: () => {},
        });
    }

    // ------------------------------------------------------------------
    // Edit mode
    // ------------------------------------------------------------------
    toggleEditMode() {
        this.state.editMode = !this.state.editMode;
    }

    exitEditMode() {
        this.state.editMode = false;
    }

    // ------------------------------------------------------------------
    // Drag and Drop (desktop)
    // ------------------------------------------------------------------
    onDragStart(ev, id) {
        this.state.draggingId = id;
        ev.dataTransfer.effectAllowed = "move";
        ev.dataTransfer.setData("text/plain", String(id));
    }

    onDragOver(ev, id) {
        ev.preventDefault();
        ev.dataTransfer.dropEffect = "move";
        this.state.dragOverId = id;
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
        // Reorder local array
        const items = [...this.shortcuts];
        const fromIdx = items.findIndex((s) => s.id === sourceId);
        const toIdx = items.findIndex((s) => s.id === targetId);
        if (fromIdx === -1 || toIdx === -1) return;

        const [moved] = items.splice(fromIdx, 1);
        items.splice(toIdx, 0, moved);
        const newIds = items.map((s) => s.id);

        // Optimistic update
        items.forEach((item, idx) => { item.sequence = idx + 1; });
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
    // Long press (touch)
    // ------------------------------------------------------------------
    onTouchStart(ev) {
        this.longPressTimer = setTimeout(() => {
            this.state.editMode = true;
        }, 600);
    }

    onTouchEnd() {
        clearTimeout(this.longPressTimer);
        this.longPressTimer = null;
    }

    // ------------------------------------------------------------------
    // Tile click (navigate, skip in edit mode)
    // ------------------------------------------------------------------
    onTileClick(ev, shortcut) {
        if (this.state.editMode) {
            ev.preventDefault();
            ev.stopPropagation();
            return;
        }
        // External URLs open in new tab if flagged
        if (shortcut.new_tab) {
            ev.preventDefault();
            window.open(shortcut.url, "_blank", "noopener,noreferrer");
        }
        // Internal URLs: let the browser / Odoo router handle naturally
    }
}
